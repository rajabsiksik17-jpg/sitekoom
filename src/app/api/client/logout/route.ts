import { NextResponse } from "next/server";
import { clearClientSessionCookie } from "@/lib/client-auth";

export async function POST() {
  clearClientSessionCookie();
  return NextResponse.json({ ok: true });
}
