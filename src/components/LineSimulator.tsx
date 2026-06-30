import React, { useState, useEffect } from "react";
import { LineLog } from "../types";
import { MessageSquare, Bell, RefreshCw, Smartphone, Send, ShieldAlert } from "lucide-react";
import { motion } from "motion/react";

interface LineSimulatorProps {
  logs: LineLog[];
  onRefresh: () => void;
  isPolling?: boolean;
}

export default function LineSimulator({ logs, onRefresh, isPolling = true }: LineSimulatorProps) {
  const [activeTab, setActiveTab] = useState<"chat" | "technical">("chat");
  const [customTestMessage, setCustomTestMessage] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  const [apiResult, setApiResult] = useState<{ status: "idle" | "success" | "error"; message: string }>({
    status: "idle",
    message: "",
  });

  // Keep a small interval to fetch new logs if polling is enabled
  const onRefreshRef = React.useRef(onRefresh);
  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    if (!isPolling) return;
    const interval = setInterval(() => {
      onRefreshRef.current();
    }, 4000);
    return () => clearInterval(interval);
  }, [isPolling]);

  const handleSendTestMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTestMessage.trim()) return;

    setSendingTest(true);
    setApiResult({ status: "idle", message: "" });

    try {
      const response = await fetch("/api/line/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: customTestMessage }),
      });

      const data = await response.json();
      if (response.ok) {
        setApiResult({ status: "success", message: "ส่งข้อความสำเร็จแล้ว!" });
        setCustomTestMessage("");
        onRefresh();
      } else {
        setApiResult({ status: "error", message: data.error || "เกิดข้อผิดพลาด" });
      }
    } catch (err) {
      setApiResult({ status: "error", message: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้" });
    } finally {
      setSendingTest(false);
      setTimeout(() => setApiResult({ status: "idle", message: "" }), 3000);
    }
  };

  // Format timestamp helper
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  return (
    <div id="line-simulator-panel" className="bg-white text-slate-800 rounded-2xl shadow-sm border border-slate-150 flex flex-col h-[650px] w-full max-w-[360px] mx-auto overflow-hidden">
      {/* Phone Notch & Header */}
      <div className="bg-slate-50 px-4 py-2 flex justify-between items-center text-[10px] font-mono tracking-wider text-slate-400 select-none border-b border-slate-100">
        <div className="flex items-center gap-1.5">
          <Smartphone size={11} className="text-[#29A6FF] animate-pulse" />
          <span className="font-sans font-semibold text-slate-500 text-[9px]">S-SIMULATOR v1.2</span>
        </div>
        <div className="w-16 h-3 bg-slate-100 rounded-b-lg mx-auto -mt-2 border-x border-b border-slate-200/60"></div>
        <div className="flex items-center gap-1.5">
          <button onClick={onRefresh} className="hover:text-[#29A6FF] transition-colors active:rotate-180 duration-300 border-0 bg-transparent p-0 cursor-pointer">
            <RefreshCw size={10} className="text-slate-400" />
          </button>
          <span className="text-[9px]">LTE 100%</span>
        </div>
      </div>

      {/* LINE App Header */}
      <div className="bg-[#F1F6FA] px-4 py-3 flex justify-between items-center border-b border-[#E0E7ED]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#29A6FF] flex items-center justify-center font-display font-bold text-white text-sm shadow-inner">
            L
          </div>
          <div>
            <h4 className="font-sans font-bold text-xs leading-none text-slate-800 flex items-center gap-1">
              LINE Notify / OA
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping"></span>
            </h4>
            <p className="text-[10px] text-slate-500 mt-0.5">S Shop Online Storefront</p>
          </div>
        </div>
        
        {/* Toggle View */}
        <div className="bg-slate-200/50 p-0.5 rounded-xl flex border border-slate-200/60">
          <button
            onClick={() => setActiveTab("chat")}
            className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all border-0 cursor-pointer ${
              activeTab === "chat" ? "bg-white text-[#2F526B] shadow-sm" : "text-slate-500 hover:text-slate-800 bg-transparent"
            }`}
          >
            แชท LINE
          </button>
          <button
            onClick={() => setActiveTab("technical")}
            className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all border-0 cursor-pointer ${
              activeTab === "technical" ? "bg-white text-[#2F526B] shadow-sm" : "text-slate-500 hover:text-slate-800 bg-transparent"
            }`}
          >
            เทคนิคอล
          </button>
        </div>
      </div>

      {/* LINE Chat Window Area */}
      {activeTab === "chat" ? (
        <div className="flex-1 bg-[#E8EDF3] p-3 overflow-y-auto flex flex-col-reverse gap-3 select-text font-sans scrollbar-thin">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
              <MessageSquare size={32} className="opacity-40 animate-bounce text-slate-400" />
              <p className="text-xs text-center font-medium leading-relaxed text-slate-400">
                ยังไม่มีการส่งข้อแจ้งเตือน <br />
                ลองสร้างออเดอร์เพื่อทดสอบระบบ!
              </p>
            </div>
          ) : (
            logs.map((log, i) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.25 }}
                className="flex items-start gap-2 max-w-[88%]"
              >
                {/* Chat Avatar */}
                <div className="w-7 h-7 rounded-full bg-white flex-shrink-0 flex items-center justify-center shadow-sm border border-slate-100">
                  <span className="text-[9px] font-bold text-[#29A6FF]">LINE</span>
                </div>

                {/* Chat Bubble container */}
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] text-slate-500 font-bold font-sans">
                    {log.recipient}
                  </span>
                  <div className="flex items-end gap-1">
                    {log.isRich && log.richData ? (
                      <div className="bg-white rounded-xl shadow-sm border border-slate-200 w-[240px] overflow-hidden flex flex-col text-[11px] font-sans">
                        {/* Header Banner */}
                        <div className="p-3 text-white font-bold text-center relative" style={{ backgroundColor: log.richData.statusColor || "#059669" }}>
                          <span className="text-xs">{log.richData.title}</span>
                        </div>
                        {/* Body */}
                        <div className="p-3 flex flex-col gap-2 bg-white text-slate-700">
                          <div className="flex justify-between border-b border-slate-100 pb-1.5">
                            <span className="font-bold text-slate-400 text-[10px]">ออเดอร์</span>
                            <span className="font-mono text-slate-800 font-bold">{log.richData.orderId}</span>
                          </div>
                          
                          {/* Items List */}
                          <div className="flex flex-col gap-1">
                            {log.richData.items?.map((item: any, idx: number) => (
                              <div key={idx} className="flex justify-between text-slate-600 text-[10px]">
                                <span>{item.name} x{item.quantity}</span>
                                <span>{item.price * item.quantity} ฿</span>
                              </div>
                            ))}
                          </div>

                          <div className="flex justify-between border-t border-slate-100 pt-1.5 font-bold text-slate-800">
                            <span>ยอดรวม</span>
                            <span className="text-emerald-600">{log.richData.amount} ฿</span>
                          </div>

                          {log.richData.trackingNo && (
                            <div className="bg-slate-50 rounded-lg p-2 flex flex-col gap-0.5 border border-slate-100 text-[10px]">
                              <span className="text-slate-400 font-semibold">เลขติดตามพัสดุ:</span>
                              <span className="font-mono text-indigo-600 font-bold">{log.richData.trackingNo}</span>
                            </div>
                          )}

                          {log.richData.cancelReason && (
                            <div className="bg-rose-50 text-rose-700 rounded-lg p-1.5 flex flex-col gap-0.5 border border-rose-100 text-[10px]">
                              <span className="font-semibold text-rose-500">เหตุผลที่ยกเลิก:</span>
                              <span>{log.richData.cancelReason}</span>
                            </div>
                          )}

                          {/* Customer info */}
                          <div className="text-[9px] text-slate-400 leading-normal border-t border-slate-50 pt-1 flex flex-col">
                            <span>ผู้รับ: คุณ {log.richData.customerName}</span>
                            <span>เบอร์โทร: {log.richData.customerPhone}</span>
                          </div>
                        </div>

                        {/* Buttons Footer */}
                        {log.richData.buttonText && (
                          <div className="border-t border-slate-100 grid grid-cols-1 divide-x divide-slate-100 bg-slate-50">
                            <a
                              href={log.richData.buttonUrl || "#"}
                              target="_blank"
                              rel="noreferrer"
                              className="py-2 text-center text-sky-600 font-bold text-[10px] hover:bg-sky-50 transition-colors border-0 no-underline"
                            >
                              {log.richData.buttonText}
                            </a>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-white text-slate-800 rounded-2xl rounded-tl-none px-3 py-2 text-xs shadow-sm whitespace-pre-wrap leading-relaxed border border-slate-100 select-all font-sans">
                        {log.message}
                      </div>
                    )}
                    <span className="text-[8px] text-slate-400 font-mono whitespace-nowrap leading-none select-none">
                      {formatTime(log.timestamp)}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      ) : (
        /* Technical Logs View */
        <div className="flex-1 bg-slate-50 p-3 overflow-y-auto font-mono text-[11px] text-slate-600 flex flex-col gap-2 scrollbar-thin border-b border-slate-100">
          <div className="flex items-center gap-1.5 text-[#3A5D7C] font-bold border-b border-slate-100 pb-1.5">
            <Bell size={11} />
            <span className="text-[9px] uppercase tracking-wider">LINE GATEWAY TELEMETRY</span>
          </div>

          <div className="flex flex-col gap-2.5">
            {logs.map((log) => (
              <div key={log.id} className="p-2 bg-white rounded-xl border border-slate-100 hover:border-slate-200 transition-colors shadow-sm">
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-lg font-bold uppercase ${
                    log.status === "success" ? "bg-sky-50 text-[#29A6FF]" : "bg-rose-50 text-rose-600"
                  }`}>
                    {log.status}
                  </span>
                  <span className="text-slate-400 text-[9px]">{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="text-slate-500 text-[9px] mb-1">
                  <span className="text-slate-400 font-bold">Type:</span> {log.type} | <span className="text-slate-400 font-bold">To:</span> {log.recipient}
                </p>
                <div className="text-[9px] bg-slate-50 p-1.5 rounded-lg text-slate-600 select-all max-h-[100px] overflow-y-auto whitespace-pre-wrap leading-relaxed border border-slate-100">
                  {log.message}
                </div>
                {log.detail && (
                  <p className="text-slate-400 text-[8px] mt-1 italic">
                    <span className="text-rose-400 font-bold">Detail:</span> {log.detail}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mini Interactive Simulator Controls */}
      <div className="bg-slate-50 p-2.5 border-t border-slate-100">
        <form onSubmit={handleSendTestMessage} className="flex gap-1.5">
          <input
            type="text"
            value={customTestMessage}
            onChange={(e) => setCustomTestMessage(e.target.value)}
            placeholder="พิมพ์ข้อความทดสอบ LINE..."
            className="flex-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#29A6FF] font-sans"
            disabled={sendingTest}
          />
          <button
            type="submit"
            disabled={sendingTest || !customTestMessage.trim()}
            className="w-8.5 h-8.5 flex-shrink-0 bg-[#29A6FF] hover:bg-[#1a93eb] text-white rounded-xl transition-colors disabled:opacity-40 border-0 cursor-pointer flex items-center justify-center"
          >
            {sendingTest ? (
              <RefreshCw size={12} className="animate-spin" />
            ) : (
              <Send size={12} />
            )}
          </button>
        </form>
        {apiResult.status !== "idle" && (
          <div className={`mt-1.5 text-[9px] text-center font-medium ${
            apiResult.status === "success" ? "text-[#29A6FF]" : "text-rose-500"
          }`}>
            {apiResult.message}
          </div>
        )}
      </div>
    </div>
  );
}
