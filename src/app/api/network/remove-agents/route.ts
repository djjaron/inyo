import { NextResponse } from "next/server";
import { deleteAgents } from "@/lib/federation/client";

const VENTURE_TOOL_IDS = [
  "unit-economics",
  "saas-model",
  "cap-table",
  "term-loan",
  "sales-forecast",
  "sales-quota",
  "cash-management",
  "venture-stagger",
  "option-grants",
  "startup-kit",
];

export async function POST() {
  const result = await deleteAgents(VENTURE_TOOL_IDS);
  return NextResponse.json(result, { status: result.success ? 200 : 502 });
}
