import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MOCK_DOCUMENTS = [
  { id: "doc_m1", name: "Phalanx Defense — SAFE Note", type: "safe", createdAt: "2026-05-16", _mock: true },
  { id: "doc_m2", name: "Arcadia Energy — LP Agreement", type: "lpa", createdAt: "2026-05-12", _mock: true },
  { id: "doc_m3", name: "Meridian AI — NDA", type: "nda", createdAt: "2026-05-10", _mock: true },
  { id: "doc_m4", name: "Hartwell Trust — Subscription Docs", type: "other", createdAt: "2026-05-08", _mock: true },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const familyId = searchParams.get("familyId");

  if (!familyId) {
    return NextResponse.json({ error: "familyId is required" }, { status: 400 });
  }

  try {
    const documents = await prisma.document.findMany({
      where: { familyId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return NextResponse.json({ documents });
  } catch {
    return NextResponse.json({ documents: MOCK_DOCUMENTS });
  }
}
