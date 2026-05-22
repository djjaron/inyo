import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CalendarStatus = "overdue" | "due-soon" | "upcoming";

interface CalendarItem {
  id: string;
  dealId: string;
  dealName: string;
  company: string;
  amount: number;
  dueDate: string;
  status: CalendarStatus;
  daysUntil: number;
  sector: string;
  type: "capital-call" | "distribution";
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function computeStatus(occurredAt: Date, now: Date): CalendarStatus {
  const diffMs = occurredAt.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "overdue";
  if (diffDays <= 14) return "due-soon";
  return "upcoming";
}

function daysUntil(occurredAt: Date, now: Date): number {
  const diffMs = occurredAt.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_CALLS: CalendarItem[] = [
  {
    id: "mock-cc-1",
    dealId: "mock-deal-1",
    dealName: "Meridian AI Series B",
    company: "Meridian AI",
    amount: 2_000_000,
    dueDate: "2026-06-15",
    status: "upcoming",
    daysUntil: 24,
    sector: "Enterprise AI",
    type: "capital-call",
  },
  {
    id: "mock-cc-2",
    dealId: "mock-deal-2",
    dealName: "Arcadia Energy Fund IV",
    company: "Arcadia Energy",
    amount: 1_500_000,
    dueDate: "2026-06-03",
    status: "due-soon",
    daysUntil: 12,
    sector: "Energy",
    type: "capital-call",
  },
  {
    id: "mock-cc-3",
    dealId: "mock-deal-3",
    dealName: "Westside Mixed-Use",
    company: "Hartwell RE Partners",
    amount: 800_000,
    dueDate: "2026-05-28",
    status: "due-soon",
    daysUntil: 6,
    sector: "Real Estate",
    type: "capital-call",
  },
];

const MOCK_DISTRIBUTIONS: CalendarItem[] = [
  {
    id: "mock-dist-1",
    dealId: "mock-deal-4",
    dealName: "Harbor Logistics LP",
    company: "Harbor Logistics",
    amount: 340_000,
    dueDate: "2026-07-01",
    status: "upcoming",
    daysUntil: 40,
    sector: "Logistics",
    type: "distribution",
  },
  {
    id: "mock-dist-2",
    dealId: "mock-deal-5",
    dealName: "Terrace REIT Q2",
    company: "Terrace REIT",
    amount: 220_000,
    dueDate: "2026-06-30",
    status: "upcoming",
    daysUntil: 39,
    sector: "Real Estate",
    type: "distribution",
  },
];

function buildMockResponse() {
  const allItems: CalendarItem[] = [...MOCK_CALLS, ...MOCK_DISTRIBUTIONS].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );
  return {
    _mock: true,
    upcomingCalls: MOCK_CALLS,
    upcomingDistributions: MOCK_DISTRIBUTIONS,
    cashFlowItems: allItems,
    summary: {
      totalCallsNext90Days: 4_300_000,
      totalDistributionsNext90Days: 560_000,
      netNext90Days: -3_740_000,
      dryPowder: 8_200_000,
    },
  };
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const familyId = searchParams.get("familyId");

  if (!familyId) {
    return NextResponse.json(
      { error: "familyId query param is required" },
      { status: 400 }
    );
  }

  try {
    const now = new Date();
    const ninetyDaysOut = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Load all entities for this family, including cash flows
    const entities = await prisma.entity.findMany({
      where: { familyId },
      include: {
        cashFlows: {
          where: {
            occurredAt: { gte: thirtyDaysAgo },
          },
        },
      },
    });

    if (entities.length === 0) {
      return NextResponse.json(buildMockResponse());
    }

    // Also load historical cash flows for dry powder calculation (all past)
    const historicalEntities = await prisma.entity.findMany({
      where: { familyId },
      include: {
        cashFlows: {
          where: {
            occurredAt: { lt: now },
          },
        },
      },
    });

    // Dry powder: sum of (past income + past distributions) - (past expenses + past capital-calls + past tax-payments)
    let dryPowder = 0;
    for (const entity of historicalEntities) {
      for (const cf of entity.cashFlows) {
        if (cf.type === "income" || cf.type === "distribution") {
          dryPowder += cf.amount;
        } else if (
          cf.type === "expense" ||
          cf.type === "capital-call" ||
          cf.type === "tax-payment"
        ) {
          dryPowder -= cf.amount;
        }
      }
    }

    const upcomingCalls: CalendarItem[] = [];
    const upcomingDistributions: CalendarItem[] = [];

    for (const entity of entities) {
      for (const cf of entity.cashFlows) {
        const occurredAt = new Date(cf.occurredAt);
        if (occurredAt < thirtyDaysAgo) continue; // should be filtered but defensive

        const status = computeStatus(occurredAt, now);
        const days = daysUntil(occurredAt, now);

        const item: CalendarItem = {
          id: cf.id,
          dealId: cf.entityId,
          dealName: cf.description ?? entity.name,
          company: entity.name,
          amount: cf.amount,
          dueDate: occurredAt.toISOString().slice(0, 10),
          status,
          daysUntil: days,
          sector: cf.category ?? "—",
          type: cf.type as "capital-call" | "distribution",
        };

        if (cf.type === "capital-call") {
          upcomingCalls.push(item);
        } else if (cf.type === "distribution") {
          upcomingDistributions.push(item);
        }
      }
    }

    // Sort by dueDate ascending
    upcomingCalls.sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );
    upcomingDistributions.sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );

    // Merged timeline
    const cashFlowItems: CalendarItem[] = [
      ...upcomingCalls,
      ...upcomingDistributions,
    ].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    // Summary — only future items within 90 days
    const totalCallsNext90Days = upcomingCalls
      .filter((c) => new Date(c.dueDate) <= ninetyDaysOut && c.daysUntil >= 0)
      .reduce((sum, c) => sum + c.amount, 0);

    const totalDistributionsNext90Days = upcomingDistributions
      .filter(
        (d) => new Date(d.dueDate) <= ninetyDaysOut && d.daysUntil >= 0
      )
      .reduce((sum, d) => sum + d.amount, 0);

    return NextResponse.json({
      _mock: false,
      upcomingCalls,
      upcomingDistributions,
      cashFlowItems,
      summary: {
        totalCallsNext90Days,
        totalDistributionsNext90Days,
        netNext90Days: totalDistributionsNext90Days - totalCallsNext90Days,
        dryPowder: Math.max(0, dryPowder),
      },
    });
  } catch {
    return NextResponse.json(buildMockResponse());
  }
}
