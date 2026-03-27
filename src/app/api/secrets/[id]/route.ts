import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { arrayBufferToBase64 } from "@/lib/crypto";
import * as fs from "fs/promises";
import * as path from "path";
import { secureDelete } from "@/server/storage";

// Da wir Next.js Route Handlers (App Router) nutzen, typing parameters
export const dynamic = 'force-dynamic';
const UPLOAD_DIR = process.env.UPLOAD_DIR || "./data/secrets";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // In Next.js 15 params is a Promise
) {
  try {
    const { id } = await params;

    const secret = await prisma.secret.findUnique({
      where: { id },
    });

    if (!secret) {
      return NextResponse.json({ error: "Secret not found or already deleted." }, { status: 404 });
    }

    if (secret.expiresAt < new Date()) {
      await prisma.secret.delete({ where: { id } }).catch(() => {});
      if (secret.type === "FILE") {
        await secureDelete(path.join(UPLOAD_DIR, `${id}.enc`));
      }
      return NextResponse.json({ error: "Secret not found or already deleted." }, { status: 404 });
    }

    let encryptedDataB64 = "";

    if (secret.type === "FILE") {
      try {
        const filePath = path.join(UPLOAD_DIR, `${id}.enc`);
        const fileBuffer = await fs.readFile(filePath);
        encryptedDataB64 = fileBuffer.toString("base64");
      } catch (err) {
        console.error("File not found on disk:", err);
        return NextResponse.json({ error: "File corrupt or missing." }, { status: 500 });
      }
    } else {
      encryptedDataB64 = arrayBufferToBase64(secret.encryptedData);
    }

    const responseData = {
      encryptedData: encryptedDataB64,
      iv: arrayBufferToBase64(secret.iv),
      type: secret.type,
      fileName: secret.fileName,
      mimeType: secret.mimeType,
      expiresAt: secret.expiresAt.toISOString(),
      burnAfterRead: secret.burnAfterRead,
    };

    if (secret.burnAfterRead) {
      // 1. Aus DB löschen
      await prisma.secret.delete({ where: { id } });
      // 2. Sicher vom FS löschen (DSGVO: erst überschreiben, dann löschen)
      if (secret.type === "FILE") {
        await secureDelete(path.join(UPLOAD_DIR, `${id}.enc`));
      }
    } else {
      await prisma.secret.update({
        where: { id },
        data: { readCount: { increment: 1 } },
      });
    }

    const res = NextResponse.json(responseData);
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.headers.set("Pragma", "no-cache");
    res.headers.set("Expires", "0");
    return res;

  } catch (error) {
    console.error("Error retrieving secret:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
