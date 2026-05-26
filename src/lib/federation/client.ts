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

const CONTEXT_INSTRUCTIONS: Record<string, string> = {
  "deal-flow": 'Send { "agentType": "deal-flow", "context": { "company": "...", "sector": "...", "stage": "...", "capitalAsk": 0, "description": "..." } }',
  "ic-memo": 'Send { "agentType": "ic-memo", "context": { "company": "...", "description": "...", "financials": "...", "team": "..." } }',
  "portfolio-monitor": 'Send { "agentType": "portfolio-monitor", "context": { "name": "...", "sector": "...", "investedAmount": 0, "currentValue": 0 } }',
  "cfo": 'Send { "agentType": "cfo", "context": { "query": "What is our cash position?", "entities": [] } }',
  "legal": 'Send { "agentType": "legal", "context": { "documentName": "...", "documentContent": "..." } }',
  "tax": 'Send { "agentType": "tax", "context": { "query": "Summarize my K-1 income for 2025", "k1s": [] } }',
  "chief-of-staff": 'Send { "agentType": "chief-of-staff", "context": { "request": "...", "type": "travel|property|gifting" } }',
  "concierge": 'Send { "agentType": "concierge", "context": { "request": "...", "type": "travel|property|gifting|event" } }',
  "philanthropy": 'Send { "agentType": "philanthropy", "context": { "query": "Summarize our giving impact this year" } }',
  "relationships": 'Send { "agentType": "relationships", "context": { "query": "Who do I know at Andreessen Horowitz?" } }',
  "deal-enrichment": 'Send { "agentType": "deal-enrichment", "context": { "company": "...", "website": "...", "linkedinUrl": "...", "description": "..." } }',
  "term-sheet": 'Send { "agentType": "term-sheet", "documents": [{ "name": "Term Sheet", "content": "..." }] }',
  "diligence": 'Send { "agentType": "diligence", "context": { "company": "...", "checklistItems": [] } }',
};

function capabilityToSyncPayload(cap: AgentCapability): AgentSyncPayload {
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
      contextInstructions: CONTEXT_INSTRUCTIONS[cap.type] ?? `Send { "agentType": "${cap.type}", "context": {} }`,
    },
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
