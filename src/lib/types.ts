export type PublishStatus = "draft" | "published" | "archived";

export interface Role {
  id: string;
  key: string;
  name_ar: string;
  name_en: string;
  description: string | null;
  is_super: boolean;
  is_system: boolean;
  created_at: string;
}

export interface Permission {
  id: string;
  key: string;
  name_ar: string;
  name_en: string;
  group_key: string;
  sort: number;
}

export interface User {
  id: string;
  email: string | null;
  name: string;
  avatar_url: string | null;
  phone: string | null;
  position_ar: string | null;
  position_en: string | null;
  role_id: string | null;
  status: "active" | "disabled";
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  role?: Role | null;
}

export interface Service {
  id: string;
  title_ar: string;
  title_en: string;
  slug: string;
  icon: string | null;
  short_desc_ar: string | null;
  short_desc_en: string | null;
  full_desc_ar: string | null;
  full_desc_en: string | null;
  main_image: string | null;
  status: PublishStatus;
  sort: number;
  is_featured: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ServiceImage {
  id: string;
  service_id: string;
  url: string;
  alt: string | null;
  is_primary: boolean;
  sort: number;
}

export interface ServiceFeature {
  id: string;
  service_id: string;
  kind: "feature" | "benefit" | "process" | "technology";
  icon: string | null;
  title_ar: string;
  title_en: string;
  description_ar: string | null;
  description_en: string | null;
  sort: number;
}

export interface ServiceFaq {
  id: string;
  service_id: string;
  question_ar: string;
  question_en: string;
  answer_ar: string;
  answer_en: string;
  sort: number;
}

export interface ProjectCategory {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
  sort: number;
}

export interface Project {
  id: string;
  title_ar: string;
  title_en: string;
  slug: string;
  short_desc_ar: string | null;
  short_desc_en: string | null;
  full_desc_ar: string | null;
  full_desc_en: string | null;
  service_id: string | null;
  category_id: string | null;
  status: string;
  completion_date: string | null;
  thumbnail: string | null;
  cover_image: string | null;
  project_url: string | null;
  technologies: string[];
  status_field: PublishStatus;
  sort: number;
  is_featured: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  service?: Service | null;
  category?: ProjectCategory | null;
  images?: ProjectImage[];
}

export interface ProjectImage {
  id: string;
  project_id: string;
  url: string;
  alt: string | null;
  is_primary: boolean;
  sort: number;
}

export interface HomepageSlider {
  id: string;
  desktop_image: string | null;
  tablet_image: string | null;
  mobile_image: string | null;
  header_theme: "light" | "dark" | "auto";
  title_ar: string;
  title_en: string;
  subtitle_ar: string | null;
  subtitle_en: string | null;
  description_ar: string | null;
  description_en: string | null;
  cta_text_ar: string | null;
  cta_text_en: string | null;
  cta_url: string | null;
  cta2_text_ar: string | null;
  cta2_text_en: string | null;
  cta2_url: string | null;
  animation: string | null;
  is_active: boolean;
  sort: number;
}

export interface HomepageSection {
  id: string;
  key: string;
  title_ar: string | null;
  title_en: string | null;
  description_ar: string | null;
  description_en: string | null;
  is_active: boolean;
  sort: number;
  data: Record<string, unknown>;
}

export interface MarqueeMessage {
  id: string;
  text_ar: string;
  text_en: string;
  is_active: boolean;
  sort: number;
}

export interface CompanyInfo {
  id: number;
  about_ar: string | null;
  about_en: string | null;
  mission_ar: string | null;
  mission_en: string | null;
  vision_ar: string | null;
  vision_en: string | null;
  values_ar: string[];
  values_en: string[];
  why_ar: WhyItem[];
  why_en: WhyItem[];
  video_url: string | null;
}

export interface WhyItem {
  icon: string;
  title: string;
  description: string;
}

export interface CompanyImage {
  id: string;
  url: string;
  alt: string | null;
  caption: string | null;
  kind: string;
  sort: number;
}

export interface TeamMember {
  id: string;
  name_ar: string;
  name_en: string;
  position_ar: string | null;
  position_en: string | null;
  bio_ar: string | null;
  bio_en: string | null;
  photo: string | null;
  email: string | null;
  social_links: Record<string, string>;
  is_active: boolean;
  sort: number;
}

export interface Statistic {
  id: string;
  label_ar: string;
  label_en: string;
  value: number;
  suffix: string | null;
  icon: string | null;
  sort: number;
}

export interface SocialLink {
  id: string;
  platform: string;
  label: string | null;
  url: string;
  icon: string | null;
  is_active: boolean;
  sort: number;
}

export interface ContactRequest {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  service_id: string | null;
  service_name: string | null;
  subject: string | null;
  message: string | null;
  budget: string | null;
  source: string | null;
  source_page: string | null;
  source_ref_id: string | null;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  device_type: string | null;
  ip_address: string | null;
  country: string | null;
  reason: string | null;
  phone_meta: PhoneMeta | null;
  status: string;
  priority: string;
  assigned_to: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  assigned_user?: User | null;
  service?: Service | null;
}

export interface ContactNote {
  id: string;
  contact_id: string;
  author_id: string | null;
  body: string;
  is_internal: boolean;
  created_at: string;
  author?: User | null;
}

export interface PhoneMeta {
  country_code: string;
  dial_code: string;
  national_number: string;
  international_number: string;
  e164_number: string;
}

export interface ProjectRequest {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  country: string | null;
  company: string | null;
  service_id: string | null;
  service_name: string | null;
  other_service: string | null;
  project_details: string | null;
  budget: string | null;
  other_budget: string | null;
  timeline: string | null;
  attachments: string[];
  source: string | null;
  source_page: string | null;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  device_type: string | null;
  ip_address: string | null;
  phone_meta: PhoneMeta | null;
  status: string;
  priority: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  assigned_user?: User | null;
  service?: Service | null;
}

export interface ArticleCategory {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
  sort: number;
}

export interface ArticleTag {
  id: string;
  name: string;
  slug: string;
}

export interface Article {
  id: string;
  title_ar: string;
  title_en: string;
  slug: string;
  excerpt_ar: string | null;
  excerpt_en: string | null;
  content_ar: string | null;
  content_en: string | null;
  cover_image: string | null;
  author_id: string | null;
  category_id: string | null;
  status: PublishStatus;
  scheduled_for: string | null;
  published_at: string | null;
  is_featured: boolean;
  related_service_ids: string[];
  related_project_ids: string[];
  related_article_ids: string[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  author?: User | null;
  category?: ArticleCategory | null;
  tags?: ArticleTag[];
}

export interface SeoMetadata {
  id: string;
  entity_type: string;
  entity_id: string | null;
  locale: string;
  seo_title: string | null;
  meta_description: string | null;
  focus_keyword: string | null;
  keywords: string[];
  canonical_url: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
  twitter_card: string | null;
  robots: string | null;
  schema: Record<string, unknown>;
}

export interface LiveChatConversation {
  id: string;
  visitor_token: string;
  visitor_name: string | null;
  visitor_email: string | null;
  visitor_phone: string | null;
  first_message: string | null;
  status: "waiting" | "active" | "closed";
  assigned_to: string | null;
  source_page: string | null;
  referrer: string | null;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  closed_by: string | null;
  client_id: string | null;
  is_registered: boolean;
  agent?: User | null;
}

export interface LiveChatMessage {
  id: string;
  conversation_id: string;
  sender_type: "visitor" | "agent" | "system";
  sender_id: string | null;
  body: string;
  created_at: string;
  read_at: string | null;
  status: string;
}

export interface Notification {
  id: string;
  user_id: string | null;
  type: string;
  title_ar: string;
  title_en: string;
  body_ar: string | null;
  body_en: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export interface MediaItem {
  id: string;
  url: string;
  name: string | null;
  mime_type: string | null;
  size: number | null;
  width: number | null;
  height: number | null;
  alt: string | null;
  folder: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  actor_name: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  description: string;
  ip_address: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface PageHeroSettings {
  id: string;
  page_key: string;
  background_image: string | null;
  background_gif: string | null;
  mobile_image: string | null;
  overlay_color: string;
  overlay_opacity: number;
  updated_at: string;
}

export interface Page {
  id: string;
  slug: string;
  title_ar: string;
  title_en: string;
  content_ar: string | null;
  content_en: string | null;
  status: string;
  is_system: boolean;
  sort: number;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  username: string;
  website_url: string | null;
  admin_url: string | null;
  website_type: string;
  auth_method: string;
  status: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ClientWebsite {
  id: string;
  client_id: string;
  name: string;
  domain: string | null;
  website_url: string | null;
  admin_url: string | null;
  website_type: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ClientSubscription {
  id: string;
  client_id: string;
  website_id: string | null;
  plan: string | null;
  start_date: string | null;
  expiry_date: string | null;
  renewal_duration: string | null;
  renewal_price: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ClientDomain {
  id: string;
  client_id: string;
  website_id: string | null;
  domain_name: string;
  registration_date: string | null;
  expiry_date: string | null;
  renewal_period: string | null;
  renewal_price: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ClientHosting {
  id: string;
  client_id: string;
  website_id: string | null;
  provider: string | null;
  plan: string | null;
  start_date: string | null;
  expiry_date: string | null;
  renewal_period: string | null;
  renewal_price: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface RenewalRequest {
  id: string;
  client_id: string;
  website_id: string | null;
  service_type: string;
  service_name: string | null;
  amount: number;
  status: string;
  message: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientNotification {
  id: string;
  client_id: string;
  type: string;
  title_ar: string;
  title_en: string;
  body_ar: string | null;
  body_en: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export interface EducationalVideo {
  id: string;
  title_ar: string;
  title_en: string;
  description_ar: string | null;
  description_en: string | null;
  youtube_url: string;
  target_type: string;
  is_active: boolean;
  sort: number;
  created_at: string;
  updated_at: string;
}

export interface EmailTemplate {
  id: string;
  key: string;
  subject_ar: string | null;
  subject_en: string | null;
  body_ar: string | null;
  body_en: string | null;
  updated_at: string;
}

export interface EmailLog {
  id: string;
  type: string | null;
  recipient: string | null;
  subject: string | null;
  status: string;
  error: string | null;
  created_at: string;
}

export interface ClientSession {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  username: string;
  website_type: string;
}
