"use client";

import { useState } from "react";
import { ExternalLink, FileText, Download, MapPin, Play, X } from "lucide-react";
import { socialIcon } from "@/components/social-icons";
import { localize } from "@/lib/utils";
import { portfolioTypeLabel } from "@/lib/portfolio";
import { WebsiteScreenshot, VideoGallery } from "@/components/portfolio-media";
import type { PortfolioItem } from "@/lib/types";
import { cn } from "@/lib/utils";

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

const btnStyles: Record<string, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  outline: "border border-brand-300 text-brand-700 hover:bg-brand-50",
  ghost: "text-brand-700 hover:bg-brand-50",
};

function CtaButton({ item, locale, icon }: { item: PortfolioItem; locale: "ar" | "en"; icon?: React.ReactNode }) {
  const label = localize(locale, item.button_text_ar, item.button_text_en) || item.title_ar || portfolioTypeLabel(item.type, locale);
  const href = item.url ?? "#";
  const isDownload = item.button_action === "download";
  return (
    <a
      href={href}
      target={item.button_action === "new_tab" || isDownload || item.type !== "pdf" ? "_blank" : undefined}
      rel="noopener noreferrer"
      download={isDownload || undefined}
      className={cn("inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold", btnStyles[item.button_style ?? "primary"] ?? "btn-primary")}
    >
      {icon ?? <ExternalLink className="h-4 w-4" />}
      {label}
    </a>
  );
}

const IMAGE_TYPES = ["image", "gallery", "screenshots", "device_screenshots"];

export function ProjectPortfolio({ items, locale }: { items: PortfolioItem[]; locale: "ar" | "en" }) {
  const [lightbox, setLightbox] = useState<{ urls: string[]; index: number } | null>(null);
  const visible = items.filter((i) => i.is_visible);

  const groups: { type: string; items: PortfolioItem[] }[] = [];
  for (const it of visible) {
    const g = groups.find((x) => x.type === it.type);
    if (g) g.items.push(it);
    else groups.push({ type: it.type, items: [it] });
  }

  return (
    <div className="space-y-12">
      {groups.map((group) => {
        const title = localize(locale, group.items[0]?.title_ar, group.items[0]?.title_en);
        const isImage = IMAGE_TYPES.includes(group.type);

        return (
          <div key={group.type}>
            {group.type === "heading" || group.type === "text_block" ? (
              <div className="space-y-6">
                {group.items.map((h) => (
                  <div key={h.id} className={group.type === "heading" ? "text-center" : ""}>
                    {localize(locale, h.title_ar, h.title_en) && (
                      <h3 className="mb-2 text-xl font-bold text-ink-900">{localize(locale, h.title_ar, h.title_en)}</h3>
                    )}
                    {localize(locale, h.description_ar, h.description_en) && (
                      <div className="prose-site" dangerouslySetInnerHTML={{ __html: localize(locale, h.description_ar, h.description_en) ?? "" }} />
                    )}
                  </div>
                ))}
              </div>
            ) : isImage ? (
              <div className={cn("grid gap-4", group.items.length === 1 ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-3")}>
                {group.items.filter((i) => i.url).map((img) => {
                  const urls = group.items.filter((i) => i.url).map((i) => i.url!);
                  return (
                    <button key={img.id} type="button" onClick={() => setLightbox({ urls, index: urls.indexOf(img.url!) })} className="group relative overflow-hidden rounded-xl border border-brand-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url!} alt={localize(locale, img.alt_ar, img.alt_en) || localize(locale, img.title_ar, img.title_en) || ""} loading="lazy" className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      {(img.title_ar || img.caption_ar || img.caption_en) && (
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-900/80 to-transparent p-3 text-start">
                          <p className="text-sm font-semibold text-white">{localize(locale, img.title_ar, img.title_en) || localize(locale, img.caption_ar, img.caption_en)}</p>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : group.type === "website_screenshot" ? (
              <div className="space-y-6">
                {group.items.map((img) => <WebsiteScreenshot key={img.id} item={img} locale={locale} />)}
              </div>
            ) : group.type === "video" ? (
              <div className="grid gap-6 sm:grid-cols-2">
                {group.items.map((v) => {
                  const id = youtubeId(v.url ?? "");
                  return (
                    <div key={v.id} className="card overflow-hidden">
                      <div className="relative aspect-video w-full overflow-hidden bg-ink-900">
                        {id ? (
                          <iframe src={`https://www.youtube.com/embed/${id}?rel=0`} title={localize(locale, v.title_ar, v.title_en)} className="absolute inset-0 h-full w-full border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen loading="lazy" />
                        ) : v.url ? (
                          <video src={v.url} controls preload="none" className="h-full w-full" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-sm text-white">—</div>
                        )}
                      </div>
                      {(v.title_ar || v.description_ar) && (
                        <div className="p-4">
                          {localize(locale, v.title_ar, v.title_en) && <p className="font-bold text-ink-900">{localize(locale, v.title_ar, v.title_en)}</p>}
                          {localize(locale, v.description_ar, v.description_en) && <p className="mt-1 text-sm text-gray-500">{localize(locale, v.description_ar, v.description_en)}</p>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : group.type === "video_gallery" ? (
              <VideoGallery items={group.items} locale={locale} />
            ) : group.type === "pdf" ? (
              <div className="flex flex-wrap gap-3">
                {group.items.map((f) => <CtaButton key={f.id} item={f} locale={locale} icon={<FileText className="h-4 w-4" />} />)}
              </div>
            ) : group.type === "file" ? (
              <div className="flex flex-wrap gap-3">
                {group.items.map((f) => <CtaButton key={f.id} item={f} locale={locale} icon={<Download className="h-4 w-4" />} />)}
              </div>
            ) : ["external_link", "website_url", "google_play", "app_store"].includes(group.type) ? (
              <div className="flex flex-wrap gap-3">
                {group.items.map((l) => <CtaButton key={l.id} item={l} locale={locale} />)}
              </div>
            ) : group.type === "social_links" ? (
              <div className="flex flex-wrap gap-3">
                {group.items.map((s) => {
                  const Icon = socialIcon(s.platform ?? "");
                  return (
                    <a key={s.id} href={s.url ?? "#"} target="_blank" rel="noopener noreferrer" className="flex h-11 w-11 items-center justify-center rounded-full border border-brand-200/70 bg-brand-50 text-brand-700 transition-all hover:scale-105 hover:bg-brand-600 hover:text-white">
                      <Icon className="h-5 w-5" />
                    </a>
                  );
                })}
              </div>
            ) : group.type === "location" ? (
              <div className="flex flex-wrap gap-3">
                {group.items.map((m) => (
                  <a key={m.id} href={m.url ?? "#"} target="_blank" rel="noopener noreferrer" className="card flex items-center gap-3 p-4">
                    <MapPin className="h-5 w-5 text-brand-600" />
                    <div>
                      <p className="font-semibold text-ink-900">{localize(locale, m.title_ar, m.title_en)}</p>
                      {m.description_ar && <p className="text-sm text-gray-500">{localize(locale, m.description_ar, m.description_en)}</p>}
                    </div>
                  </a>
                ))}
              </div>
            ) : group.type === "audio" ? (
              <div className="space-y-4">
                {group.items.map((a) => (
                  <div key={a.id} className="card p-4">
                    <p className="mb-2 font-semibold text-ink-900">{localize(locale, a.title_ar, a.title_en)}</p>
                    <audio controls src={a.url ?? undefined} className="w-full" />
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}

      {lightbox && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink-900/90 p-4" onClick={() => setLightbox(null)}>
          <button type="button" className="absolute end-4 top-4 rounded-full bg-white/10 p-2 text-white" onClick={() => setLightbox(null)}><X className="h-6 w-6" /></button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox.urls[lightbox.index]} alt="" className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
