import { NextRequest, NextResponse } from "next/server";
import { runAgent } from "@/lib/agents/runtime";

const MOCK_CHIEF_OF_STAFF = {
  acknowledgment:
    "Understood. I'll coordinate the Aspen trip for 6 guests the weekend of June 14–16.",
  actionPlan: [
    "Confirm Aspen Chalet availability June 14–16 with property manager",
    "Arrange private charter from Teterboro — recommend NetJets Citation X, 6-seat config",
    "Coordinate ground transportation: 2× SUVs from airport to chalet",
    "Catering: pre-stock with dietary preferences on file; suggest Nobu Aspen for Saturday dinner reservation",
    "Notify security team: 3-day stay, 6 guests, 2 staff",
  ],
  timeline:
    "Confirmation expected within 2 hours. Charter booking requires 24h notice minimum.",
  estimatedCost:
    "$18,000–$24,000 (charter $14K + ground $1.5K + catering $2.5K–$8.5K)",
  requiresApproval: false,
  followUpNeeded: [
    "Guest dietary preferences confirmation",
    "Return flight time preference",
  ],
};

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { familyId, request, type, context } = body as {
    familyId?: string;
    request?: string;
    type?: string;
    context?: Record<string, unknown>;
    [key: string]: unknown;
  };

  if (!familyId || !request) {
    return NextResponse.json(
      { error: "familyId and request are required" },
      { status: 400 }
    );
  }

  // Return mock if no API key is configured
  if (!process.env.ANTHROPIC_API_KEY) {
    const mockAnalysis = {
      id: `analysis_mock_${Date.now()}`,
      agentType: "chief-of-staff",
      input: { familyId, request, type, context },
      output: MOCK_CHIEF_OF_STAFF,
      model: "mock",
      tokensUsed: 0,
      status: "completed",
      createdAt: new Date(),
      _mock: true,
    };
    return NextResponse.json({
      analysis: mockAnalysis,
      result: MOCK_CHIEF_OF_STAFF,
    });
  }

  let agentOutput;
  try {
    agentOutput = await runAgent({
      agentType: "chief-of-staff",
      familyId: familyId as string,
      context: {
        request,
        type: type ?? null,
        ...(context ?? {}),
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Agent execution failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({
    analysis: {
      agentType: "chief-of-staff",
      output: agentOutput.result,
      model: agentOutput.model,
      tokensUsed: agentOutput.tokensUsed,
      status: "completed",
      createdAt: new Date(),
    },
    result: agentOutput.result,
  });
}
