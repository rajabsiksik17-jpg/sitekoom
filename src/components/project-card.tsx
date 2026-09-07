"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Eye, RotateCcw } from "lucide-react";
import { useLocale } from "@/components/providers";
import { useLocalizedHref } from "@/lib/i18n/use-localized-href";
import { localize, cn } from "@/lib/utils";
import type { Project } from "@/lib/types";

export interface ProjectPreviewSettings {
  enabled: boolean;
  mode: "hover" | "button";
  hoverDelay: number; // seconds
  scrollSpeed: number; // px/s (mapped to animation duration)
  scrollSpeedDesktop?: number;
  scrollSpeedTablet?: number;
  scrollSpeedMobile?: number;
}

export function ProjectCard({
  project,
  defaultImage,
  preview,
}: {
  project: Project;
  defaultImage?: string;
  preview?: ProjectPreviewSettings;
}) {
  const { locale } = useLocale();
  const href = useLocalizedHref();
  const title = localize(locale, project.title_ar, project.title_en);
  const short = localize(locale, project.short_desc_ar, project.short_desc_en);
  const service = localize(locale, project.service?.title_ar, project.service?.title_en);
  const category = localize(locale, project.category?.name_ar, project.category?.name_en);
  const badge = service || category;

  const screenshot = project.screenshot || null;
  const previewOn = Boolean(preview?.enabled && screenshot);
  const mode = preview?.mode ?? "hover";
  const hoverDelayMs = (preview?.hoverDelay ?? 3) * 1000;

  // Per-device scroll speed (px/s) selected by viewport width; constant
  // regardless of the screenshot height.
  const currentScrollSpeed = useMemo(() => {
    if (typeof window === "undefined") return preview?.scrollSpeed ?? 240;
    const w = window.innerWidth;
    if (w < 640) return preview?.scrollSpeedMobile ?? preview?.scrollSpeed ?? 180;
    if (w < 1024) return preview?.scrollSpeedTablet ?? preview?.scrollSpeed ?? 160;
    return preview?.scrollSpeedDesktop ?? preview?.scrollSpeed ?? 140;
  }, [preview]);
  const scrollDuration = Math.max(4, Math.min(30, Math.round(1400 / currentScrollSpeed)));

  const reducedMotion = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerTypeRef = useRef<string>("mouse");

  const [previewing, setPreviewing] = useState(false);
  const [touchPreviewed, setTouchPreviewed] = useState(false);

  useEffect(() => {
    reducedMotion.current = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  function scheduleEnter() {
    if (!previewOn || mode !== "hover") return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setPreviewing(true), hoverDelayMs);
  }
  function cancelHover() {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (mode === "hover") setPreviewing(false);
  }

  // Event handlers (pointer-type aware)
  function onMediaPointerDown(e: React.PointerEvent) {
    pointerTypeRef.current = e.pointerType;
  }
  function onMediaClick(e: React.MouseEvent) {
    const isTouch = pointerTypeRef.current === "touch";
    if (!previewOn) return; // no preview → let Link navigate
    if (isTouch && !touchPreviewed) {
      // Mobile: first tap → preview (block navigation)
      e.preventDefault();
      e.stopPropagation();
      setTouchPreviewed(true);
      setPreviewing(true);
    }
    // else: navigate (desktop click, or mobile second tap)
  }

  function openPreview(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setPreviewing(true);
  }
  function closePreview(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setPreviewing(false);
    setTouchPreviewed(false);
  }

  return (
    <Link
      href={href(`/projects/${project.slug}`)}
      className="group card flex h-full flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-glow"
      onPointerEnter={scheduleEnter}
      onPointerLeave={cancelHover}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-brand-50" onPointerDown={onMediaPointerDown} onClick={onMediaClick}>
        {/* Base layer */}
        {project.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.service?.works_image || project.service?.main_image || project.thumbnail || defaultImage || ""}
            alt={title}
            loading="lazy"
            className={cn("absolute inset-0 h-full w-full object-cover transition-all duration-500", previewing ? "scale-105 opacity-0 blur-[2px]" : "opacity-100")}
          />
        ) : (
          <div className={cn("absolute inset-0 flex items-center justify-center bg-brand-gradient text-white transition-opacity duration-500", previewing ? "opacity-0" : "opacity-100")}>
            <ArrowUpRight className="h-10 w-10 opacity-50" />
          </div>
        )}

        {badge && (
          <span className={cn("absolute top-3 start-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-brand-700 backdrop-blur transition-opacity duration-300", previewing && "opacity-0")}>
            {badge}
          </span>
        )}

        {project.logo && (
          <span className={cn("absolute left-1/2 top-1/2 aspect-square w-[42.74%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full border-2 border-brand-300 bg-white/90 shadow-glow ring-4 ring-brand-500/10 backdrop-blur-md transition-all duration-500 group-hover:border-brand-400 group-hover:ring-brand-500/20 group-hover:scale-[1.03]", previewing && "scale-90 opacity-0")}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={project.logo} alt="" className="h-full w-full object-cover" />
          </span>
        )}

        {/* Website screenshot preview layer */}
        {previewOn && (
          <div className={cn("absolute inset-0 transition-opacity duration-500", previewing ? "opacity-100" : "pointer-events-none opacity-0")}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={screenshot!}
              alt={title}
              draggable={false}
              className="h-full w-full object-cover"
              style={previewing && !reducedMotion.current ? { animation: `preview-scroll ${scrollDuration}s ease-in-out infinite alternate`, objectFit: "cover" } : undefined}
            />
            {mode === "button" && (
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={closePreview}
                className="absolute top-3 end-3 inline-flex items-center gap-1.5 rounded-full border border-white/60 bg-white/90 px-3 py-1.5 text-xs font-semibold text-brand-700 shadow-soft backdrop-blur-md transition-colors hover:bg-white"
                aria-label="العودة"
              >
                <RotateCcw className="h-4 w-4" />
                {locale === "ar" ? "العودة" : "Back"}
              </button>
            )}
          </div>
        )}

        {/* Button-mode preview trigger */}
        {previewOn && mode === "button" && !previewing && (
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={openPreview}
            className="preview-pulse absolute bottom-3 end-3 inline-flex items-center gap-1.5 rounded-full border border-brand-300/70 bg-brand-gradient px-3 py-1.5 text-xs font-bold text-white shadow-glow transition-all duration-300 hover:opacity-90"
            aria-label="معاينة الموقع"
          >
            <Eye className="h-4 w-4" />
            {locale === "ar" ? "معاينة الموقع" : "Preview Website"}
          </button>
        )}

        {/* Hover hint (desktop only) */}
        {previewOn && mode === "hover" && !previewing && (
          <span className="pointer-events-none absolute bottom-3 start-3 hidden rounded-full border border-white/30 bg-ink-900/50 px-3 py-1 text-[10px] font-medium text-white/80 backdrop-blur-md lg:block">
            {locale === "ar" ? `مرر الفأرة ${preview?.hoverDelay ?? 3} ثوانٍ لمعاينة الموقع` : `Hover for ${preview?.hoverDelay ?? 3} seconds to preview`}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="text-lg font-bold text-ink-900 group-hover:text-brand-700">{title}</h3>
        {short && <p className="line-clamp-2 text-sm text-gray-600">{short}</p>}
      </div>
    </Link>
  );
}
