"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Toast {
  id: number;
  type: "success" | "error";
  message: string;
}

const ToastContext = createContext<{ push: (type: Toast["type"], message: string) => void }>({
  push: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((type: Toast["type"], message: string) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-5 start-5 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-card",
              t.type === "success" ? "bg-green-600" : "bg-red-600",
            )}
          >
            {t.type === "success" ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
