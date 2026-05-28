import { NextResponse } from "next/server";
import { getFederationStatus } from "@/lib/federation/client";
import { buildManifest } from "@/lib/federation/manifest";

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://inyo.app";
  const manifest = buildManifest(baseUrl);
  const federation = await getFederationStatus();

  return NextResponse.json({
    instanceId: federation.instanceId ?? "inyo",
    registered: federation.registered,
    lastHeartbeatAt: federation.lastHeartbeatAt,
    agentCount: manifest.capabilities.length,
    instanceUrl: baseUrl,
    _mock: federation._mock,
  });
}
