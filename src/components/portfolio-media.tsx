"use client";

import { useRef, useState } from "react";
import { ZoomIn, ChevronLeft, ChevronRight, MousePointer2, X, Monitor, Tablet, Smartphone } from "lucide-react";
import { localize } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { PortfolioItem } from "@/lib/types";

function youtubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1);
    const v = u.searchParams.get("v");
    if (v) return v;
    if (u.pathname.startsWith("/embed/")) return u.pathname.slice(7);
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * Long full-page screenshot. On desktop it scrolls on hover; on touch devices
 * it toggles on tap. A zoom button opens a fullscreen lightbox.
 */
export function WebsiteScreenshot({ item, locale }: { item: PortfolioItem; locale: "ar" | "en" }) {
  const isAr = locale === "ar";
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [scrolled, setScrolled] = useState(false);
  const [zoom, setZoom] = useState(false);

  // Available devices: Desktop is always on (if it has an image); Tablet/Mobile
  // require both the enable flag and an actual image.
  const devices = [
    { key: "desktop" as const, label: isAr ? "كمبيوتر" : "Desktop", icon: Monitor, url: item.url },
    item.data?.enable_tablet !== false && item.data?.tablet_screenshot
      ? { key: "tablet" as const, label: isAr ? "تابلت" : "Tablet", icon: Tablet, url: String(item.data.tablet_screenshot) }
      : null,
    item.data?.enable_mobile !== false && item.data?.mobile_screenshot
      ? { key: "mobile" as const, label: isAr ? "هاتف" : "Mobile", icon: Smartphone, url: String(item.data.mobile_screenshot) }
      : null,
  ].filter(Boolean) as { key: "desktop" | "tablet" | "mobile"; label: string; icon: React.ComponentType<{ className?: string }>; url: string | null }[];

  const active = devices.find((d) => d.key === device) ?? devices[0];
  const scrollSpeed = Number(item.data?.scroll_speed ?? 8);

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-brand-100 px-4 py-2.5">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-brand-700">
          <MousePointer2 className="h-3.5 w-3.5" />
          {isAr ? "مرر المؤشر أو انقر على الصورة لمشاهدة الموقع بالكامل" : "Hover or tap the image to see the full website"}
        </span>
        <button type="button" onClick={() => setZoom(true)} className="flex items-center gap-1 rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-100">
          <ZoomIn className="h-3.5 w-3.5" /> {isAr ? "تكبير" : "Zoom"}
        </button>
      </div>

      {devices.length > 1 && (
        <div className="flex gap-1.5 border-b border-brand-100 bg-brand-50/40 px-3 py-2">
          {devices.map((d) => (
            <button
              key={d.key}
              type="button"
              onClick={() => { setDevice(d.key); setScrolled(false); }}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                active?.key === d.key ? "bg-brand-gradient text-white" : "text-brand-700 hover:bg-brand-100",
              )}
            >
              <d.icon className="h-4 w-4" />
              {d.label}
            </button>
          ))}
        </div>
      )}

      <div
        className="group relative h-[440px] cursor-pointer overflow-hidden bg-ink-900"
        onClick={() => setScrolled((v) => !v)}
        onMouseEnter={() => setScrolled(true)}
        onMouseLeave={() => setScrolled(false)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={active?.url ?? ""}
          alt={localize(locale, item.alt_ar, item.alt_en) || localize(locale, item.title_ar, item.title_en) || ""}
          loading="lazy"
          className="w-full transition-transform ease-linear"
          style={{ transform: scrolled ? "translateY(calc(-100% + 440px))" : "translateY(0)", transitionDuration: scrolled ? `${scrollSpeed}s` : "1.5s" }}
        />
      </div>
      {(item.title_ar || item.caption_ar || item.caption_en) && (
        <p className="px-4 py-2.5 text-sm font-semibold text-ink-900">{localize(locale, item.title_ar, item.title_en) || localize(locale, item.caption_ar, item.caption_en)}</p>
      )}

      {zoom && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink-900/95 p-3" onClick={() => setZoom(false)}>
          <button type="button" className="absolute end-4 top-4 rounded-full bg-white/10 p-2 text-white" onClick={() => setZoom(false)}><X className="h-6 w-6" /></button>
          <div className="h-full w-full overflow-auto rounded-xl" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={active?.url ?? ""} alt="" className="mx-auto min-w-full" />
          </div>
        </div>
      )}
    </div>
  );
}

/** Modern horizontal video gallery (touch swipe + arrows). */
export function VideoGallery({ items, locale }: { items: PortfolioItem[]; locale: "ar" | "en" }) {
  const isAr = locale === "ar";
  const trackRef = useRef<HTMLDivElement>(null);

  function scroll(dir: -1 | 1) {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * (el.clientWidth * 0.8), behavior: "smooth" });
  }

  return (
    <div className="relative">
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => scroll(isAr ? 1 : -1)} className="z-10 flex h-9 w-9 items-center justify-center rounded-full border border-brand-200 bg-white text-brand-700 shadow-sm hover:bg-brand-50">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button type="button" onClick={() => scroll(isAr ? -1 : 1)} className="z-10 flex h-9 w-9 items-center justify-center rounded-full border border-brand-200 bg-white text-brand-700 shadow-sm hover:bg-brand-50">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div ref={trackRef} dir={isAr ? "rtl" : "ltr"} className="mt-3 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
        {items.map((v) => {
          const id = youtubeId(v.url ?? "");
          return (
            <div key={v.id} className="w-[85%] shrink-0 snap-center sm:w-[48%] lg:w-[32%]">
              <div className="card overflow-hidden">
                <div className="relative aspect-video w-full overflow-hidden bg-ink-900">
                  {id ? (
                    <iframe src={`https://www.youtube.com/embed/${id}?rel=0`} title={localize(locale, v.title_ar, v.title_en)} className="absolute inset-0 h-full w-full border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen loading="lazy" />
                  ) : v.url ? (
                    <video src={v.url} controls preload="none" className="h-full w-full" />
                  ) : null}
                </div>
                {localize(locale, v.title_ar, v.title_en) && (
                  <p className="truncate px-4 py-2.5 text-sm font-semibold text-ink-900">{localize(locale, v.title_ar, v.title_en)}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
