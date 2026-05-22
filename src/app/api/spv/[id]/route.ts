import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MOCK_SPV = {
  id: "spv_mock_1",
  familyId: "family_demo",
  dealId: "deal_mock_1",
  name: "Meridian AI SPV I",
  status: "active",
  spvType: "syndicate",
  sydecarId: "sydecar_demo_1",
  sydecarUrl: "https://app.sydecar.io/spvs/sydecar_demo_1",
  targetRaise: 2_000_000,
  totalCommitted: 1_500_000,
  managementFee: 2,
  carry: 20,
  closingDate: new Date("2025-06-30"),
  investmentType: "safe",
  description: "Co-investment alongside lead in Meridian AI Series B.",
  launchedAt: new Date("2025-04-15"),
  deletedAt: null,
  createdAt: new Date("2025-04-10"),
  updatedAt: new Date("2025-04-15"),
  investors: [],
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const spv = await prisma.sPV.findUnique({
      where: { id, deletedAt: null },
      include: { investors: true },
    });

    if (!spv) {
      return NextResponse.json({ error: "SPV not found" }, { status: 404 });
    }

    return NextResponse.json({ spv });
  } catch {
    return NextResponse.json({ spv: { ...MOCK_SPV, id }, _mock: true });
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

  const allowedFields = [
    "name",
    "status",
    "spvType",
    "targetRaise",
    "totalCommitted",
    "managementFee",
    "carry",
    "closingDate",
    "investmentType",
    "description",
    "sydecarId",
    "sydecarUrl",
    "launchedAt",
    "dealId",
  ] as const;

  const data: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) {
      if (field === "closingDate" || field === "launchedAt") {
        data[field] = body[field] ? new Date(body[field] as string) : null;
      } else {
        data[field] = body[field];
      }
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  try {
    const spv = await prisma.sPV.update({
      where: { id },
      data,
      include: { investors: true },
    });
    return NextResponse.json({ spv });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Record to update not found")) {
      return NextResponse.json({ error: "SPV not found" }, { status: 404 });
    }
    return NextResponse.json({
      spv: { ...MOCK_SPV, id, ...data, updatedAt: new Date() },
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
    const spv = await prisma.sPV.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return NextResponse.json({ success: true, deletedAt: spv.deletedAt });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Record to update not found")) {
      return NextResponse.json({ error: "SPV not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
  }
}
