import React, { useState, useEffect } from "react";
import { Product, Order, CustomerSummary, Coupon } from "../types";
import { Shield, Plus, Edit, Trash2, CheckCircle, Package, Users, FileText, DollarSign, RefreshCw, Eye, EyeOff, Save, X, ExternalLink, Sliders, BarChart2, Calendar, TrendingUp, Printer, Ticket, Settings2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AdminViewProps {
  products: Product[];
  orders: Order[];
  onRefreshData: () => void;
  currentUser: { id: string; name: string } | null;
  onNavigateTab?: (tab: string) => void;
}

export default function AdminView({ products, orders, onRefreshData, currentUser, onNavigateTab }: AdminViewProps) {
  const [activeTab, setActiveTab] = useState<"orders" | "products" | "customers" | "files" | "sales" | "coupons">("orders");
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  // Sales report states
  const [salesPeriod, setSalesPeriod] = useState<"day" | "month" | "year">("month");
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    try {
      return new Date().toISOString().substring(0, 10);
    } catch {
      return "2026-06-25";
    }
  });
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    try {
      return new Date().toISOString().substring(0, 7);
    } catch {
      return "2026-06";
    }
  });
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    try {
      return new Date().getFullYear();
    } catch {
      return 2026;
    }
  });
  const [onlyPaidOrders, setOnlyPaidOrders] = useState<boolean>(true);

  // Form states for creating/editing products
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [prodName, setProdName] = useState("");
  const [prodPrice, setProdPrice] = useState("");
  const [prodDesc, setProdDesc] = useState("");
  const [prodImgUrl, setProdImgUrl] = useState("");
  const [prodCat, setProdCat] = useState<"promotion" | "bestseller" | "recommended" | "general">("general");
  const [prodStock, setProdStock] = useState("");
  const [submittingProduct, setSubmittingProduct] = useState(false);

  // Slip modal state
  const [activeSlipUrl, setActiveSlipUrl] = useState<string | null>(null);

  // Tracking modal states
  const [editingTrackingOrder, setEditingTrackingOrder] = useState<Order | null>(null);
  const [trackNumber, setTrackNumber] = useState("");
  const [trackUrl, setTrackUrl] = useState("");
  const [submittingTracking, setSubmittingTracking] = useState(false);

  // Customer edit modal states
  const [editingCustomerOrder, setEditingCustomerOrder] = useState<Order | null>(null);
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custAddress, setCustAddress] = useState("");
  const [submittingCustomer, setSubmittingCustomer] = useState(false);

  // Cancellation states
  const [cancellingOrder, setCancellingOrder] = useState<Order | null>(null);
  const [cancelReasonInput, setCancelReasonInput] = useState("");
  const [submittingCancellation, setSubmittingCancellation] = useState(false);

  // Create Order for Customer states
  const [selectedCustomerForOrder, setSelectedCustomerForOrder] = useState<CustomerSummary | null>(null);
  const [adminOrderItems, setAdminOrderItems] = useState<{ productId: string; quantity: number }[]>([]);
  const [adminCouponCode, setAdminCouponCode] = useState("");
  const [adminOrderError, setAdminOrderError] = useState<string | null>(null);
  const [submittingAdminOrder, setSubmittingAdminOrder] = useState(false);
  const [productSearch, setProductSearch] = useState("");

  // Validation and status filtering states
  const [validationError, setValidationError] = useState<string | null>(null);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<"all" | "pending" | "shipped" | "delivered" | "cancelled">("all");

  // Print shipping label modal states
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);

  // Coupon states
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  
  // Coupon form fields
  const [cpCode, setCpCode] = useState("");
  const [cpDiscountType, setCpDiscountType] = useState<"percent" | "fixed">("fixed");
  const [cpDiscountValue, setCpDiscountValue] = useState("");
  const [cpMinSpend, setCpMinSpend] = useState("");
  const [cpMaxDiscount, setCpMaxDiscount] = useState("");
  const [cpUsageLimit, setCpUsageLimit] = useState("");
  const [cpExpiryDate, setCpExpiryDate] = useState("");
  const [cpIsActive, setCpIsActive] = useState(true);
  const [submittingCoupon, setSubmittingCoupon] = useState(false);
  const [couponFormError, setCouponFormError] = useState<string | null>(null);

  const [isResetting, setIsResetting] = useState(false);

  const handleResetOrders = async () => {
    const confirmMessage = "คุณแน่ใจหรือไม่ที่จะรีเซ็ตคำสั่งซื้อและออเดอร์ทั้งหมดให้เป็น 0?\nการดำเนินการนี้จะลบออเดอร์และรูปภาพสลิปทั้งหมดในฐานข้อมูล (รวมถึง Firestore) และไม่สามารถกู้คืนได้";
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setIsResetting(true);
    try {
      const response = await fetch("/api/orders/reset", {
        method: "POST",
        headers: {
          "x-user-id": currentUser?.id || "",
        },
      });

      if (response.ok) {
        alert("รีเซ็ตคำสั่งซื้อและออเดอร์ทั้งหมดเป็น 0 เรียบร้อยแล้ว!");
        onRefreshData();
      } else {
        const errData = await response.json();
        alert(`เกิดข้อผิดพลาด: ${errData.error || "ไม่สามารถรีเซ็ตออเดอร์ได้"}`);
      }
    } catch (error) {
      console.error("Error resetting orders:", error);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์");
    } finally {
      setIsResetting(false);
    }
  };

  const fetchCoupons = async () => {
    setLoadingCoupons(true);
    try {
      const response = await fetch("/api/coupons");
      const data = await response.json();
      if (response.ok) {
        setCoupons(data.coupons || []);
      }
    } catch (err) {
      console.error("Error fetching coupons:", err);
    } finally {
      setLoadingCoupons(false);
    }
  };

  useEffect(() => {
    if (activeTab === "coupons") {
      fetchCoupons();
    }
  }, [activeTab]);

  const handleOpenCreateCoupon = () => {
    setEditingCoupon(null);
    setCpCode("");
    setCpDiscountType("fixed");
    setCpDiscountValue("");
    setCpMinSpend("");
    setCpMaxDiscount("");
    setCpUsageLimit("");
    setCpExpiryDate("");
    setCpIsActive(true);
    setCouponFormError(null);
    setShowCouponForm(true);
  };

  const handleOpenEditCoupon = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setCpCode(coupon.code);
    setCpDiscountType(coupon.discountType);
    setCpDiscountValue(String(coupon.discountValue));
    setCpMinSpend(coupon.minSpend !== undefined ? String(coupon.minSpend) : "");
    setCpMaxDiscount(coupon.maxDiscount !== undefined ? String(coupon.maxDiscount) : "");
    setCpUsageLimit(coupon.usageLimit !== undefined ? String(coupon.usageLimit) : "");
    setCpExpiryDate(coupon.expiryDate || "");
    setCpIsActive(coupon.isActive);
    setCouponFormError(null);
    setShowCouponForm(true);
  };

  const handleSaveCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cpCode.trim() || !cpDiscountValue) {
      setCouponFormError("กรุณากรอกข้อมูลโค้ดและมูลค่าส่วนลดให้ครบถ้วน");
      return;
    }

    setSubmittingCoupon(true);
    setCouponFormError(null);

    const payload = {
      code: cpCode.trim().toUpperCase(),
      discountType: cpDiscountType,
      discountValue: Number(cpDiscountValue),
      minSpend: cpMinSpend ? Number(cpMinSpend) : undefined,
      maxDiscount: cpMaxDiscount ? Number(cpMaxDiscount) : undefined,
      usageLimit: cpUsageLimit ? Number(cpUsageLimit) : undefined,
      expiryDate: cpExpiryDate || undefined,
      isActive: cpIsActive,
    };

    try {
      const url = editingCoupon ? `/api/coupons/${editingCoupon.id}` : "/api/coupons";
      const method = editingCoupon ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": currentUser?.id || "",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setCouponFormError(data.error || "ไม่สามารถบันทึกข้อมูลคูปองได้");
      } else {
        setShowCouponForm(false);
        fetchCoupons();
      }
    } catch (err) {
      console.error("Error saving coupon:", err);
      setCouponFormError("เกิดข้อผิดพลาดในการบันทึกข้อมูลคูปอง");
    } finally {
      setSubmittingCoupon(false);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm("คุณต้องการลบคูปองนี้ใช่หรือไม่?")) return;
    try {
      const res = await fetch(`/api/coupons/${id}`, {
        method: "DELETE",
        headers: {
          "X-User-Id": currentUser?.id || "",
        },
      });
      if (res.ok) {
        fetchCoupons();
      } else {
        const data = await res.json();
        alert(data.error || "เกิดข้อผิดพลาดในการลบคูปอง");
      }
    } catch (err) {
      console.error("Error deleting coupon:", err);
    }
  };

  const handleToggleCouponStatus = async (coupon: Coupon) => {
    try {
      const res = await fetch(`/api/coupons/${coupon.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": currentUser?.id || "",
        },
        body: JSON.stringify({ isActive: !coupon.isActive }),
      });
      if (res.ok) {
        fetchCoupons();
      }
    } catch (err) {
      console.error("Error toggling coupon status:", err);
    }
  };

  const [senderName, setSenderName] = useState(() => localStorage.getItem("sender_name") || "S Shop Online");
  const [senderPhone, setSenderPhone] = useState(() => localStorage.getItem("sender_phone") || "098-765-4321");
  const [senderAddress, setSenderAddress] = useState(() => localStorage.getItem("sender_address") || "123/45 ถนนวิภาวดีรังสิต แขวงตลาดบางเขน เขตหลักสี่ กรุงเทพมหานคร 10210");

  useEffect(() => {
    // Load storeName from LINE config if not set in localStorage
    const loadStoreConfig = async () => {
      try {
        const response = await fetch("/api/line/config");
        const data = await response.json();
        if (response.ok && data.config?.storeName) {
          if (!localStorage.getItem("sender_name")) {
            setSenderName(data.config.storeName);
          }
        }
      } catch (err) {
        console.error("Error loading config for printing:", err);
      }
    };
    loadStoreConfig();
  }, []);

  // Fetch Customers when tab changes
  useEffect(() => {
    if (activeTab === "customers") {
      fetchCustomers();
    }
  }, [activeTab]);

  const fetchCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const response = await fetch("/api/customers", {
        headers: { "X-User-Id": currentUser?.id || "" },
      });
      const data = await response.json();
      if (response.ok) {
        setCustomers(data.customers || []);
      }
    } catch (err) {
      console.error("Error loading customers registry:", err);
    } finally {
      setLoadingCustomers(false);
    }
  };

  // Status updaters
  const handleUpdateOrderStatus = async (orderId: string, statusType: "payment" | "shipping", newStatus: string) => {
    if (statusType === "shipping" && newStatus === "cancelled") {
      const order = orders.find((o) => o.id === orderId);
      if (order) {
        setCancellingOrder(order);
        setCancelReasonInput("");
        return;
      }
    }

    if (statusType === "shipping" && newStatus === "delivered") {
      const order = orders.find((o) => o.id === orderId);
      if (order && order.paymentStatus !== "paid") {
        setValidationError(`ไม่สามารถเปลี่ยนสถานะจัดส่งเป็น "จัดส่งสำเร็จ" ได้ เนื่องจากออเดอร์นี้ยังไม่ได้รับการชำระเงิน (ต้องมีสถานะการชำระเงินเป็น " Paid (ชำระแล้ว)" ก่อน)`);
        return;
      }
    }

    try {
      const bodyPayload = statusType === "payment" 
        ? { paymentStatus: newStatus } 
        : { shippingStatus: newStatus };

      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": currentUser?.id || "",
        },
        body: JSON.stringify(bodyPayload),
      });

      if (response.ok) {
        onRefreshData();
      }
    } catch (err) {
      console.error("Error updating order status:", err);
    }
  };

  const handleConfirmCancellation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingOrder) return;

    setSubmittingCancellation(true);
    try {
      const response = await fetch(`/api/orders/${cancellingOrder.id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": currentUser?.id || "",
        },
        body: JSON.stringify({
          shippingStatus: "cancelled",
          cancelReason: cancelReasonInput.trim() || "ยกเลิกโดยผู้ดูแลระบบ",
        }),
      });

      if (response.ok) {
        setCancellingOrder(null);
        setCancelReasonInput("");
        onRefreshData();
      }
    } catch (err) {
      console.error("Error confirming cancellation:", err);
    } finally {
      setSubmittingCancellation(false);
    }
  };

  const handleEditTrackingClick = (order: Order) => {
    setEditingTrackingOrder(order);
    setTrackNumber(order.trackingNumber || "");
    setTrackUrl(order.trackingUrl || "");
  };

  const handleSaveTracking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrackingOrder) return;

    setSubmittingTracking(true);
    try {
      // Auto transition to "shipped" if currently pending and they submit tracking details
      const newStatus = (editingTrackingOrder.shippingStatus === "pending" && trackNumber.trim())
        ? "shipped"
        : editingTrackingOrder.shippingStatus;

      const response = await fetch(`/api/orders/${editingTrackingOrder.id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": currentUser?.id || "",
        },
        body: JSON.stringify({
          shippingStatus: newStatus,
          trackingNumber: trackNumber,
          trackingUrl: trackUrl,
        }),
      });

      if (response.ok) {
        // Send a beautiful notification to the customer via the simulator and Notify API
        await fetch(`/api/orders/${editingTrackingOrder.id}/send-line-tracking`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-User-Id": currentUser?.id || "",
          },
          body: JSON.stringify({
            trackingNumber: trackNumber,
            trackingUrl: trackUrl,
            shippingStatus: newStatus,
          }),
        });

        setEditingTrackingOrder(null);
        setTrackNumber("");
        setTrackUrl("");
        onRefreshData();
      }
    } catch (err) {
      console.error("Error saving tracking information:", err);
    } finally {
      setSubmittingTracking(false);
    }
  };

  // Customer Edit CRUD Handlers
  const handleEditCustomerClick = (order: Order) => {
    setEditingCustomerOrder(order);
    setCustName(order.customerName);
    setCustPhone(order.customerPhone);
    setCustAddress(order.customerAddress);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomerOrder) return;

    setSubmittingCustomer(true);
    try {
      const response = await fetch(`/api/orders/${editingCustomerOrder.id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": currentUser?.id || "",
        },
        body: JSON.stringify({
          customerName: custName,
          customerPhone: custPhone,
          customerAddress: custAddress,
        }),
      });

      if (response.ok) {
        setEditingCustomerOrder(null);
        // If we're on the customers tab, we'll want to refresh the customers registry too
        if (activeTab === "customers") {
          fetchCustomers();
        }
        onRefreshData();
      }
    } catch (err) {
      console.error("Error saving customer information:", err);
    } finally {
      setSubmittingCustomer(false);
    }
  };

  // Create Order for Customer Handlers
  const handleOpenCreateOrder = (cust: CustomerSummary) => {
    setSelectedCustomerForOrder(cust);
    setAdminOrderItems([]);
    setAdminCouponCode("");
    setProductSearch("");
    setAdminOrderError(null);
    fetchCoupons();
  };

  const handleAdminUpdateQuantity = (productId: string, delta: number) => {
    setAdminOrderItems((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (!existing) {
         if (delta > 0) {
           return [...prev, { productId, quantity: 1 }];
         }
         return prev;
      }
      const newQty = existing.quantity + delta;
      if (newQty <= 0) {
        return prev.filter((i) => i.productId !== productId);
      }
      return prev.map((i) =>
        i.productId === productId ? { ...i, quantity: newQty } : i
      );
    });
  };

  const handleCreateOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerForOrder) return;
    if (adminOrderItems.length === 0) {
      setAdminOrderError("กรุณาเลือกอย่างน้อย 1 รายการสินค้า");
      return;
    }

    setSubmittingAdminOrder(true);
    setAdminOrderError(null);

    try {
      const itemsPayload = adminOrderItems.map((item) => {
        const prod = products.find((p) => p.id === item.productId);
        return {
          productId: item.productId,
          name: prod?.name || "สินค้า",
          price: prod?.price || 0,
          quantity: item.quantity,
        };
      });

      const subtotal = itemsPayload.reduce((sum, item) => sum + item.price * item.quantity, 0);

      let discount = 0;
      let appliedCouponCode = "";
      if (adminCouponCode.trim()) {
        const codeUpper = adminCouponCode.trim().toUpperCase();
        const cp = coupons.find((c) => c.code === codeUpper && c.isActive);
        if (cp) {
          appliedCouponCode = cp.code;
          if (cp.discountType === "percent") {
            discount = Math.floor((subtotal * cp.discountValue) / 100);
            if (cp.maxDiscount) {
              discount = Math.min(discount, cp.maxDiscount);
            }
          } else {
            discount = cp.discountValue;
          }
          discount = Math.min(discount, subtotal);
        }
      }

      const totalAmount = Math.max(0, subtotal - discount);

      const payload = {
        customerId: selectedCustomerForOrder.id,
        customerName: selectedCustomerForOrder.name || "ลูกค้าสมาชิก",
        customerPhone: "-",
        customerAddress: "กรุณากรอกรายละเอียดที่อยู่จัดส่งและชำระเงิน",
        items: itemsPayload,
        totalAmount,
        couponCode: appliedCouponCode || undefined,
        discountAmount: appliedCouponCode ? discount : undefined,
      };

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": currentUser?.id || "",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        setAdminOrderError(data.error || "เกิดข้อผิดพลาดในการสร้างออเดอร์");
      } else {
        // Notify the user via LINE instantly if possible!
        await fetch(`/api/orders/${data.order.id}/send-line`, { method: "POST" }).catch(() => {});

        setSelectedCustomerForOrder(null);
        setAdminOrderItems([]);
        setAdminCouponCode("");
        setProductSearch("");
        onRefreshData();
      }
    } catch (err) {
      console.error("Error creating customer order:", err);
      setAdminOrderError("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setSubmittingAdminOrder(false);
    }
  };

  // Print Shipping Label Handlers
  const handlePrintLabelClick = (order: Order) => {
    setPrintingOrder(order);
  };

  const handlePrint = () => {
    localStorage.setItem("sender_name", senderName);
    localStorage.setItem("sender_phone", senderPhone);
    localStorage.setItem("sender_address", senderAddress);
    window.print();
  };

  // Product CRUD
  const handleEditProductClick = (product: Product) => {
    setEditingProduct(product);
    setProdName(product.name);
    setProdPrice(product.price.toString());
    setProdDesc(product.description);
    setProdImgUrl(product.imageUrl);
    setProdCat(product.category);
    setProdStock(product.stock.toString());
    setShowProductForm(true);
  };

  const handleAddNewProductClick = () => {
    setEditingProduct(null);
    setProdName("");
    setProdPrice("");
    setProdDesc("");
    setProdImgUrl("");
    setProdCat("general");
    setProdStock("10");
    setShowProductForm(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim() || !prodPrice || !prodStock) return;

    setSubmittingProduct(true);
    try {
      const method = editingProduct ? "PUT" : "POST";
      const url = editingProduct ? `/api/products/${editingProduct.id}` : "/api/products";
      
      const payload = {
        name: prodName,
        price: Number(prodPrice),
        description: prodDesc,
        imageUrl: prodImgUrl || undefined,
        category: prodCat,
        stock: Number(prodStock),
      };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": currentUser?.id || "",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setShowProductForm(false);
        setEditingProduct(null);
        onRefreshData();
      }
    } catch (err) {
      console.error("Error saving product:", err);
    } finally {
      setSubmittingProduct(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("คุณแน่ใจหรือไม่ที่จะลบสินค้านี้ออกจากหน้าร้าน?")) return;

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: "DELETE",
        headers: { "X-User-Id": currentUser?.id || "" },
      });
      if (response.ok) {
        onRefreshData();
      }
    } catch (err) {
      console.error("Error deleting product:", err);
    }
  };

  // Calculation summaries
  const totalRevenue = orders
    .filter((o) => o.paymentStatus === "paid")
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const pendingOrdersCount = orders.filter((o) => o.shippingStatus === "pending").length;

  // Sales report calculations
  const salesData = products.map((product) => {
    let unitsSold = 0;
    let revenue = 0;

    orders.forEach((order) => {
      if (onlyPaidOrders && order.paymentStatus !== "paid") return;
      if (order.shippingStatus === "cancelled") return;

      let isPeriodMatch = false;
      const orderDate = order.createdAt;
      if (!orderDate) return;

      if (salesPeriod === "day") {
        isPeriodMatch = orderDate.substring(0, 10) === selectedDate;
      } else if (salesPeriod === "month") {
        isPeriodMatch = orderDate.substring(0, 7) === selectedMonth;
      } else if (salesPeriod === "year") {
        isPeriodMatch = orderDate.substring(0, 4) === String(selectedYear);
      }

      if (isPeriodMatch) {
        const item = order.items.find((i) => i.productId === product.id);
        if (item) {
          unitsSold += item.quantity;
          revenue += item.price * item.quantity;
        }
      }
    });

    return {
      product,
      unitsSold,
      revenue,
    };
  });

  const sortedSalesData = [...salesData].sort((a, b) => b.revenue - a.revenue || b.unitsSold - a.unitsSold);
  const periodTotalRevenue = sortedSalesData.reduce((sum, item) => sum + item.revenue, 0);
  const periodTotalUnits = sortedSalesData.reduce((sum, item) => sum + item.unitsSold, 0);
  const topSellingItem = sortedSalesData.find(item => item.unitsSold > 0) || null;

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "promotion": return "⚡ โปรโมชั่น";
      case "bestseller": return "🔥 ขายดี";
      case "recommended": return "✨ แนะนำ";
      default: return "📦 ทั่วไป";
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (selectedStatusFilter === "all") return true;
    return order.shippingStatus === selectedStatusFilter;
  });

  return (
    <div id="admin-panel" className="pb-12">
      {/* Admin Title Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-xl font-display font-black text-navy-primary uppercase tracking-wide flex items-center gap-2">
            <Shield className="text-brand-green" size={20} />
            แผงควบคุมผู้ดูแลร้านค้า (S Shop Backoffice)
          </h2>
          <p className="text-xs text-slate-500 font-sans mt-1">
            จัดการข้อมูลสินค้า, รายการออเดอร์, ข้อมูลลูกค้า และสลิปการโอนเงินเรียลไทม์
          </p>
        </div>

        {/* Action summaries buttons */}
        <div className="flex gap-2">
          {onNavigateTab && (
            <>
              <button
                type="button"
                onClick={() => onNavigateTab("shop-settings")}
                className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-600 cursor-pointer transition-colors"
              >
                <Sliders size={13} />
                <span>ตั้งค่าร้านค้า</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab("line-setup")}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100/50 rounded-lg text-xs font-bold cursor-pointer transition-all shadow-sm"
              >
                <Settings2 size={13} />
                <span>ตั้งค่าระบบ LINE API</span>
              </button>
            </>
          )}
          <button
            onClick={onRefreshData}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-600 cursor-pointer transition-colors"
          >
            <RefreshCw size={13} />
            <span>รีเฟรชข้อมูล</span>
          </button>
        </div>
      </div>

      {/* Mini Metric Scorecards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-lg bg-brand-green/10 text-brand-green flex items-center justify-center flex-shrink-0">
            <DollarSign size={20} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">รายได้รวม (ชำระแล้ว)</span>
            <h4 className="font-display font-black text-navy-primary text-xl leading-none mt-1.5">
              ฿{totalRevenue.toLocaleString()}
            </h4>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200/80 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-lg bg-navy-primary/10 text-navy-primary flex items-center justify-center flex-shrink-0">
            <Package size={20} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">ออเดอร์รอจัดส่ง</span>
            <h4 className="font-display font-black text-navy-primary text-xl leading-none mt-1.5">
              {pendingOrdersCount} ออเดอร์
            </h4>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200/80 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-lg bg-brand-green/10 text-brand-green flex items-center justify-center flex-shrink-0">
            <Users size={20} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">สินค้าทั้งหมดในสต็อก</span>
            <h4 className="font-display font-black text-navy-primary text-xl leading-none mt-1.5">
              {products.length} รายการ
            </h4>
          </div>
        </div>
      </div>

      {/* Admin Tab Selector */}
      <div className="border-b border-slate-200 mb-8 flex gap-2 overflow-x-auto pb-1 md:pb-0">
        <button
          onClick={() => setActiveTab("orders")}
          className={`px-5 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "orders" ? "border-brand-green text-brand-green font-bold" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          รายการออเดอร์ ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab("products")}
          className={`px-5 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "products" ? "border-brand-green text-brand-green font-bold" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          จัดการสินค้า ({products.length})
        </button>
        <button
          onClick={() => setActiveTab("customers")}
          className={`px-5 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "customers" ? "border-brand-green text-brand-green font-bold" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          ทะเบียนลูกค้า
        </button>
        <button
          onClick={() => setActiveTab("coupons")}
          className={`px-5 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "coupons" ? "border-brand-green text-brand-green font-bold" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Ticket size={13} />
          จัดการคูปองส่วนลด
        </button>
        <button
          onClick={() => setActiveTab("sales")}
          className={`px-5 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "sales" ? "border-brand-green text-brand-green font-bold" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <BarChart2 size={13} />
          รายงานยอดขายสินค้า
        </button>
        {onNavigateTab && (
          <>
            <button
              type="button"
              onClick={() => onNavigateTab("shop-settings")}
              className="px-5 py-3 text-xs font-semibold border-b-2 border-transparent text-slate-500 hover:text-slate-800 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5"
            >
              <Sliders size={13} />
              ตั้งค่าร้านค้า
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab("line-setup")}
              className="px-5 py-3 text-xs font-semibold border-b-2 border-transparent text-slate-500 hover:text-slate-800 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 font-bold text-emerald-600"
            >
              <Settings2 size={13} className="text-emerald-500" />
              ตั้งค่าระบบ LINE API
            </button>
          </>
        )}
      </div>

      {/* TAB CONTENT */}
      <AnimatePresence mode="wait">
        
        {/* ORDERS TAB */}
        {activeTab === "orders" && (
          <motion.div
            key="orders"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-sm"
          >
            {/* แถบติดตามสถานะคำสั่งซื้อ (Order Status Tracking) */}
            <div className="bg-slate-50/50 border-b border-slate-200/60 p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="font-sans font-extrabold text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  📌 แถบติดตามคำสั่งซื้อ:
                </span>
                <div className="flex flex-wrap bg-slate-100 rounded-xl p-1 border border-slate-200/30 gap-1">
                  <button
                    type="button"
                    onClick={() => setSelectedStatusFilter("all")}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      selectedStatusFilter === "all"
                        ? "bg-white text-navy-primary shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    ทั้งหมด ({orders.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedStatusFilter("pending")}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      selectedStatusFilter === "pending"
                        ? "bg-amber-500 text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    ⏳ รอจัดส่ง ({orders.filter(o => o.shippingStatus === "pending").length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedStatusFilter("shipped")}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      selectedStatusFilter === "shipped"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    🚚 กำลังจัดส่ง ({orders.filter(o => o.shippingStatus === "shipped").length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedStatusFilter("delivered")}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      selectedStatusFilter === "delivered"
                        ? "bg-brand-green text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    📦 ส่งสำเร็จ ({orders.filter(o => o.shippingStatus === "delivered").length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedStatusFilter("cancelled")}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      selectedStatusFilter === "cancelled"
                        ? "bg-slate-500 text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    ❌ ยกเลิก ({orders.filter(o => o.shippingStatus === "cancelled").length})
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3 self-end sm:self-auto">
                <div className="text-[10px] text-slate-400 font-bold">
                  แสดงผล: <span className="text-navy-primary">{filteredOrders.length}</span> ออเดอร์
                </div>
                {orders.length > 0 && (
                  <button
                    type="button"
                    onClick={handleResetOrders}
                    disabled={isResetting}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {isResetting ? "กำลังรีเซ็ต..." : "รีเซ็ตออเดอร์ทั้งหมด"}
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/60 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    <th className="p-4">รหัสออเดอร์</th>
                    <th className="p-4">วันที่สั่งซื้อ</th>
                    <th className="p-4">ข้อมูลลูกค้า</th>
                    <th className="p-4">สินค้า</th>
                    <th className="p-4">ยอดเงิน</th>
                    <th className="p-4 text-center">สลิปโอนเงิน</th>
                    <th className="p-4">สถานะชำระเงิน</th>
                    <th className="p-4">สถานะจัดส่ง</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-slate-400 font-bold text-xs leading-relaxed">
                        {selectedStatusFilter === "all" 
                          ? "ยังไม่มีประวัติคำสั่งซื้อเข้ามาในระบบ"
                          : `ไม่มีออเดอร์ในสถานะที่เลือก: ${
                              selectedStatusFilter === "pending" ? "⏳ รอจัดส่ง" :
                              selectedStatusFilter === "shipped" ? "🚚 กำลังจัดส่ง" :
                              selectedStatusFilter === "delivered" ? "📦 ส่งสำเร็จ" : "❌ ยกเลิก"
                            }`}
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-mono font-bold text-navy-primary select-all">
                          {order.id}
                        </td>
                        <td className="p-4 text-slate-500 font-mono text-[10px]">
                          {new Date(order.createdAt).toLocaleString("th-TH", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-2 max-w-[200px]">
                            <div>
                              <p className="font-semibold text-navy-primary leading-tight">{order.customerName}</p>
                              <p className="text-slate-500 text-[10px] font-mono mt-0.5">{order.customerPhone}</p>
                              <p className="text-slate-400 text-[10px] leading-tight mt-1" title={order.customerAddress}>
                                {order.customerAddress}
                              </p>
                            </div>
                            <button
                              onClick={() => handleEditCustomerClick(order)}
                              className="text-[9.5px] font-bold text-navy-primary hover:text-white bg-slate-50 hover:bg-navy-primary px-2.5 py-1.5 rounded-lg border border-slate-200 flex items-center justify-center gap-1 transition-all cursor-pointer w-max shadow-sm"
                            >
                              <Edit size={8} />
                              <span>แก้ไขข้อมูลติดต่อ / ที่อยู่</span>
                            </button>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-0.5 max-w-[200px]">
                            {order.items.map((item, idx) => (
                              <span key={idx} className="text-slate-700 truncate">
                                • {item.name} x{item.quantity}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-4 font-display font-bold text-navy-primary text-right pr-6">
                          <div>฿{order.totalAmount.toLocaleString()}</div>
                          {order.couponCode && (
                            <div className="text-[9px] font-sans text-rose-500 font-extrabold mt-1 tracking-wider leading-none">
                              🏷️ {order.couponCode}
                              <span className="font-normal block text-slate-400 mt-0.5">(-฿{order.discountAmount?.toLocaleString()})</span>
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {order.paymentSlipUrl ? (
                            <button
                              onClick={() => setActiveSlipUrl(order.paymentSlipUrl!)}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-green bg-brand-green/10 hover:brightness-95 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                            >
                              <FileText size={11} />
                              <span>ดูสลิป</span>
                            </button>
                          ) : (
                            <span className="text-slate-400 text-[10px] italic">ไม่มีสลิป</span>
                          )}
                        </td>
                        <td className="p-4">
                          <select
                            value={order.paymentStatus}
                            onChange={(e) => handleUpdateOrderStatus(order.id, "payment", e.target.value)}
                            disabled={order.shippingStatus === "delivered" || order.shippingStatus === "cancelled"}
                            className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed ${
                              order.paymentStatus === "paid"
                                ? "bg-brand-green/10 text-brand-green border-brand-green/20"
                                : order.paymentStatus === "verifying"
                                ? "bg-blue-50 text-blue-600 border-blue-100 animate-pulse"
                                : order.paymentStatus === "failed"
                                ? "bg-rose-50 text-rose-600 border-rose-100"
                                : "bg-amber-50 text-amber-600 border-amber-100"
                            }`}
                          >
                            <option value="pending">⏳ Pending (รอแนบสลิป)</option>
                            <option value="verifying">⏳ Verifying (รอตรวจสลิป)</option>
                            <option value="paid">✅ Paid (ชำระแล้ว)</option>
                            <option value="failed">❌ Failed (ชำระไม่สำเร็จ)</option>
                          </select>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-1.5">
                            <select
                              value={order.shippingStatus}
                              onChange={(e) => handleUpdateOrderStatus(order.id, "shipping", e.target.value)}
                              disabled={order.shippingStatus === "delivered" || order.shippingStatus === "cancelled"}
                              className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed ${
                                order.shippingStatus === "delivered"
                                  ? "bg-brand-green/10 text-brand-green border-brand-green/20"
                                  : order.shippingStatus === "shipped"
                                  ? "bg-navy-primary/10 text-navy-primary border-navy-primary/20"
                                  : order.shippingStatus === "cancelled"
                                  ? "bg-slate-100 text-slate-500 border-slate-200"
                                  : "bg-amber-50 text-amber-600 border-amber-100"
                              }`}
                            >
                              <option value="pending">⏳ รอจัดส่ง</option>
                              <option value="shipped">🚚 กำลังจัดส่ง</option>
                              <option value="delivered">📦 ส่งสำเร็จ</option>
                              <option value="cancelled">❌ ยกเลิก</option>
                            </select>

                            <div className="flex flex-col gap-0.5">
                              {order.trackingNumber ? (
                                <div className="flex flex-col gap-0.5">
                                  <button
                                    onClick={() => handleEditTrackingClick(order)}
                                    disabled={order.shippingStatus === "cancelled"}
                                    className="text-[9.5px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/80 px-2 py-1 rounded-lg border border-blue-200/50 flex items-center justify-between gap-1 w-full max-w-[125px] transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200/50"
                                    title={order.shippingStatus === "cancelled" ? "ไม่สามารถแก้ไขรายละเอียดได้เมื่อยกเลิกแล้ว" : "คลิกเพื่อแก้ไขรายละเอียดจัดส่ง"}
                                  >
                                    <span className="truncate">📋 {order.trackingNumber}</span>
                                    {order.shippingStatus !== "cancelled" && <Edit size={8} className="flex-shrink-0" />}
                                  </button>
                                  {order.trackingUrl && (
                                    <a
                                      href={order.trackingUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[8px] text-slate-400 hover:text-navy-primary font-medium flex items-center gap-0.5 mt-0.5"
                                    >
                                      <span>ลิงก์ติดตาม</span>
                                      <ExternalLink size={7} />
                                    </a>
                                  )}
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleEditTrackingClick(order)}
                                  disabled={order.shippingStatus === "cancelled"}
                                  className="text-[9.5px] font-bold text-slate-500 hover:text-navy-primary bg-slate-50 hover:bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 flex items-center justify-center gap-1 w-max transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                  <Plus size={8} />
                                  <span>ระบุแทรคกิ้ง</span>
                                </button>
                              )}
                            </div>

                            {order.shippingStatus === "cancelled" && order.cancelReason && (
                              <div className="text-[9.5px] text-rose-600 bg-rose-50 border border-rose-100 rounded-lg p-1.5 mt-1 max-w-[125px] break-words leading-tight font-sans font-semibold">
                                <span className="font-bold block">เหตุผลที่ยกเลิก:</span>
                                {order.cancelReason}
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() => handlePrintLabelClick(order)}
                              className="text-[9.5px] font-bold text-[#29A6FF] hover:text-white bg-sky-50 hover:bg-[#29A6FF] px-2 py-1.5 rounded-xl border border-sky-150/60 text-center flex items-center justify-center gap-1.5 transition-all cursor-pointer w-full max-w-[125px] mt-1.5 shadow-sm"
                            >
                              <Printer size={10} />
                              <span>พิมพ์ใบปะหน้ากล่อง</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* PRODUCTS TAB */}
        {activeTab === "products" && (
          <motion.div
            key="products"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-4"
          >
            {/* Create Product Form toggle trigger */}
            <div className="flex justify-end">
              <button
                onClick={handleAddNewProductClick}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-green hover:brightness-110 text-white text-xs font-bold rounded-lg shadow-lg shadow-brand-green/20 cursor-pointer transition-all"
              >
                <Plus size={14} />
                <span>เพิ่มสินค้าใหม่</span>
              </button>
            </div>

            {/* Product Table List */}
            <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/60 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    <th className="p-4">รูปสินค้า</th>
                    <th className="p-4">ชื่อสินค้า</th>
                    <th className="p-4">หมวดหมู่</th>
                    <th className="p-4 text-right">ราคา</th>
                    <th className="p-4 text-center">สต็อกคงเหลือ</th>
                    <th className="p-4 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <img
                           src={product.imageUrl}
                           alt={product.name}
                           className="w-10 h-10 rounded-lg object-cover bg-slate-50 border border-slate-100"
                           referrerPolicy="no-referrer"
                        />
                      </td>
                      <td className="p-4">
                        <h5 className="font-bold text-navy-primary leading-none mb-1">{product.name}</h5>
                        <p className="text-slate-400 text-[10px] line-clamp-1 mt-1 max-w-[280px]">
                          {product.description}
                        </p>
                      </td>
                      <td className="p-4">
                        <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full border uppercase ${
                          product.category === "bestseller"
                            ? "bg-amber-50 text-amber-600 border-amber-100"
                            : product.category === "promotion"
                            ? "bg-rose-50 text-rose-600 border-rose-100"
                            : product.category === "recommended"
                            ? "bg-brand-green/10 text-brand-green border-brand-green/20"
                            : "bg-slate-50 text-slate-600 border-slate-100"
                        }`}>
                          {product.category}
                        </span>
                      </td>
                      <td className="p-4 font-display font-black text-brand-green text-right pr-6">
                        ฿{product.price.toLocaleString()}
                      </td>
                      <td className="p-4 text-center font-semibold font-mono text-navy-primary">
                        {product.stock} ชิ้น
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center items-center gap-2">
                          <button
                            onClick={() => handleEditProductClick(product)}
                            className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-brand-green rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* CUSTOMERS TAB */}
        {activeTab === "customers" && (
          <motion.div
            key="customers"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-sm"
          >
            {loadingCustomers ? (
              <div className="p-12 text-center text-slate-400">
                <RefreshCw className="animate-spin mx-auto mb-2 text-slate-400" size={20} />
                <span>กำลังโหลดรายการลูกค้า...</span>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/60 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    <th className="p-4">โปรไฟล์ LINE</th>
                    <th className="p-4">ชื่อผู้ซื้อ</th>
                    <th className="p-4">อีเมล</th>
                    <th className="p-4 text-center">จำนวนออเดอร์</th>
                    <th className="p-4 text-right pr-6">ยอดรวมที่เคยซื้อ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-slate-400">
                        ยังไม่มีข้อมูลทะเบียนลูกค้า
                      </td>
                    </tr>
                  ) : (
                    customers.map((cust) => (
                      <tr key={cust.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                              {cust.linePictureUrl ? (
                                <img src={cust.linePictureUrl} alt={cust.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center font-bold text-[10px] text-slate-400 bg-slate-100">
                                  LINE
                                </div>
                              )}
                            </div>
                            <div className="leading-none">
                              <p className="font-semibold text-navy-primary">{cust.lineDisplayName}</p>
                              {cust.lineUserId && (
                                <p className="text-[9px] text-slate-400 font-mono mt-0.5 truncate max-w-[100px]">
                                  {cust.lineUserId}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-semibold text-navy-primary">{cust.name}</td>
                        <td className="p-4 text-slate-500 font-mono">
                          <div className="flex items-center gap-2.5">
                            <span>{cust.email}</span>
                            <button
                              type="button"
                              onClick={() => handleOpenCreateOrder(cust)}
                              className="w-5 h-5 rounded-full bg-red-50 hover:bg-red-100 text-red-600 hover:scale-110 active:scale-95 flex items-center justify-center cursor-pointer transition-all border border-red-200 font-extrabold flex-shrink-0"
                              title="สร้างออเดอร์ใหม่ให้ลูกค้ารายนี้"
                            >
                              <Plus size={11} strokeWidth={4} />
                            </button>
                          </div>
                        </td>
                        <td className="p-4 text-center font-semibold font-mono text-navy-primary">
                          {cust.ordersCount} ครั้ง
                        </td>
                        <td className="p-4 font-display font-black text-brand-green text-right pr-6">
                          ฿{cust.totalSpent.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </motion.div>
        )}

        {/* SALES REPORT TAB */}
        {activeTab === "sales" && (
          <motion.div
            key="sales"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-6"
          >
            {/* Sales Control Bar */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col lg:flex-row gap-5 items-stretch lg:items-center justify-between">
              
              {/* Period Selector Buttons */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">เลือกช่วงเวลาแสดงผล</span>
                <div className="inline-flex rounded-lg bg-slate-100 p-1 w-max">
                  <button
                    onClick={() => setSalesPeriod("day")}
                    className={`px-4 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                      salesPeriod === "day"
                        ? "bg-white text-navy-primary shadow-sm font-bold"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    รายวัน
                  </button>
                  <button
                    onClick={() => setSalesPeriod("month")}
                    className={`px-4 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                      salesPeriod === "month"
                        ? "bg-white text-navy-primary shadow-sm font-bold"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    รายเดือน
                  </button>
                  <button
                    onClick={() => setSalesPeriod("year")}
                    className={`px-4 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                      salesPeriod === "year"
                        ? "bg-white text-navy-primary shadow-sm font-bold"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    รายปี
                  </button>
                </div>
              </div>

              {/* Specific Period Pickers */}
              <div className="flex flex-col gap-2 flex-1 max-w-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                  <Calendar size={11} />
                  <span>ระบุ {salesPeriod === "day" ? "วันที่ต้องการ" : salesPeriod === "month" ? "เดือนที่ต้องการ" : "ปีที่ต้องการ"}</span>
                </span>
                
                {salesPeriod === "day" && (
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-navy-primary focus:border-navy-primary font-mono w-full"
                  />
                )}

                {salesPeriod === "month" && (
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-navy-primary focus:border-navy-primary font-mono w-full"
                  />
                )}

                {salesPeriod === "year" && (
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-navy-primary focus:border-navy-primary font-mono w-full cursor-pointer"
                  >
                    {Array.from({ length: 5 }, (_, i) => 2024 + i).map((yr) => (
                      <option key={yr} value={yr}>
                        ปี ค.ศ. {yr} (พ.ศ. {yr + 543})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Status Filters */}
              <div className="flex flex-col gap-2 justify-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">ตัวกรองสถานะ</span>
                <label className="inline-flex items-center gap-2 cursor-pointer select-none text-xs text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-4 py-2.5 transition-colors">
                  <input
                    type="checkbox"
                    checked={onlyPaidOrders}
                    onChange={(e) => setOnlyPaidOrders(e.target.checked)}
                    className="rounded border-slate-300 text-brand-green focus:ring-brand-green accent-brand-green cursor-pointer"
                  />
                  <span className="font-semibold">นับเฉพาะออเดอร์ที่ชำระเงินแล้วเท่านั้น</span>
                </label>
              </div>

            </div>

            {/* Metric widgets inside the selected period */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-5 rounded-xl border border-slate-200/80 flex items-center gap-4 shadow-sm">
                <div className="w-10 h-10 rounded-lg bg-sky-50 text-[#29A6FF] flex items-center justify-center flex-shrink-0 border border-sky-100">
                  <DollarSign size={16} />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    ยอดขายรวม ({salesPeriod === "day" ? "ประจำวัน" : salesPeriod === "month" ? "ประจำเดือน" : "ประจำปี"})
                  </span>
                  <h4 className="font-display font-black text-navy-primary text-base leading-none mt-1">
                    ฿{periodTotalRevenue.toLocaleString()}
                  </h4>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200/80 flex items-center gap-4 shadow-sm">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 border border-indigo-100">
                  <Package size={16} />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">จำนวนสินค้าที่ขายได้</span>
                  <h4 className="font-display font-black text-navy-primary text-base leading-none mt-1">
                    {periodTotalUnits.toLocaleString()} ชิ้น
                  </h4>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200/80 flex items-center gap-4 shadow-sm">
                <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 border border-amber-100">
                  <TrendingUp size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">สินค้าขายดีประจำช่วงเวลา</span>
                  <h4 className="font-display font-black text-navy-primary text-sm leading-tight mt-0.5 truncate" title={topSellingItem ? topSellingItem.product.name : "ไม่มีข้อมูล"}>
                    {topSellingItem ? `${topSellingItem.product.name} (${topSellingItem.unitsSold} ชิ้น)` : "ไม่มีข้อมูลการขาย"}
                  </h4>
                </div>
              </div>
            </div>

            {/* Sales Table and Visual Indicator List */}
            <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-sm">
              <div className="p-4.5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <div>
                  <h4 className="font-display font-bold text-xs text-navy-primary uppercase tracking-wide">
                    📊 รายละเอียดความนิยมและยอดขายรายสินค้า
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    เรียงตามยอดขายสูงสุด (บาท) ในช่วงเวลาที่เลือก
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200/60 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                      <th className="p-4">รูปภาพและสินค้า</th>
                      <th className="p-4">หมวดหมู่</th>
                      <th className="p-4 text-right">ราคาหน้าร้าน</th>
                      <th className="p-4 text-center">คงเหลือในสต็อก</th>
                      <th className="p-4 text-center">จำนวนที่ขายได้ (ชิ้น)</th>
                      <th className="p-4 text-right pr-6">ยอดขายทั้งหมด (บาท)</th>
                      <th className="p-4 w-[180px]">สัดส่วนยอดขาย</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortedSalesData.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-12 text-center text-slate-400">
                          ไม่มีสินค้าในระบบ
                        </td>
                      </tr>
                    ) : (
                      sortedSalesData.map(({ product, unitsSold, revenue }) => {
                        const maxRevenue = Math.max(...sortedSalesData.map(item => item.revenue), 1);
                        const progressPct = Math.min((revenue / maxRevenue) * 100, 100);

                        return (
                          <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-slate-100 rounded-lg overflow-hidden border border-slate-200/60 flex-shrink-0 flex items-center justify-center">
                                  {product.imageUrl ? (
                                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <Package className="text-slate-400" size={14} />
                                  )}
                                </div>
                                <div className="leading-tight">
                                  <p className="font-bold text-navy-primary font-sans">{product.name}</p>
                                  <p className="text-[9px] text-slate-400 font-mono mt-0.5">ID: {product.id}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200/60 inline-block">
                                {getCategoryLabel(product.category)}
                              </span>
                            </td>
                            <td className="p-4 font-bold text-slate-600 text-right">
                              ฿{product.price.toLocaleString()}
                            </td>
                            <td className="p-4 text-center">
                              <span className={`font-mono font-bold ${product.stock === 0 ? "text-rose-500" : "text-slate-700"}`}>
                                {product.stock}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              {unitsSold > 0 ? (
                                <span className="inline-flex items-center justify-center bg-blue-50 text-blue-600 font-mono font-black px-2.5 py-1 rounded-md border border-blue-100 text-[11px]">
                                  {unitsSold} ชิ้น
                                </span>
                              ) : (
                                <span className="text-slate-300 font-mono">-</span>
                              )}
                            </td>
                            <td className="p-4 text-right font-display font-black text-brand-green pr-6">
                              {revenue > 0 ? (
                                <span>฿{revenue.toLocaleString()}</span>
                              ) : (
                                <span className="text-slate-300 font-mono">-</span>
                              )}
                            </td>
                            <td className="p-4">
                              {revenue > 0 ? (
                                <div className="flex flex-col gap-1.5 w-full">
                                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/30">
                                    <div
                                      className="h-full bg-brand-green rounded-full transition-all duration-500"
                                      style={{ width: `${progressPct}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-[9px] text-slate-400 font-bold block text-right">
                                    {((revenue / (periodTotalRevenue || 1)) * 100).toFixed(1)}%
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-300 italic">ไม่มีส่วนแบ่งยอดขาย</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* COUPONS TAB */}
        {activeTab === "coupons" && (
          <motion.div
            key="coupons"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-6"
          >
            {/* Header / Top Control Bar */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
              <div>
                <h3 className="font-display font-black text-navy-primary text-sm flex items-center gap-2">
                  <Ticket className="text-brand-green" size={18} />
                  <span>ระบบจัดการคูปองส่วนลด</span>
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  สร้าง แก้ไข และระงับรหัสส่วนลดของลูกค้าสำหรับการชำระเงินในระบบ
                </p>
              </div>
              <button
                onClick={handleOpenCreateCoupon}
                className="bg-navy-primary hover:bg-navy-secondary text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-sm w-full md:w-auto justify-center"
              >
                <Plus size={14} />
                <span>เพิ่มคูปองส่วนลดใหม่</span>
              </button>
            </div>

            {/* Coupons List Table */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200/60 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                      <th className="p-4">รหัสคูปอง (Code)</th>
                      <th className="p-4">ประเภทส่วนลด</th>
                      <th className="p-4">มูลค่าลด</th>
                      <th className="p-4 text-center">สิทธิ์คงเหลือ (ใช้ไป / สิทธิ์ทั้งหมด)</th>
                      <th className="p-4 text-center">ขั้นต่ำ (฿)</th>
                      <th className="p-4 text-center">วันหมดอายุ</th>
                      <th className="p-4 text-center">สถานะ</th>
                      <th className="p-4 text-right pr-6">เครื่องมือ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loadingCoupons ? (
                      <tr>
                        <td colSpan={8} className="p-12 text-center text-slate-400 font-medium">
                          <RefreshCw className="animate-spin inline-block mr-2 text-navy-primary" size={16} />
                          <span>กำลังดึงข้อมูลคูปองส่วนลด...</span>
                        </td>
                      </tr>
                    ) : coupons.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-12 text-center text-slate-400 font-medium">
                          ไม่มีคูปองส่วนลดในระบบ
                        </td>
                      </tr>
                    ) : (
                      coupons.map((coupon) => {
                        const isExpired = coupon.expiryDate
                          ? new Date() > (() => {
                              const exp = new Date(coupon.expiryDate);
                              exp.setHours(23, 59, 59, 999);
                              return exp;
                            })()
                          : false;

                        return (
                          <tr key={coupon.id} className="hover:bg-slate-50/40 transition-colors">
                            <td className="p-4">
                              <span className="font-mono font-black text-navy-primary bg-blue-50/80 px-2.5 py-1 rounded-lg border border-blue-100/60 tracking-wider">
                                {coupon.code}
                              </span>
                            </td>
                            <td className="p-4 text-slate-500 font-medium">
                              {coupon.discountType === "fixed" ? (
                                <span className="text-indigo-600 font-semibold">ลดจำนวนเงินคงที่</span>
                              ) : (
                                <span className="text-emerald-600 font-semibold">ลดตามสัดส่วน %</span>
                              )}
                            </td>
                            <td className="p-4 font-bold text-slate-800">
                              {coupon.discountType === "fixed" ? `฿${coupon.discountValue}` : `${coupon.discountValue}%`}
                              {coupon.maxDiscount !== undefined && (
                                <span className="text-[9px] text-slate-400 font-normal block mt-0.5">
                                  ลดสูงสุด ฿{coupon.maxDiscount}
                                </span>
                              )}
                            </td>
                            <td className="p-4 text-center font-mono font-bold text-slate-600">
                              {coupon.usageLimit !== undefined ? (
                                <span>
                                  {coupon.usageCount || 0} / {coupon.usageLimit}
                                </span>
                              ) : (
                                <span className="text-slate-400">ไม่จำกัด ({coupon.usageCount || 0} ครั้ง)</span>
                              )}
                            </td>
                            <td className="p-4 text-center font-bold text-slate-500">
                              {coupon.minSpend !== undefined ? `฿${coupon.minSpend}` : "-"}
                            </td>
                            <td className="p-4 text-center font-mono">
                              {coupon.expiryDate ? (
                                <span className={isExpired ? "text-rose-500 font-bold" : "text-slate-600"}>
                                  {coupon.expiryDate} {isExpired && "(หมดอายุแล้ว)"}
                                </span>
                              ) : (
                                <span className="text-slate-400 font-medium">ไม่มีหมดอายุ</span>
                              )}
                            </td>
                            <td className="p-4 text-center">
                              <button
                                onClick={() => handleToggleCouponStatus(coupon)}
                                className={`px-2.5 py-1 text-[10px] font-bold rounded-full border cursor-pointer transition-all ${
                                  coupon.isActive && !isExpired
                                    ? "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
                                    : "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100"
                                }`}
                              >
                                {isExpired ? "หมดอายุ" : coupon.isActive ? "เปิดใช้งาน" : "ระงับชั่วคราว"}
                              </button>
                            </td>
                            <td className="p-4 text-right pr-6">
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => handleOpenEditCoupon(coupon)}
                                  className="p-1.5 text-navy-primary hover:text-white bg-slate-50 hover:bg-navy-primary rounded-lg border border-slate-200 transition-colors cursor-pointer"
                                  title="แก้ไขคูปอง"
                                >
                                  <Edit size={11} />
                                </button>
                                <button
                                  onClick={() => handleDeleteCoupon(coupon.id)}
                                  className="p-1.5 text-rose-600 hover:text-white bg-slate-50 hover:bg-rose-600 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                                  title="ลบคูปอง"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: Coupon Form (Create / Edit) */}
      {showCouponForm && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden"
          >
            <div className="bg-navy-primary text-white p-4.5 flex justify-between items-center">
              <h4 className="font-display font-bold text-xs uppercase tracking-wider">
                {editingCoupon ? "✏️ แก้ไขคูปองส่วนลด" : "🎫 สร้างคูปองส่วนลดใหม่"}
              </h4>
              <button
                onClick={() => setShowCouponForm(false)}
                className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleSaveCouponSubmit} className="p-6 flex flex-col gap-4 text-xs">
              {couponFormError && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 font-medium font-sans">
                  ⚠️ {couponFormError}
                </div>
              )}

              {/* Coupon Code */}
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-500 uppercase tracking-wide">
                  รหัสคูปอง (Coupon Code) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={cpCode}
                  onChange={(e) => setCpCode(e.target.value)}
                  placeholder="เช่น WELCOME100, S50"
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 uppercase focus:outline-none focus:border-navy-primary font-mono font-bold"
                  id="cp-code"
                />
              </div>

              {/* Discount Type */}
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-500 uppercase tracking-wide">
                  ประเภทส่วนลด <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCpDiscountType("fixed")}
                    className={`px-3 py-2.5 rounded-xl border font-semibold text-xs transition-all cursor-pointer ${
                      cpDiscountType === "fixed"
                        ? "bg-navy-primary/10 border-navy-primary text-navy-primary font-bold"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    ลดเงินคงที่ (฿)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCpDiscountType("percent")}
                    className={`px-3 py-2.5 rounded-xl border font-semibold text-xs transition-all cursor-pointer ${
                      cpDiscountType === "percent"
                        ? "bg-navy-primary/10 border-navy-primary text-navy-primary font-bold"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    ลดตามเปอร์เซ็นต์ (%)
                  </button>
                </div>
              </div>

              {/* Discount Value */}
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-500 uppercase tracking-wide">
                  มูลค่าส่วนลด <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={cpDiscountType === "percent" ? "100" : undefined}
                  value={cpDiscountValue}
                  onChange={(e) => setCpDiscountValue(e.target.value)}
                  placeholder={cpDiscountType === "percent" ? "ระบุเปอร์เซ็นต์ เช่น 10" : "ระบุจำนวนเงิน เช่น 100"}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-navy-primary font-bold animate-none"
                  id="cp-discount-value"
                />
              </div>

              {/* Grid: Min Spend & Max Discount */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-500 uppercase tracking-wide">
                    สั่งซื้อขั้นต่ำ (฿)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={cpMinSpend}
                    onChange={(e) => setCpMinSpend(e.target.value)}
                    placeholder="ไม่มีขั้นต่ำ"
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-navy-primary font-bold"
                    id="cp-min-spend"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-500 uppercase tracking-wide">
                    ลดสูงสุดได้ (฿)
                  </label>
                  <input
                    type="number"
                    min="0"
                    disabled={cpDiscountType === "fixed"}
                    value={cpDiscountType === "fixed" ? "" : cpMaxDiscount}
                    onChange={(e) => setCpMaxDiscount(e.target.value)}
                    placeholder="ไม่จำกัดสูงสุด"
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-navy-primary disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                    id="cp-max-discount"
                  />
                </div>
              </div>

              {/* Grid: Usage Limit & Expiry Date */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-500 uppercase tracking-wide">
                    สิทธิ์ใช้งานทั้งหมด
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={cpUsageLimit}
                    onChange={(e) => setCpUsageLimit(e.target.value)}
                    placeholder="ไม่จำกัดจำนวนสิทธิ์"
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-navy-primary font-bold"
                    id="cp-usage-limit"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-500 uppercase tracking-wide">
                    วันหมดอายุคูปอง
                  </label>
                  <input
                    type="date"
                    value={cpExpiryDate}
                    onChange={(e) => setCpExpiryDate(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-navy-primary font-mono"
                    id="cp-expiry-date"
                  />
                </div>
              </div>

              {/* Status active */}
              <div className="flex items-center gap-2 mt-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <input
                  type="checkbox"
                  id="cp-is-active"
                  checked={cpIsActive}
                  onChange={(e) => setCpIsActive(e.target.checked)}
                  className="w-4 h-4 text-navy-primary border-slate-200 rounded focus:ring-navy-primary cursor-pointer"
                />
                <label htmlFor="cp-is-active" className="font-bold text-slate-700 select-none cursor-pointer">
                  เปิดให้สามารถใช้คูปองนี้ได้ทันที (Active Status)
                </label>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2.5 mt-4">
                <button
                  type="button"
                  onClick={() => setShowCouponForm(false)}
                  className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 font-bold py-3 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submittingCoupon}
                  className="flex-1 bg-navy-primary hover:bg-navy-secondary text-white font-bold py-3 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
                >
                  {submittingCoupon ? <RefreshCw className="animate-spin" size={13} /> : "บันทึกคูปอง"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL: Create Order for Customer */}
      {selectedCustomerForOrder && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="bg-red-600 text-white p-4.5 flex justify-between items-center flex-shrink-0">
              <h4 className="font-display font-black text-xs uppercase tracking-wider flex items-center gap-2">
                <Plus size={14} strokeWidth={3.5} />
                <span>สร้างออเดอร์ใหม่ให้ {selectedCustomerForOrder.name}</span>
              </h4>
              <button
                type="button"
                onClick={() => setSelectedCustomerForOrder(null)}
                className="text-white hover:text-red-200 cursor-pointer transition-colors border-0 bg-transparent animate-pulse"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto p-5 flex flex-col gap-5 text-xs flex-1">
              {/* Customer Info Card */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 border border-slate-350 overflow-hidden flex-shrink-0">
                    {selectedCustomerForOrder.linePictureUrl ? (
                      <img
                        src={selectedCustomerForOrder.linePictureUrl}
                        alt={selectedCustomerForOrder.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-xs text-slate-500">
                        LINE
                      </div>
                    )}
                  </div>
                  <div>
                    <h5 className="font-bold text-navy-primary text-sm">{selectedCustomerForOrder.name}</h5>
                    <p className="text-slate-500 font-mono text-[10px]">{selectedCustomerForOrder.email}</p>
                    {selectedCustomerForOrder.lineDisplayName && (
                      <p className="text-emerald-600 font-medium text-[9px] mt-0.5">
                        🟢 LINE Display: {selectedCustomerForOrder.lineDisplayName}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">ยอดรวมประวัติช้อป</p>
                  <p className="font-display font-black text-brand-green text-sm">
                    ฿{selectedCustomerForOrder.totalSpent.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Error Alert */}
              {adminOrderError && (
                <div className="bg-rose-50 border border-rose-150 text-rose-700 px-4 py-3 rounded-lg font-semibold flex items-center gap-2">
                  <span>⚠️ {adminOrderError}</span>
                </div>
              )}

              {/* Product Selection List */}
              <div className="flex flex-col gap-2.5">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                    เลือกสินค้าเข้ารายการออเดอร์
                  </label>
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="🔍 ค้นหาสินค้าตามชื่อ..."
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 w-full sm:w-48 font-sans"
                  />
                </div>

                <div className="border border-slate-200 rounded-xl max-h-[180px] overflow-y-auto divide-y divide-slate-100 bg-white shadow-inner">
                  {products
                    .filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase()))
                    .map((prod) => {
                      const selectedItem = adminOrderItems.find((i) => i.productId === prod.id);
                      const qty = selectedItem ? selectedItem.quantity : 0;
                      return (
                        <div key={prod.id} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-lg bg-slate-100 overflow-hidden border border-slate-200 flex-shrink-0">
                              <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800 leading-tight">{prod.name}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                <span className="font-bold text-red-650 text-xs">฿{prod.price.toLocaleString()}</span>
                                <span className="mx-1.5">•</span>
                                สต็อก: {prod.stock} ชิ้น
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {qty === 0 ? (
                              <button
                                type="button"
                                onClick={() => handleAdminUpdateQuantity(prod.id, 1)}
                                className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-lg border border-red-200 transition-all cursor-pointer text-[10px] flex items-center gap-1"
                              >
                                <Plus size={10} strokeWidth={3.5} />
                                <span>เพิ่มสินค้า</span>
                              </button>
                            ) : (
                              <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                                <button
                                  type="button"
                                  onClick={() => handleAdminUpdateQuantity(prod.id, -1)}
                                  className="w-6 h-6 rounded bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center cursor-pointer transition-all border border-slate-200/40 text-xs font-bold"
                                >
                                  -
                                </button>
                                <span className="px-3 text-slate-800 font-bold font-mono text-xs">{qty}</span>
                                <button
                                  type="button"
                                  onClick={() => handleAdminUpdateQuantity(prod.id, 1)}
                                  className="w-6 h-6 rounded bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center cursor-pointer transition-all border border-slate-200/40 text-xs font-bold"
                                >
                                  +
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Selected Items & Total Summary Card */}
              {adminOrderItems.length > 0 && (
                <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-200 space-y-3">
                  <h6 className="font-bold text-slate-600 uppercase tracking-wide text-[10px]">
                    รายการสินค้าที่เลือก ({adminOrderItems.reduce((sum, i) => sum + i.quantity, 0)} ชิ้น)
                  </h6>
                  <div className="space-y-1.5">
                    {adminOrderItems.map((item) => {
                      const prod = products.find((p) => p.id === item.productId);
                      if (!prod) return null;
                      return (
                        <div key={item.productId} className="flex justify-between items-center text-[11px] text-slate-700">
                          <span>
                            • {prod.name} <span className="font-mono text-slate-400 font-bold">x{item.quantity}</span>
                          </span>
                          <span className="font-semibold text-slate-800">
                            ฿{(prod.price * item.quantity).toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Coupon Application input */}
                  <div className="border-t border-slate-200 pt-3 flex flex-col gap-1.5">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1.5">
                      <span className="font-bold text-slate-500">รหัสคูปองส่วนลด (ถ้ามี):</span>
                      <input
                        type="text"
                        value={adminCouponCode}
                        onChange={(e) => setAdminCouponCode(e.target.value)}
                        placeholder="กรอกโค้ด เช่น DISCOUNT10"
                        className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-850 uppercase font-mono w-full sm:w-44 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                      />
                    </div>
                    {/* List active coupons as helper tags */}
                    {coupons.filter(c => c.isActive).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1 items-center">
                        <span className="text-[10px] text-slate-400">คูปองร้านค้า:</span>
                        {coupons.filter(c => c.isActive).map((cp) => (
                          <button
                            type="button"
                            key={cp.id}
                            onClick={() => setAdminCouponCode(cp.code)}
                            className={`px-2 py-1 text-[9px] font-bold rounded border transition-all cursor-pointer ${
                              adminCouponCode.toUpperCase() === cp.code.toUpperCase()
                                ? "bg-red-500 text-white border-red-500"
                                : "bg-white text-slate-600 border-slate-200 hover:border-slate-450"
                            }`}
                          >
                            🏷️ {cp.code} ({cp.discountType === "percent" ? `-${cp.discountValue}%` : `-฿${cp.discountValue}`})
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Detailed Price calculations */}
                  <div className="border-t border-slate-200 pt-3 space-y-1 text-slate-600">
                    <div className="flex justify-between">
                      <span>ยอดรวมสินค้าย่อย (Subtotal):</span>
                      <span className="font-mono font-semibold">
                        ฿{adminOrderItems
                          .reduce((sum, item) => {
                            const prod = products.find((p) => p.id === item.productId);
                            return sum + (prod ? prod.price * item.quantity : 0);
                          }, 0)
                          .toLocaleString()}
                      </span>
                    </div>

                    {/* Calculated Coupon Discount */}
                    {(() => {
                      const subtotal = adminOrderItems.reduce((sum, item) => {
                        const prod = products.find((p) => p.id === item.productId);
                        return sum + (prod ? prod.price * item.quantity : 0);
                      }, 0);
                      const cp = coupons.find(c => c.code === adminCouponCode.trim().toUpperCase() && c.isActive);
                      if (cp) {
                        let discount = 0;
                        if (cp.discountType === "percent") {
                          discount = Math.floor((subtotal * cp.discountValue) / 100);
                          if (cp.maxDiscount) discount = Math.min(discount, cp.maxDiscount);
                        } else {
                          discount = cp.discountValue;
                        }
                        discount = Math.min(discount, subtotal);
                        return (
                          <div className="flex justify-between text-rose-600 font-semibold">
                            <span>🏷️ ส่วนลดคูปอง ({cp.code}):</span>
                            <span className="font-mono">-฿{discount.toLocaleString()}</span>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    <div className="flex justify-between text-navy-primary font-bold text-sm border-t border-dashed border-slate-200 pt-2">
                      <span>ยอดชำระเงินสุทธิ (Total Payment):</span>
                      <span className="font-mono font-black text-red-600 text-base">
                        ฿{(() => {
                          const subtotal = adminOrderItems.reduce((sum, item) => {
                            const prod = products.find((p) => p.id === item.productId);
                            return sum + (prod ? prod.price * item.quantity : 0);
                          }, 0);
                          const cp = coupons.find(c => c.code === adminCouponCode.trim().toUpperCase() && c.isActive);
                          let discount = 0;
                          if (cp) {
                            if (cp.discountType === "percent") {
                              discount = Math.floor((subtotal * cp.discountValue) / 100);
                              if (cp.maxDiscount) discount = Math.min(discount, cp.maxDiscount);
                            } else {
                              discount = cp.discountValue;
                            }
                            discount = Math.min(discount, subtotal);
                          }
                          return Math.max(0, subtotal - discount).toLocaleString();
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-200 p-4.5 bg-slate-50 flex gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => setSelectedCustomerForOrder(null)}
                className="flex-1 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 font-bold py-3 rounded-xl text-xs transition-all cursor-pointer text-center"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={submittingAdminOrder || adminOrderItems.length === 0}
                onClick={handleCreateOrderSubmit}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-bold py-3 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md border-0"
              >
                {submittingAdminOrder ? (
                  <RefreshCw className="animate-spin" size={13} />
                ) : (
                  <>
                    <Plus size={13} strokeWidth={3} />
                    <span>สร้างออเดอร์และแจ้งเตือน</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* MODAL: Product Form (Create / Edit) */}
      {showProductForm && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden"
          >
            <div className="bg-navy-primary text-white p-4.5 flex justify-between items-center">
              <h4 className="font-display font-bold text-xs uppercase tracking-wider">
                {editingProduct ? "✏️ แก้ไขข้อมูลสินค้า" : "📦 เพิ่มสินค้าใหม่ในหน้าร้าน"}
              </h4>
              <button
                onClick={() => setShowProductForm(false)}
                className="text-slate-300 hover:text-white cursor-pointer transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-5 flex flex-col gap-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-500 uppercase tracking-wide">ชื่อสินค้า *</label>
                <input
                  type="text"
                  required
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  placeholder="เช่น S Headphone Pro"
                  className="bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-navy-primary focus:border-navy-primary text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-500 uppercase tracking-wide">ราคาขาย (บาท) *</label>
                  <input
                    type="number"
                    required
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    placeholder="เช่น 1290"
                    className="bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-navy-primary focus:border-navy-primary text-slate-800"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-500 uppercase tracking-wide">จำนวนในสต็อก *</label>
                  <input
                    type="number"
                    required
                    value={prodStock}
                    onChange={(e) => setProdStock(e.target.value)}
                    placeholder="เช่น 50"
                    className="bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-navy-primary focus:border-navy-primary text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-500 uppercase tracking-wide">หมวดหมู่แบรนด์สินค้า</label>
                  <select
                    value={prodCat}
                    onChange={(e) => setProdCat(e.target.value as any)}
                    className="bg-white border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-navy-primary focus:border-navy-primary text-slate-800"
                  >
                    <option value="general">General (สินค้าทั่วไป)</option>
                    <option value="promotion">Promotion (สินค้าจัดโปร)</option>
                    <option value="bestseller">Bestseller (สินค้าขายดี)</option>
                    <option value="recommended">Recommended (สินค้าแนะนำ)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-500 uppercase tracking-wide">URL รูปภาพสินค้า</label>
                  <input
                    type="url"
                    value={prodImgUrl}
                    onChange={(e) => setProdImgUrl(e.target.value)}
                    placeholder="ใส่ URL รูปภาพ"
                    className="bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-navy-primary focus:border-navy-primary text-slate-800"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-500 uppercase tracking-wide">คำอธิบายรายละเอียดสินค้า</label>
                <textarea
                  rows={3}
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  placeholder="รายละเอียดสินค้า สี คุณสมบัติเด่น..."
                  className="bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-navy-primary focus:border-navy-primary text-slate-800 resize-none leading-relaxed"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={submittingProduct}
                className="bg-brand-green hover:brightness-110 text-white font-sans font-bold py-2.5 px-4.5 rounded-xl shadow-md shadow-brand-green/10 cursor-pointer transition-all flex items-center justify-center gap-1.5 mt-2 border-0 text-xs"
              >
                {submittingProduct ? (
                  <RefreshCw className="animate-spin" size={14} />
                ) : (
                  <Save size={14} />
                )}
                <span>{editingProduct ? "บันทึกการแก้ไข" : "เพิ่มสินค้าใหม่"}</span>
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* SLIP SCREEN PREVIEW MODAL */}
      {activeSlipUrl && (
        <div
          onClick={() => setActiveSlipUrl(null)}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-[2px] z-50 flex items-center justify-center p-4 cursor-zoom-out"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-sm w-full bg-white rounded-xl overflow-hidden shadow-2xl p-4 flex flex-col gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-100">
              <span className="font-bold text-navy-primary">หลักฐานการโอนเงิน (Slip)</span>
              <button
                onClick={() => setActiveSlipUrl(null)}
                className="text-slate-400 hover:text-navy-primary font-bold cursor-pointer"
              >
                ปิด
              </button>
            </div>
            <img
              src={activeSlipUrl}
              alt="Payment Slip attachment"
              className="w-full max-h-[450px] object-contain rounded-lg border border-slate-200"
            />
          </motion.div>
        </div>
      )}

      {/* TRACKING INFORMATION MODAL */}
      {editingTrackingOrder && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden"
          >
            <div className="bg-navy-primary text-white p-4.5 flex justify-between items-center">
              <h4 className="font-display font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <span>📋 ข้อมูลการจัดส่งออเดอร์ {editingTrackingOrder.id}</span>
              </h4>
              <button
                onClick={() => setEditingTrackingOrder(null)}
                className="text-slate-300 hover:text-white cursor-pointer transition-colors border-0 bg-transparent"
              >
                ปิด
              </button>
            </div>

            <form onSubmit={handleSaveTracking} className="p-5 flex flex-col gap-4 text-xs">
              <p className="text-slate-500 font-sans leading-relaxed text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                ระบุหมายเลขพัสดุและลิงก์ติดตามสถานะสำหรับจัดส่งสินค้า เพื่อแสดงบนหน้าจอประวัติการสั่งซื้อของลูกค้าและส่งแจ้งเตือนผ่านช่องทาง LINE!
              </p>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  หมายเลขพัสดุ (Tracking Number) *
                </label>
                <input
                  type="text"
                  required
                  value={trackNumber}
                  onChange={(e) => setTrackNumber(e.target.value)}
                  placeholder="เช่น TH0123456789A หรือ EF123456789TH"
                  className="bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-navy-primary focus:border-navy-primary font-sans font-semibold uppercase"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  ลิงก์ตรวจสอบสถานะ (Tracking Link)
                </label>
                <input
                  type="url"
                  value={trackUrl}
                  onChange={(e) => setTrackUrl(e.target.value)}
                  placeholder="เช่น https://track.thailandpost.co.th"
                  className="bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-navy-primary focus:border-navy-primary font-mono text-[11px]"
                />
              </div>

              {/* Courier Shortcuts helper */}
              <div className="flex flex-col gap-1.5 bg-blue-50/40 p-3 rounded-lg border border-blue-100/60">
                <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider">⚡ ทางลัดสร้างลิงก์ขนส่งยอดนิยมในไทย</span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (trackNumber.trim()) {
                        setTrackUrl(`https://track.thailandpost.co.th/?track=${trackNumber.toUpperCase().trim()}`);
                      } else {
                        setTrackUrl("https://track.thailandpost.co.th");
                      }
                    }}
                    className="py-1 px-2 bg-white hover:bg-slate-50 text-[10px] font-medium text-slate-700 border border-slate-200 rounded-md transition-colors cursor-pointer text-center"
                  >
                    ไปรษณีย์ไทย
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (trackNumber.trim()) {
                        setTrackUrl(`https://www.flashexpress.co.th/tracking/?track=${trackNumber.trim()}`);
                      } else {
                        setTrackUrl("https://www.flashexpress.co.th/tracking/");
                      }
                    }}
                    className="py-1 px-2 bg-white hover:bg-slate-50 text-[10px] font-medium text-slate-700 border border-slate-200 rounded-md transition-colors cursor-pointer text-center"
                  >
                    Flash Express
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (trackNumber.trim()) {
                        setTrackUrl(`https://th.kerryexpress.com/th/track/?track=${trackNumber.trim()}`);
                      } else {
                        setTrackUrl("https://th.kerryexpress.com/th/track/");
                      }
                    }}
                    className="py-1 px-2 bg-white hover:bg-slate-50 text-[10px] font-medium text-slate-700 border border-slate-200 rounded-md transition-colors cursor-pointer text-center"
                  >
                    Kerry Express
                  </button>
                </div>
              </div>

              <div className="flex gap-2.5 mt-2">
                <button
                  type="button"
                  onClick={() => setEditingTrackingOrder(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-sans font-bold py-2.5 rounded-lg transition-colors cursor-pointer text-center"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submittingTracking || !trackNumber.trim()}
                  className="flex-1 bg-brand-green hover:brightness-110 text-white font-sans font-black py-2.5 rounded-lg shadow-lg shadow-brand-green/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                >
                  {submittingTracking ? (
                    <RefreshCw className="animate-spin" size={13} />
                  ) : (
                    <Save size={13} />
                  )}
                  <span>บันทึกข้อมูล</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* CUSTOMER DETAILS EDIT MODAL */}
      {editingCustomerOrder && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden"
          >
            <div className="bg-navy-primary text-white p-4.5 flex justify-between items-center">
              <h4 className="font-display font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <span>👤 แก้ไขที่อยู่และเบอร์ติดต่อออเดอร์ {editingCustomerOrder.id}</span>
              </h4>
              <button
                onClick={() => setEditingCustomerOrder(null)}
                className="text-slate-300 hover:text-white cursor-pointer transition-colors border-0 bg-transparent"
              >
                ปิด
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="p-5 flex flex-col gap-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  ชื่อผู้ซื้อ / ผู้รับ (Customer Name) *
                </label>
                <input
                  type="text"
                  required
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  placeholder="ระบุชื่อผู้รับสินค้า"
                  className="bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-navy-primary focus:border-navy-primary font-sans font-semibold"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  เบอร์โทรศัพท์ติดต่อ (Contact Phone) *
                </label>
                <input
                  type="tel"
                  required
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  placeholder="ระบุเบอร์ติดต่อสำหรับจัดส่ง"
                  className="bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-navy-primary focus:border-navy-primary font-sans font-semibold"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  ที่อยู่สำหรับจัดส่ง (Shipping Address) *
                </label>
                <textarea
                  required
                  rows={4}
                  value={custAddress}
                  onChange={(e) => setCustAddress(e.target.value)}
                  placeholder="ระบุบ้านเลขที่ ถนน แขวง/ตำบล เขต/อำเภอ จังหวัด รหัสไปรษณีย์"
                  className="bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-navy-primary focus:border-navy-primary font-sans leading-relaxed resize-none"
                />
              </div>

              <div className="flex gap-2.5 mt-2">
                <button
                  type="button"
                  onClick={() => setEditingCustomerOrder(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-sans font-bold py-2.5 rounded-lg transition-colors cursor-pointer text-center"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submittingCustomer || !custName.trim() || !custPhone.trim() || !custAddress.trim()}
                  className="flex-1 bg-brand-green hover:brightness-110 text-white font-sans font-black py-2.5 rounded-lg shadow-lg shadow-brand-green/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                >
                  {submittingCustomer ? (
                    <RefreshCw className="animate-spin" size={13} />
                  ) : (
                    <Save size={13} />
                  )}
                  <span>บันทึกการแก้ไข</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ORDER CANCELLATION MODAL */}
      {cancellingOrder && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden"
          >
            <div className="bg-rose-600 text-white p-5 flex justify-between items-center">
              <h4 className="font-sans font-extrabold text-sm uppercase tracking-wider flex items-center gap-2">
                <span>❌ ระบุหมายเหตุและเหตุผลที่ยกเลิก</span>
              </h4>
              <button
                type="button"
                onClick={() => setCancellingOrder(null)}
                className="text-white/80 hover:text-white cursor-pointer transition-colors border-0 bg-transparent text-xs font-bold"
              >
                ปิด
              </button>
            </div>

            <form onSubmit={handleConfirmCancellation} className="p-6 flex flex-col gap-4 text-xs font-sans">
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 text-xs text-rose-800 leading-relaxed font-sans">
                <span className="font-bold block mb-1">⚠️ คำเตือนการยกเลิกออเดอร์:</span>
                การยกเลิกออเดอร์ [<b>{cancellingOrder.id}</b>] จะส่งผลดังนี้:
                <ul className="list-disc list-inside mt-1.5 space-y-0.5 pl-1 font-medium text-[11px]">
                  <li>สถานะออเดอร์จะเปลี่ยนเป็น <b>ยกเลิก (Cancelled)</b></li>
                  <li>ระบบจะยิงแจ้งเตือนการยกเลิกไปยังกลุ่ม <b>LINE Notify (ฝั่งร้านค้า)</b></li>
                  <li>ระบบจะส่งข้อความแจ้งเตือนยกเลิกไปยัง <b>LINE Simulator (ฝั่งผู้ซื้อ)</b></li>
                </ul>
              </div>

              <div className="flex flex-col gap-1.5 mt-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  ระบุเหตุผล / หมายเหตุการยกเลิก *
                </label>
                <textarea
                  required
                  rows={3}
                  value={cancelReasonInput}
                  onChange={(e) => setCancelReasonInput(e.target.value)}
                  placeholder="เช่น ลูกค้าแจ้งโอนเงินล่าช้า / ขอยกเลิกรายการสั่งซื้อ / สินค้าหมดชั่วคราว"
                  className="bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-rose-500 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/10 font-sans leading-relaxed resize-none transition-all"
                />
              </div>

              <div className="flex gap-3 mt-3">
                <button
                  type="button"
                  onClick={() => setCancellingOrder(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-sans font-bold py-3 rounded-xl transition-colors cursor-pointer text-center text-xs"
                >
                  ย้อนกลับ
                </button>
                <button
                  type="submit"
                  disabled={submittingCancellation || !cancelReasonInput.trim()}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-sans font-bold py-3 rounded-xl shadow-md shadow-rose-600/10 hover:shadow-rose-600/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 border-0 text-xs"
                >
                  {submittingCancellation ? (
                    <RefreshCw className="animate-spin" size={13} />
                  ) : (
                    <span>ยืนยันยกเลิกออเดอร์</span>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* VALIDATION WARNING MODAL */}
      {validationError && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-55 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden"
          >
            <div className="bg-amber-500 text-white p-5 flex justify-between items-center">
              <h4 className="font-sans font-extrabold text-sm uppercase tracking-wider flex items-center gap-2">
                <span>⚠️ แจ้งเตือนข้อผิดพลาด</span>
              </h4>
              <button
                type="button"
                onClick={() => setValidationError(null)}
                className="text-white/80 hover:text-white cursor-pointer transition-colors border-0 bg-transparent text-xs font-bold"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4 text-xs font-sans text-slate-700">
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-xl p-4 text-xs text-amber-900 leading-relaxed font-sans">
                <span className="text-xl">⚠️</span>
                <div>
                  <span className="font-bold block mb-1">ไม่สามารถเปลี่ยนสถานะได้:</span>
                  {validationError}
                </div>
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setValidationError(null)}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-sans font-bold py-3 rounded-xl transition-all shadow-md shadow-amber-500/10 hover:shadow-amber-500/20 active:scale-95 cursor-pointer text-center text-xs border-0"
                >
                  ตกลง / รับทราบ
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* SHIPPING LABEL MODAL FOR PREVIEW & PRINT */}
      {printingOrder && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto no-print">
          <style>{`
            @media print {
              body {
                background: white !important;
                color: black !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              body > * {
                display: none !important;
              }
              #shipping-label-print-wrapper, #shipping-label-print-wrapper * {
                display: block !important;
              }
              #shipping-label-print-wrapper {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                height: auto !important;
                padding: 30px !important;
                margin: 0 !important;
                box-sizing: border-box !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `}</style>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col md:flex-row h-auto max-h-[90vh]"
          >
            {/* LEFT SIDE: CONTROL PANEL */}
            <div className="w-full md:w-[320px] bg-slate-50 border-r border-slate-150 p-6 flex flex-col gap-5 overflow-y-auto">
              <div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">
                  Shipping Label
                </span>
                <h3 className="font-sans font-extrabold text-slate-800 text-sm flex items-center gap-2 mt-2.5">
                  <Printer size={16} className="text-emerald-500" />
                  <span>พิมพ์ใบปะหน้ากล่อง</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-1 leading-normal font-medium">
                  ระบบได้ปรับปรุงใบปะหน้าให้แสดงเฉพาะข้อมูลที่จำเป็นเพื่อความสวยงามและเป็นส่วนตัวของลูกค้า
                </p>
              </div>

              {/* Print Info Note */}
              <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-4 flex flex-col gap-2">
                <span className="text-[10px] font-bold text-emerald-800 flex items-center gap-1">
                  💡 เคล็ดลับการเซฟเป็นไฟล์ PDF
                </span>
                <p className="text-[10.5px] text-emerald-700 leading-relaxed font-sans">
                  หลังจากกดปุ่มสีเขียวด้านล่าง หน้าต่างสั่งพิมพ์ของเบราว์เซอร์จะเด้งขึ้นมา:
                </p>
                <ol className="list-decimal list-inside text-[10px] text-emerald-700 space-y-1 font-medium pl-1">
                  <li>ในช่อง <span className="font-bold">ปลายทาง (Destination)</span> ให้เลือกเป็น <span className="font-bold underline">บันทึกเป็น PDF (Save as PDF)</span></li>
                  <li>กดปุ่ม <span className="font-bold">บันทึก (Save)</span> เพื่อบันทึกเป็นไฟล์ PDF ลงในเครื่องของคุณได้ทันที!</li>
                </ol>
              </div>

              {/* Privacy summary */}
              <div className="bg-slate-100/80 border border-slate-200/50 rounded-xl p-3.5 text-[10.5px] text-slate-500 leading-relaxed font-sans flex flex-col gap-1.5">
                <p className="font-bold text-slate-700">🔒 ข้อมูลที่ถูกปรับออกอัตโนมัติ:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>เบอร์โทร & ที่อยู่เดิมของผู้ส่ง</li>
                  <li>รายการสินค้า & จำนวนสินค้าทั้งหมด</li>
                  <li>รหัสบาร์โค้ด & ยอดเงินค่าสินค้า</li>
                </ul>
              </div>

              <div className="mt-auto pt-4 border-t border-slate-150 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-sans font-bold py-3 px-4 rounded-xl shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer text-xs"
                >
                  <Printer size={15} />
                  <span>บันทึกเป็น PDF / พิมพ์</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintingOrder(null)}
                  className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-sans font-bold py-2.5 rounded-xl transition-colors cursor-pointer text-center text-xs"
                >
                  ปิดหน้าต่างนี้
                </button>
              </div>
            </div>

            {/* RIGHT SIDE: LIVE PREVIEW SCREEN */}
            <div className="flex-1 bg-slate-100 p-6 flex flex-col items-center justify-center overflow-y-auto min-h-[450px]">
              <span className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest font-sans">
                ตัวอย่างใบปะหน้าจริง (Live Preview)
              </span>

              {/* MINIMAL BEAUTIFUL LABELS */}
              <div className="w-full max-w-[380px] bg-white border border-slate-300 shadow-lg p-6 rounded-lg font-sans text-black flex flex-col gap-6">
                
                {/* Sender Box */}
                <div className="border border-slate-200 p-4 rounded-lg bg-slate-50/50">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    📦 ผู้ส่ง (SENDER)
                  </span>
                  <div className="text-sm font-black text-slate-800">S SHOP</div>
                </div>

                {/* Receiver Box */}
                <div className="border border-slate-200 p-5 rounded-lg bg-white shadow-sm flex flex-col gap-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    🚚 ผู้รับ (RECEIVER)
                  </span>
                  <div>
                    <div className="text-base font-black text-slate-900">
                      คุณ {printingOrder.customerName}
                    </div>
                    <div className="text-xs font-bold text-emerald-600 mt-1.5 bg-emerald-50 px-2 py-0.5 rounded-md w-max">
                      โทร: {printingOrder.customerPhone}
                    </div>
                  </div>
                  
                  <div className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-150 whitespace-pre-line font-medium">
                    {printingOrder.customerAddress}
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* RAW HIDDEN PRINT-ONLY CANVAS CONTAINER (Rendered only on printing state) */}
      {printingOrder && (
        <div id="shipping-label-print-wrapper" className="hidden">
          <div style={{
            fontFamily: "sans-serif",
            color: "#000",
            backgroundColor: "#fff",
            width: "100%",
            maxWidth: "500px",
            margin: "0 auto",
            padding: "24px",
            border: "4px solid #000",
            boxSizing: "border-box",
            borderRadius: "12px"
          }}>
            {/* SENDER BLOCK */}
            <div style={{
              borderBottom: "3px solid #000",
              paddingBottom: "16px",
              marginBottom: "16px"
            }}>
              <div style={{ fontSize: "12px", fontWeight: "bold", textTransform: "uppercase", color: "#444", marginBottom: "4px" }}>
                📦 ผู้ส่ง (SENDER)
              </div>
              <div style={{ fontSize: "20px", fontWeight: "900", letterSpacing: "0.5px" }}>S SHOP</div>
            </div>

            {/* RECEIVER BLOCK */}
            <div style={{
              paddingBottom: "8px"
            }}>
              <div style={{ fontSize: "12px", fontWeight: "bold", textTransform: "uppercase", color: "#444", marginBottom: "8px" }}>
                🚚 ผู้รับ (RECEIVER)
              </div>
              <div style={{ fontSize: "24px", fontWeight: "900", marginBottom: "8px" }}>
                คุณ {printingOrder.customerName}
              </div>
              <div style={{
                fontSize: "18px",
                fontWeight: "900",
                marginTop: "6px",
                marginBottom: "12px",
                padding: "4px 10px",
                border: "2px solid #000",
                display: "inline-block",
                backgroundColor: "#fff"
              }}>
                โทร: {printingOrder.customerPhone}
              </div>
              <div style={{
                fontSize: "15px",
                fontWeight: "bold",
                marginTop: "10px",
                lineHeight: "1.6",
                whiteSpace: "pre-line",
                padding: "16px",
                backgroundColor: "#fcfcfc",
                border: "1px solid #000"
              }}>
                {printingOrder.customerAddress}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper Barcode representation using SVG
const BarcodeSVG = ({ value }: { value: string }) => {
  return (
    <div className="flex flex-col items-center gap-1 select-none">
      <svg className="w-56 h-10" viewBox="0 0 100 20" preserveAspectRatio="none">
        <rect width="100" height="20" fill="white" />
        {Array.from({ length: 40 }).map((_, i) => {
          const charCode = value.charCodeAt(i % value.length) || 0;
          const isWide = (charCode + i) % 3 === 0;
          const isExtraWide = (charCode + i) % 5 === 0;
          const strokeWidth = isExtraWide ? 1.5 : (isWide ? 0.9 : 0.4);
          const x = 5 + (i * 2.2);
          if (x > 95) return null;
          return (
            <line
              key={i}
              x1={x}
              y1="1"
              x2={x}
              y2="19"
              stroke="black"
              strokeWidth={strokeWidth}
            />
          );
        })}
      </svg>
      <span className="font-mono text-[9px] font-bold tracking-widest uppercase text-black">{value}</span>
    </div>
  );
};
