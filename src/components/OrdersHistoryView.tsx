import React, { useState } from "react";
import { Order, Product } from "../types";
import { History, ShoppingBag, FileText, CheckCircle, RefreshCw, Smartphone, CreditCard, ShieldAlert, UploadCloud, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "../localization";

interface OrdersHistoryViewProps {
  orders: Order[];
  products: Product[];
  onRefreshData: () => void;
  currentUser: { id: string } | null;
}

export default function OrdersHistoryView({ orders, products, onRefreshData, currentUser }: OrdersHistoryViewProps) {
  const { t, lang } = useTranslation();
  const [payingOrder, setPayingOrder] = useState<Order | null>(null);
  const [slipBase64, setSlipBase64] = useState<string | null>(null);
  const [slipName, setSlipName] = useState("");
  const [submittingSlip, setSubmittingSlip] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Shipping details input states for payment modal
  const [custNameInput, setCustNameInput] = useState("");
  const [custPhoneInput, setCustPhoneInput] = useState("");
  const [custAddressInput, setCustAddressInput] = useState("");

  React.useEffect(() => {
    if (payingOrder) {
      setCustNameInput(payingOrder.customerName !== "ลูกค้าสมาชิก" ? payingOrder.customerName : "");
      setCustPhoneInput(payingOrder.customerPhone !== "-" ? payingOrder.customerPhone : "");
      setCustAddressInput(
        payingOrder.customerAddress !== "กรุณากรอกรายละเอียดที่อยู่จัดส่งและชำระเงิน" &&
        payingOrder.customerAddress !== "รอผู้ใช้ระบุรายละเอียดจัดส่งและแนบสลิปชำระเงิน"
          ? payingOrder.customerAddress
          : ""
      );
    } else {
      setCustNameInput("");
      setCustPhoneInput("");
      setCustAddressInput("");
    }
  }, [payingOrder]);

  // Status helper for colors
  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <span className="text-[10px] font-bold text-[#29A6FF] bg-sky-50 px-2.5 py-1 rounded-xl border border-sky-100">{lang === "th" ? "✅ ชำระเงินแล้ว" : "✅ Paid"}</span>;
      case "verifying":
        return <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 animate-pulse">{lang === "th" ? "⏳ รอตรวจสอบการชำระเงิน" : "⏳ Verifying Payment"}</span>;
      case "failed":
        return <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100">{lang === "th" ? "❌ ชำระเงินไม่สำเร็จ" : "❌ Payment Failed"}</span>;
      default:
        return <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">{lang === "th" ? "⏳ รอแนบสลิปชำระเงิน" : "⏳ Pending Slip"}</span>;
    }
  };

  const getShippingStatusBadge = (status: string) => {
    switch (status) {
      case "delivered":
        return <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">{lang === "th" ? "📦 ส่งสำเร็จ" : "📦 Delivered"}</span>;
      case "shipped":
        return <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">{lang === "th" ? "🚚 กำลังจัดส่ง" : "🚚 Shipped"}</span>;
      case "cancelled":
        return <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">{lang === "th" ? "❌ ยกเลิก" : "❌ Cancelled"}</span>;
      default:
        return <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">{lang === "th" ? "⏳ รอจัดส่ง" : "⏳ Processing"}</span>;
    }
  };

  // Upload actions inside modal
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert(lang === "th" ? "กรุณาอัปโหลดรูปภาพเท่านั้น!" : "Please upload images only!");
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

  const handleUploadSlipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingOrder || !slipBase64) return;

    if (!custNameInput.trim() || !custPhoneInput.trim() || !custAddressInput.trim()) {
      alert(lang === "th" ? "กรุณากรอกข้อมูลที่อยู่จัดส่งให้ครบถ้วน!" : "Please fill in all shipping details!");
      return;
    }

    setSubmittingSlip(true);
    try {
      const response = await fetch(`/api/orders/${payingOrder.id}/upload-slip`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": currentUser?.id || "",
        },
        body: JSON.stringify({
          slipBase64,
          customerName: custNameInput,
          customerPhone: custPhoneInput,
          customerAddress: custAddressInput
        }),
      });

      if (response.ok) {
        alert(lang === "th" ? "อัปโหลดสลิปชำระเงินเรียบร้อยแล้ว! ออเดอร์ของคุณอยู่ระหว่างรอการตรวจสอบ" : "Payment slip uploaded successfully! Your order is being verified.");
        // Also fire LINE update in the background (do not await to prevent blocking the UI/popup from closing)
        fetch(`/api/orders/${payingOrder.id}/send-line`, { method: "POST" }).catch((lineErr) => {
          console.error("Error sending LINE notification after uploading slip:", lineErr);
        });
        onRefreshData();
        setPayingOrder(null);
        setSlipBase64(null);
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(lang === "th" 
          ? `เกิดข้อผิดพลาด: ${errorData.error || "ไม่สามารถอัปโหลดสลิปได้"}` 
          : `Error: ${errorData.error || "Failed to upload slip"}`
        );
      }
    } catch (err) {
      console.error("Error uploading slip:", err);
      alert(lang === "th" 
        ? "เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง" 
        : "Connection error, please try again"
      );
    } finally {
      setSubmittingSlip(false);
    }
  };

  const [cancellingOrder, setCancellingOrder] = useState<string | null>(null);

  const handleCancelOrder = async (orderId: string) => {
    const confirmMsg = lang === "th"
      ? "คุณแน่ใจหรือไม่ว่าต้องการยกเลิกคำสั่งซื้อนี้?\nเมื่อยกเลิกแล้วระบบจะส่งข้อความแจ้งร้านค้าและไม่สามารถแก้ไขสถานะออเดอร์นี้ได้อีก"
      : "Are you sure you want to cancel this order?\nOnce cancelled, the shop will be notified and this status cannot be reverted.";
      
    if (!window.confirm(confirmMsg)) {
      return;
    }

    setCancellingOrder(orderId);
    try {
      const response = await fetch(`/api/orders/${orderId}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": currentUser?.id || "",
        },
        body: JSON.stringify({
          reason: lang === "th" ? "ยกเลิกคำสั่งซื้อโดยผู้ซื้อ" : "Cancelled by buyer"
        })
      });

      if (response.ok) {
        alert(lang === "th" ? "ยกเลิกคำสั่งซื้อเรียบร้อยแล้ว!" : "Order cancelled successfully!");
        onRefreshData();
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(lang === "th"
          ? `เกิดข้อผิดพลาด: ${errorData.error || "ไม่สามารถยกเลิกคำสั่งซื้อได้"}`
          : `Error: ${errorData.error || "Failed to cancel order"}`
        );
      }
    } catch (err) {
      console.error("Error cancelling order:", err);
      alert(lang === "th" ? "เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง" : "Connection error, please try again");
    } finally {
      setCancellingOrder(null);
    }
  };

  return (
    <div id="orders-history" className="pb-12">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-sm font-sans font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
            <History className="text-[#29A6FF]" size={14} />
            {t("orders_title")}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 font-sans">
            {lang === "th"
              ? "ตรวจสอบรายการสั่งซื้อ รายละเอียดการชำระเงิน และติดตามสถานะการจัดส่งเรียลไทม์"
              : "Review your purchase orders, payment details and track delivery status in real-time."}
          </p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center shadow-sm max-w-xl mx-auto my-6">
          <ShoppingBag size={32} className="mx-auto text-slate-300 mb-3 animate-pulse" />
          <h3 className="font-sans font-bold text-slate-800 text-xs mb-1">{t("orders_empty")}</h3>
          <p className="text-slate-400 text-xs leading-relaxed max-w-xs mx-auto">
            {lang === "th"
              ? "คุณยังไม่มีประวัติคำสั่งซื้อในแอปนี้ ลองไปเลือกชมสินค้าคุณภาพเยี่ยมที่หน้าร้านได้เลย!"
              : "You haven't placed any orders yet. Visit our premium catalog to add minimal products to your collection!"}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:border-slate-200 transition-all flex flex-col md:flex-row justify-between gap-5"
            >
              <div className="flex-1">
                {/* Order MetaHeader */}
                <div className="flex flex-wrap items-center gap-3 mb-3 border-b border-slate-50 pb-2">
                  <span className="font-mono font-bold text-slate-700 text-xs uppercase tracking-wide select-all">
                    {t("orders_id")}: {order.id}
                  </span>
                  <span className="text-slate-400 font-mono text-[10px]">
                    {new Date(order.createdAt).toLocaleString(lang === "th" ? "th-TH" : "en-US")}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md font-mono border border-slate-100">
                    LINE: {order.lineNotificationStatus === "sent" ? (lang === "th" ? "✅ แจ้งเตือนแล้ว" : "✅ Notified") : (lang === "th" ? "⏳ คิวส่ง" : "⏳ Queued")}
                  </span>
                </div>

                {/* Items */}
                <div className="flex flex-col gap-1 text-xs mb-3 text-slate-600 font-sans">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between max-w-md">
                      <span>• {item.name} <span className="font-mono text-slate-400">x{item.quantity}</span></span>
                      <span className="font-semibold text-slate-700">฿{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                {/* Recipient info */}
                <div className="text-[10px] text-slate-400 leading-normal border-t border-slate-50 pt-2 flex flex-col gap-0.5 font-sans">
                  <p><span className="font-bold text-slate-500">{lang === "th" ? "ผู้รับ:" : "Recipient:"}</span> {order.customerName} ({order.customerPhone})</p>
                  <p className="truncate max-w-xl"><span className="font-bold text-slate-500">{lang === "th" ? "ที่อยู่:" : "Address:"}</span> {order.customerAddress}</p>
                </div>

                {order.trackingNumber && (
                  <div className="mt-3 p-3.5 bg-blue-50/50 rounded-xl border border-blue-100/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                      <div>
                        <span className="font-sans font-semibold text-slate-700 block sm:inline">{lang === "th" ? "เลขพัสดุ (Tracking Number): " : "Tracking Number: "}</span>
                        <span className="font-mono font-bold text-blue-600 bg-blue-100/60 px-2 py-0.5 rounded text-[11px] select-all tracking-wider inline-block mt-1 sm:mt-0">
                          {order.trackingNumber}
                        </span>
                      </div>
                    </div>
                    {order.trackingUrl && (
                      <a
                        href={order.trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1 text-[11px] font-sans font-bold text-white bg-blue-600 hover:bg-blue-700 px-3.5 py-2 rounded-lg transition-colors cursor-pointer w-full sm:w-auto text-center shadow-sm"
                      >
                        <ExternalLink size={12} />
                        <span>{lang === "th" ? "ติดตามสถานะพัสดุ" : "Track Package"}</span>
                      </a>
                    )}
                  </div>
                )}

                {order.shippingStatus === "cancelled" && order.cancelReason && (
                  <div className="mt-3 p-3.5 bg-rose-50 rounded-xl border border-rose-100/60 text-rose-800 text-xs font-sans leading-relaxed">
                    <span className="font-extrabold block mb-0.5 text-rose-900">{lang === "th" ? "💬 หมายเหตุที่ยกเลิก:" : "💬 Cancellation Reason:"}</span>
                    {order.cancelReason}
                  </div>
                )}
              </div>

              {/* Status and Action Section */}
              <div className="flex flex-col justify-between items-start md:items-end gap-3 flex-shrink-0">
                <div className="flex flex-col items-start md:items-end gap-1.5 text-xs">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">{t("orders_total")}</span>
                  <span className="font-display font-black text-brand-green text-base leading-none">
                    ฿{order.totalAmount.toLocaleString()}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {getPaymentStatusBadge(order.paymentStatus)}
                  {getShippingStatusBadge(order.shippingStatus)}
                </div>

                <div className="flex flex-col gap-2 w-full md:w-auto items-stretch md:items-end">
                  {/* Upload slip secondary trigger if pending */}
                  {order.paymentStatus === "pending" && (
                    <button
                      onClick={() => setPayingOrder(order)}
                      className="w-full md:w-auto bg-slate-800 hover:bg-slate-900 text-white text-[10px] font-bold px-3.5 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm border-0"
                    >
                      <CreditCard size={11} className="text-brand-green" />
                      <span>{lang === "th" ? "ชำระเงินและแนบสลิป" : "Pay & Attach Slip"}</span>
                    </button>
                  )}

                  {/* Cancel button if order is not shipped/delivered/cancelled */}
                  {order.shippingStatus !== "shipped" && order.shippingStatus !== "delivered" && order.shippingStatus !== "cancelled" && (
                    <button
                      onClick={() => handleCancelOrder(order.id)}
                      disabled={cancellingOrder === order.id}
                      className="w-full md:w-auto bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] font-bold px-3.5 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm border border-rose-200/40 disabled:opacity-50"
                    >
                      <span>❌ {lang === "th" ? "ยกเลิกคำสั่งซื้อ" : "Cancel Order"}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PAYMENT AND SLIP MODAL */}
      {payingOrder && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-md w-full shadow-lg border border-slate-100 overflow-hidden"
          >
            <div className="bg-[#EBF3F8] text-slate-800 border-b border-[#DAE5EF] p-4 flex justify-between items-center">
              <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-[#2F526B] flex items-center gap-1.5">
                <CreditCard size={13} className="text-[#2F526B]" />
                {lang === "th" ? `ชำระเงินออเดอร์ ${payingOrder.id}` : `Pay Order ${payingOrder.id}`}
              </h4>
              <button
                onClick={() => { setPayingOrder(null); setSlipBase64(null); }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer transition-colors border-0 bg-transparent font-sans"
              >
                {lang === "th" ? "ปิด" : "Close"}
              </button>
            </div>

            <form onSubmit={handleUploadSlipSubmit} className="p-5 flex flex-col gap-4 text-xs max-h-[85vh] overflow-y-auto">
              <div className="flex flex-col items-center gap-2">
                {/* Fake PromptPay design inside modal */}
                <div className="bg-[#EBF3F8] text-[#2F526B] p-4 rounded-2xl border border-[#DAE5EF] flex flex-col items-center gap-2 w-40 text-center shadow-sm">
                  <span className="bg-[#2F526B] text-white text-[7px] font-bold px-1.5 py-0.5 rounded-lg leading-none uppercase">PromptPay</span>
                  
                  {/* Fake QR mini */}
                  <div className="w-16 h-16 bg-white rounded-xl p-1.5 grid grid-cols-3 gap-1.5 opacity-90 select-none border border-[#CBD5E1]/30">
                    {[...Array(9)].map((_, i) => (
                      <div key={i} className={`rounded-[1px] ${i % 2 === 0 ? "bg-[#2F526B]" : "bg-transparent"}`}></div>
                    ))}
                  </div>
                  
                  <span className="text-xs font-bold text-slate-800">฿{payingOrder.totalAmount.toLocaleString()}</span>
                </div>
                <p className="text-[9px] text-slate-400 text-center font-sans mt-1">
                  {lang === "th"
                    ? "สแกนชำระเงินและกรอกข้อมูลที่อยู่จัดส่งพร้อมอัปโหลดรูปภาพสลิปที่โอนด้านล่างนี้"
                    : "Scan QR to make PromptPay payment, then fill shipping details and upload transfer slip."}
                </p>
              </div>

              {/* Shipping Information Fields */}
              <div className="flex flex-col gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-150">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                  📍 {lang === "th" ? "ข้อมูลจัดส่งและใบเสร็จ" : "Shipping & Receipt Info"}
                </p>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                    {lang === "th" ? "ชื่อผู้รับสินค้า" : "Recipient Name"} *
                  </label>
                  <input
                    type="text"
                    required
                    value={custNameInput}
                    onChange={(e) => setCustNameInput(e.target.value)}
                    placeholder={lang === "th" ? "เช่น สมชาย รักดี" : "e.g. John Doe"}
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 font-sans font-semibold"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                    {lang === "th" ? "เบอร์โทรศัพท์ติดต่อ" : "Contact Phone"} *
                  </label>
                  <input
                    type="tel"
                    required
                    value={custPhoneInput}
                    onChange={(e) => setCustPhoneInput(e.target.value)}
                    placeholder={lang === "th" ? "เช่น 0812345678" : "e.g. 0812345678"}
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 font-mono font-semibold"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                    {lang === "th" ? "ที่อยู่จัดส่งสินค้าโดยละเอียด" : "Detailed Shipping Address"} *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={custAddressInput}
                    onChange={(e) => setCustAddressInput(e.target.value)}
                    placeholder={lang === "th" ? "ระบุ บ้านเลขที่, ถนน, ตำบล, อำเภอ, จังหวัด, รหัสไปรษณีย์" : "Specify House No, Street, Sub-district, District, Province, Postal Code"}
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 font-sans font-semibold resize-none"
                  />
                </div>
              </div>

              {/* Upload Drag area */}
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-400 uppercase tracking-wide">
                  {lang === "th" ? "หลักฐานสลิปโอนเงิน" : "Transfer Slip Receipt"}
                </label>
                <div className="border border-dashed border-slate-200 rounded-xl p-5 flex flex-col items-center text-center bg-slate-50 cursor-pointer hover:border-slate-350 transition-all relative">
                  <input
                    type="file"
                    required
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  {slipBase64 ? (
                    <div className="flex flex-col items-center gap-1 leading-none text-[#29A6FF]">
                      <CheckCircle size={16} className="text-[#29A6FF] animate-pulse" />
                      <span className="text-[10px] font-bold max-w-[200px] truncate">{slipName}</span>
                      <span className="text-[9px] text-slate-400 mt-1">
                        {lang === "th" ? "คลิกหรือลากเพื่อเปลี่ยน" : "Click or drag to change"}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 leading-none text-slate-400">
                      <UploadCloud size={16} className="text-slate-300" />
                      <span className="text-[10px] font-medium text-slate-400">
                        {lang === "th" ? "กดหรือลากรูปภาพสลิปมาที่นี่" : "Click or drag slip image here"}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingSlip || !slipBase64}
                className="bg-slate-800 hover:bg-slate-900 text-white font-sans font-bold py-3 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 border-0"
              >
                {submittingSlip ? (
                  <RefreshCw className="animate-spin" size={13} />
                ) : (
                  <span>{lang === "th" ? "ส่งสลิปชำระเงิน" : "Submit Payment Slip"}</span>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
