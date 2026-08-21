import LegalPage from "@/components/legal";

export default function TermsPage({ params }: { params: { locale: "ar" | "en" } }) {
  return <LegalPage params={params} kind="terms" />;
}
