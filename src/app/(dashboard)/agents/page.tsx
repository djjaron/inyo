"use client";

import { useState, useEffect, useCallback } from "react";
import {
  TrendingUp, FileText, BarChart3, DollarSign, Scale, Receipt,
  Briefcase, Users, Heart, Search, Bot, Play, Loader2, ChevronDown, ChevronUp,
  Clock, CheckCircle, Globe, Radio, RefreshCw, UserPlus, type LucideIcon,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import PageHeader from "@/components/ui/PageHeader";
import { useFamilyId } from "@/context/FamilyContext";
import type { AgentRunItem } from "@/app/api/agents/runs/route";

// ---------------------------------------------------------------------------
// Agent catalog
// ---------------------------------------------------------------------------

interface AgentDef {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  category: string;
  triggerMode: "auto" | "manual" | "scheduled";
  href: string;
  demoContext: Record<string, unknown>;
  demoBody?: Record<string, unknown>; // when route expects non-context body shape
}

const AGENTS: AgentDef[] = [
  { id: "deal-flow",        name: "Deal Flow Analyst",       description: "Scores and triages inbound deals against your thesis",            icon: TrendingUp, category: "Deal Flow",   triggerMode: "auto",      href: "/opportunities",  demoContext: { company: "Demo Co", sector: "tech", stage: "seed", capitalAsk: 2000000, description: "AI-powered platform." } },
  { id: "ic-memo",          name: "IC Memo Writer",          description: "Generates institutional investment committee memos",              icon: FileText,   category: "Deal Flow",   triggerMode: "manual",    href: "/opportunities",  demoContext: { company: "Demo Co", stage: "series-a", capitalAsk: 8000000, valuation: 40000000, description: "AI SaaS platform.", sector: "tech", team: "Jane Smith CEO" } },
  { id: "term-sheet",       name: "Term Sheet Analyzer",     description: "Extracts and compares investment terms",                          icon: Scale,      category: "Deal Flow",   triggerMode: "manual",    href: "/opportunities",  demoContext: {}, demoBody: { familyId: "__fid__", context: {}, documents: [{ name: "Term Sheet", content: "Pre-money: $40M. Check: $5M. 1x non-participating. Board: 1 seat." }] } },
  { id: "diligence",        name: "Diligence Agent",         description: "Synthesizes diligence documents and surfaces key risks",          icon: Search,     category: "Deal Flow",   triggerMode: "manual",    href: "/opportunities",  demoContext: { company: "Demo Co", stage: "series-a", checklistItems: [{ id: "1", question: "ARR growing?", answer: "Yes, 2x YoY" }] } },
  { id: "deal-enrichment",  name: "Deal Enrichment",         description: "Enriches deals with web, LinkedIn, and market signals",           icon: BarChart3,  category: "Deal Flow",   triggerMode: "auto",      href: "/opportunities",  demoContext: { company: "Demo Co", sector: "tech", stage: "seed", description: "AI-powered platform" } },
  { id: "portfolio-monitor",name: "Portfolio Monitor",       description: "Daily sweep of portfolio companies for material changes",         icon: BarChart3,  category: "Portfolio",   triggerMode: "scheduled", href: "/portfolio",      demoContext: { name: "Portfolio Co", sector: "tech", investedAmount: 5000000, currentValue: 4800000, alertLevel: "normal" } },
  { id: "cfo",              name: "CFO Agent",               description: "Daily cash position, liquidity, and expense summary",             icon: DollarSign, category: "Finance",     triggerMode: "scheduled", href: "/finance",        demoContext: {}, demoBody: { familyId: "__fid__", query: "Summarize current cash position and liquidity across all entities" } },
  { id: "legal",            name: "Legal Review",            description: "Document clause flagging and risk identification",                icon: Scale,      category: "Finance",     triggerMode: "manual",    href: "/legal",          demoContext: {}, demoBody: { familyId: "__fid__", documentName: "Sample Agreement", documentContent: "Standard NDA with 2-year term, mutual confidentiality, and standard carve-outs." } },
  { id: "tax",              name: "Tax Intelligence",        description: "K-1 analysis, deadlines, and tax position optimization",          icon: Receipt,    category: "Finance",     triggerMode: "manual",    href: "/tax",            demoContext: {}, demoBody: { familyId: "__fid__", query: "What are our key tax obligations and K-1 deadlines this quarter?" } },
  { id: "chief-of-staff",   name: "Chief of Staff",          description: "Task coordination, scheduling, and operations",                   icon: Briefcase,  category: "Operations",  triggerMode: "manual",    href: "/concierge",      demoContext: {}, demoBody: { familyId: "__fid__", request: "Prepare a summary of this week's key tasks and follow-ups", type: "task-summary" } },
  { id: "concierge",        name: "Concierge",               description: "Lifestyle, household, travel, and personal requests",             icon: Heart,      category: "Operations",  triggerMode: "manual",    href: "/concierge",      demoContext: { request: "Find a restaurant for 4 people this Saturday evening", type: "dining" } },
  { id: "relationships",    name: "Relationship Intelligence",description: "Network graph, warm paths, and interaction history",             icon: Users,      category: "Operations",  triggerMode: "manual",    href: "/relationships",  demoContext: {}, demoBody: { familyId: "__fid__", query: "Who in my network has connections to healthcare investors?", contacts: [] } },
  { id: "philanthropy",     name: "Philanthropy Advisor",    description: "Foundation giving, grant tracking, and impact analysis",          icon: Heart,      category: "Operations",  triggerMode: "manual",    href: "/philanthropy",   demoContext: {}, demoBody: { familyId: "__fid__", query: "Summarize our foundation giving and impact this year", context: {} } },
];

const CATEGORIES = ["All", "Deal Flow", "Portfolio", "Finance", "Operations"] as const;

const CATEGORY_VARIANT: Record<string, "accent" | "success" | "warning" | "muted"> = {
  "Deal Flow": "accent", "Portfolio": "success", "Finance": "warning", "Operations": "muted",
};

const TRIGGER_MODE_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  auto:      { label: "Auto",      color: "#10b981", bg: "rgba(16,185,129,0.1)" },
  scheduled: { label: "Scheduled", color: "var(--accent)", bg: "rgba(59,130,246,0.1)" },
  manual:    { label: "Manual",    color: "var(--text-muted)", bg: "var(--bg-elevated)" },
};

// ---------------------------------------------------------------------------
// Agent card
// ---------------------------------------------------------------------------

interface AgentStatus { type: string; lastRun: string | null; totalRuns: number; }

function AgentCard({
  agent, status, recentRuns, familyId,
}: {
  agent: AgentDef;
  status: AgentStatus | undefined;
  recentRuns: AgentRunItem[];
  familyId: string;
}) {
  const [running, setRunning] = useState(false);
  const [lastResult, setLastResult] = useState<AgentRunItem | null>(null);
  const [expanded, setExpanded] = useState(false);
  const Icon = agent.icon;
  const mode = TRIGGER_MODE_STYLE[agent.triggerMode];

  const runNow = useCallback(async () => {
    setRunning(true);
    try {
      const body = agent.demoBody
        ? JSON.parse(JSON.stringify(agent.demoBody).replace(/"__fid__"/g, JSON.stringify(familyId)))
        : { familyId, context: agent.demoContext };

      const res = await fetch(`/api/agents/${agent.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json() as Record<string, unknown>;
      const result = (data.result as Record<string, unknown>) ?? data;
      setLastResult({
        id: `live-${Date.now()}`,
        agentType: agent.id,
        status: res.ok ? "completed" : "failed",
        triggerType: "manual",
        label: res.ok ? `${agent.name} completed` : `${agent.name} failed`,
        severity: res.ok ? "success" : "error",
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        outputPreview: Object.fromEntries(Object.entries(result).slice(0, 4)),
      });
    } catch {
      setLastResult({
        id: `live-err-${Date.now()}`,
        agentType: agent.id,
        status: "failed",
        triggerType: "manual",
        label: `${agent.name} failed`,
        severity: "error",
        startedAt: null,
        completedAt: null,
        createdAt: new Date().toISOString(),
        outputPreview: null,
      });
    } finally {
      setRunning(false);
    }
  }, [agent, familyId]);

  const displayRuns = lastResult ? [lastResult, ...recentRuns.slice(0, 2)] : recentRuns.slice(0, 3);
  const lastRunStr = status?.lastRun
    ? new Date(status.lastRun).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : "Never";

  return (
    <div
      className="rounded-md border"
      style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
    >
      {/* Card header */}
      <div className="flex items-start gap-3 p-4">
        <div
          className="w-9 h-9 rounded-md flex items-center justify-center shrink-0"
          style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
        >
          <Icon size={16} style={{ color: "var(--accent)" }} strokeWidth={1.75} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{agent.name}</span>
            <Badge label={agent.category} variant={CATEGORY_VARIANT[agent.category] ?? "muted"} size="xs" />
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-medium"
              style={{ background: mode.bg, color: mode.color, border: `1px solid ${mode.color}30` }}
            >
              {mode.label}
            </span>
          </div>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>{agent.description}</p>
        </div>
      </div>

      {/* Stats row */}
      <div
        className="flex items-center gap-4 px-4 py-2 text-xs border-t"
        style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
      >
        <div className="flex items-center gap-1">
          <Clock size={10} />
          <span>Last run: {lastRunStr}</span>
        </div>
        {status?.totalRuns != null && (
          <div className="flex items-center gap-1">
            <CheckCircle size={10} />
            <span>{status.totalRuns} total runs</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 px-4 pb-3 pt-2">
        <button
          onClick={runNow}
          disabled={running}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          {running ? <Loader2 size={11} className="animate-spin" /> : <Play size={11} />}
          {running ? "Running…" : "Run Now"}
        </button>
        {displayRuns.length > 0 && (
          <button
            onClick={() => setExpanded((e) => !e)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs"
            style={{ background: "var(--bg-elevated)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
          >
            {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            {displayRuns.length} recent {displayRuns.length === 1 ? "run" : "runs"}
          </button>
        )}
      </div>

      {/* Recent runs panel */}
      {expanded && displayRuns.length > 0 && (
        <div
          className="px-4 pb-4 flex flex-col gap-2 border-t"
          style={{ borderColor: "var(--border)" }}
        >
          <p className="text-[10px] uppercase tracking-widest pt-3" style={{ color: "var(--text-muted)" }}>Recent runs</p>
          {displayRuns.map((run) => {
            const dot = run.severity === "success" ? "#10b981" : run.severity === "error" ? "#ef4444" : run.severity === "warning" ? "#f59e0b" : "var(--accent)";
            return (
              <div key={run.id} className="flex items-start gap-2 text-xs">
                <div className="w-1.5 h-1.5 rounded-full mt-1 shrink-0" style={{ background: dot }} />
                <div className="flex-1 min-w-0">
                  <div style={{ color: "var(--text-secondary)" }}>{run.label}</div>
                  {run.outputPreview && (
                    <div className="mt-1 p-2 rounded text-[10px] font-mono overflow-x-auto"
                      style={{ background: "var(--bg-base)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                      {Object.entries(run.outputPreview).slice(0, 3).map(([k, v]) => (
                        <div key={k}><span style={{ color: "var(--text-muted)" }}>{k}:</span> {typeof v === "object" ? JSON.stringify(v) : String(v)}</div>
                      ))}
                    </div>
                  )}
                </div>
                <span style={{ color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                  {run.completedAt
                    ? new Date(run.completedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
                    : "—"}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Network (Dividen federation) panel
// ---------------------------------------------------------------------------

interface NetworkStatus {
  instanceId?: string;
  registered?: boolean;
  agentCount?: number;
  lastHeartbeat?: string | null;
  instanceUrl?: string;
  _mock?: boolean;
  [key: string]: unknown;
}

type ActionKey = "register" | "sync" | "heartbeat";

function NetworkPanel() {
  const [status, setStatus] = useState<NetworkStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [inFlight, setInFlight] = useState<ActionKey | null>(null);
  const [actionMsg, setActionMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [lastResult, setLastResult] = useState<unknown>(null);

  const fetchStatus = useCallback(async () => {
    setStatusLoading(true);
    try {
      const res = await fetch("/api/network/status");
      const data = await res.json() as NetworkStatus;
      setStatus(data);
    } catch {
      setStatus(null);
    } finally {
      setStatusLoading(false);
    }
  }, []);

  useEffect(() => { void fetchStatus(); }, [fetchStatus]);

  const runAction = useCallback(async (key: ActionKey) => {
    const endpoints: Record<ActionKey, string> = {
      register: "/api/federation/register",
      sync:     "/api/network/sync-agents",
      heartbeat:"/api/network/heartbeat",
    };
    setInFlight(key);
    setActionMsg(null);
    setLastResult(null);
    try {
      const res = await fetch(endpoints[key], { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      const data = await res.json() as unknown;
      setLastResult(data);
      setActionMsg({ ok: res.ok, text: res.ok ? "Success" : "Request failed" });
    } catch (err) {
      setActionMsg({ ok: false, text: err instanceof Error ? err.message : "Network error" });
    } finally {
      setInFlight(null);
    }
  }, []);

  const heartbeatStr = status?.lastHeartbeat
    ? new Date(status.lastHeartbeat).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : "Never";

  return (
    <div className="flex flex-col gap-5 p-8 max-w-2xl">

      {/* Mock warning banner */}
      {status?._mock && (
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-md text-sm"
          style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", color: "#f59e0b" }}
        >
          <span className="font-medium">Set DIVIDEN_PLATFORM_TOKEN in environment variables to connect to the live Dividen network.</span>
        </div>
      )}

      {/* Status card */}
      <div className="rounded-md border p-5 flex flex-col gap-4" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2">
          <Radio size={14} style={{ color: "var(--accent)" }} strokeWidth={1.75} />
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Federation Status</span>
        </div>

        {statusLoading ? (
          <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
            <Loader2 size={12} className="animate-spin" /> Loading…
          </div>
        ) : status === null ? (
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Unable to reach /api/network/status</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span style={{ color: "var(--text-muted)" }}>Instance ID</span>
              <div className="mt-0.5 font-mono" style={{ color: "var(--text-secondary)" }}>{status.instanceId ?? "—"}</div>
            </div>
            <div>
              <span style={{ color: "var(--text-muted)" }}>Status</span>
              <div className="mt-0.5">
                {status.registered
                  ? <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" }}>Registered</span>
                  : <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" }}>Not registered</span>
                }
              </div>
            </div>
            <div>
              <span style={{ color: "var(--text-muted)" }}>Agent count</span>
              <div className="mt-0.5 font-mono" style={{ color: "var(--text-secondary)" }}>{status.agentCount ?? "—"}</div>
            </div>
            <div>
              <span style={{ color: "var(--text-muted)" }}>Last heartbeat</span>
              <div className="mt-0.5" style={{ color: "var(--text-secondary)" }}>{heartbeatStr}</div>
            </div>
            {status.instanceUrl && (
              <div className="col-span-2">
                <span style={{ color: "var(--text-muted)" }}>Instance URL</span>
                <div className="mt-0.5 font-mono break-all" style={{ color: "var(--text-secondary)" }}>{status.instanceUrl}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        {([
          { key: "register" as ActionKey,  label: "Register",    Icon: UserPlus  },
          { key: "sync"     as ActionKey,  label: "Sync Agents", Icon: RefreshCw },
          { key: "heartbeat"as ActionKey,  label: "Heartbeat",   Icon: Heart     },
        ] as const).map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => void runAction(key)}
            disabled={inFlight !== null}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold"
            style={
              inFlight === key
                ? { background: "var(--bg-elevated)", color: "var(--text-muted)", border: "1px solid var(--border)" }
                : { background: "var(--accent)", color: "#fff" }
            }
          >
            {inFlight === key
              ? <Loader2 size={11} className="animate-spin" />
              : <Icon size={11} strokeWidth={1.75} />
            }
            {inFlight === key ? "Running…" : label}
          </button>
        ))}
      </div>

      {/* Inline action message */}
      {actionMsg && (
        <p
          className="text-xs font-medium"
          style={{ color: actionMsg.ok ? "#10b981" : "#ef4444" }}
        >
          {actionMsg.ok ? "✓" : "✗"} {actionMsg.text}
        </p>
      )}

      {/* Raw JSON result */}
      {lastResult !== null && (
        <pre style={{
          background: "var(--bg-elevated)",
          color: "var(--text-secondary)",
          fontSize: 11,
          borderRadius: 6,
          padding: 12,
          overflow: "auto",
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
        }}>
          {JSON.stringify(lastResult, null, 2)}
        </pre>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AgentsPage() {
  const familyId = useFamilyId();
  const [statusData, setStatusData] = useState<AgentStatus[]>([]);
  const [runsData, setRunsData] = useState<AgentRunItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<(typeof CATEGORIES)[number] | "Network">("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!familyId) return;
    setLoading(true);
    Promise.all([
      fetch("/api/agents/status").then((r) => r.json()).catch(() => ({ agents: [] })),
      fetch(`/api/agents/runs?familyId=${encodeURIComponent(familyId)}&limit=50`).then((r) => r.json()).catch(() => ({ runs: [] })),
    ]).then(([s, r]) => {
      setStatusData((s.agents ?? []) as AgentStatus[]);
      setRunsData((r.runs ?? []) as AgentRunItem[]);
    }).finally(() => setLoading(false));
  }, [familyId]);

  const statusMap = new Map(statusData.map((s) => [s.type, s]));

  const filtered = activeCategory === "All"
    ? AGENTS
    : AGENTS.filter((a) => a.category === activeCategory);

  const todayRuns = runsData.filter((r) => {
    const ago = Date.now() - new Date(r.createdAt).getTime();
    return ago < 24 * 3600_000;
  });

  const autoRunCount = todayRuns.filter((r) => r.triggerType !== "manual").length;

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--bg-base)" }}>
      <PageHeader
        title="Agents"
        subtitle={
          loading
            ? "Loading agent status…"
            : `${autoRunCount} automated runs today · ${runsData.length} total in history`
        }
      />

      {/* Stats bar — hidden on Network view */}
      {activeCategory !== "Network" && (
        <div
          className="flex items-center gap-4 px-8 py-3 border-b text-xs"
          style={{ borderColor: "var(--border)", background: "var(--bg-surface)", color: "var(--text-muted)" }}
        >
          <div className="flex items-center gap-1.5">
            <Bot size={12} style={{ color: "var(--accent)" }} />
            <span>13 agents active</span>
          </div>
          <span>·</span>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#10b981" }} />
            <span>2 on schedule (daily sweep)</span>
          </div>
          <span>·</span>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--accent)" }} />
            <span>2 auto-trigger on deal ingestion</span>
          </div>
        </div>
      )}

      {/* Tab row: category filters + Network tab */}
      <div className="flex items-center gap-2 px-8 py-3 border-b" style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className="px-3 py-1 rounded text-xs font-medium transition-colors"
            style={
              activeCategory === cat
                ? { background: "var(--accent)", color: "#fff" }
                : { background: "var(--bg-elevated)", color: "var(--text-muted)", border: "1px solid var(--border)" }
            }
          >
            {cat}
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={() => setActiveCategory("Network")}
          className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors"
          style={
            activeCategory === "Network"
              ? { background: "var(--accent)", color: "#fff" }
              : { background: "var(--bg-elevated)", color: "var(--text-muted)", border: "1px solid var(--border)" }
          }
        >
          <Globe size={11} strokeWidth={1.75} />
          Network
        </button>
      </div>

      {/* Main content: Network panel or agent grid */}
      {activeCategory === "Network" ? (
        <div className="flex-1 overflow-auto">
          <NetworkPanel />
        </div>
      ) : (
        <div className="flex-1 overflow-auto p-8">
          <div className="grid grid-cols-2 gap-4">
            {filtered.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                status={statusMap.get(agent.id)}
                recentRuns={runsData.filter((r) => r.agentType === agent.id).slice(0, 3)}
                familyId={familyId ?? "demo"}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
