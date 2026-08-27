import {
  LayoutDashboard,
  MessagesSquare,
  Layers,
  Home,
  MonitorSmartphone,
  LineChart,
  Settings,
  Tag,
  Award,
  FormInput,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: string;
}

export interface NavChild {
  key: string;
  label: string;
  href: string;
  permission?: string;
}

export interface NavGroup {
  key: string;
  label: string;
  icon: LucideIcon;
  permission?: string;
  children: NavChild[];
}

export const adminNavSingles: NavItem[] = [
  { key: "dashboard", label: "لوحة التحكم", href: "/admin", icon: LayoutDashboard, permission: "dashboard.view" },
  { key: "analytics", label: "التحليلات", href: "/admin/analytics", icon: LineChart, permission: "analytics.view" },
];

export const adminNavGroups: NavGroup[] = [
  {
    key: "clients",
    label: "إدارة العملاء",
    icon: MonitorSmartphone,
    permission: "clients.view",
    children: [
      { key: "clients", label: "العملاء", href: "/admin/clients", permission: "clients.view" },
      { key: "renewals", label: "طلبات التجديد", href: "/admin/renewals", permission: "clients.view" },
      { key: "clientVideos", label: "فيديوهات تعليمية", href: "/admin/client-videos", permission: "clients.view" },
      { key: "supportReasons", label: "أسباب الدعم", href: "/admin/support-reasons", permission: "clients.view" },
    ],
  },
  {
    key: "content",
    label: "المحتوى",
    icon: Layers,
    permission: "services.view",
    children: [
      { key: "serviceCategories", label: "تصنيفات الخدمات", href: "/admin/service-categories", permission: "services.view" },
      { key: "services", label: "الخدمات", href: "/admin/services", permission: "services.view" },
      { key: "projects", label: "الأعمال", href: "/admin/projects", permission: "projects.view" },
      { key: "offers", label: "العروض", href: "/admin/offers", permission: "offers.view" },
      { key: "achievements", label: "الإنجازات", href: "/admin/achievements", permission: "achievements.view" },
      { key: "forms", label: "النماذج", href: "/admin/forms", permission: "forms.view" },
      { key: "articles", label: "المقالات", href: "/admin/articles", permission: "articles.view" },
      { key: "categories", label: "التصنيفات", href: "/admin/categories", permission: "articles.view" },
      { key: "pages", label: "الصفحات", href: "/admin/pages", permission: "articles.view" },
      { key: "media", label: "مكتبة الوسائط", href: "/admin/media", permission: "media.view" },
      { key: "seo", label: "SEO", href: "/admin/seo", permission: "seo.view" },
    ],
  },
  {
    key: "communication",
    label: "التواصل",
    icon: MessagesSquare,
    permission: "contacts.view",
    children: [
      { key: "contacts", label: "طلبات التواصل", href: "/admin/contacts", permission: "contacts.view" },
      { key: "quotes", label: "طلبات التسعير", href: "/admin/quotes", permission: "contacts.view" },
      { key: "submissions", label: "طلبات النماذج", href: "/admin/forms/submissions", permission: "submissions.view" },
      { key: "chat", label: "الاتصال المباشر", href: "/admin/chat", permission: "chat.view" },
      { key: "notifications", label: "الإشعارات", href: "/admin/notifications", permission: "notifications.view" },
    ],
  },
  {
    key: "website",
    label: "الموقع",
    icon: Home,
    permission: "homepage.view",
    children: [
      { key: "slider", label: "سلايدر الرئيسية", href: "/admin/slider", permission: "homepage.view" },
      { key: "homepage", label: "محتوى الرئيسية", href: "/admin/homepage", permission: "homepage.view" },
      { key: "pageHero", label: "خلفيات رأس الصفحة", href: "/admin/page-hero", permission: "homepage.view" },
      { key: "company", label: "الشركة", href: "/admin/company", permission: "company.view" },
      { key: "team", label: "فريق العمل", href: "/admin/team", permission: "company.view" },
      { key: "statistics", label: "الإحصائيات", href: "/admin/statistics", permission: "company.view" },
      { key: "social", label: "التواصل الاجتماعي", href: "/admin/social", permission: "social.view" },
      { key: "footer", label: "الفوتر", href: "/admin/footer", permission: "settings.view" },
    ],
  },
  {
    key: "settings",
    label: "الإعدادات",
    icon: Settings,
    permission: "settings.view",
    children: [
      { key: "settings", label: "الإعدادات العامة", href: "/admin/settings", permission: "settings.view" },
      { key: "email", label: "البريد الإلكتروني", href: "/admin/email", permission: "settings.view" },
      { key: "integrations", label: "التكاملات", href: "/admin/integrations", permission: "integrations.view" },
      { key: "users", label: "المستخدمون", href: "/admin/users", permission: "users.view" },
      { key: "roles", label: "الأدوار والصلاحيات", href: "/admin/roles", permission: "roles.view" },
      { key: "audit", label: "سجل النشاطات", href: "/admin/audit", permission: "audit.view" },
    ],
  },
];

export const statusLabels: Record<string, { label: string; color: "brand" | "green" | "red" | "amber" | "gray" }> = {
  new: { label: "جديد", color: "brand" },
  contacted: { label: "تم التواصل", color: "amber" },
  in_progress: { label: "قيد التنفيذ", color: "amber" },
  converted: { label: "تم التحويل", color: "green" },
  closed: { label: "مغلق", color: "gray" },
  spam: { label: "غير مرغوب", color: "red" },
};

export const priorityLabels: Record<string, { label: string; color: "brand" | "green" | "red" | "amber" | "gray" }> = {
  low: { label: "منخفضة", color: "gray" },
  medium: { label: "متوسطة", color: "brand" },
  high: { label: "عالية", color: "amber" },
  urgent: { label: "عاجلة", color: "red" },
};

export const publishLabels: Record<string, { label: string; color: "brand" | "green" | "red" | "amber" | "gray" }> = {
  draft: { label: "مسودة", color: "gray" },
  published: { label: "منشور", color: "green" },
  archived: { label: "مؤرشف", color: "amber" },
};

export const pricingStatusLabels: Record<string, { label: string; color: "brand" | "green" | "red" | "amber" | "gray" }> = {
  new: { label: "جديد", color: "brand" },
  reviewing: { label: "قيد المراجعة", color: "amber" },
  contacted: { label: "تم التواصل", color: "amber" },
  quotation_sent: { label: "تم إرسال العرض", color: "brand" },
  negotiation: { label: "تفاوض", color: "amber" },
  won: { label: "مكتمل", color: "green" },
  lost: { label: "خاسر", color: "red" },
  closed: { label: "مغلق", color: "gray" },
};
