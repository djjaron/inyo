import { NextRequest } from "next/server";
import { streamAgent } from "@/lib/agents/runtime";
import { fetchPageContent } from "@/lib/agents/web-fetch";
import { prisma } from "@/lib/prisma";

export const maxDuration = 300;

const MOCK_ENRICHMENT = {
  affinityScore: 74,
  riskScore: 38,
  fundabilityScore: 81,
  riskFactors: [
    {
      factor: "Customer concentration",
      severity: "high",
      description: "Top 3 customers = 67% ARR",
      source: "deal-data",
    },
    {
      factor: "Competitive landscape",
      severity: "medium",
      description: "Well-funded incumbents in the space",
      source: "crunchbase",
    },
  ],
  fundabilityFactors: [
    {
      factor: "Strong team",
      impact: "positive",
      description: "Founders have prior exits and domain expertise",
    },
    {
      factor: "Revenue growth",
      impact: "positive",
      description: "3.2x YoY ARR growth",
    },
  ],
  founderSignals: [
    {
      name: "Sarah Chen",
      signals: ["Ex-Palantir", "Stanford CS", "Prior Salesforce exit"],
    },
  ],
  webSignals: {
    websiteQuality: "Professional, well-designed",
    techStack: ["React", "Next.js"],
    teamPagePresence: true,
    pressOrMedia: ["TechCrunch", "Forbes"],
  },
  summary:
    "Meridian AI shows strong fundamentals with proven founder team and excellent growth trajectory. Customer concentration remains the primary risk factor.",
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: dealId } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { familyId, context } = body as {
    familyId?: string;
    context?: Record<string, unknown>;
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

  const company =
    (context as Record<string, unknown>)?.company as string ??
    "this opportunity";

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      send(controller, {
        type: "ack",
        message: `Enriching ${company}…`,
      });

      if (!process.env.ANTHROPIC_API_KEY) {
        await new Promise((r) => setTimeout(r, 600));

        // Persist mock scores so the demo UI sees enriched data
        try {
          await prisma.deal.update({
            where: { id: dealId },
            data: {
              affinityScore: MOCK_ENRICHMENT.affinityScore,
              riskScore: MOCK_ENRICHMENT.riskScore,
              fundabilityScore: MOCK_ENRICHMENT.fundabilityScore,
              enrichedAt: new Date(),
            },
          });
        } catch {
          // DB unavailable or schema not migrated — proceed without persisting
        }

        send(controller, { type: "done", result: MOCK_ENRICHMENT, _mock: true });
        controller.close();
        return;
      }

      const keepalive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        } catch {}
      }, 5_000);

      try {
        // Fetch the deal to get URL fields
        let website: string | null = null;
        let linkedinUrl: string | null = null;
        let crunchbaseUrl: string | null = null;

        try {
          const deal = await prisma.deal.findUnique({
            where: { id: dealId },
            select: {
              website: true,
              linkedinUrl: true,
              crunchbaseUrl: true,
            },
          });
          if (deal) {
            website = deal.website ?? null;
            linkedinUrl = deal.linkedinUrl ?? null;
            crunchbaseUrl = deal.crunchbaseUrl ?? null;
          }
        } catch {
          // Schema not yet migrated — proceed without URL fields
        }

        // Fetch URL content
        const urlSources: { label: string; url: string }[] = [];
        if (website) urlSources.push({ label: "Company Website", url: website });
        if (linkedinUrl) urlSources.push({ label: "LinkedIn", url: linkedinUrl });
        if (crunchbaseUrl) urlSources.push({ label: "Crunchbase", url: crunchbaseUrl });

        const documents: { name: string; content: string }[] = [];

        if (urlSources.length > 0) {
          send(controller, { type: "progress", message: "Fetching website…" });

          const fetchResults = await Promise.all(
            urlSources.map(async ({ label, url }) => {
              const result = await fetchPageContent(url);
              return { label, url, ...result };
            }),
          );

          for (const { label, content, success } of fetchResults) {
            if (success && content) {
              documents.push({ name: label, content });
            }
          }
        }

        const n = documents.length;
        send(controller, {
          type: "progress",
          message: n > 0
            ? `Analyzing ${n} source${n === 1 ? "" : "s"}…`
            : "Analyzing deal data…",
        });

        const agentOutput = await streamAgent(
          {
            agentType: "deal-enrichment",
            familyId: familyId as string,
            context: context as Record<string, unknown>,
            documents: documents.length > 0 ? documents : undefined,
          },
          () => {},
        );

        const result = agentOutput.result as {
          affinityScore?: number;
          riskScore?: number;
          fundabilityScore?: number;
          [key: string]: unknown;
        };

        // Persist scores back to deal
        try {
          await prisma.deal.update({
            where: { id: dealId },
            data: {
              affinityScore: typeof result.affinityScore === "number" ? result.affinityScore : null,
              riskScore: typeof result.riskScore === "number" ? result.riskScore : null,
              fundabilityScore: typeof result.fundabilityScore === "number" ? result.fundabilityScore : null,
              enrichedAt: new Date(),
            },
          });
        } catch {
          // DB unavailable or schema not migrated — proceed without persisting
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
