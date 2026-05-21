"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Bot,
  AlertTriangle,
  TrendingUp,
  RefreshCw,
  Activity,
  Loader2,
  Building2,
  DollarSign,
  Calendar,
  Link2,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import ScoreRing from "@/components/ui/ScoreRing";
import { formatCurrency, formatDate } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

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

interface AIAnalysisRecord {
  id: string;
  agentType: string;
  output: Record<string, unknown>;
  createdAt: string;
  _mock?: boolean;
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
  investedAt?: string;
  lastFundingDate?: string;
  lastFundingRound?: string;
  website?: string;
  description?: string;
  alertLevel: string;
  createdAt: string;
  updatedAt?: string;
  alerts: PortfolioAlert[];
  aiAnalyses: AIAnalysisRecord[];
}

interface MonitorOutput {
  healthScore?: number;
  recommendation?: string;
  summary?: string;
  keyMetrics?: {
    arr?: number;
    arrGrowth?: string;
    grossMargin?: string;
    burnRate?: number;
    runway?: string;
    nrr?: string;
  };
  risks?: string[];
  opportunities?: string[];
  alerts?: string[];
  nextCheckIn?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const statusVariant: Record<string, "success" | "warning" | "danger" | "muted"> = {
  active: "success",
  watchlist: "warning",
  exited: "muted",
  "written-off": "danger",
};

const alertSeverityColor: Record<string, string> = {
  critical: "#ef4444",
  warning: "#f59e0b",
  info: "var(--accent)",
  normal: "var(--text-muted)",
};

function moicColor(moic: number): string {
  if (moic >= 2) return "#10b981";
  if (moic >= 1) return "#f59e0b";
  return "#ef4444";
}

function recVariant(rec?: string): "success" | "warning" | "danger" | "muted" {
  if (!rec) return "muted";
  const r = rec.toLowerCase();
  if (r === "hold" || r === "watch" || r === "monitor") return "warning";
  if (r === "exit" || r === "sell") return "danger";
  if (r === "buy" || r === "add" || r === "increase") return "success";
  return "muted";
}

type Tab = "overview" | "monitor" | "alerts";

// ── Component ─────────────────────────────────────────────────────────────────

export default function PortfolioDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [company, setCompany] = useState<PortfolioCompany | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");

  const [monitor, setMonitor] = useState<MonitorOutput | null>(null);
  const [monitorMock, setMonitorMock] = useState(false);
  const [runningMonitor, setRunningMonitor] = useState(false);

  useEffect(() => {
    fetch(`/api/portfolio/${id}`)
      .then((r) => r.json())
      .then((data) => {
        const c: PortfolioCompany = data.company ?? data;
        setCompany(c);
        // Pre-load most recent portfolio-monitor analysis if available
        const latest = (c.aiAnalyses ?? []).find((a) => a.agentType === "portfolio-monitor");
        if (latest) {
          setMonitor(latest.output as MonitorOutput);
          setMonitorMock(!!(latest as { _mock?: boolean })._mock);
        }
      })
      .catch(() => {
        setCompany({
          id,
          name: "Demo Company",
          status: "active",
          alertLevel: "normal",
          createdAt: new Date().toISOString(),
          alerts: [],
          aiAnalyses: [],
        });
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function runPortfolioMonitor() {
    if (!company) return;
    setRunningMonitor(true);
    setTab("monitor");
    try {
      const res = await fetch("/api/agents/portfolio-monitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyId: company.familyId ?? "family_demo",
          companyId: company.id,
          context: {
            name: company.name,
            sector: company.sector,
            stage: company.stage,
            status: company.status,
            investedAmount: company.investedAmount,
            currentValue: company.currentValue,
            ownership: company.ownership,
            description: company.description,
          },
        }),
      });
      const data = await res.json();
      setMonitor((data.result ?? data.analysis?.output ?? {}) as MonitorOutput);
      setMonitorMock(!!(data.analysis?._mock || data._mock));
    } finally {
      setRunningMonitor(false);
    }
  }

  // ── Loading / not-found ───────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full" style={{ color: "var(--text-muted)" }}>
        <Loader2 size={20} className="animate-spin mr-2" /> Loading company...
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex items-center justify-center h-full text-sm" style={{ color: "var(--text-muted)" }}>
        Company not found.{" "}
        <Link href="/portfolio" className="ml-2 underline" style={{ color: "var(--accent)" }}>
          Back to portfolio
        </Link>
      </div>
    );
  }

  const moic =
    company.investedAmount && company.currentValue && company.investedAmount > 0
      ? company.currentValue / company.investedAmount
      : null;

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "overview", label: "Overview", icon: <Building2 size={13} /> },
    { key: "monitor", label: "Monitor", icon: <Activity size={13} /> },
    { key: "alerts", label: `Alerts${company.alerts.length > 0 ? ` (${company.alerts.length})` : ""}`, icon: <AlertTriangle size={13} /> },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-8 pt-6 pb-4 flex-shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
        <Link
          href="/portfolio"
          className="flex items-center gap-1 text-xs mb-4 w-fit"
          style={{ color: "var(--text-muted)" }}
        >
          <ChevronLeft size={13} /> Portfolio
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>{company.name}</h1>
              <Badge label={company.status} variant={statusVariant[company.status] ?? "muted"} size="xs" />
              {company.stage && (
                <Badge label={company.stage.replace(/-/g, " ")} variant="muted" size="xs" />
              )}
            </div>
            {company.sector && (
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{company.sector}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={runPortfolioMonitor}
              disabled={runningMonitor}
              className="flex items-center gap-1.5 px-3 py-2 rounded text-xs font-medium transition-opacity disabled:opacity-50"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              {runningMonitor ? <Loader2 size={12} className="animate-spin" /> : <Activity size={12} />}
              Run Monitor
            </button>
          </div>
        </div>

        {/* Key metrics row */}
        <div className="flex items-center gap-6 mt-4 flex-wrap">
          {company.investedAmount != null && (
            <div className="flex items-center gap-1.5 text-sm" style={{ color: "var(--text-secondary)" }}>
              <DollarSign size={13} style={{ color: "var(--text-muted)" }} />
              {formatCurrency(company.investedAmount)} invested
            </div>
          )}
          {company.currentValue != null && (
            <div className="flex items-center gap-1.5 text-sm" style={{ color: "var(--text-secondary)" }}>
              <TrendingUp size={13} style={{ color: "var(--text-muted)" }} />
              {formatCurrency(company.currentValue)} current value
            </div>
          )}
          {moic != null && (
            <div className="flex items-center gap-1.5 text-sm font-medium" style={{ color: moicColor(moic) }}>
              {moic.toFixed(2)}x MOIC
            </div>
          )}
          {company.ownership != null && (
            <div className="flex items-center gap-1.5 text-sm" style={{ color: "var(--text-secondary)" }}>
              {company.ownership}% ownership
            </div>
          )}
          {company.createdAt && (
            <div className="flex items-center gap-1.5 text-sm" style={{ color: "var(--text-muted)" }}>
              <Calendar size={13} />
              Added {formatDate(company.createdAt)}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex items-center gap-1 px-8 py-0 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-surface)" }}
      >
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex items-center gap-1.5 px-3 py-3 text-xs font-medium transition-colors border-b-2"
            style={
              tab === t.key
                ? { color: "var(--accent)", borderColor: "var(--accent)" }
                : { color: "var(--text-muted)", borderColor: "transparent" }
            }
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        {/* ── Overview ── */}
        {tab === "overview" && (
          <div className="p-8 max-w-4xl">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {/* Main content */}
              <div className="md:col-span-2 space-y-5">
                {company.description && (
                  <div className="p-4 rounded-lg" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
                    <div className="text-xs font-semibold tracking-wide uppercase mb-2" style={{ color: "var(--text-muted)" }}>
                      Description
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      {company.description}
                    </p>
                  </div>
                )}

                {/* Analysis history */}
                {company.aiAnalyses && company.aiAnalyses.length > 0 && (
                  <div className="p-4 rounded-lg" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
                    <div className="text-xs font-semibold tracking-wide uppercase mb-3" style={{ color: "var(--text-muted)" }}>
                      Analysis History
                    </div>
                    <div className="space-y-2">
                      {company.aiAnalyses.map((a) => (
                        <div
                          key={a.id}
                          className="flex items-center justify-between text-xs py-2"
                          style={{ borderBottom: "1px solid var(--border-subtle)" }}
                        >
                          <div className="flex items-center gap-2">
                            <Bot size={12} style={{ color: "var(--text-muted)" }} />
                            <span style={{ color: "var(--text-secondary)" }}>
                              {a.agentType === "portfolio-monitor" ? "Portfolio Monitor" : a.agentType}
                            </span>
                          </div>
                          <span style={{ color: "var(--text-muted)" }}>{formatDate(a.createdAt)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar metadata */}
              <div className="space-y-4">
                {[
                  { label: "Sector", value: company.sector },
                  { label: "Stage", value: company.stage?.replace(/-/g, " ") },
                  { label: "Status", value: company.status },
                  {
                    label: "Invested",
                    value: company.investedAmount ? formatCurrency(company.investedAmount) : undefined,
                  },
                  {
                    label: "Current Value",
                    value: company.currentValue ? formatCurrency(company.currentValue) : undefined,
                  },
                  {
                    label: "Ownership",
                    value: company.ownership != null ? `${company.ownership}%` : undefined,
                  },
                  { label: "Last Round", value: company.lastFundingRound },
                  {
                    label: "Last Funding",
                    value: company.lastFundingDate ? formatDate(company.lastFundingDate) : undefined,
                  },
                  {
                    label: "Invested At",
                    value: company.investedAt ? formatDate(company.investedAt) : undefined,
                  },
                  { label: "Website", value: company.website },
                ]
                  .filter((f) => f.value)
                  .map((f) => (
                    <div key={f.label}>
                      <div className="text-xs mb-0.5" style={{ color: "var(--text-muted)" }}>{f.label}</div>
                      {f.label === "Website" ? (
                        <a
                          href={f.value}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm"
                          style={{ color: "var(--accent)" }}
                        >
                          <Link2 size={11} /> {f.value}
                        </a>
                      ) : (
                        <div className="text-sm capitalize" style={{ color: "var(--text-secondary)" }}>
                          {f.value}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Monitor ── */}
        {tab === "monitor" && (
          <div className="p-8 max-w-3xl">
            {runningMonitor ? (
              <div className="flex items-center gap-3 py-12" style={{ color: "var(--text-muted)" }}>
                <Loader2 size={18} className="animate-spin" />
                <span className="text-sm">Running Portfolio Monitor...</span>
              </div>
            ) : monitor ? (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>Portfolio Monitor Analysis</span>
                  <button
                    onClick={runPortfolioMonitor}
                    className="flex items-center gap-1 px-2.5 py-1 rounded text-xs"
                    style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
                  >
                    <RefreshCw size={11} /> Re-run
                  </button>
                </div>

                {monitorMock && (
                  <div
                    className="text-xs px-3 py-2 rounded"
                    style={{ background: "rgba(245,158,11,0.08)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.18)" }}
                  >
                    Demo analysis — add an Anthropic API key for real AI output
                  </div>
                )}

                {/* Health score + recommendation */}
                <div
                  className="flex items-center gap-6 p-5 rounded-lg"
                  style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
                >
                  {monitor.healthScore != null && (
                    <ScoreRing score={monitor.healthScore} size={72} />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5">
                      <span className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                        Health Score
                      </span>
                      {monitor.recommendation && (
                        <Badge
                          label={monitor.recommendation.toUpperCase()}
                          variant={recVariant(monitor.recommendation)}
                          size="xs"
                        />
                      )}
                    </div>
                    {monitor.summary && (
                      <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                        {monitor.summary}
                      </p>
                    )}
                  </div>
                </div>

                {/* Key metrics grid */}
                {monitor.keyMetrics && (
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "ARR", value: monitor.keyMetrics.arr ? formatCurrency(monitor.keyMetrics.arr) : undefined },
                      { label: "ARR Growth", value: monitor.keyMetrics.arrGrowth },
                      { label: "Gross Margin", value: monitor.keyMetrics.grossMargin },
                      { label: "Burn Rate", value: monitor.keyMetrics.burnRate ? formatCurrency(monitor.keyMetrics.burnRate) + "/mo" : undefined },
                      { label: "Runway", value: monitor.keyMetrics.runway },
                      { label: "NRR", value: monitor.keyMetrics.nrr },
                    ]
                      .filter((m) => m.value)
                      .map((m) => (
                        <div
                          key={m.label}
                          className="p-3 rounded-lg"
                          style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
                        >
                          <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>{m.label}</div>
                          <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{m.value}</div>
                        </div>
                      ))}
                  </div>
                )}

                {/* Risks + Opportunities */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {monitor.risks && monitor.risks.length > 0 && (
                    <div className="p-4 rounded-lg" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle size={14} style={{ color: "#f59e0b" }} />
                        <span className="text-xs font-semibold tracking-wide uppercase" style={{ color: "var(--text-muted)" }}>
                          Risks
                        </span>
                      </div>
                      <ul className="space-y-2">
                        {monitor.risks.map((r, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                            <span className="mt-1.5 shrink-0 w-1 h-1 rounded-full" style={{ background: "#f59e0b" }} />
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {monitor.opportunities && monitor.opportunities.length > 0 && (
                    <div className="p-4 rounded-lg" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp size={14} style={{ color: "#10b981" }} />
                        <span className="text-xs font-semibold tracking-wide uppercase" style={{ color: "var(--text-muted)" }}>
                          Opportunities
                        </span>
                      </div>
                      <ul className="space-y-2">
                        {monitor.opportunities.map((o, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                            <span className="mt-1.5 shrink-0 w-1 h-1 rounded-full" style={{ background: "#10b981" }} />
                            {o}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Next check-in */}
                {monitor.nextCheckIn && (
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Next check-in: <span style={{ color: "var(--text-secondary)" }}>{monitor.nextCheckIn}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                <Activity size={36} style={{ color: "var(--text-muted)" }} />
                <div>
                  <p className="text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>No monitor analysis yet</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Run the Portfolio Monitor agent to get a health score, key metrics, risks, and opportunities.
                  </p>
                </div>
                <button
                  onClick={runPortfolioMonitor}
                  className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
                  style={{ background: "var(--accent)", color: "#fff" }}
                >
                  <Activity size={14} /> Run Portfolio Monitor
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Alerts ── */}
        {tab === "alerts" && (
          <div className="p-8 max-w-3xl">
            {company.alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                <AlertTriangle size={36} style={{ color: "var(--text-muted)" }} />
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>No alerts for this company.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {company.alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-4 rounded-lg"
                    style={{
                      background: "var(--bg-elevated)",
                      border: `1px solid ${
                        alert.severity === "critical"
                          ? "rgba(239,68,68,0.25)"
                          : alert.severity === "warning"
                          ? "rgba(245,158,11,0.25)"
                          : "var(--border)"
                      }`,
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-2 h-2 rounded-full mt-1 shrink-0"
                        style={{ background: alertSeverityColor[alert.severity] ?? alertSeverityColor.info }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                            {alert.title}
                          </span>
                          <Badge
                            label={alert.severity}
                            variant={
                              alert.severity === "critical"
                                ? "danger"
                                : alert.severity === "warning"
                                ? "warning"
                                : "muted"
                            }
                            size="xs"
                          />
                        </div>
                        {alert.body && (
                          <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                            {alert.body}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
                          {alert.source && <span>{alert.source}</span>}
                          <span>{formatDate(alert.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
