"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const disabledError = params.get("error") === "disabled" ? "تم تعطيل حسابك. يرجى التواصل مع الإدارة." : "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError("بيانات الدخول غير صحيحة. يرجى المحاولة مرة أخرى.");
      return;
    }
    router.replace("/admin");
    router.refresh();
  }

  async function handleForgot() {
    if (!email) return setError("أدخل بريدك الإلكتروني أولاً.");
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin/update-password`,
    });
    if (error) setError(error.message);
    else setError("تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك.");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="label">البريد الإلكتروني</label>
        <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
      </div>
      <div>
        <label htmlFor="password" className="label">كلمة المرور</label>
        <input id="password" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
      </div>
      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2 text-gray-600">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="rounded border-brand-200 text-brand-600" />
          تذكرني
        </label>
        <button type="button" onClick={handleForgot} className="font-semibold text-brand-600 hover:underline">
          نسيت كلمة المرور؟
        </button>
      </div>

      {(error || disabledError) && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error || disabledError}</p>
      )}

      <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
        {loading ? "جارٍ تسجيل الدخول..." : "تسجيل الدخول"}
      </button>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-900 p-4">
      <div className="absolute inset-0 bg-hero-gradient" />
      <div className="relative w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient text-2xl font-extrabold text-white">S</span>
          <h1 className="text-2xl font-extrabold text-white">لوحة تحكم Sitekoom</h1>
          <p className="mt-1 text-sm text-white/60">سجّل الدخول للمتابعة</p>
        </div>
        <div className="rounded-2xl bg-white p-8 shadow-card">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
        <p className="mt-6 text-center text-xs text-white/40">
          <Link href="/" className="hover:text-white/70">العودة للموقع</Link>
        </p>
      </div>
    </div>
  );
}
