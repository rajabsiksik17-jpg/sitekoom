"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, ArrowRight, Bell, Eye, EyeOff, Globe, Headset, History, LayoutDashboard,
  LifeBuoy, Lock, MonitorSmartphone, PlayCircle, RefreshCcw, Rocket, ShieldCheck,
  Sparkles, TrendingUp, X, CheckCircle2, Zap, MessageSquare,
} from "lucide-react";
import { useLocale } from "@/components/providers";
import { localizePath } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";
import type { GeneralSettings } from "@/lib/settings";

export function ClientLoginLanding({ settings }: { settings: GeneralSettings }) {
  const { locale } = useLocale();
  const router = useRouter();
  const isAr = locale === "ar";
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const p = (path: string) => localizePath(path, locale);
  const companyName = isAr ? settings.company_name_ar : settings.company_name_en;
  const logo = settings.logo;
  const logoDesktop = settings.logo_width_desktop ?? 170;
  const logoTablet = settings.logo_width_tablet ?? 140;
  const logoMobile = settings.logo_width_mobile ?? 120;
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  const [modalOpen, setModalOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [trust, setTrust] = useState(true);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/client/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Login failed");
      if (data.needsOtp) {
        setOtpStep(true);
      } else {
        router.push(p("/client-portal"));
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/client/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: otpCode, trust }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Invalid code");
      return;
    }
    router.push(p("/client-portal"));
    router.refresh();
  }

  const features = [
    { icon: MonitorSmartphone, title: t("إدارة موقعك", "Manage your website"), desc: t("تابع حالة موقعك ومعلوماته من مكان واحد.", "Track your website status and details in one place.") },
    { icon: Rocket, title: t("وصول سريع لموقعك", "Quick access to your site"), desc: t("ادخل إلى لوحة إدارة موقعك من بوابة Sitekoom بسهولة وبطريقة آمنة.", "Access your site admin from the Sitekoom portal easily and securely.") },
    { icon: RefreshCcw, title: t("تجديد الدومين والاستضافة", "Domain & hosting renewal"), desc: t("اعرف موعد انتهاء خدماتك وتكلفة التجديد وتابع طلب التجديد.", "Know your expiry dates and renewal cost, and track your request.") },
    { icon: Headset, title: t("دعم مباشر", "Direct support"), desc: t("تواصل مباشرة مع فريق Sitekoom دون إعادة إدخال بياناتك.", "Chat directly with the Sitekoom team without re-entering your details.") },
    { icon: History, title: t("سجل المحادثات", "Conversation history"), desc: t("ارجع إلى محادثاتك السابقة وتابع طلباتك مع فريق الدعم.", "Revisit past conversations and follow up with support.") },
    { icon: PlayCircle, title: t("الفيديوهات التعليمية", "Tutorial videos"), desc: t("تعلم كيفية إدارة موقعك من خلال فيديوهات تعليمية مخصصة.", "Learn to manage your website through tailored tutorial videos.") },
    { icon: Bell, title: t("إشعارات مهمة", "Important notifications"), desc: t("ستصلك التنبيهات المتعلقة بموقعك وتجديد خدماتك مباشرة.", "Get alerts about your website and service renewals directly.") },
  ];

  const why = [
    { icon: Zap, title: t("إدارة أسهل", "Easier management") },
    { icon: LifeBuoy, title: t("دعم أسرع", "Faster support") },
    { icon: LayoutDashboard, title: t("معلوماتك في مكان واحد", "Everything in one place") },
    { icon: RefreshCcw, title: t("تجديد بدون تعقيد", "Hassle-free renewal") },
    { icon: ShieldCheck, title: t("وصول آمن", "Secure access") },
    { icon: TrendingUp, title: t("متابعة مستمرة", "Continuous follow-up") },
  ];

  const steps = [
    { title: t("أنشئ مشروعك مع Sitekoom", "Start your project with Sitekoom") },
    { title: t("تحصل على حسابك الخاص", "Get your own account") },
    { title: t("تابع موقعك وخدماتك", "Track your website and services") },
    { title: t("تواصل واطلب الدعم أو التجديد", "Contact us for support or renewal") },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-brand-100 bg-white/80 backdrop-blur">
        <style>{`:root{--header-logo-w:${logoDesktop}px}@media(max-width:1023px){:root{--header-logo-w:${logoTablet}px}}@media(max-width:639px){:root{--header-logo-w:${logoMobile}px}}`}</style>
        <div className="container-site flex h-16 items-center justify-between">
          <Link href={p("/")} className="flex items-center gap-2">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt={companyName} style={{ width: "var(--header-logo-w)", height: "auto" }} />
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient text-lg font-extrabold text-white">S</span>
            )}
            <span className="text-lg font-extrabold text-ink-900">{companyName}</span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <a href="#features" className="text-sm font-medium text-gray-600 hover:text-brand-700">{t("المميزات", "Features")}</a>
            <a href="#how" className="text-sm font-medium text-gray-600 hover:text-brand-700">{t("كيف تعمل", "How it works")}</a>
            <a href={p("/contact")} className="text-sm font-medium text-gray-600 hover:text-brand-700">{t("الدعم", "Support")}</a>
          </nav>
          <button type="button" onClick={() => setModalOpen(true)} className="btn-primary px-4 py-2 text-sm">
            {t("تسجيل الدخول", "Login")}
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-ink-900">
        <div className="absolute inset-0 bg-hero-gradient" />
        <div className="container-site relative py-20 text-center sm:py-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white">
            <Sparkles className="h-3.5 w-3.5" /> {t("بوابة مخصصة لعملاء Sitekoom", "A dedicated portal for Sitekoom clients")}
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold text-white sm:text-5xl lg:text-6xl">
            {t("بوابة عملاء Sitekoom", "Sitekoom Client Portal")}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-white/70">
            {t("كل ما تحتاجه لإدارة موقعك والتواصل مع فريق Sitekoom في مكان واحد.", "Everything you need to manage your website and communicate with the Sitekoom team in one place.")}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={() => setModalOpen(true)} className="btn-primary px-8 py-3.5 text-base">
              {t("تسجيل الدخول", "Login")}
              <Arrow className="h-4 w-4" />
            </button>
            <Link href={p("/contact")} className="btn-secondary px-8 py-3.5 text-base">
              {t("تواصل مع Sitekoom", "Contact Sitekoom")}
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container-site py-20">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold text-ink-900 sm:text-4xl">{t("مميزات بوابة العملاء", "Client Portal Features")}</h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="card p-6 transition-all hover:-translate-y-1 hover:shadow-glow">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-ink-900">{f.title}</h3>
              <p className="text-sm text-gray-600">{f.desc}</p>
            </div>
          ))}
          <div className="card flex flex-col items-center justify-center bg-brand-gradient p-6 text-center text-white">
            <Lock className="mb-3 h-8 w-8 opacity-90" />
            <h3 className="text-lg font-bold">{t("وصول آمن ومشفر", "Secure, encrypted access")}</h3>
          </div>
        </div>
      </section>

      {/* Why */}
      <section className="bg-brand-50/40 py-20">
        <div className="container-site">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold text-ink-900 sm:text-4xl">{t("لماذا تحصل على بوابة عملاء مع Sitekoom؟", "Why get a client portal with Sitekoom?")}</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {why.map((w) => (
              <div key={w.title} className="flex items-center gap-3 rounded-2xl border border-brand-100 bg-white px-5 py-4 shadow-sm">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <w.icon className="h-5 w-5" />
                </span>
                <span className="font-semibold text-ink-900">{w.title}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="container-site py-20">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold text-ink-900 sm:text-4xl">{t("كيف تعمل البوابة؟", "How does the portal work?")}</h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <div key={i} className="card relative p-6">
              <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-brand-gradient text-lg font-extrabold text-white">{i + 1}</span>
              <h3 className="font-bold text-ink-900">{s.title}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* Dashboard preview */}
      <section className="bg-ink-900 py-20">
        <div className="container-site">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">{t("نظام احترافي خاص بك", "Your own professional system")}</h2>
            <p className="mt-4 text-white/70">{t("لوحة تحكم تعرض موقعك واشتراكك ودومينك واستضافتك ودعمك في مكان واحد.", "A dashboard that shows your website, subscription, domain, hosting and support in one place.")}</p>
          </div>
          <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-white p-6 shadow-glow">
            <div className="grid gap-4 sm:grid-cols-4">
              {[
                { icon: MonitorSmartphone, label: t("موقعك", "Website"), value: t("نشط", "Active") },
                { icon: RefreshCcw, label: t("الاشتراك", "Subscription"), value: t("سنة واحدة", "1 year") },
                { icon: Globe, label: t("الدومين", "Domain"), value: t("2026", "2026") },
                { icon: Headset, label: t("الدعم", "Support"), value: t("متاح", "Available") },
              ].map((c) => (
                <div key={c.label} className="rounded-xl border border-brand-100 p-4 text-center">
                  <c.icon className="mx-auto mb-2 h-6 w-6 text-brand-600" />
                  <p className="text-xs text-gray-500">{c.label}</p>
                  <p className="mt-1 font-bold text-ink-900">{c.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-site py-20 text-center">
        <h2 className="text-3xl font-extrabold text-ink-900 sm:text-4xl">{t("هل لديك موقع مع Sitekoom؟", "Do you have a website with Sitekoom?")}</h2>
        <p className="mx-auto mt-4 max-w-xl text-gray-600">{t("ادخل إلى بوابة العملاء وابدأ بإدارة خدماتك بسهولة.", "Log in to the client portal and start managing your services easily.")}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={() => setModalOpen(true)} className="btn-primary px-8 py-3.5 text-base">{t("تسجيل الدخول", "Login")}</button>
          <Link href={p("/contact")} className="btn-secondary px-8 py-3.5 text-base">{t("تواصل مع Sitekoom", "Contact Sitekoom")}</Link>
        </div>
      </section>

      {/* Login modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-ink-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="w-full max-w-md rounded-t-2xl bg-white shadow-card sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-brand-100 px-6 py-4">
              <h3 className="text-lg font-bold text-ink-900">{otpStep ? t("رمز التحقق", "Verification code") : t("تسجيل دخول العملاء", "Client login")}</h3>
              <button type="button" onClick={() => { setModalOpen(false); setOtpStep(false); }} className="rounded-lg p-1 text-gray-400 hover:bg-brand-50"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6">
              {!otpStep ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="label">{t("اسم المستخدم أو البريد", "Username or email")}</label>
                    <input className="input" dir="ltr" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
                  </div>
                  <div>
                    <label className="label">{t("كلمة المرور", "Password")}</label>
                    <div className="relative">
                      <input className="input pe-11" dir="ltr" type={show ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                      <button type="button" onClick={() => setShow((v) => !v)} className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                  {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
                  <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
                    {loading ? t("جارٍ تسجيل الدخول...", "Signing in...") : t("تسجيل الدخول", "Login")}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="flex items-center gap-2 rounded-xl bg-brand-50 p-3 text-sm text-brand-700">
                    <MessageSquare className="h-4 w-4" /> {t("تم إرسال رمز التحقق إلى بريدك الإلكتروني.", "A verification code was sent to your email.")}
                  </div>
                  <div>
                    <label className="label">{t("رمز التحقق", "Verification code")}</label>
                    <input className="input text-center text-2xl tracking-[0.5em]" dir="ltr" inputMode="numeric" maxLength={6} value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))} required autoFocus />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input type="checkbox" checked={trust} onChange={(e) => setTrust(e.target.checked)} className="rounded border-brand-200 text-brand-600" />
                    {t("تذكر هذا الجهاز", "Trust this device")}
                  </label>
                  {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
                  <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
                    {loading ? t("جارٍ التحقق...", "Verifying...") : t("تأكيد الرمز", "Verify code")}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating hint */}
      {!modalOpen && (
        <div className="fixed bottom-5 end-5 z-40">
          <button type="button" onClick={() => setModalOpen(true)} className="flex items-center gap-2 rounded-full bg-brand-gradient px-5 py-3 text-sm font-bold text-white shadow-glow">
            <Lock className="h-4 w-4" /> {t("تسجيل الدخول", "Login")}
          </button>
        </div>
      )}
    </div>
  );
}
