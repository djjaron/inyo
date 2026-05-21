/**
 * Inyo LoRA Adapter
 *
 * A platform-agnostic integration layer that exposes Inyo's family office
 * intelligence (agents, context, actions) to external AI interfaces.
 *
 * Any AI agent platform that supports tenant-scoped context + named actions
 * can connect to Inyo via this adapter.
 *
 * To activate: set INYO_LORA_SECRET and NEXT_PUBLIC_APP_URL in Netlify env vars.
 * Point external platforms at: /api/integrations/lora
 */

export interface InyoLoraContext {
  tenant: string;
  platform: "inyo";
  knowledge: "tenant-scoped";
  facts: LoraFact[];
  actions: LoraAction[];
  guard: LoraGuard;
}

export interface LoraFact {
  key: string;
  value: string | number | boolean | null;
  category: string;
}

export interface LoraAction {
  id: string;
  label: string;
  description: string;
  endpoint: string;
  method: "GET" | "POST";
  auth: "staff" | "public";
}

export interface LoraGuard {
  mode: "authenticated" | "public-preview";
  signInUrl: string;
}

/**
 * Build the Inyo LoRA context payload from live family office data.
 * Call this when an external platform requests a context refresh.
 */
export function buildLoraContext(params: {
  familyName: string;
  totalAum?: number;
  activeDeals?: number;
  portfolioCompanies?: number;
  baseUrl: string;
}): InyoLoraContext {
  const { familyName, totalAum, activeDeals, portfolioCompanies, baseUrl } = params;

  const facts: LoraFact[] = [
    { key: "family_name", value: familyName, category: "identity" },
    { key: "platform", value: "Inyo Family Office OS", category: "identity" },
  ];

  if (totalAum != null) facts.push({ key: "total_aum", value: totalAum, category: "finance" });
  if (activeDeals != null) facts.push({ key: "active_deals", value: activeDeals, category: "deal_flow" });
  if (portfolioCompanies != null) facts.push({ key: "portfolio_companies", value: portfolioCompanies, category: "portfolio" });

  const actions: LoraAction[] = [
    {
      id: "deal-flow",
      label: "Analyze Deal",
      description: "Run the Deal Flow Analyst on an inbound opportunity",
      endpoint: `${baseUrl}/api/agents/deal-flow`,
      method: "POST",
      auth: "staff",
    },
    {
      id: "ic-memo",
      label: "Generate IC Memo",
      description: "Draft an Investment Committee memo",
      endpoint: `${baseUrl}/api/agents/ic-memo`,
      method: "POST",
      auth: "staff",
    },
    {
      id: "portfolio-monitor",
      label: "Monitor Portfolio",
      description: "Check portfolio companies for material changes",
      endpoint: `${baseUrl}/api/agents/portfolio-monitor`,
      method: "POST",
      auth: "staff",
    },
    {
      id: "cfo",
      label: "CFO Analysis",
      description: "Cash flow and liquidity analysis across entities",
      endpoint: `${baseUrl}/api/agents/cfo`,
      method: "POST",
      auth: "staff",
    },
    {
      id: "tax",
      label: "Tax Intelligence",
      description: "K-1 analysis and tax position optimization",
      endpoint: `${baseUrl}/api/agents/tax`,
      method: "POST",
      auth: "staff",
    },
    {
      id: "legal",
      label: "Legal Review",
      description: "Document review and clause flagging",
      endpoint: `${baseUrl}/api/agents/legal`,
      method: "POST",
      auth: "staff",
    },
    {
      id: "philanthropy",
      label: "Philanthropy Advisor",
      description: "Grant analysis and giving optimization",
      endpoint: `${baseUrl}/api/agents/philanthropy`,
      method: "POST",
      auth: "staff",
    },
    {
      id: "relationships",
      label: "Relationship Intelligence",
      description: "Network graph and warm path finder",
      endpoint: `${baseUrl}/api/agents/relationships`,
      method: "POST",
      auth: "staff",
    },
    {
      id: "chief-of-staff",
      label: "Chief of Staff",
      description: "Task coordination and lifestyle management",
      endpoint: `${baseUrl}/api/agents/chief-of-staff`,
      method: "POST",
      auth: "staff",
    },
  ];

  return {
    tenant: familyName,
    platform: "inyo",
    knowledge: "tenant-scoped",
    facts,
    actions,
    guard: {
      mode: "authenticated",
      signInUrl: `${baseUrl}/sign-in`,
    },
  };
}

/**
 * Route an external action call to the corresponding Inyo agent endpoint.
 */
export async function routeLoraAction(
  actionId: string,
  payload: Record<string, unknown>,
  baseUrl: string,
): Promise<Response> {
  const actionMap: Record<string, string> = {
    "deal-flow": "/api/agents/deal-flow",
    "ic-memo": "/api/agents/ic-memo",
    "portfolio-monitor": "/api/agents/portfolio-monitor",
    "cfo": "/api/agents/cfo",
    "tax": "/api/agents/tax",
    "legal": "/api/agents/legal",
    "philanthropy": "/api/agents/philanthropy",
    "relationships": "/api/agents/relationships",
    "chief-of-staff": "/api/agents/chief-of-staff",
  };

  const path = actionMap[actionId];
  if (!path) throw new Error(`Unknown action: ${actionId}`);

  return fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
