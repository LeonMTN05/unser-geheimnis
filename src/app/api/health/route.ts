import { NextResponse } from "next/server";
import { prisma } from "@/server/db";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Kurzer DB Check
    await prisma.secret.count();
    
    return NextResponse.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      version: "1.0.0"
    });
  } catch (error) {
    return NextResponse.json({ 
      status: "error", 
      message: "Database connection failed" 
    }, { status: 503 });
  }
}
