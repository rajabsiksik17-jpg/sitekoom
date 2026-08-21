"use client";

import { useEffect } from "react";
import { X, Loader2, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-5 w-5 animate-spin", className)} />;
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-brand-200 bg-white py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-400">
        <Inbox className="h-7 w-7" />
      </div>
      <p className="font-semibold text-ink-900">{title}</p>
      {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-ink-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div
        className={cn(
          "flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-card sm:rounded-2xl",
          size === "sm" ? "sm:max-w-md" : size === "lg" ? "sm:max-w-4xl" : "sm:max-w-2xl",
        )}
      >
        <div className="flex items-center justify-between border-b border-brand-100 px-6 py-4">
          <h3 className="text-lg font-bold text-ink-900">{title}</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-brand-50">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
        {footer && <div className="flex justify-end gap-3 border-t border-brand-100 px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  loading,
}: {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={
        <>
          <button type="button" onClick={onCancel} className="btn-secondary px-4 py-2 text-sm">
            إلغاء
          </button>
          <button type="button" onClick={onConfirm} className="btn-danger px-4 py-2 text-sm" disabled={loading}>
            {loading ? <Spinner className="h-4 w-4" /> : "حذف"}
          </button>
        </>
      }
    >
      <p className="text-sm text-gray-600">{message}</p>
    </Modal>
  );
}

export function Badge({
  children,
  color = "brand",
}: {
  children: React.ReactNode;
  color?: "brand" | "green" | "red" | "amber" | "gray";
}) {
  const colors = {
    brand: "bg-brand-50 text-brand-700",
    green: "bg-green-50 text-green-700",
    red: "bg-red-50 text-red-700",
    amber: "bg-amber-50 text-amber-700",
    gray: "bg-gray-100 text-gray-600",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", colors[color])}>
      {children}
    </span>
  );
}

export function PageTitle({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-extrabold text-ink-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}
