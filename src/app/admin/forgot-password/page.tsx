"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin/update-password`,
    });
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-900 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-card">
        <h1 className="mb-2 text-xl font-extrabold text-ink-900">استعادة كلمة المرور</h1>
        <p className="mb-6 text-sm text-gray-500">أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين.</p>
        {sent ? (
          <p className="rounded-lg bg-green-50 p-4 text-sm text-green-700">تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني.</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="label">البريد الإلكتروني</label>
              <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
            <button type="submit" className="btn-primary w-full py-3">إرسال الرابط</button>
          </form>
        )}
        <p className="mt-4 text-center text-sm">
          <Link href="/admin/login" className="font-semibold text-brand-600 hover:underline">العودة لتسجيل الدخول</Link>
        </p>
      </div>
    </div>
  );
}
