import type { InstanceManifest, AgentCapability } from "./manifest";

const PLATFORM_TOKEN = process.env.DIVIDEN_PLATFORM_TOKEN;
const INSTANCE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://inyo.app";
const DIVIDEN_BASE = "https://dividen.ai";

export interface FederationStatus {
  registered: boolean;
  instanceId: string | null;
  lastHeartbeatAt: string | null;
  peersCount: number;
  _mock: boolean;
}

export interface RegisterResult {
  success: boolean;
  instanceId: string | null;
  platformToken?: string;
  message: string;
  _mock: boolean;
}

export interface HeartbeatResult {
  success: boolean;
  _mock: boolean;
}

export interface AgentSyncPayload {
  id: string;
  name: string;
  description: string;
  endpointUrl: string;
  category: string;
  tags: string;
  inputFormat: "json" | "text";
  outputFormat: "json" | "text";
  supportsA2A: boolean;
  supportsMCP: boolean;
  pricingModel: "free" | "per_task" | "tiered" | "dynamic";
  developerName: string;
  developerUrl: string;
  agentCardUrl: string;
  capabilities: { taskTypes: string; contextInstructions: string };
  samplePrompts: Record<string, unknown>[];
}

export interface SyncResult {
  success: boolean;
  created: number;
  updated: number;
  skipped: number;
  message: string;
  _mock: boolean;
}

const CATEGORY_MAP: Record<string, string> = {
  "deal-flow": "analysis",
  "ic-memo": "analysis",
  "portfolio-monitor": "analysis",
  "cfo": "analysis",
  "legal": "legal",
  "tax": "analysis",
  "chief-of-staff": "productivity",
  "concierge": "productivity",
  "philanthropy": "productivity",
  "relationships": "analysis",
  "deal-enrichment": "research",
  "term-sheet": "legal",
  "diligence": "analysis",
  "unit-economics": "analysis",
  "saas-model": "analysis",
  "cap-table": "analysis",
  "term-loan": "analysis",
  "sales-forecast": "analysis",
  "sales-quota": "analysis",
  "cash-management": "analysis",
  "venture-stagger": "analysis",
  "option-grants": "analysis",
  "startup-kit": "productivity",
};

const SAMPLE_PROMPTS: Record<string, Record<string, unknown>[]> = {
  "deal-flow": [
    { label: "Score this Series A healthcare AI deal", agentType: "deal-flow", context: { company: "MedSync", sector: "healthcare", stage: "series-a", capitalAsk: 8000000, valuation: 42000000, description: "AI-powered clinical documentation. $3.2M ARR, 2.8x YoY growth. 40 hospital customers." } },
    { label: "Triage this fintech seed deal", agentType: "deal-flow", context: { company: "PayFlow", sector: "fintech", stage: "seed", capitalAsk: 3000000, valuation: 15000000, description: "Real-time B2B payment rails for mid-market. Pre-revenue, strong founder pedigree." } },
  ],
  "ic-memo": [
    { label: "Write IC memo for Meridian AI Series B", agentType: "ic-memo", context: { company: "Meridian AI", stage: "series-b", capitalAsk: 12000000, valuation: 85000000, description: "Enterprise compliance LLM. $8.4M ARR, 3.2x YoY. 74% gross margin.", team: "Sarah Chen CEO (ex-Palantir), Marcus Webb CTO (ex-Two Sigma)", sector: "enterprise-ai" } },
    { label: "Write IC memo for climate tech deal", agentType: "ic-memo", context: { company: "Volta Energy", stage: "series-c", capitalAsk: 25000000, valuation: 180000000, description: "Grid-scale battery storage. 3 GWh deployed, $400M PPA backlog.", team: "Maria Santos CEO (ex-Tesla Energy)", sector: "climate-tech" } },
  ],
  "portfolio-monitor": [
    { label: "Check Volta Energy quarterly health", agentType: "portfolio-monitor", context: { name: "Volta Energy", sector: "climate-tech", investedAmount: 8000000, currentValue: 6200000, alertLevel: "watch", lastUpdate: "Revenue growth slowed to 1.4x, CFO departure announced" } },
    { label: "Monitor Meridian AI status", agentType: "portfolio-monitor", context: { name: "Meridian AI", sector: "enterprise-ai", investedAmount: 12000000, currentValue: 18500000, alertLevel: "healthy", lastUpdate: "Closed $22M Series C, NRR now 142%" } },
  ],
  "cfo": [
    { label: "Summarize cash position across all entities", agentType: "cfo", context: { query: "What is our current liquidity position across all entities?", entities: [{ name: "Hartwell Family LLC", cash: 12400000 }, { name: "Hartwell Cayman LP", cash: 28600000 }, { name: "HW Operating Co", cash: 3950000 }] } },
    { label: "What capital calls are due this quarter?", agentType: "cfo", context: { query: "Summarize all capital calls due in Q2 2025", pendingCalls: [{ fund: "Phalanx Ventures III", amount: 2000000, due: "2025-06-15" }, { fund: "Arcadia Energy Fund II", amount: 750000, due: "2025-05-30" }] } },
  ],
  "legal": [
    { label: "Review this SAFE note for risk flags", agentType: "legal", context: { documentName: "Meridian AI SAFE Note", documentType: "safe", documentContent: "SAFE Note — $12M at $85M pre-money cap. MFN clause. Pro-rata rights. IP assignment extends to work outside employment scope. Indemnification: unlimited, no cap. Governing law: Delaware.", counterparty: "Meridian AI Inc." } },
    { label: "Flag issues in this LP agreement", agentType: "legal", context: { documentName: "Phalanx Ventures III LP Agreement", documentType: "lpa", documentContent: "GP carry: 25% (above market). No clawback provision. Key-man: only if both managing partners depart simultaneously. Management fee: 2.5% on committed capital for full 10-year term, no step-down.", counterparty: "Phalanx GP LLC" } },
  ],
  "tax": [
    { label: "Summarize my 2025 federal tax position", agentType: "tax", context: { query: "What is my estimated 2025 federal and state tax liability?", taxYear: 2025, k1s: [{ fund: "Phalanx Ventures III", ordinaryIncome: 180000, capitalGains: 420000 }, { fund: "Arcadia Energy Fund II", ordinaryIncome: 95000, capitalGains: 0 }], otherIncome: 850000 } },
    { label: "Which K-1s are still pending?", agentType: "tax", context: { query: "Which K-1s haven't arrived and what are the filing implications?", taxYear: 2025, expectedK1s: ["Phalanx Ventures III", "Arcadia Energy Fund II", "Terrace REIT", "Blue Horizon Opportunity Fund"] } },
  ],
  "chief-of-staff": [
    { label: "Plan Aspen trip for 6 guests this June", agentType: "chief-of-staff", context: { request: "Arrange Aspen trip for family and 3 guests, weekend of June 14-16. Private jet preferred. Ski-in/ski-out accommodations, dinner reservations, and spa.", type: "travel", guests: 6 } },
    { label: "Prep board meeting agenda for Thursday", agentType: "chief-of-staff", context: { request: "Prepare agenda for Thursday board meeting. Topics: Q1 portfolio review, two new investment proposals, LP advisory update.", type: "meeting-prep", date: "2025-06-12" } },
  ],
  "concierge": [
    { label: "Book Nobu Malibu for 4 this Saturday", agentType: "concierge", context: { request: "Book Nobu Malibu for 4 people this Saturday at 8pm. If unavailable, try Nobu Downtown or Matsuhisa Beverly Hills. Prefer private seating.", type: "dining", date: "2025-05-31", guests: 4 } },
    { label: "Schedule Aspen property pre-summer maintenance", agentType: "concierge", context: { request: "Aspen house pre-summer maintenance: HVAC service, pool opening, exterior pressure wash, fireplace inspection. Schedule all vendors for week of June 2.", type: "property", property: "Aspen Mountain Residence" } },
  ],
  "philanthropy": [
    { label: "Summarize foundation giving impact this year", agentType: "philanthropy", context: { query: "What has been our foundation's total giving and impact in 2025?", grants: [{ grantee: "Khan Academy", amount: 250000, focus: "education" }, { grantee: "Nature Conservancy", amount: 500000, focus: "environment" }] } },
    { label: "What grant obligations are due in Q3?", agentType: "philanthropy", context: { query: "List all grant commitments and pledge payments due Q3 2025", pledges: [{ grantee: "Stanford d.school", totalPledge: 1000000, paid: 500000, nextPayment: "2025-09-01", nextAmount: 250000 }] } },
  ],
  "relationships": [
    { label: "Who do I know at Sequoia Capital?", agentType: "relationships", context: { query: "Find all direct and second-degree connections to Sequoia Capital", target: "Sequoia Capital", contacts: [{ name: "Mike Moritz", company: "Sequoia", relationship: "lp-contact" }] } },
    { label: "Find warm path to Stripe leadership", agentType: "relationships", context: { query: "Who in my network has the strongest connection to Patrick Collison or Stripe's executive team?", target: "Stripe / Patrick Collison" } },
  ],
  "deal-enrichment": [
    { label: "Enrich MedSync with web signals", agentType: "deal-enrichment", context: { company: "MedSync", website: "https://medsync.ai", description: "AI clinical documentation for hospitals", founderLinkedIn: "https://linkedin.com/in/dr-james-park", sector: "healthtech", stage: "series-a" } },
    { label: "Research PayFlow founder background", agentType: "deal-enrichment", context: { company: "PayFlow", website: "https://payflow.com", description: "Real-time B2B payment rails", founderLinkedIn: "https://linkedin.com/in/alex-rodriguez-payments", sector: "fintech", stage: "seed" } },
  ],
  "term-sheet": [
    { label: "Extract terms from Meridian AI Series B sheet", agentType: "term-sheet", documents: [{ name: "Meridian AI Series B Term Sheet", content: "Pre-money: $85M. Investment: $12M Series B Preferred. Liquidation: 1x non-participating. Anti-dilution: broad-based weighted average. Board: 2 investor, 2 founder, 1 independent. Pro-rata: yes. No-shop: 45 days." }] },
    { label: "Compare Sequoia vs a16z term sheets", agentType: "term-sheet", documents: [{ name: "Term Sheet A — Sequoia", content: "Pre-money: $90M. Check: $15M. 1x non-participating. Board: 1 seat. No-shop: 30 days." }, { name: "Term Sheet B — a16z", content: "Pre-money: $85M. Check: $20M. 1.5x participating liquidation. Board: 2 seats + observer. No-shop: 45 days." }] },
  ],
  "diligence": [
    { label: "Run diligence checklist on Meridian AI Series B", agentType: "diligence", context: { company: "Meridian AI", stage: "series-b", checklistItems: [{ id: "1", question: "ARR growth above 100% YoY?", answer: "$8.4M ARR from $2.6M — 3.2x growth" }, { id: "2", question: "Customer concentration under 30%?", answer: "Top 3 customers = 67% of ARR — CONCENTRATION RISK" }, { id: "3", question: "Founder prior exit?", answer: "CEO prior exit $180M, CTO ex-Two Sigma" }] } },
    { label: "Flag red flags in PayFlow seed diligence", agentType: "diligence", context: { company: "PayFlow", stage: "seed", checklistItems: [{ id: "1", question: "Cap table clean?", answer: "3 departed co-founders holding 18% combined with no vesting cliff — RISK" }, { id: "2", question: "Product demo reviewed?", answer: "MVP stage, no production customers yet" }] } },
  ],
  "unit-economics": [
    { label: "Cohort analysis for MedSync unit economics", agentType: "unit-economics", context: { company: "MedSync", sector: "healthtech", cohortPeriod: "monthly", cohorts: [{ period: "2025-Q1", customers: 12, acv: 96000, grossMarginPct: 72, logoChurnPct: 4, grossDollarChurnPct: 6, ndr: 118 }, { period: "2025-Q2", customers: 14, acv: 98000, grossMarginPct: 73, logoChurnPct: 3, grossDollarChurnPct: 4, ndr: 122 }], smSpendLastQuarter: 840000, newCustomersLastQuarter: 20 } },
    { label: "PayFlow cohort unit economics at seed", agentType: "unit-economics", context: { company: "PayFlow", sector: "fintech", cohortPeriod: "quarterly", cohorts: [{ period: "2025-Q1", customers: 8, acv: 18000, grossMarginPct: 61, logoChurnPct: 18, grossDollarChurnPct: 22, ndr: 94 }], smSpendLastQuarter: 170000, newCustomersLastQuarter: 8 } },
  ],
  "saas-model": [
    { label: "Build 3-statement model for Meridian AI raise", agentType: "saas-model", context: { company: "Meridian AI", arr: 8400000, arrGrowthPct: 220, grossMarginPct: 74, smPctRevenue: 48, rdPctRevenue: 22, gaPctRevenue: 14, monthlyBurn: 620000, currentCash: 9200000, nrr: 138, grossChurnPct: 4, headcount: 38, fundingGoal: 12000000 } },
    { label: "Model MedSync Series A funding need", agentType: "saas-model", context: { company: "MedSync", arr: 3200000, arrGrowthPct: 180, grossMarginPct: 72, smPctRevenue: 52, rdPctRevenue: 28, gaPctRevenue: 18, monthlyBurn: 480000, currentCash: 4100000, nrr: 118, grossChurnPct: 7, headcount: 24, fundingGoal: 8000000 } },
  ],
  "cap-table": [
    { label: "Model Meridian AI Series B with SAFEs converting", agentType: "cap-table", context: { company: "Meridian AI", preMoney: 85000000, newInvestment: 12000000, securities: [{ type: "common", label: "Founders", holders: "Sarah Chen, Marcus Webb", shares: 6000000 }, { type: "safe", label: "Pre-money SAFEs", holders: "Seed angels", amount: 2500000, capOrPrice: 15000000, variant: "post-money" }, { type: "preferred", label: "Series A — Accel", holders: "Accel Partners", shares: 1300000, liquidationPref: "1x non-participating" }, { type: "option", label: "ESOP Pool", shares: 1200000 }] } },
    { label: "PayFlow seed cap table with convertible note", agentType: "cap-table", context: { company: "PayFlow", preMoney: 15000000, newInvestment: 3000000, securities: [{ type: "common", label: "Founders (3)", shares: 7000000 }, { type: "convertible-note", label: "Pre-seed note", amount: 500000, cap: 8000000, discount: 20, variant: "pre-money" }, { type: "option", label: "ESOP Pool", shares: 1000000 }] } },
  ],
  "term-loan": [
    { label: "Arcadia Defense 2-tranche venture debt", agentType: "term-loan", context: { company: "Arcadia Defense", lender: "Silicon Valley Bank", tranches: [{ label: "Tranche A", amount: 3000000, drawDate: "2026-06-01", interestRatePct: 8.5, interestOnlyMonths: 12, amortizationMonths: 24 }, { label: "Tranche B", amount: 2000000, drawDate: "2026-09-01", drawCriteria: "ARR reaches $5M", interestRatePct: 8.5, interestOnlyMonths: 6, amortizationMonths: 30 }], originationFeePct: 0.5, prepaymentPenalty: "3% year 1, 2% year 2, 1% year 3", warrantCoverage: "1% fully diluted at Series A price", currentMonthlyBurn: 380000, currentCash: 6200000 } },
    { label: "MedSync Hercules Capital growth facility", agentType: "term-loan", context: { company: "MedSync", lender: "Hercules Capital", tranches: [{ label: "Single tranche", amount: 8000000, drawDate: "2026-07-01", interestRatePct: 11.25, interestOnlyMonths: 18, amortizationMonths: 30 }], originationFeePct: 1.0, prepaymentPenalty: "2% year 1, 1% year 2", warrantCoverage: "2% of loan amount at Series A price", currentMonthlyBurn: 480000, currentCash: 4100000 } },
  ],
  "sales-forecast": [
    { label: "MedSync Q2 2026 board forecast", agentType: "sales-forecast", context: { company: "MedSync", forecastPeriod: "Q2 2026", quota: 1200000, closed: 340000, pipeline: [{ name: "Regional Health System TX", value: 180000, stage: "verbal-commit", closeProbPct: 95, forecastCategory: "commit" }, { name: "Midwest Hospital Network", value: 240000, stage: "negotiation", closeProbPct: 80, forecastCategory: "commit" }, { name: "NYC Academic Medical Center", value: 320000, stage: "proposal", closeProbPct: 55, forecastCategory: "most-likely" }, { name: "West Coast Health Group", value: 210000, stage: "demo", closeProbPct: 30, forecastCategory: "best-case" }], slipped: [{ name: "Southeast Children's Hospital", value: 140000, reason: "Budget freeze, Q3 timing" }], lost: [{ name: "Tri-State Medical", value: 95000, reason: "Chose Epic EHR integration" }] } },
    { label: "Meridian AI Q2 2026 board forecast", agentType: "sales-forecast", context: { company: "Meridian AI", forecastPeriod: "Q2 2026", quota: 2400000, closed: 780000, pipeline: [{ name: "Fortune 500 Bank", value: 480000, stage: "verbal-commit", closeProbPct: 92, forecastCategory: "commit" }, { name: "Global Insurance Co", value: 360000, stage: "negotiation", closeProbPct: 78, forecastCategory: "commit" }, { name: "Regional Compliance Firm", value: 120000, stage: "proposal", closeProbPct: 60, forecastCategory: "most-likely" }, { name: "Tech Conglomerate", value: 650000, stage: "demo", closeProbPct: 35, forecastCategory: "best-case" }], slipped: [{ name: "Pharma Giant", value: 280000, reason: "Procurement delay, Q3 expected" }], lost: [] } },
  ],
  "sales-quota": [
    { label: "MedSync Q2 quota capacity review", agentType: "sales-quota", context: { company: "MedSync", revenuePlan: 4000000, repCount: 6, quotaPerRep: 800000, annualOtePerRep: 180000, baseVariableSplit: "50/50", rampMonths: 4, expectedAttritionPct: 20, newHiresThisQuarter: 1, repsOnRamp: [{ name: "Rep 6", monthsIn: 2, rampPct: 50 }], attainmentDistribution: { above100Pct: 2, between75And100Pct: 2, between50And75Pct: 1, below50Pct: 1 } } },
    { label: "Meridian AI sales team quota analysis", agentType: "sales-quota", context: { company: "Meridian AI", revenuePlan: 8000000, repCount: 8, quotaPerRep: 1200000, annualOtePerRep: 220000, baseVariableSplit: "50/50", rampMonths: 5, expectedAttritionPct: 25, newHiresThisQuarter: 2, repsOnRamp: [{ name: "Rep 7", monthsIn: 3, rampPct: 60 }, { name: "Rep 8", monthsIn: 1, rampPct: 25 }], attainmentDistribution: { above100Pct: 3, between75And100Pct: 3, between50And75Pct: 1, below50Pct: 1 } } },
  ],
  "cash-management": [
    { label: "Volta Energy treasury & banking review", agentType: "cash-management", context: { company: "Volta Energy", currentCash: 8200000, bankingRelationships: [{ bank: "SVB (First Citizens)", balance: 8200000 }], monthlyGrossBurn: 920000, monthlyRevenue: 340000, burnTrend: "accelerating", hasIntrafi: false, hasSweepAccount: false, boardInvestmentPolicy: false, creditLineAvailable: false, treasuryAllocation: { checking: 8200000, tbills: 0, moneyMarket: 0 } } },
    { label: "Strata Security cash position & FDIC exposure", agentType: "cash-management", context: { company: "Strata Security", currentCash: 3100000, bankingRelationships: [{ bank: "First Republic (single bank)", balance: 3100000 }], monthlyGrossBurn: 520000, monthlyRevenue: 180000, burnTrend: "stable", hasIntrafi: false, hasSweepAccount: false, boardInvestmentPolicy: false, creditLineAvailable: false, treasuryAllocation: { checking: 3100000, tbills: 0, moneyMarket: 0 } } },
  ],
  "venture-stagger": [
    { label: "MedSync FY2026 stagger chart analysis", agentType: "venture-stagger", context: { company: "MedSync", period: "FY2026", aop: 4200000, monthlyData: [{ month: "Jan-26", aop: 280000, forecastAtMonth: 265000, actual: 258000 }, { month: "Feb-26", aop: 320000, forecastAtMonth: 310000, actual: 305000 }, { month: "Mar-26", aop: 380000, forecastAtMonth: 360000, actual: 342000 }, { month: "Apr-26", aop: 420000, forecastAtMonth: 395000, actual: null }] } },
    { label: "Meridian AI rolling forecast stagger", agentType: "venture-stagger", context: { company: "Meridian AI", period: "FY2026", aop: 9600000, monthlyData: [{ month: "Jan-26", aop: 680000, forecastAtMonth: 720000, actual: 695000 }, { month: "Feb-26", aop: 760000, forecastAtMonth: 780000, actual: 812000 }, { month: "Mar-26", aop: 820000, forecastAtMonth: 850000, actual: 798000 }, { month: "Apr-26", aop: 880000, forecastAtMonth: 840000, actual: null }] } },
  ],
  "option-grants": [
    { label: "MedSync option pool budget review", agentType: "option-grants", context: { company: "MedSync", totalOptionPool: 1800000, previouslyGranted: 820000, recentGrants: [{ recipient: "CTO hire", level: "VP", shares: 120000, fdPct: 0.85, strikePrice: 0.42, vestingSchedule: "4yr/1yr cliff" }, { recipient: "3 senior engineers", level: "IC", shares: 45000, fdPct: 0.32, strikePrice: 0.42, vestingSchedule: "4yr/1yr cliff" }], policyMatrix: [{ level: "C-suite", range: "1.0%-2.0%" }, { level: "VP", range: "0.5%-1.0%" }, { level: "Director", range: "0.25%-0.5%" }, { level: "Manager", range: "0.1%-0.25%" }, { level: "IC", range: "0.05%-0.15%" }], monthlyHiringPlan: 2, boardApprovalCurrent: true, valuation409aDate: "2025-11-01" } },
    { label: "Meridian AI board option grant approval", agentType: "option-grants", context: { company: "Meridian AI", totalOptionPool: 2400000, previouslyGranted: 1350000, recentGrants: [{ recipient: "VP Sales", level: "VP", shares: 180000, fdPct: 0.9, strikePrice: 1.15, vestingSchedule: "4yr/1yr cliff" }, { recipient: "Head of CS", level: "Director", shares: 65000, fdPct: 0.33, strikePrice: 1.15, vestingSchedule: "4yr/1yr cliff" }], monthlyHiringPlan: 3, boardApprovalCurrent: false, valuation409aDate: "2025-08-15" } },
  ],
  "startup-kit": [
    { label: "Austin healthtech founder starter guide", agentType: "startup-kit", context: { founder: "Dr. James Park", company: "MedSync", location: "Austin", stage: "series-a", sector: "healthtech", goals: ["Find co-investors for Series B", "Build clinical advisory board", "Get press coverage"], currentConnections: ["Capital Factory alumni"] } },
    { label: "Houston energy startup ecosystem map", agentType: "startup-kit", context: { founder: "Maria Santos", company: "Volta Energy", location: "Houston", stage: "series-b", sector: "climate-tech", goals: ["Connect with energy industry LPs", "Find strategic partners in utilities", "Hire senior ops team"], currentConnections: [] } },
  ],
};

function capabilityToSyncPayload(cap: AgentCapability): AgentSyncPayload {
  const samples = SAMPLE_PROMPTS[cap.type] ?? [{ label: `Run ${cap.name}`, agentType: cap.type, context: {} }];
  return {
    id: cap.type,
    name: `Inyo — ${cap.name}`,
    description: cap.description,
    endpointUrl: `${INSTANCE_URL}/api/federation/tasks`,
    category: CATEGORY_MAP[cap.type] ?? "analysis",
    tags: `family-office, ${cap.type.replace(/-/g, ", ")}, wealth-management`,
    inputFormat: "json",
    outputFormat: "json",
    supportsA2A: true,
    supportsMCP: false,
    pricingModel: "free",
    developerName: "Inyo",
    developerUrl: INSTANCE_URL,
    agentCardUrl: `${INSTANCE_URL}/.well-known/agent-card.json`,
    capabilities: {
      taskTypes: cap.type,
      contextInstructions: `JSON input with agentType: "${cap.type}" and context object. See samplePrompts for examples.`,
    },
    samplePrompts: samples,
  };
}

export async function registerInstance(manifest: InstanceManifest): Promise<RegisterResult> {
  if (!PLATFORM_TOKEN) {
    return {
      success: true,
      instanceId: "inyo-demo",
      message: "Mock registration — set DIVIDEN_PLATFORM_TOKEN to connect to the live network",
      _mock: true,
    };
  }

  try {
    const res = await fetch(`${DIVIDEN_BASE}/api/v2/federation/register`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PLATFORM_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: manifest.name,
        description: manifest.description,
        url: INSTANCE_URL,
        version: manifest.version,
        tags: manifest.tags,
        endpoints: manifest.endpoints,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Dividen API ${res.status}: ${text}`);
    }

    const data = await res.json() as { instanceId?: string; platformToken?: string; id?: string };
    const instanceId = data.instanceId ?? data.id ?? null;
    return {
      success: true,
      instanceId,
      platformToken: data.platformToken,
      message: "Registered with Dividen network",
      _mock: false,
    };
  } catch (err) {
    return { success: false, instanceId: null, message: (err as Error).message, _mock: false };
  }
}

export async function syncAgents(capabilities: AgentCapability[]): Promise<SyncResult> {
  if (!PLATFORM_TOKEN) {
    return {
      success: true,
      created: capabilities.length,
      updated: 0,
      skipped: 0,
      message: `Mock sync — ${capabilities.length} agents queued. Set DIVIDEN_PLATFORM_TOKEN to push to the live Bubble Store.`,
      _mock: true,
    };
  }

  try {
    const agents = capabilities.map(capabilityToSyncPayload);
    const res = await fetch(`${DIVIDEN_BASE}/api/v2/federation/agents`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PLATFORM_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ agents }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Dividen API ${res.status}: ${text}`);
    }

    const data = await res.json() as { created?: number; updated?: number; skipped?: number };
    return {
      success: true,
      created: data.created ?? 0,
      updated: data.updated ?? 0,
      skipped: data.skipped ?? 0,
      message: `Synced ${(data.created ?? 0) + (data.updated ?? 0)} agents to Dividen Bubble Store`,
      _mock: false,
    };
  } catch (err) {
    return {
      success: false,
      created: 0,
      updated: 0,
      skipped: 0,
      message: (err as Error).message,
      _mock: false,
    };
  }
}

export async function enableMarketplace(): Promise<{ success: boolean; message: string }> {
  if (!PLATFORM_TOKEN) {
    return { success: true, message: "Mock — set DIVIDEN_PLATFORM_TOKEN to enable marketplace" };
  }

  try {
    const res = await fetch(`${DIVIDEN_BASE}/api/v2/federation/marketplace-link`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PLATFORM_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: "enable" }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Dividen API ${res.status}: ${text}`);
    }

    return { success: true, message: "Marketplace enabled" };
  } catch (err) {
    return { success: false, message: (err as Error).message };
  }
}

export async function sendHeartbeat(instanceId: string): Promise<HeartbeatResult> {
  if (!PLATFORM_TOKEN) {
    return { success: true, _mock: true };
  }

  try {
    const res = await fetch(`${DIVIDEN_BASE}/api/v2/federation/instances/${instanceId}/heartbeat`, {
      method: "POST",
      headers: { Authorization: `Bearer ${PLATFORM_TOKEN}`, "Content-Type": "application/json" },
    });
    return { success: res.ok, _mock: false };
  } catch {
    return { success: false, _mock: false };
  }
}

export async function getFederationStatus(): Promise<FederationStatus> {
  if (!PLATFORM_TOKEN) {
    return { registered: false, instanceId: null, lastHeartbeatAt: null, peersCount: 0, _mock: true };
  }

  try {
    const res = await fetch(`${DIVIDEN_BASE}/api/v2/federation/instances/inyo/status`, {
      headers: { Authorization: `Bearer ${PLATFORM_TOKEN}` },
    });

    if (!res.ok) {
      return { registered: false, instanceId: null, lastHeartbeatAt: null, peersCount: 0, _mock: false };
    }

    const data = await res.json() as FederationStatus;
    return { ...data, _mock: false };
  } catch {
    return { registered: false, instanceId: null, lastHeartbeatAt: null, peersCount: 0, _mock: false };
  }
}
