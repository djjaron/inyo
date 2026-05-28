import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export interface AgentRunItem {
  id: string;
  agentType: string;
  status: string;
  triggerType: string | null;
  label: string;
  severity: "success" | "warning" | "error" | "info";
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  outputPreview: Record<string, unknown> | null;
}

export function buildLabel(
  agentType: string,
  input: Record<string, unknown>,
  output: Record<string, unknown> | null,
  status: string,
): string {
  if (status === "failed") return `${agentType.replace(/-/g, " ")} failed`;

  const company =
    (input.company as string | undefined) ??
    (input.name as string | undefined) ??
    null;

  if (agentType === "deal-flow" && output) {
    const score = output.score as number | undefined;
    const rec = (output.recommendation as string | undefined) ?? "";
    const recLabel = rec === "pursue" ? "Pursue" : rec === "review" ? "Review" : rec === "pass" ? "Pass" : rec;
    return company && score != null
      ? `Scored ${company}: ${score} (${recLabel})`
      : `Deal scored${score != null ? `: ${score}` : ""}`;
  }

  if (agentType === "deal-enrichment" && output) {
    const score = output.affinityScore as number | undefined;
    return company ? `Enriched ${company}${score != null ? ` — affinity ${score}` : ""}` : "Deal enriched";
  }

  if (agentType === "portfolio-monitor" && output) {
    const status2 = (output.overallStatus as string | undefined) ?? (output.recommendation as string | undefined) ?? "";
    const label = status2 === "escalate" ? "Escalate ⚠️" : status2 === "monitor" ? "Monitor" : "Healthy";
    return company ? `${company}: ${label}` : `Portfolio monitor: ${label}`;
  }

  if (agentType === "cfo" && output) {
    const liq = output.liquidityStatus as string | undefined;
    const liqLabel = liq === "healthy" ? "Healthy" : liq === "watch" ? "Watch" : liq === "critical" ? "Critical ⚠️" : "";
    return liqLabel ? `CFO summary: Liquidity ${liqLabel}` : "CFO summary complete";
  }

  if (agentType === "ic-memo") {
    return company ? `IC Memo drafted for ${company}` : "IC Memo drafted";
  }

  if (agentType === "legal" && output) {
    const risk = (output.riskLevel as string | undefined) ?? "";
    return risk ? `Legal review: ${risk} risk` : "Legal review complete";
  }

  if (agentType === "tax") return "Tax analysis complete";
  if (agentType === "chief-of-staff") return "Chief of Staff task complete";
  if (agentType === "concierge") return "Concierge request handled";
  if (agentType === "philanthropy") return "Philanthropy report ready";
  if (agentType === "relationships") return "Relationship analysis complete";
  if (agentType === "term-sheet") return "Term sheet analyzed";
  if (agentType === "diligence") return "Diligence review complete";

  return `${agentType.replace(/-/g, " ")} completed`;
}

export function buildSeverity(
  agentType: string,
  output: Record<string, unknown> | null,
  status: string,
): AgentRunItem["severity"] {
  if (status === "failed") return "error";

  if (agentType === "deal-flow" && output) {
    const score = output.score as number | undefined;
    if (score == null) return "info";
    if (score >= 70) return "success";
    if (score >= 50) return "warning";
    return "info";
  }

  if (agentType === "portfolio-monitor" && output) {
    const s = (output.overallStatus as string | undefined) ?? (output.recommendation as string | undefined);
    if (s === "escalate") return "error";
    if (s === "monitor") return "warning";
    return "success";
  }

  if (agentType === "cfo" && output) {
    const liq = output.liquidityStatus as string | undefined;
    if (liq === "critical") return "error";
    if (liq === "watch") return "warning";
    return "success";
  }

  if (agentType === "legal" && output) {
    const risk = output.riskLevel as string | undefined;
    if (risk === "high") return "error";
    if (risk === "medium") return "warning";
    return "success";
  }

  return "info";
}

const MOCK_RUNS: AgentRunItem[] = [
  {
    id: "mock-run-1", agentType: "deal-flow", status: "completed", triggerType: "ingestion",
    label: "Scored Meridian AI: 84 (Pursue)", severity: "success",
    startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 10000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    outputPreview: { score: 84, recommendation: "pursue", summary: "Strong enterprise AI opportunity with defensible compliance LLM moat." },
  },
  {
    id: "mock-run-2", agentType: "portfolio-monitor", status: "completed", triggerType: "scheduled",
    label: "Helios Credit: Escalate ⚠️", severity: "error",
    startedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 5 * 60 * 60 * 1000 + 8000).toISOString(),
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    outputPreview: { healthScore: 42, overallStatus: "escalate", recommendation: "escalate" },
  },
  {
    id: "mock-run-3", agentType: "cfo", status: "completed", triggerType: "scheduled",
    label: "CFO summary: Liquidity Healthy", severity: "success",
    startedAt: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 9 * 60 * 60 * 1000 + 5000).toISOString(),
    createdAt: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString(),
    outputPreview: { liquidityStatus: "healthy", summary: "Net liquidity $43.2M across all entities. 22+ months operating runway." },
  },
  {
    id: "mock-run-4", agentType: "deal-enrichment", status: "completed", triggerType: "ingestion",
    label: "Enriched Phalanx Defense — affinity 91", severity: "success",
    startedAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 26 * 60 * 60 * 1000 + 7000).toISOString(),
    createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    outputPreview: { affinityScore: 91 },
  },
  {
    id: "mock-run-5", agentType: "portfolio-monitor", status: "completed", triggerType: "scheduled",
    label: "Meridian AI: Monitor", severity: "warning",
    startedAt: new Date(Date.now() - 27 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 27 * 60 * 60 * 1000 + 8000).toISOString(),
    createdAt: new Date(Date.now() - 27 * 60 * 60 * 1000).toISOString(),
    outputPreview: { healthScore: 67, overallStatus: "monitor", recommendation: "monitor" },
  },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const familyId = searchParams.get("familyId");
  const limitParam = searchParams.get("limit");
  const agentTypeFilter = searchParams.get("agentType");
  const limit = Math.min(parseInt(limitParam ?? "20", 10), 50);

  if (!familyId || familyId === "family_demo") {
    const filtered = agentTypeFilter
      ? MOCK_RUNS.filter((r) => r.agentType === agentTypeFilter)
      : MOCK_RUNS;
    return NextResponse.json({ runs: filtered.slice(0, limit) });
  }

  try {
    const where: Record<string, unknown> = { familyId };
    if (agentTypeFilter) where.agentType = agentTypeFilter;

    const rows = await prisma.agentRun.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const runs: AgentRunItem[] = rows.map((row) => {
      const output = (row.output ?? null) as Record<string, unknown> | null;
      const input = (row.input ?? {}) as Record<string, unknown>;
      return {
        id: row.id,
        agentType: row.agentType,
        status: row.status,
        triggerType: row.triggerType,
        label: buildLabel(row.agentType, input, output, row.status),
        severity: buildSeverity(row.agentType, output, row.status),
        startedAt: row.startedAt?.toISOString() ?? null,
        completedAt: row.completedAt?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString(),
        outputPreview: output
          ? Object.fromEntries(Object.entries(output).slice(0, 4))
          : null,
      };
    });

    return NextResponse.json({ runs });
  } catch {
    return NextResponse.json({ runs: MOCK_RUNS.slice(0, limit) });
  }
}
