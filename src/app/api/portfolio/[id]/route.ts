import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MOCK_COMPANY = {
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
  aiAnalyses: [],
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const company = await prisma.portfolioCompany.findUnique({
      where: { id, deletedAt: null },
      include: {
        alerts: { orderBy: { createdAt: "desc" } },
        aiAnalyses: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    return NextResponse.json({ company });
  } catch {
    // DB unavailable — return mock company
    return NextResponse.json({ company: { ...MOCK_COMPANY, id }, _mock: true });
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
    "currentValue",
    "alertLevel",
    "description",
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
    const company = await prisma.portfolioCompany.update({
      where: { id },
      data,
    });
    return NextResponse.json({ company });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Record to update not found")) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }
    // DB unavailable — return mock updated company
    return NextResponse.json({
      company: { ...MOCK_COMPANY, id, ...data, updatedAt: new Date() },
      _mock: true,
    });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await prisma.portfolioCompany.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Record to update not found")) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
  }
}
