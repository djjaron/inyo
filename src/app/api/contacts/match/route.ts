import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Map deal sector strings to assetClass tokens
function sectorToAssetClasses(sector: string): string[] {
  const s = sector.toLowerCase();
  const matches: string[] = [];
  if (/ai|saas|software|tech|fintech|cyber|cloud|data|machine/.test(s)) matches.push("tech");
  if (/real.?estate|proptech|housing|reit|property/.test(s)) matches.push("real-estate");
  if (/sport|esport|gaming|athlet/.test(s)) matches.push("sports");
  if (/credit|debt|lending|loan|fixed.?income/.test(s)) matches.push("credit");
  if (/pe|private.?equity|buyout|growth|lbo/.test(s)) matches.push("pe");
  if (matches.length === 0) matches.push("other");
  return matches;
}

interface ScoringContact {
  assetClasses: string[];
  checkSizeMin: number | null;
  checkSizeMax: number | null;
  lastContactAt: Date | null;
  lastDealTogether: string | null;
}

function scoreContact(
  contact: ScoringContact,
  sectorClasses: string[],
  amount?: number,
): number {
  let score = 0;

  // Asset class overlap → +3
  const hasClassMatch = contact.assetClasses.some((cls) => sectorClasses.includes(cls));
  if (hasClassMatch) score += 3;

  // Check size overlap → +2
  if (amount != null && amount > 0) {
    const min = contact.checkSizeMin ?? 0;
    const max = contact.checkSizeMax ?? Infinity;
    if (amount >= min && amount <= max) score += 2;
  }

  // Recent contact (within 90 days) → +1
  if (contact.lastContactAt) {
    const diffMs = Date.now() - new Date(contact.lastContactAt).getTime();
    const diffDays = diffMs / 86_400_000;
    if (diffDays <= 90) score += 1;
  }

  // Prior deal together → +2
  if (contact.lastDealTogether) score += 2;

  return score;
}

const MOCK_MATCHES = [
  {
    id: "mock-c1",
    name: "James Thornton",
    company: "Thornton Capital",
    title: "Managing Partner",
    linkedIn: null,
    investorType: "family-office",
    assetClasses: ["tech", "pe"],
    checkSizeMin: 5_000_000,
    checkSizeMax: 25_000_000,
    score: 8,
    lastContactAt: "2026-03-10T00:00:00Z",
  },
  {
    id: "mock-c2",
    name: "Priya Mehta",
    company: "Sequoia Capital",
    title: "Partner",
    linkedIn: null,
    investorType: "vc",
    assetClasses: ["tech"],
    checkSizeMin: 2_000_000,
    checkSizeMax: 15_000_000,
    score: 7,
    lastContactAt: "2026-04-22T00:00:00Z",
  },
  {
    id: "mock-c3",
    name: "Robert Caine",
    company: "Caine Family Office",
    title: "CIO",
    linkedIn: null,
    investorType: "family-office",
    assetClasses: ["tech", "real-estate", "credit"],
    checkSizeMin: 1_000_000,
    checkSizeMax: 10_000_000,
    score: 6,
    lastContactAt: "2026-01-15T00:00:00Z",
  },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const familyId = searchParams.get("familyId");
  const sector = searchParams.get("sector") ?? "";
  // stage accepted for future scoring; not used in current logic
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _stage = searchParams.get("stage");
  const amount = searchParams.get("amount") ? parseFloat(searchParams.get("amount")!) : undefined;

  const sectorClasses = sector ? sectorToAssetClasses(sector) : ["tech"];

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prismaAny = prisma as any;
    const contacts = await prismaAny.contact.findMany({
      where: {
        ...(familyId ? { familyId } : {}),
        OR: [
          { type: { in: ["co-investor", "lp", "gp", "advisor"] } },
          { investorType: { not: null } },
        ],
      },
      select: {
        id: true,
        name: true,
        company: true,
        title: true,
        linkedIn: true,
        investorType: true,
        assetClasses: true,
        checkSizeMin: true,
        checkSizeMax: true,
        lastContactAt: true,
        lastDealTogether: true,
      },
    });

    // DB succeeded but no investors yet — return empty (not mock)
    if (!contacts || contacts.length === 0) {
      return NextResponse.json({ matches: [] });
    }

    const scored = (contacts as Array<{
      id: string;
      name: string;
      company: string | null;
      title: string | null;
      linkedIn: string | null;
      investorType: string | null;
      assetClasses: string[];
      checkSizeMin: number | null;
      checkSizeMax: number | null;
      lastContactAt: Date | null;
      lastDealTogether: string | null;
    }>)
      .map((c) => ({
        id: c.id,
        name: c.name,
        company: c.company,
        title: c.title,
        linkedIn: c.linkedIn,
        investorType: c.investorType,
        assetClasses: c.assetClasses ?? [],
        checkSizeMin: c.checkSizeMin,
        checkSizeMax: c.checkSizeMax,
        lastContactAt: c.lastContactAt?.toISOString() ?? null,
        score: scoreContact(
          {
            assetClasses: c.assetClasses ?? [],
            checkSizeMin: c.checkSizeMin,
            checkSizeMax: c.checkSizeMax,
            lastContactAt: c.lastContactAt,
            lastDealTogether: c.lastDealTogether,
          },
          sectorClasses,
          amount,
        ),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return NextResponse.json({ matches: scored });
  } catch {
    return NextResponse.json({ _mock: true, matches: MOCK_MATCHES });
  }
}
