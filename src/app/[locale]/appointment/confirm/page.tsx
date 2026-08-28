"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useLocale } from "@/components/providers";

export default function AppointmentConfirmPage() {
  const { locale } = useLocale();
  const isAr = locale === "ar";
  const params = useSearchParams();
  const id = params.get("id");
  const token = params.get("token");
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!id || !token) {
      setState("error");
      setMessage(isAr ? "رابط غير صالح" : "Invalid link");
      return;
    }
    fetch(`/api/appointments/${id}/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "error");
        setState("ok");
      })
      .catch((e) => {
        setState("error");
        setMessage(e instanceof Error ? e.message : "error");
      });
  }, [id, token, isAr]);

  return (
    <div className="container-site py-16">
      <div className="card mx-auto max-w-xl p-8 text-center">
        {state === "loading" && (
          <div className="flex flex-col items-center gap-3 text-ink-900">
            <Loader2 className="h-10 w-10 animate-spin text-brand-600" />
            <p className="font-semibold">{isAr ? "جارٍ تأكيد الموعد..." : "Confirming your appointment..."}</p>
          </div>
        )}
        {state === "ok" && (
          <div className="flex flex-col items-center gap-3 text-ink-900">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <h1 className="text-xl font-extrabold">{isAr ? "تم تأكيد موعدك الجديد" : "Your new appointment is confirmed"}</h1>
            <p className="text-gray-600">{isAr ? "شكرًا لك. تم اعتماد الموعد الجديد بنجاح." : "Thank you. Your new time has been confirmed."}</p>
          </div>
        )}
        {state === "error" && (
          <div className="flex flex-col items-center gap-3 text-ink-900">
            <XCircle className="h-12 w-12 text-red-500" />
            <h1 className="text-xl font-extrabold">{isAr ? "تعذّر تأكيد الموعد" : "Could not confirm appointment"}</h1>
            <p className="text-gray-600">{message || (isAr ? "الموعد المقترح لم يعد متاحًا." : "The proposed time is no longer available.")}</p>
          </div>
        )}
        <Link href="/" className="btn-primary mt-6 px-6 py-2.5">
          {isAr ? "العودة للرئيسية" : "Back to home"}
        </Link>
      </div>
    </div>
  );
}
