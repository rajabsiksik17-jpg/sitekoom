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
}, 5 * 60_000).unref?.();
