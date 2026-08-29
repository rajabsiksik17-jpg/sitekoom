import LegalPage from "@/components/legal";

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const resolved = (await params) as { locale: "ar" | "en" };
  return <LegalPage params={resolved} kind="privacy" />;
}
