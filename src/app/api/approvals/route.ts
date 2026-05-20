import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MOCK_APPROVALS = [
  {
    id: "approval_mock_1",
    familyId: "family_demo",
    agentRunId: null,
    type: "deal-advance",
    title: "Advance Meridian AI to IC Review",
    description:
      "Deal flow agent recommends advancing Meridian AI (Series B, $12M ask) from Diligence to IC Review. Score: 81/100.",
    status: "pending",
    priority: "high",
    reviewedAt: null,
    reviewNote: null,
    createdAt: new Date("2025-04-15T09:30:00Z"),
  },
  {
    id: "approval_mock_2",
    familyId: "family_demo",
    agentRunId: null,
    type: "agent-action",
    title: "Send NDA to Axiom Logistics founders",
    description:
      "Chief of Staff agent requests approval to send standard NDA template to Axiom Logistics team before data room access is granted.",
    status: "pending",
    priority: "normal",
    reviewedAt: null,
    reviewNote: null,
    createdAt: new Date("2025-04-15T11:00:00Z"),
  },
  {
    id: "approval_mock_3",
    familyId: "family_demo",
    agentRunId: null,
    type: "transaction",
    title: "Wire $2.5M — Volta Energy Bridge",
    description:
      "Volta Energy requesting bridge note participation. $2.5M at 20% discount to next round, 8% interest. Existing pro-rata right exercise.",
    status: "pending",
    priority: "urgent",
    reviewedAt: null,
    reviewNote: null,
    createdAt: new Date("2025-04-16T08:00:00Z"),
  },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const familyId = searchParams.get("familyId");
  const status = searchParams.get("status") ?? "pending";

  try {
    const where: Record<string, unknown> = {};
    if (familyId) where.familyId = familyId;
    if (status) where.status = status;

    const approvals = await prisma.approval.findMany({
      where,
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      include: { agentRun: true },
    });

    return NextResponse.json({ approvals });
  } catch {
    let filtered = MOCK_APPROVALS;
    if (familyId) filtered = filtered.filter((a) => a.familyId === familyId);
    if (status) filtered = filtered.filter((a) => a.status === status);

    return NextResponse.json({ approvals: filtered, _mock: true });
  }
}
