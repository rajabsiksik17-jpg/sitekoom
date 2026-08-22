import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { checkDueRenewals } from "@/lib/renewals";

export const dynamic = "force-dynamic";

export async function POST() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "clients.manage")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const result = await checkDueRenewals();
  return NextResponse.json(result);
}
