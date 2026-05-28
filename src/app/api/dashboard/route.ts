import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildLabel, buildSeverity, type AgentRunItem } from "@/app/api/agents/runs/route";

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

export interface PortfolioPerformance {
  totalDeployed: number;
  currentValue: number;
  unrealizedPnL: number;
  tvpi: number | null;
}

interface DashboardResponse {
  stats: DashboardStats;
  portfolioPerformance: PortfolioPerformance;
  recentDeals: RecentDeal[];
  alerts: AlertItem[];
  recentRuns: AgentRunItem[];
  _mock: boolean;
}

// ---------------------------------------------------------------------------
// Mock fallback data
// ---------------------------------------------------------------------------

const MOCK_RECENT_RUNS: AgentRunItem[] = [
  { id: "mr1", agentType: "deal-flow", status: "completed", triggerType: "ingestion", label: "Scored Meridian AI: 84 (Pursue)", severity: "success", startedAt: new Date(Date.now() - 2 * 3600_000).toISOString(), completedAt: new Date(Date.now() - 2 * 3600_000 + 10000).toISOString(), createdAt: new Date(Date.now() - 2 * 3600_000).toISOString(), outputPreview: { score: 84, recommendation: "pursue" } },
  { id: "mr2", agentType: "portfolio-monitor", status: "completed", triggerType: "scheduled", label: "Helios Credit: Escalate ⚠️", severity: "error", startedAt: new Date(Date.now() - 5 * 3600_000).toISOString(), completedAt: new Date(Date.now() - 5 * 3600_000 + 8000).toISOString(), createdAt: new Date(Date.now() - 5 * 3600_000).toISOString(), outputPreview: { healthScore: 42, overallStatus: "escalate" } },
  { id: "mr3", agentType: "cfo", status: "completed", triggerType: "scheduled", label: "CFO summary: Liquidity Healthy", severity: "success", startedAt: new Date(Date.now() - 9 * 3600_000).toISOString(), completedAt: new Date(Date.now() - 9 * 3600_000 + 5000).toISOString(), createdAt: new Date(Date.now() - 9 * 3600_000).toISOString(), outputPreview: { liquidityStatus: "healthy" } },
  { id: "mr4", agentType: "deal-enrichment", status: "completed", triggerType: "ingestion", label: "Enriched Phalanx Defense — affinity 91", severity: "success", startedAt: new Date(Date.now() - 26 * 3600_000).toISOString(), completedAt: new Date(Date.now() - 26 * 3600_000 + 7000).toISOString(), createdAt: new Date(Date.now() - 26 * 3600_000).toISOString(), outputPreview: { affinityScore: 91 } },
  { id: "mr5", agentType: "portfolio-monitor", status: "completed", triggerType: "scheduled", label: "Meridian AI: Monitor", severity: "warning", startedAt: new Date(Date.now() - 27 * 3600_000).toISOString(), completedAt: new Date(Date.now() - 27 * 3600_000 + 8000).toISOString(), createdAt: new Date(Date.now() - 27 * 3600_000).toISOString(), outputPreview: { healthScore: 67, overallStatus: "monitor" } },
];

const MOCK_RESPONSE: DashboardResponse = {
  stats: {
    totalDeals: 12,
    pipelineValue: 143_000_000,
    activeDeals: 8,
    portfolioCompanies: 23,
  },
  portfolioPerformance: {
    totalDeployed: 41_000_000,
    currentValue: 58_200_000,
    unrealizedPnL: 17_200_000,
    tvpi: 1.42,
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
  recentRuns: MOCK_RECENT_RUNS,
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
    const [totalDeals, activeDeals, pipelineAgg, recentDeals, portfolioCompanies, rawRuns, portfolioAgg] =
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

        prisma.agentRun.findMany({
          where: { familyId },
          orderBy: { createdAt: "desc" },
          take: 8,
        }),

        prisma.portfolioCompany.aggregate({
          where: { familyId, deletedAt: null },
          _sum: { investedAmount: true, currentValue: true },
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

    const recentRuns: AgentRunItem[] = rawRuns.map((row) => {
      const output = (row.output ?? null) as Record<string, unknown> | null;
      const input = (row.input ?? {}) as Record<string, unknown>;
      return {
        id: row.id,
        agentType: row.agentType,
        status: row.status,
        triggerType: row.triggerType,
        label: buildLabel(row.agentType, input, output, row.status),
        severity: buildSeverity(row.agentType, output, row.status),
        startedAt: row.startedAt?.toISOString() ?? null,
        completedAt: row.completedAt?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString(),
        outputPreview: output ? Object.fromEntries(Object.entries(output).slice(0, 4)) : null,
      };
    });

    const totalDeployed = portfolioAgg._sum.investedAmount ?? 0;
    const currentValue = portfolioAgg._sum.currentValue ?? 0;

    const response: DashboardResponse = {
      stats: {
        totalDeals,
        pipelineValue: pipelineAgg._sum.capitalAsk ?? 0,
        activeDeals,
        portfolioCompanies,
      },
      portfolioPerformance: {
        totalDeployed,
        currentValue,
        unrealizedPnL: currentValue - totalDeployed,
        tvpi: totalDeployed > 0 ? currentValue / totalDeployed : null,
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
      recentRuns,
      _mock: false,
    };

    return NextResponse.json(response);
  } catch {
    // DB unavailable — return mock data
    return NextResponse.json(MOCK_RESPONSE);
  }
}
