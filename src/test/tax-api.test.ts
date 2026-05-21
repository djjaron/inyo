import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    aIAnalysis: {
      create: vi.fn().mockResolvedValue({ id: "analysis_1", agentType: "tax", status: "completed" }),
    },
  },
}));

vi.mock("@/lib/agents/runtime", () => ({
  runAgent: vi.fn().mockResolvedValue({
    result: {
      taxYear: 2025,
      summary: "Mock tax summary",
      estimatedLiability: { federal: 2250000, state: 480000, total: 2730000 },
      actionItems: ["Action 1"],
      deductionOpportunities: ["Deduction 1"],
    },
    model: "claude-opus-4-7",
    tokensUsed: 900,
  }),
}));

import { NextRequest } from "next/server";
import { POST as taxPOST } from "@/app/api/agents/tax/route";

function makeRequest(url: string, body: unknown) {
  return new NextRequest(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/agents/tax", () => {
  it("returns 400 without familyId", async () => {
    const res = await taxPOST(makeRequest("http://localhost/api/agents/tax", {
      query: "What is my Q3 liability?",
    }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it("returns 400 when both query and documentContent are missing", async () => {
    const res = await taxPOST(makeRequest("http://localhost/api/agents/tax", {
      familyId: "fam_1",
    }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it("returns mock output with query when ANTHROPIC_API_KEY is not set", async () => {
    const res = await taxPOST(makeRequest("http://localhost/api/agents/tax", {
      familyId: "fam_1",
      query: "What is my estimated Q3 liability?",
    }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.analysis._mock).toBe(true);
    expect(body.result).toBeDefined();
    expect(body.result.summary).toBeDefined();
    expect(body.result.estimatedLiability).toBeDefined();
    expect(body.result.actionItems).toBeDefined();
  });

  it("returns mock output with documentContent when ANTHROPIC_API_KEY is not set", async () => {
    const res = await taxPOST(makeRequest("http://localhost/api/agents/tax", {
      familyId: "fam_1",
      documentContent: "Schedule K-1 for Hartwell Cayman LP...",
    }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.analysis._mock).toBe(true);
    expect(body.result).toBeDefined();
    expect(body.result.summary).toBeDefined();
  });

  it("estimatedLiability has federal, state, and total as numbers", async () => {
    const res = await taxPOST(makeRequest("http://localhost/api/agents/tax", {
      familyId: "fam_1",
      query: "Summarize K-1 income",
    }));
    const { result } = await res.json();
    expect(result).toHaveProperty("estimatedLiability");
    expect(typeof result.estimatedLiability.federal).toBe("number");
    expect(typeof result.estimatedLiability.state).toBe("number");
    expect(typeof result.estimatedLiability.total).toBe("number");
  });

  it("mock result contains all required top-level fields", async () => {
    const res = await taxPOST(makeRequest("http://localhost/api/agents/tax", {
      familyId: "fam_1",
      query: "Full tax overview",
    }));
    const { result } = await res.json();
    expect(result).toHaveProperty("summary");
    expect(result).toHaveProperty("estimatedLiability");
    expect(result).toHaveProperty("actionItems");
    expect(result).toHaveProperty("deductionOpportunities");
    expect(Array.isArray(result.actionItems)).toBe(true);
    expect(Array.isArray(result.deductionOpportunities)).toBe(true);
  });

  it("accepts both query and documentContent together", async () => {
    const res = await taxPOST(makeRequest("http://localhost/api/agents/tax", {
      familyId: "fam_1",
      query: "Review this K-1",
      documentContent: "K-1 content here...",
      context: { type: "k1-review" },
    }));
    expect(res.status).toBe(200);
  });
});
