"use client";

import { useCallback, useEffect, useState } from "react";
import { Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/admin/toast";
import { PageTitle, Spinner } from "@/components/admin/ui";
import { PERMISSION_GROUPS } from "@/lib/permission-groups";
import type { Role, Permission } from "@/lib/types";

export function RolesManager() {
  const { push } = useToast();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [granted, setGranted] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  const grouped = permissions.reduce<Record<string, Permission[]>>((acc, p) => {
    (acc[p.group_key] ??= []).push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <PageTitle title="الأدوار والصلاحيات" description="إدارة الأدوار ومصفوفة الصلاحيات."
        action={selected && <button type="button" onClick={save} className="btn-primary px-6 py-2.5"><Save className="h-4 w-4" /> حفظ الصلاحيات</button>} />

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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
      )}
    </div>
  );
}
