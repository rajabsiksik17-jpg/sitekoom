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
              "flex items-center justify-center rounded-full border transition-all duration-200",
              showLabel ? "gap-2 px-4 py-2 text-sm font-medium" : "h-11 w-11",
              dark
                ? "border-brand-200/70 bg-brand-50 text-brand-700 shadow-sm hover:scale-105 hover:bg-brand-600 hover:text-white hover:shadow-glow"
                : "border-white/20 bg-white/10 text-white shadow-sm hover:scale-105 hover:bg-brand-600 hover:text-white",
            )}
          >
            <Icon className={cn("shrink-0", showLabel ? "h-4 w-4" : "h-5 w-5")} />
            {showLabel && <span>{s.label ?? s.platform}</span>}
          </a>
        );
      })}
    </>
  );
}
