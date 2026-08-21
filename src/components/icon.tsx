import {
  Globe,
  ShoppingCart,
  Code2,
  Smartphone,
  LayoutDashboard,
  Store,
  Users,
  Settings,
  Puzzle,
  ShieldCheck,
  Zap,
  TrendingUp,
  Search,
  Award,
  Layers,
  FolderCheck,
  Smile,
  Sparkles,
  Rocket,
  HeartHandshake,
  Target,
  Eye,
  Lightbulb,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";

const map: Record<string, LucideIcon> = {
  globe: Globe,
  "shopping-cart": ShoppingCart,
  code: Code2,
  smartphone: Smartphone,
  "layout-dashboard": LayoutDashboard,
  store: Store,
  users: Users,
  settings: Settings,
  puzzle: Puzzle,
  "shield-check": ShieldCheck,
  zap: Zap,
  "trending-up": TrendingUp,
  search: Search,
  award: Award,
  layers: Layers,
  "folder-check": FolderCheck,
  smile: Smile,
  sparkles: Sparkles,
  rocket: Rocket,
  "heart-handshake": HeartHandshake,
  target: Target,
  eye: Eye,
  lightbulb: Lightbulb,
  "check-circle": CheckCircle2,
};

export const ICON_NAMES = Object.keys(map);

export function Icon({ name, className }: { name?: string | null; className?: string }) {
  const Cmp = (name && map[name.toLowerCase()]) || Sparkles;
  return <Cmp className={className} />;
}
