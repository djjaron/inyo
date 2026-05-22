"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3, AlertTriangle, Loader2, ChevronDown, ChevronUp, TrendingUp, TrendingDown } from "lucide-react";
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

// --- Analytics types ---
interface SectorBucket {
  sector: string;
  count: number;
  totalValue: number;
  pct: number;
}

interface StageBucket {
  stage: string;
  count: number;
  totalValue: number;
  pct: number;
}

interface VintageBucket {
  year: number;
  count: number;
  deployed: number;
}

interface ConcentrationWarning {
  type: string;
  label: string;
  pct: number;
  message: string;
}

interface AnalyticsData {
  allocationBySector: SectorBucket[];
  allocationByStage: StageBucket[];
  vintageByYear: VintageBucket[];
  concentrationWarnings: ConcentrationWarning[];
  totalDeployed: number;
  totalPortfolioValue: number;
  companiesCount: number;
  _mock?: boolean;
}

// --- Color palettes ---
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

const SECTOR_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];
const STAGE_COLORS = ["#10b981", "#6366f1", "#f59e0b", "#8b5cf6", "#06b6d4", "#ef4444"];

function moicColor(moic: number): string {
  if (moic >= 2) return "#10b981";
  if (moic >= 1) return "#f59e0b";
  return "#ef4444";
}

// --- Sub-components ---

function AllocationBars({
  items,
  labelKey,
  colors,
}: {
  items: Array<{ label: string; count: number; totalValue: number; pct: number }>;
  labelKey: string;
  colors: string[];
}) {
  return (
    <div className="flex flex-col gap-2.5">
      {items.map((item, i) => (
        <div key={`${labelKey}-${item.label}`} className="flex items-center gap-3">
          {/* Bar track */}
          <div
            className="relative flex-1 rounded"
            style={{ height: 6, background: "var(--bg-elevated)" }}
          >
            <div
              className="absolute inset-y-0 left-0 rounded"
              style={{
                width: `${item.pct}%`,
                background: colors[i % colors.length],
                height: 6,
                borderRadius: 3,
              }}
            />
          </div>
          {/* Label + stats */}
          <div className="flex items-center gap-2 w-64 shrink-0">
            <span
              className="text-xs font-medium truncate flex-1"
              style={{ color: "var(--text-primary)" }}
            >
              {item.label}
            </span>
            <span
              className="text-xs tabular-nums"
              style={{ color: "var(--text-muted)", minWidth: 28, textAlign: "right" }}
            >
              {item.pct}%
            </span>
            <span
              className="text-xs tabular-nums"
              style={{ color: "var(--text-secondary)", minWidth: 46, textAlign: "right" }}
            >
              {formatCurrency(item.totalValue)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function VintageHeatmap({ items }: { items: VintageBucket[] }) {
  const maxDeployed = Math.max(...items.map((v) => v.deployed), 1);
  return (
    <div className="flex flex-col gap-2">
      {items.map((v) => (
        <div key={v.year} className="flex items-center gap-3">
          <span
            className="text-xs tabular-nums font-medium"
            style={{ color: "var(--text-muted)", width: 36 }}
          >
            {v.year}
          </span>
          <div
            className="relative rounded"
            style={{ height: 6, flex: 1, background: "var(--bg-elevated)" }}
          >
            <div
              className="absolute inset-y-0 left-0 rounded"
              style={{
                width: `${(v.deployed / maxDeployed) * 100}%`,
                background: "var(--accent)",
                height: 6,
                borderRadius: 3,
              }}
            />
          </div>
          <span
            className="text-xs tabular-nums"
            style={{ color: "var(--text-secondary)", minWidth: 46, textAlign: "right" }}
          >
            {formatCurrency(v.deployed)}
          </span>
          <span
            className="text-xs tabular-nums"
            style={{ color: "var(--text-muted)", minWidth: 44, textAlign: "right" }}
          >
            {v.count} {v.count === 1 ? "co" : "cos"}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function PortfolioPage() {
  const familyId = useFamilyId();
  const [companies, setCompanies] = useState<PortfolioCompany[]>([]);
  const [isMock, setIsMock] = useState(false);
  const [loading, setLoading] = useState(true);

  // Construction analytics state
  const [showConstruction, setShowConstruction] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

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

  // Fetch analytics in parallel
  useEffect(() => {
    if (!familyId) return;

    setAnalyticsLoading(true);
    fetch(`/api/portfolio/analytics?familyId=${familyId}`)
      .then((r) => r.json())
      .then((data: AnalyticsData) => setAnalytics(data))
      .catch(() => setAnalytics(null))
      .finally(() => setAnalyticsLoading(false));
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

  // Analytics derived values
  const unrealizedGL = analytics
    ? analytics.totalPortfolioValue - analytics.totalDeployed
    : 0;
  const unrealizedPositive = unrealizedGL >= 0;

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

      {/* ── Portfolio Construction Analytics ── */}
      <div
        className="border-b"
        style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}
      >
        {/* Toggle header */}
        <button
          onClick={() => setShowConstruction((v) => !v)}
          className="w-full flex items-center justify-between px-6 py-3.5 text-left transition-colors"
          style={{ background: "transparent" }}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              Portfolio Construction
            </span>
            {analytics?._mock && (
              <span
                className="text-xs px-1.5 py-0.5 rounded"
                style={{ background: "rgba(245,158,11,0.08)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.18)" }}
              >
                demo
              </span>
            )}
            {analyticsLoading && (
              <Loader2 size={12} className="animate-spin" style={{ color: "var(--text-muted)" }} />
            )}
          </div>
          {showConstruction ? (
            <ChevronUp size={15} style={{ color: "var(--text-muted)" }} />
          ) : (
            <ChevronDown size={15} style={{ color: "var(--text-muted)" }} />
          )}
        </button>

        {/* Expanded content */}
        {showConstruction && analytics && (
          <div className="px-6 pb-6">
            {/* Summary pills */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              {[
                { label: "Total Deployed", value: formatCurrency(analytics.totalDeployed) },
                { label: "Portfolio Value", value: formatCurrency(analytics.totalPortfolioValue) },
                { label: "Companies", value: String(analytics.companiesCount) },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 px-3 py-2 rounded"
                  style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
                >
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</span>
                  <span className="text-sm font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>
                    {value}
                  </span>
                </div>
              ))}
              {/* Unrealized G/L pill */}
              <div
                className="flex items-center gap-2 px-3 py-2 rounded"
                style={{
                  background: unrealizedPositive ? "rgba(16,185,129,0.06)" : "rgba(239,68,68,0.06)",
                  border: unrealizedPositive ? "1px solid rgba(16,185,129,0.18)" : "1px solid rgba(239,68,68,0.18)",
                }}
              >
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>Unrealized G/L</span>
                <span className="flex items-center gap-1 text-sm font-semibold tabular-nums" style={{ color: unrealizedPositive ? "#10b981" : "#ef4444" }}>
                  {unrealizedPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                  {unrealizedPositive ? "+" : ""}{formatCurrency(unrealizedGL)}
                </span>
              </div>
            </div>

            {/* Concentration warnings */}
            {analytics.concentrationWarnings.length > 0 && (
              <div className="mb-5 flex flex-col gap-2">
                {analytics.concentrationWarnings.map((w) => (
                  <div
                    key={`${w.type}-${w.label}`}
                    className="flex items-start gap-2 px-3 py-2.5 rounded text-xs"
                    style={{
                      background: "rgba(245,158,11,0.08)",
                      border: "1px solid rgba(245,158,11,0.2)",
                      color: "#f59e0b",
                    }}
                  >
                    <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                    <span>{w.message}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-8">
              {/* Left column: Sector + Stage */}
              <div className="flex flex-col gap-6">
                {/* Allocation by Sector */}
                <div>
                  <div
                    className="text-xs font-medium mb-3 uppercase tracking-wide"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Allocation by Sector
                  </div>
                  <AllocationBars
                    items={analytics.allocationBySector.map((s) => ({
                      label: s.sector,
                      count: s.count,
                      totalValue: s.totalValue,
                      pct: s.pct,
                    }))}
                    labelKey="sector"
                    colors={SECTOR_COLORS}
                  />
                </div>

                {/* Allocation by Stage */}
                <div>
                  <div
                    className="text-xs font-medium mb-3 uppercase tracking-wide"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Allocation by Stage
                  </div>
                  <AllocationBars
                    items={analytics.allocationByStage.map((s) => ({
                      label: s.stage,
                      count: s.count,
                      totalValue: s.totalValue,
                      pct: s.pct,
                    }))}
                    labelKey="stage"
                    colors={STAGE_COLORS}
                  />
                </div>
              </div>

              {/* Right column: Vintage */}
              <div>
                <div
                  className="text-xs font-medium mb-3 uppercase tracking-wide"
                  style={{ color: "var(--text-muted)" }}
                >
                  Vintage Year
                </div>
                <VintageHeatmap items={analytics.vintageByYear} />
              </div>
            </div>
          </div>
        )}

        {/* Loading state when expanded but data not ready */}
        {showConstruction && !analytics && analyticsLoading && (
          <div className="px-6 pb-6 flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
            <Loader2 size={14} className="animate-spin" />
            Loading analytics…
          </div>
        )}

        {/* Empty state when done loading but no data */}
        {showConstruction && !analytics && !analyticsLoading && (
          <div className="px-6 pb-6 text-sm" style={{ color: "var(--text-muted)" }}>
            No analytics data available.
          </div>
        )}
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
