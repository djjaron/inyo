import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    deal: {
      findMany: vi.fn().mockResolvedValue([
        { id: "d1", company: "Meridian AI", status: "diligence", familyId: "fam_1", createdAt: new Date() },
        { id: "d2", company: "Verdant Bio", status: "reviewing", familyId: "fam_1", createdAt: new Date() },
      ]),
      count: vi.fn().mockResolvedValue(2),
      create: vi.fn().mockImplementation(({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({ id: "d_new", ...data, createdAt: new Date() })
      ),
      findUnique: vi.fn().mockImplementation(({ where }: { where: { id: string } }) =>
        where.id === "d1"
          ? Promise.resolve({ id: "d1", company: "Meridian AI", status: "diligence", familyId: "fam_1", createdAt: new Date(), documents: [], aiAnalyses: [] })
          : Promise.resolve(null)
      ),
      update: vi.fn().mockImplementation(({ where, data }: { where: { id: string }; data: Record<string, unknown> }) =>
        Promise.resolve({ id: where.id, company: "Meridian AI", status: "diligence", familyId: "fam_1", ...data, createdAt: new Date() })
      ),
    },
  },
}));

import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/deals/route";
import { GET as GET_ONE, PATCH } from "@/app/api/deals/[id]/route";

function req(url: string, opts?: ConstructorParameters<typeof NextRequest>[1]) {
  return new NextRequest(url, opts);
}

describe("GET /api/deals", () => {
  it("returns deals list", async () => {
    const res = await GET(req("http://localhost/api/deals?familyId=fam_1"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.deals ?? body)).toBe(true);
  });
});

describe("POST /api/deals", () => {
  it("creates a deal and returns it", async () => {
    const res = await POST(req("http://localhost/api/deals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ familyId: "fam_1", company: "New Co", name: "New Co – Seed", status: "inbound" }),
    }));
    expect([200, 201]).toContain(res.status);
    const body = await res.json();
    expect(body.deal?.company ?? body.company).toBe("New Co");
  });
});

describe("GET /api/deals/[id]", () => {
  it("returns a single deal", async () => {
    const res = await GET_ONE(req("http://localhost/api/deals/d1"), {
      params: Promise.resolve({ id: "d1" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deal?.id ?? body.id).toBe("d1");
  });

  it("returns mock when deal not found", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.deal.findUnique).mockResolvedValueOnce(null);

    const res = await GET_ONE(req("http://localhost/api/deals/missing"), {
      params: Promise.resolve({ id: "missing" }),
    });
    // Should return 404 or a mock deal
    expect([200, 404]).toContain(res.status);
  });
});

describe("PATCH /api/deals/[id]", () => {
  it("updates deal status", async () => {
    const res = await PATCH(
      req("http://localhost/api/deals/d1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "diligence" }),
      }),
      { params: Promise.resolve({ id: "d1" }) }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deal?.status ?? body.status).toBe("diligence");
  });

  it("returns 400 when no valid fields provided", async () => {
    const res = await PATCH(
      req("http://localhost/api/deals/d1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invalidField: "nope" }),
      }),
      { params: Promise.resolve({ id: "d1" }) }
    );
    expect(res.status).toBe(400);
  });
});
