import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { optOutSignature, safeEqualHex } from "@/server/security";

export const dynamic = "force-dynamic";

/**
 * Abmeldung von Datenanfragen. Signiert, damit niemand fremde Adressen sperrt.
 */
export async function POST(req: NextRequest) {
  let e = req.nextUrl.searchParams.get("e") || "";
  let s = req.nextUrl.searchParams.get("s") || "";
  if (!e && req.headers.get("content-type")?.includes("application/json")) {
    const body = await req.json().catch(() => ({}));
    e = String(body?.e || "");
    s = String(body?.s || "");
  }
  if (!/^[0-9a-f]{64}$/.test(e) || !/^[0-9a-f]{32}$/.test(s) || !safeEqualHex(optOutSignature(e), s)) {
    return NextResponse.json({ error: "Ungültiger Abmelde-Link." }, { status: 400 });
  }
  await prisma.mailBlock.upsert({ where: { emailHash: e }, create: { emailHash: e }, update: {} });
  return NextResponse.json({ ok: true });
}
