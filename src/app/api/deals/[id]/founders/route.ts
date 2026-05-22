import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Verify deal exists
    const deal = await prisma.deal.findUnique({ where: { id } });
    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    const founders = await prisma.founder.findMany({
      where: { dealId: id, deletedAt: null },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ founders });
  } catch {
    return NextResponse.json({ error: "Failed to fetch founders" }, { status: 500 });
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

  const { name, title, linkedinUrl, bio } = body as {
    name?: string;
    title?: string;
    linkedinUrl?: string;
    bio?: string;
  };

  if (!name || typeof name !== "string" || name.trim() === "") {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  try {
    // Verify deal exists
    const deal = await prisma.deal.findUnique({ where: { id } });
    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    const founder = await prisma.founder.create({
      data: {
        dealId: id,
        name: name.trim(),
        title: (title as string) ?? null,
        linkedinUrl: (linkedinUrl as string) ?? null,
        bio: (bio as string) ?? null,
      },
    });

    return NextResponse.json({ founder }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create founder" }, { status: 500 });
  }
}
