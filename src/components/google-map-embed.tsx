import { ExternalLink } from "lucide-react";
import { toEmbedSrc } from "@/lib/maps";

/**
 * Responsive, validated Google Maps embed. Uses the embed URL (or derives one
 * from a plain Google Maps link). A short link (maps.app.goo.gl) is never used
 * as an iframe source — it is rendered as an "open in maps" link instead.
 */
export function GoogleMapEmbed({
  embedUrl,
  linkUrl,
  title,
  className,
}: {
  embedUrl?: string | null;
  linkUrl?: string | null;
  title?: string;
  className?: string;
}) {
  const src = toEmbedSrc(embedUrl) ?? toEmbedSrc(linkUrl);

  if (!src) {
    if (!linkUrl) return null;
    return (
      <a
        href={linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center justify-center gap-2 rounded-2xl border border-brand-100 bg-brand-50/50 px-5 py-4 text-sm font-semibold text-brand-700 hover:bg-brand-50 ${className ?? ""}`}
      >
        <ExternalLink className="h-4 w-4" />
        {title ?? "Google Maps"}
      </a>
    );
  }

  return (
    <div className={`overflow-hidden rounded-2xl border border-brand-100 ${className ?? ""}`}>
      <iframe
        title={title ?? "Google Maps"}
        src={src}
        className="block h-72 w-full border-0 sm:h-80 lg:h-96"
        style={{ minHeight: 288 }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
    </div>
  );
}
