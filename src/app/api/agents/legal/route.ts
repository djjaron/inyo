import { NextRequest, NextResponse } from "next/server";
import { runAgent } from "@/lib/agents/runtime";

const MOCK_LEGAL_REVIEW = {
  documentType: "SAFE Note",
  summary:
    "Standard Y Combinator SAFE with MFN clause and pro-rata rights. Two non-standard provisions flagged: overly broad IP assignment and unlimited liability clause in Section 7.",
  riskLevel: "medium",
  flags: [
    {
      clause: "Section 4.2 — IP Assignment",
      issue:
        "Assignment scope extends to work created outside employment that relates to company business. May capture founder's pre-existing IP.",
      severity: "high",
    },
    {
      clause: "Section 7.1 — Indemnification",
      issue:
        "Unlimited indemnification obligation with no cap. Standard practice caps at 2x investment amount.",
      severity: "medium",
    },
    {
      clause: "Section 2.4 — Non-Compete",
      issue:
        "24-month post-termination non-compete extends to affiliated entities with broad definition. May be unenforceable in CA but creates risk.",
      severity: "low",
    },
  ],
  keyTerms: {
    discount: "20%",
    valuationCap: "$50M",
    proRata: "Yes — standard pro-rata on next priced round",
    mfn: "Yes",
    boardSeat: "No",
  },
  recommendation:
    "Negotiate Section 4.2 IP scope and cap the Section 7.1 indemnification before signing. Non-compete is likely unenforceable in CA but should be narrowed regardless. Overall document is investable pending these changes.",
};

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { familyId, documentId, documentContent, documentName } = body as {
    familyId?: string;
    documentId?: string;
    documentContent?: string;
    documentName?: string;
    [key: string]: unknown;
  };

  if (!familyId) {
    return NextResponse.json(
      { error: "familyId is required" },
      { status: 400 }
    );
  }

  if (!documentContent) {
    return NextResponse.json(
      { error: "documentContent is required" },
      { status: 400 }
    );
  }

  // Return mock if no API key is configured
  if (!process.env.ANTHROPIC_API_KEY) {
    const mockAnalysis = {
      id: `analysis_mock_${Date.now()}`,
      agentType: "legal",
      documentId: documentId ?? null,
      input: { familyId, documentId, documentName },
      output: MOCK_LEGAL_REVIEW,
      model: "mock",
      tokensUsed: 0,
      status: "completed",
      createdAt: new Date(),
      _mock: true,
    };
    return NextResponse.json({ analysis: mockAnalysis, result: MOCK_LEGAL_REVIEW });
  }

  const documents = [
    { name: documentName ?? "Document", content: documentContent as string },
  ];

  let agentOutput;
  try {
    agentOutput = await runAgent({
      agentType: "legal",
      familyId: familyId as string,
      context: { documentId: documentId ?? null, documentName: documentName ?? null },
      documents,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Agent execution failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({
    analysis: {
      agentType: "legal",
      documentId: documentId ?? null,
      output: agentOutput.result,
      model: agentOutput.model,
      tokensUsed: agentOutput.tokensUsed,
      status: "completed",
      createdAt: new Date(),
    },
    result: agentOutput.result,
  });
}
