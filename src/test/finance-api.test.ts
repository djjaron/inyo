import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    entity: {
      findMany: vi.fn().mockResolvedValue([
        { id: "e1", familyId: "fam_1", name: "Test Entity LLC", type: "llc", createdAt: new Date(), updatedAt: new Date() },
      ]),
    },
    cashFlow: {
      findMany: vi.fn().mockResolvedValue([
        {
          id: "cf1",
          entityId: "e1",
          type: "income",
          category: "Management Fee",
          amount: 100_000,
          currency: "USD",
          description: "Q1 management fee",
          occurredAt: new Date("2026-05-01"),
          createdAt: new Date(),
          entity: { name: "Test Entity LLC" },
        },
      ]),
    },
  },
}));

vi.mock("@/lib/agents/runtime", () => ({
  runAgent: vi.fn().mockResolvedValue({
    result: {
      summary: "Test summary",
      liquidityStatus: "healthy",
      insights: ["Insight 1"],
      recommendations: ["Recommendation 1"],
      alerts: [],
    },
    model: "claude-opus-4-7",
    tokensUsed: 800,
  }),
}));

import { NextRequest } from "next/server";
import { GET } from "@/app/api/finance/route";
import { POST as cfoPOST } from "@/app/api/agents/cfo/route";

function makeGetRequest(url: string) {
  return new NextRequest(url);
}

function makePostRequest(url: string, body: unknown) {
  return new NextRequest(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------
// GET /api/finance
// ---------------------------------------------------------------------------

describe("GET /api/finance", () => {
  it("returns mock when no familyId provided", async () => {
    const res = await GET(makeGetRequest("http://localhost/api/finance"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body._mock).toBe(true);
    expect(Array.isArray(body.entities)).toBe(true);
    expect(Array.isArray(body.transactions)).toBe(true);
    expect(Array.isArray(body.payables)).toBe(true);
  });

  it("returns entities, transactions, payables arrays for a real familyId", async () => {
    const res = await GET(makeGetRequest("http://localhost/api/finance?familyId=fam_1"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.entities)).toBe(true);
    expect(Array.isArray(body.transactions)).toBe(true);
    expect(Array.isArray(body.payables)).toBe(true);
  });

  it("entity shape has required fields", async () => {
    const res = await GET(makeGetRequest("http://localhost/api/finance?familyId=fam_1"));
    const body = await res.json();
    const entity = body.entities[0];
    expect(entity).toHaveProperty("id");
    expect(entity).toHaveProperty("name");
    expect(entity).toHaveProperty("type");
    expect(entity).toHaveProperty("cash");
    expect(entity).toHaveProperty("receivables");
    expect(entity).toHaveProperty("payables");
  });

  it("transaction shape has required fields", async () => {
    const res = await GET(makeGetRequest("http://localhost/api/finance?familyId=fam_1"));
    const body = await res.json();
    const tx = body.transactions[0];
    expect(tx).toHaveProperty("id");
    expect(tx).toHaveProperty("date");
    expect(tx).toHaveProperty("entity");
    expect(tx).toHaveProperty("type");
    expect(tx).toHaveProperty("category");
    expect(tx).toHaveProperty("amount");
    expect(tx).toHaveProperty("description");
  });

  it("returns mock fallback when DB throws", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.entity.findMany).mockRejectedValueOnce(new Error("DB down"));

    const res = await GET(makeGetRequest("http://localhost/api/finance?familyId=fam_1"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body._mock).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// POST /api/agents/cfo
// ---------------------------------------------------------------------------

describe("POST /api/agents/cfo", () => {
  it("returns 400 when familyId is missing", async () => {
    const res = await cfoPOST(makePostRequest("http://localhost/api/agents/cfo", {
      query: "What is our Q2 cash position?",
    }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when query is missing", async () => {
    const res = await cfoPOST(makePostRequest("http://localhost/api/agents/cfo", {
      familyId: "fam_1",
    }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when both familyId and query are missing", async () => {
    const res = await cfoPOST(makePostRequest("http://localhost/api/agents/cfo", {}));
    expect(res.status).toBe(400);
  });

  it("returns mock analysis when ANTHROPIC_API_KEY is not set", async () => {
    const res = await cfoPOST(makePostRequest("http://localhost/api/agents/cfo", {
      familyId: "fam_1",
      query: "What is our Q2 cash position?",
    }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.analysis._mock).toBe(true);
    expect(body.result).toBeDefined();
  });

  it("mock result has all required fields", async () => {
    const res = await cfoPOST(makePostRequest("http://localhost/api/agents/cfo", {
      familyId: "fam_1",
      query: "Summarize AP exposure by entity",
    }));
    const { result } = await res.json();
    expect(result).toHaveProperty("summary");
    expect(result).toHaveProperty("liquidityStatus");
    expect(result).toHaveProperty("insights");
    expect(result).toHaveProperty("recommendations");
    expect(Array.isArray(result.insights)).toBe(true);
    expect(Array.isArray(result.recommendations)).toBe(true);
  });

  it("liquidityStatus in mock is 'healthy'", async () => {
    const res = await cfoPOST(makePostRequest("http://localhost/api/agents/cfo", {
      familyId: "fam_1",
      query: "Liquidity check",
    }));
    const { result } = await res.json();
    expect(result.liquidityStatus).toBe("healthy");
  });
});
