import * as path from "path";
import { randomBytes, randomInt } from "crypto";
import type { DataRequest } from "@prisma/client";
import { prisma } from "./db";
import { secureDelete } from "./storage";
import { sendMail } from "./mailer";
import { invitationMail } from "./mailTemplates";
import { consume, hmac, isBlocked, optOutUrl, siteUrl } from "./security";

export const UPLOAD_DIR = process.env.UPLOAD_DIR || "./data/secrets";
export const VERIFY_MINUTES = 30;
export const MAX_VERIFY_ATTEMPTS = 5;

// cuid2-IDs: nur Kleinbuchstaben und Ziffern
export const REQUEST_ID_PATTERN = /^[a-z0-9]{20,32}$/;
export const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export const newToken = () => randomBytes(32).toString("base64url"); // 43 Zeichen
export const newCode = () => String(randomInt(0, 1_000_000)).padStart(6, "0");

export const hashVerifyToken = (id: string, token: string) => hmac("verify-token", `${id}:${token}`);
export const hashVerifyCode = (id: string, code: string) => hmac("verify-code", `${id}:${code}`);
// Abruf-Token hat 256 Bit Entropie → einfacher SHA-256 reicht (kein APP_SECRET nötig)
export { sha256 as hashRetrievalToken } from "./security";

export const requestUrl = (id: string) => `${siteUrl()}/r/${id}`;

export function responseFilePath(name: string) {
  return path.join(/*turbopackIgnore: true*/ UPLOAD_DIR, name);
}

export async function deleteRequest(r: Pick<DataRequest, "id" | "responseFile">) {
  if (r.responseFile) await secureDelete(responseFilePath(r.responseFile));
  await prisma.dataRequest.delete({ where: { id: r.id } }).catch(() => {});
}

export type InviteResult = { invited: true } | { invited: false; reason: string };

/** Versendet die Einladung — mit allen Empfänger-Schutzprüfungen. */
export async function sendInvite(r: DataRequest): Promise<InviteResult> {
  if (!r.recipientEmail || !r.requesterEmail) return { invited: false, reason: "Keine Empfängeradresse." };

  if (await isBlocked(r.recipientEmail)) {
    return { invited: false, reason: "Der Empfänger möchte keine Datenanfragen per E-Mail erhalten." };
  }
  if (!(await consume("mailRecipient", r.recipientEmail))) {
    return { invited: false, reason: "An diese Adresse wurden heute bereits zu viele Anfragen gesendet." };
  }
  if (!(await consume("mailGlobal", "global"))) {
    return { invited: false, reason: "Der E-Mail-Versand ist vorübergehend ausgelastet." };
  }

  await sendMail(
    invitationMail({
      to: r.recipientEmail,
      requesterEmail: r.requesterEmail,
      requesterName: r.requesterName,
      message: r.message,
      requestUrl: requestUrl(r.id),
      expiresAt: r.expiresAt,
      optOutUrl: optOutUrl(r.recipientEmail),
    })
  );
  await prisma.dataRequest.update({ where: { id: r.id }, data: { inviteSentAt: new Date() } });
  return { invited: true };
}
