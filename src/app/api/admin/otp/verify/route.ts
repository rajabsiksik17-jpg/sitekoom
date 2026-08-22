import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { verifyAdminOtp } from "@/lib/otp";
import { trustAdminDevice } from "@/lib/trusted-devices";

const schema = z.object({ code: z.string().min(6).max(6), trust: z.boolean().optional() });

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const ok = await verifyAdminOtp(user.id, body.code);
  if (!ok) {
    return NextResponse.json({ error: "رمز التحقق غير صحيح أو منتهي." }, { status: 400 });
  }

  if (body.trust) {
    await trustAdminDevice(user.id, request.headers.get("user-agent"));
  }

  return NextResponse.json({ ok: true });
}
