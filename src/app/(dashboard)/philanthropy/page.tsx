"use client";

import { useState } from "react";
import { Heart, Calendar, Loader2 } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import { useFamilyId } from "@/context/FamilyContext";

const GRANTS = [
  { org: "MIT Media Lab", category: "Education", amount: 500_000, year: 2026, status: "active", impact: "AI literacy programs" },
  { org: "Nature Conservancy", category: "Environment", amount: 250_000, year: 2026, status: "active", impact: "Amazon watershed protection" },
  { org: "Robin Hood Foundation", category: "Poverty", amount: 100_000, year: 2025, status: "completed", impact: "NYC youth employment" },
  { org: "MacArthur Foundation", category: "Justice", amount: 150_000, year: 2025, status: "completed", impact: "Criminal justice reform" },
];

const PLEDGES = [
  { org: "Stanford GSB", amount: 2_000_000, remaining: 1_500_000, deadline: "2028-12-31" },
  { org: "New York Public Library", amount: 500_000, remaining: 300_000, deadline: "2027-06-30" },
];

const totalGiven = GRANTS.reduce((s, g) => s + g.amount, 0);

interface PhilanthropyResult {
  summary: string;
  impactHighlights: string[];
  recommendations: string[];
  upcomingObligations: { org: string; amount: number; due: string; note: string }[];
  grantingCapacity: string;
}

export default function PhilanthropyPage() {
  const familyId = useFamilyId();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PhilanthropyResult | null>(null);
  const [isMock, setIsMock] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze() {
    if (!familyId || !query.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/agents/philanthropy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ familyId, query: query.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Analysis failed");
        return;
      }
      setResult(data.result as PhilanthropyResult);
      setIsMock(data.analysis?._mock === true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Philanthropy"
        subtitle="Foundation operations, grants, and impact tracking"
        actions={
          <div
            className="text-sm font-semibold px-4 py-2 rounded"
            style={{ background: "var(--bg-elevated)", color: "#10b981" }}
          >
            {formatCurrency(totalGiven)} given
          </div>
        }
      />

      <div className="flex-1 p-8 grid grid-cols-3 gap-6 overflow-auto">
        {/* Grant portfolio */}
        <div className="col-span-2">
          <h2 className="text-xs font-medium tracking-wider uppercase mb-4" style={{ color: "var(--text-muted)" }}>Grant Portfolio</h2>
          <div className="rounded-md border overflow-hidden" style={{ borderColor: "var(--border)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border)" }}>
                  {["Organization", "Category", "Amount", "Year", "Status", "Impact"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-medium" style={{ color: "var(--text-muted)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {GRANTS.map((g, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-surface)" }}>
                    <td className="px-5 py-3.5 font-medium" style={{ color: "var(--text-primary)" }}>{g.org}</td>
                    <td className="px-5 py-3.5"><Badge label={g.category} variant="muted" size="xs" /></td>
                    <td className="px-5 py-3.5 text-xs font-mono" style={{ color: "#10b981", fontVariantNumeric: "tabular-nums" }}>{formatCurrency(g.amount)}</td>
                    <td className="px-5 py-3.5 text-xs font-mono" style={{ color: "var(--text-muted)" }}>{g.year}</td>
                    <td className="px-5 py-3.5"><Badge label={g.status} variant={g.status === "active" ? "success" : "muted"} size="xs" /></td>
                    <td className="px-5 py-3.5 text-xs max-w-32 truncate" style={{ color: "var(--text-secondary)" }}>{g.impact}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pledges */}
        <div>
          <h2 className="text-xs font-medium tracking-wider uppercase mb-4" style={{ color: "var(--text-muted)" }}>Open Pledges</h2>
          <div className="flex flex-col gap-3">
            {PLEDGES.map((p, i) => {
              const pct = Math.round(((p.amount - p.remaining) / p.amount) * 100);
              return (
                <div key={i} className="p-4 rounded-md border" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
                  <div className="text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>{p.org}</div>
                  <div className="flex justify-between text-xs mb-2" style={{ color: "var(--text-muted)" }}>
                    <span>{formatCurrency(p.amount - p.remaining)} paid</span>
                    <span>{formatCurrency(p.remaining)} remaining</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "#10b981" }} />
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
                    <Calendar size={10} />
                    Due {p.deadline}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Philanthropy Intelligence — full width */}
        <div className="col-span-3">
          <div
            className="rounded-md border p-6"
            style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
          >
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
              <Heart size={16} style={{ color: "var(--accent)" }} />
              <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Philanthropy Intelligence
              </h2>
              {isMock && (
                <span
                  className="ml-2 text-xs px-2 py-0.5 rounded"
                  style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.25)" }}
                >
                  Demo
                </span>
              )}
            </div>

            {/* Query input */}
            <div className="flex gap-3 mb-5">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAnalyze(); }}
                placeholder="Ask about your giving... e.g. 'What's my total impact this year?' or 'How should I optimize my Q4 giving?'"
                className="flex-1 text-sm px-4 py-2 rounded-md"
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                  outline: "none",
                }}
              />
              <button
                onClick={handleAnalyze}
                disabled={loading || !familyId || !query.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium"
                style={{
                  background: loading || !familyId || !query.trim() ? "var(--bg-elevated)" : "var(--accent)",
                  color: loading || !familyId || !query.trim() ? "var(--text-muted)" : "#fff",
                  cursor: loading || !familyId || !query.trim() ? "not-allowed" : "pointer",
                  transition: "background 0.15s",
                }}
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : null}
                Analyze
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="text-xs px-4 py-3 rounded mb-4" style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
                {error}
              </div>
            )}

            {/* Loading shimmer */}
            {loading && (
              <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
                <Loader2 size={14} className="animate-spin" />
                <span>Analyzing your philanthropy portfolio...</span>
              </div>
            )}

            {/* Results */}
            {result && !loading && (
              <div className="flex flex-col gap-5">
                {/* Summary */}
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {result.summary}
                </p>

                <div className="grid grid-cols-2 gap-6">
                  {/* Impact Highlights */}
                  <div>
                    <h3 className="text-xs font-medium tracking-wider uppercase mb-3" style={{ color: "var(--text-muted)" }}>
                      Impact Highlights
                    </h3>
                    <ul className="flex flex-col gap-2">
                      {result.impactHighlights.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                          <span className="mt-1 flex-shrink-0 w-2 h-2 rounded-full" style={{ background: "#10b981" }} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Recommendations */}
                  <div>
                    <h3 className="text-xs font-medium tracking-wider uppercase mb-3" style={{ color: "var(--text-muted)" }}>
                      Recommendations
                    </h3>
                    <ol className="flex flex-col gap-2">
                      {result.recommendations.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                          <span className="font-semibold flex-shrink-0 w-4 text-right" style={{ color: "var(--accent)" }}>
                            {i + 1}.
                          </span>
                          {item}
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>

                {/* Upcoming Obligations */}
                {result.upcomingObligations?.length > 0 && (
                  <div>
                    <h3 className="text-xs font-medium tracking-wider uppercase mb-3" style={{ color: "var(--text-muted)" }}>
                      Upcoming Obligations
                    </h3>
                    <div className="rounded-md border overflow-hidden" style={{ borderColor: "var(--border)" }}>
                      <table className="w-full text-xs">
                        <thead>
                          <tr style={{ background: "var(--bg-elevated)", borderBottom: "1px solid var(--border)" }}>
                            {["Organization", "Amount", "Due Date", "Note"].map((h) => (
                              <th key={h} className="text-left px-4 py-2.5 font-medium" style={{ color: "var(--text-muted)" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {result.upcomingObligations.map((ob, i) => (
                            <tr key={i} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                              <td className="px-4 py-2.5 font-medium" style={{ color: "var(--text-primary)" }}>{ob.org}</td>
                              <td className="px-4 py-2.5 font-mono" style={{ color: "#10b981" }}>{formatCurrency(ob.amount)}</td>
                              <td className="px-4 py-2.5" style={{ color: "var(--text-muted)" }}>{ob.due}</td>
                              <td className="px-4 py-2.5" style={{ color: "var(--text-secondary)" }}>{ob.note}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Granting Capacity */}
                {result.grantingCapacity && (
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {result.grantingCapacity}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
