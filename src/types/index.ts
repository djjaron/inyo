export type AgentType =
  | "deal-flow"
  | "ic-memo"
  | "portfolio-monitor"
  | "cfo"
  | "legal"
  | "tax"
  | "chief-of-staff"
  | "concierge"
  | "philanthropy"
  | "relationships"
  | "deal-enrichment"
  | "term-sheet"
  | "diligence"
  | "unit-economics"
  | "saas-model"
  | "cap-table"
  | "term-loan";

export type DealStatus =
  | "inbound"
  | "reviewing"
  | "diligence"
  | "ic-review"
  | "passed"
  | "invested"
  | "archived";

export type DealStage =
  | "pre-seed"
  | "seed"
  | "series-a"
  | "series-b"
  | "series-c"
  | "growth"
  | "pe"
  | "real-estate"
  | "credit";

export type ContactType =
  | "founder"
  | "lp"
  | "gp"
  | "attorney"
  | "banker"
  | "advisor"
  | "broker"
  | "family";

export interface DealScoreOutput {
  score: number;
  sector: string;
  stage: string;
  capitalAsk?: number;
  valuation?: number;
  summary: string;
  risks: string[];
  opportunities: string[];
  founderBackground?: string;
  comparables?: string[];
  recommendation: "pass" | "review" | "pursue";
}

export interface ICMemoOutput {
  executiveSummary: string;
  companyOverview: string;
  marketOpportunity: string;
  businessModel: string;
  financials: string;
  team: string;
  risks: { category: string; description: string; severity: "low" | "medium" | "high" }[];
  opportunities: string[];
  swot: { strengths: string[]; weaknesses: string[]; opportunities: string[]; threats: string[] };
  recommendation: string;
  nextSteps: string[];
}

export interface PortfolioAlertSummary {
  companyId: string;
  companyName: string;
  alertType: string;
  severity: "info" | "warning" | "critical";
  title: string;
  body: string;
}

export interface LiquiditySnapshot {
  entityId: string;
  entityName: string;
  cash: number;
  receivables: number;
  payables: number;
  netLiquidity: number;
  currency: string;
}

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: number;
}

export interface DashboardWidget {
  id: string;
  title: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "flat";
  status?: "normal" | "warning" | "critical";
}
