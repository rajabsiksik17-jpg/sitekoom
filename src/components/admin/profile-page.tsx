"use client";

import { useCallback, useEffect, useState } from "react";
import { Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/admin/toast";
import { PageTitle, Spinner } from "@/components/admin/ui";
import { Field } from "@/components/admin/fields";
import { ImageUpload } from "@/components/admin/image-upload";
import type { User } from "@/lib/types";

export function ProfilePage() {
  const { push } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<User | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      const { data } = await supabase.from("users").select("*").eq("id", userData.user.id).single();
      setProfile((data as User) ?? null);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function saveProfile() {
    if (!profile) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("users").update({
      name: profile.name, avatar_url: profile.avatar_url, phone: profile.phone,
      position_ar: profile.position_ar, position_en: profile.position_en,
    }).eq("id", profile.id);
    setSaving(false);
    if (error) push("error", error.message);
    else push("success", "تم حفظ الملف الشخصي");
  }

  async function savePassword() {
    if (password.length < 8) return push("error", "كلمة المرور يجب أن تكون 8 أحرف على الأقل");
    if (password !== confirm) return push("error", "كلمتا المرور غير متطابقتين");
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) push("error", error.message);
    else { push("success", "تم تحديث كلمة المرور"); setPassword(""); setConfirm(""); }
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;
  if (!profile) return <p className="py-16 text-center text-gray-500">لا يوجد ملف.</p>;

  return (
    <div className="space-y-6">
      <PageTitle title="الملف الشخصي" />
      <div className="card space-y-4 p-6">
        <Field label="الصورة الشخصية"><ImageUpload value={profile.avatar_url ?? ""} onChange={(url) => setProfile((p) => p ? { ...p, avatar_url: url } : p)} bucket="avatars" folder="avatars" /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="الاسم"><input className="input" value={profile.name} onChange={(e) => setProfile((p) => p ? { ...p, name: e.target.value } : p)} /></Field>
          <Field label="البريد الإلكتروني"><input className="input" dir="ltr" value={profile.email ?? ""} disabled /></Field>
          <Field label="الهاتف"><input className="input" dir="ltr" value={profile.phone ?? ""} onChange={(e) => setProfile((p) => p ? { ...p, phone: e.target.value } : p)} /></Field>
          <Field label="المنصب"><input className="input" value={profile.position_ar ?? ""} onChange={(e) => setProfile((p) => p ? { ...p, position_ar: e.target.value } : p)} /></Field>
        </div>
        <button type="button" onClick={saveProfile} className="btn-primary px-6 py-2.5" disabled={saving}><Save className="h-4 w-4" /> {saving ? "جارٍ الحفظ..." : "حفظ"}</button>
      </div>

      <div className="card space-y-4 p-6">
        <h2 className="font-bold text-ink-900">تغيير كلمة المرور</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="كلمة المرور الجديدة"><input className="input" dir="ltr" type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
          <Field label="تأكيد كلمة المرور"><input className="input" dir="ltr" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></Field>
        </div>
        <button type="button" onClick={savePassword} className="btn-secondary px-6 py-2.5">تحديث كلمة المرور</button>
      </div>
    </div>
  );
}
