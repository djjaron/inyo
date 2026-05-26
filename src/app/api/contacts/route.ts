import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MOCK_CONTACTS = [
  {
    id: "contact_mock_1",
    familyId: "family_demo",
    name: "Sarah Chen",
    email: "sarah.chen@meridianai.com",
    phone: null,
    company: "Meridian AI",
    title: "CEO & Co-Founder",
    type: "founder",
    linkedIn: "https://linkedin.com/in/sarahchen",
    notes: "Ex-Palantir, Stanford CS. Prior exit to Salesforce ($180M).",
    lastContactAt: new Date("2025-04-12"),
    introducedBy: "Marcus Webb",
    warmPathNotes: "Met at a16z founder dinner. Strong mutual connection.",
    investorType: null,
    assetClasses: [] as string[],
    checkSizeMin: null,
    checkSizeMax: null,
    portfolioNotes: null,
    lastDealTogether: null,
    createdAt: new Date("2025-03-10"),
    updatedAt: new Date("2025-04-12"),
  },
  {
    id: "contact_mock_2",
    familyId: "family_demo",
    name: "Jennifer Park",
    email: "jpark@sequoiacap.com",
    phone: null,
    company: "Sequoia Capital",
    title: "Partner",
    type: "gp",
    linkedIn: "https://linkedin.com/in/jenniferpark",
    notes: "Introduced ClearReg deal. Strong co-investor relationship.",
    lastContactAt: new Date("2025-03-28"),
    introducedBy: null,
    warmPathNotes: "Quarterly LP meeting attendee. Pre-existing relationship.",
    investorType: "vc" as string | null,
    assetClasses: ["tech"] as string[],
    checkSizeMin: 2_000_000 as number | null,
    checkSizeMax: 20_000_000 as number | null,
    portfolioNotes: "Focuses on Series A/B software companies." as string | null,
    lastDealTogether: "ClearReg" as string | null,
    createdAt: new Date("2023-01-15"),
    updatedAt: new Date("2025-03-28"),
  },
  {
    id: "contact_mock_3",
    familyId: "family_demo",
    name: "David Kimura",
    email: "dkimura@wilsonlaw.com",
    phone: "+1-415-555-0190",
    company: "Wilson Sonsini",
    title: "Partner, M&A",
    type: "attorney",
    linkedIn: null,
    notes: "Primary outside counsel for deal legal review and fund docs.",
    lastContactAt: new Date("2025-04-01"),
    introducedBy: null,
    warmPathNotes: null,
    investorType: null,
    assetClasses: [] as string[],
    checkSizeMin: null,
    checkSizeMax: null,
    portfolioNotes: null,
    lastDealTogether: null,
    createdAt: new Date("2022-06-01"),
    updatedAt: new Date("2025-04-01"),
  },
  {
    id: "contact_mock_4",
    familyId: "family_demo",
    name: "Amanda Torres",
    email: "amanda@vantage.vc",
    phone: null,
    company: "Vantage Ventures",
    title: "Principal",
    type: "gp",
    linkedIn: "https://linkedin.com/in/amandatorres",
    notes: "Lead investor in Axiom Logistics deal. Co-invest relationship.",
    lastContactAt: new Date("2025-04-05"),
    introducedBy: "Sarah Chen",
    warmPathNotes: "Sarah Chen intro. Active co-investor in seed deals.",
    investorType: "vc" as string | null,
    assetClasses: ["tech", "pe"] as string[],
    checkSizeMin: 500_000 as number | null,
    checkSizeMax: 5_000_000 as number | null,
    portfolioNotes: "Seed-stage generalist with tech and PE focus." as string | null,
    lastDealTogether: "Axiom Logistics" as string | null,
    createdAt: new Date("2025-04-05"),
    updatedAt: new Date("2025-04-05"),
  },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const familyId = searchParams.get("familyId");
  const type = searchParams.get("type");

  try {
    const where: Record<string, unknown> = { deletedAt: null };
    if (familyId) where.familyId = familyId;
    if (type) where.type = type;

    const contacts = await prisma.contact.findMany({
      where,
      orderBy: { lastContactAt: "desc" },
    });

    if (contacts.length === 0) {
      let filtered = MOCK_CONTACTS;
      if (type) filtered = filtered.filter((c) => c.type === type);
      return NextResponse.json({ contacts: filtered, _mock: true });
    }

    return NextResponse.json({ contacts });
  } catch {
    let filtered = MOCK_CONTACTS;
    if (familyId) filtered = filtered.filter((c) => c.familyId === familyId);
    if (type) filtered = filtered.filter((c) => c.type === type);

    return NextResponse.json({ contacts: filtered, _mock: true });
  }
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { familyId, name } = body as {
    familyId?: string;
    name?: string;
    [key: string]: unknown;
  };

  if (!familyId || !name) {
    return NextResponse.json(
      { error: "familyId and name are required" },
      { status: 400 }
    );
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prismaAny = prisma as any;
    const contact = await prismaAny.contact.create({
      data: {
        familyId: familyId as string,
        name: name as string,
        email: (body.email as string) ?? null,
        phone: (body.phone as string) ?? null,
        company: (body.company as string) ?? null,
        title: (body.title as string) ?? null,
        type: (body.type as string) ?? "contact",
        linkedIn: (body.linkedIn as string) ?? null,
        notes: (body.notes as string) ?? null,
        lastContactAt: body.lastContactAt
          ? new Date(body.lastContactAt as string)
          : null,
        introducedBy: (body.introducedBy as string) ?? null,
        warmPathNotes: (body.warmPathNotes as string) ?? null,
        investorType: (body.investorType as string) ?? null,
        assetClasses: Array.isArray(body.assetClasses) ? (body.assetClasses as string[]) : [],
        checkSizeMin: body.checkSizeMin != null ? Number(body.checkSizeMin) : null,
        checkSizeMax: body.checkSizeMax != null ? Number(body.checkSizeMax) : null,
        portfolioNotes: (body.portfolioNotes as string) ?? null,
        lastDealTogether: (body.lastDealTogether as string) ?? null,
      },
    });
    return NextResponse.json({ contact }, { status: 201 });
  } catch {
    const mockContact = {
      id: `contact_mock_${Date.now()}`,
      ...body,
      type: body.type ?? "contact",
      assetClasses: Array.isArray(body.assetClasses) ? body.assetClasses : [],
      createdAt: new Date(),
      updatedAt: new Date(),
      _mock: true,
    };
    return NextResponse.json({ contact: mockContact }, { status: 201 });
  }
}
