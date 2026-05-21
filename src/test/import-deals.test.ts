import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Prisma before importing the route
vi.mock("@/lib/prisma", () => ({
  prisma: {
    deal: {
      createMany: vi.fn().mockResolvedValue({ count: 2 }),
    },
  },
}));

// Mock NextRequest/NextResponse
import { NextRequest } from "next/server";
import { POST } from "@/app/api/import/deals/route";

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/import/deals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/import/deals", () => {
  it("returns 400 when familyId is missing", async () => {
    const res = await POST(makeRequest({ deals: [{ company: "Acme" }] }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("familyId");
  });

  it("returns 400 when no deals provided", async () => {
    const res = await POST(makeRequest({ familyId: "fam_1", deals: [] }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when deals have no company name", async () => {
    const res = await POST(makeRequest({ familyId: "fam_1", deals: [{ sector: "Tech" }] }));
    expect(res.status).toBe(400);
  });

  it("imports valid deals and returns count", async () => {
    const res = await POST(makeRequest({
      familyId: "fam_1",
      deals: [
        { company: "Meridian AI", stage: "Series B", capitalAsk: "12000000" },
        { company: "Verdant Bio", stage: "series-a" },
      ],
    }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.imported).toBe(2);
    expect(body.total).toBe(2);
  });

  it("coerces stage values correctly", async () => {
    const { prisma } = await import("@/lib/prisma");
    const createMany = vi.mocked(prisma.deal.createMany);
    createMany.mockClear();

    await POST(makeRequest({
      familyId: "fam_1",
      deals: [{ company: "Test Co", stage: "Series A" }],
    }));

    expect(createMany).toHaveBeenCalledOnce();
    const callArg = createMany.mock.calls[0][0];
    expect(callArg.data[0].stage).toBe("series-a");
  });

  it("defaults status to inbound for unknown statuses", async () => {
    const { prisma } = await import("@/lib/prisma");
    const createMany = vi.mocked(prisma.deal.createMany);
    createMany.mockClear();

    await POST(makeRequest({
      familyId: "fam_1",
      deals: [{ company: "Test Co", status: "unknown-status" }],
    }));

    const callArg = createMany.mock.calls[0][0];
    expect(callArg.data[0].status).toBe("inbound");
  });

  it("accepts single deal via deal key", async () => {
    const res = await POST(makeRequest({
      familyId: "fam_1",
      deal: { company: "SingleCo" },
    }));
    expect(res.status).toBe(200);
  });

  it("falls back to mock response on DB error", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.deal.createMany).mockRejectedValueOnce(new Error("DB down"));

    const res = await POST(makeRequest({
      familyId: "fam_1",
      deals: [{ company: "Fallback Co" }],
    }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body._mock).toBe(true);
    expect(body.imported).toBe(1);
  });
});
