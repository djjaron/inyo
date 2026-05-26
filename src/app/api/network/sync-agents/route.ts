import { NextResponse } from "next/server";
import { buildManifest } from "@/lib/federation/manifest";
import { syncAgents, enableMarketplace } from "@/lib/federation/client";

export async function POST() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://inyo.app";
  const manifest = buildManifest(baseUrl);

  // Ensure marketplace is enabled first (idempotent)
  await enableMarketplace();

  const result = await syncAgents(manifest.capabilities);

  return NextResponse.json(result, { status: result.success ? 200 : 502 });
}
