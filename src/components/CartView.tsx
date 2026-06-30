import React, { useState, useEffect } from "react";
import { Product, OrderItem, Coupon } from "../types";
import { Trash2, Plus, Minus, CreditCard, Image as ImageIcon, MapPin, Phone, User, CheckCircle, RefreshCw, Send, ArrowRight, ShieldAlert, UploadCloud, ShoppingCart } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import thailandDataRaw from "thailand-address/lib/database/compressed.json";
import { useTranslation } from "../localization";

interface CartViewProps {
  products: Product[];
  cart: { [key: string]: number };
  onUpdateQuantity: (productId: string, delta: number) => void;
  onClearCart: () => void;
  currentUser: { id: string; name: string; lineUserId?: string } | null;
  onOrderSuccess: (orderId: string) => void;
}

export default function CartView({ products, cart, onUpdateQuantity, onClearCart, currentUser, onOrderSuccess }: CartViewProps) {
  const { t, lang } = useTranslation();
  // Shipping form state
  const [customerName, setCustomerName] = useState(currentUser?.name || "");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");

  // Individual address components states as requested by customer
  const [addrHouse, setAddrHouse] = useState("");
  const [addrSubdistrict, setAddrSubdistrict] = useState("");
  const [addrDistrict, setAddrDistrict] = useState("");
  const [addrProvince, setAddrProvince] = useState("");
  const [addrZipcode, setAddrZipcode] = useState("");

  // Dropdown lists
  const [provinceOptions, setProvinceOptions] = useState<string[]>([]);
  const [districtOptions, setDistrictOptions] = useState<string[]>([]);
  const [subdistrictOptions, setSubdistrictOptions] = useState<string[]>([]);

  const [usePreviousAddress, setUsePreviousAddress] = useState(false);
  const [hasPreviousAddress, setHasPreviousAddress] = useState(false);

  // Coupon state
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponError, setCouponError] = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  // Check if previous address exists on mount or when currentUser changes
  useEffect(() => {
    const key = "last_shipping_info_" + (currentUser?.id || "guest");
    const stored = localStorage.getItem(key);
    setHasPreviousAddress(!!stored);
  }, [currentUser]);

  const handleUsePreviousAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setUsePreviousAddress(checked);
    if (checked) {
      const key = "last_shipping_info_" + (currentUser?.id || "guest");
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          const info = JSON.parse(stored);
          
          if (info.addrZipcode) {
            // Pre-populate dropdown options first to prevent state clearing on render cycle
            const filteredProvinces = thailandDataRaw.filter((item: any) => String(item.zipcode) === info.addrZipcode);
            const uniqueProvinces = Array.from(new Set(filteredProvinces.map((item: any) => item.province_th))).sort() as string[];
            setProvinceOptions(uniqueProvinces);

            const filteredDistricts = thailandDataRaw.filter(
              (item: any) => String(item.zipcode) === info.addrZipcode && item.province_th === info.addrProvince
            );
            const uniqueDistricts = Array.from(new Set(filteredDistricts.map((item: any) => item.district_th))).sort() as string[];
            setDistrictOptions(uniqueDistricts);

            const filteredSubdistricts = thailandDataRaw.filter(
              (item: any) =>
                String(item.zipcode) === info.addrZipcode &&
                item.province_th === info.addrProvince &&
                item.district_th === info.addrDistrict
            );
            const uniqueSubdistricts = Array.from(new Set(filteredSubdistricts.map((item: any) => item.subdistrict_th))).sort() as string[];
            setSubdistrictOptions(uniqueSubdistricts);
          }

          setCustomerName(info.customerName || "");
          setCustomerPhone(info.customerPhone || "");
          setAddrZipcode(info.addrZipcode || "");
          setAddrHouse(info.addrHouse || "");
          setAddrProvince(info.addrProvince || "");
          setAddrDistrict(info.addrDistrict || "");
          setAddrSubdistrict(info.addrSubdistrict || "");
        } catch (err) {
          console.error("Failed to parse previous shipping address", err);
        }
      }
    } else {
      // Clear address fields when unchecked
      setCustomerName(currentUser?.name || "");
      setCustomerPhone("");
      setAddrZipcode("");
      setAddrHouse("");
      setAddrProvince("");
      setAddrDistrict("");
      setAddrSubdistrict("");
      setProvinceOptions([]);
      setDistrictOptions([]);
      setSubdistrictOptions([]);
    }
  };

  // When Zip Code changes, filter Provinces
  useEffect(() => {
    if (addrZipcode) {
      const filtered = thailandDataRaw.filter((item: any) => String(item.zipcode) === addrZipcode);
      const uniqueProvinces = Array.from(
        new Set(filtered.map((item: any) => item.province_th))
      ).sort() as string[];
      setProvinceOptions(uniqueProvinces);

      // Auto-select province if single match, otherwise reset if invalid
      if (uniqueProvinces.length === 1) {
        setAddrProvince(uniqueProvinces[0]);
      } else if (addrProvince && !uniqueProvinces.includes(addrProvince)) {
        setAddrProvince("");
      }
    } else {
      setProvinceOptions([]);
      setAddrProvince("");
      setDistrictOptions([]);
      setAddrDistrict("");
      setSubdistrictOptions([]);
      setAddrSubdistrict("");
    }
  }, [addrZipcode]);

  // When Province changes, filter Districts
  useEffect(() => {
    if (addrZipcode && addrProvince) {
      const filtered = thailandDataRaw.filter(
        (item: any) => String(item.zipcode) === addrZipcode && item.province_th === addrProvince
      );
      const uniqueDistricts = Array.from(
        new Set(filtered.map((item: any) => item.district_th))
      ).sort() as string[];
      setDistrictOptions(uniqueDistricts);

      if (uniqueDistricts.length === 1) {
        setAddrDistrict(uniqueDistricts[0]);
      } else if (addrDistrict && !uniqueDistricts.includes(addrDistrict)) {
        setAddrDistrict("");
      }
    } else if (!addrProvince) {
      setDistrictOptions([]);
      setAddrDistrict("");
      setSubdistrictOptions([]);
      setAddrSubdistrict("");
    }
  }, [addrProvince, addrZipcode]);

  // When District changes, filter Subdistricts
  useEffect(() => {
    if (addrZipcode && addrProvince && addrDistrict) {
      const filtered = thailandDataRaw.filter(
        (item: any) =>
          String(item.zipcode) === addrZipcode &&
          item.province_th === addrProvince &&
          item.district_th === addrDistrict
      );
      const uniqueSubdistricts = Array.from(
        new Set(filtered.map((item: any) => item.subdistrict_th))
      ).sort() as string[];
      setSubdistrictOptions(uniqueSubdistricts);

      if (uniqueSubdistricts.length === 1) {
        setAddrSubdistrict(uniqueSubdistricts[0]);
      } else if (addrSubdistrict && !uniqueSubdistricts.includes(addrSubdistrict)) {
        setAddrSubdistrict("");
      }
    } else if (!addrDistrict) {
      setSubdistrictOptions([]);
      setAddrSubdistrict("");
    }
  }, [addrDistrict, addrProvince, addrZipcode]);

  // Dynamically update and format customerAddress on any address parts change
  useEffect(() => {
    const house = addrHouse.trim();
    const subdist = addrSubdistrict.trim();
    const dist = addrDistrict.trim();
    const prov = addrProvince.trim();
    const zip = addrZipcode.trim();

    if (house || subdist || dist || prov || zip) {
      setCustomerAddress(`${house} ต.${subdist} อ.${dist} จ.${prov} ${zip}`);
    } else {
      setCustomerAddress("");
    }
  }, [addrHouse, addrSubdistrict, addrDistrict, addrProvince, addrZipcode]);
  
  // File upload state (payment slip)
  const [slipBase64, setSlipBase64] = useState<string | null>(null);
  const [slipName, setSlipName] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  // Shop config state
  const [shopConfig, setShopConfig] = useState<any>(null);

  useEffect(() => {
    fetch("/api/line/config")
      .then((res) => res.json())
      .then((data) => {
        if (data.config) {
          setShopConfig(data.config);
        }
      })
      .catch((err) => console.error("Error fetching config inside CartView:", err));
  }, []);

  // Ordering processing state
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Filter out products in cart
  const cartItems = Object.entries(cart)
    .map(([productId, quantity]) => {
      const product = products.find((p) => p.id === productId);
      return { product, quantity };
    })
    .filter((item): item is { product: Product; quantity: number } => !!item.product && item.quantity > 0);

  // Calculation formulas
  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  
  // Dynamic shipping cost based on config
  const shFee = shopConfig?.shippingFee !== undefined ? Number(shopConfig.shippingFee) : 50;
  const freeMin = shopConfig?.freeShippingMin !== undefined ? Number(shopConfig.freeShippingMin) : 1000;
  const shippingCost = subtotal === 0 ? 0 : (subtotal >= freeMin ? 0 : shFee);

  const totalAmount = subtotal + shippingCost;
  const finalAmount = Math.max(0, totalAmount - discountAmount);

  // Dynamic coupon validation/recalculation on subtotal changes
  useEffect(() => {
    if (appliedCoupon) {
      if (appliedCoupon.minSpend !== undefined && subtotal < appliedCoupon.minSpend) {
        setAppliedCoupon(null);
        setDiscountAmount(0);
        setCouponError(
          lang === "th"
            ? `คูปองถูกยกเลิกเนื่องจากยอดสั่งซื้อต่ำกว่าขั้นต่ำ ฿${appliedCoupon.minSpend}`
            : `Coupon cancelled because spend is below minimum of ฿${appliedCoupon.minSpend}`
        );
      } else {
        let newDiscount = 0;
        if (appliedCoupon.discountType === "fixed") {
          newDiscount = Math.min(appliedCoupon.discountValue, subtotal);
        } else {
          newDiscount = Math.round((subtotal * appliedCoupon.discountValue) / 100);
          if (appliedCoupon.maxDiscount !== undefined) {
            newDiscount = Math.min(newDiscount, appliedCoupon.maxDiscount);
          }
        }
        setDiscountAmount(newDiscount);
      }
    }
  }, [subtotal, appliedCoupon]);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setIsValidatingCoupon(true);
    setCouponError("");
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponInput, subtotal })
      });
      const data = await res.json();
      if (!res.ok) {
        setCouponError(
          data.error || (lang === "th" ? "ไม่สามารถใช้งานคูปองนี้ได้" : "This coupon is invalid")
        );
        setAppliedCoupon(null);
        setDiscountAmount(0);
      } else {
        setAppliedCoupon(data.coupon);
        setDiscountAmount(data.discountAmount);
        setCouponInput("");
        setCouponError("");
      }
    } catch (err) {
      console.error("Error validating coupon:", err);
      setCouponError(
        lang === "th" ? "เกิดข้อผิดพลาดในการตรวจสอบคูปอง" : "An error occurred while validating coupon"
      );
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponError("");
  };

  // Handle Drag & Drop upload
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert(lang === "th" ? "กรุณาอัปโหลดรูปภาพเท่านั้น!" : "Please upload image files only!");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setSlipBase64(event.target.result as string);
        setSlipName(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  // Submit Order flow
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      setErrorMessage(
        lang === "th" ? "กรุณากรอกข้อมูลชื่อและเบอร์ติดต่อผู้รับให้ครบถ้วน!" : "Please fill in recipient name and phone number!"
      );
      return;
    }
    const cleanPhone = customerPhone.replace(/\s+/g, "");
    if (cleanPhone.length !== 10 || !/^\d{10}$/.test(cleanPhone)) {
      setErrorMessage(
        lang === "th" ? "เบอร์โทรศัพท์ติดต่อต้องเป็นตัวเลขความยาว 10 หลักเท่านั้น!" : "Phone number must be exactly 10 digits!"
      );
      return;
    }
    if (!addrHouse.trim() || !addrSubdistrict.trim() || !addrDistrict.trim() || !addrProvince.trim() || !addrZipcode.trim()) {
      setErrorMessage(
        lang === "th"
          ? "กรุณากรอกข้อมูลที่อยู่จัดส่งให้ครบทุกช่อง (บ้านเลขที่, ตำบล, อำเภอ, จังหวัด, รหัสไปรษณีย์)!"
          : "Please fill in all shipping address fields (Address, Sub-district, District, Province, Postal Code)!"
      );
      return;
    }
    const cleanZip = addrZipcode.trim();
    if (cleanZip.length !== 5 || !/^\d{5}$/.test(cleanZip)) {
      setErrorMessage(
        lang === "th" ? "รหัสไปรษณีย์จัดส่งต้องเป็นตัวเลขความยาว 5 หลักเท่านั้น!" : "Postal code must be exactly 5 digits!"
      );
      return;
    }
    if (cartItems.length === 0) {
      setErrorMessage(lang === "th" ? "ไม่มีสินค้าในตะกร้า!" : "No items in cart!");
      return;
    }
    if (!slipBase64) {
      setErrorMessage(
        lang === "th"
          ? "กรุณาชำระเงินและแนบหลักฐานการโอนเงิน (สลิป) ก่อนยืนยันคำสั่งซื้อ!"
          : "Please transfer payment and attach payment slip before confirming order!"
      );
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      // 1. Create order in database
      const orderPayload = {
        customerName,
        customerPhone,
        customerAddress,
        items: cartItems.map((item) => ({
          productId: item.product.id,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
        })),
        totalAmount: finalAmount,
        couponCode: appliedCoupon ? appliedCoupon.code : undefined,
        discountAmount: appliedCoupon ? discountAmount : undefined,
      };

      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": currentUser?.id || "",
        },
        body: JSON.stringify(orderPayload),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(
          orderData.error || (lang === "th" ? "ไม่สามารถลงทะเบียนออเดอร์ได้" : "Failed to register order")
        );
      }

      const newOrder = orderData.order;

      // 2. Upload payment slip if provided
      if (slipBase64) {
        const uploadRes = await fetch(`/api/orders/${newOrder.id}/upload-slip`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-User-Id": currentUser?.id || "",
          },
          body: JSON.stringify({ slipBase64 }),
        });
        
        if (!uploadRes.ok) {
          console.error("Warning: Slip upload failed but order is registered.");
        }
      }

      // 3. Dispatch LINE Notification API
      const lineRes = await fetch(`/api/orders/${newOrder.id}/send-line`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!lineRes.ok) {
        console.error("Warning: LINE notification API error.");
      }

      // Save shipping details to localStorage for future use
      const key = "last_shipping_info_" + (currentUser?.id || "guest");
      localStorage.setItem(
        key,
        JSON.stringify({
          customerName,
          customerPhone,
          addrHouse,
          addrSubdistrict,
          addrDistrict,
          addrProvince,
          addrZipcode,
        })
      );

      // Clear the local cart items and move to success screen
      onClearCart();
      onOrderSuccess(newOrder.id);
    } catch (err: any) {
      setErrorMessage(
        err.message ||
          (lang === "th"
            ? "เกิดข้อผิดพลาดระหว่างส่งออเดอร์ กรุณาลองใหม่อีกครั้ง"
            : "An error occurred while submitting order, please try again")
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center shadow-sm max-w-xl mx-auto my-12">
        <ShoppingCart size={32} className="mx-auto text-slate-300 mb-4 animate-pulse" />
        <h3 className="font-sans font-bold text-slate-800 text-sm mb-1">{t("cart_empty_title")}</h3>
        <p className="text-slate-400 text-xs mb-6 max-w-xs mx-auto leading-relaxed">
          {t("cart_empty_desc")}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 pb-12">
      {/* LEFT: Cart list & Shipping Form */}
      <div className="lg:col-span-7 flex flex-col gap-6 lg:gap-8">
        
        {/* Cart Item Cards list */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex justify-between items-center border-b border-slate-50 pb-4 mb-4">
            <h3 className="font-sans font-bold text-slate-800 text-xs flex items-center gap-2">
              <ShoppingCart size={14} className="text-brand-green" />
              {t("cart_title")} ({cartItems.length} {lang === "th" ? "ชิ้น" : "items"})
            </h3>
            <button
              onClick={onClearCart}
              className="text-[10px] font-bold text-rose-500 bg-rose-50 hover:bg-rose-100/80 px-3 py-1.5 rounded-lg transition-colors cursor-pointer border-0"
            >
              {t("cart_clear")}
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {cartItems.map(({ product, quantity }) => (
              <div key={product.id} className="flex gap-4 items-center border-b border-slate-50 pb-4 last:border-0 last:pb-0">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-12 h-12 rounded-xl object-cover bg-slate-50 border border-slate-100"
                  referrerPolicy="no-referrer"
                />
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-sans font-bold text-slate-800 text-xs truncate leading-none mb-1.5">
                    {product.name}
                  </h4>
                  <p className="font-display font-black text-brand-green text-xs leading-none">
                    ฿{product.price.toLocaleString()}
                  </p>
                </div>

                {/* Quantity adjustments */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 p-1 rounded-lg">
                  <button
                    onClick={() => onUpdateQuantity(product.id, -1)}
                    className="p-1 hover:bg-slate-200/50 text-slate-500 rounded-md transition-colors cursor-pointer border-0 bg-transparent"
                  >
                    <Minus size={10} />
                  </button>
                  <span className="text-xs font-bold w-6 text-center font-mono text-slate-700">{quantity}</span>
                  <button
                    onClick={() => onUpdateQuantity(product.id, 1)}
                    disabled={quantity >= product.stock}
                    className="p-1 hover:bg-slate-200/50 text-slate-500 rounded-md transition-colors disabled:opacity-30 cursor-pointer border-0 bg-transparent"
                  >
                    <Plus size={10} />
                  </button>
                </div>

                {/* Single item remove */}
                <button
                  onClick={() => onUpdateQuantity(product.id, -quantity)}
                  className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-xl transition-all cursor-pointer border-0 bg-transparent"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping details input Form */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <h3 className="font-sans font-bold text-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-50 pb-4 mb-4">
            <span className="flex items-center gap-2">
              <User size={14} className="text-brand-green" />
              {t("cart_shipping_title")}
            </span>
            {hasPreviousAddress && (
              <label className="flex items-center gap-2 text-xs font-semibold text-[#29A6FF] bg-sky-50 px-2.5 py-1 rounded-full cursor-pointer select-none border border-sky-100 hover:bg-sky-100/50 transition-colors whitespace-nowrap flex-shrink-0">
                <input
                  type="checkbox"
                  checked={usePreviousAddress}
                  onChange={handleUsePreviousAddressChange}
                  className="rounded border-sky-200 text-[#29A6FF] focus:ring-[#29A6FF] w-3.5 h-3.5 cursor-pointer flex-shrink-0"
                />
                <span className="whitespace-nowrap">{t("cart_use_previous")}</span>
              </label>
            )}
          </h3>

          <form onSubmit={handleCheckout} className="flex flex-col gap-6 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Recipient Name */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <User size={12} className="text-brand-green" /> {t("cart_recipient_name")}
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder={lang === "th" ? "กรอกชื่อ-นามสกุลผู้รับ" : "Enter recipient's name"}
                  className="bg-white border border-slate-200/80 rounded-xl px-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm font-sans"
                />
              </div>

              {/* Mobile Phone */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between gap-1.5 w-full">
                  <span className="flex items-center gap-1.5 whitespace-nowrap"><Phone size={12} className="text-brand-green flex-shrink-0" /> {t("cart_recipient_phone")}</span>
                  <span className="text-rose-500 font-bold text-[9px] uppercase tracking-wider bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100/50 whitespace-nowrap flex-shrink-0">{lang === "th" ? "ต้องครบ 10 หลัก" : "10 digits required"}</span>
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={customerPhone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, "");
                    setCustomerPhone(val);
                  }}
                  placeholder={lang === "th" ? "เช่น 0891234567" : "e.g. 0891234567"}
                  className="bg-white border border-slate-200/80 rounded-xl px-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm font-mono font-bold tracking-wider"
                />
              </div>
            </div>

            {/* Detailed shipping address divided into 5 fields as requested */}
            <div className="flex flex-col gap-4.5 border-t border-slate-100 pt-5">
              <span className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block mb-1">
                📍 {t("cart_shipping_details")}
              </span>

              {/* 1. บ้านเลขที่ */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {t("cart_address_house")}
                </label>
                <input
                  type="text"
                  required
                  value={addrHouse}
                  onChange={(e) => setAddrHouse(e.target.value)}
                  placeholder={lang === "th" ? "เช่น 123/45 หมู่ 6 หมู่บ้านแสนสุข ซอย 9 ถนนพระราม 9" : "e.g. 123/45 Rama 9 Rd."}
                  className="bg-white border border-slate-200/80 rounded-xl px-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm font-sans"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* 1. รหัสไปรษณีย์ */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex justify-between">
                    <span>{t("cart_zipcode")}</span>
                    <span className="text-slate-400 font-normal">{lang === "th" ? "กรอก 5 หลัก" : "5 digits"}</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    value={addrZipcode}
                    onChange={(e) => {
                      // Only allow numbers
                      const val = e.target.value.replace(/[^0-9]/g, "");
                      setAddrZipcode(val);
                    }}
                    placeholder={lang === "th" ? "เช่น 10310" : "e.g. 10310"}
                    className="bg-white border border-slate-200/80 rounded-xl px-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm font-mono font-bold tracking-wider"
                  />
                </div>

                {/* 2. จังหวัด */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {t("cart_province")}
                  </label>
                  <select
                    required
                    disabled={!addrZipcode}
                    value={addrProvince}
                    onChange={(e) => setAddrProvince(e.target.value)}
                    className="bg-white border border-slate-200/80 rounded-xl px-4 py-3 text-xs text-slate-850 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 font-sans cursor-pointer disabled:bg-slate-50 disabled:text-slate-400/80 disabled:cursor-not-allowed transition-all shadow-sm"
                  >
                    <option value="">{lang === "th" ? "-- เลือกจังหวัด --" : "-- Select Province --"}</option>
                    {provinceOptions.map((prov) => (
                      <option key={prov} value={prov}>
                        {prov}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* 3. เขตหรืออำเภอ */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {t("cart_district")}
                  </label>
                  <select
                    required
                    disabled={!addrProvince}
                    value={addrDistrict}
                    onChange={(e) => setAddrDistrict(e.target.value)}
                    className="bg-white border border-slate-200/80 rounded-xl px-4 py-3 text-xs text-slate-850 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 font-sans cursor-pointer disabled:bg-slate-50 disabled:text-slate-400/80 disabled:cursor-not-allowed transition-all shadow-sm"
                  >
                    <option value="">{lang === "th" ? "-- เลือกเขต/อำเภอ --" : "-- Select District --"}</option>
                    {districtOptions.map((dist) => (
                      <option key={dist} value={dist}>
                        {dist}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4. ตำบลหรือแขวง */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {t("cart_subdistrict")}
                  </label>
                  <select
                    required
                    disabled={!addrDistrict}
                    value={addrSubdistrict}
                    onChange={(e) => setAddrSubdistrict(e.target.value)}
                    className="bg-white border border-slate-200/80 rounded-xl px-4 py-3 text-xs text-slate-850 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 font-sans cursor-pointer disabled:bg-slate-50 disabled:text-slate-400/80 disabled:cursor-not-allowed transition-all shadow-sm"
                  >
                    <option value="">{lang === "th" ? "-- เลือกตำบล/แขวง --" : "-- Select Subdistrict --"}</option>
                    {subdistrictOptions.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3.5 bg-rose-50 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2.5 border border-rose-100 shadow-sm">
                <ShieldAlert size={15} className="flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="hidden md:flex items-center gap-2.5 bg-emerald-500/5 text-emerald-600 px-4 py-3.5 rounded-xl border border-emerald-500/10">
              <CheckCircle size={15} className="text-emerald-500 flex-shrink-0 animate-pulse" />
              <p className="text-[10px] leading-relaxed font-semibold font-sans">
                {t("cart_submit_note")}
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* RIGHT: Payment Gateway Simulator & Checkout Totals */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        
        {/* Checkout Cost Totals */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <h3 className="font-sans font-bold text-slate-800 text-xs border-b border-slate-50 pb-3 mb-3.5">
            {t("cart_cost_summary")}
          </h3>

          <div className="flex flex-col gap-2.5 border-b border-slate-50 pb-3.5 mb-3.5 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>{t("cart_subtotal")}</span>
              <span className="font-semibold text-slate-700">฿{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>{t("cart_shipping")}</span>
              <span className="font-semibold text-slate-700">
                {shippingCost === 0 ? (
                  <span className="text-emerald-600 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-md text-[11px] border border-emerald-100/50">{lang === "th" ? "จัดส่งฟรี!" : "Free shipping!"}</span>
                ) : (
                  `฿${shippingCost}`
                )}
              </span>
            </div>

            {/* Coupon discount details row */}
            {discountAmount > 0 && (
              <div className="flex justify-between text-rose-500 font-semibold bg-rose-50/50 px-2.5 py-1.5 rounded-lg border border-rose-100/50">
                <span>{t("cart_coupon_discount")} ({appliedCoupon?.code})</span>
                <span>-฿{discountAmount.toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Coupon Input Form inside Cost Box */}
          <div className="mb-4 text-xs">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              {t("cart_coupon_title")}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                placeholder={lang === "th" ? "ระบุโค้ดคูปอง (เช่น S10)" : "Enter coupon code (e.g. S10)"}
                disabled={!!appliedCoupon || isValidatingCoupon}
                className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-sans focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 font-bold text-slate-800 uppercase placeholder:normal-case disabled:bg-slate-100 disabled:cursor-not-allowed transition-all"
                id="coupon-input"
              />
              {appliedCoupon ? (
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="bg-rose-50 hover:bg-rose-100/70 text-rose-600 border border-rose-200/50 font-bold px-4 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  {lang === "th" ? "ลบออก" : "Remove"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={!couponInput.trim() || isValidatingCoupon}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 rounded-xl text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
                >
                  {isValidatingCoupon ? <RefreshCw size={11} className="animate-spin" /> : (lang === "th" ? "ใช้คูปอง" : "Apply")}
                </button>
              )}
            </div>

            {/* Coupon feedback messages */}
            {couponError && (
              <p className="text-[10px] text-rose-500 font-bold mt-2 flex items-center gap-1" id="coupon-error-msg">
                ⚠️ {couponError}
              </p>
            )}
            {appliedCoupon && (
              <p className="text-[10px] text-emerald-600 font-bold mt-2 flex items-center gap-1" id="coupon-success-msg">
                🎉 {lang === "th" ? `ใช้คูปอง ${appliedCoupon.code} สำเร็จ! ลดทันที ฿${discountAmount.toLocaleString()}` : `Applied coupon ${appliedCoupon.code}! Saved ฿${discountAmount.toLocaleString()}`}
              </p>
            )}
          </div>

          <div className="flex justify-between items-center mb-1 border-t border-slate-50 pt-3">
            <span className="text-xs font-bold text-slate-850">{t("cart_total")}</span>
            <span className="font-display font-black text-lg text-emerald-600">
              ฿{finalAmount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* High-Fidelity Bank Account & QR Code Payment Card */}
        <div className="bg-slate-50 text-slate-800 rounded-3xl p-6 border border-slate-200/60 shadow-sm flex flex-col items-center">
          <div className="flex items-center gap-2 mb-4 bg-white border border-slate-100 px-3.5 py-1.5 rounded-full shadow-sm">
            <CreditCard size={13} className="text-emerald-600" />
            <span className="text-[9px] font-bold text-slate-600 tracking-wide font-sans">
              {t("cart_bank_payment")}
            </span>
          </div>

          {/* Interactive QR Generator or Custom QR Image block */}
          <div className="bg-white p-4.5 rounded-2xl shadow-sm border border-slate-100/70 flex flex-col items-center gap-2 w-48 text-center">
            {shopConfig?.qrCodeUrl ? (
              <div className="w-32 h-32 bg-slate-50 border border-slate-100 rounded-xl p-1.5 flex justify-center items-center overflow-hidden">
                <img
                  src={shopConfig.qrCodeUrl}
                  alt="Payment QR Code"
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>
            ) : (
              /* Simple simulated QR code using CSS Grid / Blocks for visual representation */
              <div className="w-32 h-32 bg-slate-50 border border-slate-100 rounded-xl p-2 flex flex-col justify-center items-center relative overflow-hidden select-none">
                {/* Fake High-Quality QR Grid */}
                <div className="grid grid-cols-4 gap-1.5 w-full h-full opacity-90 p-1">
                  {[...Array(16)].map((_, i) => (
                    <div
                      key={i}
                      className={`rounded-[2px] ${
                        (i % 2 === 0 && i !== 5 && i !== 10) || i === 0 || i === 3 || i === 12 || i === 15
                          ? "bg-[#102A43]"
                          : "bg-transparent"
                      }`}
                    ></div>
                  ))}
                </div>
                <div className="absolute bg-[#102A43] text-white font-sans text-[7px] font-bold px-1.5 py-0.5 rounded shadow">
                  S-SHOP QR
                </div>
              </div>
            )}

            <p className="text-[9px] text-slate-400 font-sans leading-none mt-1">
              {t("cart_cost_summary")}
            </p>
            <span className="font-display font-black text-emerald-600 text-sm leading-none">
              ฿{finalAmount.toLocaleString()}
            </span>
          </div>

          <div className="text-center mt-4 text-slate-500 text-[10px] leading-relaxed w-full max-w-xs">
            <p className="font-bold text-slate-700">{t("cart_bank_info")}</p>
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 mt-2 space-y-1.5 text-left text-xs font-sans text-slate-600 shadow-sm">
              <div className="flex justify-between items-center border-b border-slate-50 pb-1.5">
                <span className="text-slate-400">{t("cart_bank_name")}</span>
                <span className="font-extrabold text-slate-800 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg text-[10.5px]">
                  {shopConfig?.bankName || (lang === "th" ? "กสิกรไทย" : "Kasikornbank")}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-50 pb-1.5">
                <span className="text-slate-400">{t("cart_bank_no")}</span>
                <span className="font-mono font-black text-slate-800 tracking-wide text-[12px]">
                  {shopConfig?.bankAccountNo || "123-4-56789-0"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">{t("cart_bank_account")}</span>
                <span className="font-bold text-slate-800">
                  {shopConfig?.bankAccountName || (lang === "th" ? "บริษัท เอส ช็อป จำกัด" : "S-Shop Co., Ltd.")}
                </span>
              </div>
            </div>
          </div>

          {/* Slip Upload Area */}
          <div className="w-full mt-5 pt-4 border-t border-slate-200/50">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 block text-center">
              {t("cart_attach_slip")}
            </span>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center text-center cursor-pointer transition-all ${
                isDragging
                  ? "border-emerald-500 bg-emerald-500/5 text-emerald-600"
                  : slipBase64
                  ? "border-emerald-500/40 bg-emerald-500/5 text-slate-800"
                  : "border-slate-200 hover:border-slate-300 text-slate-400 bg-white"
              }`}
            >
              <input
                type="file"
                id="slip-upload-input"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="slip-upload-input" className="cursor-pointer w-full flex flex-col items-center">
                {slipBase64 ? (
                  <div className="flex flex-col items-center gap-1.5">
                    <CheckCircle size={20} className="text-emerald-500 animate-bounce" />
                    <span className="text-[10px] font-semibold text-emerald-600 truncate max-w-[200px]">
                      {slipName || (lang === "th" ? "อัปโหลดสลิปสำเร็จ!" : "Upload successful!")}
                    </span>
                    <span className="text-[9px] text-slate-400">{lang === "th" ? "คลิกที่นี่เพื่อเปลี่ยนรูปภาพ" : "Click here to change image"}</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1.5">
                    <UploadCloud size={18} className="text-slate-350" />
                    <span className="text-[10px] font-medium leading-tight">
                      {lang === "th" ? "ลากไฟล์สลิปมาวางที่นี่ หรือ " : "Drag & drop payment slip here, or "}<span className="text-emerald-500 font-semibold underline">{lang === "th" ? "คลิกอัปโหลด" : "click to upload"}</span>
                    </span>
                    <span className="text-[8px] text-slate-400 font-mono">{lang === "th" ? "JPG, PNG ขนาดไม่เกิน 5MB" : "JPG, PNG up to 5MB"}</span>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Confirm Button */}
          <button
            onClick={handleCheckout}
            disabled={submitting}
            className="w-full bg-slate-900 hover:bg-emerald-600 text-white font-sans font-bold text-xs py-3 px-4 rounded-xl mt-6 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 border-0"
          >
            {submitting ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>{lang === "th" ? "กำลังบันทึกและส่งเข้า LINE..." : "Submitting & sending to LINE..."}</span>
              </>
            ) : (
              <>
                <Send size={12} />
                <span>{t("cart_submit")}</span>
                <ArrowRight size={12} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
