import { requirePermission } from "@/lib/admin-guard";
import { AppointmentsManager } from "@/components/admin/appointments-manager";

export default async function AdminAppointmentsPage() {
  await requirePermission("appointments.view");
  return <AppointmentsManager />;
}
