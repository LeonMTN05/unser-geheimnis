import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { createSecretSchema } from "@/lib/validation";
import { createId } from "@paralleldrive/cuid2";
import * as fs from "fs/promises";
import * as path from "path";

const rateLimiter = new Map<string, { count: number; timestamp: number }>();
const MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX) || 10;
const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS) || 3600000;
const UPLOAD_DIR = process.env.UPLOAD_DIR || "./data/secrets";

// Periodisch alte Rate-Limit-Einträge bereinigen (alle 10 Minuten)
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimiter.entries()) {
    if (now - record.timestamp > WINDOW_MS) {
      rateLimiter.delete(ip);
    }
  }
}, 10 * 60 * 1000);

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const userRecord = rateLimiter.get(ip);
  if (!userRecord) {
    rateLimiter.set(ip, { count: 1, timestamp: now });
    return true;
  }
  if (now - userRecord.timestamp > WINDOW_MS) {
    rateLimiter.set(ip, { count: 1, timestamp: now });
    return true;
  }
  if (userRecord.count >= MAX_REQUESTS) {
    return false;
  }
  userRecord.count++;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: "Rate limit exceeded. Try again later." }, { status: 429 });
    }

    const contentType = req.headers.get("content-type") || "";

    let type: "TEXT" | "FILE";
    let expiresIn: number;
    let burnAfterRead: boolean;
    let ivBase64: string;
    let encryptedDataBase64: string = "";
    let fileName: string | undefined;
    let fileSize: number | undefined;
    let mimeType: string | undefined;
    let fileBuffer: Buffer | undefined;

    if (contentType.includes("multipart/form-data")) {
      // FormData einmalig lesen
      const formData = await req.formData();

      type = (formData.get("type") as "TEXT" | "FILE") || "TEXT";
      expiresIn = Number(formData.get("expiresIn"));
      burnAfterRead = formData.get("burnAfterRead") === "true";
      ivBase64 = formData.get("iv") as string;

      if (type === "FILE") {
        const file = formData.get("file") as File | null;
        if (!file) {
          return NextResponse.json({ error: "Missing file payload" }, { status: 400 });
        }
        fileName = (formData.get("fileName") as string) || file.name || "unknown.bin";
        mimeType = (formData.get("mimeType") as string) || file.type || "application/octet-stream";
        fileSize = file.size;
        // Datei-Bytes einmalig lesen und als Buffer speichern
        fileBuffer = Buffer.from(await file.arrayBuffer());
        encryptedDataBase64 = fileBuffer.toString("base64");
      } else {
        encryptedDataBase64 = formData.get("encryptedData") as string;
      }
    } else {
      // JSON
      const body = await req.json();
      type = body.type;
      expiresIn = body.expiresIn;
      burnAfterRead = body.burnAfterRead ?? true;
      ivBase64 = body.iv;
      encryptedDataBase64 = body.encryptedData;
      fileName = body.fileName;
      fileSize = body.fileSize;
      mimeType = body.mimeType;
    }

    // Validierung
    if (type === "TEXT") {
      const result = createSecretSchema.safeParse({
        type, expiresIn, burnAfterRead, iv: ivBase64,
        encryptedData: encryptedDataBase64, fileName, fileSize, mimeType,
      });
      if (!result.success) {
        return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
      }
    } else if (type === "FILE") {
      if (!ivBase64 || !fileName || !fileSize || !fileBuffer) {
        return NextResponse.json({ error: "Invalid file metadata" }, { status: 400 });
      }
      if (fileSize > (Number(process.env.MAX_FILE_SIZE_MB) || 16) * 1024 * 1024) {
        return NextResponse.json({ error: "File too large (max 16 MB)" }, { status: 413 });
      }
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    const expiresAt = new Date(Date.now() + expiresIn * 60 * 60 * 1000);
    const id = createId();

    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    let dbEncryptedData: Buffer = Buffer.alloc(0);

    if (type === "TEXT") {
      dbEncryptedData = Buffer.from(encryptedDataBase64, "base64");
    } else {
      // Verschlüsselten Datei-Blob auf Disk schreiben
      const filePath = path.join(UPLOAD_DIR, `${id}.enc`);
      await fs.writeFile(filePath, fileBuffer!);
    }

    const ivBuffer = Buffer.from(ivBase64, "base64");

    const secret = await prisma.secret.create({
      data: {
        id,
        encryptedData: dbEncryptedData,
        iv: ivBuffer,
        type,
        fileName: fileName ?? null,
        fileSize: fileSize ?? null,
        mimeType: mimeType ?? null,
        expiresAt,
        burnAfterRead,
      },
      select: { id: true, expiresAt: true },
    });

    return NextResponse.json({
      id: secret.id,
      expiresAt: secret.expiresAt.toISOString(),
    });

  } catch (error) {
    console.error("POST /api/secrets Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
