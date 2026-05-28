import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MOCK_INTERACTIONS = [
  { id: "i1", type: "meeting", subject: "IC presentation — Phalanx Series C", occurredAt: "2026-05-19", contact: { name: "Carlos Reyes" } },
  { id: "i2", type: "email", subject: "Q1 business update + data room access", occurredAt: "2026-05-14", contact: { name: "Sarah Chen" } },
  { id: "i3", type: "call", subject: "Deal flow — 3 new opportunities", occurredAt: "2026-05-07", contact: { name: "Olivia Park" } },
  { id: "i4", type: "email", subject: "NDA review for new portfolio deal", occurredAt: "2026-05-07", contact: { name: "Patricia Mills" } },
  { id: "i5", type: "meeting", subject: "LP update + co-investment discussion", occurredAt: "2026-04-30", contact: { name: "David Kwon" } },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const familyId = searchParams.get("familyId");

  try {
    const interactions = await prisma.interaction.findMany({
      where: { contact: { familyId: familyId ?? undefined } },
      include: { contact: { select: { name: true } } },
      orderBy: { occurredAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ interactions });
  } catch {
    return NextResponse.json({ interactions: MOCK_INTERACTIONS, _mock: true });
  }
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { contactId, type, subject, notes, outcome, occurredAt } = body as {
    contactId?: string;
    type?: string;
    subject?: string;
    notes?: string;
    outcome?: string;
    occurredAt?: string;
  };

  if (!contactId || !type) {
    return NextResponse.json({ error: "contactId and type are required" }, { status: 400 });
  }

  const occurredAtDate = occurredAt ? new Date(occurredAt) : new Date();

  try {
    const interaction = await prisma.interaction.create({
      data: {
        contactId,
        type,
        subject: subject ?? null,
        notes: notes ?? null,
        outcome: outcome ?? null,
        occurredAt: occurredAtDate,
      },
    });

    return NextResponse.json({ interaction }, { status: 201 });
  } catch {
    const interaction = {
      id: `mock-${Date.now()}`,
      contactId,
      type,
      subject: subject ?? null,
      notes: notes ?? null,
      outcome: outcome ?? null,
      occurredAt: occurredAtDate.toISOString(),
      createdAt: new Date().toISOString(),
      _mock: true,
    };

    return NextResponse.json({ interaction, _mock: true }, { status: 201 });
  }
}
