/**
 * Google Maps helpers. We keep two separate values:
 *  - `google_maps_url`       → the share/link (e.g. maps.app.goo.gl) for "open in maps".
 *  - `google_maps_embed_url` → a valid Google Maps embed URL used as the <iframe> src.
 *
 * Short links (maps.app.goo.gl) are never used directly as an iframe source.
 */

export function isValidMapsEmbed(value: string | null | undefined): boolean {
  if (!value) return false;
  try {
    const u = new URL(value);
    if (u.protocol !== "https:") return false;
    const host = u.hostname.toLowerCase();
    if (host === "maps.app.goo.gl" || host === "goo.gl") return false;
    return host === "www.google.com" || host === "google.com" || host === "maps.google.com";
  } catch {
    return false;
  }
}

/**
 * Normalize a Google Maps URL into a usable iframe source.
 * Returns null when the input cannot be embedded safely.
 */
export function toEmbedSrc(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const u = new URL(value);
    if (u.hostname.toLowerCase() === "maps.app.goo.gl" || u.hostname.toLowerCase() === "goo.gl") {
      return null; // short links are links only, not embeds
    }
    if (!/google\.com$/.test(u.hostname.toLowerCase())) return null;

    if (u.pathname.startsWith("/maps/embed")) return u.toString();
    if (u.searchParams.has("output")) return u.toString();
    if (u.searchParams.has("pb")) return u.toString();

    // Plain maps link → derive the embed form.
    u.searchParams.set("output", "embed");
    return u.toString();
  } catch {
    return null;
  }
}
