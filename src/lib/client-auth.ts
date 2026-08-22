import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const SECRET = process.env.AUTH_SECRET ?? "sitekoom-insecure-secret-change-me";
const SESSION_COOKIE = "sitekoom_client_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

function sign(data: string): string {
  return createHmac("sha256", SECRET).update(data).digest("base64url");
}

export function createClientSession(clientId: string): string {
  const payload = `${clientId}.${Date.now()}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyClientSession(token: string | undefined | null): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [clientId, ts, sig] = parts;
  const expected = sign(`${clientId}.${ts}`);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  if (Date.now() - Number(ts) > SESSION_TTL_SECONDS * 1000) return null;
  return clientId;
}

export function setClientSessionCookie(token: string) {
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearClientSessionCookie() {
  cookies().set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export function getClientSession(): string | null {
  const token = cookies().get(SESSION_COOKIE)?.value;
  return verifyClientSession(token);
}

// --- Pending client authentication (used during the OTP step) -------------

const PENDING_COOKIE = "sitekoom_client_pending";
const PENDING_TTL_SECONDS = 10 * 60; // 10 minutes to complete OTP

export function setPendingClientCookie(clientId: string) {
  const payload = `${clientId}.${Date.now()}`;
  const token = `${payload}.${sign(payload)}`;
  cookies().set(PENDING_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: PENDING_TTL_SECONDS,
  });
}

export function getPendingClientId(): string | null {
  const token = cookies().get(PENDING_COOKIE)?.value;
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [clientId, ts, sig] = parts;
  const expected = sign(`${clientId}.${ts}`);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  if (Date.now() - Number(ts) > PENDING_TTL_SECONDS * 1000) return null;
  return clientId;
}

export function clearPendingClientCookie() {
  cookies().set(PENDING_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

// One-time SSO token (single use, short-lived, signed, bound to client + url).
export function createSsoToken(clientId: string, adminUrl: string): { token: string; expiresAt: number } {
  const expiresAt = Date.now() + 60_000; // 1 minute
  const payload = `${clientId}.${expiresAt}.${adminUrl}`;
  const token = `${payload}.${sign(payload)}`;
  return { token, expiresAt };
}

export function verifySsoToken(token: string): { clientId: string; adminUrl: string } | null {
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [clientId, expiresAt, adminUrl, sig] = parts;
  const expected = sign(`${clientId}.${expiresAt}.${adminUrl}`);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  if (Date.now() > Number(expiresAt)) return null;
  return { clientId, adminUrl };
}
