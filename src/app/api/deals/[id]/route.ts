import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MOCK_DEAL = {
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
  documents: [],
  aiAnalyses: [
    {
      id: "analysis_mock_1",
      agentType: "deal-flow",
      status: "completed",
      model: "claude-opus-4-7-20251101",
      tokensUsed: 1842,
      createdAt: new Date("2025-04-01"),
      output: {
        score: 81,
        recommendation: "pursue",
        summary:
          "Meridian AI is building vertical LLM infrastructure for enterprise compliance teams.",
      },
    },
  ],
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const deal = await prisma.deal.findUnique({
      where: { id },
      include: {
        documents: true,
        aiAnalyses: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    return NextResponse.json({ deal });
  } catch {
    // DB unavailable — return mock deal (id matched or first)
    return NextResponse.json({ deal: { ...MOCK_DEAL, id }, _mock: true });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Whitelist updatable fields
  const allowedFields = [
    "status",
    "name",
    "company",
    "sector",
    "stage",
    "capitalAsk",
    "valuation",
    "ownership",
    "description",
    "sourceType",
    "sourceContact",
    "dealScore",
    "icMemoUrl",
    "dataRoomUrl",
    "pitchDeckUrl",
    "investedAt",
    "entityId",
  ] as const;

  const data: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) {
      data[field] = body[field];
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  try {
    const deal = await prisma.deal.update({
      where: { id },
      data,
    });
    return NextResponse.json({ deal });
  } catch (err: unknown) {
    // Handle not-found vs DB-unavailable
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Record to update not found")) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }
    // DB unavailable — return mock updated deal
    return NextResponse.json({
      deal: { ...MOCK_DEAL, id, ...data, updatedAt: new Date() },
      _mock: true,
    });
  }
}
