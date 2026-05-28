import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export interface SearchResult {
  id: string;
  type: "deal" | "contact" | "portfolio" | "document";
  title: string;
  subtitle: string | null;
  href: string;
  badge?: string;
}

const MOCK_RESULTS: SearchResult[] = [
  { id: "m1", type: "deal",      title: "Meridian AI",          subtitle: "Series A · $12M ask",          href: "/opportunities",  badge: "Series A" },
  { id: "m2", type: "deal",      title: "Phalanx Defense",      subtitle: "Seed · $3M ask",               href: "/opportunities",  badge: "Seed" },
  { id: "m3", type: "contact",   title: "Sarah Chen",           subtitle: "Partner @ Lightspeed",         href: "/relationships",  badge: "Investor" },
  { id: "m4", type: "portfolio", title: "Arcadia Energy",       subtitle: "Active · $4.8M invested",      href: "/portfolio",      badge: "Active" },
  { id: "m5", type: "document",  title: "Phalanx Defense NDA",  subtitle: "NDA · expires Jun 1",          href: "/legal",          badge: "NDA" },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const familyId = searchParams.get("familyId");

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results: SearchResult[] = [];
    const contains = { contains: q, mode: "insensitive" as const };

    const [deals, contacts, portfolio, documents] = await Promise.all([
      prisma.deal.findMany({
        where: { deletedAt: null, ...(familyId ? { familyId } : {}), OR: [{ company: contains }, { sector: contains }, { description: contains }] },
        select: { id: true, company: true, sector: true, stage: true, status: true },
        take: 5,
      }),
      prisma.contact.findMany({
        where: { deletedAt: null, ...(familyId ? { familyId } : {}), OR: [{ name: contains }, { company: contains }, { title: contains }] },
        select: { id: true, name: true, company: true, title: true, type: true },
        take: 5,
      }),
      prisma.portfolioCompany.findMany({
        where: { deletedAt: null, ...(familyId ? { familyId } : {}), OR: [{ name: contains }, { sector: contains }] },
        select: { id: true, name: true, sector: true, status: true, investedAmount: true },
        take: 5,
      }),
      prisma.document.findMany({
        where: { deletedAt: null, ...(familyId ? { familyId } : {}), OR: [{ name: contains }] },
        select: { id: true, name: true, type: true, dealId: true },
        take: 5,
      }),
    ]);

    for (const d of deals) {
      results.push({
        id: `deal-${d.id}`,
        type: "deal",
        title: d.company,
        subtitle: [d.stage, d.status].filter(Boolean).join(" · "),
        href: `/opportunities/${d.id}`,
        badge: d.stage ?? d.status,
      });
    }

    for (const c of contacts) {
      results.push({
        id: `contact-${c.id}`,
        type: "contact",
        title: c.name,
        subtitle: [c.title, c.company].filter(Boolean).join(" @ "),
        href: `/relationships`,
        badge: c.type,
      });
    }

    for (const p of portfolio) {
      const invested = p.investedAmount ? `$${(p.investedAmount / 1_000_000).toFixed(1)}M invested` : null;
      results.push({
        id: `portfolio-${p.id}`,
        type: "portfolio",
        title: p.name,
        subtitle: [p.sector, invested].filter(Boolean).join(" · "),
        href: `/portfolio/${p.id}`,
        badge: p.status,
      });
    }

    for (const doc of documents) {
      results.push({
        id: `doc-${doc.id}`,
        type: "document",
        title: doc.name,
        subtitle: doc.type.replace(/-/g, " "),
        href: `/legal`,
        badge: doc.type,
      });
    }

    if (results.length > 0) return NextResponse.json({ results });

    // No real results — return filtered mock
    const ql = q.toLowerCase();
    const filtered = MOCK_RESULTS.filter(
      (r) => r.title.toLowerCase().includes(ql) || (r.subtitle ?? "").toLowerCase().includes(ql)
    );
    return NextResponse.json({ results: filtered, _mock: true });
  } catch {
    const ql = q.toLowerCase();
    const filtered = MOCK_RESULTS.filter(
      (r) => r.title.toLowerCase().includes(ql) || (r.subtitle ?? "").toLowerCase().includes(ql)
    );
    return NextResponse.json({ results: filtered, _mock: true });
  }
}
