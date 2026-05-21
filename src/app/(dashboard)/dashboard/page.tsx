"use client";

import { useState, useEffect, useMemo } from "react";
import { TrendingUp, BarChart3, Clock, DollarSign, AlertTriangle, Zap, CheckCircle2, Bot } from "lucide-react";
import Badge from "@/components/ui/Badge";
import ScoreRing from "@/components/ui/ScoreRing";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { useFamilyId } from "@/context/FamilyContext";

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

interface AlertItem {
  id: string;
  companyName: string;
  type: string;
  severity: string;
  title: string;
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
  alerts: AlertItem[];
  _mock: boolean;
}

interface PendingApproval {
  id: string;
  title: string;
  type: string;
  priority: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

const severityDot: Record<string, string> = {
  critical: "#ef4444",
  warning: "#f59e0b",
  info: "var(--accent)",
};

const statusLabel: Record<string, string> = {
  inbound: "Inbound", reviewing: "Reviewing", diligence: "Diligence",
  "ic-review": "IC Review", invested: "Invested", passed: "Passed",
};

const statusVariant: Record<string, "accent" | "warning" | "success" | "muted"> = {
  inbound: "accent", reviewing: "accent", diligence: "warning",
  "ic-review": "warning", invested: "success", passed: "muted",
};

// ---------------------------------------------------------------------------
// Focus item computation — derives top 3 priority actions from loaded data
// ---------------------------------------------------------------------------

interface FocusItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  href: string;
  urgency: "urgent" | "high" | "normal";
}

function buildFocusItems(
  alerts: AlertItem[],
  pendingApprovals: PendingApproval[],
  recentDeals: RecentDeal[],
): FocusItem[] {
  const items: FocusItem[] = [];

  // Critical portfolio alerts first — material change, needs attention now
  const critAlert = alerts.find((a) => a.severity === "critical");
  if (critAlert) {
    items.push({
      key: `alert-${critAlert.id}`,
      icon: <AlertTriangle size={13} />,
      label: critAlert.companyName,
      description: critAlert.title,
      href: "/portfolio",
      urgency: "urgent",
    });
  }

  // Pending urgent or high-priority approvals
  const topApproval = pendingApprovals.find((a) => a.priority === "urgent" || a.priority === "high")
    ?? pendingApprovals[0];
  if (topApproval) {
    items.push({
      key: `approval-${topApproval.id}`,
      icon: <CheckCircle2 size={13} />,
      label: topApproval.title,
      description: "Awaiting your approval",
      href: "/approvals",
      urgency: topApproval.priority === "urgent" ? "urgent" : "high",
    });
  }

  // Inbound deals with no score — haven't been analyzed yet
  const unscored = recentDeals.filter((d) => d.status === "inbound" && !d.dealScore);
  if (unscored.length > 0) {
    const first = unscored[0];
    items.push({
      key: `deal-${first.id}`,
      icon: <Zap size={13} />,
      label: unscored.length === 1 ? first.company : `${unscored.length} inbound deals`,
      description: "Unscored — run analysis",
      href: unscored.length === 1 ? `/opportunities/${first.id}` : "/opportunities?filter=inbound",
      urgency: "normal",
    });
  }

  return items.slice(0, 3);
}

const urgencyStyle: Record<string, { bg: string; color: string; border: string }> = {
  urgent: { bg: "rgba(239,68,68,0.08)", color: "#ef4444", border: "rgba(239,68,68,0.2)" },
  high:   { bg: "rgba(245,158,11,0.08)", color: "#f59e0b", border: "rgba(245,158,11,0.2)" },
  normal: { bg: "var(--bg-elevated)", color: "var(--accent)", border: "var(--border)" },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const familyId = useFamilyId();

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });
  const greeting = getGreeting();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);

  useEffect(() => {
    if (!familyId) return;

    async function load() {
      setLoading(true);
      try {
        const [dashRes, approvalsRes] = await Promise.all([
          fetch(`/api/dashboard?familyId=${encodeURIComponent(familyId!)}`),
          fetch(`/api/approvals?familyId=${encodeURIComponent(familyId!)}&status=pending`),
        ]);
        const json: DashboardData = await dashRes.json();
        setData(json);
        const approvalsJson = await approvalsRes.json();
        setPendingApprovals((approvalsJson.approvals ?? []).slice(0, 3));
      } catch {
        // leave data null
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [familyId]);

  const stats = data?.stats;
  const recentDeals = data?.recentDeals ?? [];
  const alerts = data?.alerts ?? [];
  const isMock = data?._mock ?? false;

  const focusItems = useMemo(
    () => buildFocusItems(alerts, pendingApprovals, recentDeals),
    [alerts, pendingApprovals, recentDeals],
  );

  return (
    <div
      className={`flex flex-col min-h-full p-8 gap-6${loading && !data ? " opacity-50 animate-pulse" : ""}`}
      style={{ background: "var(--bg-base)" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs tracking-widest uppercase mb-1" style={{ color: "var(--text-muted)" }}>{today}</p>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
            {greeting}.
          </h1>
        </div>
        {isMock && (
          <span
            className="text-xs px-2 py-0.5 rounded self-center"
            style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}
          >
            demo data
          </span>
        )}
      </div>

      {/* Today's Focus — only shown when there are actionable items */}
      {focusItems.length > 0 && (
        <div>
          <p className="text-xs tracking-widest uppercase mb-3" style={{ color: "var(--text-muted)" }}>
            Today&rsquo;s Focus
          </p>
          <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${focusItems.length}, 1fr)` }}>
            {focusItems.map((item) => {
              const s = urgencyStyle[item.urgency];
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className="flex items-start gap-3 p-4 rounded-md border transition-opacity hover:opacity-80"
                  style={{ background: s.bg, borderColor: s.border }}
                >
                  <div className="mt-0.5" style={{ color: s.color }}>{item.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                      {item.label}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                      {item.description}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Stat widgets */}
      <div className="grid grid-cols-4 gap-4">
        {[
          {
            icon: TrendingUp,
            label: "Active Deals",
            value: stats ? String(stats.activeDeals) : "—",
            trend: stats ? `${stats.totalDeals} total in pipeline` : "Loading…",
            color: "var(--accent)",
            href: "/opportunities",
          },
          {
            icon: BarChart3,
            label: "Portfolio Companies",
            value: stats ? String(stats.portfolioCompanies) : "—",
            trend: "Across all entities",
            color: "var(--success)",
            href: "/portfolio",
          },
          {
            icon: Clock,
            label: "Pending Approvals",
            value: String(pendingApprovals.length),
            trend: `${pendingApprovals.filter((a) => a.priority === "urgent").length} urgent`,
            color: "#f59e0b",
            href: "/approvals",
          },
          {
            icon: DollarSign,
            label: "Pipeline Value",
            value: stats ? formatCurrency(stats.pipelineValue) : "—",
            trend: "Active deal flow",
            color: "#10b981",
            href: "/opportunities",
          },
        ].map(({ icon: Icon, label, value, trend, color, href }) => (
          <Link
            key={label}
            href={href}
            className="p-5 rounded-md border block transition-opacity hover:opacity-80"
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
          </Link>
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
              {recentDeals.map((d) => (
                <tr key={d.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <td className="px-5 py-3">
                    <Link href={`/opportunities/${d.id}`} className="block hover:opacity-80">
                      <div style={{ color: "var(--text-primary)" }}>{d.company}</div>
                      {d.stage && (
                        <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                          {d.stage.replace(/-/g, " ")}
                        </div>
                      )}
                    </Link>
                  </td>
                  <td className="px-5 py-3" style={{ color: "var(--text-secondary)" }}>{d.sector ?? "—"}</td>
                  <td className="px-5 py-3">
                    {d.dealScore != null
                      ? <ScoreRing score={d.dealScore} size={32} />
                      : (
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {d.status === "inbound" ? "Run →" : "—"}
                        </span>
                      )}
                  </td>
                  <td className="px-5 py-3">
                    <Badge
                      label={statusLabel[d.status] ?? d.status}
                      variant={statusVariant[d.status] ?? "muted"}
                      size="xs"
                    />
                  </td>
                </tr>
              ))}
              {recentDeals.length === 0 && !loading && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-xs" style={{ color: "var(--text-muted)" }}>
                    No deals yet.{" "}
                    <Link href="/import/deals" style={{ color: "var(--accent)" }}>Import deals →</Link>
                  </td>
                </tr>
              )}
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
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-start gap-3 px-5 py-3.5">
                <div
                  className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                  style={{ background: severityDot[alert.severity] ?? "var(--accent)" }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>{alert.title}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {alert.companyName} · {alert.type.replace(/-/g, " ")}
                  </div>
                </div>
                <span className="text-xs shrink-0" style={{ color: "var(--text-muted)" }}>{timeAgo(alert.createdAt)}</span>
              </div>
            ))}
            {alerts.length === 0 && !loading && (
              <div className="px-5 py-8 text-center text-xs" style={{ color: "var(--text-muted)" }}>
                Portfolio is quiet — no material changes this week.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
