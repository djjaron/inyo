import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MOCK_DEALS = [
  {
    id: "deal_mock_1",
    familyId: "family_demo",
    entityId: null,
    name: "Meridian AI – Series B",
    company: "Meridian AI",
    sector: "Enterprise AI",
    stage: "series-b",
    status: "diligence",
    capitalAsk: 12_000_000,
    valuation: 85_000_000,
    ownership: null,
    description:
      "Vertical LLM infrastructure for enterprise compliance teams. 3.2x ARR growth YoY.",
    sourceType: "network",
    sourceContact: "Marcus Webb",
    dealScore: 81,
    icMemoUrl: null,
    dataRoomUrl: null,
    pitchDeckUrl: null,
    investedAt: null,
    createdAt: new Date("2025-03-10"),
    updatedAt: new Date("2025-04-01"),
  },
  {
    id: "deal_mock_2",
    familyId: "family_demo",
    entityId: null,
    name: "Axiom Logistics – Seed",
    company: "Axiom Logistics",
    sector: "Supply Chain",
    stage: "seed",
    status: "reviewing",
    capitalAsk: 3_000_000,
    valuation: 15_000_000,
    ownership: null,
    description:
      "AI-powered cross-border freight optimization. Pre-revenue, strong pilot pipeline.",
    sourceType: "inbound",
    sourceContact: null,
    dealScore: 62,
    icMemoUrl: null,
    dataRoomUrl: null,
    pitchDeckUrl: null,
    investedAt: null,
    createdAt: new Date("2025-04-05"),
    updatedAt: new Date("2025-04-05"),
  },
  {
    id: "deal_mock_3",
    familyId: "family_demo",
    entityId: null,
    name: "ClearReg – Growth",
    company: "ClearReg",
    sector: "RegTech",
    stage: "growth",
    status: "invested",
    capitalAsk: 25_000_000,
    valuation: 200_000_000,
    ownership: 4.2,
    description: "Regulatory reporting automation for financial services.",
    sourceType: "lp-intro",
    sourceContact: "Jennifer Park",
    dealScore: 88,
    icMemoUrl: null,
    dataRoomUrl: null,
    pitchDeckUrl: null,
    investedAt: new Date("2024-09-15"),
    createdAt: new Date("2024-07-01"),
    updatedAt: new Date("2024-09-15"),
  },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const familyId = searchParams.get("familyId");
  const status = searchParams.get("status");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = 20;

  try {
    const where: Record<string, unknown> = {};
    if (familyId) where.familyId = familyId;
    if (status) where.status = status;

    const [deals, total] = await Promise.all([
      prisma.deal.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.deal.count({ where }),
    ]);

    return NextResponse.json({
      deals,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch {
    // DB unavailable — return mock data
    let filtered = MOCK_DEALS;
    if (familyId) filtered = filtered.filter((d) => d.familyId === familyId);
    if (status) filtered = filtered.filter((d) => d.status === status);

    const start = (page - 1) * pageSize;
    const paginated = filtered.slice(start, start + pageSize);

    return NextResponse.json({
      deals: paginated,
      pagination: {
        page,
        pageSize,
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / pageSize),
      },
      _mock: true,
    });
  }
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { familyId, name, company } = body as {
    familyId?: string;
    name?: string;
    company?: string;
    [key: string]: unknown;
  };

  if (!familyId || !name || !company) {
    return NextResponse.json(
      { error: "familyId, name, and company are required" },
      { status: 400 }
    );
  }

  try {
    const deal = await prisma.deal.create({
      data: {
        familyId: familyId as string,
        name: name as string,
        company: company as string,
        entityId: (body.entityId as string) ?? null,
        sector: (body.sector as string) ?? null,
        stage: (body.stage as string) ?? null,
        status: (body.status as string) ?? "inbound",
        capitalAsk: body.capitalAsk != null ? Number(body.capitalAsk) : null,
        valuation: body.valuation != null ? Number(body.valuation) : null,
        description: (body.description as string) ?? null,
        sourceType: (body.sourceType as string) ?? null,
        sourceContact: (body.sourceContact as string) ?? null,
        pitchDeckUrl: (body.pitchDeckUrl as string) ?? null,
        dataRoomUrl: (body.dataRoomUrl as string) ?? null,
      },
    });
    return NextResponse.json({ deal }, { status: 201 });
  } catch {
    // DB unavailable — return a mock created deal
    const mockDeal = {
      id: `deal_mock_${Date.now()}`,
      familyId,
      name,
      company,
      sector: body.sector ?? null,
      stage: body.stage ?? null,
      status: body.status ?? "inbound",
      capitalAsk: body.capitalAsk ?? null,
      valuation: body.valuation ?? null,
      description: body.description ?? null,
      sourceType: body.sourceType ?? null,
      sourceContact: body.sourceContact ?? null,
      dealScore: null,
      icMemoUrl: null,
      dataRoomUrl: null,
      pitchDeckUrl: null,
      investedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      _mock: true,
    };
    return NextResponse.json({ deal: mockDeal }, { status: 201 });
  }
}
