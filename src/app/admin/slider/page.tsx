import { requirePermission } from "@/lib/admin-guard";
import { SliderManager } from "@/components/admin/slider-manager";

export default async function AdminSliderPage() {
  await requirePermission("homepage.view");
  return <SliderManager />;
}
