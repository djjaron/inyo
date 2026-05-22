import { NextRequest, NextResponse } from "next/server";
import { runAgent } from "@/lib/agents/runtime";
import { prisma } from "@/lib/prisma";

const MOCK_CFO_OUTPUT = {
  summary:
    "Current net liquidity across all entities stands at $43.2M, down 8% from last quarter primarily due to the Phalanx Series C capital call ($2M) and Q1 tax payment ($285K). Cash position remains healthy with 22+ months of operating runway.",
  liquidityStatus: "healthy",
  insights: [
    "Hartwell Cayman LP holds 51% of total liquidity — concentration risk if capital calls accelerate",
    "Q2 payables of $127.7K are manageable; largest item is E&Y tax prep ($85K due June 1)",
    "Terrace REIT dividend ($340K) partially offsets the capital call outflow this quarter",
  ],
  recommendations: [
    "Consider sweeping excess HW Operating Co cash ($3.95M) to higher-yield vehicle",
    "Schedule AP review before June 1 to prioritize E&Y payment",
    "Review Cayman LP concentration — consider rebalancing liquidity across entities",
  ],
  alerts: [],
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
    const mockAnalysis = {
      id: `analysis_mock_${Date.now()}`,
      agentType: "cfo",
      input: { familyId, query, context },
      output: MOCK_CFO_OUTPUT,
      model: "mock",
      tokensUsed: 0,
      status: "completed",
      createdAt: new Date(),
      _mock: true,
    };
    return NextResponse.json({ analysis: mockAnalysis, result: MOCK_CFO_OUTPUT });
  }

  // Fetch real financial data; fall back to empty context on DB error
  let financialContext: Array<{
    id: string;
    name: string;
    type: string;
    jurisdiction: string | null;
    totalInflows: number;
    totalOutflows: number;
    net: number;
    recentTransactions: Array<{
      type: string;
      category: string | null;
      amount: number;
      description: string | null;
      date: string;
    }>;
  }> = [];
  let totalNet = 0;

  try {
    const entities = await prisma.entity.findMany({
      where: { familyId: familyId as string },
      include: {
        cashFlows: {
          orderBy: { occurredAt: "desc" },
          take: 50,
        },
      },
    });

    financialContext = entities.map((entity) => {
      const inflows = entity.cashFlows
        .filter((cf) => cf.type === "income" || cf.type === "distribution")
        .reduce((sum, cf) => sum + Number(cf.amount), 0);
      const outflows = entity.cashFlows
        .filter((cf) => cf.type !== "income" && cf.type !== "distribution")
        .reduce((sum, cf) => sum + Number(cf.amount), 0);
      return {
        id: entity.id,
        name: entity.name,
        type: entity.type,
        jurisdiction: entity.jurisdiction,
        totalInflows: inflows,
        totalOutflows: outflows,
        net: inflows - outflows,
        recentTransactions: entity.cashFlows.slice(0, 10).map((cf) => ({
          type: cf.type,
          category: cf.category,
          amount: Number(cf.amount),
          description: cf.description,
          date: cf.occurredAt.toISOString().split("T")[0],
        })),
      };
    });

    totalNet = financialContext.reduce((sum, e) => sum + e.net, 0);
  } catch {
    // Proceed with empty financial context
  }

  let agentOutput;
  try {
    agentOutput = await runAgent({
      agentType: "cfo",
      familyId: familyId as string,
      context: { query, familyId, entities: financialContext, totalNet },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Agent execution failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({
    analysis: {
      agentType: "cfo",
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
