import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Fetch document first — 404 if not found or soft-deleted
  let document;
  try {
    document = await prisma.document.findUnique({
      where: { id },
      select: { id: true, deletedAt: true },
    });
  } catch (err) {
    console.error("Document lookup failed:", err);
    return NextResponse.json({ versions: [] });
  }

  if (!document || document.deletedAt !== null) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // Fetch versions
  try {
    const rows = await prisma.documentVersion.findMany({
      where: { documentId: id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        checksum: true,
        mimeType: true,
        createdAt: true,
        textContent: true,
      },
    });

    const versions = rows.map((v) => ({
      id: v.id,
      name: v.name,
      checksum: v.checksum,
      mimeType: v.mimeType,
      createdAt: v.createdAt,
      textLength: v.textContent?.length ?? 0,
    }));

    return NextResponse.json({ versions });
  } catch (err) {
    console.error("Versions fetch failed:", err);
    return NextResponse.json({ versions: [] });
  }
}
