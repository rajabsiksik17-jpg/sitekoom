import LegalPage from "@/components/legal";

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const resolved = (await params) as { locale: "ar" | "en" };
  return <LegalPage params={resolved} kind="terms" />;
}
