"use client";

import { useEffect, useState } from "react";
import { DollarSign, TrendingDown, TrendingUp, AlertCircle } from "lucide-react";
import Badge from "@/components/ui/Badge";
import PageHeader from "@/components/ui/PageHeader";
import { formatCurrency } from "@/lib/utils";
import { useFamilyId } from "@/context/FamilyContext";

interface FinanceEntity {
  id: string;
  name: string;
  type: string;
  cash: number;
  receivables: number;
  payables: number;
}

interface FinanceTransaction {
  id: string;
  date: string;
  entity: string;
  type: string;
  category: string;
  amount: number;
  description: string;
}

interface FinancePayable {
  vendor: string;
  amount: number;
  due: string;
  entity: string;
  category: string;
}

interface CfoResult {
  summary: string;
  liquidityStatus: "healthy" | "watch" | "critical";
  insights: string[];
  recommendations: string[];
  alerts?: string[];
}

const typeVariant: Record<string, "success" | "danger" | "accent" | "warning"> = {
  income: "success",
  expense: "danger",
  "capital-call": "warning",
  distribution: "accent",
};

const liquidityVariant: Record<string, "success" | "warning" | "danger"> = {
  healthy: "success",
  watch: "warning",
  critical: "danger",
};

export default function FinancePage() {
  const familyId = useFamilyId();

  const [entities, setEntities] = useState<FinanceEntity[]>([]);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [payables, setPayables] = useState<FinancePayable[]>([]);
  const [isMock, setIsMock] = useState(false);
  const [loading, setLoading] = useState(true);

  const [cfoQuery, setCfoQuery] = useState("");
  const [cfoResult, setCfoResult] = useState<CfoResult | null>(null);
  const [cfoLoading, setCfoLoading] = useState(false);

  useEffect(() => {
    // Build URL: with familyId if available, without for mock/unauthenticated
    const url = familyId
      ? `/api/finance?familyId=${encodeURIComponent(familyId)}`
      : "/api/finance";

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        setEntities(data.entities ?? []);
        setTransactions(data.transactions ?? []);
        setPayables(data.payables ?? []);
        setIsMock(!!data._mock);
      })
      .catch(() => {
        // Leave empty — page will show blank gracefully
      })
      .finally(() => setLoading(false));
  }, [familyId]);

  const totalLiquidity = entities.reduce((s, e) => s + e.cash + e.receivables - e.payables, 0);

  async function handleAnalyze() {
    if (!cfoQuery.trim()) return;
    setCfoLoading(true);
    setCfoResult(null);
    try {
      const res = await fetch("/api/agents/cfo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ familyId: familyId ?? "demo", query: cfoQuery }),
      });
      const data = await res.json();
      setCfoResult(data.result as CfoResult);
    } catch {
      // silently fail
    } finally {
      setCfoLoading(false);
    }
  }

  return (
    <div className={`flex flex-col h-full${loading ? " opacity-50 animate-pulse" : ""}`}>
      <PageHeader
        title="Finance"
        subtitle={`Net liquidity across ${entities.length} entities`}
        actions={
          <div className="flex items-center gap-3">
            {isMock && (
              <Badge label="Mock Data" variant="warning" size="xs" />
            )}
            <div
              className="text-sm font-semibold px-4 py-2 rounded"
              style={{ background: "var(--bg-elevated)", color: "#10b981", fontVariantNumeric: "tabular-nums" }}
            >
              {formatCurrency(totalLiquidity)} net
            </div>
          </div>
        }
      />

      {/* Liquidity by entity */}
      <div className="px-8 py-5 border-b" style={{ borderColor: "var(--border)" }}>
        <h2 className="text-xs font-medium tracking-wider uppercase mb-4" style={{ color: "var(--text-muted)" }}>
          Liquidity by Entity
        </h2>
        <div className="rounded-md border overflow-hidden" style={{ borderColor: "var(--border)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border)" }}>
                {["Entity", "Type", "Cash", "Receivables", "Payables", "Net"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-medium" style={{ color: "var(--text-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entities.map((e) => {
                const net = e.cash + e.receivables - e.payables;
                return (
                  <tr key={e.id} style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-surface)" }}>
                    <td className="px-5 py-3.5 font-medium" style={{ color: "var(--text-primary)" }}>{e.name}</td>
                    <td className="px-5 py-3.5">
                      <Badge label={e.type.toUpperCase()} variant="muted" size="xs" />
                    </td>
                    {[e.cash, e.receivables, e.payables].map((v, i) => (
                      <td
                        key={i}
                        className="px-5 py-3.5 font-mono text-xs"
                        style={{ color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums" }}
                      >
                        {formatCurrency(v)}
                      </td>
                    ))}
                    <td
                      className="px-5 py-3.5 font-mono text-xs font-semibold"
                      style={{ color: net > 0 ? "#10b981" : "#ef4444", fontVariantNumeric: "tabular-nums" }}
                    >
                      {formatCurrency(net)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transactions + Payables */}
      <div className="flex overflow-hidden px-8 py-5 gap-6" style={{ minHeight: 0 }}>
        {/* Transactions */}
        <div className="flex-1 overflow-auto">
          <h2 className="text-xs font-medium tracking-wider uppercase mb-4" style={{ color: "var(--text-muted)" }}>
            Recent Transactions
          </h2>
          <div className="rounded-md border overflow-hidden" style={{ borderColor: "var(--border)" }}>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border)" }}>
                  {["Date", "Entity", "Type", "Description", "Amount"].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 font-medium" style={{ color: "var(--text-muted)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.map((t, i) => (
                  <tr key={t.id ?? i} style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-surface)" }}>
                    <td className="px-4 py-3 font-mono" style={{ color: "var(--text-muted)" }}>{t.date.slice(5)}</td>
                    <td className="px-4 py-3 max-w-32 truncate" style={{ color: "var(--text-secondary)" }}>{t.entity.replace("Hartwell ", "")}</td>
                    <td className="px-4 py-3">
                      <Badge label={t.category} variant={typeVariant[t.type] ?? "muted"} size="xs" />
                    </td>
                    <td className="px-4 py-3 max-w-40 truncate" style={{ color: "var(--text-secondary)" }}>{t.description}</td>
                    <td
                      className="px-4 py-3 font-mono text-right font-medium"
                      style={{
                        color: t.amount > 0 ? "#10b981" : t.type === "capital-call" ? "#f59e0b" : "#ef4444",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {t.amount > 0 ? "+" : ""}{formatCurrency(Math.abs(t.amount))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* AP Reminders */}
        <div className="w-64 shrink-0">
          <h2 className="text-xs font-medium tracking-wider uppercase mb-4" style={{ color: "var(--text-muted)" }}>
            Upcoming Payables
          </h2>
          <div className="flex flex-col gap-2">
            {payables.map((p, i) => (
              <div
                key={i}
                className="p-4 rounded-md border"
                style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
              >
                <div className="text-xs font-medium mb-1" style={{ color: "var(--text-primary)" }}>{p.vendor}</div>
                <div className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>{p.entity.replace("Hartwell ", "")} · {p.category}</div>
                <div className="flex items-center justify-between">
                  <span
                    className="text-sm font-semibold"
                    style={{ color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}
                  >
                    {formatCurrency(p.amount)}
                  </span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>Due {p.due.slice(5)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CFO Agent Panel */}
      <div className="px-8 py-6 border-t" style={{ borderColor: "var(--border)" }}>
        <h2 className="text-xs font-medium tracking-wider uppercase mb-4" style={{ color: "var(--text-muted)" }}>
          CFO Agent
        </h2>
        <div className="flex gap-6">
          {/* Left: prompt input */}
          <div className="flex-1 flex flex-col gap-3">
            <textarea
              className="w-full rounded-md border px-4 py-3 text-sm resize-none focus:outline-none focus:ring-1"
              rows={3}
              placeholder="Ask the CFO agent... e.g. 'What's our Q2 cash position?' or 'Summarize AP exposure by entity'"
              value={cfoQuery}
              onChange={(e) => setCfoQuery(e.target.value)}
              style={{
                background: "var(--bg-surface)",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
              }}
            />
            <button
              onClick={handleAnalyze}
              disabled={cfoLoading || !cfoQuery.trim()}
              className="self-start px-5 py-2 rounded text-sm font-semibold transition-opacity disabled:opacity-40"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              {cfoLoading ? "Analyzing…" : "Analyze"}
            </button>
          </div>

          {/* Right: agent response */}
          {cfoResult && (
            <div
              className="flex-1 rounded-md border p-5 flex flex-col gap-4"
              style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
            >
              <div className="flex items-start justify-between gap-4">
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>
                  {cfoResult.summary}
                </p>
                {cfoResult.liquidityStatus && (
                  <Badge
                    label={cfoResult.liquidityStatus.charAt(0).toUpperCase() + cfoResult.liquidityStatus.slice(1)}
                    variant={liquidityVariant[cfoResult.liquidityStatus] ?? "muted"}
                    size="xs"
                  />
                )}
              </div>

              {cfoResult.insights?.length > 0 && (
                <div>
                  <div className="text-xs font-medium tracking-wider uppercase mb-2" style={{ color: "var(--text-muted)" }}>
                    Insights
                  </div>
                  <ul className="flex flex-col gap-1">
                    {cfoResult.insights.map((insight, i) => (
                      <li key={i} className="text-xs flex gap-2" style={{ color: "var(--text-secondary)" }}>
                        <span style={{ color: "var(--text-muted)" }}>·</span>
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {cfoResult.recommendations?.length > 0 && (
                <div>
                  <div className="text-xs font-medium tracking-wider uppercase mb-2" style={{ color: "var(--text-muted)" }}>
                    Recommendations
                  </div>
                  <ul className="flex flex-col gap-1">
                    {cfoResult.recommendations.map((rec, i) => (
                      <li key={i} className="text-xs flex gap-2" style={{ color: "var(--text-secondary)" }}>
                        <span style={{ color: "var(--accent)" }}>→</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
