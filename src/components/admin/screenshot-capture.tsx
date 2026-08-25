"use client";

import { useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { useToast } from "@/components/admin/toast";
import type { DeviceKey } from "@/lib/screenshots";

type ScreenshotMap = Partial<Record<DeviceKey, string>>;

export function ScreenshotCapture({
  url,
  previous,
  onCaptured,
  devices,
}: {
  url: string;
  previous: ScreenshotMap;
  onCaptured: (images: ScreenshotMap) => void;
  devices?: DeviceKey[];
}) {
  const { push } = useToast();
  const [busy, setBusy] = useState(false);

  const isDesktopOnly = devices?.length === 1 && devices[0] === "desktop";
  const idleLabel = isDesktopOnly ? "سحب Screenshot للدسكتوب فقط" : "جلب Screenshot للموقع من جميع الأجهزة";
  const busyLabel = isDesktopOnly ? "جارٍ سحب الدسكتوب..." : "جارٍ التقاط الصور...";
  const successLabel = isDesktopOnly ? "تم سحب Screenshot الدسكتوب بنجاح" : "تم إنشاء Screenshots بنجاح";

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
          old: previous,
          ...(devices ? { devices } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "فشل التقاط الصور");

      const images: ScreenshotMap = data.images ?? {};
      const errors: ScreenshotMap = data.errors ?? {};
      onCaptured(images);

      const okCount = Object.keys(images).length;
      const errCount = Object.keys(errors).length;
      if (errCount === 0) {
        push("success", successLabel);
      } else if (okCount > 0) {
        push("success", `تم إنشاء ${okCount} صورة، وتعذر إنشاء ${errCount}`);
      } else {
        push("error", Object.values(errors)[0] ?? "فشل التقاط الصور");
      }
    } catch (e) {
      push("error", e instanceof Error ? e.message : "فشل التقاط الصور");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" onClick={run} disabled={busy} className="btn-secondary px-4 py-2 text-sm">
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
      {busy ? busyLabel : idleLabel}
    </button>
  );
}
