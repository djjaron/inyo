"use client";

import { Heart, Award, Calendar } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";

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

export default function PhilanthropyPage() {
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
      </div>
    </div>
  );
}
