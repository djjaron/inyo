"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
  Search,
  X,
  ExternalLink,
  LucideIcon,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";

// ── All Agents ────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, LucideIcon> = {
  TrendingUp, FileText, BarChart3, DollarSign, Scale, Receipt,
  Briefcase, Users, Heart, Search,
};

interface AgentDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  href: string;
}

const ALL_AGENTS: AgentDef[] = [
  // ── Deal Flow ──────────────────────────────────────────────────────────────
  { id: "deal-flow",       name: "Deal Flow Analyst",       description: "Scores and triages inbound opportunities against your thesis",          icon: "TrendingUp",   category: "Deal Flow",   href: "/opportunities" },
  { id: "ic-memo",         name: "IC Memo Writer",          description: "Generates institutional investment committee memos",                    icon: "FileText",     category: "Deal Flow",   href: "/opportunities" },
  { id: "term-sheet",      name: "Term Sheet Analyzer",     description: "Flags material terms, pricing, and structural risks in term sheets",    icon: "Scale",        category: "Deal Flow",   href: "/opportunities" },
  { id: "diligence",       name: "Diligence Agent",         description: "Synthesizes diligence documents and surfaces key risks",                icon: "Search",       category: "Deal Flow",   href: "/opportunities" },
  { id: "deal-enrichment", name: "Deal Enrichment",         description: "Enriches deal records with market data and comparable transactions",    icon: "BarChart3",    category: "Deal Flow",   href: "/opportunities" },

  // ── Portfolio ──────────────────────────────────────────────────────────────
  { id: "portfolio-monitor", name: "Portfolio Monitor",     description: "Watches investments for material changes and triggers alerts",          icon: "BarChart3",    category: "Portfolio",   href: "/portfolio" },

  // ── Finance & Operations ───────────────────────────────────────────────────
  { id: "cfo",             name: "CFO Agent",               description: "Cash flow, entity liquidity, and expense reporting",                    icon: "DollarSign",   category: "Finance",     href: "/finance" },
  { id: "legal",           name: "Legal Review",            description: "Document review, clause flagging, and risk identification",             icon: "Scale",        category: "Finance",     href: "/legal" },
  { id: "tax",             name: "Tax Intelligence",        description: "K-1 analysis, tax position optimization, and entity structuring",       icon: "Receipt",      category: "Finance",     href: "/tax" },

  // ── Operations ─────────────────────────────────────────────────────────────
  { id: "chief-of-staff",  name: "Chief of Staff",         description: "Task coordination, scheduling, and family office operations",            icon: "Briefcase",    category: "Operations",  href: "/concierge" },
  { id: "concierge",       name: "Concierge",              description: "Lifestyle, household, travel, and personal service requests",            icon: "Heart",        category: "Operations",  href: "/concierge" },
  { id: "relationships",   name: "Relationship Intelligence", description: "Network graph, warm path finder, and interaction history",            icon: "Users",        category: "Operations",  href: "/relationships" },
  { id: "philanthropy",    name: "Philanthropy Advisor",   description: "Impact analysis, grant recommendations, and giving optimization",        icon: "Heart",        category: "Operations",  href: "/philanthropy" },

];

const CATEGORIES = ["All", "Deal Flow", "Portfolio", "Finance", "Operations"] as const;
type Category = (typeof CATEGORIES)[number];

// ── Premium Packs ─────────────────────────────────────────────────────────────

const AGENT_PACKS = [
  { id: "1", name: "Private Market Research",  description: "Track deal flow across AI, biotech, energy, real estate, and credit. Daily sector digests.",                   category: "Research",     price: "+$3K/mo",  rating: 4.9, installs: 42, status: "available" },
  { id: "2", name: "Real Estate Asset Manager",description: "NOI tracking, lease management, maintenance coordination, and vendor relationships across properties.",           category: "Operations",   price: "+$2.5K/mo",rating: 4.7, installs: 28, status: "available" },
  { id: "3", name: "Risk Radar",               description: "Macro event monitoring, litigation tracking, geopolitical risk alerts, and regulatory change summaries.",       category: "Intelligence", price: "+$2K/mo",  rating: 4.8, installs: 35, status: "available" },
  { id: "4", name: "Yacht & Aviation Ops",     description: "Maintenance scheduling, crew management, compliance tracking, and logistics coordination.",                     category: "Lifestyle",    price: "+$4K/mo",  rating: 4.6, installs: 12, status: "available" },
  { id: "5", name: "Bloomberg Data Bridge",    description: "Live market data, pricing feeds, and analytics directly in your family office context.",                        category: "Data",         price: "+$5K/mo",  rating: 4.5, installs: 19, status: "coming-soon" },
  { id: "6", name: "CPA Integration Suite",   description: "Direct sync with your accounting firm — automated K-1 collection, AP approvals, and filing confirmations.",     category: "Finance",      price: "Custom",   rating: 0,   installs: 0,  status: "coming-soon" },
];

const categoryBadgeVariant: Record<string, "accent" | "success" | "warning" | "muted" | "default"> = {
  Research: "accent", Operations: "success", Intelligence: "warning",
  Lifestyle: "default", Data: "muted", Finance: "success",
};

const agentCategoryVariant: Record<string, "accent" | "success" | "warning" | "muted"> = {
  "Deal Flow":  "accent",
  "Portfolio":  "success",
  "Finance":    "warning",
  "Operations": "muted",
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface AgentStatus { type: string; lastRun: string | null; totalRuns: number; }
interface StatusResponse { apiKeySet: boolean; agents: AgentStatus[]; }

function formatLastRun(lastRun: string | null): string {
  if (!lastRun) return "Never";
  const d = new Date(lastRun);
  const diff = Date.now() - d.getTime();
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
  const [activeCategory, setActiveCategory] = useState<Category>("All");

  useEffect(() => {
    fetch("/api/agents/status")
      .then((r) => r.json())
      .then((d: StatusResponse) => setStatusData(d))
      .catch(() => {});
  }, []);

  const agentStatusMap = new Map<string, AgentStatus>(
    statusData?.agents.map((a) => [a.type, a]) ?? []
  );

  const showDemoBanner = !bannerDismissed && statusData !== null && !statusData.apiKeySet;

  const filtered = activeCategory === "All"
    ? ALL_AGENTS
    : ALL_AGENTS.filter((a) => a.category === activeCategory);

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Agent Marketplace"
        subtitle="13 active agents across deal flow, portfolio, finance, and operations"
      />

      {/* Stats bar */}
      <div
        className="flex items-center gap-3 px-8 py-3 border-b text-xs"
        style={{ borderColor: "var(--border)", background: "var(--bg-surface)", color: "var(--text-muted)" }}
      >
        <Zap size={12} style={{ color: "var(--accent)" }} />
        <span>13 agents active</span>
        <span className="mx-1">·</span>
        <span>0 premium packs installed</span>
      </div>

      <div className="flex-1 overflow-auto p-8">

        {/* Demo banner */}
        {showDemoBanner && (
          <div
            className="flex items-center justify-between gap-3 px-4 py-3 rounded-md mb-6 text-sm"
            style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", color: "#f59e0b" }}
          >
            <span>
              AI agents are running in demo mode. Add your Anthropic API key in Netlify environment variables to enable real AI responses.
            </span>
            <button onClick={() => setBannerDismissed(true)} className="flex-shrink-0 p-1 rounded" style={{ color: "#f59e0b" }} aria-label="Dismiss">
              <X size={14} />
            </button>
          </div>
        )}

        {/* All Agents */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-medium tracking-wider uppercase" style={{ color: "var(--text-muted)" }}>
              Agents
            </h2>
            {/* Category filter */}
            <div className="flex items-center gap-1">
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
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {filtered.map((agent) => {
              const Icon = ICON_MAP[agent.icon] ?? Store;
              const agentStatus = agentStatusMap.get(agent.id);
              const lastRun = agentStatus ? formatLastRun(agentStatus.lastRun) : "Never";
              const apiKeySet = statusData?.apiKeySet ?? true;

              return (
                <div
                  key={agent.id}
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
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Badge label={agent.category} variant={agentCategoryVariant[agent.category] ?? "muted"} size="xs" />
                        <span
                          className="text-xs px-1.5 py-0.5 rounded font-medium"
                          style={{ background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.25)" }}
                        >
                          Active
                        </span>
                      </div>
                    </div>

                    <p className="text-xs mb-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      {agent.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        Last run: {lastRun}
                        {!apiKeySet && <span className="ml-2" style={{ color: "#f59e0b" }}>Demo</span>}
                      </span>
                      <Link
                        href={agent.href}
                        className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded"
                        style={{ background: "var(--bg-elevated)", color: "var(--accent)", border: "1px solid var(--border)" }}
                      >
                        Open <ExternalLink size={10} />
                      </Link>
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
                      <Badge label={pack.category} variant={categoryBadgeVariant[pack.category]} size="xs" />
                    </div>
                  </div>
                  {pack.status === "coming-soon" && <Badge label="Coming Soon" variant="muted" size="xs" />}
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
                      <Download size={11} /> Install
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
