import { NextResponse } from "next/server";
import { sendHeartbeat } from "@/lib/federation/client";

export async function POST() {
  const result = await sendHeartbeat("inyo");
  return NextResponse.json(result, { status: result.success ? 200 : 502 });
}
