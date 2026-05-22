import { NextRequest } from "next/server";
import { streamAgent } from "@/lib/agents/runtime";
import { prisma } from "@/lib/prisma";

export const maxDuration = 300;

const MOCK_TERM_SHEET = {
  sheets: [
    {
      label: "Lead VC Term Sheet",
      valuation: "$85M pre-money",
      investmentAmount: "$12M",
      ownership: "12.4%",
      liquidationPref: "1x non-participating",
      antiDilution: "Broad-based weighted average",
      boardSeats: "1 investor seat",
      proRataRights: "Yes, investors >$2M",
      dragAlong: "Standard majority drag",
      informationRights: "Standard quarterly financials",
      closingConditions: ["Customary diligence", "Legal sign-off"],
      unusualTerms: [],
      summary:
        "Clean, founder-friendly term sheet. Standard Series B terms with no material red flags.",
    },
  ],
  comparison: {
    mostFavorable: "Lead VC Term Sheet",
    keyDifferences: [],
    redFlags: [],
    recommendation:
      "Proceed — terms are market-standard and favorable to the company.",
  },
};

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { familyId, dealId, sheets } = body as {
    familyId?: string;
    dealId?: string;
    sheets?: Array<{ label: string; content: string }>;
    [key: string]: unknown;
  };

  if (!familyId || !sheets?.length) {
    return new Response("familyId and sheets are required", { status: 400 });
  }

  const validSheets = sheets.filter((s) => s.content?.trim());
  if (!validSheets.length) {
    return new Response("At least one sheet must have content", { status: 400 });
  }

  const encoder = new TextEncoder();
  const send = (
    controller: ReadableStreamDefaultController<Uint8Array>,
    obj: unknown,
  ) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      send(controller, {
        type: "ack",
        message: `Comparing ${validSheets.length} term sheet${validSheets.length === 1 ? "" : "s"}…`,
      });

      if (!process.env.ANTHROPIC_API_KEY) {
        await new Promise((r) => setTimeout(r, 600));
        send(controller, { type: "done", result: MOCK_TERM_SHEET, _mock: true });
        controller.close();
        return;
      }

      const keepalive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        } catch {}
      }, 5_000);

      try {
        const documents = validSheets.map((s) => ({
          name: s.label,
          content: s.content,
        }));

        const context: Record<string, unknown> = {
          dealId: dealId ?? null,
          sheetCount: validSheets.length,
          labels: validSheets.map((s) => s.label),
        };

        const agentOutput = await streamAgent(
          {
            agentType: "term-sheet",
            familyId: familyId as string,
            context,
            documents,
          },
          () => {},
        );

        try {
          await prisma.aIAnalysis.create({
            data: {
              agentType: "term-sheet",
              dealId: dealId ?? null,
              input: { familyId, dealId, sheetCount: validSheets.length } as object,
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
        await new Promise((r) => setTimeout(r, 150));
        controller.close();
      } catch (err) {
        send(controller, { type: "error", message: String(err) });
        controller.close();
      } finally {
        clearInterval(keepalive);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
