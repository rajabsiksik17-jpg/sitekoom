import { PageHero } from "@/components/page-hero";
import { ClientLogin } from "@/components/client-login";
import { ar, en } from "@/lib/i18n/dictionaries";

export default function ClientLoginPage({ params }: { params: { locale: "ar" | "en" } }) {
  const dict = params.locale === "ar" ? ar : en;
  return (
    <>
      <PageHero title={dict.nav.clientLogin} pageKey="client-login" />
      <ClientLogin />
    </>
  );
}
