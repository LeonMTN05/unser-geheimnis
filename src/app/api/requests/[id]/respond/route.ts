import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs/promises";
import { randomBytes } from "crypto";
import { prisma } from "@/server/db";
import { respondFileMetaSchema, respondTextSchema } from "@/lib/requestValidation";
import { consume, getClientIp, siteUrl } from "@/server/security";
import { secureDelete } from "@/server/storage";
import { sendMail } from "@/server/mailer";
import { answeredMail } from "@/server/mailTemplates";
import { REQUEST_ID_PATTERN, UPLOAD_DIR, responseFilePath } from "@/server/requests";

export const dynamic = "force-dynamic";

const err = (error: string, status: number) => NextResponse.json({ error }, { status });
const MAX_FILE = (Number(process.env.MAX_FILE_SIZE_MB) || 16) * 1024 * 1024 + 16; // +GCM-Tag

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let writtenFile: string | null = null;
  try {
    const { id } = await params;
    if (!REQUEST_ID_PATTERN.test(id)) return err("Anfrage nicht gefunden.", 404);
    if (!(await consume("respond", getClientIp(req)))) return err("Zu viele Anfragen. Bitte später erneut versuchen.", 429);

    const r = await prisma.dataRequest.findUnique({ where: { id }, select: { status: true, expiresAt: true } });
    if (!r || r.status !== "OPEN" || r.expiresAt < new Date()) {
      return err("Diese Anfrage ist abgelaufen oder wurde bereits beantwortet.", 410);
    }

    let update: {
      responseType: string; iv: Buffer; ephemeralPublicKey: string;
      encryptedData?: Buffer; responseFile?: string; encryptedMeta?: string; fileSize?: number;
    };

    const ct = req.headers.get("content-type") || "";
    if (ct.includes("multipart/form-data")) {
      const fd = await req.formData();
      const file = fd.get("file");
      const meta = respondFileMetaSchema.safeParse({
        iv: fd.get("iv"), ephemeralPublicKey: fd.get("ephemeralPublicKey"), encryptedMeta: fd.get("encryptedMeta"),
      });
      if (!(file instanceof File) || !meta.success) return err("Ungültige Datei-Daten.", 400);
      if (file.size === 0 || file.size > MAX_FILE) return err("Datei zu groß (max. 16 MB).", 413);

      // Eindeutiger Dateiname — parallele Antworten überschreiben sich nicht
      const name = `req_${id}_${randomBytes(8).toString("hex")}.enc`;
      await fs.mkdir(UPLOAD_DIR, { recursive: true });
      await fs.writeFile(responseFilePath(name), Buffer.from(await file.arrayBuffer()));
      writtenFile = name;
      update = {
        responseType: "FILE", iv: Buffer.from(meta.data.iv, "base64"),
        ephemeralPublicKey: meta.data.ephemeralPublicKey, responseFile: name,
        encryptedMeta: meta.data.encryptedMeta, fileSize: file.size,
      };
    } else {
      const parsed = respondTextSchema.safeParse(await req.json().catch(() => null));
      if (!parsed.success) return err("Ungültige Eingabe.", 400);
      update = {
        responseType: "TEXT", iv: Buffer.from(parsed.data.iv, "base64"),
        ephemeralPublicKey: parsed.data.ephemeralPublicKey,
        encryptedData: Buffer.from(parsed.data.encryptedData, "base64"),
      };
    }

    // Atomar: nur die erste Antwort wird angenommen
    const claimed = await prisma.dataRequest.updateMany({
      where: { id, status: "OPEN", expiresAt: { gt: new Date() } },
      data: { ...update, status: "ANSWERED", respondedAt: new Date() },
    });
    if (claimed.count === 0) {
      if (writtenFile) await secureDelete(responseFilePath(writtenFile));
      return err("Diese Anfrage wurde bereits beantwortet.", 409);
    }
    writtenFile = null;

    // Anfragenden benachrichtigen (nur bestätigte Adresse, ohne Schlüssel/Link)
    const full = await prisma.dataRequest.findUnique({ where: { id } });
    if (full?.requesterEmail && full.inviteSentAt) {
      sendMail(answeredMail({
        to: full.requesterEmail, recipient: full.recipientEmail, expiresAt: full.expiresAt,
        openUrl: `${siteUrl()}/anfrage/oeffnen?id=${id}`,
      }))
        .catch((e) => console.error("[respond] Benachrichtigung fehlgeschlagen:", e));
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("POST respond Error:", e);
    if (writtenFile) await secureDelete(responseFilePath(writtenFile));
    return err("Interner Fehler.", 500);
  }
}
