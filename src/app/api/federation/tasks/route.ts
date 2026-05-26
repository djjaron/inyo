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

  // Unwrap A2A envelope: Dividen sends { id, input: { agentType, ... } }
  const payload: Record<string, unknown> =
    raw.input && typeof raw.input === "object" && !Array.isArray(raw.input)
      ? (raw.input as Record<string, unknown>)
      : raw;

  const taskId = (raw.id ?? raw.taskId ?? randomUUID()) as string;
  const agentTypeValue = (payload.agentType ?? payload.agent_type ?? "") as string;
  const familyId = (payload.familyId ?? payload.family_id ?? "dividen-external") as string;

  // Build context: use explicit context sub-object, or flatten remaining fields
  let context: Record<string, unknown>;
  if (payload.context && typeof payload.context === "object" && !Array.isArray(payload.context)) {
    context = payload.context as Record<string, unknown>;
  } else {
    const skip = new Set(["agentType", "agent_type", "familyId", "family_id", "documents", "taskId", "id"]);
    context = {};
    for (const [k, v] of Object.entries(payload)) {
      if (!skip.has(k)) context[k] = v;
    }
  }

  const documents = payload.documents as { name: string; content: string }[] | undefined;

  if (!agentTypeValue) {
    return NextResponse.json(
      { error: "agentType is required" },
      { status: 400, headers: CORS },
    );
  }

  try {
    const output = await runAgent({
      agentType: agentTypeValue as AgentType,
      familyId,
      context,
      documents,
      // Use Haiku for federation calls — Sonnet/Opus times out on Dividen's gateway
      modelOverride: "claude-haiku-4-5-20251001",
      maxTokensOverride: 1200,
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
