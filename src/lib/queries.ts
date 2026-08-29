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
  Page,
  PortfolioItem,
  Project,
  ProjectCategory,
  ProjectFeature,
  Service,
  ServiceCategory,
  ServiceFaq,
  ServiceFeature,
  SocialLink,
  Statistic,
  TeamMember,
  Offer,
  OfferStage,
  OfferIncludedItem,
  OfferFeature,
  OfferOptionGroup,
  OfferOptionValue,
  OfferAddon,
  OfferPackage,
  Achievement,
  AchievementImage,
  AchievementFeature,
  DynamicForm,
  DynamicFormField,
  DynamicFormOption,
  DynamicFormRule,
} from "@/lib/types";

const supabase = () => createClient();

export const getServices = cache(async (): Promise<Service[]> => {
  const { data } = await (await supabase())
    .from("services")
    .select("*, category:service_categories(*)")
    .eq("status", "published")
    .is("deleted_at", null)
    .order("sort")
    .order("created_at");
  return (data ?? []) as Service[];
});

export const getServiceCategories = cache(async (): Promise<ServiceCategory[]> => {
  const { data } = await (await supabase())
    .from("service_categories")
    .select("*")
    .eq("is_active", true)
    .order("sort");
  return (data ?? []) as ServiceCategory[];
});

export const getServiceCategoryBySlug = cache(async (slug: string): Promise<ServiceCategory | null> => {
  const { data } = await (await supabase())
    .from("service_categories")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  return (data as ServiceCategory) ?? null;
});

export const getServiceBySlug = cache(async (slug: string): Promise<Service | null> => {
  const { data } = await (await supabase())
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
      (await supabase()).from("service_images").select("*").eq("service_id", service.id).order("sort"),
      (await supabase())
        .from("service_features")
        .select("*")
        .eq("service_id", service.id)
        .order("sort"),
      (await supabase()).from("service_faqs").select("*").eq("service_id", service.id).order("sort"),
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
  const { data } = await (await supabase())
    .from("project_categories")
    .select("*")
    .order("sort");
  return (data ?? []) as ProjectCategory[];
});

export const getProjects = cache(async (): Promise<Project[]> => {
  const { data } = await (await supabase())
    .from("projects")
    .select("*, service:services(id,title_ar,title_en,slug,category_id), category:project_categories(*)")
    .eq("status_field", "published")
    .is("deleted_at", null)
    .order("sort")
    .order("created_at");
  return (data ?? []) as Project[];
});

export const getProjectBySlug = cache(async (slug: string): Promise<Project | null> => {
  const { data } = await (await supabase())
    .from("projects")
    .select("*, service:services(id,title_ar,title_en,slug,category_id), category:project_categories(*), images:project_images(*)")
    .eq("slug", slug)
    .eq("status_field", "published")
    .is("deleted_at", null)
    .single();
  return (data as Project) ?? null;
});

export const getProjectPortfolioItems = cache(async (projectId: string): Promise<PortfolioItem[]> => {
  const { data } = await (await supabase())
    .from("project_portfolio_items")
    .select("*")
    .eq("project_id", projectId)
    .eq("is_visible", true)
    .order("sort");
  return (data ?? []) as PortfolioItem[];
});

export const getProjectFeatures = cache(async (projectId: string): Promise<ProjectFeature[]> => {
  const { data } = await (await supabase())
    .from("project_features")
    .select("*")
    .eq("project_id", projectId)
    .order("sort");
  return (data ?? []) as ProjectFeature[];
});

export const getSliders = cache(async (): Promise<HomepageSlider[]> => {
  const { data } = await (await supabase())
    .from("homepage_sliders")
    .select("*")
    .eq("is_active", true)
    .order("sort");
  return (data ?? []) as HomepageSlider[];
});

export const getHomepageSections = cache(async (): Promise<HomepageSection[]> => {
  const { data } = await (await supabase())
    .from("homepage_sections")
    .select("*")
    .order("sort");
  return (data ?? []) as HomepageSection[];
});

export const getMarqueeMessages = cache(async (): Promise<MarqueeMessage[]> => {
  const { data } = await (await supabase())
    .from("marquee_messages")
    .select("*")
    .eq("is_active", true)
    .order("sort");
  return (data ?? []) as MarqueeMessage[];
});

export const getCompanyInfo = cache(async (): Promise<CompanyInfo | null> => {
  const { data } = await (await supabase()).from("company_info").select("*").eq("id", 1).single();
  return (data as CompanyInfo) ?? null;
});

export const getTeamMembers = cache(async (): Promise<TeamMember[]> => {
  const { data } = await (await supabase())
    .from("team_members")
    .select("*")
    .eq("is_active", true)
    .order("sort");
  return (data ?? []) as TeamMember[];
});

export const getStatistics = cache(async (): Promise<Statistic[]> => {
  const { data } = await (await supabase()).from("statistics").select("*").order("sort");
  return (data ?? []) as Statistic[];
});

export const getSocialLinks = cache(async (): Promise<SocialLink[]> => {
  const { data } = await (await supabase())
    .from("social_links")
    .select("*")
    .eq("is_active", true)
    .order("sort");
  return (data ?? []) as SocialLink[];
});

export const getArticles = cache(async (): Promise<Article[]> => {
  const { data } = await (await supabase())
    .from("articles")
    .select("*, author:users(*), category:article_categories(*), tags:article_tag_relations(article_tags(*))")
    .eq("status", "published")
    .is("deleted_at", null)
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false });
  return (data ?? []) as Article[];
});

export const getArticleBySlug = cache(async (slug: string): Promise<Article | null> => {
  const { data } = await (await supabase())
    .from("articles")
    .select("*, author:users(*), category:article_categories(*), tags:article_tag_relations(article_tags(*))")
    .eq("slug", slug)
    .eq("status", "published")
    .is("deleted_at", null)
    .single();
  return (data as Article) ?? null;
});

export const getArticleCategories = cache(async () => {
  const { data } = await (await supabase())
    .from("article_categories")
    .select("*")
    .order("sort");
  return (data ?? []) as { id: string; name_ar: string; name_en: string; slug: string; sort: number }[];
});

// Resolve the effective page-hero background: page custom → global → fallback.
export const getPageHeroSettings = cache(async (pageKey: string): Promise<PageHeroSettings | null> => {
  try {
    const { data: page } = await (await supabase())
      .from("page_hero_settings")
      .select("*")
      .eq("page_key", pageKey)
      .maybeSingle();

    if (page?.background_image || page?.background_gif) {
      return page as PageHeroSettings;
    }

    const { data: global } = await (await supabase())
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

export const getPageBySlug = cache(async (slug: string): Promise<Page | null> => {
  try {
    const { data } = await (await supabase())
      .from("pages")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    return (data as Page) ?? null;
  } catch {
    return null;
  }
});

// ── Offers ────────────────────────────────────────────────────────────────
export const getOffers = cache(async (): Promise<Offer[]> => {
  const { data } = await (await supabase())
    .from("offers")
    .select("*")
    .eq("status", "published")
    .is("deleted_at", null)
    .order("sort")
    .order("created_at");
  return (data ?? []) as Offer[];
});

export const getOfferBySlug = cache(async (slug: string): Promise<Offer | null> => {
  const { data } = await (await supabase())
    .from("offers")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .is("deleted_at", null)
    .single();
  return (data as Offer) ?? null;
});

export const getOfferDetails = cache(
  async (slug: string) => {
    const offer = await getOfferBySlug(slug);
    if (!offer) return null;
    const [
      { data: images },
      { data: stages },
      { data: included },
      { data: features },
      { data: groups },
      { data: addons },
      { data: packages },
    ] = await Promise.all([
      (await supabase()).from("offer_images").select("*").eq("offer_id", offer.id).order("sort"),
      (await supabase()).from("offer_stages").select("*").eq("offer_id", offer.id).order("sort"),
      (await supabase()).from("offer_included_items").select("*").eq("offer_id", offer.id).order("sort"),
      (await supabase()).from("offer_features").select("*").eq("offer_id", offer.id).order("sort"),
      (await supabase()).from("offer_option_groups").select("*").eq("offer_id", offer.id).order("sort"),
      (await supabase()).from("offer_addons").select("*").eq("offer_id", offer.id).order("sort"),
      (await supabase()).from("offer_packages").select("*").eq("offer_id", offer.id).order("sort"),
    ]);

    const groupIds = (groups ?? []).map((g: { id: string }) => g.id);
    const { data: values } = groupIds.length
      ? await (await supabase()).from("offer_option_values").select("*").in("option_id", groupIds).order("sort")
      : { data: [] };

    return {
      offer,
      images: (images ?? []) as { id: string; url: string; alt: string | null; sort: number }[],
      stages: (stages ?? []) as OfferStage[],
      included: (included ?? []) as OfferIncludedItem[],
      features: (features ?? []) as OfferFeature[],
      optionGroups: (groups ?? []) as OfferOptionGroup[],
      optionValues: (values ?? []) as OfferOptionValue[],
      addons: (addons ?? []) as OfferAddon[],
      packages: (packages ?? []) as OfferPackage[],
    };
  },
);

// ── Achievements ───────────────────────────────────────────────────────────
export const getAchievements = cache(async (): Promise<Achievement[]> => {
  const { data } = await (await supabase())
    .from("achievements")
    .select("*")
    .eq("status_field", "published")
    .is("deleted_at", null)
    .order("sort")
    .order("created_at");
  return (data ?? []) as Achievement[];
});

export const getAchievementBySlug = cache(async (slug: string): Promise<Achievement | null> => {
  const { data } = await (await supabase())
    .from("achievements")
    .select("*")
    .eq("slug", slug)
    .eq("status_field", "published")
    .is("deleted_at", null)
    .single();
  return (data as Achievement) ?? null;
});

export const getAchievementDetails = cache(async (slug: string) => {
  const achievement = await getAchievementBySlug(slug);
  if (!achievement) return null;
  const [{ data: images }, { data: features }] = await Promise.all([
    (await supabase()).from("achievement_images").select("*").eq("achievement_id", achievement.id).order("sort"),
    (await supabase()).from("achievement_features").select("*").eq("achievement_id", achievement.id).order("sort"),
  ]);
  return {
    achievement,
    images: (images ?? []) as AchievementImage[],
    features: (features ?? []) as AchievementFeature[],
  };
});

// ── Dynamic forms ─────────────────────────────────────────────────────────
export const getDynamicFormById = cache(async (id: string): Promise<DynamicForm | null> => {
  const { data } = await (await supabase())
    .from("dynamic_forms")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .single();
  return (data as DynamicForm) ?? null;
});

export const getDynamicFormFields = cache(async (formId: string): Promise<DynamicFormField[]> => {
  const { data } = await (await supabase())
    .from("dynamic_form_fields")
    .select("*")
    .eq("form_id", formId)
    .eq("enabled", true)
    .order("sort");
  return (data ?? []) as DynamicFormField[];
});

export const getDynamicFormOptions = cache(async (formId: string): Promise<DynamicFormOption[]> => {
  const { data: fields } = await (await supabase()).from("dynamic_form_fields").select("id").eq("form_id", formId);
  const fieldIds = (fields ?? []).map((f: { id: string }) => f.id);
  if (!fieldIds.length) return [];
  const { data } = await (await supabase())
    .from("dynamic_form_options")
    .select("*")
    .in("field_id", fieldIds)
    .eq("enabled", true)
    .order("sort");
  return (data ?? []) as DynamicFormOption[];
});

export const getDynamicFormRules = cache(async (formId: string): Promise<DynamicFormRule[]> => {
  const { data } = await (await supabase())
    .from("dynamic_form_rules")
    .select("*")
    .eq("form_id", formId)
    .order("sort");
  return (data ?? []) as DynamicFormRule[];
});
