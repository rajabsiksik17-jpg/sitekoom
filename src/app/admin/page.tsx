import Link from "next/link";
import { Eye, Inbox, MessagesSquare, FolderKanban, Layers, Newspaper, UserPlus, FileText } from "lucide-react";
import { requireAdmin } from "@/lib/admin-guard";
import { createClient } from "@/lib/supabase/server";
import { VisitorsChart, BarChartWidget } from "@/components/admin/charts";
import { statusLabels } from "@/components/admin/nav";
import { formatDateTime } from "@/lib/utils";
import type { ContactRequest, LiveChatConversation, AuditLog } from "@/lib/types";

function StatCard({ icon: Icon, label, value, href }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number | string; href: string }) {
  return (
    <Link href={href} className="card flex items-center gap-4 p-5 transition-all hover:-translate-y-0.5 hover:shadow-glow">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        <Icon className="h-6 w-6" />
      </span>
      <div>
        <p className="text-2xl font-extrabold text-ink-900">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </Link>
  );
}

export default async function AdminDashboardPage() {
  await requireAdmin();
  const supabase = createClient();

  const now = new Date();
  const last7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: totalVisitors },
    { count: totalContacts },
    { count: newContacts },
    { count: waitingChats },
    { count: projects },
    { count: services },
    { count: articles },
    { data: recentContacts },
    { data: recentChats },
    { data: recentLogs },
    { data: events },
    { data: topServices },
  ] = await Promise.all([
    supabase.from("analytics_events").select("*", { count: "exact", head: true }).eq("event_type", "page_view"),
    supabase.from("contact_requests").select("*", { count: "exact", head: true }).is("deleted_at", null),
    supabase.from("contact_requests").select("*", { count: "exact", head: true }).eq("status", "new").is("deleted_at", null),
    supabase.from("live_chat_conversations").select("*", { count: "exact", head: true }).eq("status", "waiting"),
    supabase.from("projects").select("*", { count: "exact", head: true }).is("deleted_at", null),
    supabase.from("services").select("*", { count: "exact", head: true }).is("deleted_at", null),
    supabase.from("articles").select("*", { count: "exact", head: true }).is("deleted_at", null),
    supabase.from("contact_requests").select("*").is("deleted_at", null).order("created_at", { ascending: false }).limit(5),
    supabase.from("live_chat_conversations").select("*").order("created_at", { ascending: false }).limit(5),
    supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(8),
    supabase.from("analytics_events").select("created_at,event_type").eq("event_type", "page_view").gte("created_at", last7).order("created_at"),
    supabase.from("analytics_events").select("entity_id,entity_type").eq("event_type", "service_view"),
  ]);

  const visitorData = buildDaily((events ?? []) as { created_at: string }[]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink-900">لوحة التحكم</h1>
        <p className="text-sm text-gray-500">نظرة عامة على أداء موقعك.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Eye} label="إجمالي الزيارات" value={totalVisitors ?? 0} href="/admin/analytics" />
        <StatCard icon={UserPlus} label="طلبات جديدة" value={newContacts ?? 0} href="/admin/contacts" />
        <StatCard icon={MessagesSquare} label="محادثات بالانتظار" value={waitingChats ?? 0} href="/admin/chat" />
        <StatCard icon={Inbox} label="إجمالي الطلبات" value={totalContacts ?? 0} href="/admin/contacts" />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={FolderKanban} label="الأعمال" value={projects ?? 0} href="/admin/projects" />
        <StatCard icon={Layers} label="الخدمات" value={services ?? 0} href="/admin/services" />
        <StatCard icon={Newspaper} label="المقالات" value={articles ?? 0} href="/admin/articles" />
        <StatCard icon={FileText} label="مشاهدات الصفحات" value={totalVisitors ?? 0} href="/admin/analytics" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="mb-4 font-bold text-ink-900">الزيارات خلال 7 أيام</h2>
          <VisitorsChart data={visitorData} />
        </div>
        <div className="card p-6">
          <h2 className="mb-4 font-bold text-ink-900">أكثر الخدمات زيارة</h2>
          <BarChartWidget data={buildTopServices((topServices ?? []) as { entity_id?: string | null }[])} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-ink-900">أحدث الطلبات</h2>
            <Link href="/admin/contacts" className="text-xs font-semibold text-brand-600 hover:underline">عرض الكل</Link>
          </div>
          <ul className="space-y-3">
            {(recentContacts ?? []).map((c: ContactRequest) => (
              <li key={c.id}>
                <Link href={`/admin/contacts/${c.id}`} className="flex items-center justify-between rounded-lg p-2 hover:bg-brand-50">
                  <div>
                    <p className="text-sm font-semibold text-ink-900">{c.name}</p>
                    <p className="text-xs text-gray-400">{c.service_name ?? c.source}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusLabels[c.status]?.color === "brand" ? "bg-brand-50 text-brand-700" : statusLabels[c.status]?.color === "green" ? "bg-green-50 text-green-700" : statusLabels[c.status]?.color === "amber" ? "bg-amber-50 text-amber-700" : statusLabels[c.status]?.color === "red" ? "bg-red-50 text-red-700" : "bg-gray-100 text-gray-600"}`}>
                    {statusLabels[c.status]?.label ?? c.status}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-ink-900">المحادثات</h2>
            <Link href="/admin/chat" className="text-xs font-semibold text-brand-600 hover:underline">فتح المحادثات</Link>
          </div>
          <ul className="space-y-3">
            {(recentChats ?? []).map((c: LiveChatConversation) => (
              <li key={c.id}>
                <Link href="/admin/chat" className="flex items-center justify-between rounded-lg p-2 hover:bg-brand-50">
                  <div>
                    <p className="text-sm font-semibold text-ink-900">{c.visitor_name ?? "زائر"}</p>
                    <p className="text-xs text-gray-400">{c.first_message?.slice(0, 40)}</p>
                  </div>
                  <span className="text-xs text-gray-400">{formatDateTime(c.created_at, "ar")}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="card p-6">
          <h2 className="mb-4 font-bold text-ink-900">آخر النشاطات</h2>
          <ul className="space-y-3">
            {(recentLogs ?? []).map((l: AuditLog) => (
              <li key={l.id} className="text-sm">
                <p className="text-ink-900">{l.description}</p>
                <p className="text-xs text-gray-400">{l.actor_name} • {formatDateTime(l.created_at, "ar")}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function buildDaily(events: { created_at: string }[]): { label: string; value: number }[] {
  const days: { label: string; value: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const count = events.filter((e) => e.created_at?.slice(0, 10) === key).length;
    days.push({ label: d.toLocaleDateString("en", { weekday: "short" }), value: count });
  }
  return days;
}

function buildTopServices(events: { entity_id?: string | null }[]): { label: string; value: number }[] {
  const counts = new Map<string, number>();
  events.forEach((e) => {
    if (e.entity_id) counts.set(e.entity_id, (counts.get(e.entity_id) ?? 0) + 1);
  });
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([, value], i) => ({ label: `#${i + 1}`, value }));
}
