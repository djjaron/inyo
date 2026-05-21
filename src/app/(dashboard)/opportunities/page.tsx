"use client";

import { useState, useEffect } from "react";
import { TrendingUp, Plus, Filter, ChevronRight, Bot, Zap, RefreshCw } from "lucide-react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import ScoreRing from "@/components/ui/ScoreRing";
import PageHeader from "@/components/ui/PageHeader";
import { formatCurrency, formatDate } from "@/lib/utils";

const STATUS_FILTERS = ["All", "Inbound", "Reviewing", "Diligence", "IC Review", "Invested", "Passed"] as const;

const statusVariant: Record<string, "success" | "warning" | "accent" | "danger" | "muted" | "default"> = {
  inbound: "accent", reviewing: "accent", diligence: "warning",
  "ic-review": "warning", invested: "success", passed: "muted", archived: "muted",
};
const statusLabel: Record<string, string> = {
  inbound: "Inbound", reviewing: "Reviewing", diligence: "Diligence",
  "ic-review": "IC Review", invested: "Invested", passed: "Passed", archived: "Archived",
};

interface Deal {
  id: string; company: string; sector?: string; stage?: string;
  capitalAsk?: number; dealScore?: number; status: string;
  createdAt: string; sourceType?: string;
}

// Fallback mock data used when DB has no deals
const MOCK_DEALS: Deal[] = [
  { id: "mock-1", company: "Meridian AI", sector: "Enterprise AI", stage: "series-b", capitalAsk: 12_000_000, dealScore: 84, status: "diligence", createdAt: "2026-05-14", sourceType: "lp-intro" },
  { id: "mock-2", company: "Verdant Bio", sector: "Biotech", stage: "series-a", capitalAsk: 8_000_000, dealScore: 71, status: "reviewing", createdAt: "2026-05-12", sourceType: "inbound" },
  { id: "mock-3", company: "Phalanx Defense", sector: "Defense Tech", stage: "series-c", capitalAsk: 60_000_000, dealScore: 88, status: "ic-review", createdAt: "2026-05-03", sourceType: "network" },
  { id: "mock-4", company: "Arcadia Energy", sector: "Clean Energy", stage: "growth", capitalAsk: 45_000_000, dealScore: 79, status: "ic-review", createdAt: "2026-05-08", sourceType: "broker" },
  { id: "mock-5", company: "Terrace REIT", sector: "Real Estate", stage: "pe", capitalAsk: 18_000_000, dealScore: 73, status: "inbound", createdAt: "2026-04-25", sourceType: "broker" },
];

export default function OpportunitiesPage() {
  const [filter, setFilter] = useState("All");
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingMock, setUsingMock] = useState(false);

  async function loadDeals() {
    setLoading(true);
    try {
      const res = await fetch("/api/deals");
      const data = await res.json();
      const loaded: Deal[] = data.deals ?? data;
      if (loaded.length > 0) {
        setDeals(loaded);
        setUsingMock(false);
      } else {
        setDeals(MOCK_DEALS);
        setUsingMock(true);
      }
    } catch {
      setDeals(MOCK_DEALS);
      setUsingMock(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadDeals(); }, []);

  const filtered = filter === "All"
    ? deals
    : deals.filter((d) => d.status === filter.toLowerCase().replace(" ", "-"));

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Opportunities"
        subtitle={`${deals.length} deal${deals.length !== 1 ? "s" : ""} in pipeline`}
        actions={
          <Link
            href="/import/deals"
            className="flex items-center gap-1.5 px-3 py-2 rounded text-sm font-medium"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            <Plus size={14} />
            Add Deal
          </Link>
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-1 px-8 py-3 border-b overflow-x-auto" style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}>
        {STATUS_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded text-xs whitespace-nowrap transition-colors"
            style={filter === f ? { background: "var(--accent)", color: "#fff" } : { color: "var(--text-secondary)" }}
          >
            {f}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          {usingMock && (
            <span className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}>
              demo data — import real deals
            </span>
          )}
          <button onClick={loadDeals} className="p-1.5 rounded hover:bg-white/5 transition-colors" style={{ color: "var(--text-muted)" }}>
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-8 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-sm" style={{ color: "var(--text-muted)" }}>
            Loading deals...
          </div>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Company", "Sector", "Stage", "Ask", "Score", "Status", "Added", ""].map((h) => (
                  <th key={h} className="text-left py-2.5 px-3 text-xs font-medium tracking-wide" style={{ color: "var(--text-muted)" }}>
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
                    {deal.sourceType && <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{deal.sourceType.replace("-", " ")}</div>}
                  </td>
                  <td className="py-3 px-3" style={{ color: "var(--text-secondary)" }}>{deal.sector ?? "—"}</td>
                  <td className="py-3 px-3">
                    {deal.stage ? <Badge label={deal.stage.replace(/-/g, " ")} variant="muted" size="xs" /> : <span style={{ color: "var(--text-muted)" }}>—</span>}
                  </td>
                  <td className="py-3 px-3 font-mono text-xs" style={{ color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums" }}>
                    {deal.capitalAsk ? formatCurrency(deal.capitalAsk) : "—"}
                  </td>
                  <td className="py-3 px-3">
                    {deal.dealScore ? <ScoreRing score={deal.dealScore} size={36} /> : <span className="text-xs" style={{ color: "var(--text-muted)" }}>—</span>}
                  </td>
                  <td className="py-3 px-3">
                    <Badge label={statusLabel[deal.status] ?? deal.status} variant={statusVariant[deal.status] ?? "default"} size="xs" />
                  </td>
                  <td className="py-3 px-3 text-xs" style={{ color: "var(--text-muted)" }}>
                    {deal.createdAt ? formatDate(deal.createdAt) : "—"}
                  </td>
                  <td className="py-3 px-3">
                    <Link
                      href={`/opportunities/${deal.id}`}
                      className="flex items-center gap-1 px-2.5 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: "var(--accent-muted)", color: "var(--accent)", border: "1px solid rgba(59,130,246,0.2)" }}
                    >
                      <Bot size={11} /> Open
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                    No deals match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
