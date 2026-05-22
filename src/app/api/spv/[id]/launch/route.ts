import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createSydecarSPV,
  addSydecarInvestor,
  isSydecarConfigured,
} from "@/lib/integrations/sydecar";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const useSydecar = isSydecarConfigured();

  // Fetch SPV with investors
  let spv: {
    id: string;
    name: string;
    spvType: string;
    managementFee: number | null;
    carry: number | null;
    description: string | null;
    sydecarId: string | null;
    investors: {
      id: string;
      name: string;
      email: string;
      commitment: number;
    }[];
  } | null = null;

  try {
    spv = await prisma.sPV.findUnique({
      where: { id, deletedAt: null },
      include: { investors: true },
    });
  } catch {
    // DB unavailable
    if (!useSydecar) {
      return NextResponse.json({
        launched: true,
        _mock: true,
        sydecarId: "mock_spv_demo",
        spv: {
          id,
          status: "launching",
          launchedAt: new Date(),
          sydecarId: "mock_spv_demo",
          sydecarUrl: null,
        },
      });
    }
    return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
  }

  if (!spv) {
    return NextResponse.json({ error: "SPV not found" }, { status: 404 });
  }

  // No API key — return mock success
  if (!useSydecar) {
    let updatedSpv;
    try {
      updatedSpv = await prisma.sPV.update({
        where: { id },
        data: {
          status: "launching",
          launchedAt: new Date(),
          sydecarId: "mock_spv_demo",
        },
        include: { investors: true },
      });
    } catch {
      updatedSpv = { ...spv, status: "launching", launchedAt: new Date(), sydecarId: "mock_spv_demo" };
    }
    return NextResponse.json({
      launched: true,
      _mock: true,
      sydecarId: "mock_spv_demo",
      spv: updatedSpv,
    });
  }

  // Live Sydecar path
  try {
    // Create SPV at Sydecar
    const sydecarSpv = await createSydecarSPV({
      name: spv.name,
      type: spv.spvType as "syndicate" | "secondary" | "layered",
      managementFee: spv.managementFee ?? undefined,
      carry: spv.carry ?? undefined,
      description: spv.description ?? undefined,
    });

    // Persist sydecarId immediately so we don't lose it if investor sync fails
    let updatedSpv;
    try {
      updatedSpv = await prisma.sPV.update({
        where: { id },
        data: {
          sydecarId: sydecarSpv.id,
          sydecarUrl: sydecarSpv.dashboardUrl ?? null,
          status: "launching",
          launchedAt: new Date(),
        },
        include: { investors: true },
      });
    } catch {
      updatedSpv = {
        ...spv,
        sydecarId: sydecarSpv.id,
        sydecarUrl: sydecarSpv.dashboardUrl ?? null,
        status: "launching",
        launchedAt: new Date(),
      };
    }

    // Sync investors — per-investor try/catch so one failure doesn't abort all
    for (const investor of spv.investors) {
      try {
        const { person, profile } = await addSydecarInvestor(sydecarSpv.id, {
          name: investor.name,
          email: investor.email,
          commitment: investor.commitment,
        });
        try {
          await prisma.sPVInvestor.update({
            where: { id: investor.id },
            data: {
              sydecarPersonId: person.id,
              sydecarProfileId: profile.id,
            },
          });
        } catch {
          // DB update failed — sydecar IDs not persisted locally, non-fatal
        }
      } catch {
        // Sydecar investor sync failed — non-fatal, continue with remaining investors
      }
    }

    return NextResponse.json({
      launched: true,
      sydecarId: sydecarSpv.id,
      spv: updatedSpv,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Sydecar API error: ${msg}` },
      { status: 502 }
    );
  }
}
