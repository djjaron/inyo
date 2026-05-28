"use client";

import { useState, useEffect, useCallback } from "react";
import {
  TrendingUp, BarChart3, DollarSign, Clock,
  CheckCircle2, XCircle, ChevronDown, ChevronUp,
  Zap, Bot, RefreshCw, ExternalLink,
  ArrowUpRight, ArrowDownRight, AlertTriangle, Info, Rocket, Users,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import ScoreRing from "@/components/ui/ScoreRing";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { useFamilyId } from "@/context/FamilyContext";
import type { AgentRunItem } from "@/app/api/agents/runs/route";
import type { PortfolioPerformance } from "@/app/api/dashboard/route";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RecentDeal {
  id: string;
  company: string;
  sector: string | null;
  stage: string | null;
  dealScore: number | null;
  status: string;
  createdAt: string;
}

interface DashboardStats {
  totalDeals: number;
  pipelineValue: number;
  activeDeals: number;
  portfolioCompanies: number;
}

interface AlertItem {
  id: string;
  companyName: string;
  type: string;
  severity: string;
  title: string;
  createdAt: string;
}

interface DashboardData {
  stats: DashboardStats;
  portfolioPerformance: PortfolioPerformance;
  recentDeals: RecentDeal[];
  alerts: AlertItem[];
  recentRuns: AgentRunItem[];
  _mock: boolean;
}

interface PendingApproval {
  id: string;
  title: string;
  type: string;
  priority: string;
  description?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function timeAgo(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const SEVERITY_DOT: Record<string, string> = {
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "var(--accent)",
};

const SEVERITY_BG: Record<string, string> = {
  success: "rgba(16,185,129,0.08)",
  warning: "rgba(245,158,11,0.08)",
  error: "rgba(239,68,68,0.08)",
  info: "rgba(59,130,246,0.06)",
};

const SEVERITY_BORDER: Record<string, string> = {
  success: "rgba(16,185,129,0.2)",
  warning: "rgba(245,158,11,0.2)",
  error: "rgba(239,68,68,0.2)",
  info: "rgba(59,130,246,0.15)",
};

const TRIGGER_LABEL: Record<string, string> = {
  scheduled: "Scheduled",
  ingestion: "Auto",
  manual: "Manual",
  a2a: "A2A",
};

const AGENT_LABEL: Record<string, string> = {
  "deal-flow": "Deal Flow",
  "deal-enrichment": "Deal Enrichment",
  "portfolio-monitor": "Portfolio Monitor",
  "cfo": "CFO",
  "ic-memo": "IC Memo",
  "legal": "Legal Review",
  "tax": "Tax",
  "chief-of-staff": "Chief of Staff",
  "concierge": "Concierge",
  "philanthropy": "Philanthropy",
  "relationships": "Relationships",
  "term-sheet": "Term Sheet",
  "diligence": "Diligence",
};

const PRIORITY_COLOR: Record<string, string> = {
  urgent: "#ef4444",
  high: "#f59e0b",
  normal: "var(--accent)",
  low: "var(--text-muted)",
};

const STATUS_BADGE: Record<string, "accent" | "warning" | "success" | "muted"> = {
  inbound: "accent", reviewing: "accent", diligence: "warning",
  "ic-review": "warning", invested: "success", passed: "muted",
};

const ALERT_SEVERITY_COLOR: Record<string, string> = {
  critical: "#ef4444",
  warning: "#f59e0b",
  info: "var(--accent)",
};

const ALERT_TYPE_LABEL: Record<string, string> = {
  "funding": "Funding",
  "executive-departure": "Exec Departure",
  "layoffs": "Layoffs",
  "press": "Press",
  "legal": "Legal",
  "burn-rate": "Burn Rate",
};

// ---------------------------------------------------------------------------
// Activity Feed Entry
// ---------------------------------------------------------------------------

function RunEntry({ run }: { run: AgentRunItem }) {
  const [open, setOpen] = useState(false);
  const dot = SEVERITY_DOT[run.severity] ?? "var(--accent)";
  const bg = SEVERITY_BG[run.severity] ?? SEVERITY_BG.info;
  const border = SEVERITY_BORDER[run.severity] ?? SEVERITY_BORDER.info;
  const preview = run.outputPreview;

  return (
    <div
      className="rounded-md border"
      style={{ background: bg, borderColor: border }}
    >
      <button
        className="w-full flex items-start gap-3 px-4 py-3 text-left"
        onClick={() => setOpen((o) => !o)}
      >
        <div
          className="w-2 h-2 rounded-full mt-1.5 shrink-0"
          style={{ background: dot }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
              {run.label}
            </span>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
              style={{ background: "var(--bg-elevated)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
            >
              {AGENT_LABEL[run.agentType] ?? run.agentType}
            </span>
            {run.triggerType && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                style={{ background: "var(--bg-elevated)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
              >
                {TRIGGER_LABEL[run.triggerType] ?? run.triggerType}
              </span>
            )}
          </div>
          <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {timeAgo(run.completedAt ?? run.createdAt)}
          </div>
        </div>
        <div style={{ color: "var(--text-muted)" }}>
          {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </div>
      </button>

      {open && preview && (
        <div
          className="px-4 pb-3"
          style={{ borderTop: "1px solid var(--border-subtle)" }}
        >
          <div
            className="mt-2 p-3 rounded text-xs font-mono overflow-x-auto"
            style={{ background: "var(--bg-base)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
          >
            {Object.entries(preview).map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <span style={{ color: "var(--text-muted)" }}>{k}:</span>
                <span>{typeof v === "object" ? JSON.stringify(v) : String(v)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const familyId = useFamilyId();
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const greeting = getGreeting();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!familyId) return;
    setLoading(true);
    try {
      const [dashRes, appRes] = await Promise.all([
        fetch(`/api/dashboard?familyId=${encodeURIComponent(familyId)}`),
        fetch(`/api/approvals?familyId=${encodeURIComponent(familyId)}&status=pending`),
      ]);
      setData(await dashRes.json());
      const appJson = await appRes.json();
      setPendingApprovals((appJson.approvals ?? []).slice(0, 3));
    } catch {
      // leave stale data
    } finally {
      setLoading(false);
    }
  }, [familyId]);

  useEffect(() => { load(); }, [load]);

  async function handleApproval(id: string, status: "approved" | "rejected") {
    setApprovingId(id);
    try {
      await fetch(`/api/approvals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setPendingApprovals((prev) => prev.filter((a) => a.id !== id));
    } catch { /* best-effort */ }
    setApprovingId(null);
  }

  const isInitialLoad = loading && !data;
  const stats = data?.stats;
  const perf = data?.portfolioPerformance;
  const runs = data?.recentRuns ?? [];
  const deals = (data?.recentDeals ?? []).sort((a, b) => (b.dealScore ?? -1) - (a.dealScore ?? -1));
  const alerts = data?.alerts ?? [];
  const isMock = data?._mock ?? false;
  const hasDeals = deals.length > 0;

  return (
    <div className="flex flex-col min-h-full p-8 gap-6" style={{ background: "var(--bg-base)" }}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs tracking-widest uppercase mb-1" style={{ color: "var(--text-muted)" }}>{today}</p>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
            {greeting}.
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {isMock && !isInitialLoad && (
            <span
              className="text-xs px-2.5 py-1 rounded-md"
              title="You're viewing sample data. Add your own deals and agents to see real activity."
              style={{ background: "rgba(245,158,11,0.08)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)", cursor: "help" }}
            >
              Sample data
            </span>
          )}
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs"
            style={{ background: "var(--bg-surface)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
          >
            <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Getting started — only shown when on sample/mock data */}
      {isMock && !isInitialLoad && (
        <div
          className="rounded-lg border p-5"
          style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.06) 0%, rgba(139,92,246,0.04) 100%)", borderColor: "rgba(59,130,246,0.2)" }}
        >
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0" style={{ background: "rgba(59,130,246,0.12)" }}>
              <Rocket size={16} style={{ color: "var(--accent)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold mb-0.5" style={{ color: "var(--text-primary)" }}>
                Welcome to Inyo — get started in 4 steps
              </div>
              <div className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
                You&apos;re viewing sample data. Complete these steps to activate your family office OS.
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { href: "/import/deals", label: "Import deals", sub: "CSV or one by one", icon: TrendingUp, color: "var(--accent)" },
                  { href: "/import/contacts", label: "Import contacts", sub: "Network & LPs", icon: Users, color: "#10b981" },
                  { href: "/finance", label: "Add entities", sub: "LLCs, trusts, LPs", icon: DollarSign, color: "#f59e0b" },
                  { href: "/agents", label: "Run agents", sub: "Score & enrich deals", icon: Zap, color: "#8b5cf6" },
                ].map(({ href, label, sub, icon: Icon, color }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-3 p-3 rounded-md border transition-colors hover:bg-white/5"
                    style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}
                  >
                    <div className="w-7 h-7 rounded flex items-center justify-center shrink-0" style={{ background: `${color}18`, color }}>
                      <Icon size={13} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>{label}</div>
                      <div className="text-[10px] truncate" style={{ color: "var(--text-muted)" }}>{sub}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { icon: TrendingUp, label: "Active Deals", value: stats?.activeDeals, sub: stats ? `${stats.totalDeals} total` : null, fmt: String, color: "var(--accent)", href: "/opportunities" },
          { icon: BarChart3, label: "Portfolio", value: stats?.portfolioCompanies, sub: "companies", fmt: String, color: "#10b981", href: "/portfolio" },
          { icon: Clock, label: "Pending Approvals", value: isInitialLoad ? null : pendingApprovals.length, sub: `${pendingApprovals.filter((a) => a.priority === "urgent").length} urgent`, fmt: String, color: "#f59e0b", href: "/approvals" },
          { icon: DollarSign, label: "Pipeline Value", value: stats?.pipelineValue, sub: "active deal flow", fmt: formatCurrency, color: "#10b981", href: "/opportunities" },
        ].map(({ icon: Icon, label, value, sub, fmt, color, href }) => (
          <Link key={label} href={href} className="p-5 rounded-md border block transition-opacity hover:opacity-80"
            style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs tracking-wide" style={{ color: "var(--text-muted)" }}>{label}</span>
              <Icon size={14} style={{ color }} />
            </div>
            {value == null ? (
              <div className="h-8 w-16 rounded animate-pulse mb-1" style={{ background: "var(--bg-elevated)" }} />
            ) : (
              <div className="text-2xl font-semibold mb-1" style={{ color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                {fmt(value as never)}
              </div>
            )}
            {sub == null ? (
              <div className="h-3 w-20 rounded animate-pulse mt-1" style={{ background: "var(--bg-elevated)" }} />
            ) : (
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>{sub}</div>
            )}
          </Link>
        ))}
      </div>

      {/* Portfolio Performance Row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          {
            label: "Total Deployed",
            value: perf?.totalDeployed,
            fmt: formatCurrency,
            sub: "invested capital",
            color: "var(--text-muted)",
            icon: DollarSign,
          },
          {
            label: "Current Value",
            value: perf?.currentValue,
            fmt: formatCurrency,
            sub: "marked portfolio",
            color: "#10b981",
            icon: BarChart3,
          },
          {
            label: "Unrealized P&L",
            value: perf?.unrealizedPnL,
            fmt: (v: number) => `${v >= 0 ? "+" : ""}${formatCurrency(v)}`,
            sub: perf ? (perf.unrealizedPnL >= 0 ? "gain" : "loss") : "—",
            color: perf ? (perf.unrealizedPnL >= 0 ? "#10b981" : "#ef4444") : "var(--text-muted)",
            icon: perf && perf.unrealizedPnL >= 0 ? ArrowUpRight : ArrowDownRight,
          },
          {
            label: "TVPI",
            value: perf?.tvpi,
            fmt: (v: number) => `${v.toFixed(2)}×`,
            sub: "total value multiple",
            color: perf && perf.tvpi != null && perf.tvpi >= 1.5 ? "#10b981" : perf && perf.tvpi != null && perf.tvpi < 1 ? "#ef4444" : "#f59e0b",
            icon: TrendingUp,
          },
        ].map(({ label, value, fmt, sub, color, icon: Icon }) => (
          <div key={label} className="p-5 rounded-md border"
            style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs tracking-wide" style={{ color: "var(--text-muted)" }}>{label}</span>
              <Icon size={14} style={{ color }} />
            </div>
            {value == null ? (
              <div className="h-8 w-20 rounded animate-pulse mb-1" style={{ background: "var(--bg-elevated)" }} />
            ) : (
              <div className="text-2xl font-semibold mb-1" style={{ color, fontVariantNumeric: "tabular-nums" }}>
                {fmt(value as never)}
              </div>
            )}
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Middle row: Activity feed + Approvals */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 360px" }}>

        {/* Agent Activity Feed */}
        <div className="rounded-md border overflow-hidden" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center gap-2">
              <Bot size={14} style={{ color: "var(--accent)" }} />
              <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Agent Activity</span>
              {runs.length > 0 && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                  style={{ background: "rgba(59,130,246,0.12)", color: "var(--accent)", border: "1px solid rgba(59,130,246,0.2)" }}
                >
                  {runs.length}
                </span>
              )}
            </div>
            <Link href="/agents" className="text-xs" style={{ color: "var(--accent)" }}>Manage agents →</Link>
          </div>

          <div className="p-4 flex flex-col gap-2 overflow-y-auto" style={{ maxHeight: 380 }}>
            {isInitialLoad && (
              <>
                {[80, 65, 72].map((w) => (
                  <div key={w} className="rounded-md border p-3 flex items-center gap-3 animate-pulse"
                    style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}>
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: "var(--border)" }} />
                    <div className="flex-1 flex flex-col gap-1.5">
                      <div className="h-3 rounded" style={{ width: `${w}%`, background: "var(--border)" }} />
                      <div className="h-2.5 rounded w-20" style={{ background: "var(--border)" }} />
                    </div>
                  </div>
                ))}
              </>
            )}
            {!isInitialLoad && runs.length === 0 && (
              <div className="py-10 text-center text-xs" style={{ color: "var(--text-muted)" }}>
                <Bot size={24} className="mx-auto mb-3 opacity-30" />
                No agent activity yet.{" "}
                <Link href="/agents" style={{ color: "var(--accent)" }}>Configure agents →</Link>
              </div>
            )}
            {runs.map((run) => <RunEntry key={run.id} run={run} />)}
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="rounded-md border overflow-hidden" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} style={{ color: "#f59e0b" }} />
              <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Needs Approval</span>
            </div>
            <Link href="/approvals" className="text-xs" style={{ color: "var(--accent)" }}>View all →</Link>
          </div>

          <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
            {pendingApprovals.length === 0 && !loading && (
              <div className="px-5 py-10 text-center text-xs" style={{ color: "var(--text-muted)" }}>
                <CheckCircle2 size={22} className="mx-auto mb-3 opacity-20" />
                All clear — nothing pending.
              </div>
            )}

            {pendingApprovals.map((a) => (
              <div key={a.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>{a.title}</div>
                    {a.description && (
                      <div className="text-xs mt-0.5 line-clamp-2" style={{ color: "var(--text-muted)" }}>{a.description}</div>
                    )}
                  </div>
                  <div
                    className="w-1.5 h-1.5 rounded-full shrink-0 mt-1"
                    style={{ background: PRIORITY_COLOR[a.priority] ?? "var(--text-muted)" }}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApproval(a.id, "approved")}
                    disabled={approvingId === a.id}
                    className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium"
                    style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.25)" }}
                  >
                    <CheckCircle2 size={10} /> Approve
                  </button>
                  <button
                    onClick={() => handleApproval(a.id, "rejected")}
                    disabled={approvingId === a.id}
                    className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium"
                    style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}
                  >
                    <XCircle size={10} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Portfolio Alerts */}
      {(alerts.length > 0 || isInitialLoad) && (
        <div className="rounded-md border overflow-hidden" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} style={{ color: "#f59e0b" }} />
              <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Portfolio Alerts</span>
              {alerts.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                  style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
                  {alerts.filter((a) => a.severity === "critical").length} critical
                </span>
              )}
            </div>
            <Link href="/portfolio" className="text-xs" style={{ color: "var(--accent)" }}>View portfolio →</Link>
          </div>
          <div className="grid grid-cols-2 divide-x" style={{ borderColor: "var(--border)" }}>
            {isInitialLoad
              ? [1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-start gap-3 px-5 py-4 animate-pulse border-b" style={{ borderColor: "var(--border)" }}>
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: "var(--border)" }} />
                    <div className="flex-1 flex flex-col gap-1.5">
                      <div className="h-3 rounded w-3/4" style={{ background: "var(--border)" }} />
                      <div className="h-2.5 rounded w-1/2" style={{ background: "var(--border)" }} />
                    </div>
                  </div>
                ))
              : alerts.map((a) => {
                  const color = ALERT_SEVERITY_COLOR[a.severity] ?? "var(--text-muted)";
                  return (
                    <div key={a.id} className="flex items-start gap-3 px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
                      <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: color }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{a.companyName}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: `${color}18`, color }}>
                            {ALERT_TYPE_LABEL[a.type] ?? a.type}
                          </span>
                        </div>
                        <div className="text-xs" style={{ color: "var(--text-muted)" }}>{a.title}</div>
                      </div>
                      {a.severity === "critical" ? (
                        <AlertTriangle size={12} style={{ color, flexShrink: 0, marginTop: 2 }} />
                      ) : (
                        <Info size={12} style={{ color, flexShrink: 0, marginTop: 2 }} />
                      )}
                    </div>
                  );
                })}
          </div>
        </div>
      )}

      {/* Deals sorted by affinity score */}
      <div className="rounded-md border overflow-hidden" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2">
            <Zap size={14} style={{ color: "var(--accent)" }} />
            <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Deal Pipeline</span>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>sorted by AI score</span>
          </div>
          <Link href="/opportunities" className="text-xs" style={{ color: "var(--accent)" }}>View all →</Link>
        </div>

        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Company", "Stage", "Score", "Status", ""].map((h) => (
                <th key={h} className="text-left px-5 py-2.5 font-medium" style={{ color: "var(--text-muted)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isInitialLoad && [1,2,3].map((i) => (
              <tr key={i} className="animate-pulse" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                {[60,40,30,50,20].map((w, j) => (
                  <td key={j} className="px-5 py-3.5">
                    <div className="h-3 rounded" style={{ width: `${w}%`, background: "var(--bg-elevated)" }} />
                  </td>
                ))}
              </tr>
            ))}
            {deals.map((d) => {
              const pct = d.dealScore != null ? d.dealScore : 0;
              const barColor = pct >= 70 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#6b7280";
              return (
                <tr key={d.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <td className="px-5 py-3">
                    <Link href={`/opportunities/${d.id}`} className="block hover:opacity-80">
                      <div style={{ color: "var(--text-primary)" }}>{d.company}</div>
                      <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{d.sector ?? "—"}</div>
                    </Link>
                  </td>
                  <td className="px-5 py-3" style={{ color: "var(--text-secondary)" }}>
                    {d.stage?.replace(/-/g, " ") ?? "—"}
                  </td>
                  <td className="px-5 py-3">
                    {d.dealScore != null ? (
                      <div className="flex items-center gap-2">
                        <ScoreRing score={d.dealScore} size={30} />
                        <div className="flex-1" style={{ maxWidth: 60 }}>
                          <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--bg-elevated)" }}>
                            <div style={{ width: `${pct}%`, height: "100%", background: barColor, borderRadius: "9999px", transition: "width 0.3s ease" }} />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs italic" style={{ color: "var(--text-muted)" }}>Scoring…</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <Badge
                      label={d.status.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      variant={STATUS_BADGE[d.status] ?? "muted"}
                      size="xs"
                    />
                  </td>
                  <td className="px-5 py-3">
                    <Link
                      href={`/opportunities/${d.id}`}
                      className="flex items-center gap-1 text-xs"
                      style={{ color: "var(--accent)" }}
                    >
                      Open <ExternalLink size={10} />
                    </Link>
                  </td>
                </tr>
              );
            })}
            {!isInitialLoad && !hasDeals && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center" style={{ color: "var(--text-muted)" }}>
                  <Zap size={22} className="mx-auto mb-3 opacity-25" />
                  <div className="text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>No deals in the pipeline</div>
                  <div className="text-xs mb-4">Add your first deal and agents will automatically score it for you.</div>
                  <div className="flex items-center justify-center gap-3">
                    <Link href="/opportunities" className="px-4 py-1.5 rounded text-xs font-semibold" style={{ background: "var(--accent)", color: "#fff" }}>
                      + Add Deal
                    </Link>
                    <Link href="/import/deals" className="px-4 py-1.5 rounded text-xs" style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
                      Import CSV
                    </Link>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
