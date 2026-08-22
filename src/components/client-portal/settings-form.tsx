"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";

export function SettingsForm({ locale, initial }: { locale: "ar" | "en"; initial: { name: string; company: string | null; email: string | null; username: string } }) {
  const router = useRouter();
  const isAr = locale === "ar";
  const [name, setName] = useState(initial.name);
  const [company, setCompany] = useState(initial.company ?? "");
  const [email, setEmail] = useState(initial.email ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!name.trim()) return setError(isAr ? "الاسم مطلوب" : "Name is required");
    if (newPassword && !currentPassword) return setError(isAr ? "أدخل كلمة المرور الحالية لتغييرها" : "Enter your current password to change it");
    setLoading(true);
    try {
      const res = await fetch("/api/client/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, company, email, current_password: currentPassword, new_password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "error");
      setSuccess(isAr ? "تم حفظ التغييرات." : "Changes saved.");
      setCurrentPassword("");
      setNewPassword("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="card max-w-2xl space-y-4 p-6">
      <div>
        <label className="label">{isAr ? "اسم المستخدم" : "Username"}</label>
        <input className="input bg-gray-50" dir="ltr" value={initial.username} disabled />
      </div>
      <div>
        <label className="label">{isAr ? "الاسم" : "Name"}</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <label className="label">{isAr ? "الشركة" : "Company"}</label>
        <input className="input" value={company} onChange={(e) => setCompany(e.target.value)} />
      </div>
      <div>
        <label className="label">{isAr ? "البريد الإلكتروني" : "Email"}</label>
        <input className="input" dir="ltr" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>

      <div className="border-t border-brand-50 pt-4">
        <p className="mb-3 font-semibold text-ink-900">{isAr ? "تغيير كلمة المرور" : "Change password"}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">{isAr ? "كلمة المرور الحالية" : "Current password"}</label>
            <input className="input" dir="ltr" type="password" autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </div>
          <div>
            <label className="label">{isAr ? "كلمة المرور الجديدة" : "New password"}</label>
            <input className="input" dir="ltr" type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
      {success && <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{success}</p>}

      <button type="submit" className="btn-primary px-6 py-2.5" disabled={loading}>
        <Save className="h-4 w-4" /> {loading ? (isAr ? "جارٍ الحفظ..." : "Saving...") : isAr ? "حفظ" : "Save"}
      </button>
    </form>
  );
}
