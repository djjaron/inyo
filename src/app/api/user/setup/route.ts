import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { family: true },
    });

    if (user?.family) {
      return NextResponse.json({ user, family: user.family });
    }

    // First time — create family from Clerk profile
    const clerkUser = await currentUser();
    const name = clerkUser?.fullName ?? clerkUser?.emailAddresses?.[0]?.emailAddress?.split("@")[0] ?? "My Family Office";
    const email = clerkUser?.emailAddresses?.[0]?.emailAddress;

    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").slice(0, 32) + "-" + userId.slice(-6);

    const family = await prisma.family.create({
      data: { name: `${name} Family Office`, slug },
    });

    const newUser = await prisma.user.create({
      data: { clerkId: userId, email, name, familyId: family.id },
      include: { family: true },
    });

    return NextResponse.json({ user: newUser, family });
  } catch (err) {
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}
