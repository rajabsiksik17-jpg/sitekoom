import "server-only";

import { accessSync, constants, existsSync } from "node:fs";
import { createAdminClient } from "@/lib/supabase/admin";

// Real, per-device viewports. Each device is opened and captured separately —
// the page is NOT captured once and then resized.
const DEVICES = [
  { key: "desktop", width: 1440, height: 900 },
  { key: "tablet", width: 768, height: 1024 },
  { key: "mobile", width: 390, height: 844 },
] as const;

export type DeviceKey = (typeof DEVICES)[number]["key"];

export interface CaptureResult {
  images: Partial<Record<DeviceKey, string>>;
  errors: Partial<Record<DeviceKey, string>>;
}

function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const u = new URL(withProto);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.toString();
  } catch {
    return null;
  }
}

// Scroll through the whole page (down then back up) to force lazy-loaded
// images/content to load before capturing the full page.
async function scrollThrough(page: import("playwright").Page) {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let y = 0;
      const step = 450;
      const timer = setInterval(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        if (y >= max) {
          clearInterval(timer);
          resolve();
          return;
        }
        y = Math.min(y + step, max);
        window.scrollTo(0, y);
      }, 120);
    });
  });
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let y = document.documentElement.scrollHeight;
      const step = 600;
      const timer = setInterval(() => {
        y -= step;
        window.scrollTo(0, Math.max(0, y));
        if (y <= 0) {
          clearInterval(timer);
          resolve();
        }
      }, 60);
    });
  });
  await page.waitForTimeout(600);
}

async function captureDevice(
  browser: import("playwright").Browser,
  url: string,
  width: number,
  height: number,
): Promise<Buffer> {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
  });
  try {
    const page = await context.newPage();
    await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
    await scrollThrough(page);
    await page
      .evaluate(async () => {
        await Promise.all(Array.from(document.images).map((img) => img.decode().catch(() => {})));
      })
      .catch(() => {});
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
    return await page.screenshot({ fullPage: true, type: "png" });
  } finally {
    await context.close();
  }
}

async function uploadScreenshot(buffer: Buffer, name: string): Promise<string> {
  const admin = createAdminClient();
  const path = `projects/screenshot-${name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
  const { error } = await admin.storage.from("media").upload(path, buffer, {
    contentType: "image/png",
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw new Error(error.message);
  return admin.storage.from("media").getPublicUrl(path).data.publicUrl;
}

/**
 * Capture full-page Desktop/Tablet/Mobile screenshots and upload them to storage.
 * Each device is captured independently: if one fails, the others still succeed
 * and the failure is reported per-device (never a cryptic technical error).
 */
export async function captureScreenshots(rawUrl: string): Promise<CaptureResult> {
  const url = normalizeUrl(rawUrl);
  if (!url) throw new Error("رابط الموقع غير صالح");

  // Resolve the Chromium executable — do NOT use a hardcoded path. Prefer an
  // explicit override only when it actually exists; otherwise trust Playwright.
  const { chromium } = await import("playwright");
  const configuredPath = process.env.CHROMIUM_EXECUTABLE_PATH?.trim();
  const playwrightPath = chromium.executablePath();
  const executablePath =
    configuredPath && existsSync(configuredPath) ? configuredPath : playwrightPath;

  // Temporary diagnostic logging (see server logs on the Hostinger side).
  console.log("[SCREENSHOT DEBUG] Node:", process.version);
  console.log("[SCREENSHOT DEBUG] CWD:", process.cwd());
  console.log("[SCREENSHOT DEBUG] PATH:", process.env.PATH ?? "");
  console.log("[SCREENSHOT DEBUG] PLAYWRIGHT_BROWSERS_PATH:", process.env.PLAYWRIGHT_BROWSERS_PATH ?? "");
  console.log("[SCREENSHOT DEBUG] CHROMIUM_EXECUTABLE_PATH:", configuredPath ?? "");
  console.log("[SCREENSHOT DEBUG] resolvedExecutablePath:", executablePath);
  console.log("[SCREENSHOT DEBUG] exists:", existsSync(executablePath));
  try {
    accessSync(executablePath, constants.X_OK);
    console.log("[SCREENSHOT DEBUG] executable: true");
  } catch (e) {
    console.log("[SCREENSHOT DEBUG] executable: false", e instanceof Error ? e.message : String(e));
  }

  if (!existsSync(executablePath)) {
    throw new Error(`لم يتم العثور على Chromium في المسار: ${executablePath}`);
  }

  let browser: import("playwright").Browser;
  try {
    browser = await chromium.launch({ executablePath, headless: true });
  } catch (e) {
    console.error(
      "[SCREENSHOT DEBUG] launchError:",
      e instanceof Error ? (e.stack ?? e.message) : String(e),
    );
    throw new Error("تعذر تشغيل Chromium. راجع Server Logs للتفاصيل.");
  }

  const images: Partial<Record<DeviceKey, string>> = {};
  const errors: Partial<Record<DeviceKey, string>> = {};

  try {
    for (const device of DEVICES) {
      try {
        const buffer = await captureDevice(browser, url, device.width, device.height);
        images[device.key] = await uploadScreenshot(buffer, device.key);
      } catch (e) {
        const message = e instanceof Error ? e.message : "خطأ غير معروف";
        console.error(
          `[SCREENSHOT DEBUG] تعذر إنشاء Screenshot لـ ${device.key} (${url}):`,
          e instanceof Error ? (e.stack ?? e.message) : String(e),
        );
        errors[device.key] = message;
      }
    }
  } finally {
    await browser.close();
  }

  if (Object.keys(images).length === 0) {
    const detail = Object.entries(errors)
      .map(([k, v]) => `${k}: ${v}`)
      .join(" | ");
    throw new Error(detail ? `تعذر إنشاء أي Screenshot. ${detail}` : "تعذر إنشاء أي Screenshot.");
  }

  return { images, errors };
}

/** Extract the storage path from a public media URL so old files can be removed. */
export function storagePathFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const marker = "/storage/v1/object/public/media/";
    const idx = u.pathname.indexOf(marker);
    if (idx === -1) return null;
    return decodeURIComponent(u.pathname.slice(idx + marker.length));
  } catch {
    return null;
  }
}
