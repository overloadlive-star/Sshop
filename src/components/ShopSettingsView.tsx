import React, { useState, useEffect, useRef } from "react";
import { LineConfig, User } from "../types";
import { Settings2, Phone, MapPin, CreditCard, Truck, Sparkles, Save, RefreshCw, CheckCircle, ShieldAlert, Store, Upload, X, QrCode, Image as ImageIcon, Palette, Layout, Paintbrush, Sun, Moon } from "lucide-react";
import { motion } from "motion/react";
import { useTranslation } from "../localization";

interface ShopSettingsViewProps {
  currentUser: User | null;
  onRefreshData?: () => void;
}

export default function ShopSettingsView({ currentUser, onRefreshData }: ShopSettingsViewProps) {
  const { t, lang } = useTranslation();
  const [config, setConfig] = useState<LineConfig>({
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
    bankAccountNo: "",
    bankAccountName: "",
    qrCodeUrl: "",
    shippingFee: 50,
    freeShippingMin: 1000,
    storePhone: "",
    storeAddress: ""
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [isQrDragging, setIsQrDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleQrCodeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        alert(lang === "th" ? "ขนาดไฟล์ใหญ่เกินไป กรุณาอัปโหลดไฟล์ขนาดไม่เกิน 2MB" : "File size is too large. Please upload files under 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setConfig(prev => ({ ...prev, qrCodeUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleQrDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsQrDragging(true);
  };

  const handleQrDragLeave = () => {
    setIsQrDragging(false);
  };

  const handleQrDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsQrDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert(lang === "th" ? "ขนาดไฟล์ใหญ่เกินไป กรุณาอัปโหลดไฟล์ขนาดไม่เกิน 2MB" : "File size is too large. Please upload files under 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setConfig(prev => ({ ...prev, qrCodeUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const clearQrCode = () => {
    setConfig(prev => ({ ...prev, qrCodeUrl: "" }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Load config on mount
  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/line/config");
      const data = await response.json();
      if (response.ok && data.config) {
        setConfig(data.config);
      }
    } catch (err) {
      console.error("Error fetching shop settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser?.role !== "admin") {
      setSaveStatus("error");
      setStatusMessage(
        lang === "th"
          ? "ขออภัย: เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถแก้ไขตั้งค่าร้านค้านี้ได้"
          : "Sorry: Only administrators (Admin) can modify these store settings."
      );
      return;
    }

    setSaving(true);
    setSaveStatus("idle");
    setStatusMessage("");

    try {
      const response = await fetch("/api/line/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": currentUser?.id || "",
        },
        body: JSON.stringify(config),
      });

      const data = await response.json();
      if (response.ok) {
        setSaveStatus("success");
        setStatusMessage(
          lang === "th"
            ? "บันทึกการตั้งค่าร้านค้าสำเร็จเรียบร้อยแล้ว!"
            : "Store configurations saved successfully!"
        );
        if (data.config) {
          setConfig(data.config);
        }
        if (onRefreshData) {
          onRefreshData();
        }
      } else {
        setSaveStatus("error");
        setStatusMessage(
          data.error ||
            (lang === "th" ? "เกิดข้อผิดพลาดในการบันทึกข้อมูล" : "An error occurred while saving details.")
        );
      }
    } catch (err) {
      setSaveStatus("error");
      setStatusMessage(
        lang === "th"
          ? "เชื่อมต่อเซิร์ฟเวอร์ล้มเหลว กรุณาลองใหม่อีกครั้ง"
          : "Connection failed. Please check backend connection and try again."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <RefreshCw size={32} className="text-emerald-500 animate-spin" />
        <p className="text-slate-500 text-xs font-semibold">
          {lang === "th" ? "กำลังโหลดข้อมูลการตั้งค่าร้านค้า..." : "Loading store configuration details..."}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-sm relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500"></div>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-100 pb-6 mb-8">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl">
            <Store size={22} className="stroke-[2.5px]" />
          </div>
          <div>
            <h3 className="font-display font-black text-slate-800 text-base md:text-lg flex items-center gap-2">
              {lang === "th" ? "ตั้งค่าระบบร้านค้า (Shop Settings)" : "Shop Configuration Settings"}
              <span className="text-[9px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-full tracking-wider uppercase font-sans">
                Active
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {lang === "th"
                ? "ปรับเปลี่ยนข้อมูลชื่อร้านค้า, ระบบขนส่งและจัดส่งฟรี, ข้อมูลรับชำระพร้อมเพย์ และที่อยู่ร้านสำหรับออกใบเสร็จ"
                : "Customize store details, flat shipping rates, free shipping criteria, PromptPay payment accounts and physical address."}
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-8 font-sans">
          
          {/* Section 1: ข้อมูลทั่วไปของร้านค้า */}
          <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-200/50">
            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-5 flex items-center gap-2 border-b border-slate-200/40 pb-2.5">
              <Store size={14} className="text-emerald-500" />
              {lang === "th" ? "ข้อมูลเอกลักษณ์ร้านค้า (Store Identity)" : "Store Identity & Contact"}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              {/* Store Name */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  {lang === "th" ? "ชื่อร้านค้าทางการ (Store Name) *" : "Store Official Name *"}
                </label>
                <input
                  type="text"
                  required
                  value={config.storeName || ""}
                  onChange={(e) => setConfig({ ...config, storeName: e.target.value })}
                  placeholder={lang === "th" ? "เช่น S Shop Online Official" : "e.g. S Shop Premium Space"}
                  className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm font-sans"
                />
              </div>

              {/* Store Phone */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                  <Phone size={11} className="text-emerald-500" /> {lang === "th" ? "เบอร์โทรศัพท์ติดต่อของร้านค้า" : "Store Contact Phone"}
                </label>
                <input
                  type="text"
                  value={config.storePhone || ""}
                  onChange={(e) => setConfig({ ...config, storePhone: e.target.value })}
                  placeholder="089-123-4567"
                  className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm font-mono font-bold"
                />
              </div>

              {/* Store Address */}
              <div className="col-span-1 md:col-span-2 flex flex-col gap-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                  <MapPin size={11} className="text-emerald-500" /> {lang === "th" ? "ที่อยู่ร้านค้าอย่างละเอียด (สำหรับแสดงบนหน้าบิล/ใบเสร็จ)" : "Store Detailed Address (For invoice displays)"}
                </label>
                <textarea
                  rows={3}
                  value={config.storeAddress || ""}
                  onChange={(e) => setConfig({ ...config, storeAddress: e.target.value })}
                  placeholder={lang === "th" ? "ระบุที่อยู่ติดต่อ คลังสินค้า หรือสำนักงานใหญ่ของร้านค้า..." : "Enter full physical storefront address or main warehouse warehouse..."}
                  className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm font-sans"
                />
              </div>
            </div>
          </div>

          {/* Section 2: ข้อมูลบัญชีการรับเงินธนาคารและ QR Code */}
          <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-200/50">
            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-5 flex items-center gap-2 border-b border-slate-200/40 pb-2.5">
              <CreditCard size={14} className="text-emerald-500" />
              {lang === "th" ? "ข้อมูลบัญชีธนาคารสำหรับรับเงิน (Bank Transfer Settings)" : "Beneficiary Bank Settings"}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              {/* Bank Name Selector */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  {lang === "th" ? "ชื่อธนาคาร (Select Bank) *" : "Select Bank Account *"}
                </label>
                <select
                  value={config.bankName || "กสิกรไทย"}
                  onChange={(e) => setConfig({ ...config, bankName: e.target.value })}
                  className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm font-sans"
                >
                  <option value="กสิกรไทย">{lang === "th" ? "กสิกรไทย (KBank)" : "Kasikorn Bank (KBank)"}</option>
                  <option value="ไทยพาณิชย์">{lang === "th" ? "ไทยพาณิชย์ (SCB)" : "Siam Commercial Bank (SCB)"}</option>
                </select>
              </div>

              {/* Bank Account Number */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  {lang === "th" ? "เลขที่บัญชีธนาคาร (Bank Account Number) *" : "Bank Account Number *"}
                </label>
                <input
                  type="text"
                  required
                  value={config.bankAccountNo || ""}
                  onChange={(e) => setConfig({ ...config, bankAccountNo: e.target.value })}
                  placeholder="e.g. 123-4-56789-0"
                  className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm font-mono font-bold"
                />
              </div>

              {/* Bank Account Name */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  {lang === "th" ? "ชื่อเจ้าของบัญชี (Account Owner Name) *" : "Beneficiary Account Name *"}
                </label>
                <input
                  type="text"
                  required
                  value={config.bankAccountName || ""}
                  onChange={(e) => setConfig({ ...config, bankAccountName: e.target.value })}
                  placeholder={lang === "th" ? "เช่น บริษัท เอส ช็อป จำกัด" : "e.g. S Shop Co., Ltd."}
                  className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm font-sans"
                />
              </div>

              {/* QR Code Upload / Preview Card */}
              <div className="col-span-1 md:col-span-2 mt-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-2">
                  {lang === "th" ? "รูปภาพคิวอาร์โค้ดรับเงิน / QR Code (ลูกค้าแกนเพื่อจ่ายเงิน)" : "Payment QR Code (For customer scan transfers)"}
                </label>
                
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                  <div className="sm:col-span-8">
                    <div
                      onDragOver={handleQrDragOver}
                      onDragLeave={handleQrDragLeave}
                      onDrop={handleQrDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[140px] ${
                        isQrDragging
                          ? "border-emerald-500 bg-emerald-50/50"
                          : "border-slate-200 hover:border-emerald-500 bg-white"
                      }`}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleQrCodeUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <div className="p-3 bg-slate-50 text-slate-500 rounded-full mb-2">
                        <Upload size={20} className="text-slate-400" />
                      </div>
                      <p className="text-xs font-bold text-slate-700">
                        {lang === "th" ? "คลิกที่นี่ หรือ ลากรูปคิวอาร์โค้ดมาวางเพื่ออัปโหลด" : "Click here or drag QR code image here to upload"}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {lang === "th" ? "รองรับไฟล์ภาพ JPEG, PNG ขนาดไม่เกิน 2MB" : "Supports JPEG, PNG under 2MB."}
                      </p>
                    </div>
                  </div>

                  <div className="sm:col-span-4 flex flex-col items-center justify-center">
                    {config.qrCodeUrl ? (
                      <div className="relative p-2 bg-white border border-slate-200 rounded-2xl shadow-sm group">
                        <img
                          src={config.qrCodeUrl}
                          alt="QR Code Preview"
                          className="w-28 h-28 object-contain rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={clearQrCode}
                          className="absolute -top-2 -right-2 bg-rose-500 hover:bg-rose-600 text-white p-1 rounded-full shadow-md transition-all cursor-pointer"
                          title={lang === "th" ? "ลบรูปภาพ" : "Delete Image"}
                        >
                          <X size={12} className="stroke-[3px]" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-28 h-28 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-300 bg-slate-50">
                        <QrCode size={36} className="stroke-[1.5px]" />
                        <span className="text-[9px] mt-1 font-bold">{lang === "th" ? "ไม่มีรูปภาพ QR" : "No QR Image"}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: ระบบการจัดส่งสินค้าและจัดส่งฟรี */}
          <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-200/50">
            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-5 flex items-center gap-2 border-b border-slate-200/40 pb-2.5">
              <Truck size={14} className="text-emerald-500" />
              {lang === "th" ? "อัตราค่าจัดส่ง & โปรโมชั่นส่งฟรี (Shipping Rate Policies)" : "Shipping Rate & Free Delivery Promotion"}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              {/* Shipping Fee */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  {lang === "th" ? "ค่าจัดส่งเริ่มต้น (Shipping Fee - ฿)" : "Base Flat Shipping Fee (฿)"}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-slate-400 font-bold font-sans">฿</span>
                  <input
                    type="number"
                    min="0"
                    value={config.shippingFee !== undefined ? config.shippingFee : 50}
                    onChange={(e) => setConfig({ ...config, shippingFee: Math.max(0, Number(e.target.value)) })}
                    placeholder="50"
                    className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm font-mono font-bold"
                  />
                </div>
              </div>

              {/* Free Shipping Minimum */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  {lang === "th" ? "ยอดสั่งซื้อขั้นต่ำสำหรับจัดส่งฟรี (Free Shipping Minimum - ฿)" : "Free Shipping Threshold (฿)"}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-slate-400 font-bold font-sans">฿</span>
                  <input
                    type="number"
                    min="0"
                    value={config.freeShippingMin !== undefined ? config.freeShippingMin : 1000}
                    onChange={(e) => setConfig({ ...config, freeShippingMin: Math.max(0, Number(e.target.value)) })}
                    placeholder="1000"
                    className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm font-mono font-bold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: การปรับแต่งรูปแบบสีสัน โลโก้ และธีมระบบ */}
          <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-200/50 space-y-6">
            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-5 flex items-center gap-2 border-b border-slate-200/40 pb-2.5">
              <Palette size={14} className="text-emerald-500" />
              {lang === "th" ? "การปรับแต่งรูปแบบดีไซน์ โลโก้ และสีสัน (UI & Theme Customization)" : "UI Branding, Logo & Theme Settings"}
            </h4>

            {/* Sub-Section A: ธีมระบบและโทนสีหลัก */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs border-b border-slate-100 pb-6">
              {/* Theme Mode Selector */}
              <div className="flex flex-col gap-2.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                  <Sun size={12} className="text-amber-500" />
                  {lang === "th" ? "ธีมหลักของระบบ (System Theme Mode)" : "System Theme Mode"}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: "light", label: "Light", desc: "สว่างมินิมอล", bg: "bg-white text-slate-800 border-slate-200" },
                    { id: "dark", label: "Dark", desc: "โหมดมืดเท่", bg: "bg-slate-900 text-white border-slate-800" },
                    { id: "navy", label: "Navy", desc: "น้ำเงินหรูหรา", bg: "bg-indigo-950 text-indigo-200 border-indigo-900" },
                    { id: "warm", label: "Warm", desc: "โทนอุ่นสบายตา", bg: "bg-amber-50/70 text-amber-900 border-amber-200" }
                  ].map((theme) => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setConfig({ ...config, themeMode: theme.id as any })}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${theme.bg} ${
                        (config.themeMode || "light") === theme.id
                          ? "ring-2 ring-emerald-500 scale-[1.02] shadow-sm font-bold"
                          : "opacity-75 hover:opacity-100"
                      }`}
                    >
                      <span className="text-[11px] font-bold">{theme.label}</span>
                      <span className="text-[8px] font-normal opacity-70 whitespace-nowrap">{theme.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Accent Primary Color */}
              <div className="flex flex-col gap-2.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                  <Paintbrush size={12} className="text-emerald-500" />
                  {lang === "th" ? "สีเน้นปุ่มและลิงก์ต่างๆ (Theme Accent Color)" : "Theme Accent Color"}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "emerald", label: "Emerald Green", hex: "bg-emerald-500 text-emerald-50" },
                    { id: "indigo", label: "Royal Indigo", hex: "bg-indigo-600 text-indigo-50" },
                    { id: "sky", label: "Ocean Sky", hex: "bg-sky-500 text-sky-50" },
                    { id: "rose", label: "Rose Pink", hex: "bg-rose-500 text-rose-50" },
                    { id: "amber", label: "Sunset Amber", hex: "bg-amber-500 text-amber-950" },
                    { id: "violet", label: "Orchid Violet", hex: "bg-violet-600 text-violet-50" }
                  ].map((color) => (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => setConfig({ ...config, primaryColor: color.id })}
                      className={`p-2 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer border transition-all ${color.hex} ${
                        (config.primaryColor || "emerald") === color.id
                          ? "ring-2 ring-slate-900 border-transparent font-bold scale-[1.02]"
                          : "border-slate-200/60 hover:brightness-105"
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-white"></span>
                      <span className="text-[10px] font-medium truncate">{color.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sub-Section B: ปรับแต่งโลโก้ (Logo Customizer) */}
            <div className="space-y-4 border-b border-slate-100 pb-6">
              <div className="flex flex-col gap-2 text-xs">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                  <ImageIcon size={11} className="text-emerald-500" />
                  {lang === "th" ? "ลิงก์โลโก้ของร้านค้า (Store Logo Image URL)" : "Store Logo URL"}
                </label>
                <div className="flex gap-3">
                  <input
                    type="url"
                    value={config.logoUrl || ""}
                    onChange={(e) => setConfig({ ...config, logoUrl: e.target.value })}
                    placeholder="https://example.com/my-logo.png (ปล่อยว่างหากต้องการใช้ตัวหนังสือมินิมอลเริ่มต้น)"
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm"
                  />
                  {config.logoUrl && (
                    <button
                      type="button"
                      onClick={() => setConfig({ ...config, logoUrl: "" })}
                      className="px-3 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 rounded-xl border border-slate-200 cursor-pointer"
                    >
                      ล้างค่า
                    </button>
                  )}
                </div>
              </div>

              {/* Preset Logos Select */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{lang === "th" ? "คลิกเลือกโลโก้ตัวอย่างสำเร็จรูป (Preset Premium Logos)" : "Or choose a preset business logo"}</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "👓 แฟชั่นแว่นตา Glasses", url: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=120&auto=format&fit=crop&q=60" },
                    { label: "🔌 แกดเจ็ต Smart Charger", url: "https://images.unsplash.com/photo-1619134778706-7015533a6150?w=120&auto=format&fit=crop&q=60" },
                    { label: "📦 สินค้าพรีเมียม Premium Mug", url: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=120&auto=format&fit=crop&q=60" },
                    { label: "👜 กระเป๋าเครื่องเขียน Case", url: "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=120&auto=format&fit=crop&q=60" },
                    { label: "💻 อุปกรณ์สไตล์มินิมอล Minimal Tech", url: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=120&auto=format&fit=crop&q=60" }
                  ].map((logo, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setConfig({ ...config, logoUrl: logo.url })}
                      className={`px-3 py-1.5 rounded-lg border text-[9px] font-bold cursor-pointer transition-all ${
                        config.logoUrl === logo.url
                          ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                          : "bg-white text-slate-500 hover:text-slate-700 hover:bg-slate-50 border-slate-200"
                      }`}
                    >
                      {logo.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sub-Section C: ส่วนหัวต้อนรับ (Hero Banner Area) */}
            <div className="space-y-4 border-b border-slate-100 pb-6 text-xs">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <Layout size={12} className="text-emerald-500" />
                {lang === "th" ? "ตกแต่งป้ายต้อนรับด้านบนสุด (Hero Banner Customizer)" : "Hero Banner Banner settings"}
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Hero Title */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">{lang === "th" ? "พาดหัวหลัก (Hero Title)" : "Hero Main Title"}</span>
                  <input
                    type="text"
                    value={config.heroTitle !== undefined ? config.heroTitle : "S Shop Online Official"}
                    onChange={(e) => setConfig({ ...config, heroTitle: e.target.value })}
                    placeholder="เช่น S Shop Online Official"
                    className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm"
                  />
                </div>

                {/* Hero Subtitle */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">{lang === "th" ? "พาดหัวรองตัวเล็ก (Hero Subtitle)" : "Hero Subtitle Tag"}</span>
                  <input
                    type="text"
                    value={config.heroSubtitle !== undefined ? config.heroSubtitle : "Premium Quality Products"}
                    onChange={(e) => setConfig({ ...config, heroSubtitle: e.target.value })}
                    placeholder="เช่น Premium Quality Products"
                    className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm"
                  />
                </div>

                {/* Hero Description */}
                <div className="col-span-1 md:col-span-2 flex flex-col gap-1.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">{lang === "th" ? "คำอธิบายร้านค้าเพิ่มเติม (Hero Description)" : "Hero Description Text"}</span>
                  <textarea
                    rows={2}
                    value={config.heroDescription !== undefined ? config.heroDescription : "แบรนด์สินค้าพรีเมียมคุณภาพสูง คัดสรรสินค้าดีไซน์สวยงาม ทนทาน และฟังก์ชันตอบโจทย์ทุกไลฟ์สไตล์ มั่นใจได้ในบริการหลังการขายและการส่งพัสดุที่รวดเร็วฉับไว"}
                    onChange={(e) => setConfig({ ...config, heroDescription: e.target.value })}
                    placeholder="ใส่คำอธิบายสั้นๆ เกี่ยวกับจุดขายของร้านค้าคุณ..."
                    className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm font-sans"
                  />
                </div>

                {/* Gradient Color Pickers */}
                <div className="flex flex-col gap-2">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">{lang === "th" ? "สีไล่เฉดพื้นหลังแบนเนอร์ (Hero Background Gradient Colors)" : "Gradient Background"}</span>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] text-slate-400 font-bold">Start:</span>
                      <input
                        type="color"
                        value={config.heroBgStart || "#29A6FF"}
                        onChange={(e) => setConfig({ ...config, heroBgStart: e.target.value })}
                        className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 p-0 overflow-hidden"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] text-slate-400 font-bold">End:</span>
                      <input
                        type="color"
                        value={config.heroBgEnd || "#3CD69E"}
                        onChange={(e) => setConfig({ ...config, heroBgEnd: e.target.value })}
                        className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 p-0 overflow-hidden"
                      />
                    </div>

                    {/* Gradient Demo Box */}
                    <div
                      className="h-8 flex-1 rounded-xl shadow-inner border border-slate-100"
                      style={{ background: `linear-gradient(to right, ${config.heroBgStart || "#29A6FF"}, ${config.heroBgEnd || "#3CD69E"})` }}
                    />
                  </div>
                </div>

                {/* Gradient Preset Buttons */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">{lang === "th" ? "คลิกใช้คู่สีสำเร็จรูป (Gradient Presets)" : "Quick Presets"}</span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "💎 Emerald Ocean", start: "#29A6FF", end: "#3CD69E" },
                      { label: "🌌 Night Violet", start: "#4f46e5", end: "#a855f7" },
                      { label: "🌅 Sunset Amber", start: "#f97316", end: "#eab308" },
                      { label: "🌹 Rose Quartz", start: "#ec4899", end: "#f43f5e" }
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setConfig({ ...config, heroBgStart: preset.start, heroBgEnd: preset.end })}
                        className="p-1 border border-slate-200 rounded-lg bg-white flex items-center gap-1.5 cursor-pointer text-[9px] font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all"
                      >
                        <span className="w-3.5 h-3.5 rounded-full" style={{ background: `linear-gradient(135deg, ${preset.start}, ${preset.end})` }}></span>
                        <span className="truncate">{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Sub-Section D: ส่วนล่างของเว็ปไซต์ (Footer Customizer) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Footer Description */}
              <div className="flex flex-col gap-1.5 col-span-1 md:col-span-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{lang === "th" ? "คำอธิบายสั้นๆ ของร้านค้าย่อยในฟุตเตอร์ (Footer Description)" : "Footer Description"}</label>
                <input
                  type="text"
                  value={config.footerDescription !== undefined ? config.footerDescription : "เราคัดสรรสินค้าที่ดีที่สุดสำหรับคุณ พร้อมบริการส่งถึงหน้าบ้านและรับประกันความพึงพอใจ"}
                  onChange={(e) => setConfig({ ...config, footerDescription: e.target.value })}
                  placeholder="เช่น เราคัดสรรสินค้าที่ดีที่สุดสำหรับคุณ พร้อมรับประกันความพึงพอใจ..."
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm"
                />
              </div>

              {/* Footer Copyright Text */}
              <div className="flex flex-col gap-1.5 col-span-1 md:col-span-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{lang === "th" ? "ข้อความลิขสิทธิ์ / ข้อมูลบริษัทด้านล่างสุด (Footer Credit Text)" : "Footer Copyright/Credit Text"}</label>
                <input
                  type="text"
                  value={config.footerText !== undefined ? config.footerText : "© 2026 S Shop Online. All rights reserved."}
                  onChange={(e) => setConfig({ ...config, footerText: e.target.value })}
                  placeholder="เช่น © 2026 S Shop Online. All rights reserved."
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* Feedback Messages */}
          {saveStatus === "success" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-emerald-50 text-emerald-700 border border-emerald-100/50 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-sm"
            >
              <CheckCircle size={16} className="text-emerald-500 animate-pulse" />
              <span>{statusMessage}</span>
            </motion.div>
          )}

          {saveStatus === "error" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-rose-50 text-rose-700 border border-rose-100/50 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-sm"
            >
              <ShieldAlert size={16} className="text-rose-500" />
              <span>{statusMessage}</span>
            </motion.div>
          )}

          {/* Submit Action Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3.5 bg-slate-900 hover:bg-emerald-600 text-white rounded-xl text-xs font-extrabold shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>{lang === "th" ? "กำลังบันทึกตั้งค่า..." : "Saving..."}</span>
                </>
              ) : (
                <>
                  <Save size={14} />
                  <span>{lang === "th" ? "บันทึกตั้งค่าร้านค้า" : "Save Settings"}</span>
                </>
              )}
            </button>
          </div>

        </form>
      </motion.div>
    </div>
  );
}
