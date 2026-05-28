import { NextResponse } from "next/server";

export const runtime = "edge";

export function GET() {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "https://inyo.app";

  const agentCard = {
    schema_version: "1.0",
    name: "Inyo",
    description: "Private AI operating system for modern family offices",
    url: baseUrl,
    version: "1.0.0",
    protocol: "dividen/1.0",
    developer: {
      name: "Inyo",
      url: baseUrl,
    },
    capabilities: [
      "deal-flow",
      "ic-memo",
      "portfolio-monitor",
      "cfo",
      "legal",
      "tax",
      "chief-of-staff",
      "concierge",
      "philanthropy",
      "relationships",
      "deal-enrichment",
      "term-sheet",
      "diligence",
    ],
    endpoints: {
      tasks: `${baseUrl}/api/federation/tasks`,
      manifest: `${baseUrl}/api/federation/manifest`,
      health: `${baseUrl}/api/federation/status`,
    },
    tags: ["family-office", "investment", "wealth-management", "legal", "tax"],
    supportsA2A: true,
    inputFormat: "json",
    outputFormat: "json",
  };

  return NextResponse.json(agentCard, {
    headers: {
      "Cache-Control": "public, max-age=300",
      "Content-Type": "application/json",
    },
  });
}
