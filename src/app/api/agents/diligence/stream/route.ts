import { NextRequest } from "next/server";
import { streamAgent } from "@/lib/agents/runtime";

export const maxDuration = 300;

const MOCK_DILIGENCE = {
  items: [
    {
      id: "item-1",
      answer: "Revenue growth of 3.2x YoY confirmed. ARR of $4.2M with strong NRR of 118%.",
      status: "complete",
    },
    {
      id: "item-2",
      answer: "Top 3 customers = 67% ARR — concentration risk flagged.",
      status: "flagged",
      flag: "Customer concentration exceeds 50% threshold",
    },
  ],
  summary:
    "Meridian AI shows strong fundamentals with proven ARR growth and solid retention metrics. Customer concentration and competitive landscape warrant further investigation.",
  redFlags: ["Top 3 customers represent 67% of ARR"],
  passItems: ["3.2x YoY revenue growth", "118% NRR", "Prior successful exits from founding team"],
};

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { familyId, context, items } = body as {
    familyId?: string;
    context?: Record<string, unknown>;
    items?: unknown[];
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

  const company = (context as Record<string, unknown>)?.company as string ?? "this deal";

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      send(controller, { type: "progress", message: `Analyzing diligence checklist for ${company}…` });

      if (!process.env.ANTHROPIC_API_KEY) {
        await new Promise((r) => setTimeout(r, 500));
        send(controller, { type: "done", result: MOCK_DILIGENCE });
        await new Promise((r) => setTimeout(r, 150));
        controller.close();
        return;
      }

      const keepalive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        } catch {}
      }, 5_000);

      try {
        send(controller, { type: "progress", message: "Running AI diligence analysis…" });

        const agentOutput = await streamAgent(
          {
            agentType: "diligence",
            familyId: familyId as string,
            context: { ...context, items } as Record<string, unknown>,
          },
          () => {},
        );

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
