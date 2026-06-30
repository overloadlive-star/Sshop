import { useState } from "react";
import { Product, LineConfig } from "../types";
import { Sparkles, Flame, Percent, RefreshCw, ShoppingCart, Info, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "../localization";

interface ShopViewProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  cart: { [key: string]: number };
  shopConfig?: LineConfig | null;
}

type TabType = "all" | "promotion" | "bestseller" | "recommended";

export default function ShopView({ products, onAddToCart, cart, shopConfig }: ShopViewProps) {
  const { t, lang } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [addingId, setAddingId] = useState<string | null>(null);

  // Theme Accent colors matching
  const primaryColorId = shopConfig?.primaryColor || "emerald";

  const colorMap: { [key: string]: { btnActive: string; text: string; bgLight: string; borderHover: string } } = {
    emerald: {
      btnActive: "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/10",
      text: "text-emerald-500 group-hover:text-emerald-600",
      bgLight: "bg-emerald-50 text-emerald-700",
      borderHover: "hover:border-emerald-500/35"
    },
    indigo: {
      btnActive: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/10",
      text: "text-indigo-600 group-hover:text-indigo-700",
      bgLight: "bg-indigo-50 text-indigo-700",
      borderHover: "hover:border-indigo-600/35"
    },
    sky: {
      btnActive: "bg-sky-500 hover:bg-sky-600 text-white shadow-sky-500/10",
      text: "text-sky-500 group-hover:text-sky-600",
      bgLight: "bg-sky-50 text-sky-700",
      borderHover: "hover:border-sky-500/35"
    },
    rose: {
      btnActive: "bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/10",
      text: "text-rose-500 group-hover:text-rose-600",
      bgLight: "bg-rose-50 text-rose-700",
      borderHover: "hover:border-rose-500/35"
    },
    amber: {
      btnActive: "bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/10",
      text: "text-amber-500 group-hover:text-amber-600",
      bgLight: "bg-amber-50 text-amber-800",
      borderHover: "hover:border-amber-500/35"
    },
    violet: {
      btnActive: "bg-violet-600 hover:bg-violet-700 text-white shadow-violet-600/10",
      text: "text-violet-600 group-hover:text-violet-700",
      bgLight: "bg-violet-50 text-violet-700",
      borderHover: "hover:border-violet-600/35"
    }
  };

  const activeColor = colorMap[primaryColorId] || colorMap.emerald;

  // Tabs structure
  const tabs = [
    { id: "all", label: t("shop_all_products"), icon: null },
    { id: "promotion", label: t("shop_promotions"), icon: Percent },
    { id: "bestseller", label: t("shop_bestsellers"), icon: Flame },
  ];

  // Filtering products
  const filteredProducts = products.filter((product) => {
    const matchesTab = activeTab === "all" || product.category === activeTab;
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleAddToCartClick = (product: Product) => {
    setAddingId(product.id);
    onAddToCart(product);
    setTimeout(() => {
      setAddingId(null);
    }, 850);
  };

  return (
    <div id="shop-container" className="flex flex-col h-full overflow-y-auto pb-12">
      {/* Dynamic Header Promo Banner */}
      <div 
        className="rounded-2xl p-6 md:p-8 mb-8 text-white relative overflow-hidden shadow-sm border border-white/10"
        style={{ background: `linear-gradient(to right, ${shopConfig?.heroBgStart || "#29A6FF"}, ${shopConfig?.heroBgEnd || "#3CD69E"})` }}
      >
        <div className="relative z-10 max-w-xl">
          <span className="text-[9.5px] uppercase font-black tracking-widest bg-white/90 text-slate-800 px-3 py-1.5 rounded-full shadow-sm">
            {shopConfig?.heroSubtitle || t("shop_subtitle")}
          </span>
          <h2 className="text-xl md:text-2xl font-display font-black tracking-tight mt-4 mb-2 leading-tight text-white drop-shadow-sm">
            {shopConfig?.heroTitle || t("shop_title")}
          </h2>
          <p className="text-xs text-white/95 font-sans leading-relaxed">
            {shopConfig?.heroDescription || t("shop_desc")}
          </p>
        </div>
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-15 pointer-events-none hidden md:block">
          <div className="w-full h-full bg-gradient-to-l from-white to-transparent"></div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="mb-8 bg-slate-50/50 p-4 rounded-2xl border border-slate-200/45 flex justify-center sm:justify-start">
        <div className="flex flex-wrap gap-2.5 justify-center sm:justify-start items-center">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer border ${
                  isActive
                    ? `${activeColor.btnActive} border-transparent shadow-md scale-[1.02]`
                    : "bg-white text-slate-600 border-slate-200/60 hover:border-slate-350 hover:bg-slate-50 shadow-sm"
                }`}
              >
                {TabIcon ? (
                  <TabIcon size={14} className={isActive ? "text-white" : "text-slate-400"} />
                ) : (
                  <Sparkles size={14} className={isActive ? "text-white" : activeColor.text.split(" ")[0]} />
                )}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Product Grid */}
      <AnimatePresence mode="popLayout">
        {filteredProducts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm"
          >
            <Info size={32} className="mx-auto text-slate-350 mb-2" />
            <p className="text-slate-600 text-sm font-semibold">
              {lang === "th" ? "ไม่พบสินค้าในหมวดหมู่ที่ระบุ" : "No products found in this category"}
            </p>
            <p className="text-slate-400 text-xs mt-1">
              {lang === "th" ? "ลองเปลี่ยนหมวดหมู่ตัวกรองดูอีกครั้ง" : "Try changing your filter settings"}
            </p>
          </motion.div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredProducts.map((product) => {
              const inCartCount = cart[product.id] || 0;
              const isAdding = addingId === product.id;
              
              const isBestseller = product.category === "bestseller";
              const isPromotion = product.category === "promotion";
              const isRecommended = product.category === "recommended";

              return (
                <motion.div
                  layout
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className={`bg-white rounded-3xl border border-slate-100 ${activeColor.borderHover} hover:shadow-xl hover:shadow-slate-200/35 transition-all duration-300 flex flex-col overflow-hidden relative group`}
                >
                  {/* Product Image Panel */}
                  <div className="h-56 w-full bg-slate-50 relative overflow-hidden">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Category badges overlay */}
                    <div className="absolute left-3.5 top-3.5 flex flex-col gap-1.5 z-10">
                      {isBestseller && (
                        <span className="flex items-center gap-1.5 text-[9px] font-black tracking-wider bg-amber-500 text-white px-3 py-1.5 rounded-full uppercase shadow-md shadow-amber-500/10">
                          <Flame size={10} className="fill-white" /> BESTSELLER
                        </span>
                      )}
                      {isPromotion && (
                        <span className="flex items-center gap-1.5 text-[9px] font-black tracking-wider bg-rose-500 text-white px-3 py-1.5 rounded-full uppercase shadow-md shadow-rose-500/10">
                          <Percent size={10} /> PROMOTION
                        </span>
                      )}
                      {isRecommended && (
                        <span className="flex items-center gap-1.5 text-[9px] font-black tracking-wider bg-indigo-650 text-white px-3 py-1.5 rounded-full uppercase shadow-md shadow-indigo-650/10">
                          <Sparkles size={10} /> RECOMMENDED
                        </span>
                      )}
                    </div>

                    {/* Stock status overlay */}
                    {product.stock <= 5 && product.stock > 0 && (
                      <span className="absolute right-3.5 top-3.5 text-[9.5px] font-bold bg-rose-550 text-rose-500 border border-rose-100 bg-white px-3 py-1 rounded-full uppercase shadow-sm">
                        {lang === "th" ? `เหลือเพียง ${product.stock} ชิ้น!` : `Only ${product.stock} left!`}
                      </span>
                    )}
                    {product.stock === 0 && (
                      <div className="absolute inset-0 bg-white/70 flex items-center justify-center backdrop-blur-[2px] z-20">
                        <span className="text-slate-700 text-xs font-black bg-white/95 border border-slate-200 px-4 py-2 rounded-2xl shadow-lg">
                          {t("shop_out_of_stock")}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Product Detail Panel */}
                  <div className="p-6 flex-1 flex flex-col justify-between bg-white relative">
                    <div>
                      <h3 className={`font-sans font-bold text-slate-800 text-sm md:text-base leading-snug line-clamp-1 transition-colors ${activeColor.text}`}>
                        {product.name}
                      </h3>
                      <p className="text-xs text-slate-400 font-sans mt-2 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>
                    </div>

                    <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between">
                      {/* Price tag */}
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">
                          {lang === "th" ? "ราคา" : "Price"}
                        </span>
                        <span className="font-display font-black text-slate-800 text-base leading-none">
                          ฿{product.price.toLocaleString()}
                        </span>
                      </div>

                      {/* Add to Cart button */}
                      <button
                        onClick={() => handleAddToCartClick(product)}
                        disabled={product.stock === 0}
                        className={`relative flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-350 cursor-pointer border-0 ${
                          product.stock === 0
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                            : isAdding
                            ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                            : "bg-slate-900 text-white hover:brightness-110 hover:shadow-lg"
                        }`}
                      >
                        {isAdding ? (
                          <>
                            <CheckCircle size={13} className="animate-bounce text-white" />
                            <span>{lang === "th" ? "เพิ่มแล้ว!" : "Added!"}</span>
                          </>
                        ) : (
                          <>
                            <ShoppingCart size={13} />
                            <span>{lang === "th" ? "หยิบใส่ตะกร้า" : "Add to Cart"}</span>
                            {inCartCount > 0 && (
                              <span className="absolute -top-2 -right-2 bg-emerald-500 text-white border-2 border-white w-5.5 h-5.5 rounded-full flex items-center justify-center text-[9px] font-black leading-none shadow-md">
                                {inCartCount}
                              </span>
                            )}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Customizable Footer Area */}
      <div className="mt-20 border-t border-slate-200/50 pt-10 text-center text-slate-400 font-sans select-none max-w-2xl mx-auto w-full px-4">
        <div className="flex flex-col items-center gap-3">
          {shopConfig?.logoUrl ? (
            <img 
              src={shopConfig.logoUrl} 
              alt="Store Logo" 
              className="w-10 h-10 rounded-2xl object-cover shadow-sm grayscale opacity-75 hover:grayscale-0 hover:opacity-100 transition-all border border-slate-150" 
              referrerPolicy="no-referrer" 
            />
          ) : null}
          <h4 className="font-display font-black text-xs text-slate-600 tracking-wider uppercase mt-1">
            {shopConfig?.storeName || "S Shop Online Official"}
          </h4>
          <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
            {shopConfig?.footerDescription || "เราคัดสรรสินค้าที่ดีที่สุดสำหรับคุณ พร้อมบริการส่งถึงหน้าบ้านและรับประกันความความพึงพอใจและสินค้าคุณภาพสูงเสมอ"}
          </p>
          <span className="text-[9px] text-slate-400 font-mono tracking-tight mt-6 block">
            {shopConfig?.footerText || "© 2026 S Shop Online. All rights reserved."}
          </span>
        </div>
      </div>
    </div>
  );
}
