import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Prisma before importing the route
vi.mock("@/lib/prisma", () => ({
  prisma: {
    deal: {
      create: vi.fn().mockImplementation(({ data }) =>
        Promise.resolve({ id: "d_new", ...data, createdAt: new Date() })
      ),
    },
  },
}));

import { NextRequest } from "next/server";
import { POST, extractCompany } from "@/app/api/ingest/email/route";

function makeRequest(body: unknown, url = "http://localhost/api/ingest/email") {
  return new NextRequest(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("extractCompany", () => {
  it("extracts company before 'Series A' from Postmark-style subject", () => {
    expect(extractCompany("Intro: TechCo Series A — $8M raise")).toBe("TechCo");
  });

  it("extracts company before funding keyword", () => {
    expect(extractCompany("Acme Corp Series B raise")).toBe("Acme Corp");
  });

  it("extracts company before dash", () => {
    expect(extractCompany("FWD: Verdant Bio — seed round")).toBe("Verdant Bio");
  });

  it("strips intro prefix", () => {
    expect(extractCompany("Introduction: Nexus Health Series C")).toBe("Nexus Health");
  });

  it("falls back to first 40 chars when no keywords found", () => {
    expect(extractCompany("Some Long Company Name Without Keywords")).toBe(
      "Some Long Company Name Without Keywords"
    );
  });

  it("returns Email Deal for empty subject", () => {
    expect(extractCompany("")).toBe("Email Deal");
  });
});

describe("POST /api/ingest/email — Postmark format", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("extracts familyId from To address", async () => {
    const { prisma } = await import("@/lib/prisma");
    const create = vi.mocked(prisma.deal.create);

    const res = await POST(
      makeRequest({
        From: "John Smith <john@vcfirm.com>",
        FromName: "John Smith",
        FromFull: { Email: "john@vcfirm.com", Name: "John Smith" },
        Subject: "Intro: TechCo Series A — $8M raise",
        TextBody: "Hi, wanted to introduce you to TechCo...",
        HtmlBody: "<html>...",
        To: "deals+fam_abc123@inyo-fo.netlify.app",
        ToFull: [{ Email: "deals+fam_abc123@inyo-fo.netlify.app" }],
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.parsed).toBe(true);
    expect(body.familyId).toBe("fam_abc123");
    expect(create).toHaveBeenCalledOnce();
    const callData = create.mock.calls[0]![0].data;
    expect(callData.familyId).toBe("fam_abc123");
  });

  it("extracts company name from subject", async () => {
    const { prisma } = await import("@/lib/prisma");
    const create = vi.mocked(prisma.deal.create);

    await POST(
      makeRequest({
        From: "sender@vc.com",
        Subject: "Intro: TechCo Series A — $8M raise",
        TextBody: "Details here",
        To: "deals+fam_1@example.com",
        ToFull: [{ Email: "deals+fam_1@example.com" }],
      })
    );

    const callData = create.mock.calls[0]![0].data;
    expect(callData.company).toBe("TechCo");
    expect(callData.sourceType).toBe("inbound-email");
    expect(callData.status).toBe("inbound");
  });

  it("returns deal and parsed:true on success", async () => {
    const res = await POST(
      makeRequest({
        From: "john@vc.com",
        Subject: "Deal: Acme Corp Series B",
        TextBody: "Check out Acme Corp.",
        To: "deals+fam_1@example.com",
        ToFull: [{ Email: "deals+fam_1@example.com" }],
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.parsed).toBe(true);
    expect(body.deal).toBeDefined();
    expect(body.deal.company).toBe("Acme Corp");
  });

  it("falls back to family_demo when no familyId found", async () => {
    const res = await POST(
      makeRequest({
        From: "john@vc.com",
        Subject: "Great Startup Seed Round",
        TextBody: "Interested?",
        To: "deals@example.com",
        ToFull: [{ Email: "deals@example.com" }],
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.familyId).toBe("family_demo");
  });

  it("strips reply chains from TextBody", async () => {
    const { prisma } = await import("@/lib/prisma");
    const create = vi.mocked(prisma.deal.create);

    await POST(
      makeRequest({
        From: "sender@vc.com",
        Subject: "Intro: CleanCo Series A",
        TextBody:
          "The company is really exciting.\n\nOn Mon, May 20, 2026 at 3:00 PM John wrote:\n> Original message here\n> More quoted text",
        To: "deals+fam_1@example.com",
        ToFull: [{ Email: "deals+fam_1@example.com" }],
      })
    );

    const callData = create.mock.calls[0]![0].data;
    expect(callData.description).not.toContain("Original message here");
    expect(callData.description).toContain("The company is really exciting.");
  });

  it("strips -----Original Message reply chains", async () => {
    const { prisma } = await import("@/lib/prisma");
    const create = vi.mocked(prisma.deal.create);

    await POST(
      makeRequest({
        From: "sender@vc.com",
        Subject: "Intro: SomeCo Seed",
        TextBody:
          "Forwarding this opportunity.\n\n-----Original Message-----\nFrom: someone@vc.com\nDetails...",
        To: "deals+fam_2@example.com",
        ToFull: [{ Email: "deals+fam_2@example.com" }],
      })
    );

    const callData = create.mock.calls[0]![0].data;
    expect(callData.description).not.toContain("Original Message");
    expect(callData.description).toBe("Forwarding this opportunity.");
  });
});

describe("POST /api/ingest/email — simple JSON format", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("accepts simple JSON format with familyId at top level", async () => {
    const res = await POST(
      makeRequest({
        familyId: "fam_1",
        subject: "Deal: Acme Corp Series B",
        body: "Great company building something cool.",
        from: "john@vc.com",
      })
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.parsed).toBe(true);
    expect(data.familyId).toBe("fam_1");
    expect(data.deal.company).toBe("Acme Corp");
  });

  it("extracts correct company from simple format subject", async () => {
    const { prisma } = await import("@/lib/prisma");
    const create = vi.mocked(prisma.deal.create);

    await POST(
      makeRequest({
        familyId: "fam_test",
        subject: "Intro: Meridian AI Series A — $12M raise",
        body: "Building enterprise AI.",
        from: "partner@fund.com",
      })
    );

    const callData = create.mock.calls[0]![0].data;
    expect(callData.company).toBe("Meridian AI");
    expect(callData.sourceContact).toBe("partner@fund.com");
  });

  it("returns mock deal on DB error", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.deal.create).mockRejectedValueOnce(new Error("DB down"));

    const res = await POST(
      makeRequest({
        familyId: "fam_1",
        subject: "Intro: FallbackCo Seed",
        body: "Test body",
        from: "test@vc.com",
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deal._mock).toBe(true);
    expect(body.deal.id).toMatch(/^mock_/);
    expect(body.parsed).toBe(true);
  });
});
