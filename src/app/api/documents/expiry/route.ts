import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ─── Types ────────────────────────────────────────────────────────────────────

type ExpiryStatus = "expired" | "critical" | "warning" | "upcoming";

interface ExpiryDoc {
  id: string;
  name: string;
  type: string;
  dealId: string | null;
  expiresAt: string;
  daysUntil: number;
  status: ExpiryStatus;
  keyDates: unknown[];
  dealName: string | null;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_RESPONSE = {
  _mock: true,
  expiring: [
    {
      id: "mock-d1",
      name: "Phalanx Defense NDA",
      type: "nda",
      dealId: "mock-deal-1",
      dealName: "Phalanx Defense Series A",
      expiresAt: "2026-06-01T00:00:00Z",
      daysUntil: 10,
      status: "critical" as ExpiryStatus,
      keyDates: [],
    },
    {
      id: "mock-d2",
      name: "Arcadia Option Period",
      type: "contract",
      dealId: "mock-deal-2",
      dealName: "Arcadia Energy Fund IV",
      expiresAt: "2026-06-20T00:00:00Z",
      daysUntil: 29,
      status: "warning" as ExpiryStatus,
      keyDates: [],
    },
    {
      id: "mock-d3",
      name: "Meridian LOI",
      type: "contract",
      dealId: "mock-deal-3",
      dealName: "Meridian AI Series B",
      expiresAt: "2026-07-15T00:00:00Z",
      daysUntil: 54,
      status: "upcoming" as ExpiryStatus,
      keyDates: [],
    },
  ],
  recentlyExpired: [
    {
      id: "mock-d4",
      name: "Westside REIT Subscription",
      type: "lpa",
      dealId: "mock-deal-4",
      dealName: "Westside Mixed-Use",
      expiresAt: "2026-05-10T00:00:00Z",
      daysUntil: -12,
      status: "expired" as ExpiryStatus,
      keyDates: [],
    },
  ],
};

// ─── Status logic ─────────────────────────────────────────────────────────────

function getStatus(daysUntil: number): ExpiryStatus {
  if (daysUntil < 0) return "expired";
  if (daysUntil <= 7) return "critical";
  if (daysUntil <= 30) return "warning";
  return "upcoming";
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const familyId = searchParams.get("familyId");

  if (!familyId) {
    return NextResponse.json({ error: "familyId is required" }, { status: 400 });
  }

  const now = new Date();
  // Use start-of-day for consistent daysUntil math
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const windowEnd = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);
  const windowStart = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  try {
    const documents = await prisma.document.findMany({
      where: {
        familyId,
        deletedAt: null,
        expiresAt: {
          not: null,
          gte: windowStart,
          lte: windowEnd,
        },
      },
      include: {
        deal: { select: { id: true, name: true } },
      },
      orderBy: { expiresAt: "asc" },
    });

    const shaped: ExpiryDoc[] = documents.map((doc) => {
      const expiresAt = doc.expiresAt!;
      const expDay = new Date(
        expiresAt.getFullYear(),
        expiresAt.getMonth(),
        expiresAt.getDate()
      );
      const daysUntil = Math.ceil(
        (expDay.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)
      );
      return {
        id: doc.id,
        name: doc.name,
        type: doc.type,
        dealId: doc.dealId,
        expiresAt: expiresAt.toISOString(),
        daysUntil,
        status: getStatus(daysUntil),
        keyDates: Array.isArray(doc.keyDates) ? doc.keyDates : [],
        dealName: doc.deal?.name ?? null,
      };
    });

    const expiring = shaped.filter((d) => d.daysUntil >= 0);
    const recentlyExpired = shaped.filter((d) => d.daysUntil < 0);

    // Return mock if DB came back empty (demo mode)
    if (expiring.length === 0 && recentlyExpired.length === 0) {
      return NextResponse.json(MOCK_RESPONSE);
    }

    return NextResponse.json({ _mock: false, expiring, recentlyExpired });
  } catch {
    return NextResponse.json(MOCK_RESPONSE);
  }
}
