import React, { useState } from "react";
import { User } from "../types";
import { Key, Mail, ShieldAlert, CheckCircle, RefreshCw, Smartphone, UserPlus, ArrowRight, UserCheck } from "lucide-react";
import { motion } from "motion/react";

interface AuthViewProps {
  onLoginSuccess: (user: User) => void;
  currentUser: User | null;
}

export default function AuthView({ onLoginSuccess, currentUser }: AuthViewProps) {
  const [activeForm, setActiveForm] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Simulated LINE Login SSO modal choices
  const [showLineLoginModal, setShowLineLoginModal] = useState(false);

  // Pre-configured simulation profiles
  const SIMULATED_LINE_PROFILES = [
    {
      userId: "U_somchai_9988",
      displayName: "สมชาย รักดี",
      pictureUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=60",
    },
    {
      userId: "U_suda_8877",
      displayName: "สุชาดา รวยเจริญ",
      pictureUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=60",
    },
    {
      userId: "U_anonymous_line",
      displayName: "นักช้อป สายเปย์ (LINE)",
      pictureUrl: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=60",
    }
  ];

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (response.ok && data.user) {
        setSuccessMsg("เข้าสู่ระบบเรียบร้อยแล้ว!");
        setTimeout(() => {
          onLoginSuccess(data.user);
        }, 800);
      } else {
        setErrorMsg(data.error || "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      }
    } catch (err) {
      setErrorMsg("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์หลักได้");
    } finally {
      setLoading(false);
    }
  };

  const handleCredentialsRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) return;

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();
      if (response.ok && data.user) {
        setSuccessMsg("สมัครสมาชิกเสร็จสิ้น! กำลังเข้าสู่ระบบ...");
        setTimeout(() => {
          onLoginSuccess(data.user);
        }, 1000);
      } else {
        setErrorMsg(data.error || "ไม่สามารถลงทะเบียนผู้ใช้ใหม่ได้");
      }
    } catch (err) {
      setErrorMsg("ไม่สามารถเชื่อมต่อเครือข่ายหลักได้");
    } finally {
      setLoading(false);
    }
  };

  // Perform Simulated LINE Login
  const handleLineSimulateLogin = async (profile: typeof SIMULATED_LINE_PROFILES[0]) => {
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    setShowLineLoginModal(false);

    try {
      const response = await fetch("/api/auth/line-login-simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      const data = await response.json();
      if (response.ok && data.user) {
        setSuccessMsg(`ยินดีต้อนรับคุณ ${data.user.name} ผ่านระบบ LINE SSO!`);
        setTimeout(() => {
          onLoginSuccess(data.user);
        }, 1000);
      } else {
        setErrorMsg(data.error || "เกิดข้อผิดพลาดในการรับรองสิทธิ์ผ่าน LINE");
      }
    } catch (err) {
      setErrorMsg("ล้มเหลวในการเชื่อมโยงเครือข่ายจำลอง SSO");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto my-12 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden relative">
      
      {/* Brand Header */}
      <div className="bg-slate-50 border-b border-slate-100 p-7 text-center">
        <h3 className="font-sans font-bold text-sm uppercase tracking-wider text-slate-800">
          S Shop Online Auth
        </h3>
        <p className="text-xs text-slate-500 mt-1.5 font-medium leading-relaxed">
          สร้างบัญชีลูกค้า หรือใช้ระบบล็อกอินจำลองผ่านระบบ LINE ได้ทันที!
        </p>
      </div>

      <div className="p-6 flex flex-col gap-5 text-xs">
        {/* BIG GREEN LINE LOGIN BUTTON */}
        <button
          onClick={() => setShowLineLoginModal(true)}
          className="w-full bg-[#06C755] hover:brightness-105 text-white font-sans font-bold text-xs py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer border-0 shadow-sm"
        >
          {/* Mock line app logo */}
          <span className="w-5 h-5 rounded-full bg-white text-[#06C755] flex items-center justify-center font-bold text-xs">L</span>
          <span>เข้าสู่ระบบผ่านแอป LINE (Simulated)</span>
        </button>

        {/* Divider line */}
        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-slate-100"></div>
          <span className="flex-shrink mx-4 text-slate-400 text-[9px] font-bold uppercase tracking-widest font-sans">
            หรือล็อกอินด้วยบัญชี
          </span>
          <div className="flex-grow border-t border-slate-100"></div>
        </div>

        {/* Toggle Form tab */}
        <div className="bg-slate-50 p-1 rounded-xl flex border border-slate-100">
          <button
            onClick={() => setActiveForm("login")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer border-0 ${
              activeForm === "login" ? "bg-white text-slate-850 shadow-sm" : "text-slate-550 hover:text-slate-800 bg-transparent"
            }`}
          >
            เข้าสู่ระบบ (Sign In)
          </button>
          <button
            onClick={() => setActiveForm("register")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer border-0 ${
              activeForm === "register" ? "bg-white text-slate-850 shadow-sm" : "text-slate-550 hover:text-slate-800 bg-transparent"
            }`}
          >
            สมัครสมาชิก (Register)
          </button>
        </div>

        {/* Form area */}
        {activeForm === "login" ? (
          <form onSubmit={handleCredentialsLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-slate-400 uppercase tracking-wide">อีเมลผู้ใช้งาน (Email)</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="เช่น admin@sshop.com หรือ customer@gmail.com"
                className="bg-white border border-slate-100 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#29A6FF] focus:border-[#29A6FF]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-slate-400 uppercase tracking-wide">รหัสผ่าน (Password)</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="กรอกรหัสผ่าน (เช่น admin1234 หรือ user1234)"
                className="bg-white border border-slate-100 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#29A6FF] focus:border-[#29A6FF]"
              />
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-xs font-semibold flex items-center gap-2 border border-rose-100">
                <ShieldAlert size={14} className="flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-sky-50 text-[#29A6FF] rounded-xl text-xs font-semibold flex items-center gap-2 border border-sky-100">
                <CheckCircle size={14} className="text-[#29A6FF] flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-sans font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer border-0"
            >
              {loading ? <RefreshCw className="animate-spin" size={13} /> : <Key size={12} className="text-white" />}
              <span>เข้าสู่ระบบใช้งาน</span>
            </button>
          </form>
        ) : (
          <form onSubmit={handleCredentialsRegister} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-slate-400 uppercase tracking-wide">ชื่อ-นามสกุลสมาชิก (Full Name)</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="กรอกชื่อ-นามสกุลของคุณ"
                className="bg-white border border-slate-100 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#29A6FF] focus:border-[#29A6FF]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-slate-400 uppercase tracking-wide">อีเมลติดต่อ (Email)</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="กรอกอีเมลสมาชิก"
                className="bg-white border border-slate-100 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#29A6FF] focus:border-[#29A6FF]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-slate-400 uppercase tracking-wide">ตั้งรหัสผ่านความปลอดภัย (Password)</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="กรอกรหัสผ่านสำหรับเข้าสู่ระบบ"
                className="bg-white border border-slate-100 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#29A6FF] focus:border-[#29A6FF]"
              />
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-xs font-semibold flex items-center gap-2 border border-rose-100">
                <ShieldAlert size={14} className="flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-sky-50 text-[#29A6FF] rounded-xl text-xs font-semibold flex items-center gap-2 border border-sky-100">
                <CheckCircle size={14} className="text-[#29A6FF] flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-sans font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer border-0"
            >
              {loading ? <RefreshCw className="animate-spin" size={13} /> : <UserPlus size={12} className="text-white" />}
              <span>สมัครบัญชีผู้ใช้ใหม่</span>
            </button>
          </form>
        )}

        {/* Demo Accounts helper hint box */}
        <div className="bg-[#F8FAFC] rounded-2xl p-3.5 border border-slate-100 mt-2 leading-relaxed font-sans">
          <p className="font-bold text-slate-800 uppercase tracking-wide text-[9px] mb-1.5">🔑 บัญชีทดสอบที่มีในระบบ (Demo accounts)</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] text-slate-500 font-mono select-all">
            <div>
              <p className="font-bold text-[#29A6FF]">สิทธิ์ Admin:</p>
              <p>Email: admin@sshop.com</p>
              <p>Pass: admin1234</p>
            </div>
            <div>
              <p className="font-bold text-[#29A6FF]">สิทธิ์ Customer:</p>
              <p>Email: customer@gmail.com</p>
              <p>Pass: user1234</p>
            </div>
          </div>
        </div>
      </div>

      {/* LINE LOGIN SIMULATION MODAL */}
      {showLineLoginModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-sm w-full shadow-lg border border-slate-100 overflow-hidden"
          >
            <div className="bg-[#EBF3F8] text-slate-800 border-b border-[#DAE5EF] p-4.5 flex justify-between items-center">
              <h4 className="font-sans font-bold text-xs uppercase tracking-wide flex items-center gap-1.5 text-slate-800">
                <Smartphone size={13} className="text-[#29A6FF]" /> LINE Login SSO Gateway
              </h4>
              <button
                onClick={() => setShowLineLoginModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xs cursor-pointer transition-colors border-0 bg-transparent"
              >
                ปิด
              </button>
            </div>

            <div className="p-5 flex flex-col gap-4 text-xs">
              <p className="text-slate-500 text-xs text-center font-sans">
                จำลองหน้าต่างขอสิทธิ์การยินยอมเชื่อมต่อกับระบบ LINE OA <br />
                <b>กรุณาเลือกโปรไฟล์ LINE ที่ต้องการใช้ล็อกอิน:</b>
              </p>

              <div className="flex flex-col gap-2.5">
                 {SIMULATED_LINE_PROFILES.map((prof) => (
                  <button
                    key={prof.userId}
                    onClick={() => handleLineSimulateLogin(prof)}
                    className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-200 hover:border-[#29A6FF] hover:bg-sky-500/5 transition-all text-left cursor-pointer group"
                  >
                    <img
                      src={prof.pictureUrl}
                      alt={prof.displayName}
                      className="w-10 h-10 rounded-full object-cover border border-slate-150"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-grow">
                      <h5 className="font-bold text-slate-850 group-hover:text-[#29A6FF]">{prof.displayName}</h5>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{prof.userId}</p>
                    </div>
                    <ArrowRight size={13} className="text-slate-300 group-hover:text-[#29A6FF] group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
