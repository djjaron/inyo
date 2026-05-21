import { NextRequest } from "next/server";
import { streamAgent } from "@/lib/agents/runtime";
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
    return new Response("Invalid JSON", { status: 400 });
  }

  const { familyId, dealId, context, documentContent } = body as {
    familyId?: string;
    dealId?: string;
    context?: Record<string, unknown>;
    documentContent?: string;
    [key: string]: unknown;
  };

  if (!familyId || !context) {
    return new Response("familyId and context are required", { status: 400 });
  }

  const encoder = new TextEncoder();
  const send = (
    controller: ReadableStreamDefaultController<Uint8Array>,
    obj: unknown,
  ) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));

  const company = (context as Record<string, unknown>)?.company as string ?? "this opportunity";
  const sector = (context as Record<string, unknown>)?.sector as string ?? "";

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      // Instant acknowledgment from request context — no API call needed
      send(controller, {
        type: "ack",
        message: `Reviewing ${company}${sector ? ` — ${sector}` : ""}…`,
      });

      if (!process.env.ANTHROPIC_API_KEY) {
        await new Promise((r) => setTimeout(r, 600));
        send(controller, { type: "done", result: MOCK_DEAL_SCORE, _mock: true });
        controller.close();
        return;
      }

      try {
        const documents = documentContent
          ? [{ name: "Deal Document", content: documentContent as string }]
          : undefined;

        const agentOutput = await streamAgent(
          { agentType: "deal-flow", familyId: familyId as string, context: context as Record<string, unknown>, documents },
          () => {},
        );

        try {
          await prisma.aIAnalysis.create({
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

        send(controller, { type: "done", result: agentOutput.result });
        controller.close();
      } catch (err) {
        send(controller, { type: "error", message: String(err) });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
