import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const FALLBACK_PLEDGES = [
  { id: "p1", familyId: "demo", org: "Stanford GSB", amount: 2000000, remaining: 1500000, deadline: "2028-12-31", status: "active" },
  { id: "p2", familyId: "demo", org: "New York Public Library", amount: 500000, remaining: 300000, deadline: "2027-06-30", status: "active" },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const familyId = searchParams.get("familyId");
  if (!familyId) return NextResponse.json({ pledges: FALLBACK_PLEDGES });
  try {
    const pledges = await prisma.pledge.findMany({
      where: { familyId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ pledges: pledges.length > 0 ? pledges : FALLBACK_PLEDGES });
  } catch {
    return NextResponse.json({ pledges: FALLBACK_PLEDGES });
  }
}
