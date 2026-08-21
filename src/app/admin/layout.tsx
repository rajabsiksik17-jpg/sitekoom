import { getCurrentUser } from "@/lib/auth";
import { Sidebar } from "@/components/admin/sidebar";
import { Topbar } from "@/components/admin/topbar";
import { ToastProvider } from "@/components/admin/toast";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  // Public auth pages (login, forgot-password, update-password) must render
  // without the admin shell and WITHOUT redirecting (otherwise /admin/login
  // redirects to itself). Protected pages enforce auth via their own page-level
  // guards (requireAdmin / requirePermission in admin-guard.ts).
  if (!user || user.status === "disabled") {
    return <>{children}</>;
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50">
        <Sidebar permissions={user.permissions} name={user.name || user.email || ""} email={user.email} />
        <div className="lg:ps-64">
          <Topbar />
          <main className="p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
