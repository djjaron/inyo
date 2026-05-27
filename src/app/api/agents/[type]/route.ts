import { NextRequest, NextResponse } from "next/server";
import { runAgent } from "@/lib/agents/runtime";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const VALID_TYPES = new Set([
  "deal-flow","ic-memo","portfolio-monitor","cfo","legal","tax",
  "chief-of-staff","concierge","philanthropy","relationships",
  "deal-enrichment","term-sheet","diligence",
  "unit-economics","saas-model","cap-table","term-loan",
  "sales-forecast","sales-quota","cash-management","venture-stagger",
  "option-grants","startup-kit",
]);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const { type } = await params;

  if (!VALID_TYPES.has(type)) {
    return NextResponse.json({ error: "Unknown agent type" }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({
      result: {
        message: "Demo mode. Add ANTHROPIC_API_KEY to enable real analysis.",
        agentType: type,
      },
      model: "mock",
      tokensUsed: 0,
    });
  }

  const body = await req.json();
  const { familyId, context, documents } = body as {
    familyId: string;
    context: Record<string, unknown>;
    documents?: { name: string; content: string }[];
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const output = await runAgent({ agentType: type as any, familyId, context, documents });

  // Best-effort DB save
  try {
    await prisma.aIAnalysis.create({
      data: {
        agentType: type,
        input: context as Prisma.InputJsonValue,
        output: output.result as Prisma.InputJsonValue,
        model: output.model,
        tokensUsed: output.tokensUsed ?? 0,
      },
    });
  } catch {
    // DB unavailable — continue
  }

  return NextResponse.json({
    result: output.result,
    tokensUsed: output.tokensUsed,
    model: output.model,
  });
}
