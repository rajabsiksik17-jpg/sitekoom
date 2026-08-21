import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <ShieldAlert className="h-16 w-16 text-red-400" />
      <h1 className="mt-4 text-2xl font-extrabold text-ink-900">غير مصرح لك بالوصول</h1>
      <p className="mt-2 text-gray-500">لا تملك الصلاحية للوصول إلى هذه الصفحة.</p>
      <Link href="/admin" className="btn-primary mt-6 px-6 py-3">العودة للوحة التحكم</Link>
    </div>
  );
}
