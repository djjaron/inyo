import { prisma } from "@/lib/prisma";

export interface ParsedAction {
  type: string;
  payload: Record<string, unknown>;
  raw: string;
}

export function parseActionTags(text: string): ParsedAction[] {
  if (!text) return [];
  const results: ParsedAction[] = [];
  const regex = /\[\[([a-z_]+):({\s*[\s\S]*?})\]\]/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    try {
      const payload = JSON.parse(match[2]) as Record<string, unknown>;
      results.push({ type: match[1], payload, raw: match[0] });
    } catch {
      // malformed JSON — skip
    }
  }
  return results;
}

export async function dispatchActions(
  actions: ParsedAction[],
  familyId: string,
  agentRunId?: string
): Promise<void> {
  try {
    for (const action of actions) {
      try {
        if (action.type === "flag_alert") {
          await prisma.portfolioAlert.create({
            data: {
              companyId: String(action.payload.companyId),
              type: String(action.payload.type ?? "agent"),
              severity: String(action.payload.severity ?? "info"),
              title: String(action.payload.title),
              body: action.payload.body ? String(action.payload.body) : undefined,
              source: action.payload.source ? String(action.payload.source) : undefined,
            },
          });
        } else if (action.type === "create_approval") {
          await prisma.approval.create({
            data: {
              familyId,
              agentRunId: agentRunId ?? undefined,
              title: String(action.payload.title),
              description: action.payload.description ? String(action.payload.description) : undefined,
              type: String(action.payload.type ?? "agent-action"),
              priority: String(action.payload.priority ?? "normal"),
              status: "pending",
            },
          });
        } else if (action.type === "update_deal_score") {
          await prisma.deal.update({
            where: { id: String(action.payload.dealId) },
            data: { dealScore: Number(action.payload.score) },
          });
        } else if (action.type === "update_deal_status") {
          await prisma.deal.update({
            where: { id: String(action.payload.dealId) },
            data: { status: String(action.payload.status) },
          });
        }
      } catch {
        // individual action failure is non-critical
      }
    }
  } catch {
    // side effects are non-critical
  }
}
