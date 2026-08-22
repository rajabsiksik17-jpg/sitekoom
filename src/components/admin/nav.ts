import {
  LayoutDashboard,
  Inbox,
  ReceiptText,
  MessagesSquare,
  Layers,
  FolderKanban,
  GalleryHorizontalEnd,
  Home,
  PanelTop,
  Building2,
  Users,
  BarChart3,
  Newspaper,
  Tags,
  FileText,
  Image,
  Search,
  LineChart,
  Bell,
  UserCog,
  MonitorSmartphone,
  ShieldCheck,
  Share2,
  Settings,
  PanelBottom,
  Plug,
  History,
  Video,
  Mail,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: string;
}

export const adminNav: NavItem[] = [
  { key: "dashboard", label: "لوحة التحكم", href: "/admin", icon: LayoutDashboard, permission: "dashboard.view" },
  { key: "contacts", label: "طلبات التواصل", href: "/admin/contacts", icon: Inbox, permission: "contacts.view" },
  { key: "quotes", label: "طلبات التسعير", href: "/admin/quotes", icon: ReceiptText, permission: "contacts.view" },
  { key: "chat", label: "الاتصال المباشر", href: "/admin/chat", icon: MessagesSquare, permission: "chat.view" },
  { key: "services", label: "الخدمات", href: "/admin/services", icon: Layers, permission: "services.view" },
  { key: "projects", label: "الأعمال", href: "/admin/projects", icon: FolderKanban, permission: "projects.view" },
  { key: "slider", label: "سلايدر الرئيسية", href: "/admin/slider", icon: GalleryHorizontalEnd, permission: "homepage.view" },
  { key: "homepage", label: "محتوى الرئيسية", href: "/admin/homepage", icon: Home, permission: "homepage.view" },
  { key: "pageHero", label: "خلفيات رأس الصفحة", href: "/admin/page-hero", icon: PanelTop, permission: "homepage.view" },
  { key: "company", label: "الشركة", href: "/admin/company", icon: Building2, permission: "company.view" },
  { key: "team", label: "فريق العمل", href: "/admin/team", icon: Users, permission: "company.view" },
  { key: "statistics", label: "الإحصائيات", href: "/admin/statistics", icon: BarChart3, permission: "company.view" },
  { key: "articles", label: "المقالات", href: "/admin/articles", icon: Newspaper, permission: "articles.view" },
  { key: "categories", label: "التصنيفات", href: "/admin/categories", icon: Tags, permission: "articles.view" },
  { key: "pages", label: "الصفحات", href: "/admin/pages", icon: FileText, permission: "articles.view" },
  { key: "media", label: "مكتبة الوسائط", href: "/admin/media", icon: Image, permission: "media.view" },
  { key: "seo", label: "SEO", href: "/admin/seo", icon: Search, permission: "seo.view" },
  { key: "analytics", label: "التحليلات", href: "/admin/analytics", icon: LineChart, permission: "analytics.view" },
  { key: "notifications", label: "الإشعارات", href: "/admin/notifications", icon: Bell, permission: "notifications.view" },
  { key: "users", label: "المستخدمون", href: "/admin/users", icon: UserCog, permission: "users.view" },
  { key: "clients", label: "عملاء WordPress", href: "/admin/clients", icon: MonitorSmartphone, permission: "clients.view" },
  { key: "clientVideos", label: "فيديوهات تعليمية", href: "/admin/client-videos", icon: Video, permission: "clients.view" },
  { key: "roles", label: "الأدوار والصلاحيات", href: "/admin/roles", icon: ShieldCheck, permission: "roles.view" },
  { key: "social", label: "التواصل الاجتماعي", href: "/admin/social", icon: Share2, permission: "social.view" },
  { key: "settings", label: "الإعدادات", href: "/admin/settings", icon: Settings, permission: "settings.view" },
  { key: "email", label: "البريد الإلكتروني", href: "/admin/email", icon: Mail, permission: "settings.view" },
  { key: "footer", label: "الفوتر", href: "/admin/footer", icon: PanelBottom, permission: "settings.view" },
  { key: "integrations", label: "التكاملات", href: "/admin/integrations", icon: Plug, permission: "integrations.view" },
  { key: "audit", label: "سجل النشاطات", href: "/admin/audit", icon: History, permission: "audit.view" },
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
