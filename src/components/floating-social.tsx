"use client";

import { useState } from "react";
import { Share2, X } from "lucide-react";
import { Draggable } from "@/components/draggable";
import { socialIcon } from "@/components/social-icons";
import { useLocale } from "@/components/providers";
import type { SocialLink } from "@/lib/types";

export function FloatingSocial({ social }: { social: SocialLink[] }) {
  const { dict } = useLocale();
  const [open, setOpen] = useState(true);

  if (social.length === 0) return null;

  return (
    <Draggable storageKey="sitekoom_social_pos" defaultSide="left">
      <div className="relative flex flex-col items-end gap-2">
        {open && (
          <div className="absolute bottom-full end-0 mb-2 flex max-h-[60vh] flex-col gap-2 overflow-y-auto rounded-2xl border border-brand-100 bg-white/95 p-2 shadow-card backdrop-blur">
            {social.map((s) => {
              const Icon = socialIcon(s.platform);
              return (
                <a
                  key={s.id}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label ?? s.platform}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700 transition-all hover:bg-brand-600 hover:text-white"
                >
                  <Icon className="h-5 w-5" />
                </a>
              );
            })}
          </div>
        )}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-gradient text-white shadow-glow transition-transform hover:scale-105"
          aria-label={open ? dict.floating.hide : "Social media"}
        >
          {open ? <X className="h-5 w-5" /> : <Share2 className="h-5 w-5" />}
        </button>
      </div>
    </Draggable>
  );
}
