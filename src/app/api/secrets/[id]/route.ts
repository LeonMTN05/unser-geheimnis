import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { arrayBufferToBase64 } from "@/lib/crypto";
import * as fs from "fs/promises";
import * as path from "path";
import { secureDelete } from "@/server/storage";

export const dynamic = "force-dynamic";
const UPLOAD_DIR = process.env.UPLOAD_DIR || "./data/secrets";
const NOT_FOUND = { error: "Secret not found or already deleted." };
// cuid2-IDs: nur Kleinbuchstaben und Ziffern
const ID_PATTERN = /^[a-z0-9]{20,32}$/;

function noStore(res: NextResponse) {
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.headers.set("Pragma", "no-cache");
  res.headers.set("Expires", "0");
  return res;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!ID_PATTERN.test(id)) {
      return noStore(NextResponse.json(NOT_FOUND, { status: 404 }));
    }
    const filePath = path.join(UPLOAD_DIR, `${id}.enc`);

    const found = await prisma.secret.findUnique({ where: { id } });
    if (!found) {
      return noStore(NextResponse.json(NOT_FOUND, { status: 404 }));
    }

    if (found.expiresAt < new Date()) {
      await prisma.secret.delete({ where: { id } }).catch(() => {});
      if (found.type === "FILE") await secureDelete(filePath);
      return noStore(NextResponse.json(NOT_FOUND, { status: 404 }));
    }

    // Burn-after-read atomar: Nur die Anfrage, deren DELETE erfolgreich ist,
    // bekommt die Daten. Parallele Anfragen gehen leer aus.
    let secret = found;
    if (found.burnAfterRead) {
      try {
        secret = await prisma.secret.delete({ where: { id } });
      } catch {
        return noStore(NextResponse.json(NOT_FOUND, { status: 404 }));
      }
    } else {
      await prisma.secret.update({ where: { id }, data: { readCount: { increment: 1 } } });
    }

    let encryptedDataB64 = "";
    if (secret.type === "FILE") {
      try {
        encryptedDataB64 = (await fs.readFile(filePath)).toString("base64");
      } catch (err) {
        console.error("File not found on disk:", err);
        return noStore(NextResponse.json({ error: "File corrupt or missing." }, { status: 500 }));
      } finally {
        if (secret.burnAfterRead) await secureDelete(filePath);
      }
    } else {
      encryptedDataB64 = arrayBufferToBase64(secret.encryptedData);
    }

    return noStore(
      NextResponse.json({
        encryptedData: encryptedDataB64,
        iv: arrayBufferToBase64(secret.iv),
        type: secret.type,
        fileName: secret.fileName,
        mimeType: secret.mimeType,
        expiresAt: secret.expiresAt.toISOString(),
        burnAfterRead: secret.burnAfterRead,
      })
    );
  } catch (error) {
    console.error("Error retrieving secret:", error);
    return noStore(NextResponse.json({ error: "Internal Server Error" }, { status: 500 }));
  }
}
