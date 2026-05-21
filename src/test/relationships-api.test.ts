import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    contact: {
      findMany: vi.fn().mockResolvedValue([
        {
          id: "contact_1",
          familyId: "fam_1",
          name: "Sarah Chen",
          email: "sarah@meridianai.com",
          company: "Meridian AI",
          title: "CEO",
          type: "founder",
          lastContactAt: new Date("2026-05-15"),
          introducedBy: null,
          warmPathNotes: null,
          notes: null,
        },
      ]),
    },
    interaction: {
      findMany: vi.fn().mockResolvedValue([
        {
          id: "i_1",
          type: "meeting",
          subject: "IC presentation — Phalanx Series C",
          occurredAt: new Date("2026-05-19"),
          contact: { name: "Carlos Reyes" },
        },
        {
          id: "i_2",
          type: "email",
          subject: "Q1 business update + data room access",
          occurredAt: new Date("2026-05-14"),
          contact: { name: "Sarah Chen" },
        },
      ]),
    },
  },
}));

vi.mock("@/lib/agents/runtime", () => ({
  runAgent: vi.fn().mockResolvedValue({
    result: {
      answer: "You have strong connections at this firm.",
      contacts: ["Alice", "Bob"],
      suggestedActions: ["Schedule a call"],
    },
    model: "claude-opus-4-7",
    tokensUsed: 800,
  }),
}));

import { NextRequest } from "next/server";
import { GET as contactsGET } from "@/app/api/contacts/route";
import { GET as interactionsGET } from "@/app/api/interactions/route";
import { POST as relationshipsPOST } from "@/app/api/agents/relationships/route";

function makeGET(url: string) {
  return new NextRequest(url, { method: "GET" });
}

function makePOST(url: string, body: unknown) {
  return new NextRequest(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ── GET /api/contacts ──────────────────────────────────────────────────────

describe("GET /api/contacts", () => {
  it("returns contacts array", async () => {
    const res = await contactsGET(makeGET("http://localhost/api/contacts?familyId=fam_1"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.contacts)).toBe(true);
    expect(body.contacts.length).toBeGreaterThan(0);
  });

  it("contact shape has expected fields", async () => {
    const res = await contactsGET(makeGET("http://localhost/api/contacts?familyId=fam_1"));
    const { contacts } = await res.json();
    const c = contacts[0];
    expect(c).toHaveProperty("id");
    expect(c).toHaveProperty("name");
    expect(c).toHaveProperty("type");
  });
});

// ── GET /api/interactions ──────────────────────────────────────────────────

describe("GET /api/interactions", () => {
  it("returns interactions with contact names", async () => {
    const res = await interactionsGET(makeGET("http://localhost/api/interactions?familyId=fam_1"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.interactions)).toBe(true);
    expect(body.interactions.length).toBeGreaterThan(0);
  });

  it("each interaction has contact.name", async () => {
    const res = await interactionsGET(makeGET("http://localhost/api/interactions?familyId=fam_1"));
    const { interactions } = await res.json();
    for (const i of interactions) {
      expect(i.contact).toBeDefined();
      expect(typeof i.contact.name).toBe("string");
    }
  });

  it("returns mock fallback when no familyId provided", async () => {
    const res = await interactionsGET(makeGET("http://localhost/api/interactions"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.interactions)).toBe(true);
  });
});

// ── POST /api/agents/relationships ────────────────────────────────────────

describe("POST /api/agents/relationships", () => {
  it("returns 400 when familyId is missing", async () => {
    const res = await relationshipsPOST(
      makePOST("http://localhost/api/agents/relationships", {
        query: "Who do I know at Andreessen?",
      })
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it("returns 400 when query is missing", async () => {
    const res = await relationshipsPOST(
      makePOST("http://localhost/api/agents/relationships", {
        familyId: "fam_1",
      })
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it("returns mock result when ANTHROPIC_API_KEY is not set", async () => {
    // ANTHROPIC_API_KEY is empty string in setup.ts — triggers mock branch
    const res = await relationshipsPOST(
      makePOST("http://localhost/api/agents/relationships", {
        familyId: "fam_1",
        query: "Who do I know at Andreessen Horowitz?",
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body._mock).toBe(true);
    expect(body.result).toBeDefined();
  });

  it("mock result has required fields: answer, contacts, suggestedActions", async () => {
    const res = await relationshipsPOST(
      makePOST("http://localhost/api/agents/relationships", {
        familyId: "fam_1",
        query: "Find warm path to Stripe",
      })
    );
    expect(res.status).toBe(200);
    const { result } = await res.json();
    expect(typeof result.answer).toBe("string");
    expect(Array.isArray(result.contacts)).toBe(true);
    expect(Array.isArray(result.suggestedActions)).toBe(true);
  });
});
