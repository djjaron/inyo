/**
 * Kase (gpodz) LoRA Adapter
 *
 * Maps Inyo's family office data model to Kase's tenant schema.
 * Kase expects: context facts, named actions, and source connectors.
 *
 * When gpodz integration is ready, configure KASE_TENANT_ID and
 * KASE_API_KEY in Netlify environment variables.
 */

export interface KaseTenantContext {
  tenant: string;
  knowledge: "tenant-scoped";
  facts: KaseFact[];
  actions: KaseAction[];
  guard: KaseGuard;
}

export interface KaseFact {
  key: string;
  value: string | number | boolean | null;
  category: string;
}

export interface KaseAction {
  id: string;
  label: string;
  description: string;
  endpoint: string;
  method: "GET" | "POST";
  auth: "staff" | "public";
}

export interface KaseGuard {
  mode: "authenticated" | "public-preview";
  signInUrl: string;
}

/**
 * Build the Kase tenant context payload from Inyo's live data.
 * Call this when Kase requests a context refresh.
 */
export function buildKaseTenantContext(params: {
  familyName: string;
  totalAum?: number;
  activeDeals?: number;
  portfolioCompanies?: number;
  baseUrl: string;
}): KaseTenantContext {
  const { familyName, totalAum, activeDeals, portfolioCompanies, baseUrl } = params;

  const facts: KaseFact[] = [
    { key: "family_name", value: familyName, category: "identity" },
    { key: "platform", value: "Inyo Family Office OS", category: "identity" },
  ];

  if (totalAum != null) facts.push({ key: "total_aum", value: totalAum, category: "finance" });
  if (activeDeals != null) facts.push({ key: "active_deals", value: activeDeals, category: "deal_flow" });
  if (portfolioCompanies != null) facts.push({ key: "portfolio_companies", value: portfolioCompanies, category: "portfolio" });

  const actions: KaseAction[] = [
    {
      id: "deal-flow-analysis",
      label: "Analyze Deal",
      description: "Run the Deal Flow Analyst agent on an inbound opportunity",
      endpoint: `${baseUrl}/api/agents/deal-flow`,
      method: "POST",
      auth: "staff",
    },
    {
      id: "ic-memo",
      label: "Generate IC Memo",
      description: "Draft an Investment Committee memo for a deal",
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
      id: "cfo-analysis",
      label: "CFO Analysis",
      description: "Cash flow and liquidity analysis across entities",
      endpoint: `${baseUrl}/api/agents/cfo`,
      method: "POST",
      auth: "staff",
    },
    {
      id: "tax-intelligence",
      label: "Tax Intelligence",
      description: "K-1 analysis and tax position optimization",
      endpoint: `${baseUrl}/api/agents/tax`,
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
 * Forward a Kase action call to the corresponding Inyo agent endpoint.
 * Returns the raw agent response.
 */
export async function forwardKaseAction(
  actionId: string,
  payload: Record<string, unknown>,
  baseUrl: string,
): Promise<Response> {
  const actionMap: Record<string, string> = {
    "deal-flow-analysis": "/api/agents/deal-flow",
    "ic-memo": "/api/agents/ic-memo",
    "portfolio-monitor": "/api/agents/portfolio-monitor",
    "cfo-analysis": "/api/agents/cfo",
    "tax-intelligence": "/api/agents/tax",
    "philanthropy": "/api/agents/philanthropy",
    "relationships": "/api/agents/relationships",
    "chief-of-staff": "/api/agents/chief-of-staff",
  };

  const path = actionMap[actionId];
  if (!path) throw new Error(`Unknown Kase action: ${actionId}`);

  return fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
