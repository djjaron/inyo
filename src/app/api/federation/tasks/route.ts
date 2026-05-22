import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { runAgent } from "@/lib/agents/runtime";
import type { AgentType } from "@/types";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Dividen-Key",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(req: NextRequest) {
  // Auth: accept either Bearer token or X-Dividen-Key header
  const secret = process.env.DIVIDEN_WEBHOOK_SECRET;
  if (secret) {
    const bearer = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "").trim();
    const diviKey = req.headers.get("X-Dividen-Key");
    if (bearer !== secret && diviKey !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: CORS });
    }
  }

  let raw: Record<string, unknown>;
  try {
    raw = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: CORS });
  }

  // Unwrap A2A envelope: Dividen may send { id, input: { agentType, ... } }
  const payload =
    raw.input && typeof raw.input === "object" && !Array.isArray(raw.input)
      ? (raw.input as Record<string, unknown>)
      : raw;

  const taskId = ((raw.id ?? raw.taskId) as string | undefined) ?? randomUUID();
  const agentType = (payload.agentType ?? payload.agent_type) as string | undefined;
  const familyId = ((payload.familyId ?? payload.family_id) as string | undefined) ?? "dividen-external";

  // If caller put everything flat (no context sub-object), strip protocol fields and use remainder
  const context =
    payload.context && typeof payload.context === "object"
      ? (payload.context as Record<string, unknown>)
      : (({ agentType: _a, agent_type: _b, familyId: _c, family_id: _d, documents: _e, taskId: _f, id: _g, ...rest }) => rest)(payload);

  const documents = payload.documents as { name: string; content: string }[] | undefined;

  if (!agentType) {
    return NextResponse.json(
      { error: "agentType is required. Set it in the request body (or input.agentType for A2A envelope format)." },
      { status: 400, headers: CORS },
    );
  }

  try {
    const output = await runAgent({
      agentType: agentType as AgentType,
      familyId,
      context,
      documents,
    });

    return NextResponse.json(
      { taskId, status: "completed", result: output.result, tokensUsed: output.tokensUsed, model: output.model },
      { headers: CORS },
    );
  } catch (err) {
    return NextResponse.json(
      { taskId, status: "failed", error: String(err) },
      { status: 500, headers: CORS },
    );
  }
}
