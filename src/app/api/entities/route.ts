import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const familyId = searchParams.get("familyId");

  if (!familyId) {
    return NextResponse.json(
      { error: "familyId query param is required" },
      { status: 400 }
    );
  }

  try {
    const entities = await prisma.entity.findMany({
      where: { familyId, deletedAt: null },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ entities });
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

  const { familyId, name, type } = body as {
    familyId?: string;
    name?: string;
    type?: string;
    [key: string]: unknown;
  };

  if (!familyId || !name || !type) {
    return NextResponse.json(
      { error: "familyId, name, and type are required" },
      { status: 400 }
    );
  }

  try {
    const entity = await prisma.entity.create({
      data: {
        familyId: familyId as string,
        name: name as string,
        type: type as string,
        jurisdiction: (body.jurisdiction as string) ?? null,
        description: (body.description as string) ?? null,
      },
    });
    return NextResponse.json({ entity }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
  }
}
