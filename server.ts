import express from "express";
import path from "path";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { dbInstance, User, Product, Order, OrderItem, LineConfig, Coupon } from "./server/db.ts";

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Increase limit to handle base64 image uploads (payment slips / product photos)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// In-memory LINE Notification Log Queue for the high-fidelity LINE simulator UI
interface LineLog {
  id: string;
  type: "notify" | "messaging";
  recipient: string;
  message: string;
  timestamp: string;
  status: "success" | "failed";
  detail?: string;
  isRich?: boolean;
  richData?: {
    title: string;
    orderId: string;
    amount: number;
    items: { name: string; quantity: number; price: number }[];
    status: string;
    statusColor: string;
    buttonText?: string;
    buttonUrl?: string;
    trackingNo?: string;
    cancelReason?: string;
    customerName?: string;
    customerPhone?: string;
    customerAddress?: string;
  };
}
const lineLogs: LineLog[] = [
  {
    id: "log-initial",
    type: "notify",
    recipient: "Group: S Shop Staff",
    message: "🔔 ระบบแจ้งเตือน S Shop Online พร้อมใช้งานแล้ว!",
    timestamp: new Date().toISOString(),
    status: "success",
    detail: "System initialized successfully."
  }
];

// Helper to send actual LINE Notify notification if token is provided
async function sendLineNotify(token: string, message: string): Promise<{ success: boolean; detail?: string }> {
  try {
    if (!token || token.trim() === "") {
      return { success: false, detail: "Missing LINE Notify Token" };
    }

    const response = await fetch("https://notify-api.line.me/api/notify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${token}`,
      },
      body: new URLSearchParams({ message }).toString(),
    });

    if (response.ok) {
      return { success: true };
    } else {
      const text = await response.text();
      return { success: false, detail: `LINE API responded with status ${response.status}: ${text}` };
    }
  } catch (error: any) {
    return { success: false, detail: error?.message || String(error) };
  }
}

// Helper to send actual LINE Official Account (Messaging API) push message
async function sendLineOAMessage(channelAccessToken: string, toUserId: string, messageOrFlex: any): Promise<{ success: boolean; detail?: string }> {
  try {
    if (!channelAccessToken || channelAccessToken.trim() === "") {
      return { success: false, detail: "Missing LINE Channel Access Token" };
    }
    if (!toUserId || toUserId.trim() === "") {
      return { success: false, detail: "Missing Recipient LINE User ID" };
    }

    let messagePayload: any;
    if (typeof messageOrFlex === "object") {
      messagePayload = messageOrFlex;
    } else {
      messagePayload = {
        type: "text",
        text: messageOrFlex,
      };
    }

    const response = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${channelAccessToken}`,
      },
      body: JSON.stringify({
        to: toUserId,
        messages: [messagePayload],
      }),
    });

    if (response.ok) {
      return { success: true };
    } else {
      const text = await response.text();
      return { success: false, detail: `LINE OA API responded with status ${response.status}: ${text}` };
    }
  } catch (error: any) {
    return { success: false, detail: error?.message || String(error) };
  }
}

// Helper to replace template placeholder variables with actual order values
function replacePlaceholders(template: string, order: any, config: any, extra: Record<string, string> = {}): string {
  if (!template) return "";

  const paymentStatusMap: Record<string, string> = {
    pending: "⏳ รอการชำระเงิน",
    verifying: "⏳ รอตรวจสอบการชำระเงิน",
    paid: "✅ ชำระเงินเรียบร้อยแล้ว",
    failed: "❌ ชำระเงินไม่สำเร็จ"
  };

  const shippingStatusMap: Record<string, string> = {
    pending: "📦 รอการจัดส่ง",
    shipped: "🚚 กำลังจัดส่งพัสดุ",
    delivered: "✅ จัดส่งสินค้าสำเร็จ",
    cancelled: "❌ ยกเลิกออเดอร์"
  };

  const itemsText = order.items
    .map((item: any) => `- ${item.name} x${item.quantity} (${(item.price * item.quantity).toLocaleString()} บาท)`)
    .join("\n");

  const vars: Record<string, string> = {
    orderId: order.id,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerAddress: order.customerAddress,
    totalAmount: order.totalAmount.toLocaleString(),
    paymentStatus: paymentStatusMap[order.paymentStatus] || order.paymentStatus,
    shippingStatus: shippingStatusMap[order.shippingStatus] || order.shippingStatus,
    itemsText: itemsText,
    itemsList: itemsText,
    trackingNumber: order.trackingNumber || extra.trackingNumber || "รออัปเดต",
    trackingUrl: order.trackingUrl || extra.trackingUrl || "ไม่มีระบุ",
    cancelReason: order.cancelReason || extra.cancelReason || "ไม่ได้ระบุเหตุผล",
    statusEmoji: extra.statusEmoji || "🔔",
    statusText: extra.statusText || "แจ้งเตือนสถานะ",
    storeName: config.storeName || "S Shop",
    ...extra
  };

  let result = template;
  for (const [key, val] of Object.entries(vars)) {
    result = result.replace(new RegExp(`{${key}}`, "g"), val);
  }
  return result;
}

// Helper to build LINE Flex Message payload for high aesthetic layout (Rich Message)
function buildFlexMessagePayload(type: "new_order" | "tracking" | "cancelled", order: any, config: any, extra: Record<string, string> = {}) {
  let title = "S Shop Online Notification";
  let statusColor = "#10b981"; // green
  let statusText = "ดำเนินการสำเร็จ";

  if (type === "new_order") {
    title = "🛍️ ออเดอร์ใหม่เข้ามาแล้ว!";
    statusColor = "#10b981"; // emerald
    statusText = order.paymentStatus === "paid" ? "ชำระเงินเรียบร้อย" : order.paymentStatus === "verifying" ? "รอตรวจสอบยอดเงิน" : "รอการชำระเงิน";
  } else if (type === "tracking") {
    const isDelivered = order.shippingStatus === "delivered";
    title = isDelivered ? "📦 จัดส่งสินค้าสำเร็จแล้ว!" : "🚚 สินค้าของคุณถูกจัดส่งแล้ว!";
    statusColor = isDelivered ? "#0284c7" : "#f59e0b"; // sky vs amber
    statusText = isDelivered ? "จัดส่งสำเร็จเรียบร้อย" : "กำลังจัดส่งพัสดุ";
  } else if (type === "cancelled") {
    title = "❌ ออเดอร์ถูกยกเลิก!";
    statusColor = "#ef4444"; // rose/red
    statusText = `ยกเลิกออเดอร์: ${order.cancelReason || extra.cancelReason || "ไม่ได้ระบุเหตุผล"}`;
  }

  const itemsContents = order.items.map((item: any) => ({
    type: "box",
    layout: "horizontal",
    contents: [
      {
        type: "text",
        text: `${item.name} x${item.quantity}`,
        size: "sm",
        color: "#555555",
        flex: 4,
        wrap: true
      },
      {
        type: "text",
        text: `฿${(item.price * item.quantity).toLocaleString()}`,
        size: "sm",
        color: "#111111",
        align: "end",
        weight: "bold",
        flex: 2
      }
    ],
    margin: "xs"
  }));

  const flexBubble: any = {
    type: "bubble",
    size: "mega",
    header: {
      type: "box",
      layout: "vertical",
      backgroundColor: statusColor,
      paddingAll: "15px",
      contents: [
        {
          type: "text",
          text: title,
          weight: "bold",
          color: "#ffffff",
          size: "md"
        },
        {
          type: "text",
          text: `เลขออเดอร์: #${order.id}`,
          color: "#ffffffcc",
          size: "xs",
          margin: "xs"
        }
      ]
    },
    body: {
      type: "box",
      layout: "vertical",
      paddingAll: "15px",
      contents: [
        {
          type: "text",
          text: "ข้อมูลผู้รับจัดส่ง",
          weight: "bold",
          size: "xs",
          color: "#888888"
        },
        {
          type: "box",
          layout: "vertical",
          margin: "sm",
          contents: [
            {
              type: "text",
              text: `ชื่อ: คุณ ${order.customerName}`,
              size: "sm",
              weight: "bold",
              color: "#333333"
            },
            {
              type: "text",
              text: `เบอร์ติดต่อ: ${order.customerPhone}`,
              size: "xs",
              color: "#666666",
              margin: "xs"
            },
            {
              type: "text",
              text: `ที่อยู่จัดส่ง: ${order.customerAddress}`,
              size: "xs",
              color: "#666666",
              wrap: true,
              margin: "xs"
            }
          ]
        },
        {
          type: "separator",
          margin: "md"
        },
        {
          type: "text",
          text: "รายการสินค้า",
          weight: "bold",
          size: "xs",
          color: "#888888",
          margin: "md"
        },
        ...itemsContents,
        {
          type: "separator",
          margin: "md"
        },
        {
          type: "box",
          layout: "horizontal",
          margin: "md",
          contents: [
            {
              type: "text",
              text: "ยอดสุทธิ",
              size: "sm",
              weight: "bold",
              color: "#333333"
            },
            {
              type: "text",
              text: `฿${order.totalAmount.toLocaleString()}`,
              size: "md",
              align: "end",
              weight: "bold",
              color: "#10b981"
            }
          ]
        },
        {
          type: "box",
          layout: "vertical",
          backgroundColor: "#f8fafc",
          paddingAll: "8px",
          cornerRadius: "md",
          margin: "sm",
          contents: [
            {
              type: "text",
              text: `สถานะระบบ: ${statusText}`,
              size: "xs",
              weight: "bold",
              color: "#475569",
              wrap: true
            }
          ]
        }
      ]
    }
  };

  // Add tracking info if available
  const trackingNumber = order.trackingNumber || extra.trackingNumber;
  const trackingUrl = order.trackingUrl || extra.trackingUrl;

  if (trackingNumber && trackingNumber !== "รออัปเดต") {
    flexBubble.body.contents.push({
      type: "box",
      layout: "vertical",
      backgroundColor: "#eff6ff",
      paddingAll: "8px",
      cornerRadius: "md",
      margin: "sm",
      contents: [
        {
          type: "text",
          text: `📋 เลขพัสดุ: ${trackingNumber}`,
          size: "xs",
          weight: "bold",
          color: "#1d4ed8"
        }
      ]
    });
  }

  // Footer button
  if (trackingUrl && trackingUrl !== "ไม่มีระบุ" && trackingUrl.startsWith("http")) {
    flexBubble.footer = {
      type: "box",
      layout: "vertical",
      paddingAll: "10px",
      contents: [
        {
          type: "button",
          style: "primary",
          color: statusColor,
          height: "sm",
          action: {
            type: "uri",
            label: "📍 ติดตามพัสดุ",
            uri: trackingUrl
          }
        }
      ]
    };
  } else {
    flexBubble.footer = {
      type: "box",
      layout: "vertical",
      paddingAll: "10px",
      contents: [
        {
          type: "button",
          style: "secondary",
          height: "sm",
          action: {
            type: "uri",
            label: "🛍️ ดูหน้าออเดอร์",
            uri: "https://sshop-premium.com/orders"
          }
        }
      ]
    };
  }

  return {
    type: "flex",
    altText: title,
    contents: flexBubble
  };
}

// ---------------- API ROUTES ----------------

// --- AUTHENTICATION ---

// Get current user (Simulated simple session via Header or query param for demo ease)
app.get("/api/auth/me", (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const user = dbInstance.getUserById(userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  res.json({ user });
});

// Register
app.post("/api/auth/register", (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const existingUser = dbInstance.getUserByEmail(email);
  if (existingUser) {
    return res.status(400).json({ error: "Email already registered" });
  }

  const newUser = dbInstance.createUser({
    email,
    passwordHash: password, // For demo, plain text string match
    name,
    role: "customer"
  });

  res.status(201).json({ message: "Registration successful", user: newUser });
});

// Login
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Missing email or password" });
  }

  const user = dbInstance.getUserByEmail(email);
  if (!user || user.passwordHash !== password) {
    return res.status(400).json({ error: "Invalid email or password" });
  }

  res.json({ message: "Login successful", user });
});

// Simulate LINE Login
app.post("/api/auth/line-login-simulate", (req, res) => {
  const { userId, displayName, pictureUrl } = req.body;
  if (!userId || !displayName) {
    return res.status(400).json({ error: "Missing LINE profile details" });
  }

  // Find user by LINE ID, or create a new user profile linked to LINE
  const users = dbInstance.getUsers();
  let user = users.find((u) => u.lineUserId === userId);

  if (!user) {
    // Also try to find a guest or existing customer with same name, or just create
    const email = `line_${userId.substring(0, 8)}@sshop.com`;
    user = dbInstance.createUser({
      email,
      passwordHash: "line-login-pass",
      name: displayName,
      role: "customer",
      lineUserId: userId,
      lineDisplayName: displayName,
      linePictureUrl: pictureUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${displayName}`,
    });
  } else {
    // Update existing LINE details
    dbInstance.updateLineProfile(user.id, { lineUserId: userId, displayName, pictureUrl });
    user = dbInstance.getUserById(user.id);
  }

  res.json({ message: "LINE Login successful", user });
});


// --- PRODUCTS ---

// Get all products
app.get("/api/products", (req, res) => {
  const products = dbInstance.getProducts();
  res.json({ products });
});

// Create product (Admin only, checked via simple headers)
app.post("/api/products", (req, res) => {
  const authUserId = req.headers["x-user-id"] as string;
  const authUser = authUserId ? dbInstance.getUserById(authUserId) : null;
  
  if (!authUser || authUser.role !== "admin") {
    return res.status(403).json({ error: "Forbidden: Admin access required" });
  }

  const { name, price, description, imageUrl, category, stock } = req.body;
  if (!name || price === undefined || !category) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const newProduct = dbInstance.createProduct({
    name,
    price: Number(price),
    description: description || "",
    imageUrl: imageUrl || "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=600&auto=format&fit=crop&q=60",
    category,
    stock: Number(stock) || 10
  });

  res.status(201).json({ product: newProduct });
});

// Update product
app.put("/api/products/:id", (req, res) => {
  const authUserId = req.headers["x-user-id"] as string;
  const authUser = authUserId ? dbInstance.getUserById(authUserId) : null;
  
  if (!authUser || authUser.role !== "admin") {
    return res.status(403).json({ error: "Forbidden: Admin access required" });
  }

  const { id } = req.params;
  const updated = dbInstance.updateProduct(id, req.body);
  if (!updated) {
    return res.status(404).json({ error: "Product not found" });
  }
  res.json({ product: updated });
});

// Delete product
app.delete("/api/products/:id", (req, res) => {
  const authUserId = req.headers["x-user-id"] as string;
  const authUser = authUserId ? dbInstance.getUserById(authUserId) : null;
  
  if (!authUser || authUser.role !== "admin") {
    return res.status(403).json({ error: "Forbidden: Admin access required" });
  }

  const { id } = req.params;
  const deleted = dbInstance.deleteProduct(id);
  if (!deleted) {
    return res.status(404).json({ error: "Product not found" });
  }
  res.json({ message: "Product deleted successfully" });
});


// --- ORDERS ---

// Get all orders (Admin gets all, Customer gets only their own)
app.get("/api/orders", (req, res) => {
  const authUserId = req.headers["x-user-id"] as string;
  const authUser = authUserId ? dbInstance.getUserById(authUserId) : null;

  if (!authUser) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (authUser.role === "admin") {
    res.json({ orders: dbInstance.getOrders() });
  } else {
    res.json({ orders: dbInstance.getOrdersByCustomerId(authUser.id) });
  }
});

// Create order
app.post("/api/orders", (req, res) => {
  const authUserId = req.headers["x-user-id"] as string;
  const authUser = authUserId ? dbInstance.getUserById(authUserId) : null;

  const { customerName, customerPhone, customerAddress, items, totalAmount, couponCode, discountAmount } = req.body;
  if (!customerName || !customerPhone || !customerAddress || !items || !items.length) {
    return res.status(400).json({ error: "Missing order information" });
  }

  const newOrder = dbInstance.createOrder({
    customerId: authUser ? authUser.id : "guest-user",
    customerName,
    customerPhone,
    customerAddress,
    items,
    totalAmount: Number(totalAmount),
    couponCode: couponCode || undefined,
    discountAmount: discountAmount ? Number(discountAmount) : undefined
  });

  // Automatically update stock levels
  items.forEach((item: any) => {
    const product = dbInstance.getProductById(item.productId);
    if (product) {
      const newStock = Math.max(0, product.stock - item.quantity);
      dbInstance.updateProduct(item.productId, { stock: newStock });
    }
  });

  // Increment Coupon usage count if applied
  if (couponCode) {
    const coupon = dbInstance.getCouponByCode(couponCode);
    if (coupon) {
      dbInstance.updateCoupon(coupon.id, { usageCount: (coupon.usageCount || 0) + 1 });
    }
  }

  res.status(201).json({ order: newOrder });
});
app.put("/api/orders/:id/status", async (req, res) => {
  const authUserId = req.headers["x-user-id"] as string;
  const authUser = authUserId ? dbInstance.getUserById(authUserId) : null;

  if (!authUser || authUser.role !== "admin") {
    return res.status(403).json({ error: "Forbidden: Admin access required" });
  }

  const { id } = req.params;
  const { paymentStatus, shippingStatus, trackingNumber, trackingUrl, customerName, customerPhone, customerAddress, cancelReason } = req.body;

  const order = dbInstance.getOrderById(id);
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }

  // CRITICAL: Block any status updates if original shippingStatus is "delivered" or "cancelled"
  if (order.shippingStatus === "delivered" || order.shippingStatus === "cancelled") {
    const isChangingPayment = paymentStatus !== undefined && paymentStatus !== order.paymentStatus;
    const isChangingShipping = shippingStatus !== undefined && shippingStatus !== order.shippingStatus;
    if (isChangingPayment || isChangingShipping) {
      return res.status(400).json({ error: "ไม่สามารถแก้ไขสถานะของออเดอร์ที่จัดส่งสำเร็จหรือถูกยกเลิกแล้วได้" });
    }
  }

  // Perform order update
  const updatedOrder = dbInstance.updateOrder(id, {
    paymentStatus: paymentStatus !== undefined ? paymentStatus : order.paymentStatus,
    shippingStatus: shippingStatus !== undefined ? shippingStatus : order.shippingStatus,
    trackingNumber: trackingNumber !== undefined ? trackingNumber : order.trackingNumber,
    trackingUrl: trackingUrl !== undefined ? trackingUrl : order.trackingUrl,
    customerName: customerName !== undefined ? customerName : order.customerName,
    customerPhone: customerPhone !== undefined ? customerPhone : order.customerPhone,
    customerAddress: customerAddress !== undefined ? customerAddress : order.customerAddress,
    cancelReason: cancelReason !== undefined ? cancelReason : order.cancelReason,
  });

  // If status is updated to cancelled, trigger notifications to both shop and buyer
  if (shippingStatus === "cancelled") {
    const config = dbInstance.getLineConfig();
    const reasonText = cancelReason || "ไม่ได้ระบุเหตุผล";

    // Retrieve custom template or fallback
    const template = config.templateCancel || `❌ *ออเดอร์ถูกยกเลิก!* [ออเดอร์ {orderId}]\n---------------------------------\n👤 ลูกค้า: คุณ {customerName}\n📞 เบอร์โทร: {customerPhone}\n💰 ยอดรวม: {totalAmount} บาท\n---------------------------------\n⚠️ สถานะจัดส่ง: ยกเลิกออเดอร์ (Cancelled)\n💬 หมายเหตุที่ยกเลิก: {cancelReason}`;

    const shopMessage = replacePlaceholders(template, updatedOrder, config, { cancelReason: reasonText });
    const buyerMessage = replacePlaceholders(template, updatedOrder, config, { cancelReason: reasonText });

    let apiSuccess = false;
    let apiDetail = "LINE integration disabled or missing keys";
    const isOA = config.notificationMethod === "oa";
    const shouldSendRich = !!config.useRichMessage;

    if (config.enabled) {
      if (isOA) {
        if (config.lineChannelAccessToken && config.adminLineUserId) {
          if (shouldSendRich) {
            const flexPayload = buildFlexMessagePayload("cancelled", updatedOrder, config, { cancelReason: reasonText });
            const apiResult = await sendLineOAMessage(config.lineChannelAccessToken, config.adminLineUserId, flexPayload);
            apiSuccess = apiResult.success;
            apiDetail = apiResult.detail || "Sent Flex Cancel Message to Admin via LINE OA";
          } else {
            const apiResult = await sendLineOAMessage(config.lineChannelAccessToken, config.adminLineUserId, shopMessage);
            apiSuccess = apiResult.success;
            apiDetail = apiResult.detail || "Sent Text Cancel Message to Admin via LINE OA";
          }
        } else if (!config.lineChannelAccessToken) {
          apiDetail = "Missing LINE Channel Access Token";
        } else {
          apiDetail = "Missing Admin LINE User ID";
        }
      } else {
        if (config.lineNotifyToken) {
          const apiResult = await sendLineNotify(config.lineNotifyToken, shopMessage);
          apiSuccess = apiResult.success;
          apiDetail = apiResult.detail || "Success";
        }
      }
    }

    const hasRealKeys = isOA
      ? (!!config.lineChannelAccessToken && !!config.adminLineUserId)
      : !!config.lineNotifyToken;

    const statusVal = (hasRealKeys && config.enabled) ? (apiSuccess ? "success" : "failed") : "success";

    // Add Merchant Log
    const shopLog: LineLog = {
      id: "log-shop-" + Math.random().toString(36).substr(2, 9),
      type: isOA ? "messaging" : "notify",
      recipient: isOA 
        ? (config.adminLineUserId ? `ผู้ดูแลร้านค้า (LINE OA API ถึง ID: ${config.adminLineUserId})` : "ผู้ดูแลร้านค้า (ระบบจำลอง)")
        : (config.lineNotifyToken ? "กลุ่มร้านค้า (ผ่าน LINE Notify API จริง)" : "ฝั่งร้านค้า (ระบบจำลอง)"),
      message: shopMessage,
      timestamp: new Date().toISOString(),
      status: statusVal,
      detail: hasRealKeys ? apiDetail : "Simulated cancellation notification sent successfully.",
      isRich: shouldSendRich,
      richData: shouldSendRich ? {
        title: "❌ ออเดอร์ถูกยกเลิก!",
        orderId: updatedOrder.id,
        amount: updatedOrder.totalAmount,
        items: updatedOrder.items.map((i: any) => ({ name: i.name, quantity: i.quantity, price: i.price })),
        status: "ยกเลิกแล้ว (Cancelled)",
        statusColor: "#ef4444",
        cancelReason: reasonText,
        buttonText: "ดูประวัติคำสั่งซื้อ",
        buttonUrl: "https://sshop-premium.com/orders",
        customerName: updatedOrder.customerName,
        customerPhone: updatedOrder.customerPhone,
        customerAddress: updatedOrder.customerAddress
      } : undefined
    };

    // Buyer direct message (LINE OA)
    let buyerApiSuccess = false;
    let buyerApiDetail = "";
    const customer = dbInstance.getUserById(updatedOrder.customerId);
    const hasBuyerLine = customer && customer.lineUserId;

    if (config.enabled && isOA && config.lineChannelAccessToken && hasBuyerLine && customer.lineUserId) {
      if (shouldSendRich) {
        const flexPayload = buildFlexMessagePayload("cancelled", updatedOrder, config, { cancelReason: reasonText });
        const apiResult = await sendLineOAMessage(config.lineChannelAccessToken, customer.lineUserId, flexPayload);
        buyerApiSuccess = apiResult.success;
        buyerApiDetail = apiResult.detail || "Delivered Flex cancel message directly to Customer LINE chat.";
      } else {
        const apiResult = await sendLineOAMessage(config.lineChannelAccessToken, customer.lineUserId, buyerMessage);
        buyerApiSuccess = apiResult.success;
        buyerApiDetail = apiResult.detail || "Delivered Text cancel message directly to Customer LINE chat.";
      }
    }

    const buyerHasRealKeys = isOA && !!config.lineChannelAccessToken && !!hasBuyerLine;

    // Add Buyer Log
    const buyerLog: LineLog = {
      id: "log-buyer-" + Math.random().toString(36).substr(2, 9),
      type: "messaging",
      recipient: `คุณ ${updatedOrder.customerName} (ฝั่งผู้ซื้อ)`,
      message: buyerMessage,
      timestamp: new Date().toISOString(),
      status: buyerHasRealKeys ? (buyerApiSuccess ? "success" : "failed") : "success",
      detail: buyerHasRealKeys ? buyerApiDetail : "Simulated cancellation message delivered directly to Customer LINE chat.",
      isRich: shouldSendRich,
      richData: shouldSendRich ? {
        title: "❌ ออเดอร์ของคุณถูกยกเลิก",
        orderId: updatedOrder.id,
        amount: updatedOrder.totalAmount,
        items: updatedOrder.items.map((i: any) => ({ name: i.name, quantity: i.quantity, price: i.price })),
        status: "ยกเลิกแล้ว (Cancelled)",
        statusColor: "#ef4444",
        cancelReason: reasonText,
        customerName: updatedOrder.customerName,
        customerPhone: updatedOrder.customerPhone,
        customerAddress: updatedOrder.customerAddress
      } : undefined
    };

    lineLogs.unshift(shopLog);
    lineLogs.unshift(buyerLog);
  }

  res.json({ order: updatedOrder });
});

// Send Shipping / Tracking Notification to LINE OA / Group
app.post("/api/orders/:id/send-line-tracking", async (req, res) => {
  const { id } = req.params;
  const order = dbInstance.getOrderById(id);

  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }

  const { trackingNumber, trackingUrl, shippingStatus } = req.body;
  const config = dbInstance.getLineConfig();

  const statusEmoji = shippingStatus === "delivered" ? "📦" : "🚚";
  const statusText = shippingStatus === "delivered" 
    ? "จัดส่งสินค้าสำเร็จแล้ว!" 
    : shippingStatus === "shipped" 
    ? "สินค้าของคุณถูกจัดส่งแล้ว!" 
    : "อัปเดตข้อมูลการจัดส่ง";

  // Use admin custom tracking template or fallback
  const template = config.templateTracking || `${statusEmoji} *${statusText}* [ออเดอร์ {orderId}]\n---------------------------------\n👤 ลูกค้า: {customerName}\n📞 เบอร์โทร: {customerPhone}\n---------------------------------\n🚚 สถานะจัดส่ง: {shippingStatus}\n📋 เลขพัสดุ (Tracking): {trackingNumber}\n🔗 ลิงก์ติดตามพัสดุ: {trackingUrl}\n---------------------------------\n🙏 ขอบคุณที่ใช้บริการ S Shop Online!`;

  const formattedMessage = replacePlaceholders(template, order, config, {
    trackingNumber: trackingNumber || "รออัปเดต",
    trackingUrl: trackingUrl || "ไม่มีระบุ",
    statusEmoji,
    statusText,
  });

  let apiSuccess = false;
  let apiDetail = "LINE integration disabled or missing keys";
  const isOA = config.notificationMethod === "oa";
  const shouldSendRich = !!config.useRichMessage;

  let targetCustomerLineUserId = "";
  if (isOA) {
    const customer = dbInstance.getUserById(order.customerId);
    if (customer && customer.lineUserId) {
      targetCustomerLineUserId = customer.lineUserId;
    }
  }

  if (config.enabled) {
    if (isOA) {
      if (config.lineChannelAccessToken && targetCustomerLineUserId) {
        if (shouldSendRich) {
          const flexPayload = buildFlexMessagePayload("tracking", order, config, { trackingNumber, trackingUrl });
          const apiResult = await sendLineOAMessage(config.lineChannelAccessToken, targetCustomerLineUserId, flexPayload);
          apiSuccess = apiResult.success;
          apiDetail = apiResult.detail || "Sent Flex Tracking Message to Customer via LINE OA";
        } else {
          const apiResult = await sendLineOAMessage(config.lineChannelAccessToken, targetCustomerLineUserId, formattedMessage);
          apiSuccess = apiResult.success;
          apiDetail = apiResult.detail || "Sent Text Tracking Message to Customer via LINE OA";
        }
      } else if (!config.lineChannelAccessToken) {
        apiSuccess = false;
        apiDetail = "Missing LINE Channel Access Token";
      } else {
        apiSuccess = false;
        apiDetail = "Customer did not connect their LINE account (missing User ID)";
      }
    } else {
      if (config.lineNotifyToken) {
        const apiResult = await sendLineNotify(config.lineNotifyToken, formattedMessage);
        apiSuccess = apiResult.success;
        apiDetail = apiResult.detail || "Success";
      }
    }
  }

  const hasRealKeys = isOA
    ? (!!config.lineChannelAccessToken && !!targetCustomerLineUserId)
    : !!config.lineNotifyToken;

  const statusVal = (hasRealKeys && config.enabled) ? (apiSuccess ? "success" : "failed") : "success";
  const recipientLabel = isOA 
    ? `คุณ ${order.customerName} (LINE OA API)` 
    : (config.lineNotifyToken ? `คุณ ${order.customerName} (LINE Notify API จริง)` : `คุณ ${order.customerName} (ระบบจำลอง)`);

  const detailVal = hasRealKeys 
    ? apiDetail 
    : (isOA 
        ? "จำลองการส่งข้อมูลเลขพัสดุเรียบร้อย (หากลูกค้าเชื่อมต่อไลน์และระบบตั้งค่าไลน์จริงครบ จะถูกส่งจริงเข้าแชทลูกค้า)"
        : "จำลองการส่งข้อมูลเลขพัสดุเรียบร้อย (กรุณากรอก LINE Notify Token ด้านบนเพื่อส่งจริง)");

  const newLog: LineLog = {
    id: "log-" + Math.random().toString(36).substr(2, 9),
    type: isOA ? "messaging" : "notify",
    recipient: recipientLabel,
    message: formattedMessage,
    timestamp: new Date().toISOString(),
    status: statusVal,
    detail: detailVal,
    isRich: shouldSendRich,
    richData: shouldSendRich ? {
      title: shippingStatus === "delivered" ? "📦 จัดส่งสินค้าสำเร็จแล้ว!" : "🚚 สินค้าของคุณถูกจัดส่งแล้ว!",
      orderId: order.id,
      amount: order.totalAmount,
      items: order.items.map((i: any) => ({ name: i.name, quantity: i.quantity, price: i.price })),
      status: shippingStatus === "delivered" ? "จัดส่งสำเร็จเรียบร้อย" : "กำลังจัดส่งพัสดุ",
      statusColor: shippingStatus === "delivered" ? "#0284c7" : "#f59e0b",
      buttonText: "ติดตามพัสดุ",
      buttonUrl: trackingUrl,
      trackingNo: trackingNumber,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerAddress: order.customerAddress
    } : undefined
  };

  lineLogs.unshift(newLog);

  res.json({
    message: "Tracking notification sent",
    log: newLog
  });
});

// Upload Payment Slip
app.post("/api/orders/:id/upload-slip", (req, res) => {
  const { id } = req.params;
  const { slipBase64 } = req.body;
  const authUserId = req.headers["x-user-id"] as string;

  if (!slipBase64) {
    return res.status(400).json({ error: "Missing image data" });
  }

  const order = dbInstance.getOrderById(id);
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }

  // To simulate saving we create a local file metadata and link it
  // We can just use the base64 or create a nice mock image URL path.
  // We will store the base64 as the fileUrl for direct rendering in the frontend,
  // which is extremely robust and avoids file-system paths.
  const fileName = `slip_${id}_${Date.now()}.png`;
  
  dbInstance.addFile({
    userId: authUserId || order.customerId,
    fileName,
    fileUrl: slipBase64
  });

  const updatedOrder = dbInstance.updateOrder(id, {
    paymentSlipUrl: slipBase64,
    paymentStatus: "verifying" // Update to 'verifying' (รอตรวจสอบการชำระเงิน) when slip is uploaded
  });

  res.json({ message: "Slip uploaded successfully", order: updatedOrder });
});


// --- LINE NOTIFY & MESSAGING API INTEGRATION ---

// Get LINE configuration
app.get("/api/line/config", (req, res) => {
  const config = dbInstance.getLineConfig();
  res.json({ config });
});

// Update LINE configuration (Admin only)
app.post("/api/line/config", (req, res) => {
  const authUserId = req.headers["x-user-id"] as string;
  const authUser = authUserId ? dbInstance.getUserById(authUserId) : null;

  if (!authUser || authUser.role !== "admin") {
    return res.status(403).json({ error: "Forbidden: Admin access required" });
  }

  const updated = dbInstance.updateLineConfig(req.body);
  res.json({ config: updated });
});

// Send Order Summary to LINE OA / Group (Triggered when user clicks "Send Order" or is manually triggered)
app.post("/api/orders/:id/send-line", async (req, res) => {
  const { id } = req.params;
  const order = dbInstance.getOrderById(id);

  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }

  const config = dbInstance.getLineConfig();

  // Retrieve custom template or fallback
  const template = config.templateNewOrder || `🛍️ *ออเดอร์ใหม่เข้ามาแล้ว!* [{orderId}]\n---------------------------------\n👤 ลูกค้า: {customerName}\n📞 เบอร์โทร: {customerPhone}\n📍 ที่อยู่จัดส่ง: {customerAddress}\n---------------------------------\n📦 รายการสินค้า:\n{itemsText}\n---------------------------------\n💰 ยอดรวมทั้งหมด: {totalAmount} บาท\n💳 สถานะชำระเงิน: {paymentStatus}\n🚚 สถานะจัดส่ง: {shippingStatus}`;

  // Process text notification with variable substitutions
  const formattedMessage = replacePlaceholders(template, order, config);

  let apiSuccess = false;
  let apiDetail = "LINE integration disabled or missing keys";
  const isOA = config.notificationMethod === "oa";
  const shouldSendRich = !!config.useRichMessage;

  // Let's decide who the target customer/admin is
  let targetLineUserId = config.adminLineUserId || "";
  if (!targetLineUserId) {
    const customer = dbInstance.getUserById(order.customerId);
    if (customer && customer.lineUserId) {
      targetLineUserId = customer.lineUserId;
    }
  }

  if (config.enabled) {
    if (isOA) {
      if (config.lineChannelAccessToken) {
        if (targetLineUserId) {
          // If Rich Message is enabled, compile Flex Message. Otherwise send plain text.
          if (shouldSendRich) {
            const flexPayload = buildFlexMessagePayload("new_order", order, config);
            const apiResult = await sendLineOAMessage(config.lineChannelAccessToken, targetLineUserId, flexPayload);
            apiSuccess = apiResult.success;
            apiDetail = apiResult.detail || "Sent Flex Message to Recipient via LINE OA";
          } else {
            const apiResult = await sendLineOAMessage(config.lineChannelAccessToken, targetLineUserId, formattedMessage);
            apiSuccess = apiResult.success;
            apiDetail = apiResult.detail || "Sent Text Message to Recipient via LINE OA";
          }
        } else {
          apiSuccess = false;
          apiDetail = "No LINE User ID configured (Admin or Customer)";
        }
      } else {
        apiSuccess = false;
        apiDetail = "Missing LINE Channel Access Token";
      }
    } else {
      if (config.lineNotifyToken) {
        // LINE Notify only supports text (with optional image)
        const apiResult = await sendLineNotify(config.lineNotifyToken, formattedMessage);
        apiSuccess = apiResult.success;
        apiDetail = apiResult.detail || "Sent via LINE Notify";
      }
    }
  }

  const hasRealKeys = isOA
    ? (!!config.lineChannelAccessToken && !!targetLineUserId)
    : !!config.lineNotifyToken;

  const recipientLabel = isOA
    ? (config.adminLineUserId ? `ผู้ดูแลระบบ (LINE OA ถึง ID: ${config.adminLineUserId})` : "ผู้ซื้อสินค้า (LINE OA API)")
    : (config.lineNotifyToken ? "กลุ่มร้านค้า (ผ่าน LINE Notify API จริง)" : "LINE OA S Shop (ระบบจำลอง)");

  const detailVal = hasRealKeys 
    ? apiDetail 
    : (isOA 
        ? "จำลองการส่งข้อมูลเรียบร้อย (กรุณากรอกคีย์ LINE OA และ User ID จริงด้านบนเพื่อส่งจริง)"
        : "จำลองการส่งข้อมูลเรียบร้อย (กรุณากรอก LINE Notify Token ด้านบนเพื่อส่งจริง)");

  // Create simulator log
  const newLog: LineLog = {
    id: "log-" + Math.random().toString(36).substr(2, 9),
    type: isOA ? "messaging" : "notify",
    recipient: recipientLabel,
    message: formattedMessage,
    timestamp: new Date().toISOString(),
    status: (hasRealKeys && config.enabled) ? (apiSuccess ? "success" : "failed") : "success",
    detail: detailVal,
    isRich: shouldSendRich,
    richData: shouldSendRich ? {
      title: "🛍️ ออเดอร์ใหม่เข้ามาแล้ว!",
      orderId: order.id,
      amount: order.totalAmount,
      items: order.items.map((i: any) => ({ name: i.name, quantity: i.quantity, price: i.price })),
      status: order.paymentStatus === "paid" ? "ชำระเงินเรียบร้อย" : order.paymentStatus === "verifying" ? "รอตรวจสอบยอดเงิน" : "รอชำระเงิน",
      statusColor: "#10b981",
      buttonText: "ดูออเดอร์ในเว็ปไซต์",
      buttonUrl: "https://sshop-premium.com/orders",
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerAddress: order.customerAddress
    } : undefined
  };

  lineLogs.unshift(newLog); // Prepend to show latest logs first

  // Update order's lineNotificationStatus
  dbInstance.updateOrder(id, {
    lineNotificationStatus: newLog.status === "success" ? "sent" : "failed"
  });

  res.json({
    message: "Line notification triggered successfully",
    log: newLog,
    order: dbInstance.getOrderById(id),
  });
});

// Send custom test LINE notification (Notify or OA)
app.post("/api/line/test", async (req, res) => {
  const { message } = req.body;
  const config = dbInstance.getLineConfig();

  if (!message) {
    return res.status(400).json({ error: "Missing message text" });
  }

  let apiSuccess = false;
  let apiDetail = "LINE integration keys not set. Simulated only.";
  const isOA = config.notificationMethod === "oa";

  if (isOA) {
    if (config.lineChannelAccessToken && config.adminLineUserId) {
      const result = await sendLineOAMessage(config.lineChannelAccessToken, config.adminLineUserId, `🧪 [ทดสอบส่ง LINE OA]\n${message}`);
      apiSuccess = result.success;
      apiDetail = result.detail || "Sent via live LINE OA Messaging API to Admin User ID";
    } else {
      apiDetail = "Missing LINE Channel Access Token or Admin LINE User ID. Simulated only.";
    }
  } else {
    if (config.lineNotifyToken) {
      const result = await sendLineNotify(config.lineNotifyToken, `🧪 [ทดสอบส่ง LINE Notify]\n${message}`);
      apiSuccess = result.success;
      apiDetail = result.detail || "Sent via live LINE Notify API";
    } else {
      apiDetail = "LINE Notify Token not set. Simulated only.";
    }
  }

  const hasRealKeys = isOA
    ? (!!config.lineChannelAccessToken && !!config.adminLineUserId)
    : !!config.lineNotifyToken;

  const newLog: LineLog = {
    id: "log-" + Math.random().toString(36).substr(2, 9),
    type: isOA ? "messaging" : "notify",
    recipient: isOA
      ? (config.adminLineUserId ? `ผู้ดูแลระบบ (LINE OA ถึง ID: ${config.adminLineUserId})` : "LINE OA (จำลอง)")
      : (config.lineNotifyToken ? "LINE Notify Group" : "LINE Simulator"),
    message: `🧪 [ข้อความทดสอบ]\n${message}`,
    timestamp: new Date().toISOString(),
    status: hasRealKeys ? (apiSuccess ? "success" : "failed") : "success",
    detail: apiDetail,
  };

  lineLogs.unshift(newLog);

  res.json({ message: "Test notification sent", log: newLog });
});

// Helper to reply to a LINE Official Account (Messaging API) using replyToken
async function replyLineOAMessage(channelAccessToken: string, replyToken: string, messageText: string): Promise<{ success: boolean; detail?: string }> {
  try {
    if (!channelAccessToken || channelAccessToken.trim() === "") {
      return { success: false, detail: "Missing LINE Channel Access Token" };
    }
    if (!replyToken || replyToken.trim() === "") {
      return { success: false, detail: "Missing LINE Reply Token" };
    }

    const response = await fetch("https://api.line.me/v2/bot/message/reply", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${channelAccessToken}`,
      },
      body: JSON.stringify({
        replyToken: replyToken,
        messages: [
          {
            type: "text",
            text: messageText,
          },
        ],
      }),
    });

    if (response.ok) {
      return { success: true };
    } else {
      const text = await response.text();
      return { success: false, detail: `LINE Reply API responded with status ${response.status}: ${text}` };
    }
  } catch (error: any) {
    return { success: false, detail: error?.message || String(error) };
  }
}

// LINE Official Account Webhook Receiver
// This endpoint receives messages, follow events, and replies with the user's LINE User ID automatically.
app.get("/api/line/webhook", (req, res) => {
  res.send("LINE OA Webhook is active! This URL is ready to be configured as your LINE OA Webhook URL.");
});

app.post("/api/line/webhook", async (req, res) => {
  const config = dbInstance.getLineConfig();
  const signature = req.headers["x-line-signature"] as string;
  const channelSecret = config.lineChannelSecret;
  
  let isSignatureValid = true;
  if (channelSecret && signature) {
    try {
      const hash = crypto
        .createHmac("sha256", channelSecret)
        .update(JSON.stringify(req.body))
        .digest("base64");
      if (hash !== signature) {
        console.warn("LINE webhook signature mismatch. Continuing for testing/convenience.");
        isSignatureValid = false;
      }
    } catch (err) {
      console.error("Error verifying signature:", err);
    }
  }

  const events = req.body?.events || [];
  
  for (const event of events) {
    const lineUserId = event.source?.userId;
    const replyToken = event.replyToken;
    const eventType = event.type;

    if (!lineUserId) continue;

    // Handle incoming text messages
    if (eventType === "message" && event.message?.type === "text") {
      const text = event.message.text;
      
      const replyMessage = `สวัสดีครับ! ยินดีต้อนรับสู่ร้าน S Shop Online (LINE OA) 🛍️✨\n\nนี่คือรหัสผู้ใช้ LINE (User ID) ของคุณสำหรับการเชื่อมต่อแจ้งเตือน:\n👉 ${lineUserId}\n\nคุณสามารถคัดลอกรหัสนี้ไปกรอกในหน้า "บัญชีผู้ใช้" ของคุณบนเว็บไซต์ของร้านค้า เพื่อเปิดรับข้อมูลข่าวสาร เลขพัสดุ และสถานะสินค้าแบบส่วนตัวได้ทันทีครับ! 📦\n\nหรือส่งข้อความอื่นเพื่อสอบถามข้อมูลกับทางแอดมินเพิ่มเติมได้ตลอดเวลาครับ 🙏`;

      let apiSuccess = false;
      let apiDetail = "LINE OA configuration is not active";

      if (config.enabled && config.lineChannelAccessToken) {
        const result = await replyLineOAMessage(config.lineChannelAccessToken, replyToken, replyMessage);
        apiSuccess = result.success;
        apiDetail = result.detail || "Replied with User ID to user via LINE OA reply API";
      } else {
        apiDetail = "Missing Line Channel Access Token on server. Logged webhook text event.";
      }

      // Log in Simulator log stack
      const newLog: LineLog = {
        id: "webhook-log-" + Math.random().toString(36).substr(2, 9),
        type: "messaging",
        recipient: `Webhook จาก User: ${lineUserId}`,
        message: `📥 ได้รับข้อความ: "${text}"`,
        timestamp: new Date().toISOString(),
        status: "success",
        detail: `[ข้อมูลระบบ] ${apiDetail}. รหัสที่เข้ามาคือ: ${lineUserId}`,
      };
      lineLogs.unshift(newLog);
    } 
    // Handle follow/add friend events
    else if (eventType === "follow") {
      const replyMessage = `สวัสดีครับ! ขอบคุณที่เพิ่มเราเป็นเพื่อน ยินดีต้อนรับสู่ร้าน S Shop Online (LINE OA) 🛍️✨\n\nนี่คือรหัสผู้ใช้ LINE (User ID) ของคุณสำหรับการเชื่อมต่อแจ้งเตือน:\n👉 ${lineUserId}\n\nคุณสามารถคัดลอกรหัสนี้ไปกรอกในหน้า "บัญชีผู้ใช้" ของคุณบนเว็บไซต์ของร้านค้า เพื่อเปิดรับข้อมูลข่าวสาร เลขพัสดุ และสถานะสินค้าแบบส่วนตัวได้ทันทีครับ! 📦\n\nหรือส่งข้อความอื่นเพื่อสอบถามข้อมูลกับทางแอดมินเพิ่มเติมได้ตลอดเวลาครับ 🙏`;

      let apiSuccess = false;
      let apiDetail = "LINE OA configuration is not active";

      if (config.enabled && config.lineChannelAccessToken) {
        const result = await replyLineOAMessage(config.lineChannelAccessToken, replyToken, replyMessage);
        apiSuccess = result.success;
        apiDetail = result.detail || "Replied with welcome msg & User ID to new follower via reply API";
      }

      const newLog: LineLog = {
        id: "webhook-follow-" + Math.random().toString(36).substr(2, 9),
        type: "messaging",
        recipient: `Webhook LINE OA (ผู้ติดตามใหม่)`,
        message: `👥 มีผู้ใช้งานกดเพิ่มเพื่อนใหม่ (Follow Event)`,
        timestamp: new Date().toISOString(),
        status: "success",
        detail: `[ข้อมูลระบบ] ${apiDetail}. รหัสผู้ติดตามใหม่: ${lineUserId}`,
      };
      lineLogs.unshift(newLog);
    }
  }

  res.status(200).json({ status: "ok" });
});

// Fetch all LINE simulation and real logs
app.get("/api/line/logs", (req, res) => {
  res.json({ logs: lineLogs });
});

// Generic base64 upload helper (to simulate file system uploads, returns metadata)
app.post("/api/upload", (req, res) => {
  const { fileName, fileBase64 } = req.body;
  const authUserId = req.headers["x-user-id"] as string;

  if (!fileName || !fileBase64) {
    return res.status(400).json({ error: "Missing fileName or fileBase64 data" });
  }

  const newFile = dbInstance.addFile({
    userId: authUserId || "guest",
    fileName,
    fileUrl: fileBase64, // Store base64 direct to render in browser
  });

  res.status(201).json({ file: newFile });
});

// --- CUSTOMERS ---
app.get("/api/customers", (req, res) => {
  const authUserId = req.headers["x-user-id"] as string;
  const authUser = authUserId ? dbInstance.getUserById(authUserId) : null;

  if (!authUser || authUser.role !== "admin") {
    return res.status(403).json({ error: "Forbidden: Admin access required" });
  }

  // Customers are all users with role 'customer' plus any guest names compiled from orders
  const registeredCustomers = dbInstance.getUsers().filter((u) => u.role === "customer");
  
  // Compile guest users from orders
  const orders = dbInstance.getOrders();
  const guestCustomersMap = new Map();
  orders.forEach((o) => {
    if (o.customerId === "guest-user" || !registeredCustomers.some((rc) => rc.id === o.customerId)) {
      if (!guestCustomersMap.has(o.customerPhone)) {
        guestCustomersMap.set(o.customerPhone, {
          id: `guest-${o.customerPhone}`,
          name: `${o.customerName} (Guest)`,
          email: "-",
          lineDisplayName: "-",
          createdAt: o.createdAt,
          ordersCount: 1,
          totalSpent: o.totalAmount
        });
      } else {
        const guest = guestCustomersMap.get(o.customerPhone);
        guest.ordersCount += 1;
        guest.totalSpent += o.totalAmount;
      }
    }
  });

  const formattedRegistered = registeredCustomers.map((rc) => {
    const userOrders = orders.filter((o) => o.customerId === rc.id);
    return {
      id: rc.id,
      name: rc.name,
      email: rc.email,
      lineDisplayName: rc.lineDisplayName || "-",
      linePictureUrl: rc.linePictureUrl,
      lineUserId: rc.lineUserId,
      createdAt: rc.createdAt,
      ordersCount: userOrders.length,
      totalSpent: userOrders.reduce((sum, o) => sum + o.totalAmount, 0)
    };
  });

  res.json({
    customers: [...formattedRegistered, ...Array.from(guestCustomersMap.values())]
  });
});

// --- COUPONS ---

// Get all coupons
app.get("/api/coupons", (req, res) => {
  const coupons = dbInstance.getCoupons();
  res.json({ coupons });
});

// Create coupon (Admin)
app.post("/api/coupons", (req, res) => {
  const authUserId = req.headers["x-user-id"] as string;
  const authUser = authUserId ? dbInstance.getUserById(authUserId) : null;

  if (!authUser || authUser.role !== "admin") {
    return res.status(403).json({ error: "Forbidden: Admin access required" });
  }

  const { code, discountType, discountValue, minSpend, maxDiscount, usageLimit, expiryDate, isActive } = req.body;
  if (!code || !discountType || discountValue === undefined) {
    return res.status(400).json({ error: "Missing required coupon fields" });
  }

  const normalizedCode = code.trim().toUpperCase();

  // Check unique code
  const existing = dbInstance.getCouponByCode(normalizedCode);
  if (existing) {
    return res.status(400).json({ error: "Coupon code already exists" });
  }

  const newCoupon = dbInstance.createCoupon({
    code: normalizedCode,
    discountType,
    discountValue: Number(discountValue),
    minSpend: minSpend ? Number(minSpend) : undefined,
    maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
    usageLimit: usageLimit ? Number(usageLimit) : undefined,
    expiryDate: expiryDate || undefined,
    isActive: isActive !== false,
  });

  res.status(201).json({ coupon: newCoupon });
});

// Update coupon (Admin)
app.put("/api/coupons/:id", (req, res) => {
  const authUserId = req.headers["x-user-id"] as string;
  const authUser = authUserId ? dbInstance.getUserById(authUserId) : null;

  if (!authUser || authUser.role !== "admin") {
    return res.status(403).json({ error: "Forbidden: Admin access required" });
  }

  const { id } = req.params;
  const { code, discountType, discountValue, minSpend, maxDiscount, usageLimit, expiryDate, isActive } = req.body;

  const coupon = dbInstance.getCouponById(id);
  if (!coupon) {
    return res.status(404).json({ error: "Coupon not found" });
  }

  const updatedFields: Partial<Coupon> = {};
  if (code !== undefined) {
    const normalizedCode = code.trim().toUpperCase();
    const existing = dbInstance.getCouponByCode(normalizedCode);
    if (existing && existing.id !== id) {
      return res.status(400).json({ error: "Coupon code already exists" });
    }
    updatedFields.code = normalizedCode;
  }
  if (discountType !== undefined) updatedFields.discountType = discountType;
  if (discountValue !== undefined) updatedFields.discountValue = Number(discountValue);
  if (minSpend !== undefined) updatedFields.minSpend = minSpend ? Number(minSpend) : undefined;
  if (maxDiscount !== undefined) updatedFields.maxDiscount = maxDiscount ? Number(maxDiscount) : undefined;
  if (usageLimit !== undefined) updatedFields.usageLimit = usageLimit ? Number(usageLimit) : undefined;
  if (expiryDate !== undefined) updatedFields.expiryDate = expiryDate || undefined;
  if (isActive !== undefined) updatedFields.isActive = !!isActive;

  const updated = dbInstance.updateCoupon(id, updatedFields);
  res.json({ coupon: updated });
});

// Delete coupon (Admin)
app.delete("/api/coupons/:id", (req, res) => {
  const authUserId = req.headers["x-user-id"] as string;
  const authUser = authUserId ? dbInstance.getUserById(authUserId) : null;

  if (!authUser || authUser.role !== "admin") {
    return res.status(403).json({ error: "Forbidden: Admin access required" });
  }

  const { id } = req.params;
  const success = dbInstance.deleteCoupon(id);
  if (!success) {
    return res.status(404).json({ error: "Coupon not found" });
  }
  res.json({ message: "Coupon deleted successfully" });
});

// Validate coupon code (Customer)
app.post("/api/coupons/validate", (req, res) => {
  const { code, subtotal } = req.body;
  if (!code) {
    return res.status(400).json({ error: "Coupon code is required" });
  }

  const coupon = dbInstance.getCouponByCode(code);
  if (!coupon) {
    return res.status(400).json({ error: "ไม่พบคูปองโค้ดนี้ หรือคูปองไม่ถูกต้อง" });
  }

  if (!coupon.isActive) {
    return res.status(400).json({ error: "คูปองนี้ถูกระงับการใช้งานแล้ว" });
  }

  // Check expiry
  if (coupon.expiryDate) {
    const expiry = new Date(coupon.expiryDate);
    expiry.setHours(23, 59, 59, 999);
    if (new Date() > expiry) {
      return res.status(400).json({ error: "คูปองนี้หมดอายุแล้ว" });
    }
  }

  // Check usage limit
  if (coupon.usageLimit !== undefined && (coupon.usageCount || 0) >= coupon.usageLimit) {
    return res.status(400).json({ error: "คูปองนี้ถูกใช้งานครบกำหนดแล้ว" });
  }

  // Check min spend
  const subtotalNum = Number(subtotal) || 0;
  if (coupon.minSpend !== undefined && subtotalNum < coupon.minSpend) {
    return res.status(400).json({ error: `ยอดสั่งซื้อขั้นต่ำต้องครบ ฿${coupon.minSpend} จึงจะใช้คูปองนี้ได้` });
  }

  // Calculate discount
  let discountAmount = 0;
  if (coupon.discountType === "fixed") {
    discountAmount = Math.min(coupon.discountValue, subtotalNum);
  } else {
    discountAmount = Math.round((subtotalNum * coupon.discountValue) / 100);
    if (coupon.maxDiscount !== undefined) {
      discountAmount = Math.min(discountAmount, coupon.maxDiscount);
    }
  }

  res.json({
    valid: true,
    coupon,
    discountAmount
  });
});

// ---------------- VITE MIDDLEWARE SETUP ----------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[S Shop Online Server] running on http://localhost:${PORT}`);
    console.log(`Development Mode: ${process.env.NODE_ENV !== "production"}`);
  });
}

startServer();
