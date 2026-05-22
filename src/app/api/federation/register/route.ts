import { NextRequest, NextResponse } from "next/server";
import { registerInstance } from "@/lib/federation/client";
import { buildManifest } from "@/lib/federation/manifest";

export async function POST(req: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://inyo.app";
  const manifest = buildManifest(baseUrl);
  const result = await registerInstance(manifest);
  return NextResponse.json(result, { status: result.success ? 200 : 502 });
}
