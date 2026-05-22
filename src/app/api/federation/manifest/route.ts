import { NextResponse } from "next/server";
import { buildManifest } from "@/lib/federation/manifest";

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://inyo.app";
  const manifest = buildManifest(baseUrl);
  return NextResponse.json(manifest);
}
