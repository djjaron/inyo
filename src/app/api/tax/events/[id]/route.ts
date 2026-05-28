import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await req.json();
    const { filed } = body;

    const event = await prisma.taxEvent.update({
      where: { id },
      data: { filed },
    });

    return NextResponse.json({ event });
  } catch {
    return NextResponse.json({ error: "Failed to update tax event" }, { status: 500 });
  }
}
