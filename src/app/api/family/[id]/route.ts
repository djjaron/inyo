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
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const allowed = ["name", "aum", "currency"] as const;
  const data: Partial<{ name: string; aum: number | null; currency: string }> = {};
  for (const key of allowed) {
    if (key in body) (data as Record<string, unknown>)[key] = body[key];
  }

  try {
    const family = await prisma.family.update({ where: { id }, data });
    return NextResponse.json({ family });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
