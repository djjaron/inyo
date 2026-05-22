// Sydecar API client
// API documentation: https://api-docs.sydecar.io/ (requires auth)
// Base URL may need adjustment — confirm with Sydecar if requests return 404

const SYDECAR_BASE_URL = process.env.SYDECAR_API_URL ?? "https://api.sydecar.io";
const SYDECAR_API_KEY = process.env.SYDECAR_API_KEY ?? "";

export interface SydecarSPV {
  id: string;
  name: string;
  status: string;
  type: string;
  dashboardUrl?: string;
  createdAt: string;
}

export interface SydecarPerson {
  id: string;
  name: string;
  email: string;
}

export interface SydecarProfile {
  id: string;
  personId: string;
  spvId: string;
  type: "INVESTOR" | "ORGANIZER";
  status: string;
}

async function sydecarFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!SYDECAR_API_KEY) throw new Error("SYDECAR_API_KEY is not configured");

  const res = await fetch(`${SYDECAR_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${SYDECAR_API_KEY}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Sydecar API error ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

// Create a new SPV — endpoint path may need adjustment per Sydecar docs
export async function createSydecarSPV(params: {
  name: string;
  type: "syndicate" | "secondary" | "layered";
  managementFee?: number;
  carry?: number;
  description?: string;
}): Promise<SydecarSPV> {
  return sydecarFetch<SydecarSPV>("/v1/spvs", {  // TODO: confirm endpoint path
    method: "POST",
    body: JSON.stringify({
      name: params.name,
      spv_type: params.type,
      management_fee_percentage: params.managementFee,
      carried_interest_percentage: params.carry,
      description: params.description,
    }),
  });
}

// Add an investor to an SPV
export async function addSydecarInvestor(
  spvId: string,
  params: {
    name: string;
    email: string;
    commitment: number;
  }
): Promise<{ person: SydecarPerson; profile: SydecarProfile }> {
  // Step 1: Create person
  const person = await sydecarFetch<SydecarPerson>("/v1/persons", {  // TODO: confirm path
    method: "POST",
    body: JSON.stringify({ name: params.name, email: params.email }),
  });

  // Step 2: Create investor profile on the SPV
  const profile = await sydecarFetch<SydecarProfile>(`/v1/spvs/${spvId}/profiles`, {  // TODO: confirm path
    method: "POST",
    body: JSON.stringify({
      person_id: person.id,
      type: "INVESTOR",
      commitment_amount: params.commitment,
    }),
  });

  return { person, profile };
}

// Get SPV details
export async function getSydecarSPV(sydecarId: string): Promise<SydecarSPV> {
  return sydecarFetch<SydecarSPV>(`/v1/spvs/${sydecarId}`);  // TODO: confirm path
}

// Check if Sydecar API is available (used for health check in UI)
export function isSydecarConfigured(): boolean {
  return !!SYDECAR_API_KEY;
}
