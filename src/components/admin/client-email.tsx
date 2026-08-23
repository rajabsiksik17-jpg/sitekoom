"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Mail, Send, X, Check, Loader2, ImagePlus, History } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/admin/toast";
import { Modal, Spinner, Badge, EmptyState } from "@/components/admin/ui";
import { RichText } from "@/components/admin/rich-text";
import { ImageUpload } from "@/components/admin/image-upload";
import { formatDateTime } from "@/lib/utils";
import type { Client } from "@/lib/types";

interface Campaign {
  id: string;
  subject: string | null;
  recipients_count: number;
  success_count: number;
  failed_count: number;
  created_at: string;
  recipients?: { id: string; recipient: string; status: string; error: string | null; sent_at: string }[];
}

export function ClientEmail() {
  const { push } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  const loadClients = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("clients").select("id, name, email, company, username").is("deleted_at", null).order("name");
    setClients((data ?? []) as Client[]);
    setLoading(false);
  }, []);

  const loadCampaigns = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("email_campaigns").select("*, recipients:email_campaign_recipients(*)").order("created_at", { ascending: false }).limit(50);
    setCampaigns((data ?? []) as Campaign[]);
  }, []);

  useEffect(() => { loadClients(); loadCampaigns(); }, [loadClients, loadCampaigns]);

  const allSelected = clients.length > 0 && selected.size === clients.length;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(clients.map((c) => c.id)));
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function insertImage(url: string) {
    setContent((prev) => `${prev}<img src="${url}" style="max-width:100%;border-radius:12px;margin:12px 0;" />`);
  }

  async function doSend() {
    if (!subject.trim() || !content.trim()) return push("error", "أدخل العنوان والمحتوى");
    if (selected.size === 0) return push("error", "اختر مستلمًا واحدًا على الأقل");
    setSending(true);
    const res = await fetch("/api/admin/email/campaign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_ids: Array.from(selected), subject: subject.trim(), body: content }),
    });
    const data = await res.json();
    setSending(false);
    if (!res.ok) return push("error", data.error ?? "فشل الإرسال");
    push("success", `تم الإرسال: ${data.success} ناجح، ${data.failed} فاشل`);
    setOpen(false);
    setConfirm(false);
    setSubject("");
    setContent("");
    setSelected(new Set());
    loadCampaigns();
  }

  const withEmail = useMemo(() => clients.filter((c) => c.email), [clients]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setOpen(true)} className="btn-primary px-4 py-2.5">
          <Mail className="h-4 w-4" /> إرسال بريد
        </button>
        <button type="button" onClick={() => { setLogOpen((v) => !v); loadCampaigns(); }} className="btn-secondary px-4 py-2.5">
          <History className="h-4 w-4" /> سجل البريد
        </button>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="إرسال بريد للعملاء" size="lg"
        footer={<>
          <button type="button" onClick={() => setOpen(false)} className="btn-secondary px-4 py-2">إلغاء</button>
          <button type="button" onClick={() => setConfirm(true)} className="btn-primary px-6 py-2" disabled={sending}><Send className="h-4 w-4" /> متابعة</button>
        </>}>
        <div className="space-y-4">
          <div className="rounded-xl border border-brand-100 p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-semibold text-ink-900">المستلمون</p>
              <span className="text-sm text-gray-500">تم تحديد {selected.size} عميلًا</span>
            </div>
            <label className="mb-2 flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={allSelected} onChange={toggleAll} className="rounded border-brand-200 text-brand-600" /> تحديد الكل
            </label>
            <div className="max-h-40 space-y-1 overflow-y-auto">
              {withEmail.map((c) => (
                <label key={c.id} className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm hover:bg-brand-50">
                  <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggle(c.id)} className="rounded border-brand-200 text-brand-600" />
                  <span className="flex-1">{c.name}</span>
                  <span className="text-xs text-gray-400" dir="ltr">{c.email}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="label">العنوان (Subject)</label>
            <input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>

          <div>
            <label className="label">المحتوى</label>
            <RichText value={content} onChange={setContent} minHeight={220} />
            <div className="mt-2">
              <ImageUpload value="" onChange={insertImage} folder="email" />
            </div>
          </div>
        </div>
      </Modal>

      <Modal open={confirm} onClose={() => setConfirm(false)} title="تأكيد الإرسال" size="sm"
        footer={<>
          <button type="button" onClick={() => setConfirm(false)} className="btn-secondary px-4 py-2">إلغاء</button>
          <button type="button" onClick={doSend} disabled={sending} className="btn-primary px-6 py-2">{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : "إرسال"}</button>
        </>}>
        <p className="text-sm text-gray-600">سيتم إرسال هذه الرسالة إلى {selected.size} عميلًا. هل تريد المتابعة؟</p>
      </Modal>

      {logOpen && (
        <div className="card overflow-hidden">
          <div className="border-b border-brand-100 px-5 py-3"><p className="font-bold text-ink-900">سجل البريد</p></div>
          {campaigns.length === 0 ? (
            <EmptyState title="لا توجد رسائل مرسلة" />
          ) : (
            <div className="divide-y divide-brand-50">
              {campaigns.map((c) => (
                <div key={c.id}>
                  <button type="button" onClick={() => setExpanded(expanded === c.id ? null : c.id)} className="flex w-full items-center gap-3 px-5 py-3 text-start hover:bg-brand-50/40">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-ink-900">{c.subject ?? "—"}</p>
                      <p className="text-xs text-gray-400">{formatDateTime(c.created_at, "ar")}</p>
                    </div>
                    <span className="text-xs text-gray-500">{c.recipients_count} مستلم</span>
                    <Badge color="green">{c.success_count} ناجح</Badge>
                    {c.failed_count > 0 && <Badge color="red">{c.failed_count} فاشل</Badge>}
                  </button>
                  {expanded === c.id && (
                    <div className="space-y-1 bg-brand-50/30 px-5 py-3">
                      {c.recipients?.map((r) => (
                        <div key={r.id} className="flex items-center gap-3 text-sm">
                          <Check className={r.status === "sent" ? "h-4 w-4 text-green-600" : "h-4 w-4 text-red-500"} />
                          <span className="flex-1" dir="ltr">{r.recipient}</span>
                          <span className="text-xs text-gray-400">{formatDateTime(r.sent_at, "ar")}</span>
                          {r.error && <span className="text-xs text-red-500">{r.error}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
