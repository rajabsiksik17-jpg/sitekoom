"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut, Menu, User, X } from "lucide-react";
import { adminNav } from "@/components/admin/nav";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function Sidebar({
  permissions,
  name,
  email,
}: {
  permissions: string[];
  name: string;
  email: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  const items = adminNav.filter((n) => !n.permission || permissions.includes(n.permission));
  const profileItem = { key: "profile", label: "الملف الشخصي", href: "/admin/profile", icon: User };

  const allItems = [...items, profileItem];

  const nav = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-6 py-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient text-lg font-extrabold text-white">
          S
        </span>
        <div>
          <p className="font-extrabold text-white">Sitekoom</p>
          <p className="text-xs text-white/50">لوحة التحكم</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {allItems.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.key}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-brand-600 text-white" : "text-white/70 hover:bg-white/10 hover:text-white",
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white">
            {name[0] ?? "U"}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{name}</p>
            <p className="truncate text-xs text-white/50">{email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="mt-3 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          تسجيل الخروج
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="fixed inset-y-0 start-0 z-40 hidden w-64 bg-ink-900 lg:block">{nav}</aside>

      {/* Mobile toggle */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed bottom-4 start-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-brand-gradient text-white shadow-glow lg:hidden"
        aria-label="Menu"
      >
        <Menu className="h-6 w-6" />
      </button>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink-900/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 start-0 w-72 bg-ink-900">{nav}</aside>
        </div>
      )}
    </>
  );
}
