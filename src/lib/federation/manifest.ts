import type { AgentType } from "@/types";

export interface AgentCapability {
  type: string;
  name: string;
  description: string;
  model: "deep" | "fast";
}

export interface InstanceManifest {
  instanceId: string;
  name: string;
  description: string;
  version: string;
  protocol: string;
  capabilities: AgentCapability[];
  endpoints: {
    manifest: string;
    inbound: string;
    health: string;
  };
  tags: string[];
  generatedAt: string;
}

const CAPABILITIES: AgentCapability[] = [
  {
    type: "deal-flow" satisfies AgentType,
    name: "Deal Flow Analyst",
    description: "Scores and triages inbound investment opportunities",
    model: "deep",
  },
  {
    type: "ic-memo" satisfies AgentType,
    name: "IC Memo Writer",
    description: "Generates institutional investment committee memos",
    model: "deep",
  },
  {
    type: "portfolio-monitor" satisfies AgentType,
    name: "Portfolio Monitor",
    description: "Watches investments for material changes and alerts",
    model: "deep",
  },
  {
    type: "cfo" satisfies AgentType,
    name: "CFO Agent",
    description: "Analyzes cash flow, entity liquidity, and expense reporting",
    model: "deep",
  },
  {
    type: "legal" satisfies AgentType,
    name: "Legal Review Agent",
    description: "Reviews documents for risk flags and compliance issues",
    model: "deep",
  },
  {
    type: "tax" satisfies AgentType,
    name: "Tax Intelligence Agent",
    description: "Organizes K-1s, deadlines, and tax obligations",
    model: "deep",
  },
  {
    type: "chief-of-staff" satisfies AgentType,
    name: "Chief of Staff",
    description: "Handles inbox triage, follow-ups, and operational tasks",
    model: "fast",
  },
  {
    type: "concierge" satisfies AgentType,
    name: "Concierge Agent",
    description: "Manages travel, household, and lifestyle operations",
    model: "fast",
  },
  {
    type: "philanthropy" satisfies AgentType,
    name: "Philanthropy Agent",
    description: "Supports foundation giving and grant tracking",
    model: "fast",
  },
  {
    type: "relationships" satisfies AgentType,
    name: "Relationship Intelligence",
    description: "Maps network, warm paths, and interaction history",
    model: "fast",
  },
  {
    type: "deal-enrichment" satisfies AgentType,
    name: "Deal Enrichment Analyst",
    description: "Scores deals using web, LinkedIn, and Crunchbase signals",
    model: "deep",
  },
  {
    type: "term-sheet" satisfies AgentType,
    name: "Term Sheet Analyst",
    description: "Extracts and compares investment term sheets",
    model: "deep",
  },
  {
    type: "diligence" satisfies AgentType,
    name: "Diligence Agent",
    description: "Reviews deal diligence checklists with AI analysis",
    model: "deep",
  },
  {
    type: "unit-economics" satisfies AgentType,
    name: "Unit Economics Analyst",
    description: "Evaluates LTV, CAC, payback period, and unit-level business model health",
    model: "fast",
  },
  {
    type: "saas-model" satisfies AgentType,
    name: "SaaS Operating Model Analyst",
    description: "Scores SaaS metrics: Rule of 40, magic number, burn multiple, NRR",
    model: "fast",
  },
  {
    type: "cap-table" satisfies AgentType,
    name: "Cap Table Analyst",
    description: "Models dilution scenarios, ownership waterfall, and ESOP pool analysis",
    model: "fast",
  },
  {
    type: "term-loan" satisfies AgentType,
    name: "Term Loan Analyst",
    description: "Analyzes debt structures, amortization, covenants, and cost of capital",
    model: "fast",
  },
  {
    type: "sales-forecast" satisfies AgentType,
    name: "Sales Forecast Analyst",
    description: "Analyzes pipeline coverage, attainment scenarios, and commit vs. best-case bookings",
    model: "fast",
  },
  {
    type: "sales-quota" satisfies AgentType,
    name: "Sales Quota Analyst",
    description: "Evaluates quota model, OTE structure, attainment distribution, and quota adequacy",
    model: "fast",
  },
  {
    type: "cash-management" satisfies AgentType,
    name: "Cash Management Advisor",
    description: "Analyzes runway, burn trend, treasury allocation, and next-raise timing",
    model: "fast",
  },
  {
    type: "venture-stagger" satisfies AgentType,
    name: "Venture Stagger Analyst",
    description: "Models round-by-round dilution, valuation step-ups, and fundraising cadence",
    model: "fast",
  },
  {
    type: "option-grants" satisfies AgentType,
    name: "Option Grants Advisor",
    description: "Manages option policy matrix, budget tracking, and board grant approval templates",
    model: "fast",
  },
  {
    type: "startup-kit" satisfies AgentType,
    name: "Texas Startup Navigator",
    description: "Guides Texas founders through the startup ecosystem: communities, events, media, accelerators",
    model: "fast",
  },
];

export function buildManifest(baseUrl: string): InstanceManifest {
  return {
    instanceId: "inyo",
    name: "Inyo",
    description: "Private AI operating system for modern family offices",
    version: "1.0.0",
    protocol: "dividen/1.0",
    capabilities: CAPABILITIES,
    endpoints: {
      manifest: `${baseUrl}/api/federation/manifest`,
      inbound: `${baseUrl}/api/federation/tasks`,
      health: `${baseUrl}/api/federation/status`,
    },
    tags: ["family-office", "investment", "wealth-management", "legal", "tax"],
    generatedAt: new Date().toISOString(),
  };
}
