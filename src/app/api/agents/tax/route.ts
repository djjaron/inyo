import { NextRequest, NextResponse } from "next/server";
import { runAgent } from "@/lib/agents/runtime";

const MOCK_TAX_OUTPUT = {
  taxYear: 2025,
  summary:
    "Based on received K-1s and estimated income, projected federal tax liability for 2025 is $2.1M–$2.4M. Three K-1s received; Arcadia Energy Fund II K-1 still pending. Recommend accelerating charitable contributions before year-end to reduce AGI.",
  estimatedLiability: {
    federal: 2250000,
    state: 480000,
    total: 2730000,
  },
  k1Summary: [
    { entity: "Hartwell Cayman LP", income: 2840000, deductions: 0, status: "received" },
    { entity: "Meridian AI SPV", income: -120000, deductions: 0, status: "received" },
    { entity: "Terrace REIT", income: 380000, deductions: 45000, status: "received" },
  ],
  actionItems: [
    "Accelerate $500K charitable contribution before Dec 31 to reduce AGI by ~2%",
    "Chase Arcadia Energy K-1 — 30-day late, contact GP for ETA",
    "Q2 estimated payment of $485K due June 16 — fund from Cayman LP",
    "Review FBAR requirement: Cayman LP holds >$10K in foreign accounts",
  ],
  deductionOpportunities: [
    "Qualified Opportunity Zone investment could defer ~$340K of capital gains",
    "529 contribution for education planning — $36K annual gift tax exclusion available",
    "Cost segregation study on Hampton Estate could generate $180K in accelerated depreciation",
  ],
};

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { familyId, query, documentContent, context } = body as {
    familyId?: string;
    query?: string;
    documentContent?: string;
    context?: Record<string, unknown>;
    [key: string]: unknown;
  };

  if (!familyId) {
    return NextResponse.json(
      { error: "familyId is required" },
      { status: 400 }
    );
  }

  if (!query && !documentContent) {
    return NextResponse.json(
      { error: "query or documentContent is required" },
      { status: 400 }
    );
  }

  // Return mock if no API key is configured
  if (!process.env.ANTHROPIC_API_KEY) {
    const mockAnalysis = {
      id: `analysis_mock_${Date.now()}`,
      agentType: "tax",
      input: { familyId, query, documentContent, context },
      output: MOCK_TAX_OUTPUT,
      model: "mock",
      tokensUsed: 0,
      status: "completed",
      createdAt: new Date(),
      _mock: true,
    };
    return NextResponse.json({ analysis: mockAnalysis, result: MOCK_TAX_OUTPUT });
  }

  const documents = documentContent
    ? [{ name: "Tax Document", content: documentContent }]
    : undefined;

  let agentOutput;
  try {
    agentOutput = await runAgent({
      agentType: "tax",
      familyId: familyId as string,
      context: {
        query: query ?? "",
        ...((context as Record<string, unknown>) ?? {}),
      },
      documents,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Agent execution failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({
    analysis: {
      agentType: "tax",
      input: { familyId, query, documentContent, context },
      output: agentOutput.result,
      model: agentOutput.model,
      tokensUsed: agentOutput.tokensUsed,
      status: "completed",
      createdAt: new Date(),
    },
    result: agentOutput.result,
  });
}
