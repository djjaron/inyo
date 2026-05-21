import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    aIAnalysis: {
      create: vi.fn().mockResolvedValue({ id: "analysis_1", agentType: "deal-flow", status: "completed" }),
    },
  },
}));

vi.mock("@/lib/agents/runtime", () => ({
  runAgent: vi.fn().mockResolvedValue({
    result: { score: 82, recommendation: "pursue", summary: "Strong opportunity" },
    model: "claude-opus-4-7",
    tokensUsed: 1200,
  }),
}));

import { NextRequest } from "next/server";
import { POST as dealFlowPOST } from "@/app/api/agents/deal-flow/route";
import { POST as icMemoPOST } from "@/app/api/agents/ic-memo/route";

function makeRequest(url: string, body: unknown) {
  return new NextRequest(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validDealContext = {
  familyId: "fam_1",
  dealId: "deal_1",
  context: { company: "Meridian AI", sector: "Enterprise AI", stage: "series-b" },
};

describe("POST /api/agents/deal-flow", () => {
  it("returns 400 when familyId is missing", async () => {
    const res = await dealFlowPOST(makeRequest("http://localhost/api/agents/deal-flow", {
      context: { company: "Test" },
    }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when context is missing", async () => {
    const res = await dealFlowPOST(makeRequest("http://localhost/api/agents/deal-flow", {
      familyId: "fam_1",
    }));
    expect(res.status).toBe(400);
  });

  it("returns mock analysis when ANTHROPIC_API_KEY is not set", async () => {
    // env var is empty string in setup.ts
    const res = await dealFlowPOST(makeRequest("http://localhost/api/agents/deal-flow", validDealContext));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.analysis._mock).toBe(true);
    expect(body.result.score).toBeDefined();
    expect(body.result.recommendation).toBeDefined();
  });

  it("mock result has all required fields", async () => {
    const res = await dealFlowPOST(makeRequest("http://localhost/api/agents/deal-flow", validDealContext));
    const { result } = await res.json();
    expect(result).toHaveProperty("score");
    expect(result).toHaveProperty("recommendation");
    expect(result).toHaveProperty("summary");
    expect(result).toHaveProperty("risks");
    expect(result).toHaveProperty("opportunities");
  });
});

describe("POST /api/agents/ic-memo", () => {
  it("returns 400 when familyId is missing", async () => {
    const res = await icMemoPOST(makeRequest("http://localhost/api/agents/ic-memo", {
      context: { company: "Test" },
    }));
    expect(res.status).toBe(400);
  });

  it("returns mock IC memo when ANTHROPIC_API_KEY is not set", async () => {
    const res = await icMemoPOST(makeRequest("http://localhost/api/agents/ic-memo", validDealContext));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.analysis._mock).toBe(true);
    expect(body.result.executiveSummary).toBeDefined();
    expect(body.result.recommendation).toBeDefined();
  });

  it("mock IC memo has all required sections", async () => {
    const res = await icMemoPOST(makeRequest("http://localhost/api/agents/ic-memo", validDealContext));
    const { result } = await res.json();
    expect(result).toHaveProperty("executiveSummary");
    expect(result).toHaveProperty("companyOverview");
    expect(result).toHaveProperty("marketOpportunity");
    expect(result).toHaveProperty("risks");
    expect(result).toHaveProperty("swot");
    expect(result).toHaveProperty("nextSteps");
  });

  it("accepts documentContents array", async () => {
    const res = await icMemoPOST(makeRequest("http://localhost/api/agents/ic-memo", {
      ...validDealContext,
      documentContents: [{ name: "Pitch Deck", content: "We are building AI for compliance..." }],
    }));
    expect(res.status).toBe(200);
  });
});
