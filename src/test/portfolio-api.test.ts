import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    portfolioCompany: {
      findMany: vi.fn().mockResolvedValue([
        {
          id: "pc1",
          name: "ClearReg",
          sector: "RegTech",
          stage: "growth",
          status: "active",
          familyId: "fam_1",
          investedAmount: 25_000_000,
          currentValue: 38_500_000,
          ownership: 4.2,
          alertLevel: "normal",
          createdAt: new Date(),
          updatedAt: new Date(),
          alerts: [],
        },
        {
          id: "pc2",
          name: "Volta Energy",
          sector: "Climate Tech",
          stage: "series-b",
          status: "watchlist",
          familyId: "fam_1",
          investedAmount: 8_000_000,
          currentValue: 6_200_000,
          ownership: 2.8,
          alertLevel: "watch",
          createdAt: new Date(),
          updatedAt: new Date(),
          alerts: [
            {
              id: "alert_1",
              companyId: "pc2",
              type: "burn-rate",
              severity: "warning",
              title: "Burn rate increased 40% QoQ",
              read: false,
              createdAt: new Date(),
            },
          ],
        },
      ]),
      findUnique: vi.fn().mockImplementation(({ where }: { where: { id: string } }) =>
        where.id === "pc1"
          ? Promise.resolve({
              id: "pc1",
              name: "ClearReg",
              sector: "RegTech",
              stage: "growth",
              status: "active",
              familyId: "fam_1",
              investedAmount: 25_000_000,
              currentValue: 38_500_000,
              ownership: 4.2,
              alertLevel: "normal",
              createdAt: new Date(),
              updatedAt: new Date(),
              alerts: [],
              aiAnalyses: [],
            })
          : Promise.resolve(null)
      ),
      update: vi.fn().mockImplementation(({ where, data }: { where: { id: string }; data: Record<string, unknown> }) =>
        Promise.resolve({
          id: where.id,
          name: "ClearReg",
          status: "active",
          alertLevel: "normal",
          familyId: "fam_1",
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        })
      ),
    },
    aIAnalysis: {
      create: vi.fn().mockResolvedValue({
        id: "analysis_pm_1",
        agentType: "portfolio-monitor",
        status: "completed",
      }),
    },
  },
}));

import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/portfolio/route";
import { GET as GET_ONE, PATCH } from "@/app/api/portfolio/[id]/route";
import { POST as portfolioMonitorPOST } from "@/app/api/agents/portfolio-monitor/route";

function req(url: string, opts?: RequestInit) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new NextRequest(url, opts as any);
}

// ── GET /api/portfolio ────────────────────────────────────────────────────────

describe("GET /api/portfolio", () => {
  it("returns companies array", async () => {
    const res = await GET(req("http://localhost/api/portfolio?familyId=fam_1"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.companies ?? body)).toBe(true);
  });

  it("companies array has expected shape", async () => {
    const res = await GET(req("http://localhost/api/portfolio?familyId=fam_1"));
    const body = await res.json();
    const companies = body.companies ?? body;
    expect(companies.length).toBeGreaterThan(0);
    const first = companies[0];
    expect(first).toHaveProperty("id");
    expect(first).toHaveProperty("name");
    expect(first).toHaveProperty("status");
  });
});

// ── GET /api/portfolio/[id] ───────────────────────────────────────────────────

describe("GET /api/portfolio/[id]", () => {
  it("returns a single company", async () => {
    const res = await GET_ONE(req("http://localhost/api/portfolio/pc1"), {
      params: Promise.resolve({ id: "pc1" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.company?.id ?? body.id).toBe("pc1");
  });

  it("returns 404 when company not found", async () => {
    const res = await GET_ONE(req("http://localhost/api/portfolio/missing"), {
      params: Promise.resolve({ id: "missing" }),
    });
    expect(res.status).toBe(404);
  });
});

// ── PATCH /api/portfolio/[id] ─────────────────────────────────────────────────

describe("PATCH /api/portfolio/[id]", () => {
  it("updates company status", async () => {
    const res = await PATCH(
      req("http://localhost/api/portfolio/pc1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "watchlist" }),
      }),
      { params: Promise.resolve({ id: "pc1" }) }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.company?.status ?? body.status).toBe("watchlist");
  });

  it("returns 400 when no valid fields provided", async () => {
    const res = await PATCH(
      req("http://localhost/api/portfolio/pc1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invalidField: "nope" }),
      }),
      { params: Promise.resolve({ id: "pc1" }) }
    );
    expect(res.status).toBe(400);
  });
});

// ── POST /api/agents/portfolio-monitor ───────────────────────────────────────

describe("POST /api/agents/portfolio-monitor", () => {
  const validBody = {
    familyId: "fam_1",
    companyId: "pc1",
    context: { name: "ClearReg", sector: "RegTech", stage: "growth" },
  };

  it("returns 400 when familyId is missing", async () => {
    const res = await portfolioMonitorPOST(
      req("http://localhost/api/agents/portfolio-monitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context: { name: "Test" } }),
      })
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when context is missing", async () => {
    const res = await portfolioMonitorPOST(
      req("http://localhost/api/agents/portfolio-monitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ familyId: "fam_1" }),
      })
    );
    expect(res.status).toBe(400);
  });

  it("returns mock output when ANTHROPIC_API_KEY is not set", async () => {
    const res = await portfolioMonitorPOST(
      req("http://localhost/api/agents/portfolio-monitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validBody),
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.analysis._mock).toBe(true);
    expect(body.result).toBeDefined();
  });

  it("mock result has required fields", async () => {
    const res = await portfolioMonitorPOST(
      req("http://localhost/api/agents/portfolio-monitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validBody),
      })
    );
    const { result } = await res.json();
    expect(result).toHaveProperty("healthScore");
    expect(result).toHaveProperty("recommendation");
    expect(result).toHaveProperty("summary");
    expect(result).toHaveProperty("risks");
    expect(result).toHaveProperty("opportunities");
  });

  it("healthScore is a number between 0 and 100", async () => {
    const res = await portfolioMonitorPOST(
      req("http://localhost/api/agents/portfolio-monitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validBody),
      })
    );
    const { result } = await res.json();
    expect(typeof result.healthScore).toBe("number");
    expect(result.healthScore).toBeGreaterThanOrEqual(0);
    expect(result.healthScore).toBeLessThanOrEqual(100);
  });

  it("risks and opportunities are arrays", async () => {
    const res = await portfolioMonitorPOST(
      req("http://localhost/api/agents/portfolio-monitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validBody),
      })
    );
    const { result } = await res.json();
    expect(Array.isArray(result.risks)).toBe(true);
    expect(Array.isArray(result.opportunities)).toBe(true);
  });
});
