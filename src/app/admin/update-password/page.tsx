"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) setError(error.message);
    else router.replace("/admin");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-900 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-card">
        <h1 className="mb-6 text-xl font-extrabold text-ink-900">تعيين كلمة مرور جديدة</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="label">كلمة المرور الجديدة</label>
            <input id="password" type="password" className="input" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
          <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
            {loading ? "جارٍ الحفظ..." : "حفظ كلمة المرور"}
          </button>
        </form>
      </div>
    </div>
  );
}
