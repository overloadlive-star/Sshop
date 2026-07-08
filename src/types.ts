export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "customer";
  lineUserId?: string;
  lineDisplayName?: string;
  linePictureUrl?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  imageUrl: string;
  category: "promotion" | "bestseller" | "recommended" | "general";
  stock: number;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: OrderItem[];
  totalAmount: number;
  paymentStatus: "pending" | "verifying" | "paid" | "failed";
  paymentSlipUrl?: string;
  shippingStatus: "pending" | "shipped" | "delivered" | "cancelled";
  lineNotificationStatus: "sent" | "failed" | "none";
  createdAt: string;
  trackingNumber?: string;
  trackingUrl?: string;
  cancelReason?: string;
  couponCode?: string;
  discountAmount?: number;
}

export interface LineConfig {
  lineNotifyToken: string;
  lineChannelAccessToken: string;
  lineChannelSecret: string;
  lineLiffId?: string;
  enabled: boolean;
  storeName: string;
  notificationMethod?: "notify" | "oa";
  adminLineUserId?: string;
  // General Shop Settings
  promptPayId?: string;
  promptPayName?: string;
  bankName?: string;
  bankAccountNo?: string;
  bankAccountName?: string;
  qrCodeUrl?: string;
  shippingFee?: number;
  freeShippingMin?: number;
  storePhone?: string;
  storeAddress?: string;
  // Custom templates
  templateNewOrder?: string;
  templateTracking?: string;
  templateCancel?: string;
  useRichMessage?: boolean;
  // UI Customization Settings
  logoUrl?: string;
  primaryColor?: string; // "emerald" | "indigo" | "sky" | "rose" | "amber" | "violet"
  themeMode?: "light" | "dark" | "navy" | "warm";
  heroTitle?: string;
  heroSubtitle?: string;
  heroDescription?: string;
  heroBgStart?: string;
  heroBgEnd?: string;
  footerText?: string;
  footerDescription?: string;
}

export interface LineLog {
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

export interface CustomerSummary {
  id: string;
  name: string;
  email: string;
  lineDisplayName: string;
  linePictureUrl?: string;
  lineUserId?: string;
  createdAt: string;
  ordersCount: number;
  totalSpent: number;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  minSpend?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usageCount: number;
  expiryDate?: string;
  isActive: boolean;
  createdAt: string;
}
