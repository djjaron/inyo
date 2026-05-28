import { NextRequest, NextResponse } from "next/server";
import { runAgent } from "@/lib/agents/runtime";

const MOCK_PHILANTHROPY = {
  summary:
    "The Hartwell Foundation has committed $1M in active grants across education, environment, and social justice. Impact is strong: MIT Media Lab AI literacy program has reached 4,200 students. Stanford GSB pledge is 25% fulfilled with $500K remaining over 2 years.",
  impactHighlights: [
    "4,200 students reached through MIT AI literacy program",
    "18,000 acres of Amazon watershed protected via Nature Conservancy grant",
    "850 youth employment placements from Robin Hood Foundation partnership",
  ],
  recommendations: [
    "Consider $50K additional grant to Nature Conservancy — Amazon deforestation up 12% this year, leverage moment is high",
    "Stanford GSB pledge acceleration: tax benefit of front-loading remaining $1.5M in 2026 is ~$480K",
    "DAF opportunity: contribute appreciated Meridian AI stock pre-IPO for maximum charitable deduction",
  ],
  upcomingObligations: [
    { org: "Stanford GSB", amount: 500000, due: "2026-12-31", note: "Annual installment" },
    { org: "New York Public Library", amount: 100000, due: "2026-06-30", note: "Semi-annual payment" },
  ],
  grantingCapacity:
    "Foundation corpus is on track. Current year charitable deduction limit: $1.8M (60% AGI).",
};

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { familyId, query, context } = body as {
    familyId?: string;
    query?: string;
    context?: Record<string, unknown>;
    [key: string]: unknown;
  };

  if (!familyId || !query) {
    return NextResponse.json(
      { error: "familyId and query are required" },
      { status: 400 }
    );
  }

  // Return mock if no API key is configured
  if (!process.env.ANTHROPIC_API_KEY) {
    // Fire-and-forget runAgent() so AgentRun gets persisted
    runAgent({ agentType: "philanthropy" as any, familyId: familyId ?? "", context: { query }, triggerType: "manual" }).catch(() => {});
    const mockAnalysis = {
      id: `analysis_mock_${Date.now()}`,
      agentType: "philanthropy",
      input: { familyId, query, context },
      output: MOCK_PHILANTHROPY,
      model: "mock",
      tokensUsed: 0,
      status: "completed",
      createdAt: new Date(),
      _mock: true,
    };
    return NextResponse.json({ analysis: mockAnalysis, result: MOCK_PHILANTHROPY });
  }

  let agentOutput;
  try {
    agentOutput = await runAgent({
      agentType: "philanthropy",
      familyId: familyId as string,
      context: { query, ...(context ?? {}) },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Agent execution failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({
    analysis: {
      agentType: "philanthropy",
      input: { familyId, query, context },
      output: agentOutput.result,
      model: agentOutput.model,
      tokensUsed: agentOutput.tokensUsed,
      status: "completed",
      createdAt: new Date(),
    },
    result: agentOutput.result,
  });
}
