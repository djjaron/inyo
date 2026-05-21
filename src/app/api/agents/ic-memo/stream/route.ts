import { NextRequest } from "next/server";
import { streamAgent } from "@/lib/agents/runtime";
import { prisma } from "@/lib/prisma";

export const maxDuration = 300;

const MOCK_IC_MEMO = {
  executiveSummary:
    "Meridian AI presents a compelling Series B opportunity in the enterprise compliance automation space. The company has demonstrated strong product-market fit with 3.2x ARR growth YoY, a defensible moat through proprietary compliance LLM fine-tuning, and a founder with a proven exit. We recommend pursuing with a $12M check at the proposed $85M pre-money valuation.",
  companyOverview:
    "Meridian AI (founded 2022, San Francisco) builds vertical LLM infrastructure for enterprise compliance teams. The platform automates regulatory monitoring, policy gap analysis, and audit preparation for Fortune 1000 clients in financial services, healthcare, and defense contracting.",
  marketOpportunity:
    "The global GRC software market is $50B+ and growing at 14% CAGR. Regulatory complexity is accelerating. AI-native platforms are displacing legacy vendors rapidly.",
  businessModel:
    "SaaS subscription: $180K–$450K ACV for enterprise. Net Revenue Retention: 138%. Gross Margin: 74%.",
  financials:
    "ARR: $8.4M (grew from $2.6M in 2023). Burn: $420K/month. Runway: 22 months post-raise.",
  team:
    "Sarah Chen (CEO): ex-Palantir, Stanford CS, prior founder exit to Salesforce ($180M). Marcus Webb (CTO): ex-Two Sigma quant, MIT EECS.",
  risks: [
    { category: "Concentration", description: "Top 3 customers represent 67% of ARR.", severity: "high" },
    { category: "Competition", description: "Well-funded incumbents and new AI entrants could compress pricing.", severity: "medium" },
    { category: "GTM", description: "Enterprise compliance sales cycles are 6–12 months.", severity: "medium" },
  ],
  opportunities: [
    "Defense/FedRAMP market expansion",
    "Platform expansion into adjacent compliance verticals",
    "Strategic synergy with existing portfolio company ClearReg",
  ],
  swot: {
    strengths: ["Deep founder domain expertise", "Strong NRR (138%)", "Proprietary compliance LLM"],
    weaknesses: ["Customer concentration risk", "Limited brand recognition"],
    opportunities: ["Accelerating regulatory complexity", "Large incumbent displacement"],
    threats: ["Well-capitalized competitors", "Potential AI regulation"],
  },
  recommendation:
    "Pursue. We recommend leading the $12M Series B at $85M pre-money with a standard pro-rata provision.",
  nextSteps: [
    "Schedule technical diligence call with CTO Marcus Webb",
    "Reference calls with top 3 customers",
    "Legal review of existing customer contracts",
    "Request cap table and waterfall analysis",
  ],
};

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { familyId, dealId, context, documentContents } = body as {
    familyId?: string;
    dealId?: string;
    context?: Record<string, unknown>;
    documentContents?: Array<{ name: string; content: string }>;
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
      send(controller, {
        type: "ack",
        message: `Drafting IC memo for ${company}${sector ? ` — ${sector}` : ""}…`,
      });

      if (!process.env.ANTHROPIC_API_KEY) {
        await new Promise((r) => setTimeout(r, 600));
        send(controller, { type: "done", result: MOCK_IC_MEMO, _mock: true });
        controller.close();
        return;
      }

      const keepalive = setInterval(() => {
        try { controller.enqueue(encoder.encode(": keepalive\n\n")); } catch {}
      }, 5_000);

      try {
        const documents =
          documentContents && documentContents.length > 0
            ? documentContents
            : undefined;

        const agentOutput = await streamAgent(
          { agentType: "ic-memo", familyId: familyId as string, context: context as Record<string, unknown>, documents },
          () => {},
        );

        try {
          await prisma.aIAnalysis.create({
            data: {
              agentType: "ic-memo",
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
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
