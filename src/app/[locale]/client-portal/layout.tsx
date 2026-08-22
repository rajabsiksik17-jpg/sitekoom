import { getCurrentClient, getUnreadCount } from "@/lib/client-data";
import { PortalShell } from "@/components/client-portal/shell";

export const dynamic = "force-dynamic";

export default async function ClientPortalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: "ar" | "en" };
}) {
  const locale = params.locale;
  const client = await getCurrentClient(locale);
  const unread = await getUnreadCount(client.id);

  return (
    <PortalShell locale={locale} name={client.name} company={client.company} unread={unread}>
      {children}
    </PortalShell>
  );
}
