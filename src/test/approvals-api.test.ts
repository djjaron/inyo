import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    approval: {
      findMany: vi.fn().mockResolvedValue([
        {
          id: "appr_1",
          familyId: "fam_1",
          agentRunId: null,
          type: "deal-advance",
          title: "IC Review: Meridian AI",
          description: "Deal flow recommends advancing Meridian AI to IC Review. Score: 81/100.",
          status: "pending",
          priority: "high",
          reviewedAt: null,
          reviewNote: null,
          createdAt: new Date("2025-04-15T09:30:00Z"),
          agentRun: null,
        },
        {
          id: "appr_2",
          familyId: "fam_1",
          agentRunId: null,
          type: "transaction",
          title: "Wire $500K",
          description: "Bridge note.",
          status: "approved",
          priority: "urgent",
          reviewedAt: new Date("2025-04-16T10:00:00Z"),
          reviewNote: "Approved by GP.",
          createdAt: new Date("2025-04-15T11:00:00Z"),
          agentRun: null,
        },
      ]),
      update: vi.fn().mockImplementation(({ where, data }: { where: { id: string }; data: Record<string, unknown> }) =>
        Promise.resolve({
          id: where.id,
          familyId: "fam_1",
          type: "deal-advance",
          title: "IC Review: Meridian AI",
          description: null,
          status: data.status,
          priority: "high",
          reviewedAt: data.reviewedAt,
          reviewNote: data.reviewNote ?? null,
          createdAt: new Date("2025-04-15T09:30:00Z"),
        })
      ),
    },
  },
}));

import { NextRequest } from "next/server";
import { GET } from "@/app/api/approvals/route";
import { PATCH } from "@/app/api/approvals/[id]/route";

function req(url: string, opts?: ConstructorParameters<typeof NextRequest>[1]) {
  return new NextRequest(url, opts);
}

// ---------------------------------------------------------------------------
// GET /api/approvals
// ---------------------------------------------------------------------------

describe("GET /api/approvals", () => {
  it("returns an approvals array", async () => {
    const res = await GET(req("http://localhost/api/approvals?familyId=fam_1"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.approvals)).toBe(true);
  });

  it("filters to pending when status=pending (mock returns only pending items)", async () => {
    const { prisma } = await import("@/lib/prisma");
    // DB fails → fall back to MOCK_APPROVALS (all 3 are pending by default)
    vi.mocked(prisma.approval.findMany).mockRejectedValueOnce(new Error("DB down"));

    const res = await GET(req("http://localhost/api/approvals?familyId=family_demo&status=pending"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body._mock).toBe(true);
    const statuses: string[] = body.approvals.map((a: { status: string }) => a.status);
    expect(statuses.every((s) => s === "pending")).toBe(true);
  });

  it("filters to approved when status=approved (mock returns empty)", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.approval.findMany).mockRejectedValueOnce(new Error("DB down"));

    const res = await GET(req("http://localhost/api/approvals?familyId=family_demo&status=approved"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body._mock).toBe(true);
    // All mock approvals are pending — so none match "approved"
    expect(body.approvals).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/approvals/[id]
// ---------------------------------------------------------------------------

describe("PATCH /api/approvals/[id]", () => {
  it("returns 200 with status=approved", async () => {
    const res = await PATCH(
      req("http://localhost/api/approvals/appr_1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      }),
      { params: Promise.resolve({ id: "appr_1" }) }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.approval?.status ?? body.status).toBe("approved");
  });

  it("returns 400 when status is invalid", async () => {
    const res = await PATCH(
      req("http://localhost/api/approvals/appr_1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "pending" }),
      }),
      { params: Promise.resolve({ id: "appr_1" }) }
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it("returns 400 when status is missing", async () => {
    const res = await PATCH(
      req("http://localhost/api/approvals/appr_1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
      { params: Promise.resolve({ id: "appr_1" }) }
    );
    expect(res.status).toBe(400);
  });

  it("saves reviewNote when status=rejected with note", async () => {
    const res = await PATCH(
      req("http://localhost/api/approvals/appr_1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected", reviewNote: "Does not meet our criteria." }),
      }),
      { params: Promise.resolve({ id: "appr_1" }) }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.approval?.reviewNote ?? body.reviewNote).toBe("Does not meet our criteria.");
    expect(body.approval?.status ?? body.status).toBe("rejected");
  });
});
