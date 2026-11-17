import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs/promises";
import { prisma } from "@/server/db";
import { consume, getClientIp } from "@/server/security";
import { secureDelete } from "@/server/storage";
import { TOKEN_PATTERN, hashRetrievalToken, responseFilePath } from "@/server/requests";

export const dynamic = "force-dynamic";

const NOT_FOUND = { error: "Anfrage nicht gefunden, abgelaufen oder bereits abgerufen." };

async function load(req: NextRequest, token: string) {
  if (!TOKEN_PATTERN.test(token)) return null;
  if (!(await consume("retrieve", getClientIp(req)))) return "limited" as const;
  const r = await prisma.dataRequest.findUnique({ where: { retrievalTokenHash: hashRetrievalToken(token) } });
  if (!r || r.expiresAt < new Date()) return null;
  return r;
}

/** Status für den Anfragenden — ohne die Antwort zu verbrauchen. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const r = await load(req, (await params).token);
  if (r === "limited") return NextResponse.json({ error: "Zu viele Anfragen." }, { status: 429 });
  if (!r) return NextResponse.json(NOT_FOUND, { status: 404 });
  return NextResponse.json({
    id: r.id,
    status: r.status,
    message: r.message,
    recipientEmail: r.recipientEmail,
    invited: !!r.inviteSentAt,
    expiresAt: r.expiresAt.toISOString(),
    respondedAt: r.respondedAt?.toISOString() ?? null,
  });
}

/** Antwort abrufen — danach wird alles unwiderruflich gelöscht (burn-after-read). */
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const r = await load(req, (await params).token);
    if (r === "limited") return NextResponse.json({ error: "Zu viele Anfragen." }, { status: 429 });
    if (!r) return NextResponse.json(NOT_FOUND, { status: 404 });
    if (r.status !== "ANSWERED") return NextResponse.json({ error: "Noch keine Antwort eingegangen." }, { status: 409 });

    // Atomar: nur die Anfrage, deren DELETE gelingt, bekommt die Daten
    let deleted;
    try {
      deleted = await prisma.dataRequest.delete({ where: { id: r.id } });
    } catch {
      return NextResponse.json(NOT_FOUND, { status: 404 });
    }

    let encryptedData = "";
    if (deleted.responseType === "FILE" && deleted.responseFile) {
      const p = responseFilePath(deleted.responseFile);
      try {
        encryptedData = (await fs.readFile(p)).toString("base64");
      } finally {
        await secureDelete(p);
      }
    } else if (deleted.encryptedData) {
      encryptedData = Buffer.from(deleted.encryptedData).toString("base64");
    }

    return NextResponse.json({
      type: deleted.responseType,
      encryptedData,
      iv: deleted.iv ? Buffer.from(deleted.iv).toString("base64") : "",
      ephemeralPublicKey: deleted.ephemeralPublicKey,
      encryptedMeta: deleted.encryptedMeta,
    });
  } catch (e) {
    console.error("POST retrieve Error:", e);
    return NextResponse.json({ error: "Interner Fehler." }, { status: 500 });
  }
}
