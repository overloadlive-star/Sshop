import { useState, useEffect } from "react";
import { User, Product, Order, LineLog, LineConfig } from "./types";
import Sidebar from "./components/Sidebar.tsx";
import LineSimulator from "./components/LineSimulator.tsx";
import ShopView from "./components/ShopView.tsx";
import CartView from "./components/CartView.tsx";
import AdminView from "./components/AdminView.tsx";
import LineSetupView from "./components/LineSetupView.tsx";
import AuthView from "./components/AuthView.tsx";
import OrdersHistoryView from "./components/OrdersHistoryView.tsx";
import ShopSettingsView from "./components/ShopSettingsView.tsx";
import { ShoppingBag, RefreshCw, Key, ShieldAlert, CheckCircle, ArrowRight, Bell, Smartphone, ShoppingCart, Star, Menu } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Language, LanguageContext, translations } from "./localization";

export default function App() {
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem("s_shop_lang");
    return (saved === "th" || saved === "en") ? saved : "th";
  });

  const handleSetLang = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem("s_shop_lang", newLang);
  };

  const t = (key: keyof typeof translations["th"]) => {
    return translations[lang]?.[key] || translations["th"][key] || key;
  };

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("s_shop_user");
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        console.error("Stale user session cleared.");
      }
    }
    return null;
  });

  const [currentTab, setCurrentTab] = useState<string>(() => {
    const savedUser = localStorage.getItem("s_shop_user");
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        if (user && user.role === "admin") {
          return "admin-dashboard";
        }
      } catch (e) {}
    }
    return "shop";
  });

  const [cart, setCart] = useState<{ [productId: string]: number }>({});
  const [shopConfig, setShopConfig] = useState<LineConfig | null>(null);
  
  // Loaded collections
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [lineLogs, setLineLogs] = useState<LineLog[]>([]);

  // Page level statuses
  const [loadingData, setLoadingData] = useState(true);
  const [successOrderId, setSuccessOrderId] = useState<string | null>(null);
  const [showSimPanelOnMobile, setShowSimPanelOnMobile] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [autoLoginBanner, setAutoLoginBanner] = useState<string | null>(null);

  // Load user session and pull data
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const lineUserId = params.get("lineUserId");
    
    if (lineUserId) {
      setLoadingData(true);
      fetch(`/api/auth/line-autologin?lineUserId=${encodeURIComponent(lineUserId)}`)
        .then((res) => {
          if (!res.ok) throw new Error("Auto-login failed");
          return res.json();
        })
        .then((data) => {
          if (data.user) {
            handleLoginSuccess(data.user);
            setAutoLoginBanner(data.user.name);
            // Clean up the URL to keep it pretty
            const url = new URL(window.location.href);
            url.searchParams.delete("lineUserId");
            window.history.replaceState({}, document.title, url.pathname + url.search);
          }
          fetchInitialData();
        })
        .catch((err) => {
          console.error("LINE Auto-login failed:", err);
          fetchInitialData();
        });
    } else {
      fetchInitialData();
    }
  }, []);

  // Sync data when user state changes (admin load all orders vs customer load customer's orders)
  useEffect(() => {
    if (currentUser) {
      fetchOrders();
    } else {
      setOrders([]);
    }
  }, [currentUser]);

  const handleLiffLogin = async (profile: { userId: string; displayName: string; pictureUrl?: string }) => {
    try {
      const response = await fetch("/api/auth/line-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: profile.userId,
          displayName: profile.displayName,
          pictureUrl: profile.pictureUrl,
        }),
      });
      const data = await response.json();
      if (response.ok && data.user) {
        handleLoginSuccess(data.user);
      }
    } catch (err) {
      console.error("[LIFF] Error logging in via backend API:", err);
    }
  };

  // Initialize LIFF if a real LINE Login LIFF ID is configured
  useEffect(() => {
    if (shopConfig && shopConfig.lineLiffId) {
      const liff = (window as any).liff;
      if (liff) {
        console.log("[LIFF] Initializing LIFF with ID:", shopConfig.lineLiffId);
        liff.init({ liffId: shopConfig.lineLiffId })
          .then(() => {
            console.log("[LIFF] LIFF Initialized successfully!");
            if (liff.isLoggedIn()) {
              liff.getProfile().then((profile: any) => {
                console.log("[LIFF] User is logged into LINE via LIFF:", profile.displayName);
                handleLiffLogin(profile);
              }).catch((err: any) => {
                console.error("[LIFF] Error getting LIFF profile:", err);
              });
            }
          })
          .catch((err: any) => {
            console.error("[LIFF] LIFF initialization failed:", err);
          });
      }
    }
  }, [shopConfig]);

  const fetchInitialData = async () => {
    setLoadingData(true);
    try {
      await Promise.all([fetchProducts(), fetchLineLogs(), fetchShopConfig()]);
      if (currentUser || localStorage.getItem("s_shop_user")) {
        await fetchOrders();
      }
    } catch (err) {
      console.error("Error loading application states:", err);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchShopConfig = async () => {
    try {
      const response = await fetch("/api/line/config");
      const data = await response.json();
      if (response.ok && data.config) {
        setShopConfig(data.config);
      }
    } catch (e) {
      console.error("Failed to load shop configuration:", e);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products");
      const data = await response.json();
      if (response.ok && data.products) {
        setProducts(data.products);
      }
    } catch (e) {
      console.error("Failed to load products list:", e);
    }
  };

  const fetchOrders = async () => {
    const savedUserStr = localStorage.getItem("s_shop_user");
    const userId = currentUser?.id || (savedUserStr ? JSON.parse(savedUserStr).id : "");
    if (!userId) return;

    try {
      const response = await fetch("/api/orders", {
        headers: { "X-User-Id": userId },
      });
      const data = await response.json();
      if (response.ok && data.orders) {
        setOrders(data.orders);
      }
    } catch (e) {
      console.error("Failed to fetch orders:", e);
    }
  };

  const fetchLineLogs = async () => {
    try {
      const response = await fetch("/api/line/logs");
      const data = await response.json();
      if (response.ok && data.logs) {
        setLineLogs(data.logs);
      }
    } catch (e) {
      console.error("Failed to pull LINE simulator logs:", e);
    }
  };

  // CART HANDLERS
  const handleAddToCart = (product: Product) => {
    setCart((prevCart) => {
      const currentQty = prevCart[product.id] || 0;
      return {
        ...prevCart,
        [product.id]: currentQty + 1,
      };
    });
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart((prevCart) => {
      const newQty = (prevCart[productId] || 0) + delta;
      if (newQty <= 0) {
        const updated = { ...prevCart };
        delete updated[productId];
        return updated;
      }
      return {
        ...prevCart,
        [productId]: newQty,
      };
    });
  };

  const handleClearCart = () => {
    setCart({});
  };

  // SESSION HANDLERS
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem("s_shop_user", JSON.stringify(user));
    setCart({}); // Clear guest cart on login to start fresh
    if (user.role === "admin") {
      setCurrentTab("admin-dashboard");
    } else {
      setCurrentTab("shop");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("s_shop_user");
    setCart({});
    setCurrentTab("shop");
    setSuccessOrderId(null);
  };

  const totalCartCount = (Object.values(cart) as number[]).reduce((sum: number, qty: number) => sum + qty, 0);
  const cartSubtotal = Object.entries(cart).reduce((sum: number, [productId, qty]) => {
    const prod = products.find((p) => p.id === productId);
    return sum + (prod ? prod.price * Number(qty) : 0);
  }, 0);

  // Render view router helper
  const renderTabContent = () => {
    if (successOrderId) {
      const successfulOrder = orders.find((o) => o.id === successOrderId);
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl border border-slate-200 p-8 max-w-xl mx-auto text-center my-6 shadow-xl"
        >
          <div className="w-16 h-16 rounded-full bg-sky-50 text-[#29A6FF] flex items-center justify-center mx-auto mb-4 border border-sky-100">
            <CheckCircle size={36} className="animate-bounce" />
          </div>
          
          <span className="text-[10px] font-bold tracking-widest text-[#29A6FF] bg-sky-50 border border-sky-100 px-3 py-1 rounded-full font-mono uppercase">
            Order Submitted
          </span>

          <h3 className="font-display font-black text-slate-900 text-lg md:text-xl mt-4 mb-2">
            {t("success_order_title")} #{successOrderId}
          </h3>
          
          <p className="text-slate-500 text-xs leading-relaxed max-w-md mx-auto mb-6">
            {t("success_order_desc")}
          </p>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-250/60 text-left mb-6 font-sans">
            <h5 className="font-bold text-[11px] text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Smartphone size={13} className="text-[#29A6FF]" /> {t("success_order_summary")}
            </h5>
            <div className="text-[10px] text-slate-500 leading-normal max-h-[150px] overflow-y-auto whitespace-pre-wrap bg-white p-2.5 rounded border border-slate-200">
              {lineLogs[0]?.message || `Order summary for ID ${successOrderId}`}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => {
                setSuccessOrderId(null);
                setCurrentTab("orders");
              }}
              className="px-5 py-2.5 bg-slate-950 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              {t("success_view_history")}
            </button>
            <button
              onClick={() => {
                setSuccessOrderId(null);
                setCurrentTab("shop");
              }}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              {t("success_continue")}
            </button>
          </div>
        </motion.div>
      );
    }

    switch (currentTab) {
      case "shop":
        return <ShopView products={products} onAddToCart={handleAddToCart} cart={cart} shopConfig={shopConfig} />;
      case "cart":
        return (
          <CartView
            products={products}
            cart={cart}
            onUpdateQuantity={handleUpdateQuantity}
            onClearCart={handleClearCart}
            currentUser={currentUser}
            onOrderSuccess={(orderId) => {
              fetchOrders();
              fetchLineLogs();
              setSuccessOrderId(null);
              setCurrentTab("orders");
            }}
          />
        );
      case "orders":
        return (
          <OrdersHistoryView
            orders={orders}
            products={products}
            onRefreshData={fetchOrders}
            currentUser={currentUser}
          />
        );
       case "admin-dashboard":
        if (currentUser?.role !== "admin") {
          return <ShopView products={products} onAddToCart={handleAddToCart} cart={cart} shopConfig={shopConfig} />;
        }
        return (
          <AdminView
            products={products}
            orders={orders}
            onRefreshData={fetchInitialData}
            currentUser={currentUser}
            onNavigateTab={setCurrentTab}
          />
        );
      case "shop-settings":
        if (currentUser?.role !== "admin") {
          return <ShopView products={products} onAddToCart={handleAddToCart} cart={cart} shopConfig={shopConfig} />;
        }
        return (
          <ShopSettingsView
            currentUser={currentUser}
            onRefreshData={fetchInitialData}
          />
        );
      case "line-setup":
        if (currentUser?.role !== "admin") {
          return <ShopView products={products} onAddToCart={handleAddToCart} cart={cart} shopConfig={shopConfig} />;
        }
        return <LineSetupView currentUser={currentUser} />;
      case "auth":
        return <AuthView onLoginSuccess={handleLoginSuccess} currentUser={currentUser} shopConfig={shopConfig} />;
      default:
        return <ShopView products={products} onAddToCart={handleAddToCart} cart={cart} shopConfig={shopConfig} />;
    }
  };

  const themeMode = shopConfig?.themeMode || "light";
  
  const themeClasses = {
    light: {
      wrapper: "bg-[#F3F9FF] text-slate-855",
      header: "bg-white border-b border-slate-200 text-slate-800",
      workspace: "bg-[#F1F7FC]",
      headerTitle: "text-slate-800"
    },
    dark: {
      wrapper: "bg-slate-950 text-slate-100",
      header: "bg-slate-900 border-b border-slate-800 text-slate-100",
      workspace: "bg-slate-950",
      headerTitle: "text-slate-100"
    },
    navy: {
      wrapper: "bg-indigo-950 text-indigo-100",
      header: "bg-indigo-950 border-b border-indigo-900 text-indigo-100",
      workspace: "bg-slate-950",
      headerTitle: "text-indigo-100"
    },
    warm: {
      wrapper: "bg-[#FAF8F5] text-amber-950",
      header: "bg-[#FCFCFA] border-b border-amber-200/40 text-amber-950",
      workspace: "bg-[#FAF8F5]",
      headerTitle: "text-amber-950"
    }
  }[themeMode as "light" | "dark" | "navy" | "warm"];

  const getHeaderAccentClass = () => {
    const colorId = shopConfig?.primaryColor || "emerald";
    const headerAccentMap: { [key: string]: string } = {
      emerald: "text-emerald-500",
      indigo: "text-indigo-600",
      sky: "text-sky-500",
      rose: "text-rose-500",
      amber: "text-amber-500",
      violet: "text-violet-600"
    };
    return headerAccentMap[colorId] || "text-emerald-500";
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang: handleSetLang, t }}>
      <div className={`flex h-screen overflow-hidden antialiased select-none font-sans ${themeClasses.wrapper}`}>
        
        {/* 1. SIDEBAR (NAVY BLUE) */}
        <Sidebar
          currentTab={currentTab}
          setCurrentTab={(tab) => {
            setSuccessOrderId(null);
            setCurrentTab(tab);
          }}
          currentUser={currentUser}
          onLogout={handleLogout}
          cartCount={totalCartCount}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          shopConfig={shopConfig}
        />

        {/* 2. MAIN APPLICATION CONTENT COLUMN */}
        <main className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
          
          {/* Main Header Bar */}
          <header className={`h-16 md:h-20 flex items-center justify-between px-4 md:px-10 shadow-sm z-10 flex-shrink-0 border-b ${themeClasses.header}`}>
            <div className="flex items-center gap-2.5 md:gap-3">
              {/* Hamburger Button for Mobile */}
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                title={lang === "th" ? "เปิดเมนู" : "Open Menu"}
              >
                <Menu size={18} />
              </button>

              <h2 className={`font-display font-black text-xs md:text-sm uppercase tracking-wider truncate max-w-[180px] sm:max-w-none ${getHeaderAccentClass()}`}>
                {currentTab === "shop" && t("header_storefront")}
                {currentTab === "cart" && t("header_cart")}
                {currentTab === "orders" && t("header_orders")}
                {currentTab === "admin-dashboard" && t("header_admin")}
                {currentTab === "shop-settings" && t("header_settings")}
                {currentTab === "line-setup" && t("header_line")}
                {currentTab === "auth" && (currentUser ? t("header_profile") : t("header_auth"))}
              </h2>
            </div>

            {/* Quick Info & Controls */}
            <div className="flex items-center gap-2 md:gap-3">
              {/* Quick Guest login / member sign in tag if not logged in */}
              {!currentUser && (
                <span className="hidden xl:inline-block text-[11px] text-brand-green bg-brand-green/10 px-3 py-1.5 border border-brand-green/20 rounded-md font-sans font-medium">
                  {t("header_recommend")}
                </span>
              )}
              
              {/* Language Switcher Buttons */}
              <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200 shadow-inner">
                <button
                  onClick={() => handleSetLang("th")}
                  className={`px-2 py-1 text-[10px] font-black rounded transition-all cursor-pointer ${
                    lang === "th"
                      ? "bg-white text-navy-primary shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  TH
                </button>
                <button
                  onClick={() => handleSetLang("en")}
                  className={`px-2 py-1 text-[10px] font-black rounded transition-all cursor-pointer ${
                    lang === "en"
                      ? "bg-white text-navy-primary shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  EN
                </button>
              </div>

              {/* Mobile LINE simulator toggle trigger button (Admin only) */}
              {currentUser?.role === "admin" && (
                <button
                  onClick={() => setShowSimPanelOnMobile(!showSimPanelOnMobile)}
                  className="lg:hidden flex items-center gap-1 bg-brand-green hover:brightness-110 text-white px-2.5 py-1.5 md:px-3 md:py-2 rounded-lg text-xs font-bold cursor-pointer transition-all shadow-sm"
                >
                  <Smartphone size={12} />
                  <span className="hidden sm:inline">{showSimPanelOnMobile ? t("btn_hide_line") : t("btn_show_line")}</span>
                  <span className="inline sm:hidden">{lang === "th" ? "จำลอง LINE" : "LINE Sim"}</span>
                </button>
              )}
            </div>
          </header>

          {/* Scrollable Work-View Workspace */}
          <div className={`flex-1 overflow-y-auto px-4 md:px-10 py-6 md:py-8 ${themeClasses.workspace}`}>
            {currentUser && currentUser.role !== "admin" && orders.some(o => o.customerId === currentUser.id && o.paymentStatus === "pending") && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setCurrentTab("orders")}
                className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4.5 py-3.5 rounded-xl flex items-center justify-between gap-3 text-xs shadow-md hover:scale-[1.01] hover:border-red-350 hover:bg-red-50/80 transition-all cursor-pointer font-sans"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
                  </span>
                  <p className="font-bold leading-relaxed">
                    {lang === "th" 
                      ? "🔔 คุณมีออเดอร์ใหม่รอระบุที่อยู่จัดส่งและชำระเงิน! กรุณาคลิกที่นี่เพื่อไปหน้าจัดการใบเสร็จ" 
                      : "🔔 You have a pending order waiting for shipping details and payment! Click here to manage."}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="bg-red-600 text-white font-extrabold text-[9px] px-2.5 py-1 rounded-full uppercase tracking-wider animate-bounce shadow-sm">
                    {lang === "th" ? "กรอกที่อยู่และจ่ายเงิน" : "Pay & Fill Info"}
                  </span>
                </div>
              </motion.div>
            )}

            {autoLoginBanner && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3.5 rounded-xl mb-6 flex items-center justify-between text-xs font-semibold shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-emerald-500 flex-shrink-0" />
                  <span>
                    {lang === "th" 
                      ? `✨ เข้าสู่ระบบผ่าน LINE สำเร็จแล้ว! ยินดีต้อนรับคุณ ${autoLoginBanner}` 
                      : `✨ Successfully logged in via LINE! Welcome, ${autoLoginBanner}`}
                  </span>
                </div>
                <button 
                  onClick={() => setAutoLoginBanner(null)}
                  className="text-emerald-500 hover:text-emerald-700 font-bold ml-2 text-[10px] uppercase tracking-wider"
                >
                  {lang === "th" ? "ปิด" : "Close"}
                </button>
              </motion.div>
            )}
            {loadingData ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <RefreshCw className="animate-spin text-slate-400 mb-2" size={24} />
                <span className="text-xs font-medium">{t("loading_data")}</span>
              </div>
            ) : (
              renderTabContent()
            )}
          </div>
        </main>

        {/* 3. RIGHT HAND SIDE: LIVE HIGH-FIDELITY LINE NOTIFICATIONS SIMULATOR (DESKTOP COMPANION - Admin only) */}
        {currentUser?.role === "admin" && (
          <div className="hidden lg:block w-[360px] p-6 bg-white border-l border-slate-200 h-full flex-shrink-0 overflow-y-auto">
            <div className="sticky top-0">
              <LineSimulator logs={lineLogs} onRefresh={fetchLineLogs} />
            </div>
          </div>
        )}

        {/* MOBILE FLOATING DRAWER FOR SIMULATOR (Admin only) */}
        <AnimatePresence>
          {showSimPanelOnMobile && currentUser?.role === "admin" && (
            <div className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[1px] lg:hidden flex justify-end">
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 220 }}
                className="bg-slate-900 w-full max-w-[340px] h-full p-4 shadow-2xl relative flex flex-col justify-center"
              >
                <button
                  onClick={() => setShowSimPanelOnMobile(false)}
                  className="absolute top-4 left-4 bg-slate-800 hover:bg-slate-700 text-slate-400 p-2 rounded-xl text-xs font-bold cursor-pointer"
                >
                  {lang === "th" ? "← ปิดจำลอง" : "← Close Sim"}
                </button>
                <div className="mt-8">
                  <LineSimulator logs={lineLogs} onRefresh={fetchLineLogs} />
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MOBILE & TABLET FLOATING CART BUTTON */}
        <AnimatePresence>
          {totalCartCount > 0 && currentTab !== "cart" && (
            <motion.div
              initial={{ scale: 0, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0, opacity: 0, y: 50 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="fixed bottom-6 right-6 z-30 md:hidden"
              id="mobile-floating-cart-container"
            >
              <button
                onClick={() => {
                  setSuccessOrderId(null);
                  setCurrentTab("cart");
                }}
                className="flex items-center gap-2.5 bg-navy-primary hover:bg-navy-secondary text-white px-5 py-3.5 rounded-full shadow-xl shadow-navy-primary/30 border border-white/10 font-sans font-bold text-xs transition-all cursor-pointer active:scale-95"
                id="mobile-floating-cart-btn"
              >
                <div className="relative">
                  <ShoppingCart size={16} className="text-white" />
                  <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white">
                    {totalCartCount}
                  </span>
                </div>
                <span>{lang === "th" ? `ตะกร้าสินค้า (${totalCartCount})` : `Cart (${totalCartCount})`}</span>
                <span className="text-[#29A6FF] font-extrabold border-l border-white/20 pl-2">
                  ฿{cartSubtotal.toLocaleString()}
                </span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </LanguageContext.Provider>
  );
}
