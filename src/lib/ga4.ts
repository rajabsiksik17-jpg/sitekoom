import "server-only";

import { createSign } from "crypto";

const CLIENT_EMAIL = process.env.GA4_CLIENT_EMAIL ?? "";
const PRIVATE_KEY = (process.env.GA4_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function signJwt(claims: Record<string, unknown>, privateKey: string): string {
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64url(JSON.stringify(claims));
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${payload}`);
  const signature = signer.sign(privateKey).toString("base64url");
  return `${header}.${payload}.${signature}`;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string | null> {
  if (!CLIENT_EMAIL || !PRIVATE_KEY) return null;
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.token;

  const now = Math.floor(Date.now() / 1000);
  const assertion = signJwt(
    {
      iss: CLIENT_EMAIL,
      scope: "https://www.googleapis.com/auth/analytics.readonly",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    },
    PRIVATE_KEY,
  );

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${encodeURIComponent(assertion)}`,
  });
  if (!res.ok) return null;
  const data = await res.json();
  cachedToken = { token: data.access_token, expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000 };
  return data.access_token as string;
}

interface Metric {
  name: string;
}
interface Dimension {
  name: string;
}

async function runReport(
  propertyId: string,
  params: { startDate: string; endDate: string; metrics: Metric[]; dimensions?: Dimension[]; limit?: number; orderBy?: { dimension?: { dimensionName: string }; metric?: { metricName: string }; desc: boolean }[] },
): Promise<{ rows: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }[] } | null> {
  const token = await getAccessToken();
  if (!token) return null;
  try {
    const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        dateRanges: [{ startDate: params.startDate, endDate: params.endDate }],
        metrics: params.metrics,
        dimensions: params.dimensions ?? [],
        limit: params.limit,
        orderBys: params.orderBy,
      }),
    });
    if (!res.ok) return null;
    return (await res.json()) as { rows: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }[] };
  } catch {
    return null;
  }
}

export interface Ga4Summary {
  totalUsers: number;
  newUsers: number;
  sessions: number;
  pageViews: number;
  avgSessionDuration: number;
  bounceRate: number;
  timeSeries: { date: string; sessions: number; pageViews: number }[];
  topPages: { path: string; views: number }[];
  devices: { device: string; sessions: number }[];
  countries: { country: string; sessions: number }[];
  sources: { source: string; sessions: number }[];
}

function num(v: string | undefined): number {
  const n = Number(v ?? "0");
  return isNaN(n) ? 0 : n;
}

export async function fetchGa4Summary(propertyId: string, startDate: string, endDate: string): Promise<Ga4Summary | null> {
  if (!propertyId) return null;
  if (!CLIENT_EMAIL || !PRIVATE_KEY) return null;

  const [summary, timeSeries, topPages, devices, countries, sources] = await Promise.all([
    runReport(propertyId, {
      startDate,
      endDate,
      metrics: [
        { name: "totalUsers" },
        { name: "newUsers" },
        { name: "sessions" },
        { name: "screenPageViews" },
        { name: "averageSessionDuration" },
        { name: "bounceRate" },
      ],
    }),
    runReport(propertyId, {
      startDate,
      endDate,
      metrics: [{ name: "sessions" }, { name: "screenPageViews" }],
      dimensions: [{ name: "date" }],
      orderBy: [{ dimension: { dimensionName: "date" }, desc: false }],
    }),
    runReport(propertyId, {
      startDate,
      endDate,
      metrics: [{ name: "screenPageViews" }],
      dimensions: [{ name: "pagePath" }],
      limit: 10,
      orderBy: [{ metric: { metricName: "screenPageViews" }, desc: true }],
    }),
    runReport(propertyId, {
      startDate,
      endDate,
      metrics: [{ name: "sessions" }],
      dimensions: [{ name: "deviceCategory" }],
    }),
    runReport(propertyId, {
      startDate,
      endDate,
      metrics: [{ name: "sessions" }],
      dimensions: [{ name: "country" }],
      limit: 10,
      orderBy: [{ metric: { metricName: "sessions" }, desc: true }],
    }),
    runReport(propertyId, {
      startDate,
      endDate,
      metrics: [{ name: "sessions" }],
      dimensions: [{ name: "sessionDefaultChannelGroup" }],
    }),
  ]);

  if (!summary || summary.rows.length === 0) return null;
  const row = summary.rows[0];
  const m = row.metricValues.map((v) => v.value);

  return {
    totalUsers: num(m[0]),
    newUsers: num(m[1]),
    sessions: num(m[2]),
    pageViews: num(m[3]),
    avgSessionDuration: num(m[4]),
    bounceRate: num(m[5]),
    timeSeries: (timeSeries?.rows ?? []).map((r) => ({
      date: r.dimensionValues[0]?.value ?? "",
      sessions: num(r.metricValues[0]?.value),
      pageViews: num(r.metricValues[1]?.value),
    })),
    topPages: (topPages?.rows ?? []).map((r) => ({ path: r.dimensionValues[0]?.value ?? "", views: num(r.metricValues[0]?.value) })),
    devices: (devices?.rows ?? []).map((r) => ({ device: r.dimensionValues[0]?.value ?? "", sessions: num(r.metricValues[0]?.value) })),
    countries: (countries?.rows ?? []).map((r) => ({ country: r.dimensionValues[0]?.value ?? "", sessions: num(r.metricValues[0]?.value) })),
    sources: (sources?.rows ?? []).map((r) => ({ source: r.dimensionValues[0]?.value ?? "", sessions: num(r.metricValues[0]?.value) })),
  };
}
