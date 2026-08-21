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
  return { url, path };
}

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
export const MAX_IMAGE_SIZE = 8 * 1024 * 1024; // 8MB

export function validateImage(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return "نوع الملف غير مدعوم (JPG, PNG, WebP, GIF)";
  if (file.size > MAX_IMAGE_SIZE) return "حجم الملف يتجاوز 8 ميجابايت";
  return null;
}
