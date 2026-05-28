import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MOCK_FAMILIES = [
  { id: "family_demo", name: "Demo Family Office" },
];

export async function GET() {
  try {
    const families = await prisma.family.findMany({
      select: { id: true, name: true },
      orderBy: { createdAt: "asc" },
    });
    if (families.length > 0) return NextResponse.json({ families });
    return NextResponse.json({ families: MOCK_FAMILIES, _mock: true });
  } catch {
    return NextResponse.json({ families: MOCK_FAMILIES, _mock: true });
  }
}
