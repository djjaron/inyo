import { NextRequest, NextResponse } from "next/server";
import { runAgent } from "@/lib/agents/runtime";
import { prisma } from "@/lib/prisma";

const MOCK_DEAL_SCORE = {
  score: 81,
  sector: "Enterprise AI",
  stage: "Series B",
  capitalAsk: 12_000_000,
  valuation: 85_000_000,
  summary:
    "Meridian AI is building vertical LLM infrastructure for enterprise compliance teams. Strong ARR growth (3.2x YoY), founder has prior exit. Market timing is excellent with regulatory pressure increasing.",
  risks: [
    "Customer concentration (top 3 = 67% ARR)",
    "GTM complexity in regulated industries",
    "Competing against well-funded incumbents",
  ],
  opportunities: [
    "Defense market expansion",
    "Platform play across compliance verticals",
    "Potential strategic synergy with portfolio company ClearReg",
  ],
  founderBackground:
    "Sarah Chen (CEO): ex-Palantir, Stanford CS. Prior exit to Salesforce ($180M). Co-founder Marcus Webb: ex-Two Sigma, MIT.",
  comparables: ["Harvey AI", "Ironclad", "Compliance.ai"],
  recommendation: "pursue",
};

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { familyId, dealId, context, documentContent } = body as {
    familyId?: string;
    dealId?: string;
    context?: Record<string, unknown>;
    documentContent?: string;
    [key: string]: unknown;
  };

  if (!familyId || !context) {
    return NextResponse.json(
      { error: "familyId and context are required" },
      { status: 400 }
    );
  }

  // Return mock if no API key is configured
  if (!process.env.ANTHROPIC_API_KEY) {
    // Fire-and-forget so AgentRun gets persisted even in demo mode
    runAgent({ agentType: "deal-flow", familyId: familyId as string, context: context as Record<string, unknown>, triggerType: "manual" }).catch(() => {});
    const mockAnalysis = {
      id: `analysis_mock_${Date.now()}`,
      agentType: "deal-flow",
      dealId: dealId ?? null,
      input: { familyId, dealId, context },
      output: MOCK_DEAL_SCORE,
      model: "mock",
      tokensUsed: 0,
      status: "completed",
      createdAt: new Date(),
      _mock: true,
    };
    return NextResponse.json({ analysis: mockAnalysis, result: MOCK_DEAL_SCORE });
  }

  const documents = documentContent
    ? [{ name: "Deal Document", content: documentContent as string }]
    : undefined;

  let agentOutput;
  try {
    agentOutput = await runAgent({
      agentType: "deal-flow",
      familyId: familyId as string,
      context: context as Record<string, unknown>,
      documents,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Agent execution failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  // Persist to AIAnalysis (best-effort)
  let savedAnalysis: Record<string, unknown> | null = null;
  try {
    savedAnalysis = await prisma.aIAnalysis.create({
      data: {
        agentType: "deal-flow",
        dealId: dealId ?? null,
        input: { familyId, dealId, context } as object,
        output: agentOutput.result as object,
        model: agentOutput.model,
        tokensUsed: agentOutput.tokensUsed ?? null,
        status: "completed",
      },
    });
  } catch {
    // DB unavailable — proceed without persisting
  }

  return NextResponse.json({
    analysis: savedAnalysis ?? {
      agentType: "deal-flow",
      dealId: dealId ?? null,
      output: agentOutput.result,
      model: agentOutput.model,
      tokensUsed: agentOutput.tokensUsed,
      status: "completed",
      createdAt: new Date(),
    },
    result: agentOutput.result,
  });
}
