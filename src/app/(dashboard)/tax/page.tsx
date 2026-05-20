"use client";

import { Receipt, AlertCircle, FileText, Calendar } from "lucide-react";
import Badge from "@/components/ui/Badge";
import PageHeader from "@/components/ui/PageHeader";
import { formatCurrency } from "@/lib/utils";

const K1S = [
  { entity: "Hartwell Cayman LP", year: 2025, status: "received", amount: 2_840_000, filed: false },
  { entity: "Arcadia Energy Fund II", year: 2025, status: "pending", amount: null, filed: false },
  { entity: "Meridian AI SPV", year: 2025, status: "received", amount: -120_000, filed: false },
  { entity: "Terrace REIT", year: 2025, status: "received", amount: 380_000, filed: true },
];

const DEADLINES = [
  { label: "Q2 Federal Estimated Payment", date: "2026-06-16", amount: 485_000, status: "upcoming" },
  { label: "State Tax Returns — CA, NY, DE", date: "2026-10-15", amount: null, status: "upcoming" },
  { label: "Foundation 990-PF Filing", date: "2026-11-15", amount: null, status: "upcoming" },
  { label: "FBAR Foreign Account Report", date: "2026-10-15", amount: null, status: "upcoming" },
];

export default function TaxPage() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Tax"
        subtitle="K-1 tracking, estimated payments, and filing calendar"
      />

      <div className="flex-1 p-8 grid grid-cols-3 gap-6 overflow-auto">
        {/* K-1 Tracker */}
        <div className="col-span-2">
          <h2 className="text-xs font-medium tracking-wider uppercase mb-4" style={{ color: "var(--text-muted)" }}>
            K-1 Tracker — Tax Year 2025
          </h2>
          <div className="rounded-md border overflow-hidden" style={{ borderColor: "var(--border)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border)" }}>
                  {["Entity", "Year", "Status", "Income/Loss", "Filed"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-medium" style={{ color: "var(--text-muted)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {K1S.map((k, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-surface)" }}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <FileText size={13} style={{ color: "var(--text-muted)" }} />
                        <span style={{ color: "var(--text-primary)" }}>{k.entity}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs font-mono" style={{ color: "var(--text-muted)" }}>{k.year}</td>
                    <td className="px-5 py-3.5">
                      <Badge
                        label={k.status}
                        variant={k.status === "received" ? "success" : "warning"}
                        size="xs"
                      />
                    </td>
                    <td
                      className="px-5 py-3.5 text-xs font-mono"
                      style={{
                        color: k.amount === null ? "var(--text-muted)" : k.amount > 0 ? "#10b981" : "#ef4444",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {k.amount === null ? "—" : formatCurrency(Math.abs(k.amount))}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge label={k.filed ? "Filed" : "Pending"} variant={k.filed ? "success" : "muted"} size="xs" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Filing Calendar */}
        <div>
          <h2 className="text-xs font-medium tracking-wider uppercase mb-4" style={{ color: "var(--text-muted)" }}>
            Filing Calendar
          </h2>
          <div className="flex flex-col gap-2">
            {DEADLINES.map((d, i) => (
              <div
                key={i}
                className="p-4 rounded-md border"
                style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
              >
                <div className="text-xs font-medium mb-1" style={{ color: "var(--text-primary)" }}>{d.label}</div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                    <Calendar size={11} />
                    {d.date}
                  </div>
                  {d.amount && (
                    <span
                      className="text-xs font-mono font-medium"
                      style={{ color: "#f59e0b", fontVariantNumeric: "tabular-nums" }}
                    >
                      {formatCurrency(d.amount)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
