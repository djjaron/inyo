import { NextRequest, NextResponse } from "next/server";
import { runAgent } from "@/lib/agents/runtime";
import { prisma } from "@/lib/prisma";

const MOCK_IC_MEMO = {
  executiveSummary:
    "Meridian AI presents a compelling Series B opportunity in the enterprise compliance automation space. The company has demonstrated strong product-market fit with 3.2x ARR growth YoY, a defensible moat through proprietary compliance LLM fine-tuning, and a founder with a proven exit. We recommend pursuing with a $12M check at the proposed $85M pre-money valuation.",
  companyOverview:
    "Meridian AI (founded 2022, San Francisco) builds vertical LLM infrastructure for enterprise compliance teams. The platform automates regulatory monitoring, policy gap analysis, and audit preparation for Fortune 1000 clients in financial services, healthcare, and defense contracting.",
  marketOpportunity:
    "The global GRC (Governance, Risk & Compliance) software market is $50B+ and growing at 14% CAGR. Regulatory complexity is accelerating — the SEC alone issued 42 major rules in 2024. AI-native platforms are displacing legacy vendors (MetricStream, RSA Archer) rapidly.",
  businessModel:
    "SaaS subscription: $180K–$450K ACV for enterprise, $24K–$60K for mid-market. Land-and-expand with module add-ons (Policy Generator, Audit Copilot, RegChange Monitor). Net Revenue Retention: 138%. Gross Margin: 74%.",
  financials:
    "ARR: $8.4M (grew from $2.6M in 2023). Burn: $420K/month. Runway: 22 months post-raise. CAC: $32K enterprise, $8K mid-market. LTV/CAC: 18x enterprise. Rule of 40 score: 68.",
  team:
    "Sarah Chen (CEO): ex-Palantir (5yr, led FedRAMP compliance product), Stanford CS, prior founder exit to Salesforce ($180M, 2019). Marcus Webb (CTO): ex-Two Sigma quant, MIT EECS, built LLM fine-tuning infrastructure at scale. VP Sales: ex-Workiva, closed $2M ARR in 6 months.",
  risks: [
    {
      category: "Concentration",
      description: "Top 3 customers represent 67% of ARR. Loss of any single customer materially impacts revenue.",
      severity: "high",
    },
    {
      category: "Competition",
      description: "Well-funded incumbents (Workiva $1.5B market cap) and new AI entrants (Harvey AI $100M raised) could compress pricing.",
      severity: "medium",
    },
    {
      category: "GTM",
      description: "Enterprise compliance sales cycles are 6–12 months with complex procurement. Scaling GTM requires significant investment.",
      severity: "medium",
    },
    {
      category: "Regulatory",
      description: "AI regulation (EU AI Act, proposed SEC AI rules) could impose compliance overhead on the product itself.",
      severity: "low",
    },
  ],
  opportunities: [
    "Defense/FedRAMP market expansion — Sarah Chen has direct relationships and product is 80% ready for FedRAMP Moderate authorization",
    "Platform expansion into adjacent compliance verticals (ESG, privacy, SOX) with minimal incremental R&D",
    "Strategic synergy with existing portfolio company ClearReg — potential data partnership or co-sell agreement",
    "International expansion into EU DORA and UK FCA compliance markets in 2026",
  ],
  swot: {
    strengths: [
      "Deep founder domain expertise and prior exit",
      "Strong NRR (138%) indicating genuine product value",
      "Proprietary compliance LLM fine-tuned on 50K+ regulatory documents",
      "Existing relationships in financial services and defense",
    ],
    weaknesses: [
      "Customer concentration risk",
      "Limited brand recognition vs. established incumbents",
      "Sales team is early-stage, unproven at scale",
    ],
    opportunities: [
      "Accelerating regulatory complexity globally",
      "Large incumbent displacement with AI-native product",
      "Portfolio synergies with ClearReg",
    ],
    threats: [
      "Well-capitalized competitors entering the space",
      "Potential AI regulation creating headwinds",
      "Macro slowdown reducing enterprise IT budgets",
    ],
  },
  recommendation:
    "Pursue. We recommend leading the $12M Series B at $85M pre-money with a standard pro-rata provision. Meridian AI offers a compelling combination of strong traction, a differentiated technical moat, and a founder with a proven playbook. Key conditions: (1) confirm customer NDA releases for reference calls, (2) secure board seat, (3) negotiate anti-dilution provisions given customer concentration risk.",
  nextSteps: [
    "Schedule 90-minute technical diligence call with CTO Marcus Webb",
    "Reference calls with top 3 customers (pending NDA release)",
    "Legal review of existing customer contracts for concentration and churn risk",
    "Request cap table and waterfall analysis",
    "Explore ClearReg synergy call with both management teams",
    "Term sheet to be issued by EOW pending reference calls",
  ],
};

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { familyId, dealId, context, documentContents } = body as {
    familyId?: string;
    dealId?: string;
    context?: Record<string, unknown>;
    documentContents?: Array<{ name: string; content: string }>;
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
      agentType: "ic-memo",
      dealId: dealId ?? null,
      input: { familyId, dealId, context },
      output: MOCK_IC_MEMO,
      model: "mock",
      tokensUsed: 0,
      status: "completed",
      createdAt: new Date(),
      _mock: true,
    };
    return NextResponse.json({ analysis: mockAnalysis, result: MOCK_IC_MEMO });
  }

  const documents =
    documentContents && documentContents.length > 0
      ? documentContents
      : undefined;

  let agentOutput;
  try {
    agentOutput = await runAgent({
      agentType: "ic-memo",
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

  return NextResponse.json({
    analysis: savedAnalysis ?? {
      agentType: "ic-memo",
      dealId: dealId ?? null,
      output: agentOutput.result,
      model: agentOutput.model,
      tokensUsed: agentOutput.tokensUsed,
      status: "completed",
      createdAt: new Date(),
    },
    result: agentOutput.result,
  });
}
