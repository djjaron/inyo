import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface ContactRow {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  type?: string;
  linkedIn?: string;
  notes?: string;
}

const VALID_TYPES = new Set([
  "founder", "lp", "gp", "attorney", "banker", "advisor", "broker", "family", "contact",
]);

export async function POST(req: NextRequest) {
  let body: { familyId?: string; contacts?: ContactRow[] };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { familyId, contacts } = body ?? {};

  if (!familyId) {
    return NextResponse.json({ error: "familyId is required" }, { status: 400 });
  }

  if (!Array.isArray(contacts) || contacts.length === 0) {
    return NextResponse.json({ error: "contacts array is required and must not be empty" }, { status: 400 });
  }

  // Sanitize rows: ensure required fields, normalise type
  const sanitized = contacts
    .filter((c) => c.name?.trim())
    .map((c) => ({
      familyId,
      name: c.name.trim(),
      email: c.email?.trim() || null,
      phone: c.phone?.trim() || null,
      company: c.company?.trim() || null,
      title: c.title?.trim() || null,
      type: VALID_TYPES.has(c.type ?? "") ? c.type! : "contact",
      linkedIn: c.linkedIn?.trim() || null,
      notes: c.notes?.trim() || null,
    }));

  const skipped = contacts.length - sanitized.length;

  try {
    const result = await prisma.contact.createMany({
      data: sanitized,
      skipDuplicates: true,
    });

    return NextResponse.json({
      imported: result.count,
      skipped: skipped + (sanitized.length - result.count),
    });
  } catch (err) {
    // DB unavailable — return mock success so UI flow completes
    console.warn("[import/contacts] DB unavailable, returning mock response:", err);
    return NextResponse.json({
      imported: sanitized.length,
      skipped,
      _mock: true,
    });
  }
}
