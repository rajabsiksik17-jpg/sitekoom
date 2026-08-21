import LegalPage from "@/components/legal";

export default function PrivacyPage({ params }: { params: { locale: "ar" | "en" } }) {
  return <LegalPage params={params} kind="privacy" />;
}
