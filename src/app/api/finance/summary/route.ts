import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Mock fallback data
// ---------------------------------------------------------------------------

const MOCK_RESPONSE = {
  _mock: true,
  entities: [
    {
      id: "mock-1",
      name: "Hartwell Capital LLC",
      type: "llc",
      totalInflows: 2_400_000,
      totalOutflows: 180_000,
      net: 2_220_000,
    },
    {
      id: "mock-2",
      name: "Hartwell Family Trust",
      type: "trust",
      totalInflows: 800_000,
      totalOutflows: 95_000,
      net: 705_000,
    },
    {
      id: "mock-3",
      name: "Hartwell Cayman LP",
      type: "lp",
      totalInflows: 1_200_000,
      totalOutflows: 195_000,
      net: 1_005_000,
    },
  ],
  totalNet: 3_930_000,
  recentCashFlows: [
    {
      id: "mock-cf-1",
      entityId: "mock-1",
      entityName: "Hartwell Capital LLC",
      type: "income",
      category: "Distributions",
      amount: 450_000,
      currency: "USD",
      description: "Q1 LP distribution from Fund III",
      occurredAt: "2026-03-31T00:00:00Z",
    },
    {
      id: "mock-cf-2",
      entityId: "mock-1",
      entityName: "Hartwell Capital LLC",
      type: "expense",
      category: "Management Fees",
      amount: 75_000,
      currency: "USD",
      description: "Annual investment advisory fee",
      occurredAt: "2026-03-15T00:00:00Z",
    },
    {
      id: "mock-cf-3",
      entityId: "mock-2",
      entityName: "Hartwell Family Trust",
      type: "distribution",
      category: "Family Distribution",
      amount: 150_000,
      currency: "USD",
      description: "Monthly family distribution",
      occurredAt: "2026-03-01T00:00:00Z",
    },
    {
      id: "mock-cf-4",
      entityId: "mock-3",
      entityName: "Hartwell Cayman LP",
      type: "capital-call",
      category: "Investment",
      amount: 500_000,
      currency: "USD",
      description: "Capital call — Arcadia Energy Series C",
      occurredAt: "2026-02-28T00:00:00Z",
    },
    {
      id: "mock-cf-5",
      entityId: "mock-2",
      entityName: "Hartwell Family Trust",
      type: "income",
      category: "Dividends",
      amount: 220_000,
      currency: "USD",
      description: "Terrace REIT Q4 dividend",
      occurredAt: "2026-02-15T00:00:00Z",
    },
    {
      id: "mock-cf-6",
      entityId: "mock-1",
      entityName: "Hartwell Capital LLC",
      type: "tax-payment",
      category: "Tax",
      amount: 105_000,
      currency: "USD",
      description: "Q4 federal estimated tax payment",
      occurredAt: "2026-01-15T00:00:00Z",
    },
    {
      id: "mock-cf-7",
      entityId: "mock-3",
      entityName: "Hartwell Cayman LP",
      type: "income",
      category: "Interest",
      amount: 380_000,
      currency: "USD",
      description: "Private credit interest — Horizon Lending",
      occurredAt: "2026-01-10T00:00:00Z",
    },
    {
      id: "mock-cf-8",
      entityId: "mock-1",
      entityName: "Hartwell Capital LLC",
      type: "income",
      category: "Dividends",
      amount: 950_000,
      currency: "USD",
      description: "Portfolio company exit proceeds",
      occurredAt: "2025-12-20T00:00:00Z",
    },
    {
      id: "mock-cf-9",
      entityId: "mock-2",
      entityName: "Hartwell Family Trust",
      type: "expense",
      category: "Legal",
      amount: 45_000,
      currency: "USD",
      description: "Trust document revision — Orrick LLP",
      occurredAt: "2025-12-10T00:00:00Z",
    },
    {
      id: "mock-cf-10",
      entityId: "mock-3",
      entityName: "Hartwell Cayman LP",
      type: "capital-call",
      category: "Investment",
      amount: 320_000,
      currency: "USD",
      description: "Capital call — Meridian AI Series B",
      occurredAt: "2025-11-30T00:00:00Z",
    },
  ],
};

// ---------------------------------------------------------------------------
// Inflow / outflow type classification
// ---------------------------------------------------------------------------

const INFLOW_TYPES = new Set(["income", "distribution"]);
const OUTFLOW_TYPES = new Set(["expense", "capital-call", "tax-payment"]);

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
    const entities = await prisma.entity.findMany({
      where: { familyId, deletedAt: null },
      include: { cashFlows: { where: { deletedAt: null } } },
    });

    if (entities.length === 0) {
      return NextResponse.json(MOCK_RESPONSE);
    }

    // Per-entity summaries
    const entitySummaries = entities.map((e) => {
      const totalInflows = e.cashFlows
        .filter((cf) => INFLOW_TYPES.has(cf.type))
        .reduce((sum, cf) => sum + cf.amount, 0);
      const totalOutflows = e.cashFlows
        .filter((cf) => OUTFLOW_TYPES.has(cf.type))
        .reduce((sum, cf) => sum + cf.amount, 0);
      return {
        id: e.id,
        name: e.name,
        type: e.type,
        totalInflows,
        totalOutflows,
        net: totalInflows - totalOutflows,
      };
    });

    const totalNet = entitySummaries.reduce((sum, e) => sum + e.net, 0);

    // Collect all cash flows across entities, attach entityName, sort by occurredAt desc, take 20
    const entityNameById = Object.fromEntries(entities.map((e) => [e.id, e.name]));
    const allCashFlows = entities.flatMap((e) => e.cashFlows);
    allCashFlows.sort(
      (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
    );
    const recentCashFlows = allCashFlows.slice(0, 20).map((cf) => ({
      id: cf.id,
      entityId: cf.entityId,
      entityName: entityNameById[cf.entityId] ?? "",
      type: cf.type,
      category: cf.category ?? null,
      amount: cf.amount,
      currency: cf.currency,
      description: cf.description ?? "",
      occurredAt: cf.occurredAt,
    }));

    return NextResponse.json({
      entities: entitySummaries,
      totalNet,
      recentCashFlows,
      _mock: false,
    });
  } catch {
    // DB error — return mock so UI stays populated in demo mode
    return NextResponse.json(MOCK_RESPONSE);
  }
}
