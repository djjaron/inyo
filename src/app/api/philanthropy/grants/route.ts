import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const FALLBACK_GRANTS = [
  { id: "g1", familyId: "demo", org: "MIT Media Lab", category: "Education", amount: 500000, year: 2026, status: "active", impact: "AI literacy programs" },
  { id: "g2", familyId: "demo", org: "Nature Conservancy", category: "Environment", amount: 250000, year: 2026, status: "active", impact: "Amazon watershed protection" },
  { id: "g3", familyId: "demo", org: "Robin Hood Foundation", category: "Poverty", amount: 100000, year: 2025, status: "completed", impact: "NYC youth employment" },
  { id: "g4", familyId: "demo", org: "MacArthur Foundation", category: "Justice", amount: 150000, year: 2025, status: "completed", impact: "Criminal justice reform" },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const familyId = searchParams.get("familyId");
  if (!familyId) return NextResponse.json({ grants: FALLBACK_GRANTS });
  try {
    const grants = await prisma.grant.findMany({
      where: { familyId, deletedAt: null },
      orderBy: { year: "desc" },
    });
    return NextResponse.json({ grants: grants.length > 0 ? grants : FALLBACK_GRANTS });
  } catch {
    return NextResponse.json({ grants: FALLBACK_GRANTS });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { familyId, org, amount, year, category, status, impact } = body;
    if (!familyId || !org || !amount || !year) {
      return NextResponse.json({ error: "familyId, org, amount, year are required" }, { status: 400 });
    }
    const grant = await prisma.grant.create({
      data: {
        familyId,
        org,
        amount: parseFloat(amount),
        year: parseInt(year),
        category: category ?? null,
        status: status ?? "active",
        impact: impact ?? null,
      },
    });
    return NextResponse.json({ grant }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create grant" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  try {
    await prisma.grant.update({ where: { id }, data: { deletedAt: new Date() } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete grant" }, { status: 500 });
  }
}
