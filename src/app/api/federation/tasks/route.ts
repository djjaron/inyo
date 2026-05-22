import { NextRequest, NextResponse } from "next/server";
import { runAgent } from "@/lib/agents/runtime";
import type { AgentType } from "@/types";

export async function POST(req: NextRequest) {
  const secret = process.env.DIVIDEN_WEBHOOK_SECRET;
  if (secret) {
    const key = req.headers.get("X-Dividen-Key");
    if (key !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let body: {
    taskId?: string;
    agentType?: string;
    familyId?: string;
    context?: Record<string, unknown>;
    documents?: { name: string; content: string }[];
  };

  try {
    body = await req.json() as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { taskId, agentType, familyId, context = {}, documents } = body;

  if (!taskId || !agentType || !familyId) {
    return NextResponse.json({ error: "taskId, agentType, and familyId are required" }, { status: 400 });
  }

  try {
    const output = await runAgent({
      agentType: agentType as AgentType,
      familyId,
      context,
      documents,
    });

    return NextResponse.json({
      taskId,
      status: "completed",
      result: output.result,
      tokensUsed: output.tokensUsed,
      model: output.model,
    });
  } catch (err) {
    return NextResponse.json(
      { taskId, status: "failed", error: String(err) },
      { status: 500 }
    );
  }
}
