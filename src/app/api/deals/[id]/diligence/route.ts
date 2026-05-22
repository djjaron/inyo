import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET — return saved diligence data
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const deal = await prisma.deal.findUnique({ where: { id }, select: { diligenceData: true } });
    return NextResponse.json({ diligenceData: deal?.diligenceData ?? null });
  } catch {
    return NextResponse.json({ diligenceData: null });
  }
}

// PATCH — save diligence data
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: { diligenceData: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  try {
    await prisma.deal.update({ where: { id }, data: { diligenceData: body.diligenceData as never } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
