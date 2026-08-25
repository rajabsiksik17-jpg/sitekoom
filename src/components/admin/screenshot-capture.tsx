"use client";

import { useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { useToast } from "@/components/admin/toast";

export function ScreenshotCapture({
  url,
  previous,
  onCaptured,
}: {
  url: string;
  previous: { desktop?: string | null; tablet?: string | null; mobile?: string | null };
  onCaptured: (r: { desktop: string; tablet: string; mobile: string }) => void;
}) {
  const { push } = useToast();
  const [busy, setBusy] = useState(false);

  async function run() {
    const target = url.trim();
    if (!target) {
      push("error", "أدخل رابط الموقع أولًا (رابط المشروع أو رابط الالتقاط)");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/screenshots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: target,
          remove: [previous.desktop, previous.tablet, previous.mobile].filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "فشل التقاط الصور");
      onCaptured({ desktop: data.desktop, tablet: data.tablet, mobile: data.mobile });
      push("success", "تم التقاط Screenshots الموقع بنجاح");
    } catch (e) {
      push("error", e instanceof Error ? e.message : "فشل التقاط الصور");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" onClick={run} disabled={busy} className="btn-secondary px-4 py-2 text-sm">
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
      {busy ? "جارٍ التقاط الصور..." : "جلب Screenshots الموقع"}
    </button>
  );
}
