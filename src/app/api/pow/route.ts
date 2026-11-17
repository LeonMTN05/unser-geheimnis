import { NextRequest, NextResponse } from "next/server";
import { createChallenge } from "@/server/pow";
import { consume, getAppSecret, getClientIp } from "@/server/security";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!getAppSecret()) {
    return NextResponse.json({ error: "Service nicht konfiguriert." }, { status: 503 });
  }
  const ip = getClientIp(req);
  if (!(await consume("powIssue", ip))) {
    return NextResponse.json({ error: "Zu viele Anfragen. Bitte später erneut versuchen." }, { status: 429 });
  }
  return NextResponse.json(await createChallenge(ip));
}
