import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export interface NotificationItem {
  id: string;
  type: "approval" | "portfolio-alert" | "agent-failure";
  title: string;
  body: string | null;
  severity: "info" | "warning" | "critical" | "urgent";
  href: string;
  createdAt: string;
  read: boolean;
}

const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "n1",
    type: "approval",
    title: "Wire $2.5M — Volta Energy Bridge",
    body: "Volta Energy bridge note participation requires approval",
    severity: "urgent",
    href: "/approvals",
    createdAt: new Date("2025-04-16T08:00:00Z").toISOString(),
    read: false,
  },
  {
    id: "n2",
    type: "approval",
    title: "Advance Meridian AI to IC Review",
    body: "Deal flow agent recommends advancing. Score: 81/100",
    severity: "warning",
    href: "/approvals",
    createdAt: new Date("2025-04-15T09:30:00Z").toISOString(),
    read: false,
  },
  {
    id: "n3",
    type: "portfolio-alert",
    title: "Axiom Logistics — Burn Rate Warning",
    body: "Runway below 6 months based on latest financials",
    severity: "critical",
    href: "/portfolio",
    createdAt: new Date("2025-04-15T07:00:00Z").toISOString(),
    read: false,
  },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const familyId = searchParams.get("familyId");

  try {
    const notifications: NotificationItem[] = [];

    // Pending approvals
    const approvalWhere: Record<string, unknown> = { status: "pending" };
    if (familyId) approvalWhere.familyId = familyId;
    const approvals = await prisma.approval.findMany({
      where: approvalWhere,
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: 5,
    });
    for (const a of approvals) {
      notifications.push({
        id: `approval-${a.id}`,
        type: "approval",
        title: a.title,
        body: a.description ?? null,
        severity: a.priority === "urgent" ? "urgent" : a.priority === "high" ? "warning" : "info",
        href: "/approvals",
        createdAt: a.createdAt.toISOString(),
        read: false,
      });
    }

    // Unread portfolio alerts (join through PortfolioCompany)
    const alertWhere: Record<string, unknown> = { read: false };
    if (familyId) {
      alertWhere.company = { familyId };
    }
    const portfolioAlerts = await prisma.portfolioAlert.findMany({
      where: alertWhere,
      include: { company: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    });
    for (const pa of portfolioAlerts) {
      notifications.push({
        id: `portfolio-alert-${pa.id}`,
        type: "portfolio-alert",
        title: `${pa.company.name} — ${pa.title}`,
        body: pa.body ?? null,
        severity: pa.severity === "critical" ? "critical" : pa.severity === "warning" ? "warning" : "info",
        href: "/portfolio",
        createdAt: pa.createdAt.toISOString(),
        read: false,
      });
    }

    // Recent agent failures
    const runWhere: Record<string, unknown> = { status: "failed" };
    if (familyId) runWhere.familyId = familyId;
    const failedRuns = await prisma.agentRun.findMany({
      where: runWhere,
      orderBy: { createdAt: "desc" },
      take: 3,
    });
    for (const run of failedRuns) {
      const name = run.agentType.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      notifications.push({
        id: `agent-failure-${run.id}`,
        type: "agent-failure",
        title: `${name} failed`,
        body: run.error ?? null,
        severity: "warning",
        href: "/agents",
        createdAt: run.createdAt.toISOString(),
        read: false,
      });
    }

    // Sort by createdAt descending
    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (notifications.length > 0) {
      return NextResponse.json({
        notifications,
        unreadCount: notifications.filter((n) => !n.read).length,
      });
    }

    return NextResponse.json({
      notifications: MOCK_NOTIFICATIONS,
      unreadCount: MOCK_NOTIFICATIONS.filter((n) => !n.read).length,
      _mock: true,
    });
  } catch {
    return NextResponse.json({
      notifications: MOCK_NOTIFICATIONS,
      unreadCount: MOCK_NOTIFICATIONS.filter((n) => !n.read).length,
      _mock: true,
    });
  }
}
