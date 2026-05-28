import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    deal: {
      count: vi.fn().mockResolvedValue(5),
      aggregate: vi.fn().mockResolvedValue({ _sum: { capitalAsk: 45_000_000 } }),
      findMany: vi.fn().mockResolvedValue([
        { id: "d1", company: "Meridian AI", status: "diligence", sector: "Enterprise AI", stage: "series-b", capitalAsk: 12_000_000, dealScore: 84, createdAt: new Date() },
      ]),
    },
    portfolioCompany: {
      count: vi.fn().mockResolvedValue(3),
    },
    portfolioAlert: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    agentRun: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}));

import { NextRequest } from "next/server";
import { GET } from "@/app/api/dashboard/route";

describe("GET /api/dashboard", () => {
  it("returns mock data for family_demo", async () => {
    const res = await GET(new NextRequest("http://localhost/api/dashboard?familyId=family_demo"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body._mock).toBe(true);
    expect(body.stats).toBeDefined();
    expect(typeof body.stats.totalDeals).toBe("number");
    expect(typeof body.stats.pipelineValue).toBe("number");
    expect(Array.isArray(body.recentDeals)).toBe(true);
    expect(Array.isArray(body.alerts)).toBe(true);
  });

  it("returns real data for a real familyId", async () => {
    const res = await GET(new NextRequest("http://localhost/api/dashboard?familyId=fam_real_123"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body._mock).toBe(false);
    expect(body.stats.totalDeals).toBe(5);
    expect(body.stats.pipelineValue).toBe(45_000_000);
    expect(body.stats.portfolioCompanies).toBe(3);
    expect(body.recentDeals).toHaveLength(1);
  });

  it("returns mock fallback when DB throws", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.deal.count).mockRejectedValueOnce(new Error("DB down"));

    const res = await GET(new NextRequest("http://localhost/api/dashboard?familyId=fam_real_123"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body._mock).toBe(true);
  });

  it("returns mock data when no familyId provided", async () => {
    const res = await GET(new NextRequest("http://localhost/api/dashboard"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body._mock).toBe(true);
  });

  it("response shape has all required fields", async () => {
    const res = await GET(new NextRequest("http://localhost/api/dashboard?familyId=family_demo"));
    const body = await res.json();
    expect(body).toHaveProperty("stats.totalDeals");
    expect(body).toHaveProperty("stats.pipelineValue");
    expect(body).toHaveProperty("stats.activeDeals");
    expect(body).toHaveProperty("stats.portfolioCompanies");
    expect(body).toHaveProperty("recentDeals");
    expect(body).toHaveProperty("alerts");
    expect(body).toHaveProperty("_mock");
  });
});
