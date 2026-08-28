"use client";

import { createClient } from "@/lib/supabase/client";

export function getPublicUrl(bucket: string, path: string): string {
  const supabase = createClient();
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

/**
 * Upload a file to a Supabase Storage bucket and return its public URL.
 * File must pass client-side validation (type + size) before calling.
 */
export async function uploadFile(
  bucket: "media" | "avatars",
  file: File,
  folder = "general",
): Promise<{ url: string; path: string }> {
  const supabase = createClient();

  // Content hash so identical files are never uploaded twice.
  let hash: string | null = null;
  try {
    const buf = await file.arrayBuffer();
    const digest = await crypto.subtle.digest("SHA-256", buf);
    hash = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    hash = null;
  }

  if (hash) {
    const { data: existing } = await supabase.from("media").select("url").eq("hash", hash).limit(1);
    if (existing && existing.length) {
      return { url: existing[0].url, path: existing[0].url };
    }
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const safeBase = file.name
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .slice(0, 60);
  const path = `${folder}/${Date.now()}-${safeBase}.${ext}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw new Error(error.message);

  const url = supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;

  if (hash) {
    await supabase.from("media").insert({
      url,
      name: file.name,
      mime_type: file.type,
      size: file.size,
      folder,
      hash,
      storage_path: `${bucket}/${path}`,
    });
  }

  return { url, path };
}

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
export const MAX_IMAGE_SIZE = 8 * 1024 * 1024; // 8MB

export function validateImage(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return "نوع الملف غير مدعوم (JPG, PNG, WebP, GIF)";
  if (file.size > MAX_IMAGE_SIZE) return "حجم الملف يتجاوز 8 ميجابايت";
  return null;
}

export const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime", "video/x-m4v"];
export const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

export function validateVideo(file: File): string | null {
  if (!ALLOWED_VIDEO_TYPES.includes(file.type)) return "نوع الفيديو غير مدعوم (MP4, WebM, MOV)";
  if (file.size > MAX_VIDEO_SIZE) return "حجم الفيديو يتجاوز 100 ميجابايت";
  return null;
}
