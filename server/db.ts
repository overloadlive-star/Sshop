import fs from "fs";
import path from "path";

// Define the file paths
const DB_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "db.json");

// Define TypeScript interfaces for our Database entities
export interface User {
  id: string;
  email: string;
  passwordHash: string; // Simple plain-text or base64 password check for demo simplicity
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

export interface LineConfig {
  lineNotifyToken: string;
  lineChannelAccessToken: string;
  lineChannelSecret: string;
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

export interface FileMetadata {
  id: string;
  userId: string;
  fileName: string;
  fileUrl: string;
  uploadDate: string;
}

export interface Schema {
  users: User[];
  products: Product[];
  orders: Order[];
  lineConfig: LineConfig;
  files: FileMetadata[];
  coupons: Coupon[];
}

// Initial seed products
const SEED_PRODUCTS: Product[] = [
  {
    id: "prod-1",
    name: "S Glass Premium",
    price: 1290,
    description: "แว่นตากรองแสงสีฟ้าอัจฉริยะ เลนส์กรองแสงถนอมสายตา ดีไซน์สไตล์มินิมอล น้ำหนักเบา สวมใส่สบายตลอดวัน",
    imageUrl: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&auto=format&fit=crop&q=60",
    category: "recommended",
    stock: 50,
    createdAt: new Date().toISOString(),
  },
  {
    id: "prod-2",
    name: "S Charger Ultra 100W",
    price: 890,
    description: "หัวชาร์จเร็วเทคโนโลยี GaN กำลังไฟสูงสุด 100W มาพร้อมพอร์ตเชื่อมต่อ 4 ช่อง (3 USB-C, 1 USB-A) ชาร์จพร้อมกันได้รวดเร็วและปลอดภัย",
    imageUrl: "https://images.unsplash.com/photo-1619134778706-7015533a6150?w=600&auto=format&fit=crop&q=60",
    category: "bestseller",
    stock: 120,
    createdAt: new Date().toISOString(),
  },
  {
    id: "prod-3",
    name: "S Mug Smart Temp",
    price: 590,
    description: "แก้วเก็บความร้อน-ความเย็นอัจฉริยะ ผลิตจากสเตนเลสคุณภาพสูง 316 ฝาปิดหน้าจอดิจิทัล LED แสดงอุณหภูมิน้ำด้านในอย่างแม่นยำเพียงปลายนิ้วสัมผัส",
    imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=60",
    category: "promotion",
    stock: 80,
    createdAt: new Date().toISOString(),
  },
  {
    id: "prod-4",
    name: "S Keyboard Mech 75%",
    price: 2490,
    description: "คีย์บอร์ดกลไกไร้สายขนาด 75% สวิตช์สไตล์ Linear เงียบพิเศษ นุ่มละมุนมือ รองรับการเชื่อมต่อ Bluetooth / 2.4G / Type-C พร้อมไฟ RGB สวยงาม",
    imageUrl: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=60",
    category: "bestseller",
    stock: 35,
    createdAt: new Date().toISOString(),
  },
  {
    id: "prod-5",
    name: "S Mouse Ergonomic Silent",
    price: 790,
    description: "เมาส์ไร้สายแบบเออร์โกโนมิกส์ ออกแบบมาเพื่อรับสรีระมือ ลดความเมื่อยล้า คลิกเงียบกริบไร้เสียงรบกวน เชื่อมต่อได้ไหลลื่นผ่านสัญญาณดองเกิล 2.4G",
    imageUrl: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600&auto=format&fit=crop&q=60",
    category: "recommended",
    stock: 90,
    createdAt: new Date().toISOString(),
  },
  {
    id: "prod-6",
    name: "S Sleeve Leather Tech",
    price: 690,
    description: "ซองหนังพรีเมียมบุผ้าไมโครไฟเบอร์ชั้นดี ด้านนอกเป็นหนัง PU คัดเกรด กันน้ำและกันรอยขีดข่วนอย่างดีเยี่ยม เหมาะสำหรับแล็ปท็อปขนาด 13-14 นิ้ว",
    imageUrl: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&auto=format&fit=crop&q=60",
    category: "promotion",
    stock: 40,
    createdAt: new Date().toISOString(),
  }
];

const DEFAULT_USERS: User[] = [
  {
    id: "user-admin",
    email: "admin@sshop.com",
    passwordHash: "admin1234", // Simple demo string checking
    name: "S Shop Administrator",
    role: "admin",
    createdAt: new Date().toISOString(),
  },
  {
    id: "user-customer",
    email: "customer@gmail.com",
    passwordHash: "user1234",
    name: "สมชาย รักดี (LINE User)",
    role: "customer",
    lineUserId: "U1234567890abcdef1234567890abcdef",
    lineDisplayName: "Somchai LINE",
    linePictureUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=60",
    createdAt: new Date().toISOString(),
  }
];

const DEFAULT_CONFIG: LineConfig = {
  lineNotifyToken: "",
  lineChannelAccessToken: "",
  lineChannelSecret: "",
  enabled: true,
  storeName: "S Shop Online Official",
  notificationMethod: "notify",
  adminLineUserId: "",
  promptPayId: "",
  promptPayName: "",
  bankName: "กสิกรไทย",
  bankAccountNo: "123-4-56789-0",
  bankAccountName: "บริษัท เอส ช็อป จำกัด",
  qrCodeUrl: "",
  shippingFee: 50,
  freeShippingMin: 1000,
  storePhone: "02-123-4567",
  storeAddress: "123/45 อาคารเอสทาวเวอร์ ถนนพระราม 9 แขวงห้วยขวาง เขตห้วยขวาง กรุงเทพฯ 10310",
  templateNewOrder: `🛍️ *ออเดอร์ใหม่เข้ามาแล้ว!* [{orderId}]\n---------------------------------\n👤 ลูกค้า: {customerName}\n📞 เบอร์โทร: {customerPhone}\n📍 ที่อยู่จัดส่ง: {customerAddress}\n---------------------------------\n📦 รายการสินค้า:\n{itemsText}\n---------------------------------\n💰 ยอดรวมทั้งหมด: {totalAmount} บาท\n💳 สถานะชำระเงิน: {paymentStatus}\n🚚 สถานะจัดส่ง: {shippingStatus}`,
  templateTracking: `{statusEmoji} *{statusText}* [ออเดอร์ {orderId}]\n---------------------------------\n👤 ลูกค้า: {customerName}\n📞 เบอร์โทร: {customerPhone}\n---------------------------------\n🚚 สถานะจัดส่ง: {shippingStatus}\n📋 เลขพัสดุ (Tracking): {trackingNumber}\n🔗 ลิงก์ติดตามพัสดุ: {trackingUrl}\n---------------------------------\n🙏 ขอบคุณที่ใช้บริการ S Shop Online!`,
  templateCancel: `❌ *ออเดอร์ถูกยกเลิก!* [ออเดอร์ {orderId}]\n---------------------------------\n👤 ลูกค้า: คุณ {customerName}\n📞 เบอร์โทร: {customerPhone}\n💰 ยอดรวม: {totalAmount} บาท\n---------------------------------\n⚠️ สถานะจัดส่ง: ยกเลิกออเดอร์ (Cancelled)\n💬 หมายเหตุที่ยกเลิก: {cancelReason}`,
  useRichMessage: true,
  // Default UI presets
  logoUrl: "",
  primaryColor: "emerald",
  themeMode: "light",
  heroTitle: "S Shop Online Official",
  heroSubtitle: "Premium Quality Products",
  heroDescription: "แบรนด์สินค้าพรีเมียมคุณภาพสูง คัดสรรสินค้าดีไซน์สวยงาม ทนทาน และฟังก์ชันตอบโจทย์ทุกไลฟ์สไตล์ มั่นใจได้ในบริการหลังการขายและการส่งพัสดุที่รวดเร็วฉับไว",
  heroBgStart: "#29A6FF",
  heroBgEnd: "#3CD69E",
  footerText: "© 2026 S Shop Online. All rights reserved.",
  footerDescription: "เราคัดสรรสินค้าที่ดีที่สุดสำหรับคุณ พร้อมบริการส่งถึงหน้าบ้านและรับประกันความพึงพอใจ"
};

const SEED_COUPONS: Coupon[] = [
  {
    id: "coupon-1",
    code: "WELCOME100",
    discountType: "fixed",
    discountValue: 100,
    minSpend: 500,
    usageLimit: 100,
    usageCount: 0,
    expiryDate: "2026-12-31",
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "coupon-2",
    code: "S10",
    discountType: "percent",
    discountValue: 10,
    minSpend: 0,
    maxDiscount: 200,
    usageLimit: 500,
    usageCount: 0,
    expiryDate: "2026-12-31",
    isActive: true,
    createdAt: new Date().toISOString()
  }
];

// Database class
export class JSONDatabase {
  private static instance: JSONDatabase;
  private data: Schema = {
    users: [],
    products: [],
    orders: [],
    lineConfig: DEFAULT_CONFIG,
    files: [],
    coupons: [],
  };

  private constructor() {
    this.initDatabase();
  }

  public static getInstance(): JSONDatabase {
    if (!JSONDatabase.instance) {
      JSONDatabase.instance = new JSONDatabase();
    }
    return JSONDatabase.instance;
  }

  private initDatabase() {
    try {
      // Ensure data directory exists
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }

      // Check if file exists, if not create with defaults
      if (!fs.existsSync(DB_FILE)) {
        this.data = {
          users: DEFAULT_USERS,
          products: SEED_PRODUCTS,
          orders: [],
          lineConfig: DEFAULT_CONFIG,
          files: [],
          coupons: SEED_COUPONS,
        };
        this.save();
        console.log("Database initialized with seed data at:", DB_FILE);
      } else {
        const fileContent = fs.readFileSync(DB_FILE, "utf-8");
        const parsed = JSON.parse(fileContent);
        this.data = {
          users: parsed.users || DEFAULT_USERS,
          products: parsed.products || SEED_PRODUCTS,
          orders: parsed.orders || [],
          lineConfig: parsed.lineConfig || DEFAULT_CONFIG,
          files: parsed.files || [],
          coupons: parsed.coupons || SEED_COUPONS,
        };
      }
    } catch (error) {
      console.error("Error initializing JSON Database:", error);
    }
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (error) {
      console.error("Error saving JSON Database:", error);
    }
  }

  // --- USERS ---
  public getUsers(): User[] {
    return this.data.users;
  }

  public getUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public getUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public createUser(user: Omit<User, "id" | "createdAt">): User {
    const newUser: User = {
      ...user,
      id: "user-" + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    };
    this.data.users.push(newUser);
    this.save();
    return newUser;
  }

  public updateLineProfile(userId: string, lineProfile: { lineUserId: string; displayName: string; pictureUrl?: string }) {
    const userIndex = this.data.users.findIndex((u) => u.id === userId);
    if (userIndex !== -1) {
      this.data.users[userIndex] = {
        ...this.data.users[userIndex],
        lineUserId: lineProfile.lineUserId,
        lineDisplayName: lineProfile.displayName,
        linePictureUrl: lineProfile.pictureUrl || this.data.users[userIndex].linePictureUrl,
      };
      this.save();
    }
  }

  // --- PRODUCTS ---
  public getProducts(): Product[] {
    return this.data.products;
  }

  public getProductById(id: string): Product | undefined {
    return this.data.products.find((p) => p.id === id);
  }

  public createProduct(product: Omit<Product, "id" | "createdAt">): Product {
    const newProduct: Product = {
      ...product,
      id: "prod-" + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    };
    this.data.products.push(newProduct);
    this.save();
    return newProduct;
  }

  public updateProduct(id: string, updatedFields: Partial<Product>): Product | undefined {
    const index = this.data.products.findIndex((p) => p.id === id);
    if (index === -1) return undefined;
    this.data.products[index] = {
      ...this.data.products[index],
      ...updatedFields,
    };
    this.save();
    return this.data.products[index];
  }

  public deleteProduct(id: string): boolean {
    const initialLen = this.data.products.length;
    this.data.products = this.data.products.filter((p) => p.id !== id);
    if (this.data.products.length < initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // --- ORDERS ---
  public getOrders(): Order[] {
    return this.data.orders;
  }

  public getOrdersByCustomerId(customerId: string): Order[] {
    return this.data.orders.filter((o) => o.customerId === customerId);
  }

  public getOrderById(id: string): Order | undefined {
    return this.data.orders.find((o) => o.id === id);
  }

  public createOrder(order: Omit<Order, "id" | "createdAt" | "shippingStatus" | "paymentStatus" | "lineNotificationStatus">): Order {
    const newOrder: Order = {
      ...order,
      id: "ORD-" + Math.floor(100000 + Math.random() * 900000), // Standard ORD-XXXXXX format
      paymentStatus: "pending",
      shippingStatus: "pending",
      lineNotificationStatus: "none",
      createdAt: new Date().toISOString(),
    };
    this.data.orders.push(newOrder);
    this.save();
    return newOrder;
  }

  public updateOrder(id: string, updatedFields: Partial<Order>): Order | undefined {
    const index = this.data.orders.findIndex((o) => o.id === id);
    if (index === -1) return undefined;
    this.data.orders[index] = {
      ...this.data.orders[index],
      ...updatedFields,
    };
    this.save();
    return this.data.orders[index];
  }

  // --- LINE CONFIG ---
  public getLineConfig(): LineConfig {
    return this.data.lineConfig;
  }

  public updateLineConfig(config: Partial<LineConfig>): LineConfig {
    this.data.lineConfig = {
      ...this.data.lineConfig,
      ...config,
    };
    this.save();
    return this.data.lineConfig;
  }

  // --- FILES ---
  public getFiles(): FileMetadata[] {
    return this.data.files;
  }

  public getFilesByUserId(userId: string): FileMetadata[] {
    return this.data.files.filter((f) => f.userId === userId);
  }

  public addFile(file: Omit<FileMetadata, "id" | "uploadDate">): FileMetadata {
    const newFile: FileMetadata = {
      ...file,
      id: "file-" + Math.random().toString(36).substr(2, 9),
      uploadDate: new Date().toISOString(),
    };
    this.data.files.push(newFile);
    this.save();
    return newFile;
  }

  // --- COUPONS ---
  public getCoupons(): Coupon[] {
    return this.data.coupons || [];
  }

  public getCouponById(id: string): Coupon | undefined {
    return (this.data.coupons || []).find((c) => c.id === id);
  }

  public getCouponByCode(code: string): Coupon | undefined {
    if (!code) return undefined;
    return (this.data.coupons || []).find((c) => c.code.toUpperCase() === code.trim().toUpperCase());
  }

  public createCoupon(coupon: Omit<Coupon, "id" | "createdAt" | "usageCount">): Coupon {
    const newCoupon: Coupon = {
      ...coupon,
      id: "coupon-" + Math.random().toString(36).substr(2, 9),
      usageCount: 0,
      createdAt: new Date().toISOString(),
    };
    if (!this.data.coupons) this.data.coupons = [];
    this.data.coupons.push(newCoupon);
    this.save();
    return newCoupon;
  }

  public updateCoupon(id: string, updatedFields: Partial<Coupon>): Coupon | undefined {
    if (!this.data.coupons) this.data.coupons = [];
    const index = this.data.coupons.findIndex((c) => c.id === id);
    if (index === -1) return undefined;
    this.data.coupons[index] = {
      ...this.data.coupons[index],
      ...updatedFields,
    };
    this.save();
    return this.data.coupons[index];
  }

  public deleteCoupon(id: string): boolean {
    if (!this.data.coupons) return false;
    const initialLen = this.data.coupons.length;
    this.data.coupons = this.data.coupons.filter((c) => c.id !== id);
    if (this.data.coupons.length < initialLen) {
      this.save();
      return true;
    }
    return false;
  }
}

export const dbInstance = JSONDatabase.getInstance();
