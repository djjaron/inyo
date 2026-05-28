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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: manifest.name,
        description: manifest.description,
        baseUrl: INSTANCE_URL,
        apiKey: PLATFORM_TOKEN,
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

export interface DeleteResult {
  success: boolean;
  deleted: string[];
  failed: string[];
  message: string;
  _mock: boolean;
}

export async function deleteAgents(agentIds: string[]): Promise<DeleteResult> {
  if (!PLATFORM_TOKEN) {
    return {
      success: true,
      deleted: agentIds,
      failed: [],
      message: `Mock delete — ${agentIds.length} agents removed. Set DIVIDEN_PLATFORM_TOKEN to delete from the live Bubble Store.`,
      _mock: true,
    };
  }

  const deleted: string[] = [];
  const failed: string[] = [];

  await Promise.all(
    agentIds.map(async (id) => {
      try {
        const res = await fetch(`${DIVIDEN_BASE}/api/v2/federation/agents/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${PLATFORM_TOKEN}` },
        });
        if (res.ok || res.status === 404) {
          deleted.push(id);
        } else {
          failed.push(id);
        }
      } catch {
        failed.push(id);
      }
    })
  );

  return {
    success: failed.length === 0,
    deleted,
    failed,
    message: failed.length === 0
      ? `Deleted ${deleted.length} agents from Dividen Bubble Store`
      : `Deleted ${deleted.length}, failed ${failed.length}: ${failed.join(", ")}`,
    _mock: false,
  };
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
