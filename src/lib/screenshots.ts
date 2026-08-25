import "server-only";

import { existsSync } from "node:fs";
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

// Common system browser locations. Used for local dev (Windows/macOS) and for
// normal Linux servers (e.g. Hostinger) where Chromium/Chrome is installed.
function candidateBrowserPaths(): string[] {
  if (process.platform === "win32") {
    return [
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
      "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    ];
  }
  if (process.platform === "darwin") {
    return [
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
      "/Applications/Chromium.app/Contents/MacOS/Chromium",
    ];
  }
  return [
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/microsoft-edge",
    "/snap/bin/chromium",
    "/usr/local/bin/chromium",
    "/usr/local/bin/google-chrome",
  ];
}

// Flags required to run a real Chromium in a container/limited Linux server.
function linuxFlags(): string[] {
  return ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"];
}

interface ResolvedChromium {
  executablePath: string;
  args: string[];
}

/**
 * Resolve a real Chromium executable, in priority order:
 *   1. CHROMIUM_EXECUTABLE_PATH (explicit override)
 *   2. System-installed Chrome/Edge/Chromium (local dev + Linux servers)
 *   3. Playwright-managed Chromium (npx playwright install chromium)
 * Throws a clear, actionable error if none is available.
 */
async function resolveChromium(): Promise<ResolvedChromium> {
  const explicit = process.env.CHROMIUM_EXECUTABLE_PATH?.trim();
  if (explicit) {
    if (existsSync(explicit)) {
      return { executablePath: explicit, args: process.platform === "linux" ? linuxFlags() : [] };
    }
    throw new Error(`CHROMIUM_EXECUTABLE_PATH يشير إلى مسار غير موجود: ${explicit}`);
  }

  const system = candidateBrowserPaths().find((p) => existsSync(p));
  if (system) {
    return { executablePath: system, args: process.platform === "linux" ? linuxFlags() : [] };
  }

  try {
    const { chromium } = await import("playwright");
    const pwPath = chromium.executablePath();
    if (pwPath && existsSync(pwPath)) {
      return { executablePath: pwPath, args: process.platform === "linux" ? linuxFlags() : [] };
    }
  } catch {
    /* playwright not resolvable — ignore */
  }

  throw new Error(
    "لم يتم العثور على متصفح Chromium على الخادم. قم بتثبيت Chromium (مثال: npx playwright install chromium) أو اضبط CHROMIUM_EXECUTABLE_PATH.",
  );
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

  const { executablePath, args } = await resolveChromium();
  const { chromium } = await import("playwright");

  const browser = await chromium.launch({ executablePath, args, headless: true });

  const images: Partial<Record<DeviceKey, string>> = {};
  const errors: Partial<Record<DeviceKey, string>> = {};

  try {
    for (const device of DEVICES) {
      try {
        const buffer = await captureDevice(browser, url, device.width, device.height);
        images[device.key] = await uploadScreenshot(buffer, device.key);
      } catch (e) {
        const message = e instanceof Error ? e.message : "خطأ غير معروف";
        console.error(`[screenshots] تعذر إنشاء Screenshot لـ ${device.key} (${url}):`, message);
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
