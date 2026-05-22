import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; founderId: string }> }
) {
  const { id, founderId } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const allowedFields = ["name", "title", "linkedinUrl", "bio"] as const;

  const data: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) {
      data[field] = body[field];
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  // Validate name if provided
  if ("name" in data && (typeof data.name !== "string" || (data.name as string).trim() === "")) {
    return NextResponse.json({ error: "name cannot be empty" }, { status: 400 });
  }

  try {
    // Verify founder belongs to the specified deal
    const existing = await prisma.founder.findUnique({ where: { id: founderId } });
    if (!existing) {
      return NextResponse.json({ error: "Founder not found" }, { status: 404 });
    }
    if (existing.dealId !== id) {
      return NextResponse.json({ error: "Founder not found" }, { status: 404 });
    }

    const founder = await prisma.founder.update({
      where: { id: founderId },
      data,
    });

    return NextResponse.json({ founder });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Record to update not found")) {
      return NextResponse.json({ error: "Founder not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to update founder" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; founderId: string }> }
) {
  const { id, founderId } = await params;

  try {
    // Verify founder belongs to the specified deal
    const existing = await prisma.founder.findUnique({ where: { id: founderId } });
    if (!existing) {
      return NextResponse.json({ error: "Founder not found" }, { status: 404 });
    }
    if (existing.dealId !== id) {
      return NextResponse.json({ error: "Founder not found" }, { status: 404 });
    }

    await prisma.founder.update({
      where: { id: founderId },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Record to update not found")) {
      return NextResponse.json({ error: "Founder not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to delete founder" }, { status: 500 });
  }
}
