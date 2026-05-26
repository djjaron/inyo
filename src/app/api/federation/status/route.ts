import { NextResponse } from "next/server";
import { getFederationStatus } from "@/lib/federation/client";
import { buildManifest } from "@/lib/federation/manifest";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://inyo.app";
  const manifest = buildManifest(baseUrl);
  const federationStatus = await getFederationStatus();

  let totalRuns = 0;
  let recentRuns: unknown[] = [];
  try {
    [totalRuns, recentRuns] = await Promise.all([
      prisma.agentRun.count(),
      prisma.agentRun.findMany({
        orderBy: { createdAt: "desc" },
        take: 25,
        select: { id: true, agentType: true, status: true, familyId: true, createdAt: true, completedAt: true },
      }),
    ]);
  } catch {
    // DB unavailable
  }

  return NextResponse.json({
    manifest,
    federation: federationStatus,
    stats: { totalRuns, recentRuns },
  });
}
