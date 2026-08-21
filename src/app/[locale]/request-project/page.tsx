import { PageHero } from "@/components/page-hero";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ProjectRequestForm } from "@/components/project-request-form";
import { ar, en } from "@/lib/i18n/dictionaries";
import { getServices } from "@/lib/queries";

export default async function RequestProjectPage({
  params,
  searchParams,
}: {
  params: { locale: "ar" | "en" };
  searchParams: { service?: string };
}) {
  const locale = params.locale;
  const dict = locale === "ar" ? ar : en;

  const services = await getServices();
  let initialServiceId: string | undefined;
  if (searchParams.service) {
    const svc = services.find((s) => s.slug === searchParams.service);
    if (svc) initialServiceId = svc.id;
  }

  return (
    <>
      <PageHero title={dict.quote.title} subtitle={dict.quote.subtitle} pageKey="request-project" />
      <div className="container-site py-12">
        <Breadcrumbs locale={locale} items={[{ name: dict.nav.requestProject, path: "/request-project" }]} />
        <div className="mx-auto max-w-3xl">
          <div className="card p-8">
            <ProjectRequestForm services={services} initialServiceId={initialServiceId} />
          </div>
        </div>
      </div>
    </>
  );
}
