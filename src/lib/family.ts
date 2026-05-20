import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function getFamilyId(): Promise<string | null> {
  try {
    const { userId } = await auth();
    if (!userId) return null;

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { familyId: true },
    });

    return user?.familyId ?? null;
  } catch {
    return null;
  }
}

export async function requireFamilyId(): Promise<string> {
  const id = await getFamilyId();
  if (!id) throw new Error("No family found for user");
  return id;
}
