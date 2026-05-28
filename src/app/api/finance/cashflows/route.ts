import { NextRequest, NextResponse, after } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFamilyId } from "@/lib/family";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const familyId = searchParams.get("familyId");
  const entityId = searchParams.get("entityId");

  if (!familyId) {
    return NextResponse.json(
      { error: "familyId query param is required" },
      { status: 400 }
    );
  }

  try {
    const where: Record<string, unknown> = {
      entity: { familyId },
      deletedAt: null,
    };
    if (entityId) where.entityId = entityId;

    const cashFlows = await prisma.cashFlow.findMany({
      where,
      orderBy: { occurredAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ cashFlows });
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { familyId, entityId, type, amount, description, occurredAt } = body as {
    familyId?: string;
    entityId?: string;
    type?: string;
    amount?: unknown;
    description?: string;
    occurredAt?: string;
    [key: string]: unknown;
  };

  if (!familyId || !entityId || !type || amount == null || !description || !occurredAt) {
    return NextResponse.json(
      { error: "familyId, entityId, type, amount, description, and occurredAt are required" },
      { status: 400 }
    );
  }

  // Server-side familyId validation: if a Clerk session exists, verify it matches
  const sessionFamilyId = await getFamilyId();
  if (sessionFamilyId !== null && sessionFamilyId !== familyId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (sessionFamilyId === null) {
    console.warn("[cashflows POST] No Clerk session — allowing server-side call for familyId:", familyId);
  }

  try {
    const cashFlow = await prisma.cashFlow.create({
      data: {
        entityId: entityId as string,
        type: type as string,
        category: (body.category as string) ?? null,
        amount: Number(amount),
        currency: (body.currency as string) ?? "USD",
        description: description as string,
        occurredAt: new Date(occurredAt as string),
      },
    });

    // Audit log — best-effort, non-blocking
    after(async () => {
      const { logAudit } = await import("@/lib/audit");
      await logAudit({
        familyId: familyId as string,
        action: "create",
        resourceType: "cashflow",
        resourceId: cashFlow.id,
        resourceName: (description as string) ?? (type as string),
      });
    });

    return NextResponse.json({ cashFlow }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
  }
}
