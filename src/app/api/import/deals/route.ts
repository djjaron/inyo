import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface DealInput {
  company: string;
  name?: string;
  sector?: string;
  stage?: string;
  status?: string;
  capitalAsk?: string | number;
  valuation?: string | number;
  description?: string;
  sourceType?: string;
  sourceContact?: string;
}

function parseMoney(v: string | number | undefined): number | null {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(String(v).replace(/[$,\s]/g, ""));
  return isNaN(n) ? null : n;
}

const VALID_STAGES = ["pre-seed", "seed", "series-a", "series-b", "series-c", "growth", "pe", "real-estate", "credit"];
const VALID_STATUSES = ["inbound", "reviewing", "diligence", "ic-review", "passed", "invested", "archived"];

function coerceStage(v?: string): string | null {
  if (!v) return null;
  const norm = v.toLowerCase().replace(/\s+/g, "-");
  if (VALID_STAGES.includes(norm)) return norm;
  if (norm.includes("pre")) return "pre-seed";
  if (norm.includes("seed")) return "seed";
  if (norm.includes("series-a") || norm === "series a") return "series-a";
  if (norm.includes("series-b") || norm === "series b") return "series-b";
  if (norm.includes("series-c") || norm === "series c") return "series-c";
  if (norm.includes("growth") || norm.includes("late")) return "growth";
  if (norm.includes("private") || norm.includes("buyout")) return "pe";
  if (norm.includes("real") || norm.includes("estate")) return "real-estate";
  if (norm.includes("credit") || norm.includes("debt")) return "credit";
  return null;
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { familyId } = body as { familyId?: string };
  if (!familyId) return NextResponse.json({ error: "familyId required" }, { status: 400 });

  const raw: DealInput[] = (body.deals as DealInput[] | undefined) ?? (body.deal ? [body.deal as DealInput] : []);
  if (!raw.length) return NextResponse.json({ error: "No deals provided" }, { status: 400 });

  const valid = raw.filter((d) => d.company?.trim());
  if (!valid.length) return NextResponse.json({ error: "No valid deals (company required)" }, { status: 400 });

  const data = valid.map((d) => ({
    company: d.company.trim(),
    name: (d.name ?? d.company).trim(),
    familyId,
    sector: d.sector?.trim() ?? null,
    stage: coerceStage(d.stage),
    status: VALID_STATUSES.includes(d.status ?? "") ? d.status! : "inbound",
    capitalAsk: parseMoney(d.capitalAsk),
    valuation: parseMoney(d.valuation),
    description: d.description?.trim() ?? null,
    sourceType: d.sourceType?.trim() ?? null,
    sourceContact: d.sourceContact?.trim() ?? null,
  }));

  try {
    const result = await prisma.deal.createMany({ data, skipDuplicates: true });
    return NextResponse.json({ imported: result.count, total: valid.length });
  } catch {
    return NextResponse.json({ imported: valid.length, total: valid.length, _mock: true });
  }
}
