"use client";

import { DollarSign, TrendingDown, TrendingUp, AlertCircle } from "lucide-react";
import Badge from "@/components/ui/Badge";
import PageHeader from "@/components/ui/PageHeader";
import { formatCurrency } from "@/lib/utils";

const ENTITIES = [
  { id: "1", name: "Hartwell Delaware LLC", type: "llc", cash: 12_400_000, receivables: 850_000, payables: 320_000 },
  { id: "2", name: "Hartwell Cayman LP", type: "lp", cash: 22_100_000, receivables: 2_400_000, payables: 1_100_000 },
  { id: "3", name: "Hartwell Family Trust", type: "trust", cash: 8_700_000, receivables: 0, payables: 45_000 },
  { id: "4", name: "HW Operating Co", type: "corp", cash: 3_950_000, receivables: 620_000, payables: 890_000 },
];

const TRANSACTIONS = [
  { date: "2026-05-19", entity: "Hartwell Delaware LLC", type: "expense", category: "Legal", amount: -48_500, description: "Orrick LLP — LP Agreement drafting" },
  { date: "2026-05-18", entity: "HW Operating Co", type: "income", category: "Management Fee", amount: 125_000, description: "Q2 management fee — Arcadia Energy" },
  { date: "2026-05-17", entity: "Hartwell Cayman LP", type: "capital-call", category: "Investment", amount: -2_000_000, description: "Capital call — Phalanx Defense Series C" },
  { date: "2026-05-15", entity: "Hartwell Family Trust", type: "distribution", category: "Distribution", amount: -500_000, description: "Monthly family distribution" },
  { date: "2026-05-14", entity: "Hartwell Delaware LLC", type: "expense", category: "Tax", amount: -285_000, description: "Q1 federal estimated tax payment" },
  { date: "2026-05-12", entity: "Hartwell Cayman LP", type: "income", category: "Dividend", amount: 340_000, description: "Terrace REIT quarterly dividend" },
];

const PAYABLES = [
  { vendor: "Ernst & Young LLP", amount: 85_000, due: "2026-06-01", entity: "Hartwell Family Trust", category: "Tax" },
  { vendor: "Orrick Herrington", amount: 24_500, due: "2026-06-15", entity: "Hartwell Delaware LLC", category: "Legal" },
  { vendor: "Salesforce Enterprise", amount: 18_200, due: "2026-06-30", entity: "HW Operating Co", category: "Software" },
];

const typeVariant: Record<string, "success" | "danger" | "accent" | "warning"> = {
  income: "success",
  expense: "danger",
  "capital-call": "warning",
  distribution: "accent",
};

export default function FinancePage() {
  const totalLiquidity = ENTITIES.reduce((s, e) => s + e.cash + e.receivables - e.payables, 0);

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Finance"
        subtitle={`Net liquidity across ${ENTITIES.length} entities`}
        actions={
          <div
            className="text-sm font-semibold px-4 py-2 rounded"
            style={{ background: "var(--bg-elevated)", color: "#10b981", fontVariantNumeric: "tabular-nums" }}
          >
            {formatCurrency(totalLiquidity)} net
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
              {ENTITIES.map((e) => {
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
      <div className="flex-1 flex overflow-hidden px-8 py-5 gap-6">
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
                {TRANSACTIONS.map((t, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-surface)" }}>
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
            {PAYABLES.map((p, i) => (
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
    </div>
  );
}
