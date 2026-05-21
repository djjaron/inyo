/**
 * Inyo LoRA Adapter endpoint
 *
 * GET  /api/integrations/lora  — returns Inyo tenant context for external platforms
 * POST /api/integrations/lora  — receives action calls and routes to Inyo agents
 *
 * Auth: INYO_LORA_SECRET header (x-inyo-secret). If unset, open during development.
 */

import { NextRequest, NextResponse } from "next/server";
import { buildLoraContext, routeLoraAction } from "@/lib/integrations/lora-adapter";
import { prisma } from "@/lib/prisma";
import { getFamilyId } from "@/lib/family";

function verifySecret(req: NextRequest): boolean {
  const secret = process.env.INYO_LORA_SECRET;
  if (!secret) return true;
  return req.headers.get("x-inyo-secret") === secret;
}

export async function GET(req: NextRequest) {
  if (!verifySecret(req)) {
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

    return NextResponse.json(
      buildLoraContext({
        familyName: family?.name ?? "Family Office",
        activeDeals,
        portfolioCompanies,
        baseUrl,
      })
    );
  } catch {
    return NextResponse.json(
      buildLoraContext({ familyName: "Family Office", baseUrl })
    );
  }
}

export async function POST(req: NextRequest) {
  if (!verifySecret(req)) {
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
    const res = await routeLoraAction(action, payload, baseUrl);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Action failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
