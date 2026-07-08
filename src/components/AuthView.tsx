import React, { useState, useEffect } from "react";
import { User, LineConfig } from "../types";
import { Key, Mail, ShieldAlert, CheckCircle, RefreshCw, Smartphone, UserPlus, ArrowRight, UserCheck, Edit, Save, Calendar, Shield, Hash, LogOut, Check } from "lucide-react";
import { motion } from "motion/react";

interface AuthViewProps {
  onLoginSuccess: (user: User) => void;
  currentUser: User | null;
  shopConfig?: LineConfig | null;
}

export default function AuthView({ onLoginSuccess, currentUser, shopConfig }: AuthViewProps) {
  const [activeForm, setActiveForm] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Simulated LINE Login SSO modal choices
  const [showLineLoginModal, setShowLineLoginModal] = useState(false);

  // Profile edit states (when currentUser is logged in)
  const [profName, setProfName] = useState(currentUser?.name || "");
  const [profEmail, setProfEmail] = useState(currentUser?.email || "");
  const [profLineId, setProfLineId] = useState(currentUser?.lineUserId || "");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  // Keep state in sync with current logged in user
  useEffect(() => {
    if (currentUser) {
      setProfName(currentUser.name);
      setProfEmail(currentUser.email);
      setProfLineId(currentUser.lineUserId || "");
    }
  }, [currentUser]);

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

  // Perform Real LINE Login / LIFF authentication
  const handleRealLineLogin = async (profile: { userId: string; displayName: string; pictureUrl?: string }) => {
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
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
        setSuccessMsg(`ยินดีต้อนรับคุณ ${data.user.name} ผ่านระบบ LINE Login จริง! ✓`);
        setTimeout(() => {
          onLoginSuccess(data.user);
        }, 1000);
      } else {
        setErrorMsg(data.error || "ล้มเหลวในการรับรองสิทธิ์เข้าใช้งาน");
      }
    } catch (err) {
      setErrorMsg("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์เพื่อล็อกอินด้วย LINE ได้");
    } finally {
      setLoading(false);
    }
  };

  const handleLineLoginClick = () => {
    if (shopConfig && shopConfig.lineLiffId) {
      const liff = (window as any).liff;
      if (liff) {
        if (!liff.isLoggedIn()) {
          console.log("[LIFF] Redirecting to LINE Login...");
          liff.login();
        } else {
          liff.getProfile().then((profile: any) => {
            handleRealLineLogin(profile);
          }).catch((err: any) => {
            console.error("[LIFF] Profile fetch error, re-login", err);
            liff.login();
          });
        }
      } else {
        setErrorMsg("ไม่พบ LINE LIFF SDK กรุณารีเฟรชหน้าจออีกครั้ง");
      }
    } else {
      // Default simulated flow
      setShowLineLoginModal(true);
    }
  };

  // Link LINE Profile to Logged-in User
  const handleLinkLineProfile = async (profile: typeof SIMULATED_LINE_PROFILES[0]) => {
    setProfileSaving(true);
    setProfileError("");
    setProfileSuccess("");
    setShowLineLoginModal(false);

    try {
      const response = await fetch("/api/auth/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": currentUser?.id || ""
        },
        body: JSON.stringify({
          lineUserId: profile.userId,
          lineDisplayName: profile.displayName,
          linePictureUrl: profile.pictureUrl
        }),
      });

      const data = await response.json();
      if (response.ok && data.user) {
        setProfileSuccess(`เชื่อมต่อกับ LINE: ${profile.displayName} สำเร็จ!`);
        onLoginSuccess(data.user);
        setProfLineId(data.user.lineUserId || "");
        setTimeout(() => setProfileSuccess(""), 3000);
      } else {
        setProfileError(data.error || "เกิดข้อผิดพลาดในการเชื่อมต่อ LINE");
      }
    } catch (err) {
      setProfileError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์หลักเพื่ออัปเดตข้อมูล");
    } finally {
      setProfileSaving(false);
    }
  };

  // Update name, email or manual LINE user ID
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profName || !profEmail) {
      setProfileError("กรุณากรอกชื่อและอีเมลให้ครบถ้วน");
      return;
    }

    setProfileSaving(true);
    setProfileError("");
    setProfileSuccess("");

    try {
      const response = await fetch("/api/auth/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": currentUser?.id || ""
        },
        body: JSON.stringify({
          name: profName,
          email: profEmail,
          lineUserId: profLineId || null
        }),
      });

      const data = await response.json();
      if (response.ok && data.user) {
        setProfileSuccess("อัปเดตประวัติส่วนตัวและบันทึกข้อมูลเรียบร้อยแล้ว! ✓");
        onLoginSuccess(data.user);
        setTimeout(() => setProfileSuccess(""), 3000);
      } else {
        setProfileError(data.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }
    } catch (err) {
      setProfileError("ล้มเหลวในการเชื่อมต่อเพื่อบันทึกข้อมูล");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("s_shop_user_id");
    window.location.reload();
  };

  if (currentUser) {
    return (
      <div className="max-w-md w-full mx-auto my-12 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden relative">
        {/* Profile Card Header */}
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-150 p-6 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 overflow-hidden flex items-center justify-center relative shadow-sm">
            {currentUser.linePictureUrl ? (
              <img src={currentUser.linePictureUrl} alt={currentUser.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <span className="font-display font-black text-xl text-emerald-600">
                {currentUser.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-grow">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-sans font-extrabold text-base text-slate-800 leading-tight">
                {currentUser.name}
              </h3>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase ${
                currentUser.role === "admin" ? "bg-amber-100 text-amber-800 border border-amber-200" : "bg-emerald-100 text-emerald-800 border border-emerald-200"
              }`}>
                {currentUser.role === "admin" ? "ADMIN" : "MEMBER"}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium truncate mt-1">
              {currentUser.email}
            </p>
            <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-mono mt-1.5">
              <Calendar size={11} />
              <span>สมัครเมื่อ {new Date(currentUser.createdAt).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" })}</span>
            </div>
          </div>
        </div>

        {/* Profile Form & LINE Settings */}
        <form onSubmit={handleSaveProfile} className="p-6 flex flex-col gap-5 text-xs">
          
          {/* Messages */}
          {profileError && (
            <div className="bg-rose-50 border border-rose-100 text-rose-600 p-3 rounded-lg flex items-start gap-2.5 leading-relaxed font-sans font-medium">
              <ShieldAlert size={14} className="flex-shrink-0 mt-0.5" />
              <span>{profileError}</span>
            </div>
          )}

          {profileSuccess && (
            <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-3 rounded-lg flex items-start gap-2.5 leading-relaxed font-sans font-medium">
              <CheckCircle size={14} className="flex-shrink-0 mt-0.5" />
              <span>{profileSuccess}</span>
            </div>
          )}

          {/* Form Fields */}
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                ชื่อ-นามสกุลสมาชิก *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={profName}
                  onChange={(e) => setProfName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-4 text-slate-800 font-medium placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-xs"
                  placeholder="ชื่อจริงของคุณ"
                  required
                />
                <UserCheck size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                อีเมลติดต่อ *
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={profEmail}
                  onChange={(e) => setProfEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-4 text-slate-800 font-medium placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-xs"
                  placeholder="name@example.com"
                  required
                />
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          </div>

          {/* LINE Notification Sync Box */}
          <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                การแจ้งเตือนเข้าแอป LINE
              </span>
              {currentUser.lineUserId ? (
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <Check size={11} /> เชื่อมต่อแล้ว
                </span>
              ) : (
                <span className="bg-slate-200/60 text-slate-500 border border-slate-300/40 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  ยังไม่เชื่อมต่อ
                </span>
              )}
            </div>

            {currentUser.lineUserId ? (
              <div className="flex flex-col gap-2.5 bg-white border border-slate-100 p-3 rounded-lg">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0">
                    {currentUser.linePictureUrl ? (
                      <img src={currentUser.linePictureUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs">L</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="font-extrabold text-slate-850 truncate leading-snug">
                      {currentUser.lineDisplayName || "LINE User"}
                    </h5>
                    <p className="text-[9px] text-slate-400 font-mono leading-none mt-0.5 truncate">
                      ID: {currentUser.lineUserId}
                    </p>
                  </div>
                </div>

                <div className="text-[10px] text-emerald-600 leading-relaxed font-sans bg-emerald-500/5 px-2.5 py-1.5 rounded-md border border-emerald-500/10">
                  💡 คุณจะได้รับข้อความอัพเดตสถานะออเดอร์ เลขพัสดุจัดส่ง และสรุปสลิปโอนเงิน เข้าสู่ LINE ของคุณทันทีเมื่อมีรายการอัปเดต!
                </div>

                <button
                  type="button"
                  onClick={() => setShowLineLoginModal(true)}
                  className="w-full border border-[#29A6FF]/20 text-[#29A6FF] bg-sky-500/5 hover:bg-[#29A6FF]/10 transition-colors py-2 rounded-lg font-bold text-[10px] cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RefreshCw size={11} /> เปลี่ยนบัญชี LINE ที่เชื่อมโยง
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 bg-white border border-slate-100 p-3 rounded-lg text-slate-600 leading-relaxed">
                <p className="text-[10.5px]">
                  เชื่อมต่อบัญชี LINE ของคุณ เพื่อรับแจ้งเตือนเมื่อร้านค้าเปลี่ยนสถานะออเดอร์ ส่งเลขพัสดุ หรือเมื่อสรุปสลิปชำระเงินสำเร็จ
                </p>
                
                <button
                  type="button"
                  onClick={() => setShowLineLoginModal(true)}
                  className="w-full bg-[#06C755] hover:bg-[#05b04b] text-white transition-colors py-2.5 px-4 rounded-lg font-sans font-extrabold text-xs cursor-pointer flex items-center justify-center gap-1.5 mt-1.5 shadow-sm"
                >
                  <Smartphone size={13} />
                  เชื่อมต่อด้วย LINE Account
                </button>

                <div className="relative my-1.5 text-center">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100"></span></div>
                  <span className="relative bg-white px-2 text-[9px] font-bold text-slate-400 uppercase tracking-wider">หรือกรอกคีย์เอง</span>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    ระบุ LINE User ID ของคุณด้วยตนเอง
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={profLineId}
                      onChange={(e) => setProfLineId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-8 pr-3 text-slate-700 font-mono text-[10.5px] focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                      placeholder="U1234567890abcdef..."
                    />
                    <Hash size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center gap-3 mt-2">
            <button
              type="submit"
              disabled={profileSaving}
              className="flex-grow bg-slate-900 hover:bg-slate-800 text-white font-sans font-bold py-2.5 px-4 rounded-xl transition-all disabled:opacity-50 text-xs shadow-sm flex items-center justify-center gap-2 cursor-pointer border-0"
            >
              {profileSaving ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <Save size={13} />
                  บันทึกข้อมูลส่วนตัว
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="px-4 py-2.5 border border-rose-200 text-rose-600 hover:bg-rose-50 bg-white transition-all rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              title="ออกจากระบบ"
            >
              <LogOut size={13} />
              ออกจากระบบ
            </button>
          </div>
        </form>

        {/* LINE LOGIN SIMULATION MODAL IN PROFILE */}
        {showLineLoginModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl max-w-sm w-full shadow-lg border border-slate-100 overflow-hidden"
            >
              <div className="bg-[#EBF3F8] text-slate-800 border-b border-[#DAE5EF] p-4.5 flex justify-between items-center">
                <h4 className="font-sans font-bold text-xs uppercase tracking-wide flex items-center gap-1.5 text-slate-800">
                  <Smartphone size={13} className="text-[#29A6FF]" /> LINE Connect Gateway
                </h4>
                <button
                  type="button"
                  onClick={() => setShowLineLoginModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-xs cursor-pointer transition-colors border-0 bg-transparent"
                >
                  ปิด
                </button>
              </div>

              <div className="p-5 flex flex-col gap-4 text-xs">
                <p className="text-slate-500 text-xs text-center font-sans leading-relaxed">
                  จำลองการอนุญาตสิทธิ์เข้าถึงบัญชี LINE เพื่อเชื่อมต่อเข้ากับ S Shop ของคุณ <br />
                  <b>กรุณาเลือกโปรไฟล์ LINE ที่ต้องการเชื่อมต่อ:</b>
                </p>

                <div className="flex flex-col gap-2.5">
                  {SIMULATED_LINE_PROFILES.map((prof) => (
                    <button
                      key={prof.userId}
                      type="button"
                      onClick={() => handleLinkLineProfile(prof)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-slate-200 hover:border-[#29A6FF] hover:bg-sky-500/5 transition-all text-left cursor-pointer group bg-white"
                    >
                      <img
                        src={prof.pictureUrl}
                        alt={prof.displayName}
                        className="w-10 h-10 rounded-full object-cover border border-slate-150"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-grow">
                        <h5 className="font-bold text-slate-800 group-hover:text-[#29A6FF]">{prof.displayName}</h5>
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

  return (
    <div className="max-w-lg w-full mx-auto my-8 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden relative">
      
      {/* Brand Header */}
      <div className="bg-slate-50 border-b border-slate-100 p-6 text-center">
        <div className="w-12 h-12 bg-emerald-500 rounded-2xl mx-auto flex items-center justify-center text-white font-bold text-xl mb-3 shadow-sm">
          S
        </div>
        <h3 className="font-sans font-extrabold text-base uppercase tracking-wider text-slate-800">
          S Shop Online
        </h3>
        <p className="text-xs text-slate-500 mt-1 font-medium">
          ระบบร้านค้าออนไลน์ เชื่อมต่อระบบแจ้งเตือน LINE OA อัจฉริยะ
        </p>
      </div>

      <div className="p-6 flex flex-col gap-6 text-xs">
        
        {/* Customer LINE section */}
        <div className="bg-emerald-50/40 border border-emerald-100 rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-6 -mt-6" />
          
          <div className="flex items-center gap-2 mb-3">
            <span className="w-6 h-6 rounded-lg bg-[#06C755] text-white flex items-center justify-center font-bold text-xs">L</span>
            <h4 className="font-sans font-extrabold text-xs text-emerald-800 uppercase tracking-wider">
              สำหรับลูกค้า (Customer Member)
            </h4>
          </div>

          <p className="text-slate-600 font-medium leading-relaxed mb-4 text-[11px]">
            ไม่ต้องสมัครสมาชิกด้วยรหัสผ่านให้ยุ่งยาก! ระบบของเราเชื่อมโยงกับ LINE OA สมัครสมาชิกอัตโนมัติเมื่อเพิ่มเพื่อนหรือทักแชทแรกร้านค้า
          </p>

          <div className="flex flex-col gap-2 mb-4 text-slate-600">
            <div className="flex gap-2 items-start bg-white/70 backdrop-blur-xs p-2.5 rounded-xl border border-emerald-100/50">
              <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">1</span>
              <p className="text-[11px]">แอดไลน์ร้านค้า (LINE OA) หรือกดสแกน QR Code เพื่อเพิ่มเพื่อน</p>
            </div>
            <div className="flex gap-2 items-start bg-white/70 backdrop-blur-xs p-2.5 rounded-xl border border-emerald-100/50">
              <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">2</span>
              <p className="text-[11px]">ทักทาย พิมพ์ข้อความอะไรก็ได้ หรือกดสมัครสมาชิกในแชท</p>
            </div>
            <div className="flex gap-2 items-start bg-white/70 backdrop-blur-xs p-2.5 rounded-xl border border-emerald-100/50">
              <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">3</span>
              <p className="text-[11px]">ระบบจะตอบกลับลิงก์สำหรับคลิกเข้าสู่ระบบให้อัตโนมัติทันที! 🛍️</p>
            </div>
          </div>

          {/* LINE LOGIN BUTTON WITH DYNAMIC REAL VS SIMULATION */}
          {shopConfig && shopConfig.lineLiffId ? (
            <div className="flex flex-col gap-2">
              <button
                onClick={handleLineLoginClick}
                className="w-full bg-[#06C755] hover:bg-[#05b04b] text-white font-sans font-extrabold text-xs py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer border-0 shadow-sm"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></div>
                <Smartphone size={14} />
                <span>เข้าสู่ระบบด้วย LINE ของจริง (LINE Login)</span>
              </button>
              
              <div className="flex items-center justify-center gap-1.5 mt-1">
                <span className="text-slate-400 text-[9.5px]">หรือต้องการทดสอบ?</span>
                <button
                  type="button"
                  onClick={() => setShowLineLoginModal(true)}
                  className="text-[#06C755] hover:underline font-extrabold text-[10px] bg-transparent border-0 cursor-pointer p-0"
                >
                  ใช้ระบบล็อกอินจำลอง (Simulator)
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => setShowLineLoginModal(true)}
                className="w-full bg-[#06C755] hover:bg-[#05b04b] text-white font-sans font-extrabold text-xs py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer border-0 shadow-sm"
              >
                <Smartphone size={14} />
                <span>เข้าสู่ระบบจำลองผ่าน LINE (Simulated)</span>
              </button>
              
              <p className="text-slate-400 text-[9px] text-center mt-1">
                * สำหรับแอดมิน: สามารถตั้งค่า LINE Login LIFF ID ในแผงควบคุมระบบเพื่อเชื่อมต่อระบบ LINE Login ของจริงได้ทันที!
              </p>
            </div>
          )}
        </div>

        {/* Divider line */}
        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-100"></div>
          <span className="flex-shrink mx-4 text-slate-400 text-[9px] font-bold uppercase tracking-widest font-sans">
            สำหรับแอดมิน (Admin Only)
          </span>
          <div className="flex-grow border-t border-slate-100"></div>
        </div>

        {/* Form area - Only for Admin Login */}
        <form onSubmit={handleCredentialsLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-slate-500 uppercase tracking-wide text-[10px]">ชื่อผู้ใช้ผู้ดูแลระบบ (Admin Username)</label>
            <div className="relative">
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ระบุชื่อผู้ใช้ เช่น admin"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
              />
              <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-slate-500 uppercase tracking-wide text-[10px]">รหัสผ่าน (Password)</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="กรอกรหัสผ่านความปลอดภัยแอดมิน"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
              />
              <Key size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-xs font-semibold flex items-center gap-2 border border-rose-100">
              <ShieldAlert size={14} className="flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-semibold flex items-center gap-2 border border-emerald-100">
              <CheckCircle size={14} className="text-emerald-500 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-sans font-extrabold py-3 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer border-0"
          >
            {loading ? <RefreshCw className="animate-spin" size={13} /> : <Shield size={13} className="text-white" />}
            <span>เข้าสู่ระบบจัดการร้านค้า (Admin Log In)</span>
          </button>
        </form>
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
