import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const FALLBACK_DEADLINES = [
  { id: "d1", label: "Q2 Federal Estimated Payment", eventDate: "2026-06-16", amount: 485000, status: "upcoming", type: "deadline" },
  { id: "d2", label: "State Tax Returns — CA, NY, DE", eventDate: "2026-10-15", amount: null, status: "upcoming", type: "deadline" },
  { id: "d3", label: "Foundation 990-PF Filing", eventDate: "2026-11-15", amount: null, status: "upcoming", type: "deadline" },
  { id: "d4", label: "FBAR Foreign Account Report", eventDate: "2026-10-15", amount: null, status: "upcoming", type: "deadline" },
];

const FALLBACK_K1S = [
  { id: "k1", entityName: "Hartwell Cayman LP", year: 2025, status: "received", amount: 2840000, filed: false, type: "k1" },
  { id: "k2", entityName: "Arcadia Energy Fund II", year: 2025, status: "pending", amount: null, filed: false, type: "k1" },
  { id: "k3", entityName: "Meridian AI SPV", year: 2025, status: "received", amount: -120000, filed: false, type: "k1" },
  { id: "k4", entityName: "Terrace REIT", year: 2025, status: "received", amount: 380000, filed: true, type: "k1" },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const familyId = searchParams.get("familyId");
  const type = searchParams.get("type"); // "deadline" or "k1"

  if (!familyId) {
    if (type === "k1") return NextResponse.json({ events: FALLBACK_K1S });
    return NextResponse.json({ events: FALLBACK_DEADLINES });
  }

  try {
    const events = await prisma.taxEvent.findMany({
      where: {
        familyId,
        deletedAt: null,
        ...(type ? { type } : {}),
      },
      orderBy: { eventDate: "asc" },
    });
    if (events.length > 0) return NextResponse.json({ events });
    // Fall back to hardcoded data
    if (type === "k1") return NextResponse.json({ events: FALLBACK_K1S });
    return NextResponse.json({ events: FALLBACK_DEADLINES });
  } catch {
    if (type === "k1") return NextResponse.json({ events: FALLBACK_K1S });
    return NextResponse.json({ events: FALLBACK_DEADLINES });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { familyId, label, eventDate, type, amount, entityName, year, status } = body;

    if (!familyId || !label || !eventDate || !type) {
      return NextResponse.json({ error: "familyId, label, eventDate, type are required" }, { status: 400 });
    }

    const event = await prisma.taxEvent.create({
      data: {
        familyId,
        label,
        eventDate: new Date(eventDate),
        type,
        amount: amount != null ? parseFloat(amount) : null,
        entityName: entityName ?? null,
        year: year != null ? parseInt(year) : null,
        status: status ?? "upcoming",
      },
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create tax event" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  try {
    await prisma.taxEvent.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete tax event" }, { status: 500 });
  }
}
