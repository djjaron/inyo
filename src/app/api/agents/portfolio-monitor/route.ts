import { NextRequest, NextResponse } from "next/server";
import { runAgent } from "@/lib/agents/runtime";
import { prisma } from "@/lib/prisma";

const MOCK_PORTFOLIO_MONITOR = {
  healthScore: 74,
  recommendation: "monitor",
  summary:
    "Portfolio company is performing within expected range. Revenue growth on track at 2.1x YoY. One material risk: customer concentration remains high at 58% from top 2 accounts.",
  keyMetrics: {
    arr: 12_400_000,
    arrGrowth: "2.1x YoY",
    grossMargin: "71%",
    burnRate: 420_000,
    runway: "18 months",
    nrr: "124%",
  },
  risks: [
    "Customer concentration: top 2 accounts = 58% ARR",
    "Competing product launch from Workiva announced last quarter",
  ],
  opportunities: [
    "FedRAMP authorization in progress — opens $40B government market",
    "EU expansion pipeline with 3 LOIs signed",
  ],
  alerts: [],
  nextCheckIn: "Q2 2026 board meeting",
};

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { familyId, companyId, context, documentContent } = body as {
    familyId?: string;
    companyId?: string;
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
    const mockAnalysis = {
      id: `analysis_mock_${Date.now()}`,
      agentType: "portfolio-monitor",
      companyId: companyId ?? null,
      input: { familyId, companyId, context },
      output: MOCK_PORTFOLIO_MONITOR,
      model: "mock",
      tokensUsed: 0,
      status: "completed",
      createdAt: new Date(),
      _mock: true,
    };
    return NextResponse.json({ analysis: mockAnalysis, result: MOCK_PORTFOLIO_MONITOR });
  }

  const documents = documentContent
    ? [{ name: "Portfolio Document", content: documentContent as string }]
    : undefined;

  let agentOutput;
  try {
    agentOutput = await runAgent({
      agentType: "portfolio-monitor",
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
        agentType: "portfolio-monitor",
        companyId: companyId ?? null,
        input: { familyId, companyId, context } as object,
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
      agentType: "portfolio-monitor",
      companyId: companyId ?? null,
      output: agentOutput.result,
      model: agentOutput.model,
      tokensUsed: agentOutput.tokensUsed,
      status: "completed",
      createdAt: new Date(),
    },
    result: agentOutput.result,
  });
}
