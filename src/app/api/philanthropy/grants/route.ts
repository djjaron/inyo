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
