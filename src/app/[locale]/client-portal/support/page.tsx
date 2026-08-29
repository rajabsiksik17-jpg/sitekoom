import { getCurrentClient } from "@/lib/client-data";
import { getSupportReasons } from "@/lib/support-reasons";
import { SupportChat } from "@/components/client-portal/support-chat";
import { SectionTitle } from "@/components/client-portal/bits";

export const dynamic = "force-dynamic";

export default async function ClientSupportPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = (await params).locale as "ar" | "en";
  await getCurrentClient(locale);
  const reasons = await getSupportReasons();
  const options = reasons.map((r) => ({ value: r.value, label: locale === "ar" ? r.ar : r.en }));
  const t = (ar: string, en: string) => (locale === "ar" ? ar : en);

  return (
    <div className="mx-auto max-w-2xl">
      <SectionTitle>{t("الدعم الفني", "Technical Support")}</SectionTitle>
      <SupportChat locale={locale} reasons={options} />
      <p className="mt-4 text-center text-xs text-gray-400">
        {t("محادثتك مرتبطة بحسابك المسجل، وسيتم إعطاؤها أولوية أعلى.", "Your chat is linked to your registered account and given higher priority.")}
      </p>
    </div>
  );
}
