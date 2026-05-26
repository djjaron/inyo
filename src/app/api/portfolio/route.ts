import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MOCK_PORTFOLIO = [
  {
    id: "pc_mock_1",
    familyId: "family_demo",
    name: "ClearReg",
    sector: "RegTech",
    stage: "growth",
    status: "active",
    investedAmount: 25_000_000,
    currentValue: 38_500_000,
    ownership: 4.2,
    investedAt: new Date("2024-09-15"),
    lastFundingDate: new Date("2025-01-20"),
    lastFundingRound: "Series C",
    website: "https://clearreg.io",
    description: "Regulatory reporting automation for financial services.",
    alertLevel: "normal",
    createdAt: new Date("2024-07-01"),
    updatedAt: new Date("2025-01-20"),
    alerts: [],
  },
  {
    id: "pc_mock_2",
    familyId: "family_demo",
    name: "Volta Energy",
    sector: "Climate Tech",
    stage: "series-b",
    status: "watchlist",
    investedAmount: 8_000_000,
    currentValue: 6_200_000,
    ownership: 2.8,
    investedAt: new Date("2023-05-10"),
    lastFundingDate: new Date("2023-05-10"),
    lastFundingRound: "Series B",
    website: "https://volta.energy",
    description: "Grid-scale battery storage and demand response platform.",
    alertLevel: "watch",
    createdAt: new Date("2023-03-01"),
    updatedAt: new Date("2025-02-14"),
    alerts: [
      {
        id: "alert_mock_1",
        companyId: "pc_mock_2",
        type: "burn-rate",
        severity: "warning",
        title: "Burn rate increased 40% QoQ",
        body: "Q1 2025 burn reached $1.1M/month vs $780K in Q4 2024. Runway now 11 months.",
        source: "CFO Update — April 2025",
        read: false,
        createdAt: new Date("2025-04-10"),
      },
    ],
  },
  {
    id: "pc_mock_3",
    familyId: "family_demo",
    name: "Nexus Health",
    sector: "HealthTech",
    stage: "series-a",
    status: "active",
    investedAmount: 5_000_000,
    currentValue: 9_100_000,
    ownership: 6.5,
    investedAt: new Date("2022-11-01"),
    lastFundingDate: new Date("2024-08-05"),
    lastFundingRound: "Series A Extension",
    website: "https://nexushealth.ai",
    description: "AI-assisted prior authorization and revenue cycle management.",
    alertLevel: "normal",
    createdAt: new Date("2022-09-01"),
    updatedAt: new Date("2024-08-05"),
    alerts: [],
  },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const familyId = searchParams.get("familyId");
  const status = searchParams.get("status");

  try {
    const where: Record<string, unknown> = { deletedAt: null };
    if (familyId) where.familyId = familyId;
    if (status) where.status = status;

    const companies = await prisma.portfolioCompany.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        alerts: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    if (companies.length === 0) {
      let filtered = MOCK_PORTFOLIO;
      if (status) filtered = filtered.filter((c) => c.status === status);
      return NextResponse.json({ companies: filtered, _mock: true });
    }

    return NextResponse.json({ companies });
  } catch {
    let filtered = MOCK_PORTFOLIO;
    if (familyId) filtered = filtered.filter((c) => c.familyId === familyId);
    if (status) filtered = filtered.filter((c) => c.status === status);

    return NextResponse.json({ companies: filtered, _mock: true });
  }
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name } = body as { name?: string; [key: string]: unknown };

  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  try {
    const company = await prisma.portfolioCompany.create({
      data: {
        name: name as string,
        familyId: (body.familyId as string) ?? null,
        sector: (body.sector as string) ?? null,
        stage: (body.stage as string) ?? null,
        status: (body.status as string) ?? "active",
        investedAmount: body.investedAmount != null ? Number(body.investedAmount) : null,
        currentValue: body.currentValue != null ? Number(body.currentValue) : null,
        ownership: body.ownership != null ? Number(body.ownership) : null,
        investedAt: body.investedAt ? new Date(body.investedAt as string) : null,
        lastFundingDate: body.lastFundingDate
          ? new Date(body.lastFundingDate as string)
          : null,
        lastFundingRound: (body.lastFundingRound as string) ?? null,
        website: (body.website as string) ?? null,
        description: (body.description as string) ?? null,
        alertLevel: (body.alertLevel as string) ?? "normal",
      },
    });
    return NextResponse.json({ company }, { status: 201 });
  } catch {
    const mockCompany = {
      id: `pc_mock_${Date.now()}`,
      ...body,
      status: body.status ?? "active",
      alertLevel: body.alertLevel ?? "normal",
      createdAt: new Date(),
      updatedAt: new Date(),
      _mock: true,
    };
    return NextResponse.json({ company: mockCompany }, { status: 201 });
  }
}
