"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3, AlertTriangle, Loader2 } from "lucide-react";
import Badge from "@/components/ui/Badge";
import PageHeader from "@/components/ui/PageHeader";
import { formatCurrency } from "@/lib/utils";
import { useFamilyId } from "@/context/FamilyContext";

interface PortfolioAlert {
  id: string;
  companyId: string;
  type: string;
  severity: string;
  title: string;
  body?: string;
  source?: string;
  read: boolean;
  createdAt: string;
}

interface PortfolioCompany {
  id: string;
  familyId?: string;
  name: string;
  sector?: string;
  stage?: string;
  status: string;
  investedAmount?: number;
  currentValue?: number;
  ownership?: number;
  alertLevel: string;
  description?: string;
  alerts: PortfolioAlert[];
}

interface FlatAlert {
  company: string;
  title: string;
  severity: string;
  createdAt: string;
}

const alertColor: Record<string, string> = {
  critical: "#ef4444",
  warning: "#f59e0b",
  watch: "#f59e0b",
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

function moicColor(moic: number): string {
  if (moic >= 2) return "#10b981";
  if (moic >= 1) return "#f59e0b";
  return "#ef4444";
}

export default function PortfolioPage() {
  const familyId = useFamilyId();
  const [companies, setCompanies] = useState<PortfolioCompany[]>([]);
  const [isMock, setIsMock] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!familyId) return;

    setLoading(true);
    fetch(`/api/portfolio?familyId=${familyId}`)
      .then((r) => r.json())
      .then((data) => {
        setCompanies(data.companies ?? []);
        setIsMock(!!(data._mock));
      })
      .catch(() => {
        setCompanies([]);
      })
      .finally(() => setLoading(false));
  }, [familyId]);

  const totalInvested = companies.reduce((s, c) => s + (c.investedAmount ?? 0), 0);
  const totalValue = companies.reduce((s, c) => s + (c.currentValue ?? 0), 0);
  const totalMOIC = totalInvested > 0 ? totalValue / totalInvested : 0;

  // Flatten and sort alerts from all companies
  const flatAlerts: FlatAlert[] = companies
    .flatMap((c) =>
      c.alerts.map((a) => ({
        company: c.name,
        title: a.title,
        severity: a.severity,
        createdAt: a.createdAt,
      }))
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const needsAttention = companies.filter((c) => c.alertLevel !== "normal").length;

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Portfolio"
        subtitle={
          loading
            ? "Loading..."
            : `${companies.length} companies · ${needsAttention} require attention`
        }
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

      {/* Mock badge */}
      {isMock && (
        <div
          className="mx-6 mt-3 text-xs px-3 py-2 rounded"
          style={{ background: "rgba(245,158,11,0.08)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.18)" }}
        >
          Demo data — connect a database for live portfolio data
        </div>
      )}

      {/* Summary stats */}
      <div
        className="grid grid-cols-4 gap-0 border-b"
        style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}
      >
        {[
          { label: "Total Invested", value: formatCurrency(totalInvested) },
          { label: "Current Value", value: formatCurrency(totalValue) },
          { label: "Blended MOIC", value: totalInvested > 0 ? `${totalMOIC.toFixed(2)}x` : "—" },
          { label: "Active Companies", value: companies.filter((c) => c.status === "active").length.toString() },
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
          {loading ? (
            <div className="flex items-center justify-center h-40" style={{ color: "var(--text-muted)" }}>
              <Loader2 size={20} className="animate-spin mr-2" /> Loading portfolio...
            </div>
          ) : companies.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-sm" style={{ color: "var(--text-muted)" }}>
              No portfolio companies found.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {companies.map((co) => {
                const moic =
                  co.investedAmount && co.currentValue && co.investedAmount > 0
                    ? co.currentValue / co.investedAmount
                    : null;
                const lastAlert = co.alerts[0] ?? null;

                return (
                  <Link
                    key={co.id}
                    href={`/portfolio/${co.id}`}
                    className="p-5 rounded-md border group cursor-pointer transition-colors block"
                    style={{
                      background: "var(--bg-surface)",
                      borderColor:
                        co.alertLevel === "critical"
                          ? "rgba(239,68,68,0.3)"
                          : co.alertLevel === "alert"
                          ? "rgba(239,68,68,0.2)"
                          : co.alertLevel === "watch"
                          ? "rgba(245,158,11,0.2)"
                          : "var(--border)",
                      textDecoration: "none",
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{co.name}</div>
                        <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                          {[co.sector, co.stage].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge label={co.status} variant={statusVariant[co.status] ?? "muted"} size="xs" />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-3">
                      {[
                        { label: "Invested", value: co.investedAmount ? formatCurrency(co.investedAmount) : "—" },
                        { label: "Value", value: co.currentValue ? formatCurrency(co.currentValue) : "—" },
                        {
                          label: "MOIC",
                          value: moic != null ? `${moic.toFixed(2)}x` : "—",
                          color: moic != null ? moicColor(moic) : "var(--text-muted)",
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

                    {lastAlert && (
                      <div
                        className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded"
                        style={{
                          background:
                            lastAlert.severity === "critical"
                              ? "rgba(239,68,68,0.08)"
                              : "rgba(245,158,11,0.08)",
                          color: alertColor[lastAlert.severity] ?? alertColor.info,
                          border: `1px solid ${
                            lastAlert.severity === "critical"
                              ? "rgba(239,68,68,0.2)"
                              : "rgba(245,158,11,0.2)"
                          }`,
                        }}
                      >
                        <AlertTriangle size={11} />
                        {lastAlert.title}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
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
            {flatAlerts.length === 0 && !loading && (
              <div className="px-4 py-6 text-xs text-center" style={{ color: "var(--text-muted)" }}>
                No alerts
              </div>
            )}
            {flatAlerts.map((alert, i) => (
              <div
                key={i}
                className="px-4 py-3.5 border-b"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                    style={{ background: alertColor[alert.severity] ?? alertColor.info }}
                  />
                  <div>
                    <div className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{alert.title}</div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {alert.company} · {new Date(alert.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </div>
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
