import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    aIAnalysis: {
      create: vi.fn().mockResolvedValue({ id: "analysis_1", agentType: "chief-of-staff", status: "completed" }),
    },
  },
}));

vi.mock("@/lib/agents/runtime", () => ({
  runAgent: vi.fn().mockResolvedValue({
    result: {
      acknowledgment: "Understood.",
      actionPlan: ["Step 1"],
      timeline: "2 hours",
      estimatedCost: "$1,000",
      requiresApproval: false,
      followUpNeeded: [],
    },
    model: "claude-opus-4-7",
    tokensUsed: 800,
  }),
}));

import { NextRequest } from "next/server";
import { POST as chiefOfStaffPOST } from "@/app/api/agents/chief-of-staff/route";

function makeRequest(url: string, body: unknown) {
  return new NextRequest(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const BASE_URL = "http://localhost/api/agents/chief-of-staff";

const validBody = {
  familyId: "fam_1",
  request: "Plan Aspen trip for 6 guests June 14–16",
};

describe("POST /api/agents/chief-of-staff", () => {
  it("returns 400 without familyId", async () => {
    const res = await chiefOfStaffPOST(
      makeRequest(BASE_URL, { request: "Plan Aspen trip" })
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 without request", async () => {
    const res = await chiefOfStaffPOST(
      makeRequest(BASE_URL, { familyId: "fam_1" })
    );
    expect(res.status).toBe(400);
  });

  it("returns mock output with required fields", async () => {
    const res = await chiefOfStaffPOST(makeRequest(BASE_URL, validBody));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.analysis._mock).toBe(true);
    expect(body.result.acknowledgment).toBeDefined();
    expect(body.result.actionPlan).toBeDefined();
    expect(body.result.timeline).toBeDefined();
    expect(body.result.estimatedCost).toBeDefined();
    expect(body.result).toHaveProperty("requiresApproval");
  });

  it("actionPlan is an array with at least one item", async () => {
    const res = await chiefOfStaffPOST(makeRequest(BASE_URL, validBody));
    const { result } = await res.json();
    expect(Array.isArray(result.actionPlan)).toBe(true);
    expect(result.actionPlan.length).toBeGreaterThanOrEqual(1);
  });

  it("followUpNeeded is an array", async () => {
    const res = await chiefOfStaffPOST(makeRequest(BASE_URL, validBody));
    const { result } = await res.json();
    expect(Array.isArray(result.followUpNeeded)).toBe(true);
  });
});
