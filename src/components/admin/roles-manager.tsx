"use client";

import { useCallback, useEffect, useState } from "react";
import { Save, Plus, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/admin/toast";
import { PageTitle, Badge, Spinner, Modal } from "@/components/admin/ui";
import { Field } from "@/components/admin/fields";
import { PERMISSION_GROUPS } from "@/lib/permission-groups";
import type { Role, Permission } from "@/lib/types";

const GROUP_KEYS = Object.keys(PERMISSION_GROUPS);

type PermDraft = { id?: string; key: string; name_ar: string; name_en: string; group_key: string; description: string; is_active: boolean };

const emptyDraft: PermDraft = { key: "", name_ar: "", name_en: "", group_key: "general", description: "", is_active: true };

export function RolesManager() {
  const { push } = useToast();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [granted, setGranted] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [permOpen, setPermOpen] = useState(false);
  const [permDraft, setPermDraft] = useState<PermDraft>(emptyDraft);
  const [permSaving, setPermSaving] = useState(false);

  const load = useCallback(async () => {
    const supabase = createClient();
    const [r, p] = await Promise.all([
      supabase.from("roles").select("*").order("created_at"),
      supabase.from("permissions").select("*").order("sort"),
    ]);
    setRoles((r.data ?? []) as Role[]);
    setPermissions((p.data ?? []) as Permission[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!selected) return;
    const supabase = createClient();
    supabase.from("role_permissions").select("permission_key").eq("role_id", selected).then(({ data }) => {
      setGranted(new Set((data ?? []).map((d) => d.permission_key)));
    });
  }, [selected]);

  function toggle(key: string) {
    setGranted((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function save() {
    if (!selected) return;
    const supabase = createClient();
    await supabase.from("role_permissions").delete().eq("role_id", selected);
    const rows = Array.from(granted).map((permission_key) => ({ role_id: selected, permission_key }));
    if (rows.length) {
      const { error } = await supabase.from("role_permissions").insert(rows);
      if (error) return push("error", error.message);
    }
    push("success", "تم حفظ الصلاحيات");
  }

  async function savePermission() {
    if (!permDraft.key.trim()) return push("error", "أدخل مفتاح الصلاحية");
    if (!permDraft.name_ar.trim()) return push("error", "أدخل الاسم العربي");
    setPermSaving(true);
    const supabase = createClient();
    const key = permDraft.key.trim().toLowerCase().replace(/\s+/g, ".");

    // Prevent duplicate key.
    const { data: dup } = await supabase.from("permissions").select("id").eq("key", key).neq("id", permDraft.id ?? "00000000-0000-0000-0000-000000000000").maybeSingle();
    if (dup) { setPermSaving(false); return push("error", "مفتاح الصلاحية موجود مسبقًا"); }

    const payload = { key, name_ar: permDraft.name_ar.trim(), name_en: permDraft.name_en.trim(), group_key: permDraft.group_key, description: permDraft.description.trim() || null, is_active: permDraft.is_active };
    let error;
    if (permDraft.id) {
      ({ error } = await supabase.from("permissions").update(payload).eq("id", permDraft.id));
    } else {
      ({ error } = await supabase.from("permissions").insert(payload));
    }
    setPermSaving(false);
    if (error) return push("error", error.message);
    push("success", "تم حفظ الصلاحية");
    setPermOpen(false);
    load();
  }

  async function toggleActive(p: Permission) {
    await createClient().from("permissions").update({ is_active: !p.is_active }).eq("id", p.id);
    load();
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  const grouped = permissions.reduce<Record<string, Permission[]>>((acc, p) => {
    (acc[p.group_key] ??= []).push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <PageTitle title="الأدوار والصلاحيات" description="إدارة الأدوار ومصفوفة الصلاحيات."
        action={<button type="button" onClick={() => { setPermDraft(emptyDraft); setPermOpen(true); }} className="btn-primary px-4 py-2.5"><Plus className="h-4 w-4" /> إضافة صلاحية</button>} />

      <div className="flex flex-wrap gap-2">
        {roles.map((r) => (
          <button key={r.id} type="button" onClick={() => setSelected(r.id)} className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${selected === r.id ? "bg-brand-gradient text-white" : "bg-brand-50 text-brand-700"}`}>
            {r.name_ar}
            {r.is_super && <span className="ms-1 text-xs opacity-70">(كامل)</span>}
          </button>
        ))}
      </div>

      {!selected ? (
        <p className="py-12 text-center text-gray-500">اختر دوراً لعرض صلاحياته.</p>
      ) : roles.find((r) => r.id === selected)?.is_super ? (
        <div className="rounded-2xl border border-brand-100 bg-brand-50 p-8 text-center text-brand-700">
          هذا الدور لديه صلاحية كاملة على النظام ولا يحتاج إلى مصفوفة صلاحيات.
        </div>
      ) : (
        <div className="flex items-start justify-between gap-4">
          <div className="grid flex-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(grouped).map(([group, perms]) => (
              <div key={group} className="card p-5">
                <h3 className="mb-3 font-bold text-ink-900">{PERMISSION_GROUPS[group]?.ar ?? group}</h3>
                <div className="space-y-2">
                  {perms.map((p) => (
                    <label key={p.key} className="flex items-center gap-2 text-sm text-gray-700">
                      <input type="checkbox" checked={granted.has(p.key)} onChange={() => toggle(p.key)} className="rounded border-brand-200 text-brand-600" />
                      {p.name_ar}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={save} className="btn-primary sticky top-24 shrink-0 px-6 py-2.5"><Save className="h-4 w-4" /> حفظ</button>
        </div>
      )}

      {/* Permissions management */}
      <div className="card p-6">
        <h3 className="mb-4 font-bold text-ink-900">إدارة الصلاحيات ({permissions.length})</h3>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {permissions.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-2 rounded-xl border border-brand-100 p-3">
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink-900" dir="ltr">{p.key}</p>
                <p className="truncate text-xs text-gray-500">{p.name_ar} · {PERMISSION_GROUPS[p.group_key]?.ar ?? p.group_key}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button type="button" onClick={() => toggleActive(p)}>
                  <Badge color={p.is_active ? "green" : "gray"}>{p.is_active ? "مفعّل" : "معطّل"}</Badge>
                </button>
                <button type="button" onClick={() => { setPermDraft({ id: p.id, key: p.key, name_ar: p.name_ar, name_en: p.name_en, group_key: p.group_key, description: p.description ?? "", is_active: p.is_active }); setPermOpen(true); }} className="rounded-lg p-2 text-brand-600 hover:bg-brand-50"><Pencil className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal open={permOpen} onClose={() => setPermOpen(false)} title={permDraft.id ? "تعديل صلاحية" : "إضافة صلاحية"} size="md"
        footer={<><button type="button" onClick={() => setPermOpen(false)} className="btn-secondary px-4 py-2 text-sm">إلغاء</button><button type="button" onClick={savePermission} disabled={permSaving} className="btn-primary px-6 py-2 text-sm">{permSaving ? "جارٍ الحفظ..." : "حفظ"}</button></>}>
        <div className="space-y-4">
          <Field label="مفتاح الصلاحية (Key)" hint="مثال: offers.view — بدون مسافات"><input className="input" dir="ltr" value={permDraft.key} onChange={(e) => setPermDraft((d) => ({ ...d, key: e.target.value }))} /></Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="الاسم (عربي)"><input className="input" value={permDraft.name_ar} onChange={(e) => setPermDraft((d) => ({ ...d, name_ar: e.target.value }))} /></Field>
            <Field label="الاسم (EN)"><input className="input" dir="ltr" value={permDraft.name_en} onChange={(e) => setPermDraft((d) => ({ ...d, name_en: e.target.value }))} /></Field>
          </div>
          <Field label="المجموعة / التصنيف">
            <select className="input" value={permDraft.group_key} onChange={(e) => setPermDraft((d) => ({ ...d, group_key: e.target.value }))}>
              {GROUP_KEYS.map((g) => <option key={g} value={g}>{PERMISSION_GROUPS[g]?.ar ?? g}</option>)}
            </select>
          </Field>
          <Field label="الوصف"><textarea className="input min-h-[70px] resize-y" value={permDraft.description} onChange={(e) => setPermDraft((d) => ({ ...d, description: e.target.value }))} /></Field>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={permDraft.is_active} onChange={(e) => setPermDraft((d) => ({ ...d, is_active: e.target.checked }))} className="rounded border-brand-200 text-brand-600" /> مفعّل
          </label>
        </div>
      </Modal>
    </div>
  );
}
