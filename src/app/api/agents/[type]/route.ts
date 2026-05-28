import { NextRequest, NextResponse } from "next/server";
import { runAgent } from "@/lib/agents/runtime";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const VALID_TYPES = new Set([
  "deal-flow","ic-memo","portfolio-monitor","cfo","legal","tax",
  "chief-of-staff","concierge","philanthropy","relationships",
  "deal-enrichment","term-sheet","diligence",
]);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const { type } = await params;

  if (!VALID_TYPES.has(type)) {
    return NextResponse.json({ error: "Unknown agent type" }, { status: 400 });
  }

  const body = await req.json();
  const { familyId, context, documents, triggerType } = body as {
    familyId: string;
    context: Record<string, unknown>;
    documents?: { name: string; content: string }[];
    triggerType?: string;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const output = await runAgent({ agentType: type as any, familyId, context, documents, triggerType: triggerType as any });

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
