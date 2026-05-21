import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getFamilyId } from "@/lib/family";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const familyId = await getFamilyId();
  if (!familyId) {
    return NextResponse.json({ error: "No family found for user" }, { status: 401 });
  }

  return NextResponse.json({ familyId, userId });
}
