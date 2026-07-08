import React, { useState, useEffect } from "react";
import { LineConfig } from "../types";
import { Settings2, Bell, Shield, Key, Check, HelpCircle, RefreshCw, Send, ShieldAlert, CheckCircle, ExternalLink, MessageSquare, ArrowRight, LayoutGrid, Copy, Plus, Smartphone, Layers, Info, Grid, Sparkles, CheckSquare } from "lucide-react";
import { motion } from "motion/react";
import { useTranslation } from "../localization";

interface LineSetupViewProps {
  currentUser: { id: string; role: string } | null;
}

export default function LineSetupView({ currentUser }: LineSetupViewProps) {
  const { t, lang } = useTranslation();
  const [config, setConfig] = useState<LineConfig>({
    lineNotifyToken: "",
    lineChannelAccessToken: "",
    lineChannelSecret: "",
    lineLiffId: "",
    enabled: true,
    storeName: "S Shop Online",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");

  // Test notification message state
  const [testMessage, setTestMessage] = useState("สวัสดีครับ! ระบบแจ้งเตือนออเดอร์ร้าน S Shop Online พร้อมใช้งานแล้ว 🎉");
  const [sendingTest, setSendingTest] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "success" | "error">("idle");
  const [testResponse, setTestResponse] = useState("");
  const [activeTemplateTab, setActiveTemplateTab] = useState<"new_order" | "tracking" | "cancel">("new_order");

  // Rich Menu Integration States
  const [appUrl, setAppUrl] = useState("");
  const [activeLayout, setActiveLayout] = useState<"grid6" | "cols3" | "banner1">("grid6");
  const [selectedTile, setSelectedTile] = useState(0);
  const [copiedTileId, setCopiedTileId] = useState<number | null>(null);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  
  const [tilesConfig, setTilesConfig] = useState({
    grid6: [
      { label: "🛍️ ช้อปสินค้าออนไลน์", type: "url", value: "/?view=shop", color: "bg-gradient-to-br from-emerald-500 to-teal-600 text-white" },
      { label: "📦 ติดตามเลขพัสดุ", type: "url", value: "/?view=orders", color: "bg-gradient-to-br from-sky-500 to-blue-600 text-white" },
      { label: "🛒 ตะกร้าของฉัน", type: "url", value: "/?view=cart", color: "bg-gradient-to-br from-amber-500 to-orange-600 text-white" },
      { label: "🔑 บัญชีและประวัติ", type: "url", value: "/?view=auth", color: "bg-gradient-to-br from-indigo-500 to-violet-600 text-white" },
      { label: "🎁 แจกโค้ดส่วนลด", type: "text", value: "ขอรหัสคูปองส่วนลดพิเศษของร้านค้าหน่อยครับ! 🛍️", color: "bg-gradient-to-br from-rose-500 to-pink-600 text-white" },
      { label: "💬 ติดต่อแอดมิน", type: "text", value: "ต้องการติดต่อสอบถามข้อมูลกับเจ้าหน้าที่ร้านค้าโดยตรงครับ", color: "bg-gradient-to-br from-slate-700 to-slate-800 text-white" }
    ],
    cols3: [
      { label: "🛍️ สั่งซื้อออนไลน์", type: "url", value: "/?view=shop", color: "bg-gradient-to-br from-emerald-500 to-teal-600 text-white" },
      { label: "📦 ประวัติออเดอร์", type: "url", value: "/?view=orders", color: "bg-gradient-to-br from-indigo-500 to-blue-600 text-white" },
      { label: "💬 คุยกับเจ้าหน้าที่", type: "text", value: "ต้องการติดต่อพนักงานสอบถามเพิ่มเติมครับ", color: "bg-gradient-to-br from-slate-700 to-slate-800 text-white" }
    ],
    banner1: [
      { label: "🚀 เข้าสู่เว็บบอร์ด / ช้อปออนไลน์", type: "url", value: "/?view=shop", color: "bg-gradient-to-br from-emerald-500 to-teal-600 text-white" }
    ]
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      setAppUrl(window.location.origin + "/app");
    }
  }, []);

  // Ensure selected tile remains inside bounds on layout change
  useEffect(() => {
    setSelectedTile(0);
  }, [activeLayout]);

  const handleTileChange = (field: "label" | "type" | "value", val: string) => {
    setTilesConfig((prev) => {
      const currentList = [...prev[activeLayout]];
      currentList[selectedTile] = {
        ...currentList[selectedTile],
        [field]: val,
      };
      return {
        ...prev,
        [activeLayout]: currentList,
      };
    });
  };

  const handleCopyTileUrl = (tileIndex: number, textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopiedTileId(tileIndex);
    setTimeout(() => setCopiedTileId(null), 2000);
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
      console.error("Error fetching LINE config:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser?.role !== "admin") {
      setSaveStatus("error");
      setStatusMessage(
        lang === "th"
          ? "ขออภัย: เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถแก้ไขการตั้งค่านี้ได้"
          : "Sorry: Only administrators (Admin) can modify these LINE settings."
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
            ? "บันทึกการตั้งค่า LINE ประสบความสำเร็จ!"
            : "LINE API configurations saved successfully!"
        );
        setTimeout(() => setSaveStatus("idle"), 4000);
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
          ? "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์หลังบ้านได้"
          : "Unable to connect to the backend server."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestNotify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testMessage.trim()) return;

    setSendingTest(true);
    setTestStatus("idle");
    setTestResponse("");

    try {
      const response = await fetch("/api/line/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: testMessage }),
      });

      const data = await response.json();
      if (response.ok) {
        setTestStatus("success");
        setTestResponse(
          config.lineNotifyToken
            ? (lang === "th"
                ? "ส่งข้อความไปยังกลุ่ม LINE Notify สำเร็จแล้ว! ตรวจสอบที่แชทกลุ่ม LINE ได้ทันที"
                : "Message sent to LINE Notify group successfully! Please verify inside your group chat.")
            : (lang === "th"
                ? "จำลองการส่งสำเร็จ! (กรุณาใส่ LINE Notify Token ด้านบนเพื่อเชื่อมต่อกับไลน์จริง)"
                : "Simulation successful! (Please insert your LINE Notify Token above to connect to active LINE account.)")
        );
      } else {
        setTestStatus("error");
        setTestResponse(
          data.error || (lang === "th" ? "ไม่สามารถส่งแจ้งเตือนได้" : "Failed to trigger the LINE notification.")
        );
      }
    } catch (err) {
      setTestStatus("error");
      setTestResponse(
        lang === "th" ? "เกิดข้อผิดพลาดในการเชื่อมโยงเครือข่าย" : "Network error occurred."
      );
    } finally {
      setSendingTest(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-100 p-24 text-center shadow-sm max-w-2xl mx-auto my-12">
        <RefreshCw size={32} className="animate-spin text-emerald-500 mx-auto mb-4" />
        <p className="text-sm font-semibold text-slate-700">
          {lang === "th" ? "กำลังดึงข้อมูลกำหนดค่าระบบ LINE..." : "Loading LINE API configuration settings..."}
        </p>
        <p className="text-xs text-slate-400 mt-1">
          {lang === "th" ? "กรุณารอสักครู่ ระบบกำลังสื่อสารกับหลังบ้าน" : "Please wait. Communicating with backend..."}
        </p>
      </div>
    );
  }

  const currentMethod = config.notificationMethod || "notify";
  const hasRealToken = currentMethod === "oa"
    ? (config.lineChannelAccessToken && config.lineChannelAccessToken.trim() !== "" && config.adminLineUserId && config.adminLineUserId.trim() !== "")
    : (config.lineNotifyToken && config.lineNotifyToken.trim() !== "");

  return (
    <div id="line-config-container" className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-16 font-sans">
      
      {/* LEFT COLUMN: Configuration Form */}
      <div className="lg:col-span-7 flex flex-col gap-8">
         
        {/* LINE Notify Token Form Card */}
        <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm relative overflow-hidden">
          {/* Header Decorative Bar */}
          <div className="absolute top-0 left-0 right-0 h-[5px] bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-500"></div>
          
          <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                <Settings2 size={18} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">
                  {lang === "th" ? "ตั้งค่าการเชื่อมต่อระบบ LINE API" : "LINE API Integration Settings"}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {lang === "th" ? "กำหนดรูปแบบการส่งข้อความแจ้งเตือนอัตโนมัติไปยัง LINE" : "Configure automatic order updates and tracking messages to LINE"}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${hasRealToken && config.enabled ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`}></span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                {hasRealToken && config.enabled ? "ACTIVE (REAL)" : "SIMULATED"}
              </span>
            </div>
          </div>

          <form onSubmit={handleSaveConfig} className="flex flex-col gap-6 text-xs">
            {/* Store Name config */}
            <div className="flex flex-col gap-2">
              <label className="font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
                <span>{lang === "th" ? "ชื่อร้านค้า / หัวข้อนำหน้าการแจ้งเตือน" : "Store Header / Notification Prefix"}</span>
              </label>
              <input
                type="text"
                value={config.storeName}
                onChange={(e) => setConfig({ ...config, storeName: e.target.value })}
                placeholder={lang === "th" ? "เช่น S Shop Online" : "e.g. S Shop Premium"}
                className="bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200/60 focus:border-emerald-500 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 font-sans transition-all shadow-inner"
              />
            </div>

            {/* Notification Method selector toggle */}
            <div className="flex flex-col gap-2">
              <label className="font-bold text-slate-600 uppercase tracking-wide">{lang === "th" ? "รูปแบบการเชื่อมต่อ LINE" : "LINE Connection Architecture"}</label>
              <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-xl border border-slate-200/50">
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, notificationMethod: "notify" })}
                  className={`py-2.5 px-4 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 border-0 cursor-pointer ${
                    currentMethod === "notify"
                      ? "bg-white text-emerald-600 shadow-sm border border-slate-200/50"
                      : "text-slate-500 hover:text-slate-800 bg-transparent"
                  }`}
                >
                  <Bell size={14} />
                  <span>{lang === "th" ? "LINE Notify (ดั้งเดิม)" : "LINE Notify (Standard)"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, notificationMethod: "oa" })}
                  className={`py-2.5 px-4 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 border-0 cursor-pointer ${
                    currentMethod === "oa"
                      ? "bg-white text-emerald-600 shadow-sm border border-slate-200/50"
                      : "text-slate-500 hover:text-slate-800 bg-transparent"
                  }`}
                >
                  <MessageSquare size={14} />
                  <span>{lang === "th" ? "LINE OA (Official)" : "LINE OA (Official Account)"}</span>
                </button>
              </div>
            </div>

            {/* Conditional input fields */}
            {currentMethod === "notify" ? (
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
                    <Key size={13} className="text-emerald-500" /> 
                    <span>LINE Notify Token (โทเคนกลุ่มแชท)</span>
                  </label>
                  <span className="text-[10px] font-semibold text-slate-400">กรอกรหัสสำหรับใช้จริง</span>
                </div>
                <input
                  type="password"
                  value={config.lineNotifyToken || ""}
                  onChange={(e) => setConfig({ ...config, lineNotifyToken: e.target.value })}
                  placeholder="วางโทเคนที่ได้จาก LINE Notify ที่นี่ (เช่น 8A9x2L1...)"
                  className="bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200/60 focus:border-emerald-500 rounded-xl px-4 py-3 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all shadow-inner"
                />
                <div className="bg-amber-50/70 border border-amber-100 rounded-xl p-3 flex gap-2.5 mt-1">
                  <span className="text-amber-500 text-sm leading-none mt-0.5">💡</span>
                  <p className="text-[10px] text-amber-700 leading-relaxed font-sans">
                    หากเว้นว่างรหัสไว้ ระบบจะยังทำงานได้ตามปกติโดยส่งการแจ้งเตือนพัสดุและออเดอร์เข้าไปที่ <b>LINE Simulator (โทรศัพท์จำลองสีเขียวด้านขวาของจอ)</b> แทน เพื่ออำนวยความสะดวกในการทดสอบฟังก์ชันส่งของ!
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {/* Channel Access Token */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <label className="font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
                      <Key size={13} className="text-emerald-500" /> 
                      <span>Channel Access Token (Long-Lived)</span>
                    </label>
                    <span className="text-[10px] font-semibold text-slate-400">จาก LINE Developers</span>
                  </div>
                  <input
                    type="password"
                    value={config.lineChannelAccessToken || ""}
                    onChange={(e) => setConfig({ ...config, lineChannelAccessToken: e.target.value })}
                    placeholder="วาง Channel Access Token ของ LINE OA ที่นี่..."
                    className="bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200/60 focus:border-emerald-500 rounded-xl px-4 py-3 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all shadow-inner"
                  />
                </div>

                {/* Channel Secret */}
                <div className="flex flex-col gap-2">
                  <label className="font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
                    <Shield size={13} className="text-emerald-500" /> 
                    <span>Channel Secret</span>
                  </label>
                  <input
                    type="password"
                    value={config.lineChannelSecret || ""}
                    onChange={(e) => setConfig({ ...config, lineChannelSecret: e.target.value })}
                    placeholder="วาง Channel Secret ของ LINE OA ที่นี่..."
                    className="bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200/60 focus:border-emerald-500 rounded-xl px-4 py-3 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all shadow-inner"
                  />
                </div>

                {/* LINE Login LIFF ID */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <label className="font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
                      <Smartphone size={13} className="text-emerald-500" /> 
                      <span>LINE Login LIFF ID (ระบบล็อกอินด้วย LINE ของจริง)</span>
                    </label>
                    <span className="text-[10px] font-semibold text-slate-400">LIFF Integration</span>
                  </div>
                  <input
                    type="text"
                    value={config.lineLiffId || ""}
                    onChange={(e) => setConfig({ ...config, lineLiffId: e.target.value })}
                    placeholder="เช่น 2004567890-AbCdEfGh..."
                    className="bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200/60 focus:border-emerald-500 rounded-xl px-4 py-3 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all shadow-inner"
                  />
                  <p className="text-[10px] text-slate-400 leading-normal -mt-1">
                    ใส่ LIFF ID จาก LINE Developers Console (แท็บ LIFF ของ LINE Login Channel) เพื่อเปิดใช้งานการล็อกอินและเชื่อมต่อกับ LINE จริงอย่างสมบูรณ์แบบ
                  </p>
                </div>

                {/* Webhook URL indicator (CRITICAL FOR LIVE OA TESTING) */}
                <div className="flex flex-col gap-2 p-4 bg-emerald-50/40 rounded-xl border border-emerald-100/60">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5 text-xs">
                      <ExternalLink size={13} className="text-emerald-500" />
                      <span>LINE Webhook URL (ลิงก์เว็บฮุคสำหรับตั้งค่า LINE Developers)</span>
                    </span>
                    <span className="bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                      Required
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed font-sans">
                    คัดลอกลิงก์ Webhook นี้ไปกรอกในเว็บ <b>LINE Developers Console</b> &rarr; แท็บ <b>Messaging API</b> &rarr; หัวข้อ <b>Webhook settings</b> &rarr; กดเปิดใช้งาน <b>Use webhook</b> แล้วคลิกปุ่ม <b>Verify</b> เพื่อเชื่อมสัญญาณจริง!
                  </p>
                  <div className="flex gap-2 items-center mt-1">
                    <input
                      type="text"
                      readOnly
                      value={appUrl ? `${appUrl}/api/line/webhook` : "https://sshop-12054782952.asia-southeast1.run.app/api/line/webhook"}
                      className="bg-white border border-slate-200/80 rounded-lg px-3 py-2 text-[10px] font-mono text-slate-600 flex-1 focus:outline-none select-all"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const targetUrl = appUrl ? `${appUrl}/api/line/webhook` : "https://sshop-12054782952.asia-southeast1.run.app/api/line/webhook";
                        navigator.clipboard.writeText(targetUrl);
                        setCopiedWebhook(true);
                        setTimeout(() => setCopiedWebhook(false), 2000);
                      }}
                      className="px-3 py-2 bg-slate-800 text-white hover:bg-slate-900 rounded-lg font-sans font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-all border-0 flex-shrink-0"
                    >
                      {copiedWebhook ? (
                        <>
                          <Check size={11} className="text-emerald-400 stroke-[3px]" />
                          <span>คัดลอกแล้ว</span>
                        </>
                      ) : (
                        <>
                          <Copy size={11} />
                          <span>คัดลอกลิงก์</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Admin User ID */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <label className="font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
                      <Key size={13} className="text-emerald-500" /> 
                      <span>Admin/Staff LINE User ID (สำหรับรับแจ้งเตือนของร้านค้า)</span>
                    </label>
                    <span className="text-[10px] font-semibold text-slate-400">เช่น U123456...</span>
                  </div>
                  <input
                    type="text"
                    value={config.adminLineUserId || ""}
                    onChange={(e) => setConfig({ ...config, adminLineUserId: e.target.value })}
                    placeholder="รหัสผู้ใช้ LINE (User ID) ของแอดมินร้านเพื่อรับแจ้งออเดอร์ใหม่"
                    className="bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200/60 focus:border-emerald-500 rounded-xl px-4 py-3 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all shadow-inner"
                  />
                  <div className="bg-emerald-50/50 border border-emerald-100/60 rounded-xl p-3.5 flex gap-2.5 mt-1">
                    <span className="text-emerald-500 text-sm leading-none mt-0.5">💡</span>
                    <p className="text-[10px] text-emerald-800 leading-relaxed font-sans">
                      เมื่อใช้โหมด <b>LINE OA (Official Account)</b>:
                      <br />• <b>แจ้งร้านค้า:</b> ระบบจะส่งรายละเอียดออเดอร์ใหม่ตรงเข้าแชทส่วนตัวของ <b>Admin LINE User ID</b> ที่ระบุไว้ด้านบน
                      <br />• <b>แจ้งผู้ซื้อ:</b> ระบบจะส่งเลขพัสดุและแจ้งเตือนยกเลิกสินค้า <b>เข้าแชทส่วนตัวของลูกค้าผู้ซื้อโดยตรง</b> เมื่อลูกค้าเชื่อมต่อบัญชีไลน์ของร้านค้า!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Config Enable toggle */}
            <div className="flex items-start gap-3 py-2 px-3 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100/30 transition-colors">
              <input
                type="checkbox"
                id="line-enable-notify"
                checked={config.enabled}
                onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                className="w-4 h-4 text-emerald-500 bg-white border-slate-300 rounded focus:ring-emerald-500 focus:ring-2 cursor-pointer mt-0.5"
              />
              <label htmlFor="line-enable-notify" className="font-semibold text-slate-700 cursor-pointer select-none leading-relaxed">
                เปิดใช้งานการแจ้งเตือนออเดอร์ไป LINE เสมอเมื่อลูกค้าสั่งซื้อ/ส่งหลักฐานโอนเงิน
                <span className="block text-[10px] text-slate-400 font-normal mt-0.5">บอทจะส่งข้อมูลสรุปสินค้า ยอดโอน และที่อยู่จัดส่งให้อัตโนมัติ</span>
              </label>
            </div>

            {/* Rich Message / Flex Message toggle (Only for LINE OA) */}
            {currentMethod === "oa" && (
              <div className="flex items-start gap-3 py-3 px-3 bg-indigo-50/50 rounded-xl border border-indigo-100 hover:bg-indigo-50 transition-colors">
                <input
                  type="checkbox"
                  id="line-use-rich"
                  checked={config.useRichMessage || false}
                  onChange={(e) => setConfig({ ...config, useRichMessage: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 bg-white border-slate-300 rounded focus:ring-indigo-500 focus:ring-2 cursor-pointer mt-0.5"
                />
                <label htmlFor="line-use-rich" className="font-semibold text-slate-700 cursor-pointer select-none leading-relaxed">
                  เปิดใช้งานการส่งแจ้งเตือนเป็น "Rich Message / Flex Message" แทนข้อความธรรมดา
                  <span className="block text-[10px] text-slate-400 font-normal mt-0.5">บอทจะแสดงผลเป็นสไลด์การ์ดดีไซน์พรีเมียมสีสันสวยงาม มีสลีป ปุ่มกด และรายละเอียดครบครันดึงดูดใจ</span>
                </label>
              </div>
            )}

            {/* Template Editors section */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200/60 p-5 mt-2 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <LayoutGrid size={15} className="text-emerald-500" />
                <span className="font-bold text-slate-700">{lang === "th" ? "จัดการข้อความแจ้งเตือน (Custom Templates)" : "Customize Message Templates"}</span>
              </div>
              <p className="text-[11px] text-slate-400 -mt-2">
                คุณสามารถออกแบบข้อความแจ้งเตือนที่บอทส่งไปที่ไลน์ด้วยตัวเองได้ตามใจชอบ โดยใช้แท็กระบุตำแหน่งค่าตัวแปร
              </p>

              {/* Tabs */}
              <div className="flex gap-1.5 p-1 bg-slate-200/60 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveTemplateTab("new_order")}
                  className={`flex-1 py-1.5 px-2.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer border-0 ${
                    activeTemplateTab === "new_order"
                      ? "bg-white text-emerald-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700 bg-transparent"
                  }`}
                >
                  ออเดอร์ใหม่
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTemplateTab("tracking")}
                  className={`flex-1 py-1.5 px-2.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer border-0 ${
                    activeTemplateTab === "tracking"
                      ? "bg-white text-emerald-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700 bg-transparent"
                  }`}
                >
                  แจ้งเลขพัสดุ
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTemplateTab("cancel")}
                  className={`flex-1 py-1.5 px-2.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer border-0 ${
                    activeTemplateTab === "cancel"
                      ? "bg-white text-emerald-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700 bg-transparent"
                  }`}
                >
                  ยกเลิกออเดอร์
                </button>
              </div>

              {/* Active Tab Content */}
              {activeTemplateTab === "new_order" && (
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-600 text-[11px]">ข้อความแจ้งเตือนออเดอร์ใหม่ (templateNewOrder)</span>
                    <button
                      type="button"
                      onClick={() => setConfig({
                        ...config,
                        templateNewOrder: `🛍️ *ออเดอร์ใหม่มาแล้ว!* [ออเดอร์ {orderId}]\n---------------------------------\n👤 ลูกค้า: คุณ {customerName}\n📞 เบอร์โทร: {customerPhone}\n📍 ที่อยู่จัดส่ง:\n{customerAddress}\n---------------------------------\n📦 รายการสินค้า:\n{itemsList}\n💰 ยอดรวมทั้งหมด: {totalAmount} บาท\n---------------------------------`
                      })}
                      className="text-[10px] text-emerald-600 font-bold hover:underline bg-transparent border-0 cursor-pointer"
                    >
                      คืนค่าเริ่มต้น
                    </button>
                  </div>
                  <textarea
                    rows={6}
                    value={config.templateNewOrder !== undefined ? config.templateNewOrder : `🛍️ *ออเดอร์ใหม่มาแล้ว!* [ออเดอร์ {orderId}]\n---------------------------------\n👤 ลูกค้า: คุณ {customerName}\n📞 เบอร์โทร: {customerPhone}\n📍 ที่อยู่จัดส่ง:\n{customerAddress}\n---------------------------------\n📦 รายการสินค้า:\n{itemsList}\n💰 ยอดรวมทั้งหมด: {totalAmount} บาท\n---------------------------------`}
                    onChange={(e) => setConfig({ ...config, templateNewOrder: e.target.value })}
                    className="bg-white hover:bg-slate-50 focus:bg-white border border-slate-200/80 focus:border-emerald-500 rounded-xl p-3 font-sans text-[11px] text-slate-700 focus:outline-none resize-y leading-relaxed transition-all shadow-inner"
                    placeholder="วางรูปแบบข้อความที่นี่..."
                  />
                  <div className="text-[10px] text-slate-400 bg-white border border-slate-100 rounded-lg p-2 leading-relaxed">
                    <b>คีย์เวิร์ดที่รองรับ:</b> <code className="text-emerald-600">{`{orderId}`}</code>, <code className="text-emerald-600">{`{customerName}`}</code>, <code className="text-emerald-600">{`{customerPhone}`}</code>, <code className="text-emerald-600">{`{customerAddress}`}</code>, <code className="text-emerald-600">{`{itemsList}`}</code>, <code className="text-emerald-600">{`{totalAmount}`}</code>, <code className="text-emerald-600">{`{storeName}`}</code>
                  </div>
                </div>
              )}

              {activeTemplateTab === "tracking" && (
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-600 text-[11px]">ข้อความแจ้งเลขพัสดุและจัดส่ง (templateTracking)</span>
                    <button
                      type="button"
                      onClick={() => setConfig({
                        ...config,
                        templateTracking: `{statusEmoji} *{statusText}* [ออเดอร์ {orderId}]\n---------------------------------\n👤 ลูกค้า: {customerName}\n📞 เบอร์โทร: {customerPhone}\n---------------------------------\n🚚 สถานะจัดส่ง: {shippingStatus}\n📋 เลขพัสดุ (Tracking): {trackingNumber}\n🔗 ลิงก์ติดตามพัสดุ: {trackingUrl}\n---------------------------------\n🙏 ขอบคุณที่ใช้บริการ S Shop Online!`
                      })}
                      className="text-[10px] text-emerald-600 font-bold hover:underline bg-transparent border-0 cursor-pointer"
                    >
                      คืนค่าเริ่มต้น
                    </button>
                  </div>
                  <textarea
                    rows={6}
                    value={config.templateTracking !== undefined ? config.templateTracking : `{statusEmoji} *{statusText}* [ออเดอร์ {orderId}]\n---------------------------------\n👤 ลูกค้า: {customerName}\n📞 เบอร์โทร: {customerPhone}\n---------------------------------\n🚚 สถานะจัดส่ง: {shippingStatus}\n📋 เลขพัสดุ (Tracking): {trackingNumber}\n🔗 ลิงก์ติดตามพัสดุ: {trackingUrl}\n---------------------------------\n🙏 ขอบคุณที่ใช้บริการ S Shop Online!`}
                    onChange={(e) => setConfig({ ...config, templateTracking: e.target.value })}
                    className="bg-white hover:bg-slate-50 focus:bg-white border border-slate-200/80 focus:border-emerald-500 rounded-xl p-3 font-sans text-[11px] text-slate-700 focus:outline-none resize-y leading-relaxed transition-all shadow-inner"
                    placeholder="วางรูปแบบข้อความที่นี่..."
                  />
                  <div className="text-[10px] text-slate-400 bg-white border border-slate-100 rounded-lg p-2 leading-relaxed">
                    <b>คีย์เวิร์ดที่รองรับ:</b> <code className="text-emerald-600">{`{orderId}`}</code>, <code className="text-emerald-600">{`{customerName}`}</code>, <code className="text-emerald-600">{`{customerPhone}`}</code>, <code className="text-emerald-600">{`{shippingStatus}`}</code>, <code className="text-emerald-600">{`{trackingNumber}`}</code>, <code className="text-emerald-600">{`{trackingUrl}`}</code>, <code className="text-emerald-600">{`{statusEmoji}`}</code>, <code className="text-emerald-600">{`{statusText}`}</code>
                  </div>
                </div>
              )}

              {activeTemplateTab === "cancel" && (
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-600 text-[11px]">ข้อความแจ้งยกเลิกคำสั่งซื้อ (templateCancel)</span>
                    <button
                      type="button"
                      onClick={() => setConfig({
                        ...config,
                        templateCancel: `❌ *ออเดอร์ถูกยกเลิก!* [ออเดอร์ {orderId}]\n---------------------------------\n👤 ลูกค้า: คุณ {customerName}\n📞 เบอร์โทร: {customerPhone}\n💰 ยอดรวม: {totalAmount} บาท\n---------------------------------\n⚠️ สถานะจัดส่ง: ยกเลิกออเดอร์ (Cancelled)\n💬 หมายเหตุที่ยกเลิก: {cancelReason}`
                      })}
                      className="text-[10px] text-emerald-600 font-bold hover:underline bg-transparent border-0 cursor-pointer"
                    >
                      คืนค่าเริ่มต้น
                    </button>
                  </div>
                  <textarea
                    rows={6}
                    value={config.templateCancel !== undefined ? config.templateCancel : `❌ *ออเดอร์ถูกยกเลิก!* [ออเดอร์ {orderId}]\n---------------------------------\n👤 ลูกค้า: คุณ {customerName}\n📞 เบอร์โทร: {customerPhone}\n💰 ยอดรวม: {totalAmount} บาท\n---------------------------------\n⚠️ สถานะจัดส่ง: ยกเลิกออเดอร์ (Cancelled)\n💬 หมายเหตุที่ยกเลิก: {cancelReason}`}
                    onChange={(e) => setConfig({ ...config, templateCancel: e.target.value })}
                    className="bg-white hover:bg-slate-50 focus:bg-white border border-slate-200/80 focus:border-emerald-500 rounded-xl p-3 font-sans text-[11px] text-slate-700 focus:outline-none resize-y leading-relaxed transition-all shadow-inner"
                    placeholder="วางรูปแบบข้อความที่นี่..."
                  />
                  <div className="text-[10px] text-slate-400 bg-white border border-slate-100 rounded-lg p-2 leading-relaxed">
                    <b>คีย์เวิร์ดที่รองรับ:</b> <code className="text-emerald-600">{`{orderId}`}</code>, <code className="text-emerald-600">{`{customerName}`}</code>, <code className="text-emerald-600">{`{customerPhone}`}</code>, <code className="text-emerald-600">{`{totalAmount}`}</code>, <code className="text-emerald-600">{`{cancelReason}`}</code>
                  </div>
                </div>
              )}
            </div>

            {/* Notification Banner statuses */}
            {saveStatus === "success" && (
              <div className="p-3.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-semibold flex items-center gap-2.5 border border-emerald-100 shadow-sm">
                <CheckCircle size={15} className="text-emerald-500 flex-shrink-0" />
                <span>{statusMessage}</span>
              </div>
            )}
            {saveStatus === "error" && (
              <div className="p-3.5 bg-rose-50 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2.5 border border-rose-100 shadow-sm">
                <ShieldAlert size={15} className="text-rose-500 flex-shrink-0" />
                <span>{statusMessage}</span>
              </div>
            )}

            {/* Save Buttons */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 border-0 shadow-md shadow-emerald-600/10 hover:shadow-emerald-600/20 active:scale-95"
              >
                {saving ? (
                  <RefreshCw className="animate-spin" size={13} />
                ) : (
                  <Check size={14} className="text-white stroke-[3px]" />
                )}
                <span>บันทึกตั้งค่า LINE API</span>
              </button>
            </div>
          </form>
        </div>

        {/* Custom Test Message sender */}
        <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-5 mb-6">
            <div className="p-2.5 bg-sky-50 text-[#29A6FF] rounded-xl">
              <Bell size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">
                ทดสอบส่งข้อความแจ้งเตือนทันที
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">ทดสอบพิมพ์ข้อความด้านล่างเพื่อลองให้บอทส่งสัญญาน Push Alert จริงเข้ากลุ่มทันที</p>
            </div>
          </div>

          <form onSubmit={handleSendTestNotify} className="flex flex-col gap-4 text-xs">
            <div className="flex flex-col gap-2">
              <label className="font-bold text-slate-600 uppercase tracking-wide">พิมพ์ข้อความแจ้งเตือนทดสอบ</label>
              <textarea
                rows={3}
                required
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="พิมพ์ข้อความที่นี่..."
                className="bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200/60 focus:border-sky-500 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/10 resize-none font-sans leading-relaxed transition-all shadow-inner"
              ></textarea>
            </div>

            {testResponse && (
              <div className={`p-3.5 rounded-xl text-xs font-semibold flex items-start gap-2.5 border shadow-sm ${
                testStatus === "success" 
                  ? "bg-sky-50 text-[#29A6FF] border-sky-100" 
                  : "bg-rose-50 text-rose-700 border-rose-100"
              }`}>
                {testStatus === "success" ? (
                  <CheckCircle size={15} className="text-[#29A6FF] flex-shrink-0 mt-0.5" />
                ) : (
                  <ShieldAlert size={15} className="text-rose-500 flex-shrink-0 mt-0.5" />
                )}
                <span>{testResponse}</span>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={sendingTest || !testMessage.trim()}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-900 text-white font-sans font-bold text-xs rounded-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-45 border-0 shadow-md active:scale-95"
              >
                {sendingTest ? (
                  <RefreshCw className="animate-spin" size={13} />
                ) : (
                  <Send size={13} className="text-sky-400 stroke-[2.5px]" />
                )}
                <span>ทดสอบยิงแจ้งเตือนเข้าระบบ</span>
              </button>
            </div>
          </form>
        </div>

      </div>

      {/* RIGHT COLUMN: Guide Instructions */}
      <div className="lg:col-span-5 flex flex-col gap-8">
        
        {/* Dynamic Instruction Card */}
        {currentMethod === "notify" ? (
          <div className="bg-slate-50/50 text-slate-800 rounded-2xl p-8 border border-slate-200/50 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
            
            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-6 flex items-center gap-2">
              <HelpCircle size={15} className="text-emerald-500" />
              วิธีการขอ LINE Notify Token ฟรีใน 2 นาที!
            </h4>

            <div className="flex flex-col gap-6 text-xs text-slate-600 font-sans">
              
              {/* Step 1 */}
              <div className="flex gap-4.5">
                <div className="w-6 h-6 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center font-bold text-xs text-emerald-600 flex-shrink-0 shadow-sm font-mono">
                  1
                </div>
                <div className="leading-relaxed flex-1">
                  <p className="font-bold text-slate-800">เข้าสู่เว็บไซต์ LINE Notify</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    เปิดเบราว์เซอร์ไปที่ลิงก์ด้านล่าง และกดปุ่มเข้าสู่ระบบ (Login) ด้วยบัญชี LINE ส่วนตัวหลักของคุณ
                    <a href="https://notify-bot.line.me/" target="_blank" rel="noreferrer" className="mt-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1 w-max shadow-sm hover:shadow transition-all">
                      <span>notify-bot.line.me</span>
                      <ExternalLink size={10} />
                    </a>
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4.5">
                <div className="w-6 h-6 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center font-bold text-xs text-emerald-600 flex-shrink-0 shadow-sm font-mono">
                  2
                </div>
                <div className="leading-relaxed flex-1">
                  <p className="font-bold text-slate-800">ไปที่เมนู "หน้าของฉัน" (My Page)</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    คลิกที่ชื่อโปรไฟล์ LINE ของคุณมุมขวาบน เลือกเมนู <b>หน้าของฉัน (My Page)</b> จากนั้นเลื่อนลงมาด้านล่างสุด แล้วกดปุ่ม <b>ออกโทเคน (Generate Token)</b>
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4.5">
                <div className="w-6 h-6 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center font-bold text-xs text-emerald-600 flex-shrink-0 shadow-sm font-mono">
                  3
                </div>
                <div className="leading-relaxed flex-1">
                  <p className="font-bold text-slate-800">ตั้งชื่อและเลือกกลุ่มแชทเป้าหมาย</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    กรอกชื่อผู้ส่ง (เช่น S SHOP) ชื่อนี้จะแสดงนำหน้าแชท จากนั้นเลือกกลุ่มสนทนาที่คุณต้องการให้บอทส่งออเดอร์เข้าไปเพื่อรายงานผล (หรือเลือกส่งรับคนเดียวก็ย่อมได้)
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-4.5">
                <div className="w-6 h-6 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center font-bold text-xs text-rose-500 flex-shrink-0 shadow-sm font-mono animate-pulse">
                  4
                </div>
                <div className="leading-relaxed flex-1">
                  <p className="font-bold text-slate-800 text-rose-600">ข้อสำคัญที่สุด! เชิญบอทเข้ากลุ่ม</p>
                  <p className="text-[11px] text-slate-500 mt-1 font-sans">
                    หลังจากคัดลอก Token มาใส่ในฟอร์มซ้ายมือแล้ว <b>คุณต้องกดเชิญ (Invite) บัญชี LINE อย่างเป็นทางการชื่อ <span className="font-bold text-slate-800 underline">LINE Notify</span> เข้าไปอยู่ในกลุ่มสนทนาเป้าหมายนั้นด้วย</b> บอทจึงจะมีสิทธิ์ส่งรายงานแจ้งเตือนออเดอร์เข้าไปได้สำเร็จ!
                  </p>
                </div>
              </div>

            </div>
          </div>
        ) : (
          <div className="bg-slate-50/50 text-slate-800 rounded-2xl p-8 border border-slate-200/50 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
            
            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-6 flex items-center gap-2">
              <HelpCircle size={15} className="text-emerald-500" />
              วิธีเชื่อมต่อ LINE OA (Official Account) API
            </h4>

            <div className="flex flex-col gap-6 text-xs text-slate-600 font-sans">
              
              {/* Step 1 */}
              <div className="flex gap-4.5">
                <div className="w-6 h-6 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center font-bold text-xs text-emerald-600 flex-shrink-0 shadow-sm font-mono">
                  1
                </div>
                <div className="leading-relaxed flex-1">
                  <p className="font-bold text-slate-800">สมัคร LINE Official Account</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    หากยังไม่มีบัญชีร้านค้า ให้เปิดลงทะเบียนบัญชี LINE OA เพื่อให้ร้านค้าได้ไอดีและช่องแชททางการฟรีที่ลิงก์ด้านล่าง
                    <a href="https://manager.line.biz/" target="_blank" rel="noreferrer" className="mt-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1 w-max shadow-sm hover:shadow transition-all">
                      <span>manager.line.biz</span>
                      <ExternalLink size={10} />
                    </a>
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4.5">
                <div className="w-6 h-6 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center font-bold text-xs text-emerald-600 flex-shrink-0 shadow-sm font-mono">
                  2
                </div>
                <div className="leading-relaxed flex-1">
                  <p className="font-bold text-slate-800">เข้าสู่ระบบ LINE Developers Console</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    ไปที่ Console แล้วกดสร้าง <b>Provider</b> (ชื่อบริษัท/ร้านค้า) จากนั้นสร้าง <b>Channel</b> ใหม่ประเภท <b>Messaging API</b>
                    <a href="https://developers.line.biz/" target="_blank" rel="noreferrer" className="mt-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1 w-max shadow-sm hover:shadow transition-all">
                      <span>developers.line.biz</span>
                      <ExternalLink size={10} />
                    </a>
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4.5">
                <div className="w-6 h-6 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center font-bold text-xs text-emerald-600 flex-shrink-0 shadow-sm font-mono">
                  3
                </div>
                <div className="leading-relaxed flex-1">
                  <p className="font-bold text-slate-800">คัดลอก Channel Access Token & Secret</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    • <b>Channel Secret:</b> คัดลอกจากแท็บ <i>Basic settings</i>
                    <br />• <b>Access Token:</b> ไปที่แท็บ <i>Messaging API</i> เลื่อนล่างสุด กดปุ่ม <b>Issue</b> ในหัวข้อ <i>Channel access token (long-lived)</i> เพื่อคัดลอกมาระบุในแอปนี้
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-4.5">
                <div className="w-6 h-6 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center font-bold text-xs text-rose-500 flex-shrink-0 shadow-sm font-mono animate-pulse">
                  4
                </div>
                <div className="leading-relaxed flex-1">
                  <p className="font-bold text-slate-800 text-rose-600">วิธีหารหัส LINE User ID ของคุณ</p>
                  <p className="text-[11px] text-slate-500 mt-1 font-sans">
                    ในแท็บ <i>Basic settings</i> ของ LINE Developers เลื่อนมาด้านล่างสุด คุณจะพบหัวข้อ <b>Your user ID</b> (รหัสจะขึ้นต้นด้วยตัว U ตามด้วยตัวอักษร 32 ตัว) คัดลอกรหัสนี้มาใส่ช่อง <i>Admin LINE User ID</i> ซ้ายมือ บอทจึงจะส่งรายงานไปหาถูกคน!
                  </p>
                </div>
              </div>

              {/* Step 5 */}
              <div className="flex gap-4.5">
                <div className="w-6 h-6 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center font-bold text-xs text-emerald-600 flex-shrink-0 shadow-sm font-mono">
                  5
                </div>
                <div className="leading-relaxed flex-1">
                  <p className="font-bold text-slate-800">วิธีสร้าง LINE Login LIFF ID</p>
                  <p className="text-[11px] text-slate-500 mt-1 font-sans">
                    • <b>สร้าง LINE Login Channel:</b> ใน LINE Developers Console กดสร้าง Channel ใหม่ประเภท <b>LINE Login</b>
                    <br />• <b>ไปที่แท็บ LIFF:</b> กดคลิกแท็บ <i>LIFF</i> แล้วกดปุ่ม <b>Add</b> เพื่อสร้าง LIFF app ใหม่
                    <br />• <b>ตั้งค่าข้อมูลแอป:</b> ใส่ชื่อแอป เลือกขนาดเป็น <i>Full</i>, เปิดสิทธิ์ <i>profile</i> และ <i>openid</i>
                    <br />• <b>ระบุ Endpoint URL:</b> นำ URL เว็บไซต์ของคุณระบุลงในช่อง <i>Endpoint URL</i> (เช่น <span className="font-mono bg-slate-100 p-0.5 rounded text-[10px]">{appUrl}</span>) จากนั้นกดบันทึก
                    <br />• <b>คัดลอก LIFF ID:</b> นำรหัส <b>LIFF ID</b> ที่ได้ มากรอกลงในช่อง <i>LINE Login LIFF ID</i> ซ้ายมือเพื่อเชื่อมระบบล็อกอินของจริง!
                  </p>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Integration Architecture Card */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-4">
            <div className="p-1.5 bg-slate-50 text-slate-500 rounded-lg">
              <Shield size={14} />
            </div>
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
              ความปลอดภัยและการเก็บข้อมูล (REST API)
            </h4>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
            ระบบทำงานบนสถาปัตยกรรมแบบ <b>Full-stack Node.js (Express + Vite + React)</b> ปลอดภัยสูงสุด 100% เนื่องจากรหัส Token และข้อมูลที่ละเอียดอ่อนทั้งหมดจะถูกประมวลผลผ่านเซิร์ฟเวอร์หลังบ้าน (Secure Server-side Context) เสมอ ทำให้ปลอดภัยจากการถูกโจรกรรมข้อมูลหรือดักจับโค้ดที่ฝั่งเว็บบราวเซอร์ (Client-side)
          </p>
        </div>

      </div>

      {/* LINE Rich Menu Manager Section */}
      <div className="col-span-12 mt-4">
        <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500"></div>

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6 mb-8">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <LayoutGrid size={20} className="stroke-[2.5px]" />
                </div>
                <div>
                  <h3 className="font-display font-black text-slate-800 text-base md:text-lg flex items-center gap-2">
                    ระบบจัดการ LINE Rich Menu (เมนูลัดบนแชท)
                    <span className="text-[10px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-full tracking-widest uppercase">
                      PREMIUM
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    ออกแบบ จัดวางโครงร่างเมนูลัด และคัดลอกลิงก์ไปตั้งค่าบน LINE Official Account (manager.line.biz) ได้ทันที
                  </p>
                </div>
              </div>
            </div>

            {/* Layout Tabs Selector */}
            <div className="flex bg-slate-100 p-1.5 rounded-2xl self-start md:self-center overflow-x-auto max-w-full scrollbar-none whitespace-nowrap">
              <button
                type="button"
                onClick={() => setActiveLayout("grid6")}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex-shrink-0 ${
                  activeLayout === "grid6" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Grid size={13} />
                <span className="whitespace-nowrap">6 ช่องมาตรฐาน</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveLayout("cols3")}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex-shrink-0 ${
                  activeLayout === "cols3" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Layers size={13} />
                <span className="whitespace-nowrap">3 ช่องแนวตั้ง</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveLayout("banner1")}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex-shrink-0 ${
                  activeLayout === "banner1" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Smartphone size={13} />
                <span className="whitespace-nowrap">แบนเนอร์เดี่ยว</span>
              </button>
            </div>
          </div>

          {/* Builder Workspace Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT SIDE: Smartphone Interactive Mockup */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Smartphone size={12} /> คลิกเลือกแต่ละช่องบนมือถือด้านล่างเพื่อตั้งค่า
              </span>
              
              {/* Smartphone Wrapper */}
              <div className="w-full max-w-[290px] aspect-[9/18.5] bg-slate-900 rounded-[42px] p-3 shadow-2xl shadow-slate-900/15 border-4 border-slate-800/80 relative flex flex-col justify-between overflow-hidden">
                {/* Speaker/Camera notch */}
                <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-20 h-4 bg-slate-900 rounded-full z-30 flex items-center justify-center">
                  <div className="w-8 h-1.5 bg-slate-800 rounded-full"></div>
                </div>

                {/* Inner Screen Header */}
                <div className="bg-slate-800 pt-6 pb-2.5 px-4 flex items-center gap-2 border-b border-slate-700/50 z-20">
                  <div className="w-6 h-6 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center font-bold text-[10px] text-white">
                    S
                  </div>
                  <div className="leading-tight">
                    <p className="text-[10px] font-bold text-white leading-none">{config.storeName || "S Shop Online"}</p>
                    <p className="text-[7.5px] text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                      แอดมินพร้อมให้บริการ
                    </p>
                  </div>
                </div>

                {/* Inner Screen Body (Chat History Mockup) */}
                <div className="flex-1 bg-[#8598B2] p-3 overflow-y-auto flex flex-col gap-2.5 font-sans justify-end pb-4">
                  <div className="flex gap-2 items-start max-w-[85%] font-sans">
                    <div className="w-5 h-5 rounded-full bg-slate-800 border border-white/20 flex items-center justify-center text-[8px] font-black text-white flex-shrink-0">
                      S
                    </div>
                    <div className="bg-white rounded-2xl p-2.5 shadow-sm border border-slate-100">
                      <p className="text-[9.5px] text-slate-800 leading-normal">
                        สวัสดีครับคุณลูกค้า ยินดีต้อนรับสู่ระบบช้อปปิ้งพรีเมียมบน LINE OA ของเราครับ! 🎉
                      </p>
                      <span className="text-[7px] text-slate-400 block text-right mt-1 font-mono">10:32 AM</span>
                    </div>
                  </div>

                  <div className="flex gap-2 items-start max-w-[85%] font-sans">
                    <div className="w-5 h-5 rounded-full bg-slate-800 border border-white/20 flex items-center justify-center text-[8px] font-black text-white flex-shrink-0">
                      S
                    </div>
                    <div className="bg-white rounded-2xl p-2.5 shadow-sm border border-slate-100">
                      <p className="text-[9.5px] text-slate-800 leading-normal">
                        ด้านล่างคือ **Rich Menu** ลัดในการเข้าชมร้านค้า ตรวจสอบสถานะออเดอร์ หรือติดต่อเราได้ทันทีเพียงปลายนิ้วสัมผัสครับ 👇
                      </p>
                      <span className="text-[7px] text-slate-400 block text-right mt-1 font-mono">10:32 AM</span>
                    </div>
                  </div>
                </div>

                {/* Dynamic Rich Menu Grid Layout inside Mockup */}
                <div className="bg-slate-50 border-t border-slate-200 p-1.5 z-20 font-sans">
                  <div className="text-[7px] font-black text-slate-400 uppercase tracking-widest text-center mb-1">
                    📱 เมนูอำนวยความสะดวกริชเมนู (Rich Menu)
                  </div>
                  
                  {activeLayout === "grid6" && (
                    <div className="grid grid-cols-2 gap-1.5">
                      {tilesConfig.grid6.map((tile, i) => {
                        const isSelected = selectedTile === i;
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setSelectedTile(i)}
                            className={`p-2.5 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer min-h-[48px] border transition-all relative ${
                              isSelected
                                ? "ring-2 ring-emerald-500 scale-[1.03] shadow-md z-10 border-emerald-500 bg-emerald-50 text-emerald-900 font-black"
                                : "bg-white border-slate-100 hover:bg-slate-50 text-slate-700 shadow-sm font-semibold"
                            }`}
                          >
                            <span className="text-[10px] font-sans break-all line-clamp-1 leading-tight font-bold">
                              {tile.label || `ปุ่มที่ ${i+1}`}
                            </span>
                            <span className="text-[6.5px] text-slate-400 mt-0.5 uppercase tracking-wide font-bold">
                              {tile.type === "url" ? "🔗 ลิงก์ร้าน" : "💬 ส่งคำ"}
                            </span>
                            {isSelected && (
                              <span className="absolute -top-1 -right-1 bg-emerald-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold shadow-md">
                                {i + 1}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {activeLayout === "cols3" && (
                    <div className="grid grid-cols-3 gap-1.5">
                      {tilesConfig.cols3.map((tile, i) => {
                        const isSelected = selectedTile === i;
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setSelectedTile(i)}
                            className={`p-2.5 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer min-h-[72px] border transition-all relative ${
                              isSelected
                                ? "ring-2 ring-emerald-500 scale-[1.03] shadow-md z-10 border-emerald-500 bg-emerald-50 text-emerald-900 font-black"
                                : "bg-white border-slate-100 hover:bg-slate-50 text-slate-700 shadow-sm font-semibold"
                            }`}
                          >
                            <span className="text-[10px] font-sans break-all line-clamp-2 leading-tight font-bold">
                              {tile.label || `ปุ่มที่ ${i+1}`}
                            </span>
                            <span className="text-[6.5px] text-slate-400 mt-1 uppercase tracking-wide font-bold">
                              {tile.type === "url" ? "🔗 ลิงก์" : "💬 คำส่ง"}
                            </span>
                            {isSelected && (
                              <span className="absolute -top-1 -right-1 bg-emerald-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold shadow-md">
                                {i + 1}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {activeLayout === "banner1" && (
                    <div className="grid grid-cols-1">
                      {tilesConfig.banner1.map((tile, i) => {
                        const isSelected = selectedTile === i;
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setSelectedTile(i)}
                            className={`p-4 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer min-h-[92px] border transition-all relative ${
                              isSelected
                                ? "ring-2 ring-emerald-500 scale-[1.02] shadow-md z-10 border-emerald-500 bg-emerald-50 text-emerald-900 font-black"
                                : "bg-white border-slate-100 hover:bg-slate-50 text-slate-700 shadow-sm font-semibold"
                            }`}
                          >
                            <span className="text-xs font-sans break-all line-clamp-2 leading-tight font-bold font-semibold">
                              {tile.label || `แบนเนอร์`}
                            </span>
                            <span className="text-[7.5px] text-slate-400 mt-1.5 uppercase tracking-wide font-bold">
                              {tile.type === "url" ? "🔗 เปิดลิงก์ร้านค้า" : "💬 ส่งข้อความพิเศษ"}
                            </span>
                            {isSelected && (
                              <span className="absolute -top-1 -right-1 bg-emerald-500 text-white w-4.5 h-4.5 rounded-full flex items-center justify-center text-[9px] font-bold shadow-md">
                                ✓
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT SIDE: Action Tile Configurator panel */}
            <div className="lg:col-span-7 flex flex-col gap-6 font-sans">
              
              {/* Settings Card for Selected Tile */}
              <div className="bg-slate-50/50 border border-slate-200/60 rounded-2xl p-6 relative">
                <div className="absolute top-4 right-4 text-[10px] font-extrabold text-slate-400 bg-white border border-slate-100 px-2.5 py-1 rounded-full uppercase shadow-sm">
                  ตำแหน่งที่ {selectedTile + 1}
                </div>

                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-5 flex items-center gap-1.5">
                  <Settings2 size={14} className="text-emerald-500" />
                  ปรับแต่งคุณสมบัติปุ่มควบคุม
                </h4>

                <div className="flex flex-col gap-5 text-xs font-sans">
                  {/* Button Label */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                      ข้อความอ้างอิงบนรูปปุ่ม (Button Label)
                    </label>
                    <input
                      type="text"
                      value={tilesConfig[activeLayout][selectedTile]?.label || ""}
                      onChange={(e) => handleTileChange("label", e.target.value)}
                      placeholder="เช่น ช้อปสินค้าเลย 🛍️"
                      className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-sans shadow-sm"
                    />
                  </div>

                  {/* Action Type */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                      ประเภทแอคชันเมนู (Action Type)
                    </label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        type="button"
                        onClick={() => handleTileChange("type", "url")}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border font-bold transition-all text-xs cursor-pointer whitespace-nowrap ${
                          tilesConfig[activeLayout][selectedTile]?.type === "url"
                            ? "bg-emerald-50 border-emerald-500 text-emerald-700 font-extrabold shadow-sm"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <ExternalLink size={13} className="flex-shrink-0" />
                        <span className="whitespace-nowrap">เปิดลิงก์ URL</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTileChange("type", "text")}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border font-bold transition-all text-xs cursor-pointer whitespace-nowrap ${
                          tilesConfig[activeLayout][selectedTile]?.type === "text"
                            ? "bg-emerald-50 border-emerald-500 text-emerald-700 font-extrabold shadow-sm"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <MessageSquare size={13} className="flex-shrink-0" />
                        <span className="whitespace-nowrap">ส่งคำพูด/คีย์เวิร์ด</span>
                      </button>
                    </div>
                  </div>

                  {/* Action Value Configurator */}
                  {tilesConfig[activeLayout][selectedTile]?.type === "url" ? (
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                        ปลายทางลิงก์เว็บแอปพลิเคชัน (Link URL Destination)
                      </label>
                      
                      {/* Prefilled Helper Links Buttons */}
                      <div className="flex flex-wrap gap-1.5 mb-1.5">
                        <span className="text-[9px] font-extrabold text-slate-400 mr-1.5 py-1">ด่วน:</span>
                        <button
                          type="button"
                          onClick={() => handleTileChange("value", "/?view=shop")}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 text-[10px] text-slate-600 font-bold rounded-lg border border-slate-200/60 cursor-pointer"
                        >
                          🛍️ หน้าช้อป
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTileChange("value", "/?view=orders")}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 text-[10px] text-slate-600 font-bold rounded-lg border border-slate-200/60 cursor-pointer"
                        >
                          📦 ติดตามพัสดุ
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTileChange("value", "/?view=cart")}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 text-[10px] text-slate-600 font-bold rounded-lg border border-slate-200/60 cursor-pointer"
                        >
                          🛒 ตะกร้าสินค้า
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTileChange("value", "/?view=auth")}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 text-[10px] text-slate-600 font-bold rounded-lg border border-slate-200/60 cursor-pointer"
                        >
                          🔑 เข้าสู่ระบบ
                        </button>
                      </div>

                      {/* Manual Path input */}
                      <div className="flex flex-col gap-1.5 relative">
                        <span className="text-[9px] text-slate-400 font-medium">ระบุพาร์ทหรือโดเมนภายนอก:</span>
                        <input
                          type="text"
                          value={tilesConfig[activeLayout][selectedTile]?.value || ""}
                          onChange={(e) => handleTileChange("value", e.target.value)}
                          placeholder="เช่น /?view=shop หรือ https://..."
                          className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-mono"
                        />
                      </div>

                      {/* Computed Full URL Output with Single Click Copy */}
                      {appUrl && (
                        <div className="mt-3 p-3.5 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest block mb-0.5">
                              ลิงก์ตัวเต็มนำไปวางใน LINE Rich Menu *
                            </span>
                            <span className="text-[10px] text-slate-700 font-mono font-bold block truncate">
                              {tilesConfig[activeLayout][selectedTile]?.value.startsWith("http")
                                ? tilesConfig[activeLayout][selectedTile]?.value
                                : `${appUrl}${tilesConfig[activeLayout][selectedTile]?.value || ""}`}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const targetVal = tilesConfig[activeLayout][selectedTile]?.value || "";
                              const fullText = targetVal.startsWith("http") ? targetVal : `${appUrl}${targetVal}`;
                              handleCopyTileUrl(selectedTile, fullText);
                            }}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10.5px] font-black tracking-wide border transition-all cursor-pointer whitespace-nowrap ${
                              copiedTileId === selectedTile
                                ? "bg-emerald-500 text-white border-transparent"
                                : "bg-white text-emerald-600 border-slate-200 hover:border-emerald-500/30"
                            }`}
                          >
                            {copiedTileId === selectedTile ? (
                              <>
                                <Check size={11} className="stroke-[3px]" />
                                <span>คัดลอกแล้ว!</span>
                              </>
                            ) : (
                              <>
                                <Copy size={11} />
                                <span>คัดลอกลิงก์</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                        ข้อความตอบกลับด่วน (แชทข้อความเมื่อกด)
                      </label>
                      <textarea
                        rows={3}
                        value={tilesConfig[activeLayout][selectedTile]?.value || ""}
                        onChange={(e) => handleTileChange("value", e.target.value)}
                        placeholder="เมื่อลูกค้ากดปุ่มนี้ ลูกค้าจะพิมพ์ส่งคำนี้หาบอททันทีในแชท..."
                        className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-sans shadow-sm"
                      />
                      <p className="text-[9.5px] text-slate-400">
                        * สามารถใช้คำตอบกลับนี้เชื่อมต่อกับข้อความตอบกลับอัตโนมัติ (Auto-response) ในแผงควบคุม LINE OA ได้
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* How to Configure in LINE OA Step-by-Step */}
              <div className="bg-slate-150/40 rounded-2xl p-6 border border-slate-200/50">
                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <Info size={14} className="text-slate-500" />
                  ขั้นตอนการนำไปติดตั้งบนระบบ LINE OA
                </h4>

                <div className="flex flex-col gap-4 text-xs font-sans text-slate-600">
                  <div className="flex gap-3">
                    <span className="font-mono text-[10px] font-black bg-white border border-slate-200 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 text-slate-700 shadow-sm">
                      1
                    </span>
                    <p className="leading-relaxed">
                      เข้าสู่ระบบ <b>LINE Official Account Manager</b> ที่หน้าเว็บไซต์{" "}
                      <a href="https://manager.line.biz" target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline font-bold inline-flex items-center gap-0.5">
                        manager.line.biz <ExternalLink size={10} />
                      </a>
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <span className="font-mono text-[10px] font-black bg-white border border-slate-200 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 text-slate-700 shadow-sm">
                      2
                    </span>
                    <p className="leading-relaxed">
                      ไปที่เมนูด้านซ้าย: <b>เมนูห้องแชท (Chat Room Menus)</b> แล้วเลือกหัวข้อ <b>ริชเมนู (Rich menus)</b> จากนั้นกดปุ่มสร้างใหม่
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <span className="font-mono text-[10px] font-black bg-white border border-slate-200 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 text-slate-700 shadow-sm">
                      3
                    </span>
                    <p className="leading-relaxed">
                      ในส่วนของ <b>เทมเพลต (Template)</b> ให้เลือกรูปแบบที่ตรงกับเมนูดีไซน์ (เช่น แบบ 6 ช่องใหญ่ หรือ 3 ช่องยาว) จากนั้นอัปโหลดรูปภาพพื้นหลังของคุณให้สวยงาม
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <span className="font-mono text-[10px] font-black bg-white border border-slate-200 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 text-slate-700 shadow-sm">
                      4
                    </span>
                    <p className="leading-relaxed font-sans">
                      ในหัวข้อ <b>คอนเทนต์ (Content Actions)</b> สำหรับแต่ละตำแหน่ง ให้เลือกแอคชันเป็น <b>ลิงก์ (Link)</b> แล้วคัดลอกลิงก์ด้านบนของหน้าจอนี้ไปกรอกใส่เป็นปลายทางได้ทันที!
                    </p>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>

    </div>
  );
}
