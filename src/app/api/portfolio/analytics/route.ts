import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Allocation rule for Deal records with status="invested":
//   deployed   = capitalAsk (the amount committed/drawn)
//   totalValue = capitalAsk (no mark-up assumed for deal records — use PortfolioCompany.currentValue for marked positions)

const CONCENTRATION_THRESHOLD = 30;

interface SectorBucket {
  sector: string;
  count: number;
  totalValue: number;
  pct: number;
}

interface StageBucket {
  stage: string;
  count: number;
  totalValue: number;
  pct: number;
}

interface VintageBucket {
  year: number;
  count: number;
  deployed: number;
}

interface ConcentrationWarning {
  type: string;
  label: string;
  pct: number;
  message: string;
}

const MOCK_RESPONSE = {
  _mock: true,
  allocationBySector: [
    { sector: "Enterprise Tech", count: 4, totalValue: 14_000_000, pct: 34 },
    { sector: "Real Estate", count: 3, totalValue: 11_000_000, pct: 27 },
    { sector: "Energy", count: 2, totalValue: 8_000_000, pct: 20 },
    { sector: "Sports & Media", count: 1, totalValue: 5_000_000, pct: 12 },
    { sector: "Credit", count: 1, totalValue: 3_000_000, pct: 7 },
  ],
  allocationByStage: [
    { stage: "Series B", count: 3, totalValue: 16_000_000, pct: 39 },
    { stage: "Series A", count: 2, totalValue: 9_000_000, pct: 22 },
    { stage: "Growth", count: 2, totalValue: 8_000_000, pct: 20 },
    { stage: "Real Estate", count: 3, totalValue: 8_000_000, pct: 19 },
  ],
  vintageByYear: [
    { year: 2026, count: 2, deployed: 7_000_000 },
    { year: 2025, count: 4, deployed: 14_000_000 },
    { year: 2024, count: 3, deployed: 10_000_000 },
    { year: 2023, count: 2, deployed: 10_000_000 },
  ],
  concentrationWarnings: [
    {
      type: "sector",
      label: "Enterprise Tech",
      pct: 34,
      message:
        "34% in Enterprise Tech — approaching 30% concentration threshold",
    },
  ],
  totalDeployed: 41_000_000,
  totalPortfolioValue: 52_000_000,
  companiesCount: 11,
};

function computeAnalytics(
  companies: Array<{
    sector?: string | null;
    stage?: string | null;
    investedAmount?: number | null;
    currentValue?: number | null;
    investedAt?: Date | null;
    createdAt: Date;
  }>,
  deals: Array<{
    sector?: string | null;
    stage?: string | null;
    capitalAsk?: number | null;
    investedAt?: Date | null;
    createdAt: Date;
  }>
) {
  // Unified row shape for aggregation
  interface Row {
    sector: string;
    stage: string;
    deployed: number;
    currentValue: number;
    year: number;
  }

  const rows: Row[] = [];

  for (const co of companies) {
    const deployed = co.investedAmount ?? 0;
    const value = co.currentValue ?? deployed;
    // Use investedAt year, fall back to createdAt year if null
    const year = (co.investedAt ?? co.createdAt).getFullYear();
    rows.push({
      sector: co.sector ?? "Unknown",
      stage: co.stage ?? "Unknown",
      deployed,
      currentValue: value,
      year,
    });
  }

  for (const deal of deals) {
    const deployed = deal.capitalAsk ?? 0;
    const year = (deal.investedAt ?? deal.createdAt).getFullYear();
    rows.push({
      sector: deal.sector ?? "Unknown",
      stage: deal.stage ?? "Unknown",
      deployed,
      currentValue: deployed, // no mark-up for deal records
      year,
    });
  }

  const totalDeployed = rows.reduce((s, r) => s + r.deployed, 0);
  const totalPortfolioValue = rows.reduce((s, r) => s + r.currentValue, 0);
  const companiesCount = rows.length;

  // Sector allocation
  const sectorMap = new Map<string, { count: number; totalValue: number }>();
  for (const r of rows) {
    const existing = sectorMap.get(r.sector) ?? { count: 0, totalValue: 0 };
    sectorMap.set(r.sector, {
      count: existing.count + 1,
      totalValue: existing.totalValue + r.currentValue,
    });
  }
  const allocationBySector: SectorBucket[] = Array.from(sectorMap.entries())
    .map(([sector, { count, totalValue }]) => ({
      sector,
      count,
      totalValue,
      pct:
        totalPortfolioValue > 0
          ? Math.round((totalValue / totalPortfolioValue) * 100)
          : 0,
    }))
    .sort((a, b) => b.pct - a.pct);

  // Stage allocation
  const stageMap = new Map<string, { count: number; totalValue: number }>();
  for (const r of rows) {
    const existing = stageMap.get(r.stage) ?? { count: 0, totalValue: 0 };
    stageMap.set(r.stage, {
      count: existing.count + 1,
      totalValue: existing.totalValue + r.currentValue,
    });
  }
  const allocationByStage: StageBucket[] = Array.from(stageMap.entries())
    .map(([stage, { count, totalValue }]) => ({
      stage,
      count,
      totalValue,
      pct:
        totalPortfolioValue > 0
          ? Math.round((totalValue / totalPortfolioValue) * 100)
          : 0,
    }))
    .sort((a, b) => b.pct - a.pct);

  // Vintage year
  const vintageMap = new Map<number, { count: number; deployed: number }>();
  for (const r of rows) {
    const existing = vintageMap.get(r.year) ?? { count: 0, deployed: 0 };
    vintageMap.set(r.year, {
      count: existing.count + 1,
      deployed: existing.deployed + r.deployed,
    });
  }
  const vintageByYear: VintageBucket[] = Array.from(vintageMap.entries())
    .map(([year, { count, deployed }]) => ({ year, count, deployed }))
    .sort((a, b) => a.year - b.year);

  // Concentration warnings — flag any sector > 30%
  const concentrationWarnings: ConcentrationWarning[] = allocationBySector
    .filter((s) => s.pct > CONCENTRATION_THRESHOLD)
    .map((s) => ({
      type: "sector",
      label: s.sector,
      pct: s.pct,
      message: `${s.pct}% in ${s.sector} exceeds ${CONCENTRATION_THRESHOLD}% concentration threshold`,
    }));

  return {
    allocationBySector,
    allocationByStage,
    vintageByYear,
    concentrationWarnings,
    totalDeployed,
    totalPortfolioValue,
    companiesCount,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const familyId = searchParams.get("familyId");

  try {
    const companyWhere: Record<string, unknown> = { deletedAt: null };
    if (familyId) companyWhere.familyId = familyId;

    const dealWhere: Record<string, unknown> = {
      status: "invested",
      deletedAt: null,
    };
    if (familyId) dealWhere.familyId = familyId;

    const [companies, deals] = await Promise.all([
      prisma.portfolioCompany.findMany({
        where: companyWhere,
        select: {
          sector: true,
          stage: true,
          investedAmount: true,
          currentValue: true,
          investedAt: true,
          createdAt: true,
        },
      }),
      prisma.deal.findMany({
        where: dealWhere,
        select: {
          sector: true,
          stage: true,
          capitalAsk: true,
          investedAt: true,
          createdAt: true,
        },
      }),
    ]);

    // Return mock when both sources are empty (fresh DB / demo environment)
    if (companies.length === 0 && deals.length === 0) {
      return NextResponse.json(MOCK_RESPONSE);
    }

    const analytics = computeAnalytics(companies, deals);
    return NextResponse.json({ ...analytics, _mock: false });
  } catch {
    return NextResponse.json(MOCK_RESPONSE);
  }
}
