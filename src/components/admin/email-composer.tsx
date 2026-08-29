"use client";

import { useEffect, useState } from "react";
import { Mail, Send, Loader2 } from "lucide-react";
import { useToast } from "@/components/admin/toast";
import { Modal } from "@/components/admin/ui";

export type EmailEntityType = "offer_request" | "contact" | "quote" | "appointment";

export function EmailComposer({
  open,
  onClose,
  recipientEmail,
  recipientName,
  defaultSubject,
  entityType,
  entityId,
  locale = "ar",
  onSent,
}: {
  open: boolean;
  onClose: () => void;
  recipientEmail: string;
  recipientName?: string;
  defaultSubject?: string;
  entityType: EmailEntityType;
  entityId: string;
  locale?: "ar" | "en";
  onSent?: () => void;
}) {
  const { push } = useToast();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open) {
      setSubject(defaultSubject ?? "");
      setMessage("");
    }
  }, [open, defaultSubject]);

  async function send() {
    if (!subject.trim()) return push("error", "أدخل العنوان");
    if (!message.trim()) return push("error", "أدخل نص الرسالة");
    setSending(true);
    try {
      const res = await fetch("/api/admin/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: recipientEmail, subject: subject.trim(), message, entity_type: entityType, entity_id: entityId, locale }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "فشل الإرسال");
      push("success", "تم إرسال البريد بنجاح");
      onSent?.();
      onClose();
    } catch (e) {
      push("error", e instanceof Error ? e.message : "فشل الإرسال");
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="إرسال إيميل"
      size="md"
      footer={
        <>
          <button type="button" onClick={onClose} className="btn-secondary px-4 py-2 text-sm">
            إلغاء
          </button>
          <button type="button" onClick={send} disabled={sending} className="btn-primary px-6 py-2 text-sm">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {sending ? "جارٍ الإرسال..." : "إرسال"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-brand-100 bg-brand-50/40 p-3 text-sm">
          <p className="font-semibold text-ink-900">{recipientName ?? "العميل"}</p>
          <p className="mt-0.5 text-gray-500" dir="ltr">
            <Mail className="me-1 inline h-3.5 w-3.5" />
            {recipientEmail}
          </p>
        </div>

        <div>
          <label className="label">الموضوع (Subject)</label>
          <input className="input" dir="auto" value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>

        <div>
          <label className="label">الرسالة</label>
          <textarea
            className="input min-h-[160px] resize-y"
            dir="auto"
            placeholder="اكتب رسالتك للعميل..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}
