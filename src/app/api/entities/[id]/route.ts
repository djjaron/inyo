import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

  const updateData: Record<string, unknown> = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.type !== undefined) updateData.type = body.type;
  if (body.jurisdiction !== undefined) updateData.jurisdiction = body.jurisdiction;
  if (body.description !== undefined) updateData.description = body.description;

  try {
    const entity = await prisma.entity.update({
      where: { id },
      data: updateData,
    });
    return NextResponse.json({ entity });
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Soft-delete the entity only — do not cascade-delete cashflows
    await prisma.entity.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
  }
}
