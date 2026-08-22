import { getCurrentClient } from "@/lib/client-data";
import { SupportChat } from "@/components/client-portal/support-chat";
import { SectionTitle } from "@/components/client-portal/bits";

export const dynamic = "force-dynamic";

export default async function ClientSupportPage({ params }: { params: { locale: "ar" | "en" } }) {
  const locale = params.locale;
  await getCurrentClient(locale);
  const t = (ar: string, en: string) => (locale === "ar" ? ar : en);

  return (
    <div className="mx-auto max-w-2xl">
      <SectionTitle>{t("الدعم الفني", "Technical Support")}</SectionTitle>
      <SupportChat locale={locale} />
      <p className="mt-4 text-center text-xs text-gray-400">
        {t("محادثتك مرتبطة بحسابك المسجل، وسيتم إعطاؤها أولوية أعلى.", "Your chat is linked to your registered account and given higher priority.")}
      </p>
    </div>
  );
}
