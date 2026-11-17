import { NextRequest, NextResponse } from "next/server";
import { createId } from "@paralleldrive/cuid2";
import { prisma } from "@/server/db";
import { createRequestSchema, containsLink } from "@/lib/requestValidation";
import { consume, getAppSecret, getClientIp, isBlocked, optOutUrl, siteUrl, underLimit } from "@/server/security";
import { verifySolution } from "@/server/pow";
import { mailEnabled, sendMail } from "@/server/mailer";
import { verificationMail } from "@/server/mailTemplates";
import {
  VERIFY_MINUTES, hashRetrievalToken, hashVerifyCode, hashVerifyToken, newCode, newToken,
} from "@/server/requests";

export const dynamic = "force-dynamic";

const err = (error: string, status: number) => NextResponse.json({ error }, { status });

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return err("Ungültige Eingabe.", 400);
    }

    const parsed = createRequestSchema.safeParse(body);
    if (!parsed.success) {
      const emailIssue = parsed.error.issues.some((i) => i.path[0] === "email");
      return err(emailIssue ? "Bitte gültige E-Mail-Adressen angeben." : "Ungültige Eingabe.", 400);
    }
    const data = parsed.data;

    // Honeypot: echte Nutzer sehen das Feld nicht
    if (data.website) return err("Ungültige Eingabe.", 400);

    const message = data.message || null;
    const requesterName = data.requesterName || null;
    const expiresAt = new Date(Date.now() + data.expiresIn * 3_600_000);
    const id = createId();
    const retrievalToken = newToken();

    // ── Ohne E-Mail: Links werden vom Anfragenden selbst geteilt ──
    if (!data.email) {
      if (!(await consume("create", ip))) return err("Zu viele Anfragen. Bitte später erneut versuchen.", 429);
      await prisma.dataRequest.create({
        data: {
          id, retrievalTokenHash: hashRetrievalToken(retrievalToken),
          publicKey: data.publicKey, message, requesterName, status: "OPEN", expiresAt,
        },
      });
      return NextResponse.json({ id, retrievalToken, expiresAt: expiresAt.toISOString(), status: "OPEN" });
    }

    // ── Mit E-Mail: Double-Opt-in des Anfragenden ──
    if (!mailEnabled() || !getAppSecret()) return err("Der E-Mail-Versand ist derzeit nicht verfügbar.", 503);

    const { sender, recipient } = data.email;
    if (sender === recipient) return err("Absender und Empfänger dürfen nicht identisch sein.", 400);
    if ((message && containsLink(message)) || (requesterName && containsLink(requesterName))) {
      return err("Aus Sicherheitsgründen sind Links, Domains und E-Mail-Adressen in Name und Nachricht nicht erlaubt, wenn per E-Mail versendet wird.", 400);
    }
    // Bot-Indiz: Formular in unter 2 Sekunden ausgefüllt
    if (typeof data.elapsedMs === "number" && data.elapsedMs < 2000) return err("Bitte versuche es erneut.", 400);

    if (!(await verifySolution(data.pow, ip))) {
      return err("Sicherheitsprüfung fehlgeschlagen. Bitte lade die Seite neu und versuche es erneut.", 400);
    }

    if (await isBlocked(sender)) return err("Diese Absenderadresse hat E-Mails von uns abbestellt.", 403);
    if (await isBlocked(recipient)) return err("Der Empfänger möchte keine Datenanfragen per E-Mail erhalten.", 403);
    if (!(await underLimit("mailRecipient", recipient))) {
      return err("An diese Adresse wurden heute bereits zu viele Anfragen gesendet.", 429);
    }
    if (!(await consume("mailIp", ip)) || !(await consume("mailSender", sender))) {
      return err("Zu viele E-Mail-Anfragen. Bitte später erneut versuchen.", 429);
    }

    const token = newToken();
    const code = newCode();
    await prisma.dataRequest.create({
      data: {
        id, retrievalTokenHash: hashRetrievalToken(retrievalToken),
        publicKey: data.publicKey, message, requesterName, status: "PENDING_VERIFICATION", expiresAt,
        requesterEmail: sender, recipientEmail: recipient,
        verifyTokenHash: hashVerifyToken(id, token),
        verifyCodeHash: hashVerifyCode(id, code),
        verifyExpiresAt: new Date(Date.now() + VERIFY_MINUTES * 60_000),
      },
    });

    try {
      await sendMail(verificationMail({
        to: sender, recipient, code,
        verifyUrl: `${siteUrl()}/anfrage/bestaetigen?id=${id}&t=${token}`,
        validMinutes: VERIFY_MINUTES,
        optOutUrl: optOutUrl(sender),
      }));
    } catch (e) {
      console.error("[requests] Bestätigungsmail fehlgeschlagen:", e);
      await prisma.dataRequest.delete({ where: { id } }).catch(() => {});
      return err("Die Bestätigungs-E-Mail konnte nicht versendet werden. Bitte später erneut versuchen.", 502);
    }

    return NextResponse.json({
      id, retrievalToken, expiresAt: expiresAt.toISOString(), status: "PENDING_VERIFICATION",
    });
  } catch (e) {
    console.error("POST /api/requests Error:", e);
    return err("Interner Fehler.", 500);
  }
}
