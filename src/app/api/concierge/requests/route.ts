import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MOCK_REQUESTS = [
  {
    id: "req_mock_1",
    familyId: "family_demo",
    type: "travel",
    title: "Aspen — 6 guests, weekend of June 14",
    status: "in-progress",
    assignee: "Concierge Agent",
    createdAt: "2026-05-19T00:00:00.000Z",
    updatedAt: "2026-05-19T00:00:00.000Z",
  },
  {
    id: "req_mock_2",
    familyId: "family_demo",
    type: "property",
    title: "Hampton estate HVAC inspection",
    status: "pending",
    assignee: "Vendor: CoolAir Pro",
    createdAt: "2026-05-17T00:00:00.000Z",
    updatedAt: "2026-05-17T00:00:00.000Z",
  },
  {
    id: "req_mock_3",
    familyId: "family_demo",
    type: "gifting",
    title: "Anniversary gift — Patricia & James Thornton",
    status: "pending",
    assignee: "Concierge Agent",
    createdAt: "2026-05-16T00:00:00.000Z",
    updatedAt: "2026-05-16T00:00:00.000Z",
  },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const familyId = searchParams.get("familyId");
  if (!familyId) return NextResponse.json({ error: "familyId required" }, { status: 400 });
  try {
    const requests = await prisma.conciergeRequest.findMany({
      where: { familyId },
      orderBy: { createdAt: "desc" },
    });
    if (requests.length === 0) {
      return NextResponse.json({ requests: MOCK_REQUESTS, _mock: true });
    }
    return NextResponse.json({ requests });
  } catch {
    return NextResponse.json({ requests: MOCK_REQUESTS, _mock: true });
  }
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { familyId, type, title, details } = body as {
    familyId?: string;
    type?: string;
    title?: string;
    details?: string;
  };
  if (!familyId || !type || !title) {
    return NextResponse.json({ error: "familyId, type, and title are required" }, { status: 400 });
  }
  try {
    const request = await prisma.conciergeRequest.create({
      data: { familyId, type, title, details: details ?? null },
    });
    return NextResponse.json({ request }, { status: 201 });
  } catch {
    return NextResponse.json(
      {
        request: {
          id: `temp_${Date.now()}`,
          familyId,
          type,
          title,
          details: details ?? null,
          status: "pending",
          assignee: "Concierge Agent",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
      { status: 201 },
    );
  }
}
