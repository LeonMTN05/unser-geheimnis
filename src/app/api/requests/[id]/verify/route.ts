import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { verifyRequestSchema } from "@/lib/requestValidation";
import { consume, getClientIp, safeEqualHex } from "@/server/security";
import {
  MAX_VERIFY_ATTEMPTS, REQUEST_ID_PATTERN, hashVerifyCode, hashVerifyToken, sendInvite,
} from "@/server/requests";

export const dynamic = "force-dynamic";

const err = (error: string, status: number) => NextResponse.json({ error }, { status });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!REQUEST_ID_PATTERN.test(id)) return err("Anfrage nicht gefunden.", 404);
    if (!(await consume("verifyIp", getClientIp(req)))) return err("Zu viele Versuche. Bitte später erneut versuchen.", 429);

    const parsed = verifyRequestSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return err("Bitte den 6-stelligen Code eingeben.", 400);

    const r = await prisma.dataRequest.findUnique({ where: { id } });
    if (!r) return err("Anfrage nicht gefunden oder abgelaufen.", 404);
    if (r.status !== "PENDING_VERIFICATION") {
      return NextResponse.json({ ok: true, alreadyVerified: true, invited: !!r.inviteSentAt });
    }
    if (!r.verifyExpiresAt || r.verifyExpiresAt < new Date() || r.verifyAttempts >= MAX_VERIFY_ATTEMPTS) {
      return err("Der Code ist abgelaufen oder wurde zu oft falsch eingegeben. Bitte erstelle eine neue Anfrage.", 410);
    }

    const ok = "code" in parsed.data
      ? safeEqualHex(hashVerifyCode(id, parsed.data.code), r.verifyCodeHash!)
      : safeEqualHex(hashVerifyToken(id, parsed.data.token), r.verifyTokenHash!);

    if (!ok) {
      // Atomar hochzählen — parallele Rateversuche werden mitgezählt
      await prisma.dataRequest.updateMany({
        where: { id, status: "PENDING_VERIFICATION" },
        data: { verifyAttempts: { increment: 1 } },
      });
      const left = MAX_VERIFY_ATTEMPTS - r.verifyAttempts - 1;
      return err(left > 0 ? `Falscher Code. Noch ${left} Versuch${left === 1 ? "" : "e"}.` : "Falscher Code. Keine Versuche mehr übrig.", 400);
    }

    // Nur eine parallele Anfrage gewinnt den Statuswechsel → genau eine Einladung
    const claimed = await prisma.dataRequest.updateMany({
      where: { id, status: "PENDING_VERIFICATION" },
      data: { status: "OPEN", verifyTokenHash: null, verifyCodeHash: null, verifyExpiresAt: null },
    });
    if (claimed.count === 0) return NextResponse.json({ ok: true, alreadyVerified: true });

    try {
      const result = await sendInvite(r);
      return NextResponse.json({ ok: true, ...result });
    } catch (e) {
      console.error("[verify] Einladung fehlgeschlagen:", e);
      return NextResponse.json({ ok: true, invited: false, reason: "Die Einladung konnte nicht versendet werden." });
    }
  } catch (e) {
    console.error("POST verify Error:", e);
    return err("Interner Fehler.", 500);
  }
}
