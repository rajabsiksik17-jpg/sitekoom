import { getCurrentClient, getUnreadCount } from "@/lib/client-data";
import { PortalShell } from "@/components/client-portal/shell";
import { ClientRealtimeRefresher } from "@/components/client-portal/realtime-refresher";

export const dynamic = "force-dynamic";

export default async function ClientPortalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const locale = (await params).locale as "ar" | "en";
  const client = await getCurrentClient(locale);
  const unread = await getUnreadCount(client.id);

  return (
    <>
      <PortalShell locale={locale} name={client.name} company={client.company} unread={unread}>
        {children}
      </PortalShell>
      <ClientRealtimeRefresher clientId={client.id} />
    </>
  );
}
