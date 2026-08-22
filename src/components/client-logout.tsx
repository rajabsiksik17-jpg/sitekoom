"use client";

import { useRouter } from "next/navigation";

export function LogoutButton({ label }: { label: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await fetch("/api/client/logout", { method: "POST" });
        router.push("/client-login");
        router.refresh();
      }}
      className="btn-secondary px-4 py-2 text-sm"
    >
      {label}
    </button>
  );
}
