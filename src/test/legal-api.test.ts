import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    document: {
      create: vi.fn().mockResolvedValue({
        id: "doc_1",
        name: "test.txt",
        type: "other",
        textContent: "hello",
        mimeType: "text/plain",
        familyId: "fam_1",
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      findMany: vi.fn().mockResolvedValue([
        { id: "doc_m1", name: "Test Doc", type: "safe", createdAt: new Date() },
      ]),
    },
  },
}));

vi.mock("@/lib/agents/runtime", () => ({
  runAgent: vi.fn().mockResolvedValue({
    result: {
      documentType: "NDA",
      riskLevel: "low",
      flags: [],
      keyTerms: {},
      recommendation: "Clean document.",
    },
    model: "claude-opus-4-7",
    tokensUsed: 800,
  }),
}));

import { NextRequest } from "next/server";
import { POST as legalPOST } from "@/app/api/agents/legal/route";
import { GET as documentsGET } from "@/app/api/documents/route";

function makeJsonRequest(url: string, body: unknown) {
  return new NextRequest(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ─── POST /api/agents/legal ────────────────────────────────────────────────

describe("POST /api/agents/legal", () => {
  it("returns 400 without familyId", async () => {
    const res = await legalPOST(
      makeJsonRequest("http://localhost/api/agents/legal", {
        documentContent: "This is a contract...",
      })
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("familyId");
  });

  it("returns 400 without documentContent", async () => {
    const res = await legalPOST(
      makeJsonRequest("http://localhost/api/agents/legal", {
        familyId: "fam_1",
      })
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("documentContent");
  });

  it("returns mock with required fields when ANTHROPIC_API_KEY is not set", async () => {
    // ANTHROPIC_API_KEY is empty string per setup.ts
    const res = await legalPOST(
      makeJsonRequest("http://localhost/api/agents/legal", {
        familyId: "fam_1",
        documentContent: "This is a SAFE agreement...",
        documentName: "SAFE Note.pdf",
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.analysis._mock).toBe(true);
    const result = body.result;
    expect(result).toHaveProperty("documentType");
    expect(result).toHaveProperty("riskLevel");
    expect(result).toHaveProperty("flags");
    expect(Array.isArray(result.flags)).toBe(true);
    expect(result).toHaveProperty("keyTerms");
    expect(result).toHaveProperty("recommendation");
  });

  it("mock result has all flag fields", async () => {
    const res = await legalPOST(
      makeJsonRequest("http://localhost/api/agents/legal", {
        familyId: "fam_1",
        documentContent: "Agreement text...",
      })
    );
    const { result } = await res.json();
    expect(result.flags.length).toBeGreaterThan(0);
    const flag = result.flags[0];
    expect(flag).toHaveProperty("clause");
    expect(flag).toHaveProperty("issue");
    expect(flag).toHaveProperty("severity");
  });
});

// ─── GET /api/documents ────────────────────────────────────────────────────

describe("GET /api/documents", () => {
  it("returns 400 without familyId", async () => {
    const req = new NextRequest("http://localhost/api/documents");
    const res = await documentsGET(req);
    expect(res.status).toBe(400);
  });

  it("returns documents array", async () => {
    const req = new NextRequest("http://localhost/api/documents?familyId=fam_1");
    const res = await documentsGET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.documents)).toBe(true);
    expect(body.documents.length).toBeGreaterThan(0);
  });

  it("returns mock documents on DB error", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.document.findMany).mockRejectedValueOnce(new Error("DB down"));

    const req = new NextRequest("http://localhost/api/documents?familyId=fam_1");
    const res = await documentsGET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.documents)).toBe(true);
    // Mock data includes _mock flag
    expect(body.documents[0]._mock).toBe(true);
  });
});

// ─── POST /api/upload/document — oversized file test ─────────────────────

describe("POST /api/upload/document", () => {
  it("returns 413 for oversized files", async () => {
    const { POST: uploadPOST } = await import("@/app/api/upload/document/route");

    // Create a large enough buffer to exceed the 10 MB limit
    const OVER_10MB = 10 * 1024 * 1024 + 1;
    const bigBuffer = Buffer.alloc(OVER_10MB, "x");
    const file = new File([bigBuffer], "big.txt", { type: "text/plain" });

    const formData = new FormData();
    formData.append("file", file);
    formData.append("familyId", "fam_1");

    const req = new NextRequest("http://localhost/api/upload/document", {
      method: "POST",
      body: formData,
    });

    const res = await uploadPOST(req);
    expect(res.status).toBe(413);
  });

  it("returns 400 when familyId is missing", async () => {
    const { POST: uploadPOST } = await import("@/app/api/upload/document/route");

    const file = new File(["hello"], "test.txt", { type: "text/plain" });
    const formData = new FormData();
    formData.append("file", file);

    const req = new NextRequest("http://localhost/api/upload/document", {
      method: "POST",
      body: formData,
    });

    const res = await uploadPOST(req);
    expect(res.status).toBe(400);
  });
});
