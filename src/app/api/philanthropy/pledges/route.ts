import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const FALLBACK_PLEDGES = [
  { id: "p1", familyId: "demo", org: "Stanford GSB", amount: 2000000, remaining: 1500000, deadline: "2028-12-31", status: "active" },
  { id: "p2", familyId: "demo", org: "New York Public Library", amount: 500000, remaining: 300000, deadline: "2027-06-30", status: "active" },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const familyId = searchParams.get("familyId");
  if (!familyId) return NextResponse.json({ pledges: FALLBACK_PLEDGES });
  try {
    const pledges = await prisma.pledge.findMany({
      where: { familyId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ pledges: pledges.length > 0 ? pledges : FALLBACK_PLEDGES });
  } catch {
    return NextResponse.json({ pledges: FALLBACK_PLEDGES });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { familyId, org, amount, remaining, deadline, status } = body;
    if (!familyId || !org || amount == null || remaining == null) {
      return NextResponse.json({ error: "familyId, org, amount, remaining are required" }, { status: 400 });
    }
    const pledge = await prisma.pledge.create({
      data: {
        familyId,
        org,
        amount: parseFloat(amount),
        remaining: parseFloat(remaining),
        deadline: deadline ? new Date(deadline) : null,
        status: status ?? "active",
      },
    });
    return NextResponse.json({ pledge }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create pledge" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  try {
    await prisma.pledge.update({ where: { id }, data: { deletedAt: new Date() } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete pledge" }, { status: 500 });
  }
}
