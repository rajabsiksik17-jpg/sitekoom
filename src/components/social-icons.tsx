import {
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  Music2,
  Ghost,
  MessageCircle,
  Send,
  Github,
  Globe,
  Twitter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SocialLink } from "@/lib/types";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  facebook: Facebook,
  instagram: Instagram,
  linkedin: Linkedin,
  youtube: Youtube,
  tiktok: Music2,
  snapchat: Ghost,
  whatsapp: MessageCircle,
  telegram: Send,
  github: Github,
  x: Twitter,
  twitter: Twitter,
};

export function socialIcon(platform: string) {
  return iconMap[platform.toLowerCase()] ?? Globe;
}

export function SocialIcons({
  social,
  size = "h-8 w-8",
  variant = "light",
  showLabel = false,
}: {
  social: SocialLink[];
  size?: string;
  variant?: "light" | "dark";
  showLabel?: boolean;
}) {
  return (
    <>
      {social.map((s) => {
        const Icon = socialIcon(s.platform);
        const dark = variant === "dark";
        return (
          <a
            key={s.id}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={s.label ?? s.platform}
            className={cn(
              "flex items-center gap-2 rounded-lg transition-colors",
              showLabel ? "px-3 py-2" : size,
              dark
                ? "bg-brand-50 text-brand-700 hover:bg-brand-600 hover:text-white"
                : "bg-white/10 text-white/70 hover:bg-brand-600 hover:text-white",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {showLabel && <span className="text-sm font-medium">{s.label ?? s.platform}</span>}
          </a>
        );
      })}
    </>
  );
}
