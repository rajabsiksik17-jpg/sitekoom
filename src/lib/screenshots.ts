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

export interface CaptureResult {
  desktop: string;
  tablet: string;
  mobile: string;
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

// Locate a locally-installed Chromium/Chrome/Edge for local development.
function detectLocalBrowser(): string | null {
  const candidates =
    process.platform === "win32"
      ? [
          "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
          "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
          "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
          "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
        ]
      : process.platform === "darwin"
        ? [
            "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
            "/Applications/Chromium.app/Contents/MacOS/Chromium",
          ]
        : [
            "/usr/bin/google-chrome",
            "/usr/bin/chromium",
            "/usr/bin/chromium-browser",
            "/snap/bin/chromium",
          ];

  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return null;
}

// Resolve the Chromium executable + flags:
//  1. CHROMIUM_EXECUTABLE_PATH (explicit override)
//  2. local dev (IS_LOCAL / next dev) → detect an installed browser
//  3. production/serverless → @sparticuz/chromium (Linux binary)
async function resolveChromium(): Promise<{ executablePath?: string; args: string[] }> {
  const explicit = process.env.CHROMIUM_EXECUTABLE_PATH;
  if (explicit) return { executablePath: explicit, args: [] };

  const isLocal = process.env.IS_LOCAL === "1" || process.env.NODE_ENV === "development";
  if (isLocal) {
    const local = detectLocalBrowser();
    if (local) return { executablePath: local, args: [] };
    throw new Error(
      "لم يتم العثور على متصفح محلي. ثبّت Chrome/Edge أو اضبط CHROMIUM_EXECUTABLE_PATH.",
    );
  }

  const chromium = (await import("@sparticuz/chromium")).default;
  return { executablePath: await chromium.executablePath(), args: chromium.args };
}

// Scroll through the whole page (down then back up) to force lazy-loaded
// images/content to load before capturing the full page.
async function scrollThrough(page: import("playwright-core").Page) {
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
  // Scroll back up so the full-page capture starts from a clean state.
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
  browser: import("playwright-core").Browser,
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
    // Wait for images to finish decoding where possible.
    await page
      .evaluate(async () => {
        await Promise.all(
          Array.from(document.images).map((img) => img.decode().catch(() => {})),
        );
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

/** Capture full-page Desktop/Tablet/Mobile screenshots and upload them to storage. */
export async function captureScreenshots(rawUrl: string): Promise<CaptureResult> {
  const url = normalizeUrl(rawUrl);
  if (!url) throw new Error("رابط الموقع غير صالح");

  const { executablePath, args } = await resolveChromium();
  const { chromium } = await import("playwright-core");

  const browser = await chromium.launch({ executablePath, args, headless: true });
  try {
    const [desktop, tablet, mobile] = await Promise.all([
      captureDevice(browser, url, DEVICES[0].width, DEVICES[0].height),
      captureDevice(browser, url, DEVICES[1].width, DEVICES[1].height),
      captureDevice(browser, url, DEVICES[2].width, DEVICES[2].height),
    ]);

    const [desktopUrl, tabletUrl, mobileUrl] = await Promise.all([
      uploadScreenshot(desktop, "desktop"),
      uploadScreenshot(tablet, "tablet"),
      uploadScreenshot(mobile, "mobile"),
    ]);

    return { desktop: desktopUrl, tablet: tabletUrl, mobile: mobileUrl };
  } finally {
    await browser.close();
  }
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
