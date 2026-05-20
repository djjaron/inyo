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

  const { status, reviewNote } = body as {
    status?: string;
    reviewNote?: string;
    [key: string]: unknown;
  };

  if (!status || !["approved", "rejected"].includes(status)) {
    return NextResponse.json(
      { error: "status must be 'approved' or 'rejected'" },
      { status: 400 }
    );
  }

  try {
    const approval = await prisma.approval.update({
      where: { id },
      data: {
        status,
        reviewedAt: new Date(),
        reviewNote: reviewNote ?? null,
      },
    });
    return NextResponse.json({ approval });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Record to update not found")) {
      return NextResponse.json({ error: "Approval not found" }, { status: 404 });
    }
    // DB unavailable — return mock response
    return NextResponse.json({
      approval: {
        id,
        status,
        reviewNote: reviewNote ?? null,
        reviewedAt: new Date(),
        updatedAt: new Date(),
        _mock: true,
      },
    });
  }
}
