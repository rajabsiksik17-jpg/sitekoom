import { PageHero } from "@/components/page-hero";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ProjectRequestForm } from "@/components/project-request-form";
import { ar, en } from "@/lib/i18n/dictionaries";
import { getServices, getServiceCategories } from "@/lib/queries";

export default async function RequestProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ service?: string }>;
}) {
  const locale = (await params).locale as "ar" | "en";
  const dict = locale === "ar" ? ar : en;

  const [services, categories, sp] = await Promise.all([getServices(), getServiceCategories(), searchParams]);
  let initialServiceId: string | undefined;
  if (sp.service) {
    const svc = services.find((s) => s.slug === sp.service);
    if (svc) initialServiceId = svc.id;
  }

  return (
    <>
      <PageHero title={dict.quote.title} subtitle={dict.quote.subtitle} pageKey="request-project" />
      <div className="container-site py-12">
        <Breadcrumbs locale={locale} items={[{ name: dict.nav.requestProject, path: "/request-project" }]} />
        <div className="mx-auto max-w-3xl">
          <div className="card p-8">
            <ProjectRequestForm services={services} categories={categories} initialServiceId={initialServiceId} />
          </div>
        </div>
      </div>
    </>
  );
}
