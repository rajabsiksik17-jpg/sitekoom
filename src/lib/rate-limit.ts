// Minimal in-memory rate limiter for serverless-style route handlers.
// For multi-instance deployments, replace with Redis/Upstash.

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, limit = 10, windowMs = 60_000): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }

  if (existing.count >= limit) {
    return { ok: false, retryAfter: Math.ceil((existing.resetAt - now) / 1000) };
  }

  existing.count += 1;
  return { ok: true, retryAfter: 0 };
}

// Best-effort cleanup to avoid unbounded growth.
setInterval(() => {
  const now = Date.now();
  for (const [key, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(key);
  }
  for (const [key, b] of blockedSources) {
    if (b <= now) blockedSources.delete(key);
  }
}, 5 * 60_000).unref?.();

// Global 24h blocks applied when a source abuses the same form.
const blockedSources = new Map<string, number>();

function sourceKey(ip: string, deviceId?: string | null): string {
  return deviceId && deviceId.trim() ? `${ip}:${deviceId.trim()}` : ip;
}

/**
 * Per-form submission limit (5/hour) with a 24h site-wide block on abuse.
 * The key combines IP + a browser/device identifier to reduce simple IP
 * rotation, while still being privacy-friendly (no heavy fingerprinting).
 */
export function formRateLimit(formKey: string, ip: string, deviceId?: string | null): { ok: boolean; retryAfter: number; blocked: boolean } {
  const source = sourceKey(ip, deviceId);
  const unblockAt = blockedSources.get(source);
  if (unblockAt && unblockAt > Date.now()) {
    return { ok: false, retryAfter: Math.ceil((unblockAt - Date.now()) / 1000), blocked: true };
  }
  const rl = rateLimit(`form:${formKey}:${source}`, 5, 60 * 60 * 1000);
  if (!rl.ok) {
    blockedSources.set(source, Date.now() + 24 * 60 * 60 * 1000);
    return { ok: false, retryAfter: 24 * 60 * 60, blocked: true };
  }
  return { ok: true, retryAfter: 0, blocked: false };
}

/** Live chat: max 5 conversations/hour, blocked for 1 hour only (not 24h). */
export function chatRateLimit(ip: string, deviceId?: string | null): { ok: boolean; retryAfter: number } {
  return rateLimit(`chat:${sourceKey(ip, deviceId)}`, 5, 60 * 60 * 1000);
}
