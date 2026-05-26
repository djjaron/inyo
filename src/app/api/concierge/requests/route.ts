import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const familyId = searchParams.get("familyId");
  if (!familyId) return NextResponse.json({ error: "familyId required" }, { status: 400 });
  try {
    const requests = await prisma.conciergeRequest.findMany({
      where: { familyId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ requests });
  } catch {
    return NextResponse.json({ requests: [] });
  }
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { familyId, type, title, details } = body as {
    familyId?: string;
    type?: string;
    title?: string;
    details?: string;
  };
  if (!familyId || !title) {
    return NextResponse.json({ error: "familyId and title required" }, { status: 400 });
  }
  try {
    const request = await prisma.conciergeRequest.create({
      data: { familyId, type: type ?? "other", title, details: details ?? null },
    });
    return NextResponse.json({ request });
  } catch {
    return NextResponse.json({
      request: {
        id: `temp_${Date.now()}`,
        familyId,
        type: type ?? "other",
        title,
        details: details ?? null,
        status: "pending",
        assignee: "Concierge Agent",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
  }
}
