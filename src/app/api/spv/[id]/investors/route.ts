import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const investors = await prisma.sPVInvestor.findMany({
      where: { spvId: id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ investors });
  } catch {
    return NextResponse.json({ investors: [], _mock: true });
  }
}

export async function POST(
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

  const { name, email } = body as { name?: string; email?: string; [key: string]: unknown };

  if (!name || !email) {
    return NextResponse.json({ error: "name and email are required" }, { status: 400 });
  }

  try {
    const investor = await prisma.sPVInvestor.create({
      data: {
        spvId: id,
        name: name as string,
        email: email as string,
        contactId: (body.contactId as string) ?? null,
        commitment: body.commitment != null ? Number(body.commitment) : 0,
        status: "invited",
        invitedAt: new Date(),
      },
    });
    return NextResponse.json({ investor }, { status: 201 });
  } catch {
    const mockInvestor = {
      id: `spvinv_mock_${Date.now()}`,
      spvId: id,
      contactId: body.contactId ?? null,
      name,
      email,
      commitment: body.commitment ?? 0,
      status: "invited",
      sydecarPersonId: null,
      sydecarProfileId: null,
      invitedAt: new Date(),
      committedAt: null,
      fundedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      _mock: true,
    };
    return NextResponse.json({ investor: mockInvestor }, { status: 201 });
  }
}
