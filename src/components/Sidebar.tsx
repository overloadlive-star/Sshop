import { ShoppingBag, ShoppingCart, History, Settings2, UserCheck, Shield, LogOut, Key, X } from "lucide-react";
import { User, LineConfig } from "../types";
import { useTranslation } from "../localization";

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  currentUser: User | null;
  onLogout: () => void;
  cartCount: number;
  isOpen: boolean;
  onClose: () => void;
  shopConfig?: LineConfig | null;
}

export default function Sidebar({ currentTab, setCurrentTab, currentUser, onLogout, cartCount, isOpen, onClose, shopConfig }: SidebarProps) {
  const { t, lang } = useTranslation();

  const themeMode = shopConfig?.themeMode || "light";

  const sidebarStyles = {
    light: {
      aside: "bg-white text-slate-800 border-r border-slate-200/80",
      sectionHeader: "text-slate-400",
      subLabel: "text-slate-400",
      btnActive: "bg-slate-50 text-slate-850 border border-slate-200/60 shadow-sm",
      btnInactive: "text-slate-500 hover:bg-slate-50/50 hover:text-slate-850",
      divider: "bg-slate-100",
      title: "text-slate-800",
      accentBadge: "text-navy-primary bg-sky-50 border border-sky-100",
      footer: "border-t border-slate-100 bg-slate-50/50 text-slate-800",
      footerText: "text-slate-500",
      footerEmail: "text-slate-400",
      lineBadge: "bg-sky-50 border border-sky-100 text-sky-700"
    },
    dark: {
      aside: "bg-slate-900 text-slate-100 border-r border-slate-800",
      sectionHeader: "text-slate-500",
      subLabel: "text-slate-500",
      btnActive: "bg-slate-800 text-white border border-slate-700 shadow-sm",
      btnInactive: "text-slate-400 hover:bg-slate-850 hover:text-slate-100",
      divider: "bg-slate-800",
      title: "text-slate-100",
      accentBadge: "text-emerald-400 bg-emerald-950/40 border border-emerald-900/60",
      footer: "border-t border-slate-800 bg-slate-850 text-slate-200",
      footerText: "text-slate-400",
      footerEmail: "text-slate-500",
      lineBadge: "bg-emerald-950/40 border border-emerald-900/40 text-emerald-400"
    },
    navy: {
      aside: "bg-indigo-950 text-indigo-100 border-r border-indigo-900",
      sectionHeader: "text-indigo-400/80",
      subLabel: "text-indigo-400/60",
      btnActive: "bg-indigo-900 text-white border border-indigo-800 shadow-sm",
      btnInactive: "text-indigo-300 hover:bg-indigo-900/50 hover:text-indigo-100",
      divider: "bg-indigo-900",
      title: "text-indigo-100",
      accentBadge: "text-sky-300 bg-sky-950/40 border border-sky-900/60",
      footer: "border-t border-indigo-900 bg-indigo-900/55 text-indigo-100",
      footerText: "text-indigo-300",
      footerEmail: "text-indigo-400/80",
      lineBadge: "bg-indigo-900 border border-indigo-850 text-indigo-300"
    },
    warm: {
      aside: "bg-[#FAFAF5] text-amber-950 border-r border-amber-200/40",
      sectionHeader: "text-amber-800/60",
      subLabel: "text-amber-700/50",
      btnActive: "bg-amber-100/50 text-amber-950 border border-amber-200 shadow-sm",
      btnInactive: "text-amber-850/85 hover:bg-amber-150 hover:text-amber-950",
      divider: "bg-amber-200/30",
      title: "text-amber-950",
      accentBadge: "text-amber-700 bg-amber-50 border border-amber-200",
      footer: "border-t border-amber-100 bg-amber-50/50 text-amber-900",
      footerText: "text-amber-800/80",
      footerEmail: "text-amber-700/60",
      lineBadge: "bg-amber-100/60 border border-amber-200 text-amber-800"
    }
  }[themeMode as "light" | "dark" | "navy" | "warm"];

  // Accent primary colors for active icon
  const getAccentIconClass = (isActive: boolean) => {
    if (!isActive) return "text-slate-400";
    
    const colorId = shopConfig?.primaryColor || "emerald";
    const accentColorMap: { [key: string]: string } = {
      emerald: "text-emerald-500",
      indigo: "text-indigo-600",
      sky: "text-sky-500",
      rose: "text-rose-500",
      amber: "text-amber-500",
      violet: "text-violet-600"
    };
    return accentColorMap[colorId] || "text-emerald-500";
  };

  const getAccentBadgeClass = (isActive: boolean) => {
    if (isActive) {
      const colorId = shopConfig?.primaryColor || "emerald";
      const badgeBgMap: { [key: string]: string } = {
        emerald: "bg-emerald-500 text-white",
        indigo: "bg-indigo-600 text-white",
        sky: "bg-sky-500 text-white",
        rose: "bg-rose-500 text-white",
        amber: "bg-amber-500 text-slate-950",
        violet: "bg-violet-600 text-white"
      };
      return badgeBgMap[colorId] || "bg-emerald-500 text-white";
    }
    return "bg-slate-100 text-slate-500 border border-slate-200/50";
  };

  const getLoginButtonClass = () => {
    const colorId = shopConfig?.primaryColor || "emerald";
    const btnMap: { [key: string]: string } = {
      emerald: "bg-emerald-500 shadow-emerald-500/10 hover:bg-emerald-600",
      indigo: "bg-indigo-600 shadow-indigo-600/10 hover:bg-indigo-700",
      sky: "bg-sky-500 shadow-sky-500/10 hover:bg-sky-600",
      rose: "bg-rose-500 shadow-rose-500/10 hover:bg-rose-600",
      amber: "bg-amber-500 shadow-amber-500/10 hover:bg-amber-600 text-slate-950",
      violet: "bg-violet-600 shadow-violet-600/10 hover:bg-violet-700"
    };
    return btnMap[colorId] || "bg-emerald-500 hover:bg-emerald-600";
  };

  const menuItems = [
    { id: "shop", label: t("sidebar_storefront"), icon: ShoppingBag, badge: null },
    { id: "cart", label: t("sidebar_cart"), icon: ShoppingCart, badge: cartCount > 0 ? cartCount : null },
    { id: "orders", label: t("sidebar_orders"), icon: History, badge: null },
  ];

  const adminItems = [
    { id: "admin-dashboard", label: t("sidebar_management"), icon: Shield, badge: null },
    { id: "shop-settings", label: t("sidebar_shop_settings"), icon: Settings2, badge: null },
    { id: "line-setup", label: t("sidebar_line_setup"), icon: Settings2, badge: null },
  ];

  const storeWords = (shopConfig?.storeName || "S SHOP ONLINE").split(" ");
  const firstWord = storeWords[0] || "S";
  const remainingWords = storeWords.slice(1).join(" ") || "SHOP ONLINE";

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      <aside
        id="sidebar-navigation"
        className={`fixed inset-y-0 left-0 z-50 w-60 flex flex-col flex-shrink-0 h-full shadow-lg md:shadow-sm md:static md:translate-x-0 transition-all duration-300 ease-in-out ${sidebarStyles.aside} ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {shopConfig?.logoUrl ? (
                <img src={shopConfig.logoUrl} alt="Logo" className="w-8 h-8 rounded-xl object-cover shadow-sm border border-slate-200/50" referrerPolicy="no-referrer" />
              ) : null}
              <h1 className="font-display font-black text-sm tracking-tight flex flex-col leading-tight select-none">
                <span className={`uppercase truncate max-w-[130px] ${sidebarStyles.title}`}>{firstWord}</span>
                <span className={`text-[8.5px] font-bold tracking-wider font-mono uppercase truncate max-w-[130px] opacity-80 ${sidebarStyles.subLabel}`}>
                  {remainingWords}
                </span>
              </h1>
            </div>
            <button
              onClick={onClose}
              className="md:hidden p-1.5 text-slate-500 hover:bg-slate-150 rounded-lg cursor-pointer"
              title={lang === "th" ? "ปิดเมนู" : "Close Menu"}
            >
              <X size={16} />
            </button>
          </div>
          <p className={`text-[9px] font-medium mt-2 font-sans opacity-70 ${sidebarStyles.subLabel}`}>LINE Integration Premium Store</p>
          <div className={`h-[1px] w-full mt-3 ${sidebarStyles.divider}`}></div>
        </div>

        {/* Main Navigation */}
        <div className="flex-1 px-4 py-3 flex flex-col gap-1.5 overflow-y-auto">
          <span className={`px-2.5 text-[9px] font-bold uppercase tracking-widest font-mono mb-1 ${sidebarStyles.sectionHeader}`}>
            {t("sidebar_customer_menu")}
          </span>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? sidebarStyles.btnActive
                    : `${sidebarStyles.btnInactive} border border-transparent`
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon size={13} className={getAccentIconClass(isActive)} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== null && (
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${getAccentBadgeClass(isActive)}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Admin Navigation (Shown only if logged in as admin) */}
          {currentUser?.role === "admin" && (
            <>
              <div className="mt-4 mb-1">
                <span className={`px-2.5 text-[9px] font-bold uppercase tracking-widest font-mono ${sidebarStyles.sectionHeader}`}>
                  {t("sidebar_admin_menu")}
                </span>
              </div>
              {adminItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentTab(item.id);
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                      isActive
                        ? sidebarStyles.btnActive
                        : `${sidebarStyles.btnInactive} border border-transparent`
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon size={13} className={getAccentIconClass(isActive)} />
                      <span>{item.label}</span>
                    </div>
                  </button>
                );
              })}
            </>
          )}
        </div>

        {/* User Session Footer Card */}
        <div className={`p-4 mt-auto ${sidebarStyles.footer}`}>
          {currentUser ? (
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0 border border-slate-300/45 overflow-hidden">
                  {currentUser.linePictureUrl ? (
                    <img src={currentUser.linePictureUrl} alt={currentUser.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-display font-semibold text-xs text-emerald-500">
                      {currentUser.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-xs leading-none truncate">
                    {currentUser.name}
                  </h4>
                  <p className={`text-[9px] truncate mt-0.5 ${sidebarStyles.footerText}`}>
                    {currentUser.role === "admin"
                      ? (lang === "th" ? "👑 ผู้ดูแลระบบ" : "👑 Admin")
                      : (lang === "th" ? "👤 ลูกค้าสมาชิก" : "👤 Member")}
                  </p>
                </div>
              </div>

              {/* Line connected label */}
              <div className={`px-2.5 py-1 rounded-lg text-center ${sidebarStyles.lineBadge}`}>
                <span className="text-[8px] font-bold tracking-wide">{t("sidebar_connected_line")}</span>
              </div>
              
              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg border border-slate-250 hover:bg-rose-50 hover:border-rose-150 hover:text-rose-500 text-[9px] font-bold transition-all cursor-pointer"
              >
                <LogOut size={10} />
                <span>{t("sidebar_logout")}</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  setCurrentTab("auth");
                  onClose();
                }}
                className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold text-white transition-all cursor-pointer shadow-sm border-0 ${getLoginButtonClass()}`}
              >
                <Key size={12} className="text-white" />
                <span>{t("sidebar_login")}</span>
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
