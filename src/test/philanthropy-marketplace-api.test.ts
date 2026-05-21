import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    aIAnalysis: {
      findFirst: vi.fn().mockResolvedValue(null),
      count: vi.fn().mockResolvedValue(0),
    },
  },
}));

vi.mock("@/lib/agents/runtime", () => ({
  runAgent: vi.fn().mockResolvedValue({
    result: {
      summary: "Mock philanthropy analysis",
      impactHighlights: ["1,000 students reached"],
      recommendations: ["Increase giving to education"],
      upcomingObligations: [],
      grantingCapacity: "On track",
    },
    model: "claude-opus-4-7",
    tokensUsed: 800,
  }),
}));

import { NextRequest } from "next/server";
import { POST as philanthropyPOST } from "@/app/api/agents/philanthropy/route";
import { GET as statusGET } from "@/app/api/agents/status/route";

function makeRequest(url: string, body: unknown) {
  return new NextRequest(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ── /api/agents/philanthropy ──────────────────────────────────────────────────

describe("POST /api/agents/philanthropy", () => {
  it("returns 400 when familyId is missing", async () => {
    const res = await philanthropyPOST(
      makeRequest("http://localhost/api/agents/philanthropy", {
        query: "What is my total impact this year?",
      })
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when query is missing", async () => {
    const res = await philanthropyPOST(
      makeRequest("http://localhost/api/agents/philanthropy", {
        familyId: "fam_1",
      })
    );
    expect(res.status).toBe(400);
  });

  it("returns mock analysis when ANTHROPIC_API_KEY is not set", async () => {
    // setup.ts sets ANTHROPIC_API_KEY to "" so mock path fires
    const res = await philanthropyPOST(
      makeRequest("http://localhost/api/agents/philanthropy", {
        familyId: "fam_1",
        query: "What is my total impact this year?",
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.analysis._mock).toBe(true);
    expect(body.result).toBeDefined();
  });

  it("mock result has required fields", async () => {
    const res = await philanthropyPOST(
      makeRequest("http://localhost/api/agents/philanthropy", {
        familyId: "fam_1",
        query: "Summarize my giving",
      })
    );
    const { result } = await res.json();
    expect(result).toHaveProperty("summary");
    expect(result).toHaveProperty("impactHighlights");
    expect(result).toHaveProperty("recommendations");
    expect(result).toHaveProperty("upcomingObligations");
    expect(Array.isArray(result.impactHighlights)).toBe(true);
    expect(Array.isArray(result.recommendations)).toBe(true);
  });
});

// ── /api/agents/status ────────────────────────────────────────────────────────

describe("GET /api/agents/status", () => {
  it("returns apiKeySet boolean and agents array", async () => {
    const res = await statusGET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(typeof body.apiKeySet).toBe("boolean");
    // setup.ts sets ANTHROPIC_API_KEY = "" so apiKeySet should be false
    expect(body.apiKeySet).toBe(false);
    expect(Array.isArray(body.agents)).toBe(true);
  });

  it("agents array has correct shape", async () => {
    const res = await statusGET();
    const { agents } = await res.json();
    expect(agents.length).toBeGreaterThan(0);
    for (const agent of agents) {
      expect(agent).toHaveProperty("type");
      expect(agent).toHaveProperty("lastRun");
      expect(agent).toHaveProperty("totalRuns");
      expect(typeof agent.type).toBe("string");
      expect(typeof agent.totalRuns).toBe("number");
      // lastRun is either null or a string
      expect(agent.lastRun === null || typeof agent.lastRun === "string").toBe(true);
    }
  });
});
