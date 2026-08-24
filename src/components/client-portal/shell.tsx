"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell, ChevronDown, Globe, HardDrive, History, LayoutDashboard, LifeBuoy, LogOut,
  MonitorSmartphone, PlayCircle, RefreshCcw, Settings, User,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Child {
  key: string;
  label: string;
  href: string;
}

interface Group {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children: Child[];
}

function buildNav(locale: "ar" | "en"): Group[] {
  const base = locale === "ar" ? "" : "/en";
  const l = (ar: string, en: string) => (locale === "ar" ? ar : en);
  return [
    {
      key: "account",
      label: l("حسابي", "My Account"),
      icon: User,
      children: [
        { key: "dashboard", label: l("الرئيسية", "Dashboard"), href: `${base}/client-portal` },
        { key: "settings", label: l("إعدادات الحساب", "Account Settings"), href: `${base}/client-portal/settings` },
      ],
    },
    {
      key: "website",
      label: l("موقعي", "My Website"),
      icon: MonitorSmartphone,
      children: [
        { key: "websites", label: l("المواقع", "Websites"), href: `${base}/client-portal/websites` },
      ],
    },
    {
      key: "subscription",
      label: l("الاشتراك", "Subscription"),
      icon: RefreshCcw,
      children: [
        { key: "subscription", label: l("الاشتراك الحالي", "Current Subscription"), href: `${base}/client-portal/subscription` },
        { key: "domain", label: l("الدومين", "Domain"), href: `${base}/client-portal/domain` },
        { key: "hosting", label: l("الاستضافة", "Hosting"), href: `${base}/client-portal/hosting` },
        { key: "renewals", label: l("التجديد والسجل", "Renewals & History"), href: `${base}/client-portal/renewals` },
      ],
    },
    {
      key: "support",
      label: l("الدعم", "Support"),
      icon: LifeBuoy,
      children: [
        { key: "support", label: l("الدعم الفني", "Support"), href: `${base}/client-portal/support` },
        { key: "chatHistory", label: l("محادثاتي", "My Chats"), href: `${base}/client-portal/chat-history` },
      ],
    },
    {
      key: "learning",
      label: l("التعلم", "Learning"),
      icon: PlayCircle,
      children: [
        { key: "videos", label: l("الفيديوهات التعليمية", "Tutorials"), href: `${base}/client-portal/videos` },
      ],
    },
    {
      key: "notifications",
      label: l("الإشعارات", "Notifications"),
      icon: Bell,
      children: [
        { key: "notifications", label: l("جميع الإشعارات", "All Notifications"), href: `${base}/client-portal/notifications` },
      ],
    },
  ];
}

export function PortalShell({
  locale,
  name,
  company,
  unread,
  children,
}: {
  locale: "ar" | "en";
  name: string;
  company: string | null;
  unread: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isAr = locale === "ar";
  const base = locale === "ar" ? "" : "/en";
  const nav = buildNav(locale);
  const [open, setOpen] = useState<Record<string, boolean>>({});

  // Auto-open the group containing the active route.
  useEffect(() => {
    const active = nav.find((g) => g.children.some((c) => pathname === c.href || pathname.startsWith(c.href + "/")));
    if (active) setOpen((prev) => (prev[active.key] === false ? prev : { ...prev, [active.key]: true }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  async function logout() {
    await fetch("/api/client/logout", { method: "POST" });
    router.push(locale === "ar" ? "/client-login" : `/en/client-login`);
    router.refresh();
  }

  function toggle(key: string) {
    setOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div dir={isAr ? "rtl" : "ltr"}>
      <header className="sticky top-0 z-40 border-b border-brand-100 bg-white/80 backdrop-blur">
        <div className="container-site flex h-16 items-center justify-between">
          <Link href={base || "/"} className="flex items-center gap-2 text-lg font-extrabold text-ink-900">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient text-white">S</span>
            {isAr ? "بوابة العملاء" : "Client Portal"}
          </Link>
          <div className="flex items-center gap-1">
            <Link href={`${base}/client-portal/notifications`} aria-label={isAr ? "الإشعارات" : "Notifications"} className="relative rounded-lg p-2 text-gray-600 hover:bg-brand-50">
              <Bell className="h-5 w-5" />
              {unread > 0 && (
                <span className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{unread}</span>
              )}
            </Link>
            <button type="button" onClick={logout} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-brand-50 hover:text-red-500">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">{isAr ? "خروج" : "Logout"}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="container-site py-8">
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="card h-fit p-4 lg:sticky lg:top-6">
          <div className="flex items-center gap-3 border-b border-brand-50 px-2 pb-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-gradient text-lg font-extrabold text-white">
              {name[0]?.toUpperCase() ?? "C"}
            </span>
            <div className="min-w-0">
              <p className="truncate font-bold text-ink-900">{name}</p>
              {company && <p className="truncate text-xs text-gray-500">{company}</p>}
            </div>
          </div>

          <nav className="mt-3 space-y-1">
            {nav.map((group) => {
              const Icon = group.icon;
              const isOpen = open[group.key];
              const hasActive = group.children.some((c) => pathname === c.href || pathname.startsWith(c.href + "/"));
              const groupUnread = group.key === "notifications" ? unread : 0;
              return (
                <div key={group.key}>
                  <button
                    type="button"
                    onClick={() => toggle(group.key)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      hasActive ? "text-brand-700" : "text-gray-600 hover:bg-brand-50 hover:text-brand-700",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="flex-1 text-start">{group.label}</span>
                    {groupUnread > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white">{groupUnread}</span>
                    )}
                    <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isOpen && "rotate-180")} />
                  </button>
                  <div className={cn("grid transition-all duration-200", isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                    <div className="overflow-hidden">
                      <div className="mt-1 space-y-0.5 border-s border-brand-100 ps-3 ms-4">
                        {group.children.map((child) => {
                          const active = pathname === child.href || pathname.startsWith(child.href + "/");
                          return (
                            <Link
                              key={child.key}
                              href={child.href}
                              className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                                active ? "bg-brand-gradient text-white" : "text-gray-600 hover:bg-brand-50 hover:text-brand-700",
                              )}
                            >
                              <span className="flex-1">{child.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </nav>

          <button type="button" onClick={logout} className="mt-4 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50">
            <LogOut className="h-5 w-5" />
            {isAr ? "تسجيل الخروج" : "Logout"}
          </button>
        </aside>

        <div className="min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
