"use client";

import { useEffect, useState } from "react";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem("sitekoom_cookie_consent");
    if (!accepted) setVisible(true);
  }, []);

  function accept() {
    localStorage.setItem("sitekoom_cookie_consent", "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-[80] border-t border-brand-100 bg-white/95 p-4 shadow-card backdrop-blur">
      <div className="container-site flex flex-col items-center justify-between gap-3 sm:flex-row">
        <p className="text-sm text-gray-600">
          نستخدم ملفات تعريف الارتباط لتحسين تجربتك. بمواصلة التصفح فإنك توافق على سياسة الخصوصية.
        </p>
        <button type="button" onClick={accept} className="btn-primary shrink-0 px-5 py-2 text-sm">
          موافق
        </button>
      </div>
    </div>
  );
}
