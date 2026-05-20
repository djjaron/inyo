"use client";

import { BarChart3, AlertTriangle, TrendingUp, ExternalLink } from "lucide-react";
import Badge from "@/components/ui/Badge";
import PageHeader from "@/components/ui/PageHeader";
import { formatCurrency } from "@/lib/utils";

const COMPANIES = [
  { id: "1", name: "Meridian AI", sector: "Enterprise AI", stage: "Series B", invested: 4_000_000, value: 9_600_000, multiple: 2.4, status: "active", alertLevel: "normal", lastAlert: null },
  { id: "2", name: "Phalanx Defense", sector: "Defense Tech", stage: "Series C", invested: 12_000_000, value: 28_800_000, multiple: 2.4, status: "active", alertLevel: "normal", lastAlert: null },
  { id: "3", name: "Arcadia Energy", sector: "Clean Energy", stage: "Growth", invested: 20_000_000, value: 22_000_000, multiple: 1.1, status: "active", alertLevel: "warning", lastAlert: "Regulatory filing delayed" },
  { id: "4", name: "Verdant Bio", sector: "Biotech", stage: "Series A", invested: 3_000_000, value: 5_100_000, multiple: 1.7, status: "active", alertLevel: "normal", lastAlert: null },
  { id: "5", name: "Terrace REIT", sector: "Real Estate", stage: "PE", invested: 8_000_000, value: 9_200_000, multiple: 1.15, status: "active", alertLevel: "normal", lastAlert: null },
  { id: "6", name: "ClearReg", sector: "RegTech", stage: "Seed", invested: 1_500_000, value: 3_750_000, multiple: 2.5, status: "active", alertLevel: "normal", lastAlert: null },
  { id: "7", name: "Helios Credit", sector: "Credit", stage: "PE", invested: 10_000_000, value: 9_500_000, multiple: 0.95, status: "watchlist", alertLevel: "alert", lastAlert: "CFO departure announced" },
  { id: "8", name: "NovaSpin", sector: "Healthcare IT", stage: "Series A", invested: 2_000_000, value: 800_000, multiple: 0.4, status: "watchlist", alertLevel: "critical", lastAlert: "Burn rate accelerating, 4mo runway" },
];

const ALERTS = [
  { company: "Helios Credit", title: "CFO departure announced", severity: "critical", ago: "5h" },
  { company: "NovaSpin", title: "Burn rate accelerating, 4mo runway", severity: "critical", ago: "1d" },
  { company: "Arcadia Energy", title: "Regulatory filing delayed 30 days", severity: "warning", ago: "2d" },
  { company: "Meridian AI", title: "New strategic investor joining round", severity: "info", ago: "2h" },
  { company: "ClearReg", title: "SOC 2 Type II certification achieved", severity: "info", ago: "1d" },
];

const totalInvested = COMPANIES.reduce((s, c) => s + c.invested, 0);
const totalValue = COMPANIES.reduce((s, c) => s + c.value, 0);
const totalMOIC = totalValue / totalInvested;

const alertColor: Record<string, string> = {
  critical: "#ef4444",
  warning: "#f59e0b",
  info: "var(--accent)",
  normal: "var(--text-muted)",
  alert: "#ef4444",
};

const statusVariant: Record<string, "success" | "warning" | "danger" | "muted"> = {
  active: "success",
  watchlist: "warning",
  exited: "muted",
  "written-off": "danger",
};

export default function PortfolioPage() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Portfolio"
        subtitle={`${COMPANIES.length} companies · ${COMPANIES.filter((c) => c.alertLevel !== "normal").length} require attention`}
        actions={
          <button
            className="flex items-center gap-1.5 px-3 py-2 rounded text-sm transition-colors"
            style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
          >
            <BarChart3 size={13} />
            Monitor All
          </button>
        }
      />

      {/* Summary stats */}
      <div
        className="grid grid-cols-4 gap-0 border-b"
        style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}
      >
        {[
          { label: "Total Invested", value: formatCurrency(totalInvested) },
          { label: "Current Value", value: formatCurrency(totalValue) },
          { label: "Blended MOIC", value: `${totalMOIC.toFixed(2)}x` },
          { label: "Active Companies", value: COMPANIES.filter((c) => c.status === "active").length.toString() },
        ].map(({ label, value }, i) => (
          <div
            key={label}
            className="px-8 py-5"
            style={{ borderLeft: i > 0 ? "1px solid var(--border)" : "none" }}
          >
            <div className="text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>{label}</div>
            <div
              className="text-xl font-semibold"
              style={{ color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Companies grid */}
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-2 gap-3">
            {COMPANIES.map((co) => (
              <div
                key={co.id}
                className="p-5 rounded-md border group cursor-pointer transition-colors"
                style={{
                  background: "var(--bg-surface)",
                  borderColor: co.alertLevel === "critical" ? "rgba(239,68,68,0.3)" : co.alertLevel === "alert" ? "rgba(239,68,68,0.2)" : "var(--border)",
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{co.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{co.sector} · {co.stage}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge label={co.status} variant={statusVariant[co.status]} size="xs" />
                    <ExternalLink size={13} style={{ color: "var(--text-muted)" }} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-3">
                  {[
                    { label: "Invested", value: formatCurrency(co.invested) },
                    { label: "Value", value: formatCurrency(co.value) },
                    {
                      label: "MOIC",
                      value: `${co.multiple}x`,
                      color: co.multiple >= 2 ? "#10b981" : co.multiple >= 1 ? "var(--text-primary)" : "#ef4444",
                    },
                  ].map(({ label, value, color }) => (
                    <div key={label}>
                      <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>{label}</div>
                      <div
                        className="text-sm font-medium"
                        style={{ color: color ?? "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}
                      >
                        {value}
                      </div>
                    </div>
                  ))}
                </div>

                {co.lastAlert && (
                  <div
                    className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded"
                    style={{
                      background: co.alertLevel === "critical" ? "rgba(239,68,68,0.08)" : "rgba(245,158,11,0.08)",
                      color: alertColor[co.alertLevel],
                      border: `1px solid ${co.alertLevel === "critical" ? "rgba(239,68,68,0.2)" : "rgba(245,158,11,0.2)"}`,
                    }}
                  >
                    <AlertTriangle size={11} />
                    {co.lastAlert}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Alert feed */}
        <div
          className="w-72 shrink-0 border-l overflow-auto"
          style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}
        >
          <div className="px-4 py-3.5 border-b text-sm font-medium" style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}>
            Alert Feed
          </div>
          <div>
            {ALERTS.map((alert, i) => (
              <div
                key={i}
                className="px-4 py-3.5 border-b"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                    style={{ background: alertColor[alert.severity] }}
                  />
                  <div>
                    <div className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{alert.title}</div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{alert.company} · {alert.ago}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
