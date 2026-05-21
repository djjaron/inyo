import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const AGENT_TYPES = [
  "deal-flow",
  "ic-memo",
  "portfolio-monitor",
  "cfo",
  "legal",
  "tax",
  "chief-of-staff",
  "concierge",
  "philanthropy",
  "relationships",
] as const;

export async function GET() {
  const apiKeySet = !!process.env.ANTHROPIC_API_KEY;

  try {
    const results = await Promise.allSettled(
      AGENT_TYPES.map(async (type) => {
        const [latest, count] = await Promise.all([
          prisma.aIAnalysis.findFirst({
            where: { agentType: type },
            orderBy: { createdAt: "desc" },
          }),
          prisma.aIAnalysis.count({ where: { agentType: type } }),
        ]);
        return {
          type,
          lastRun: latest?.createdAt?.toISOString() ?? null,
          totalRuns: count,
        };
      })
    );

    const agents = results.map((r, i) => {
      if (r.status === "fulfilled") return r.value;
      return { type: AGENT_TYPES[i], lastRun: null, totalRuns: 0 };
    });

    return NextResponse.json({ apiKeySet, agents });
  } catch {
    // DB unavailable — return minimal response
    return NextResponse.json({
      apiKeySet,
      agents: AGENT_TYPES.map((type) => ({ type, lastRun: null, totalRuns: 0 })),
    });
  }
}
