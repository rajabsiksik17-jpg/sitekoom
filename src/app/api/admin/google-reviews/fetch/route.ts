import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser, hasPermission } from "@/lib/auth";

interface NewPlaceReview {
  rating?: number;
  text?: { text?: string };
  relativePublishTimeDescription?: string;
  publishTime?: string;
  authorAttribution?: { displayName?: string; photoUri?: string; uri?: string };
}

interface NewPlacesResponse {
  id?: string;
  displayName?: { text?: string };
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  reviews?: NewPlaceReview[];
  error?: { code?: number; message?: string; status?: string };
}

const FIELD_MASK = "id,displayName,rating,userRatingCount,reviews,googleMapsUri";

function normalizePlaceId(raw: string): string | null {
  const v = (raw ?? "").trim();
  if (!v) return null;
  let id = v;
  if (id.startsWith("places/")) id = id.slice("places/".length);
  // Reject values that are clearly URLs, CIDs in link form, or contain spaces.
  if (/\s/.test(id) || id.includes("http") || id.includes("/") || id.includes("?") || id.includes("=")) return null;
  return id;
}

export async function POST(request: NextRequest) {
  // Wrap the entire handler so we ALWAYS return JSON (never an HTML error page).
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "reviews.manage")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const admin = createAdminClient();

    const { data: integRow } = await admin.from("site_settings").select("value").eq("key", "integrations").single();
    const apiKey = (integRow?.value as { google_reviews_api_key?: string })?.google_reviews_api_key ?? "";
    const hasKey = Boolean(apiKey.trim());

    const { data: settingsRow } = await admin.from("site_settings").select("value").eq("key", "google_reviews").single();
    const rawPlaceId = (settingsRow?.value as { place_id?: string })?.place_id ?? "";

    const placeId = normalizePlaceId(rawPlaceId);

    console.log("[google-reviews] fetch start", {
      hasApiKey: hasKey,
      hasPlaceId: Boolean(rawPlaceId.trim()),
      placeId: placeId ?? null,
    });

    if (!hasKey) {
      return NextResponse.json(
        { success: false, error: "Google Places API Key مفقود", details: "أضف المفتاح في لوحة التحكم (الإعدادات → Google Places API Key)." },
        { status: 400 },
      );
    }
    if (!placeId) {
      return NextResponse.json(
        { success: false, error: "Google Place ID غير صالح", details: "أدخل Place ID حقيقيًا (يبدأ عادة بـ ChIJ…) وليس رابط Maps أو CID." },
        { status: 400 },
      );
    }

    const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`;

    let httpStatus = 0;
    let contentType = "";
    let text = "";
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": FIELD_MASK,
          "Content-Type": "application/json",
        },
      });
      httpStatus = res.status;
      contentType = res.headers.get("content-type") ?? "";
      text = await res.text();
    } catch (e) {
      console.error("[google-reviews] network error", e);
      return NextResponse.json(
        { success: false, error: "فشل الاتصال بـ Google API", details: e instanceof Error ? e.message : "network error" },
        { status: 502 },
      );
    }

    console.log("[google-reviews] google response", { httpStatus, contentType });

    let payload: NewPlacesResponse | null = null;
    try {
      payload = JSON.parse(text) as NewPlacesResponse;
    } catch {
      console.error("[google-reviews] non-JSON response", text.slice(0, 500));
      return NextResponse.json(
        { success: false, error: "استجابة غير متوقعة من Google", details: `HTTP ${httpStatus}, content-type: ${contentType || "none"}` },
        { status: 502 },
      );
    }

    if (!payload || !payload.id) {
      console.error("[google-reviews] google error body", payload);
      return NextResponse.json(
        {
          success: false,
          error: payload?.error?.message ?? "لم يتم العثور على النشاط (Place ID غير صحيح)",
          details: `HTTP ${httpStatus} — ${payload?.error?.status ?? "NOT_FOUND"}`,
        },
        { status: httpStatus >= 400 && httpStatus < 500 ? 400 : 502 },
      );
    }

    const reviews = (payload.reviews ?? []).map((r, i) => ({
      author_name: r.authorAttribution?.displayName ?? "Google User",
      author_photo: r.authorAttribution?.photoUri ?? null,
      rating: Number(r.rating ?? 5),
      text_ar: r.text?.text ?? null,
      text_en: null,
      language: "ar",
      review_date: r.relativePublishTimeDescription ?? (r.publishTime ? r.publishTime.slice(0, 10) : null),
      review_url: r.authorAttribution?.uri ?? payload.googleMapsUri ?? null,
      sort: i,
      is_active: true,
    }));

    // Replace the cached set (this table is a cache of Google data).
    await admin.from("google_reviews").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (reviews.length) {
      await admin.from("google_reviews").insert(reviews);
    }

    const nextValue = {
      ...(settingsRow?.value as object),
      rating: payload.rating ?? 0,
      total: payload.userRatingCount ?? 0,
      last_updated: new Date().toISOString(),
      place_name: payload.displayName?.text ?? null,
      google_maps_uri: payload.googleMapsUri ?? null,
    };
    await admin.from("site_settings").update({ value: nextValue }).eq("key", "google_reviews");

    return NextResponse.json({
      success: true,
      data: {
        placeName: payload.displayName?.text ?? null,
        rating: payload.rating ?? 0,
        total: payload.userRatingCount ?? 0,
        reviewCount: reviews.length,
        googleMapsUri: payload.googleMapsUri ?? null,
        lastUpdated: nextValue.last_updated,
      },
    });
  } catch (e) {
    console.error("[google-reviews] unhandled error", e);
    return NextResponse.json(
      { success: false, error: "حدث خطأ غير متوقع", details: e instanceof Error ? e.message : "unknown" },
      { status: 500 },
    );
  }
}
