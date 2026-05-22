import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MOCK_SPVS = [
  {
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
    investors: [
      {
        id: "spvinv_mock_1",
        spvId: "spv_mock_1",
        contactId: null,
        name: "Parker Family Trust",
        email: "invest@parkertrust.com",
        commitment: 500_000,
        status: "funded",
        sydecarPersonId: "person_demo_1",
        sydecarProfileId: "profile_demo_1",
        invitedAt: new Date("2025-04-15"),
        committedAt: new Date("2025-04-18"),
        fundedAt: new Date("2025-04-25"),
        createdAt: new Date("2025-04-15"),
        updatedAt: new Date("2025-04-25"),
      },
    ],
  },
  {
    id: "spv_mock_2",
    familyId: "family_demo",
    dealId: null,
    name: "Secondary Buyout Fund I",
    status: "draft",
    spvType: "secondary",
    sydecarId: null,
    sydecarUrl: null,
    targetRaise: 5_000_000,
    totalCommitted: 0,
    managementFee: 1.5,
    carry: 15,
    closingDate: new Date("2025-09-01"),
    investmentType: "equity",
    description: "Secondary purchase of LP interests in mid-market PE fund.",
    launchedAt: null,
    deletedAt: null,
    createdAt: new Date("2025-05-01"),
    updatedAt: new Date("2025-05-01"),
    investors: [],
  },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const familyId = searchParams.get("familyId");

  try {
    const where: Record<string, unknown> = { deletedAt: null };
    if (familyId) where.familyId = familyId;

    const spvs = await prisma.sPV.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { investors: true },
    });

    return NextResponse.json({ spvs });
  } catch {
    let filtered = MOCK_SPVS;
    if (familyId) filtered = filtered.filter((s) => s.familyId === familyId);
    return NextResponse.json({ spvs: filtered, _mock: true });
  }
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { familyId, name } = body as { familyId?: string; name?: string; [key: string]: unknown };

  if (!familyId || !name) {
    return NextResponse.json({ error: "familyId and name are required" }, { status: 400 });
  }

  try {
    const spv = await prisma.sPV.create({
      data: {
        familyId: familyId as string,
        name: name as string,
        dealId: (body.dealId as string) ?? null,
        spvType: (body.spvType as string) ?? "syndicate",
        status: "draft",
        targetRaise: body.targetRaise != null ? Number(body.targetRaise) : null,
        managementFee: body.managementFee != null ? Number(body.managementFee) : 2,
        carry: body.carry != null ? Number(body.carry) : 20,
        closingDate: body.closingDate ? new Date(body.closingDate as string) : null,
        investmentType: (body.investmentType as string) ?? null,
        description: (body.description as string) ?? null,
      },
    });
    return NextResponse.json({ spv }, { status: 201 });
  } catch {
    const mockSpv = {
      id: `spv_mock_${Date.now()}`,
      familyId,
      dealId: body.dealId ?? null,
      name,
      status: "draft",
      spvType: body.spvType ?? "syndicate",
      sydecarId: null,
      sydecarUrl: null,
      targetRaise: body.targetRaise ?? null,
      totalCommitted: 0,
      managementFee: body.managementFee ?? 2,
      carry: body.carry ?? 20,
      closingDate: body.closingDate ?? null,
      investmentType: body.investmentType ?? null,
      description: body.description ?? null,
      launchedAt: null,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      investors: [],
      _mock: true,
    };
    return NextResponse.json({ spv: mockSpv }, { status: 201 });
  }
}
