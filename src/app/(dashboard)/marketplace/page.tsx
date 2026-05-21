"use client";

import { useEffect, useState } from "react";
import {
  Store,
  Download,
  Star,
  Zap,
  TrendingUp,
  FileText,
  BarChart3,
  DollarSign,
  Scale,
  Receipt,
  Briefcase,
  Users,
  Heart,
  Building2,
  X,
  LucideIcon,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";

// ── Core Agents ──────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, LucideIcon> = {
  TrendingUp,
  FileText,
  BarChart3,
  DollarSign,
  Scale,
  Receipt,
  Briefcase,
  Users,
  Heart,
  Building2,
};

const CORE_AGENTS = [
  { id: "deal-flow", name: "Deal Flow Analyst", description: "Scores and triages inbound opportunities", icon: "TrendingUp" },
  { id: "ic-memo", name: "IC Memo Writer", description: "Generates institutional investment committee memos", icon: "FileText" },
  { id: "portfolio-monitor", name: "Portfolio Monitor", description: "Watches investments for material changes", icon: "BarChart3" },
  { id: "cfo", name: "CFO Agent", description: "Cash flow, liquidity, and entity analysis", icon: "DollarSign" },
  { id: "legal", name: "Legal Review", description: "Document review and clause flagging", icon: "Scale" },
  { id: "tax", name: "Tax Intelligence", description: "K-1 analysis and tax position optimization", icon: "Receipt" },
  { id: "chief-of-staff", name: "Chief of Staff", description: "Task coordination and lifestyle management", icon: "Briefcase" },
  { id: "relationships", name: "Relationship Intelligence", description: "Network graph and warm path finder", icon: "Users" },
  { id: "philanthropy", name: "Philanthropy Advisor", description: "Impact analysis and giving optimization", icon: "Heart" },
  { id: "cfo", name: "Finance Advisor", description: "Entity-level financial intelligence", icon: "Building2" },
] as const;

// ── Premium Packs ─────────────────────────────────────────────────────────────

const AGENT_PACKS = [
  {
    id: "1",
    name: "Private Market Research",
    description: "Track deal flow across AI, biotech, energy, real estate, and credit. Daily sector digests.",
    category: "Research",
    price: "+$3K/mo",
    rating: 4.9,
    installs: 42,
    status: "available",
  },
  {
    id: "2",
    name: "Real Estate Asset Manager",
    description: "NOI tracking, lease management, maintenance coordination, and vendor relationships across properties.",
    category: "Operations",
    price: "+$2.5K/mo",
    rating: 4.7,
    installs: 28,
    status: "available",
  },
  {
    id: "3",
    name: "Risk Radar",
    description: "Macro event monitoring, litigation tracking, geopolitical risk alerts, and regulatory change summaries.",
    category: "Intelligence",
    price: "+$2K/mo",
    rating: 4.8,
    installs: 35,
    status: "available",
  },
  {
    id: "4",
    name: "Yacht & Aviation Ops",
    description: "Maintenance scheduling, crew management, compliance tracking, and logistics coordination.",
    category: "Lifestyle",
    price: "+$4K/mo",
    rating: 4.6,
    installs: 12,
    status: "available",
  },
  {
    id: "5",
    name: "Bloomberg Data Bridge",
    description: "Live market data, pricing feeds, and analytics directly in your family office context.",
    category: "Data",
    price: "+$5K/mo",
    rating: 4.5,
    installs: 19,
    status: "coming-soon",
  },
  {
    id: "6",
    name: "CPA Integration Suite",
    description: "Direct sync with your accounting firm — automated K-1 collection, AP approvals, and filing confirmations.",
    category: "Finance",
    price: "Custom",
    rating: 0,
    installs: 0,
    status: "coming-soon",
  },
];

const categoryVariant: Record<string, "accent" | "success" | "warning" | "muted" | "default"> = {
  Research: "accent",
  Operations: "success",
  Intelligence: "warning",
  Lifestyle: "default",
  Data: "muted",
  Finance: "success",
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface AgentStatus {
  type: string;
  lastRun: string | null;
  totalRuns: number;
}

interface StatusResponse {
  apiKeySet: boolean;
  agents: AgentStatus[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatLastRun(lastRun: string | null): string {
  if (!lastRun) return "Never";
  const d = new Date(lastRun);
  const now = Date.now();
  const diff = now - d.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return d.toLocaleDateString();
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MarketplacePage() {
  const [statusData, setStatusData] = useState<StatusResponse | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    fetch("/api/agents/status")
      .then((r) => r.json())
      .then((d: StatusResponse) => setStatusData(d))
      .catch(() => {/* ignore */});
  }, []);

  const agentStatusMap = new Map<string, AgentStatus>(
    statusData?.agents.map((a) => [a.type, a]) ?? []
  );

  const showDemoBanner =
    !bannerDismissed && statusData !== null && !statusData.apiKeySet;

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Agent Marketplace"
        subtitle="Core agents and premium packs for advanced family office operations"
      />

      {/* Installed badge */}
      <div
        className="flex items-center gap-3 px-8 py-3 border-b text-xs"
        style={{ borderColor: "var(--border)", background: "var(--bg-surface)", color: "var(--text-muted)" }}
      >
        <Zap size={12} style={{ color: "var(--accent)" }} />
        <span>10 core agents active</span>
        <span className="mx-1">·</span>
        <span>0 premium packs installed</span>
      </div>

      <div className="flex-1 overflow-auto p-8">

        {/* API key demo banner */}
        {showDemoBanner && (
          <div
            className="flex items-center justify-between gap-3 px-4 py-3 rounded-md mb-6 text-sm"
            style={{
              background: "rgba(245,158,11,0.08)",
              border: "1px solid rgba(245,158,11,0.25)",
              color: "#f59e0b",
            }}
          >
            <span>
              AI agents are running in demo mode. Add your Anthropic API key in Netlify environment variables to enable real AI responses.
            </span>
            <button
              onClick={() => setBannerDismissed(true)}
              className="flex-shrink-0 p-1 rounded"
              style={{ color: "#f59e0b" }}
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Core Agents */}
        <div className="mb-10">
          <h2 className="text-xs font-medium tracking-wider uppercase mb-4" style={{ color: "var(--text-muted)" }}>
            Core Agents
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {CORE_AGENTS.map((agent, idx) => {
              const Icon = ICON_MAP[agent.icon] ?? Store;
              const agentStatus = agentStatusMap.get(agent.id);
              const lastRun = agentStatus ? formatLastRun(agentStatus.lastRun) : "Never";
              const apiKeySet = statusData?.apiKeySet ?? true;

              return (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-4 rounded-md border"
                  style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
                >
                  {/* Icon */}
                  <div
                    className="flex-shrink-0 w-8 h-8 rounded flex items-center justify-center mt-0.5"
                    style={{ background: "var(--bg-elevated)" }}
                  >
                    <Icon size={15} style={{ color: "var(--accent)" }} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                        {agent.name}
                      </span>
                      {/* Active badge */}
                      <span
                        className="flex-shrink-0 text-xs px-1.5 py-0.5 rounded font-medium"
                        style={{
                          background: "rgba(16,185,129,0.12)",
                          color: "#10b981",
                          border: "1px solid rgba(16,185,129,0.25)",
                        }}
                      >
                        Active
                      </span>
                    </div>

                    <p className="text-xs mb-1.5 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      {agent.description}
                    </p>

                    <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
                      <span>Last run: {lastRun}</span>
                      {!apiKeySet && (
                        <span style={{ color: "#f59e0b" }}>Demo mode</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Premium Packs */}
        <div>
          <h2 className="text-xs font-medium tracking-wider uppercase mb-4" style={{ color: "var(--text-muted)" }}>
            Premium Packs
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {AGENT_PACKS.map((pack) => (
              <div
                key={pack.id}
                className="flex flex-col p-5 rounded-md border"
                style={{
                  background: "var(--bg-surface)",
                  borderColor: pack.status === "coming-soon" ? "var(--border-subtle)" : "var(--border)",
                  opacity: pack.status === "coming-soon" ? 0.65 : 1,
                }}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{pack.name}</div>
                    <div className="mt-1">
                      <Badge label={pack.category} variant={categoryVariant[pack.category]} size="xs" />
                    </div>
                  </div>
                  {pack.status === "coming-soon" && (
                    <Badge label="Coming Soon" variant="muted" size="xs" />
                  )}
                </div>

                <p className="text-xs flex-1 mb-4" style={{ color: "var(--text-secondary)", lineHeight: 1.65 }}>
                  {pack.description}
                </p>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{pack.price}</div>
                    {pack.rating > 0 && (
                      <div className="flex items-center gap-1 text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                        <Star size={10} fill="currentColor" />
                        {pack.rating} · {pack.installs} installs
                      </div>
                    )}
                  </div>
                  {pack.status === "available" ? (
                    <button
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium"
                      style={{ background: "var(--accent)", color: "#fff" }}
                    >
                      <Download size={11} />
                      Install
                    </button>
                  ) : (
                    <button
                      className="px-3 py-1.5 rounded text-xs"
                      style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}
                      disabled
                    >
                      Notify Me
                    </button>
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
