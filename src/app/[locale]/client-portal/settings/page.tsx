import { getCurrentClient } from "@/lib/client-data";
import { SectionTitle } from "@/components/client-portal/bits";
import { SettingsForm } from "@/components/client-portal/settings-form";

export const dynamic = "force-dynamic";

export default async function ClientSettingsPage({ params }: { params: { locale: "ar" | "en" } }) {
  const locale = params.locale;
  const client = await getCurrentClient(locale);
  const t = (ar: string, en: string) => (locale === "ar" ? ar : en);

  return (
    <div>
      <SectionTitle>{t("إعدادات الحساب", "Account Settings")}</SectionTitle>
      <SettingsForm locale={locale} initial={{ name: client.name, company: client.company, email: client.email, username: client.username }} />
    </div>
  );
}
