import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const now = new Date();
const ago = (minutes: number) => new Date(now.getTime() - minutes * 60 * 1000).toISOString();

const MOCK_LOGS = [
  {
    id: "audit_mock_1",
    familyId: "family_demo",
    action: "create",
    resourceType: "deal",
    resourceId: "deal_1",
    resourceName: "Meridian AI",
    diff: null,
    performedBy: "system",
    createdAt: ago(5),
  },
  {
    id: "audit_mock_2",
    familyId: "family_demo",
    action: "approve",
    resourceType: "approval",
    resourceId: "approval_1",
    resourceName: "Wire $2.5M — Volta Energy",
    diff: null,
    performedBy: "user",
    createdAt: ago(12),
  },
  {
    id: "audit_mock_3",
    familyId: "family_demo",
    action: "update",
    resourceType: "deal",
    resourceId: "deal_2",
    resourceName: "Axiom Logistics",
    diff: {
      before: { stage: "Screening", score: 64 },
      after: { stage: "Diligence", score: 78 },
    },
    performedBy: "system",
    createdAt: ago(23),
  },
  {
    id: "audit_mock_4",
    familyId: "family_demo",
    action: "create",
    resourceType: "contact",
    resourceId: "contact_1",
    resourceName: "Sarah Chen",
    diff: null,
    performedBy: "user",
    createdAt: ago(45),
  },
  {
    id: "audit_mock_5",
    familyId: "family_demo",
    action: "reject",
    resourceType: "approval",
    resourceId: "approval_2",
    resourceName: "Advance DeepRoute to IC",
    diff: null,
    performedBy: "user",
    createdAt: ago(90),
  },
  {
    id: "audit_mock_6",
    familyId: "family_demo",
    action: "create",
    resourceType: "document",
    resourceId: "doc_1",
    resourceName: "Meridian AI — IC Memo v1",
    diff: null,
    performedBy: "system",
    createdAt: ago(130),
  },
  {
    id: "audit_mock_7",
    familyId: "family_demo",
    action: "update",
    resourceType: "contact",
    resourceId: "contact_2",
    resourceName: "James Wren",
    diff: {
      before: { relationship: "prospect" },
      after: { relationship: "portfolio" },
    },
    performedBy: "user",
    createdAt: ago(200),
  },
  {
    id: "audit_mock_8",
    familyId: "family_demo",
    action: "delete",
    resourceType: "deal",
    resourceId: "deal_3",
    resourceName: "Solaris Grid",
    diff: null,
    performedBy: "user",
    createdAt: ago(360),
  },
  {
    id: "audit_mock_9",
    familyId: "family_demo",
    action: "update",
    resourceType: "document",
    resourceId: "doc_2",
    resourceName: "Volta Energy — Bridge Note",
    diff: {
      before: { status: "draft" },
      after: { status: "signed" },
    },
    performedBy: "user",
    createdAt: ago(480),
  },
  {
    id: "audit_mock_10",
    familyId: "family_demo",
    action: "create",
    resourceType: "approval",
    resourceId: "approval_3",
    resourceName: "Send NDA to Axiom Logistics",
    diff: null,
    performedBy: "system",
    createdAt: ago(600),
  },
  {
    id: "audit_mock_11",
    familyId: "family_demo",
    action: "restore",
    resourceType: "deal",
    resourceId: "deal_4",
    resourceName: "Kinetic Health",
    diff: null,
    performedBy: "user",
    createdAt: ago(720),
  },
  {
    id: "audit_mock_12",
    familyId: "family_demo",
    action: "update",
    resourceType: "approval",
    resourceId: "approval_4",
    resourceName: "Wire $500K — Kinetic Health SAFE",
    diff: {
      before: { status: "pending" },
      after: { status: "approved" },
    },
    performedBy: "user",
    createdAt: ago(900),
  },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const familyId = searchParams.get("familyId");
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Math.min(parseInt(limitParam, 10) || 50, 200) : 50;
  const resourceType = searchParams.get("resourceType");
  const action = searchParams.get("action");

  try {
    const where: Record<string, unknown> = {};
    if (familyId) where.familyId = familyId;
    if (resourceType) where.resourceType = resourceType;
    if (action) where.action = action;

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    if (logs.length === 0) throw new Error("empty");

    return NextResponse.json({ logs, total: logs.length });
  } catch {
    let filtered = MOCK_LOGS;
    if (familyId) filtered = filtered.filter((l) => l.familyId === familyId);
    if (resourceType) filtered = filtered.filter((l) => l.resourceType === resourceType);
    if (action) filtered = filtered.filter((l) => l.action === action);
    const sliced = filtered.slice(0, limit);

    return NextResponse.json({ logs: sliced, total: sliced.length, _mock: true });
  }
}
