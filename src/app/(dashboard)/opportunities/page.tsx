"use client";

import { useState } from "react";
import { TrendingUp, Plus, Filter, ChevronRight, Bot, Zap } from "lucide-react";
import Badge from "@/components/ui/Badge";
import ScoreRing from "@/components/ui/ScoreRing";
import PageHeader from "@/components/ui/PageHeader";
import { formatCurrency, formatDate } from "@/lib/utils";

const DEALS = [
  { id: "1", company: "Meridian AI", sector: "Enterprise AI", stage: "Series B", ask: 12_000_000, score: 84, status: "diligence", date: "2026-05-14", source: "LP intro" },
  { id: "2", company: "Verdant Bio", sector: "Biotech", stage: "Series A", ask: 8_000_000, score: 71, status: "reviewing", date: "2026-05-12", source: "Inbound" },
  { id: "3", company: "ClearReg", sector: "RegTech", stage: "Seed", ask: 3_500_000, score: 67, status: "reviewing", date: "2026-05-10", source: "Network" },
  { id: "4", company: "Arcadia Energy", sector: "Clean Energy", stage: "Growth", ask: 45_000_000, score: 79, status: "ic-review", date: "2026-05-08", source: "Broker" },
  { id: "5", company: "Helios Credit", sector: "Credit", stage: "PE", ask: 22_000_000, score: 55, status: "passed", date: "2026-05-05", source: "Inbound" },
  { id: "6", company: "Phalanx Defense", sector: "Defense Tech", stage: "Series C", ask: 60_000_000, score: 88, status: "ic-review", date: "2026-05-03", source: "Network" },
  { id: "7", company: "NovaSpin", sector: "Healthcare IT", stage: "Series A", ask: 6_000_000, score: 42, status: "passed", date: "2026-04-29", source: "Inbound" },
  { id: "8", company: "Terrace REIT", sector: "Real Estate", stage: "PE", ask: 18_000_000, score: 73, status: "inbound", date: "2026-04-25", source: "Broker" },
];

const STATUS_FILTERS = ["All", "Inbound", "Reviewing", "Diligence", "IC Review", "Invested", "Passed"] as const;

const statusVariant: Record<string, "success" | "warning" | "accent" | "danger" | "muted" | "default"> = {
  inbound: "accent",
  reviewing: "accent",
  diligence: "warning",
  "ic-review": "warning",
  invested: "success",
  passed: "muted",
  archived: "muted",
};

const statusLabel: Record<string, string> = {
  inbound: "Inbound",
  reviewing: "Reviewing",
  diligence: "Diligence",
  "ic-review": "IC Review",
  invested: "Invested",
  passed: "Passed",
  archived: "Archived",
};

export default function OpportunitiesPage() {
  const [filter, setFilter] = useState("All");
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [analyses, setAnalyses] = useState<Record<string, unknown>>({});

  const filtered = filter === "All"
    ? DEALS
    : DEALS.filter((d) => d.status === filter.toLowerCase().replace(" ", "-"));

  async function runDealAnalysis(dealId: string, company: string) {
    setAnalyzing(dealId);
    try {
      const res = await fetch("/api/agents/deal-flow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ familyId: "family_demo", dealId, context: { company } }),
      });
      const data = await res.json();
      setAnalyses((prev) => ({ ...prev, [dealId]: data }));
    } catch {
      // silently fail
    } finally {
      setAnalyzing(null);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Opportunities"
        subtitle={`${DEALS.length} deals in pipeline`}
        actions={
          <button
            className="flex items-center gap-1.5 px-3 py-2 rounded text-sm font-medium transition-colors"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            <Plus size={14} />
            New Deal
          </button>
        }
      />

      {/* Filters */}
      <div
        className="flex items-center gap-1 px-8 py-3 border-b overflow-x-auto"
        style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}
      >
        {STATUS_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded text-xs whitespace-nowrap transition-colors"
            style={
              filter === f
                ? { background: "var(--accent)", color: "#fff" }
                : { color: "var(--text-secondary)", background: "transparent" }
            }
          >
            {f}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
          <Filter size={12} />
          Sort: Score
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-8 py-4">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Company", "Sector", "Stage", "Ask", "Score", "Status", "Added", ""].map((h) => (
                <th
                  key={h}
                  className="text-left py-2.5 px-3 text-xs font-medium tracking-wide"
                  style={{ color: "var(--text-muted)" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((deal) => (
              <tr
                key={deal.id}
                className="group transition-colors"
                style={{ borderBottom: "1px solid var(--border-subtle)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-elevated)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <td className="py-3 px-3">
                  <div className="font-medium" style={{ color: "var(--text-primary)" }}>{deal.company}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{deal.source}</div>
                </td>
                <td className="py-3 px-3" style={{ color: "var(--text-secondary)" }}>{deal.sector}</td>
                <td className="py-3 px-3">
                  <Badge label={deal.stage} variant="muted" size="xs" />
                </td>
                <td
                  className="py-3 px-3 font-mono text-xs"
                  style={{ color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums" }}
                >
                  {formatCurrency(deal.ask)}
                </td>
                <td className="py-3 px-3">
                  <ScoreRing score={deal.score} size={36} />
                </td>
                <td className="py-3 px-3">
                  <Badge label={statusLabel[deal.status]} variant={statusVariant[deal.status]} size="xs" />
                </td>
                <td className="py-3 px-3 text-xs" style={{ color: "var(--text-muted)" }}>
                  {formatDate(deal.date)}
                </td>
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => runDealAnalysis(deal.id, deal.company)}
                      disabled={analyzing === deal.id}
                      className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors"
                      style={{
                        background: "var(--accent-muted)",
                        color: "var(--accent)",
                        border: "1px solid rgba(59,130,246,0.2)",
                      }}
                    >
                      {analyzing === deal.id ? (
                        <Zap size={11} className="agent-active" />
                      ) : (
                        <Bot size={11} />
                      )}
                      Analyze
                    </button>
                    <button className="p-1 rounded" style={{ color: "var(--text-muted)" }}>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Inline analysis result */}
        {Object.entries(analyses).length > 0 && (
          <div className="mt-6 p-5 rounded border" style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}>
            <div className="flex items-center gap-2 mb-4 text-xs font-medium" style={{ color: "var(--accent)" }}>
              <Bot size={13} />
              Deal Flow Analysis — {DEALS.find((d) => analyses[d.id])?.company}
            </div>
            <pre
              className="text-xs overflow-auto"
              style={{ color: "var(--text-secondary)", fontFamily: "'SF Mono', 'Fira Code', monospace", lineHeight: 1.7 }}
            >
              {JSON.stringify(Object.values(analyses)[0], null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
