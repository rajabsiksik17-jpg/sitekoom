"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Globe, HardDrive, History, LayoutDashboard, LifeBuoy, LogOut, MonitorSmartphone, PlayCircle, RefreshCcw, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  key: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

function buildNav(locale: "ar" | "en"): NavItem[] {
  const base = locale === "ar" ? "" : "/en";
  const l = (ar: string, en: string) => (locale === "ar" ? ar : en);
  return [
    { key: "dashboard", label: l("لوحة التحكم", "Dashboard"), href: `${base}/client-portal`, icon: LayoutDashboard },
    { key: "websites", label: l("مواقعي", "My Websites"), href: `${base}/client-portal/websites`, icon: MonitorSmartphone },
    { key: "subscription", label: l("الاشتراكات", "Subscriptions"), href: `${base}/client-portal/subscription`, icon: RefreshCcw },
    { key: "domain", label: l("الدومينات", "Domains"), href: `${base}/client-portal/domain`, icon: Globe },
    { key: "hosting", label: l("الاستضافة", "Hosting"), href: `${base}/client-portal/hosting`, icon: HardDrive },
    { key: "renewals", label: l("طلبات التجديد", "Renewals"), href: `${base}/client-portal/renewals`, icon: RefreshCcw },
    { key: "support", label: l("الدعم الفني", "Support"), href: `${base}/client-portal/support`, icon: LifeBuoy },
    { key: "chatHistory", label: l("سجل المحادثات", "Chat History"), href: `${base}/client-portal/chat-history`, icon: History },
    { key: "videos", label: l("فيديوهات تعليمية", "Tutorials"), href: `${base}/client-portal/videos`, icon: PlayCircle },
    { key: "notifications", label: l("الإشعارات", "Notifications"), href: `${base}/client-portal/notifications`, icon: Bell },
    { key: "settings", label: l("الإعدادات", "Settings"), href: `${base}/client-portal/settings`, icon: Settings },
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
  const nav = buildNav(locale);

  async function logout() {
    await fetch("/api/client/logout", { method: "POST" });
    router.push(locale === "ar" ? "/client-login" : `/en/client-login`);
    router.refresh();
  }

  return (
    <div dir={isAr ? "rtl" : "ltr"} className="container-site py-8">
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
            {nav.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    active ? "bg-brand-gradient text-white" : "text-gray-600 hover:bg-brand-50 hover:text-brand-700",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="flex-1">{item.label}</span>
                  {item.key === "notifications" && unread > 0 && (
                    <span className={cn("flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold", active ? "bg-white text-brand-700" : "bg-red-500 text-white")}>
                      {unread}
                    </span>
                  )}
                </Link>
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
  );
}
