import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const contact = await (prisma as any).contact.findUnique({ where: { id, deletedAt: null } });
    if (!contact) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ contact });
  } catch {
    return NextResponse.json({ error: "DB unavailable" }, { status: 503 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Build update payload from allowed fields
  const data: Record<string, unknown> = {};
  const str = (k: string) => { if (k in body) data[k] = body[k] != null ? String(body[k]) : null; };
  const num = (k: string) => { if (k in body) data[k] = body[k] != null ? Number(body[k]) : null; };

  str("name");
  str("email");
  str("phone");
  str("company");
  str("title");
  str("type");
  str("linkedIn");
  str("notes");
  str("introducedBy");
  str("warmPathNotes");
  str("investorType");
  str("portfolioNotes");
  str("lastDealTogether");
  num("checkSizeMin");
  num("checkSizeMax");

  if ("assetClasses" in body) {
    data.assetClasses = Array.isArray(body.assetClasses) ? body.assetClasses : [];
  }
  if ("lastContactAt" in body) {
    data.lastContactAt = body.lastContactAt ? new Date(body.lastContactAt as string) : null;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const contact = await (prisma as any).contact.update({ where: { id }, data });
    try {
      await logAudit({
        familyId: contact.familyId ?? null,
        action: "update",
        resourceType: "contact",
        resourceId: id,
        resourceName: contact.name ?? null,
      });
    } catch {
      // best-effort
    }
    return NextResponse.json({ contact });
  } catch (e) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((e as any)?.code === "P2025") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    // Mock response when DB is unavailable
    return NextResponse.json({
      contact: { id, ...body, updatedAt: new Date(), _mock: true },
    });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const contact = await (prisma as any).contact.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    try {
      await logAudit({
        familyId: contact.familyId ?? null,
        action: "delete",
        resourceType: "contact",
        resourceId: id,
        resourceName: contact.name ?? null,
      });
    } catch {
      // best-effort
    }
    return NextResponse.json({ contact });
  } catch (e) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((e as any)?.code === "P2025") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ contact: { id, deletedAt: new Date(), _mock: true } });
  }
}
