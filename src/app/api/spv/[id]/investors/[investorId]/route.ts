import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; investorId: string }> }
) {
  const { investorId } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const allowedFields = [
    "name",
    "email",
    "commitment",
    "status",
    "sydecarPersonId",
    "sydecarProfileId",
    "invitedAt",
    "committedAt",
    "fundedAt",
    "contactId",
  ] as const;

  const data: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) {
      if (field === "invitedAt" || field === "committedAt" || field === "fundedAt") {
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
    const investor = await prisma.sPVInvestor.update({
      where: { id: investorId },
      data,
    });
    return NextResponse.json({ investor });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Record to update not found")) {
      return NextResponse.json({ error: "Investor not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; investorId: string }> }
) {
  const { investorId } = await params;

  try {
    await prisma.sPVInvestor.delete({
      where: { id: investorId },
    });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Record to delete does not exist")) {
      return NextResponse.json({ error: "Investor not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
  }
}
