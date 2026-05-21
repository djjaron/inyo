import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RecentDeal {
  id: string;
  company: string;
  sector: string | null;
  stage: string | null;
  dealScore: number | null;
  status: string;
  createdAt: string;
}

interface AlertItem {
  id: string;
  companyName: string;
  type: string;
  severity: string;
  title: string;
  createdAt: string;
}

interface DashboardStats {
  totalDeals: number;
  pipelineValue: number;
  activeDeals: number;
  portfolioCompanies: number;
}

interface DashboardResponse {
  stats: DashboardStats;
  recentDeals: RecentDeal[];
  alerts: AlertItem[];
  _mock: boolean;
}

// ---------------------------------------------------------------------------
// Mock fallback data
// ---------------------------------------------------------------------------

const MOCK_RESPONSE: DashboardResponse = {
  stats: {
    totalDeals: 12,
    pipelineValue: 143_000_000,
    activeDeals: 8,
    portfolioCompanies: 23,
  },
  recentDeals: [
    { id: "mock-d1", company: "Phalanx Defense", sector: "Defense Tech", stage: "series-c", dealScore: 88, status: "ic-review", createdAt: "2026-05-03" },
    { id: "mock-d2", company: "Meridian AI", sector: "Enterprise AI", stage: "series-b", dealScore: 84, status: "diligence", createdAt: "2026-05-14" },
    { id: "mock-d3", company: "Arcadia Energy", sector: "Clean Energy", stage: "growth", dealScore: 79, status: "ic-review", createdAt: "2026-05-08" },
    { id: "mock-d4", company: "Verdant Bio", sector: "Biotech", stage: "series-a", dealScore: 71, status: "reviewing", createdAt: "2026-05-12" },
    { id: "mock-d5", company: "Terrace REIT", sector: "Real Estate", stage: "pe", dealScore: 73, status: "inbound", createdAt: "2026-04-25" },
  ],
  alerts: [
    { id: "mock-a1", companyName: "Meridian AI", type: "funding", severity: "info", title: "New strategic investor joining round", createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
    { id: "mock-a2", companyName: "Helios Credit", type: "executive-departure", severity: "critical", title: "CFO departure announced", createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() },
    { id: "mock-a3", companyName: "ClearReg", type: "press", severity: "info", title: "SOC 2 Type II certification achieved", createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
    { id: "mock-a4", companyName: "Arcadia Energy", type: "legal", severity: "warning", title: "Regulatory filing delayed 30 days", createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  ],
  _mock: true,
};

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const familyId = searchParams.get("familyId");

  // Short-circuit to mock for demo family or missing familyId
  if (!familyId || familyId === "family_demo") {
    return NextResponse.json(MOCK_RESPONSE);
  }

  try {
    const ACTIVE_STATUSES = ["inbound", "reviewing", "diligence", "ic-review"];
    const INACTIVE_STATUSES = ["passed", "invested", "archived"];

    // Run all queries in parallel
    const [totalDeals, activeDeals, pipelineAgg, recentDeals, portfolioCompanies] =
      await Promise.all([
        prisma.deal.count({ where: { familyId } }),

        prisma.deal.count({
          where: { familyId, status: { in: ACTIVE_STATUSES } },
        }),

        prisma.deal.aggregate({
          where: {
            familyId,
            status: { notIn: INACTIVE_STATUSES },
            capitalAsk: { not: null },
          },
          _sum: { capitalAsk: true },
        }),

        prisma.deal.findMany({
          where: { familyId },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            company: true,
            sector: true,
            stage: true,
            dealScore: true,
            status: true,
            createdAt: true,
          },
        }),

        prisma.portfolioCompany.count({
          where: { familyId },
        }),
      ]);

    // PortfolioAlert query wrapped separately — model may not exist in all schemas
    let alerts: AlertItem[] = [];
    try {
      const rawAlerts = await prisma.portfolioAlert.findMany({
        where: { company: { familyId } },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { company: { select: { name: true } } },
      });
      alerts = rawAlerts.map((a) => ({
        id: a.id,
        companyName: a.company.name,
        type: a.type,
        severity: a.severity,
        title: a.title,
        createdAt: a.createdAt.toISOString(),
      }));
    } catch {
      // PortfolioAlert not in schema or no data — return empty array
      alerts = [];
    }

    const response: DashboardResponse = {
      stats: {
        totalDeals,
        pipelineValue: pipelineAgg._sum.capitalAsk ?? 0,
        activeDeals,
        portfolioCompanies,
      },
      recentDeals: recentDeals.map((d) => ({
        id: d.id,
        company: d.company,
        sector: d.sector,
        stage: d.stage,
        dealScore: d.dealScore,
        status: d.status,
        createdAt: d.createdAt.toISOString(),
      })),
      alerts,
      _mock: false,
    };

    return NextResponse.json(response);
  } catch {
    // DB unavailable — return mock data
    return NextResponse.json(MOCK_RESPONSE);
  }
}
