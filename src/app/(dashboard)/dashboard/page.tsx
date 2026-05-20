"use client";

import { TrendingUp, BarChart3, Clock, DollarSign, AlertTriangle, CheckCircle2, Bot } from "lucide-react";
import Badge from "@/components/ui/Badge";
import ScoreRing from "@/components/ui/ScoreRing";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";

const RECENT_DEALS = [
  { company: "Phalanx Defense", sector: "Defense Tech", stage: "Series C", score: 88, status: "ic-review" },
  { company: "Meridian AI", sector: "Enterprise AI", stage: "Series B", score: 84, status: "diligence" },
  { company: "Arcadia Energy", sector: "Clean Energy", stage: "Growth", score: 79, status: "ic-review" },
  { company: "Verdant Bio", sector: "Biotech", stage: "Series A", score: 71, status: "reviewing" },
  { company: "Terrace REIT", sector: "Real Estate", stage: "PE", score: 73, status: "inbound" },
];

const ALERTS = [
  { company: "Meridian AI", type: "Funding", title: "New strategic investor joining round", severity: "info", ago: "2h" },
  { company: "Helios Credit", type: "Risk", title: "CFO departure announced", severity: "critical", ago: "5h" },
  { company: "ClearReg", type: "Product", title: "SOC 2 Type II certification achieved", severity: "info", ago: "1d" },
  { company: "Arcadia Energy", type: "Legal", title: "Regulatory filing delayed 30 days", severity: "warning", ago: "2d" },
];

const APPROVALS = [
  { title: "Sign NDA — Phalanx Defense", agent: "Legal Review", priority: "high", id: "a1" },
  { title: "Wire $500K to Arcadia escrow", agent: "CFO Agent", priority: "urgent", id: "a2" },
  { title: "Schedule IC meeting for Meridian", agent: "Chief of Staff", priority: "normal", id: "a3" },
];

const severityDot: Record<string, string> = {
  critical: "#ef4444",
  warning: "#f59e0b",
  info: "var(--accent)",
};

const priorityVariant: Record<string, "danger" | "warning" | "muted"> = {
  urgent: "danger",
  high: "warning",
  normal: "muted",
};

const statusLabel: Record<string, string> = {
  inbound: "Inbound", reviewing: "Reviewing", diligence: "Diligence",
  "ic-review": "IC Review", invested: "Invested", passed: "Passed",
};

const statusVariant: Record<string, "accent" | "warning" | "success" | "muted"> = {
  inbound: "accent", reviewing: "accent", diligence: "warning",
  "ic-review": "warning", invested: "success", passed: "muted",
};

export default function DashboardPage() {
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="flex flex-col min-h-full p-8 gap-6" style={{ background: "var(--bg-base)" }}>
      {/* Header */}
      <div>
        <p className="text-xs tracking-widest uppercase mb-1" style={{ color: "var(--text-muted)" }}>{today}</p>
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
          Good morning.
        </h1>
      </div>

      {/* Stat widgets */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { icon: TrendingUp, label: "Active Deals", value: "12", trend: "+3 this week", color: "var(--accent)" },
          { icon: BarChart3, label: "Portfolio Companies", value: "23", trend: "2 on watchlist", color: "var(--success)" },
          { icon: Clock, label: "Pending Approvals", value: "3", trend: "2 urgent", color: "#f59e0b" },
          { icon: DollarSign, label: "Net Liquidity", value: "$47.2M", trend: "Across 4 entities", color: "#10b981" },
        ].map(({ icon: Icon, label, value, trend, color }) => (
          <div
            key={label}
            className="p-5 rounded-md border"
            style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="text-xs tracking-wide" style={{ color: "var(--text-muted)" }}>{label}</div>
              <Icon size={14} style={{ color }} />
            </div>
            <div
              className="text-2xl font-semibold mb-1"
              style={{ color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}
            >
              {value}
            </div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>{trend}</div>
          </div>
        ))}
      </div>

      {/* Main 2-col */}
      <div className="grid grid-cols-2 gap-4">
        {/* Deal flow */}
        <div className="rounded-md border overflow-hidden" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: "var(--border)" }}>
            <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Recent Deal Flow</span>
            <Link href="/opportunities" className="text-xs" style={{ color: "var(--accent)" }}>View all →</Link>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Company", "Sector", "Score", "Status"].map((h) => (
                  <th key={h} className="text-left px-5 py-2.5 font-medium" style={{ color: "var(--text-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RECENT_DEALS.map((d) => (
                <tr key={d.company} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <td className="px-5 py-3">
                    <div style={{ color: "var(--text-primary)" }}>{d.company}</div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{d.stage}</div>
                  </td>
                  <td className="px-5 py-3" style={{ color: "var(--text-secondary)" }}>{d.sector}</td>
                  <td className="px-5 py-3"><ScoreRing score={d.score} size={32} /></td>
                  <td className="px-5 py-3">
                    <Badge label={statusLabel[d.status]} variant={statusVariant[d.status]} size="xs" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Portfolio alerts */}
        <div className="rounded-md border overflow-hidden" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: "var(--border)" }}>
            <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Portfolio Alerts</span>
            <Link href="/portfolio" className="text-xs" style={{ color: "var(--accent)" }}>View all →</Link>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
            {ALERTS.map((alert) => (
              <div key={alert.title} className="flex items-start gap-3 px-5 py-3.5">
                <div
                  className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                  style={{ background: severityDot[alert.severity] }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>{alert.title}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {alert.company} · {alert.type}
                  </div>
                </div>
                <span className="text-xs shrink-0" style={{ color: "var(--text-muted)" }}>{alert.ago}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Approvals */}
      <div className="rounded-md border overflow-hidden" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2 px-5 py-3.5 border-b" style={{ borderColor: "var(--border)" }}>
          <Bot size={14} style={{ color: "var(--accent)" }} />
          <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Tasks Awaiting Approval</span>
          <span
            className="ml-1 text-xs px-1.5 py-0.5 rounded"
            style={{ background: "var(--accent-muted)", color: "var(--accent)" }}
          >
            {APPROVALS.length}
          </span>
        </div>
        <div className="flex gap-4 p-4">
          {APPROVALS.map((a) => (
            <div
              key={a.id}
              className="flex-1 p-4 rounded border"
              style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{a.title}</div>
                <Badge label={a.priority} variant={priorityVariant[a.priority]} size="xs" />
              </div>
              <div className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
                via {a.agent}
              </div>
              <div className="flex gap-2">
                <button
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium"
                  style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}
                >
                  <CheckCircle2 size={11} /> Approve
                </button>
                <button
                  className="px-2.5 py-1.5 rounded text-xs"
                  style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
