import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSydecarSPV, isSydecarConfigured } from "@/lib/integrations/sydecar";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const spv = await prisma.sPV.findUnique({
      where: { id, deletedAt: null },
      include: { investors: true },
    });

    if (!spv) {
      return NextResponse.json({ error: "SPV not found" }, { status: 404 });
    }

    // If no sydecarId or Sydecar not configured, return current state
    if (!spv.sydecarId || !isSydecarConfigured()) {
      return NextResponse.json({ spv });
    }

    // Fetch latest status from Sydecar
    const sydecarSpv = await getSydecarSPV(spv.sydecarId);

    const updatedSpv = await prisma.sPV.update({
      where: { id },
      data: {
        status: sydecarSpv.status ?? spv.status,
        sydecarUrl: sydecarSpv.dashboardUrl ?? spv.sydecarUrl,
      },
      include: { investors: true },
    });

    return NextResponse.json({ spv: updatedSpv });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Sydecar API error")) {
      return NextResponse.json({ error: `Sydecar sync failed: ${msg}` }, { status: 502 });
    }
    return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
  }
}
