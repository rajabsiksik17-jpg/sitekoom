import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser, hasPermission } from "@/lib/auth";

interface GoogleReviewItem {
  author_name?: string;
  profile_photo_url?: string;
  rating?: number;
  text?: string;
  time?: number;
  relative_time_description?: string;
  author_url?: string;
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "reviews.manage")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const admin = createAdminClient();

  const { data: integRow } = await admin.from("site_settings").select("value").eq("key", "integrations").single();
  const apiKey = (integRow?.value as { google_reviews_api_key?: string })?.google_reviews_api_key;
  if (!apiKey) return NextResponse.json({ error: "أضف Google Places API Key في التكاملات أولاً" }, { status: 400 });

  const { data: settingsRow } = await admin.from("site_settings").select("value").eq("key", "google_reviews").single();
  const placeId = (settingsRow?.value as { place_id?: string })?.place_id;
  if (!placeId) return NextResponse.json({ error: "أدخل Google Place ID في إعدادات التقييمات" }, { status: 400 });

  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=rating,user_ratings_total,reviews&key=${encodeURIComponent(apiKey)}&language=ar`;

  let payload: { status?: string; result?: { rating?: number; user_ratings_total?: number; reviews?: GoogleReviewItem[] } };
  try {
    const res = await fetch(url);
    payload = await res.json();
  } catch {
    return NextResponse.json({ error: "فشل الاتصال بـ Google API" }, { status: 500 });
  }

  if (payload.status !== "OK" || !payload.result) {
    return NextResponse.json({ error: `Google API: ${payload.status ?? "UNKNOWN"}` }, { status: 502 });
  }

  const result = payload.result;
  const reviews = (result.reviews ?? []).map((r) => ({
    author_name: r.author_name ?? "Google User",
    author_photo: r.profile_photo_url ?? null,
    rating: Number(r.rating ?? 5),
    text: r.text ?? null,
    review_date: r.relative_time_description ?? (r.time ? new Date(r.time * 1000).toISOString().slice(0, 10) : null),
    review_url: r.author_url ?? null,
  }));

  // Replace the cached set (this table is a cache of Google data).
  await admin.from("google_reviews").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (reviews.length) {
    await admin.from("google_reviews").insert(reviews.map((r, i) => ({ ...r, sort: i, is_active: true })));
  }

  await admin
    .from("site_settings")
    .update({ value: { ...(settingsRow?.value as object), rating: result.rating ?? 0, total: result.user_ratings_total ?? 0, last_updated: new Date().toISOString() } })
    .eq("key", "google_reviews");

  return NextResponse.json({ ok: true, count: reviews.length, rating: result.rating ?? 0, total: result.user_ratings_total ?? 0 });
}
