import { NextRequest, NextResponse, after } from "next/server";
import { prisma } from "@/lib/prisma";
import { runAgent } from "@/lib/agents/runtime";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function extractFamilyIdFromEmail(email: string): string | null {
  // Match deals+<familyId>@...
  const match = email.match(/deals\+([^@]+)@/i);
  return match ? match[1] : null;
}

function stripReplyChain(text: string): string {
  // Strip "On <date> ... wrote:" patterns and "-----Original Message"
  const stripped = text
    .replace(/On [\s\S]+?wrote:[\s\S]*$/m, "")
    .replace(/-----Original Message[\s\S]*$/i, "");
  return stripped.trim();
}

export function extractCompany(subject: string): string {
  // Remove common prefixes: "Intro:", "FWD:", "Re:", "Introduction:", "Deal:", "Opportunity:", "FW:"
  let s = subject
    .replace(/^(re|fwd|intro|introduction|fw|deal|opportunity):\s*/i, "")
    .trim();

  // Try to find company name before funding keywords
  const match = s.match(
    /^([^—\-:]+?)(?:\s+(?:series [a-d]|seed|pre-seed|raise|round|funding|\$\d))/i
  );
  if (match) return match[1].trim();

  // Try to extract before a dash or em-dash
  const dashMatch = s.match(/^([^—\-]+)(?:\s*[—\-])/);
  if (dashMatch) return dashMatch[1].trim();

  // Fall back to first 40 chars
  return s.slice(0, 40).trim() || "Email Deal";
}

// ─── POST Handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // ── Detect format ────────────────────────────────────────────────────────────
  // Simple JSON format: top-level `familyId` key present
  const isSimpleFormat = typeof body.familyId === "string";

  let familyId: string | null = null;
  let subject: string;
  let textBody: string;
  let fromDisplay: string;

  if (isSimpleFormat) {
    // Simple test / programmatic format
    familyId = (body.familyId as string) || null;
    subject = (body.subject as string) ?? "";
    textBody = (body.body as string) ?? "";
    fromDisplay = (body.from as string) ?? "";
  } else {
    // Postmark inbound webhook format
    // Prefer ToFull[0].Email for reliable parsing
    const toFull = body.ToFull as Array<{ Email?: string }> | undefined;
    const toEmail =
      toFull?.[0]?.Email ??
      (typeof body.To === "string" ? (body.To as string) : "");

    familyId = extractFamilyIdFromEmail(toEmail);

    // Check query param fallback
    if (!familyId) {
      familyId = req.nextUrl.searchParams.get("familyId");
    }

    // Check header fallback
    if (!familyId) {
      familyId = req.headers.get("x-family-id");
    }

    subject = (body.Subject as string) ?? "";
    textBody = (body.TextBody as string) ?? "";

    const fromFull = body.FromFull as { Email?: string; Name?: string } | undefined;
    fromDisplay =
      (body.FromName as string) ||
      fromFull?.Name ||
      fromFull?.Email ||
      (body.From as string) ||
      "";
  }

  // Final fallback
  if (!familyId) {
    familyId = "family_demo";
  }

  // ── Parse deal fields ────────────────────────────────────────────────────────

  const company = subject
    ? extractCompany(subject)
    : `Email Deal — ${new Date().toLocaleDateString()}`;

  const name = subject || `Email Deal — ${new Date().toLocaleDateString()}`;

  const cleanedBody = stripReplyChain(textBody);
  const description = cleanedBody.slice(0, 500) || null;

  const sourceContact = fromDisplay || null;
  const sourceType = "inbound-email";
  const status = "inbound";

  // ── Create deal ──────────────────────────────────────────────────────────────

  try {
    const deal = await prisma.deal.create({
      data: {
        familyId,
        company,
        name,
        description,
        sourceType,
        sourceContact,
        status,
      },
    });
    // Auto-score and enrich after response — same pipeline as POST /api/deals
    const dealContext = { company: deal.company, sector: "", stage: "", capitalAsk: 0, description: deal.description ?? "", dealId: deal.id };
    after(async () => {
      try {
        const scored = await runAgent({ agentType: "deal-flow", familyId: deal.familyId, context: dealContext, triggerType: "ingestion" });
        const score = (scored.result.score as number | undefined) ?? null;
        if (score != null) await prisma.deal.update({ where: { id: deal.id }, data: { dealScore: score } });
      } catch { /* best-effort */ }
      try {
        await runAgent({ agentType: "deal-enrichment", familyId: deal.familyId, context: dealContext, triggerType: "ingestion" });
      } catch { /* best-effort */ }
    });

    return NextResponse.json({ deal, parsed: true, familyId });
  } catch {
    const mockDeal = {
      id: `mock_${Date.now()}`,
      familyId,
      company,
      name,
      description,
      sourceType,
      sourceContact,
      status,
      _mock: true,
    };
    return NextResponse.json({ deal: mockDeal, parsed: true, familyId });
  }
}
