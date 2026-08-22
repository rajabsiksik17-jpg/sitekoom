"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Lock } from "lucide-react";
import { useLocale } from "@/components/providers";

export function ClientLogin() {
  const { locale, dict } = useLocale();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/client/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Login failed");
      router.push(`/client-portal`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-[80vh] items-center justify-center overflow-hidden bg-ink-900 px-4 py-16">
      <div className="absolute inset-0 bg-hero-gradient" />
      <div className="relative w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient text-2xl font-extrabold text-white">S</span>
          <h1 className="text-2xl font-extrabold text-white">{locale === "ar" ? "تسجيل دخول عملاء Sitekoom" : "Sitekoom Client Login"}</h1>
          <p className="mt-2 text-sm text-white/60">
            {locale === "ar" ? "هذه الصفحة مخصصة لعملاء Sitekoom للوصول إلى مواقعهم وأنظمتهم." : "This page is for Sitekoom clients to access their websites and systems."}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">{locale === "ar" ? "اسم المستخدم أو البريد" : "Username or Email"}</label>
              <input
                className="input"
                dir="ltr"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">{locale === "ar" ? "كلمة المرور" : "Password"}</label>
              <div className="relative">
                <input
                  className="input pe-11"
                  dir="ltr"
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

            <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
              {loading ? (locale === "ar" ? "جارٍ تسجيل الدخول..." : "Signing in...") : (locale === "ar" ? "تسجيل الدخول" : "Login")}
            </button>
          </form>

          <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-gray-400">
            <Lock className="h-3.5 w-3.5" />
            {locale === "ar" ? "دخول آمن ومشفر" : "Secure, encrypted login"}
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-white/40">
          <Link href={locale === "ar" ? "/" : "/en"} className="hover:text-white/70">
            {locale === "ar" ? "العودة للموقع الرئيسي" : "Back to the main site"}
          </Link>
        </p>
      </div>
    </div>
  );
}
