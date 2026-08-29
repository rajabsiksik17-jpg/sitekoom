"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { LogOut, Menu, User, X, ChevronDown } from "lucide-react";
import { adminNavSingles, adminNavGroups } from "@/components/admin/nav";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/admin/toast";
import { cn } from "@/lib/utils";

interface Badges {
  contacts: number;
  quotes: number;
  chat: number;
  renewals: number;
  appointments: number;
}

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
  const { push } = useToast();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [badges, setBadges] = useState<Badges>({ contacts: 0, quotes: 0, chat: 0, renewals: 0, appointments: 0 });
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const supabaseRef = useRef(createClient());

  const has = (p?: string) => !p || permissions.includes(p);

  const refreshBadges = useCallback(async () => {
    const supabase = supabaseRef.current;
    const [c, q, ch, rn, ap] = await Promise.all([
      supabase.from("contact_requests").select("id", { count: "exact", head: true }).eq("status", "new").is("deleted_at", null),
      supabase.from("project_requests").select("id", { count: "exact", head: true }).eq("status", "new").is("deleted_at", null),
      supabase.from("live_chat_conversations").select("id", { count: "exact", head: true }).eq("status", "waiting"),
      supabase.from("renewal_requests").select("id", { count: "exact", head: true }).in("status", ["new", "in_review"]),
      supabase.from("appointments").select("id", { count: "exact", head: true }).eq("status", "new"),
    ]);
    setBadges({ contacts: c.count ?? 0, quotes: q.count ?? 0, chat: ch.count ?? 0, renewals: rn.count ?? 0, appointments: ap.count ?? 0 });
  }, []);

  useEffect(() => {
    refreshBadges();

    const supabase = supabaseRef.current;
    const channel = supabase
      .channel("admin-sidebar-badges")
      .on("postgres_changes", { event: "*", schema: "public", table: "contact_requests" }, (payload) => {
        if (payload.eventType === "INSERT") push("success", "طلب تواصل جديد");
        refreshBadges();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "project_requests" }, (payload) => {
        if (payload.eventType === "INSERT") push("success", "طلب تسعير جديد");
        refreshBadges();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "live_chat_conversations" }, (payload) => {
        if (payload.eventType === "INSERT") push("success", "محادثة مباشرة جديدة");
        refreshBadges();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "renewal_requests" }, (payload) => {
        if (payload.eventType === "INSERT") push("success", "طلب تجديد جديد");
        refreshBadges();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, (payload) => {
        if (payload.eventType === "INSERT") push("success", "طلب حجز موعد جديد");
        refreshBadges();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshBadges, push]);

  // Auto-open the group that contains the active route.
  useEffect(() => {
    const activeGroup = adminNavGroups.find((g) => g.children.some((c) => pathname.startsWith(c.href)));
    if (activeGroup) {
      setOpenGroups((prev) => (prev[activeGroup.key] === false ? prev : { ...prev, [activeGroup.key]: true }));
    }
  }, [pathname]);

  async function handleSignOut() {
    const supabase = supabaseRef.current;
    await supabase.auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  function toggleGroup(key: string) {
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const badgeFor = (key: string): number | null => {
    if (key === "contacts") return badges.contacts;
    if (key === "quotes") return badges.quotes;
    if (key === "chat") return badges.chat;
    if (key === "renewals") return badges.renewals;
    if (key === "appointments") return badges.appointments;
    return null;
  };

  const profileItem = { key: "profile", label: "الملف الشخصي", href: "/admin/profile" };

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
        {adminNavSingles.filter((i) => has(i.permission)).map((item) => {
          const Icon = item.icon;
          const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
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
              <span className="flex-1">{item.label}</span>
            </Link>
          );
        })}

        {adminNavGroups.map((group) => {
          const children = group.children.filter((c) => has(c.permission));
          if (children.length === 0) return null;
          const GroupIcon = group.icon;
          const open = openGroups[group.key];
          const activeChild = children.some((c) => pathname.startsWith(c.href));
          const groupBadge = children.reduce((acc, c) => acc + (badgeFor(c.key) ?? 0), 0);
          return (
            <div key={group.key}>
              <button
                type="button"
                onClick={() => toggleGroup(group.key)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  activeChild ? "text-white" : "text-white/70 hover:bg-white/10 hover:text-white",
                )}
              >
                <GroupIcon className="h-5 w-5" />
                <span className="flex-1 text-start">{group.label}</span>
                {groupBadge > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white">
                    {groupBadge}
                  </span>
                )}
                <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", open && "rotate-180")} />
              </button>
              <div className={cn("grid transition-all duration-200", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                <div className="overflow-hidden">
                  <div className="mt-1 space-y-0.5 border-s border-white/10 ps-3 ms-4">
                    {children.map((child) => {
                      const active = pathname.startsWith(child.href);
                      const count = badgeFor(child.key);
                      return (
                        <Link
                          key={child.key}
                          href={child.href}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                            active ? "bg-brand-600 text-white" : "text-white/60 hover:bg-white/10 hover:text-white",
                          )}
                        >
                          <span className="flex-1">{child.label}</span>
                          {count != null && count > 0 && (
                            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white">
                              {count}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        <Link
          href={profileItem.href}
          onClick={() => setMobileOpen(false)}
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
            pathname.startsWith("/admin/profile") ? "bg-brand-600 text-white" : "text-white/70 hover:bg-white/10 hover:text-white",
          )}
        >
          <User className="h-5 w-5" />
          <span className="flex-1">{profileItem.label}</span>
        </Link>
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
      <aside className="fixed inset-y-0 start-0 z-40 hidden w-64 bg-ink-900 lg:block">{nav}</aside>

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
          <aside className="absolute inset-y-0 start-0 w-72 overflow-y-auto bg-ink-900">{nav}</aside>
        </div>
      )}
    </>
  );
}
