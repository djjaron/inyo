"use client";

import { useState, useEffect, useCallback } from "react";
import {
  TrendingUp, BarChart3, DollarSign, Clock,
  CheckCircle2, XCircle, ChevronDown, ChevronUp,
  Zap, Bot, RefreshCw, ExternalLink,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import ScoreRing from "@/components/ui/ScoreRing";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { useFamilyId } from "@/context/FamilyContext";
import type { AgentRunItem } from "@/app/api/agents/runs/route";

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

interface DashboardData {
  stats: DashboardStats;
  recentDeals: RecentDeal[];
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
  "deal-enrichment": "Enrichment",
  "portfolio-monitor": "Portfolio",
  "cfo": "CFO",
  "ic-memo": "IC Memo",
  "legal": "Legal",
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

  const stats = data?.stats;
  const runs = data?.recentRuns ?? [];
  const deals = (data?.recentDeals ?? []).sort((a, b) => (b.dealScore ?? -1) - (a.dealScore ?? -1));
  const isMock = data?._mock ?? false;

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
          {isMock && (
            <span className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}>
              demo data
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

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { icon: TrendingUp, label: "Active Deals", value: stats ? String(stats.activeDeals) : "—", sub: stats ? `${stats.totalDeals} total` : "—", color: "var(--accent)", href: "/opportunities" },
          { icon: BarChart3, label: "Portfolio", value: stats ? String(stats.portfolioCompanies) : "—", sub: "companies", color: "#10b981", href: "/portfolio" },
          { icon: Clock, label: "Pending Approvals", value: String(pendingApprovals.length), sub: `${pendingApprovals.filter((a) => a.priority === "urgent").length} urgent`, color: "#f59e0b", href: "/approvals" },
          { icon: DollarSign, label: "Pipeline Value", value: stats ? formatCurrency(stats.pipelineValue) : "—", sub: "active deal flow", color: "#10b981", href: "/opportunities" },
        ].map(({ icon: Icon, label, value, sub, color, href }) => (
          <Link key={label} href={href} className="p-5 rounded-md border block transition-opacity hover:opacity-80"
            style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs tracking-wide" style={{ color: "var(--text-muted)" }}>{label}</span>
              <Icon size={14} style={{ color }} />
            </div>
            <div className="text-2xl font-semibold mb-1" style={{ color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>{value}</div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>{sub}</div>
          </Link>
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
            {runs.length === 0 && !loading && (
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
            {deals.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-xs" style={{ color: "var(--text-muted)" }}>
                  No deals yet.{" "}
                  <Link href="/import/deals" style={{ color: "var(--accent)" }}>Import deals →</Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
