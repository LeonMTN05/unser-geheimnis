import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { REQUEST_ID_PATTERN } from "@/server/requests";

export const dynamic = "force-dynamic";

const NOT_FOUND = { error: "Anfrage nicht gefunden oder abgelaufen." };

/** Öffentliche Infos für den Antwortenden (Seite /r/[id]). */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!REQUEST_ID_PATTERN.test(id)) return NextResponse.json(NOT_FOUND, { status: 404 });

  const r = await prisma.dataRequest.findUnique({ where: { id } });
  // Unbestätigte Anfragen sind nach außen nicht existent
  if (!r || r.status === "PENDING_VERIFICATION" || r.expiresAt < new Date()) {
    return NextResponse.json(NOT_FOUND, { status: 404 });
  }
  if (r.status === "ANSWERED") return NextResponse.json({ status: "ANSWERED" });

  return NextResponse.json({
    status: r.status,
    publicKey: r.publicKey,
    message: r.message,
    requesterName: r.requesterName,
    // Nur bestätigte Adressen werden angezeigt
    requesterEmail: r.inviteSentAt ? r.requesterEmail : null,
    verified: !!r.inviteSentAt,
    expiresAt: r.expiresAt.toISOString(),
  });
}
