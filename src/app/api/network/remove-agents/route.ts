import { NextResponse } from "next/server";
import { deleteAgents } from "@/lib/federation/client";

// Current canonical IDs (bare agent type, no prefix)
const CURRENT_IDS = [
  "deal-flow", "ic-memo", "portfolio-monitor", "cfo", "legal", "tax",
  "chief-of-staff", "concierge", "philanthropy", "relationships",
  "deal-enrichment", "term-sheet", "diligence",
];

// Legacy IDs from prior syncs that may have used an "inyo-" prefix
const LEGACY_IDS = CURRENT_IDS.map((id) => `inyo-${id}`);

// Old Venture Tool stubs that leaked into this instance
const VENTURE_TOOL_IDS = [
  "unit-economics", "saas-model", "cap-table", "term-loan",
  "sales-forecast", "sales-quota", "cash-management",
  "venture-stagger", "option-grants", "startup-kit",
];

export async function POST() {
  const result = await deleteAgents([...LEGACY_IDS, ...VENTURE_TOOL_IDS]);
  return NextResponse.json(result, { status: result.success ? 200 : 502 });
}
