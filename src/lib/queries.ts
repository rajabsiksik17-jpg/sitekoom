import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type {
  Article,
  CompanyInfo,
  HomepageSection,
  HomepageSlider,
  MarqueeMessage,
  PageHeroSettings,
  Project,
  ProjectCategory,
  Service,
  ServiceFaq,
  ServiceFeature,
  SocialLink,
  Statistic,
  TeamMember,
} from "@/lib/types";

const supabase = () => createClient();

export const getServices = cache(async (): Promise<Service[]> => {
  const { data } = await supabase()
    .from("services")
    .select("*")
    .eq("status", "published")
    .is("deleted_at", null)
    .order("sort")
    .order("created_at");
  return (data ?? []) as Service[];
});

export const getServiceBySlug = cache(async (slug: string): Promise<Service | null> => {
  const { data } = await supabase()
    .from("services")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .is("deleted_at", null)
    .single();
  return (data as Service) ?? null;
});

export const getServiceDetails = cache(
  async (slug: string) => {
    const service = await getServiceBySlug(slug);
    if (!service) return null;
    const [{ data: images }, { data: features }, { data: faqs }] = await Promise.all([
      supabase().from("service_images").select("*").eq("service_id", service.id).order("sort"),
      supabase()
        .from("service_features")
        .select("*")
        .eq("service_id", service.id)
        .order("sort"),
      supabase().from("service_faqs").select("*").eq("service_id", service.id).order("sort"),
    ]);
    return {
      service,
      images: (images ?? []) as { id: string; url: string; alt: string | null; is_primary: boolean; sort: number }[],
      features: (features ?? []) as ServiceFeature[],
      faqs: (faqs ?? []) as ServiceFaq[],
    };
  },
);

export const getProjectCategories = cache(async (): Promise<ProjectCategory[]> => {
  const { data } = await supabase()
    .from("project_categories")
    .select("*")
    .order("sort");
  return (data ?? []) as ProjectCategory[];
});

export const getProjects = cache(async (): Promise<Project[]> => {
  const { data } = await supabase()
    .from("projects")
    .select("*, service:services(id,title_ar,title_en,slug), category:project_categories(*)")
    .eq("status_field", "published")
    .is("deleted_at", null)
    .order("sort")
    .order("created_at");
  return (data ?? []) as Project[];
});

export const getProjectBySlug = cache(async (slug: string): Promise<Project | null> => {
  const { data } = await supabase()
    .from("projects")
    .select("*, service:services(id,title_ar,title_en,slug), category:project_categories(*), images:project_images(*)")
    .eq("slug", slug)
    .eq("status_field", "published")
    .is("deleted_at", null)
    .single();
  return (data as Project) ?? null;
});

export const getSliders = cache(async (): Promise<HomepageSlider[]> => {
  const { data } = await supabase()
    .from("homepage_sliders")
    .select("*")
    .eq("is_active", true)
    .order("sort");
  return (data ?? []) as HomepageSlider[];
});

export const getHomepageSections = cache(async (): Promise<HomepageSection[]> => {
  const { data } = await supabase()
    .from("homepage_sections")
    .select("*")
    .order("sort");
  return (data ?? []) as HomepageSection[];
});

export const getMarqueeMessages = cache(async (): Promise<MarqueeMessage[]> => {
  const { data } = await supabase()
    .from("marquee_messages")
    .select("*")
    .eq("is_active", true)
    .order("sort");
  return (data ?? []) as MarqueeMessage[];
});

export const getCompanyInfo = cache(async (): Promise<CompanyInfo | null> => {
  const { data } = await supabase().from("company_info").select("*").eq("id", 1).single();
  return (data as CompanyInfo) ?? null;
});

export const getTeamMembers = cache(async (): Promise<TeamMember[]> => {
  const { data } = await supabase()
    .from("team_members")
    .select("*")
    .eq("is_active", true)
    .order("sort");
  return (data ?? []) as TeamMember[];
});

export const getStatistics = cache(async (): Promise<Statistic[]> => {
  const { data } = await supabase().from("statistics").select("*").order("sort");
  return (data ?? []) as Statistic[];
});

export const getSocialLinks = cache(async (): Promise<SocialLink[]> => {
  const { data } = await supabase()
    .from("social_links")
    .select("*")
    .eq("is_active", true)
    .order("sort");
  return (data ?? []) as SocialLink[];
});

export const getArticles = cache(async (): Promise<Article[]> => {
  const { data } = await supabase()
    .from("articles")
    .select("*, author:users(*), category:article_categories(*), tags:article_tag_relations(article_tags(*))")
    .eq("status", "published")
    .is("deleted_at", null)
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false });
  return (data ?? []) as Article[];
});

export const getArticleBySlug = cache(async (slug: string): Promise<Article | null> => {
  const { data } = await supabase()
    .from("articles")
    .select("*, author:users(*), category:article_categories(*), tags:article_tag_relations(article_tags(*))")
    .eq("slug", slug)
    .eq("status", "published")
    .is("deleted_at", null)
    .single();
  return (data as Article) ?? null;
});

export const getArticleCategories = cache(async () => {
  const { data } = await supabase()
    .from("article_categories")
    .select("*")
    .order("sort");
  return (data ?? []) as { id: string; name_ar: string; name_en: string; slug: string; sort: number }[];
});

// Resolve the effective page-hero background: page custom → global → fallback.
export const getPageHeroSettings = cache(async (pageKey: string): Promise<PageHeroSettings | null> => {
  try {
    const { data: page } = await supabase()
      .from("page_hero_settings")
      .select("*")
      .eq("page_key", pageKey)
      .maybeSingle();

    if (page?.background_image || page?.background_gif) {
      return page as PageHeroSettings;
    }

    const { data: global } = await supabase()
      .from("page_hero_settings")
      .select("*")
      .eq("page_key", "global")
      .maybeSingle();

    if (global) return global as PageHeroSettings;
    return page ? (page as PageHeroSettings) : null;
  } catch {
    // Table not present yet — fall back to the default gradient.
    return null;
  }
});
