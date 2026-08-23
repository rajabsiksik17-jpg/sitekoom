import { ClientLoginLanding } from "@/components/client-login-landing";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function ClientLoginPage() {
  const settings = await getSettings();
  return <ClientLoginLanding settings={settings.general} />;
}
