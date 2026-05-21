import { NextRequest, NextResponse } from "next/server";
import { runAgent } from "@/lib/agents/runtime";

const MOCK_RELATIONSHIPS_RESULT = {
  answer:
    "You have 3 strong connections at Andreessen Horowitz: David Kwon (Managing Partner, 7 mutual connections), Jennifer Park (Partner, introduced via LP meeting), and one warm path through William Hart III who co-invested with a16z on 2 deals.",
  contacts: ["David Kwon", "Jennifer Park", "William Hart III"],
  suggestedActions: [
    "Schedule coffee with David Kwon — last contact was 3 weeks ago",
    "Ask William Hart III for a formal intro to the a16z crypto team",
    "Follow up with Jennifer Park on the ClearReg co-investment",
  ],
};

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { familyId, query, contacts } = body as {
    familyId?: string;
    query?: string;
    contacts?: unknown[];
    [key: string]: unknown;
  };

  if (!familyId || !query) {
    return NextResponse.json(
      { error: "familyId and query are required" },
      { status: 400 }
    );
  }

  // Return mock if no API key is configured
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ result: MOCK_RELATIONSHIPS_RESULT, _mock: true });
  }

  let agentOutput;
  try {
    agentOutput = await runAgent({
      agentType: "relationships",
      familyId: familyId as string,
      context: { query, contacts },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Agent execution failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ result: agentOutput.result });
}
