import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";

const eventSchema = z.object({
  event_type: z.string().min(1).max(60),
  entity_type: z.string().max(50).optional().nullable(),
  entity_id: z.string().max(100).optional().nullable(),
  page_path: z.string().max(500).optional().nullable(),
  referrer: z.string().max(500).optional().nullable(),
  utm_source: z.string().max(100).optional().nullable(),
  utm_medium: z.string().max(100).optional().nullable(),
  utm_campaign: z.string().max(100).optional().nullable(),
  device_type: z.string().max(20).optional().nullable(),
  session_id: z.string().max(100).optional().nullable(),
});

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Accept a single event body directly (keeps the client simple).
const requestSchema = z.object({
  event: eventSchema.optional(),
  events: z.array(eventSchema).max(50).optional(),
});

export async function POST(request: NextRequest) {
  // Abuse guard: anonymous analytics is a shared endpoint — rate limit by IP.
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = rateLimit(`analytics:${ip}`, 60, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ ok: false }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });
  }

  let body: z.infer<typeof requestSchema>;
  try {
    body = requestSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const events = body.events ?? (body.event ? [body.event] : []);
  if (events.length === 0) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const admin = createAdminClient();
  // entity_id column is uuid; drop values that aren't valid UUIDs so a stray
  // non-uuid entity_id can never fail the whole insert.
  const safeEvents = events.map((e) => ({
    ...e,
    entity_id: e.entity_id && UUID_RE.test(e.entity_id) ? e.entity_id : null,
  }));
  const { error } = await admin.from("analytics_events").insert(safeEvents);
  return NextResponse.json({ ok: !error });
}
