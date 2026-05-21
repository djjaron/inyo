/**
 * Kase (gpodz) LoRA Adapter endpoint
 *
 * GET  /api/integrations/kase  — returns tenant context for Kase to load
 * POST /api/integrations/kase  — receives action calls from Kase and routes them to Inyo agents
 *
 * Authenticate requests using KASE_WEBHOOK_SECRET (set in Netlify env vars).
 */

import { NextRequest, NextResponse } from "next/server";
import { buildKaseTenantContext, forwardKaseAction } from "@/lib/integrations/kase";
import { prisma } from "@/lib/prisma";
import { getFamilyId } from "@/lib/family";

function verifyKaseSecret(req: NextRequest): boolean {
  const secret = process.env.KASE_WEBHOOK_SECRET;
  if (!secret) return true; // Not configured yet — allow during development
  return req.headers.get("x-kase-secret") === secret;
}

export async function GET(req: NextRequest) {
  if (!verifyKaseSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? `https://${req.headers.get("host")}`;

  try {
    const familyId = await getFamilyId();
    if (!familyId) {
      return NextResponse.json({ error: "No family context" }, { status: 404 });
    }

    const family = await prisma.family.findUnique({ where: { id: familyId } });
    const activeDeals = await prisma.deal.count({
      where: { familyId, status: { notIn: ["passed", "archived"] } },
    });
    const portfolioCompanies = await prisma.portfolioCompany.count({ where: { familyId } });

    const context = buildKaseTenantContext({
      familyName: family?.name ?? "Family Office",
      activeDeals,
      portfolioCompanies,
      baseUrl,
    });

    return NextResponse.json(context);
  } catch {
    // Fallback for demo/no-DB state
    const context = buildKaseTenantContext({
      familyName: "Family Office",
      baseUrl,
    });
    return NextResponse.json(context);
  }
}

export async function POST(req: NextRequest) {
  if (!verifyKaseSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { action, payload } = body as {
    action?: string;
    payload?: Record<string, unknown>;
  };

  if (!action || !payload) {
    return NextResponse.json({ error: "action and payload required" }, { status: 400 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? `https://${req.headers.get("host")}`;

  try {
    const agentRes = await forwardKaseAction(action, payload, baseUrl);
    const data = await agentRes.json();
    return NextResponse.json(data, { status: agentRes.status });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Action failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
