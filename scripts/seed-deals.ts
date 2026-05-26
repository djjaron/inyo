import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

const deals = [
  {
    name: "Meridian AI — Series B",
    company: "Meridian AI",
    sector: "Enterprise AI",
    stage: "series-b",
    status: "ic-review",
    capitalAsk: 12000000,
    valuation: 85000000,
    dealScore: 82,
    affinityScore: 85,
    riskScore: 38,
    fundabilityScore: 88,
    sourceType: "network",
    sourceContact: "Marcus Webb",
    description: "Vertical LLM infrastructure for enterprise compliance teams. $8.4M ARR growing 3.2x YoY. 138% NRR. Targeting Fortune 1000.",
    website: "https://meridian.ai",
  },
  {
    name: "MedSync — Series A",
    company: "MedSync",
    sector: "HealthTech",
    stage: "series-a",
    status: "diligence",
    capitalAsk: 8000000,
    valuation: 42000000,
    dealScore: 71,
    affinityScore: 74,
    riskScore: 44,
    fundabilityScore: 76,
    sourceType: "inbound",
    sourceContact: null,
    description: "AI-powered clinical documentation for hospitals. $3.2M ARR, 2.8x YoY. 40 hospital customers across 12 states.",
    website: "https://medsync.ai",
  },
  {
    name: "PayFlow — Seed",
    company: "PayFlow",
    sector: "Fintech",
    stage: "seed",
    status: "reviewing",
    capitalAsk: 3000000,
    valuation: 15000000,
    dealScore: 58,
    affinityScore: 61,
    riskScore: 62,
    fundabilityScore: 64,
    sourceType: "lp-intro",
    sourceContact: "Jennifer Park, Sequoia",
    description: "Real-time B2B payment rails for mid-market. Pre-revenue. Ex-Stripe founding team targeting $40B SMB payments gap.",
    website: null,
  },
  {
    name: "Arcadia Defense — Series A",
    company: "Arcadia Defense",
    sector: "Defense Tech",
    stage: "series-a",
    status: "reviewing",
    capitalAsk: 15000000,
    valuation: 70000000,
    dealScore: 76,
    affinityScore: 79,
    riskScore: 41,
    fundabilityScore: 82,
    sourceType: "network",
    sourceContact: null,
    description: "Autonomous drone swarm software for DoD. $4.1M ARR, 100% YoY. SBIR Phase III. FedRAMP in progress.",
    website: null,
  },
  {
    name: "Terrace Bio — Pre-Seed",
    company: "Terrace Bio",
    sector: "Biotech",
    stage: "pre-seed",
    status: "inbound",
    capitalAsk: 2500000,
    valuation: 12000000,
    dealScore: 44,
    affinityScore: 42,
    riskScore: 71,
    fundabilityScore: 48,
    sourceType: "inbound",
    sourceContact: null,
    description: "mRNA delivery platform for rare metabolic diseases. Pre-clinical. Stanford spinout. Long timeline to revenue.",
    website: null,
  },
  {
    name: "Toolkit — Pre-Seed",
    company: "Toolkit",
    sector: "Enterprise AI",
    stage: "pre-seed",
    status: "inbound",
    capitalAsk: 5000000,
    valuation: null,
    dealScore: null,
    affinityScore: null,
    riskScore: null,
    fundabilityScore: null,
    sourceType: "inbound",
    sourceContact: null,
    description: "AI-powered internal tooling for enterprise teams.",
    website: null,
  },
];

async function main() {
  // Get or create family
  const families = await sql`SELECT id, name FROM families LIMIT 1`;
  let familyId: string;
  let familyName: string;

  if (families.length === 0) {
    const newFamily = await sql`
      INSERT INTO families (id, name, slug, tier, aum, "createdAt", "updatedAt")
      VALUES (gen_random_uuid()::text, 'Hartwell Family Office', 'hartwell', 'ultra', 250000000, NOW(), NOW())
      RETURNING id, name
    `;
    familyId = newFamily[0].id;
    familyName = newFamily[0].name;
    console.log("Created family:", familyId);
  } else {
    familyId = families[0].id;
    familyName = families[0].name;
  }
  console.log("Using family:", familyId, familyName);

  let created = 0;
  let updated = 0;

  for (const deal of deals) {
    const existing = await sql`
      SELECT id, "dealScore" FROM deals WHERE "familyId" = ${familyId} AND company = ${deal.company} LIMIT 1
    `;

    if (existing.length === 0) {
      await sql`
        INSERT INTO deals (
          id, "familyId", name, company, sector, stage, status,
          "capitalAsk", valuation, "dealScore", "affinityScore", "riskScore", "fundabilityScore",
          "sourceType", "sourceContact", description, website,
          "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid()::text, ${familyId}, ${deal.name}, ${deal.company},
          ${deal.sector}, ${deal.stage}, ${deal.status},
          ${deal.capitalAsk}, ${deal.valuation}, ${deal.dealScore},
          ${deal.affinityScore}, ${deal.riskScore}, ${deal.fundabilityScore},
          ${deal.sourceType}, ${deal.sourceContact}, ${deal.description}, ${deal.website},
          NOW(), NOW()
        )
      `;
      console.log(`  ✅ Created: ${deal.name} (score: ${deal.dealScore ?? "—"})`);
      created++;
    } else if (!existing[0].dealScore && deal.dealScore) {
      await sql`
        UPDATE deals SET
          "dealScore" = ${deal.dealScore},
          "affinityScore" = ${deal.affinityScore},
          "riskScore" = ${deal.riskScore},
          "fundabilityScore" = ${deal.fundabilityScore},
          description = ${deal.description},
          status = ${deal.status},
          "updatedAt" = NOW()
        WHERE id = ${existing[0].id}
      `;
      console.log(`  🔄 Updated: ${deal.name}`);
      updated++;
    } else {
      console.log(`  ⏭️  Exists:  ${deal.name}`);
    }
  }

  console.log(`\nDone — ${created} created, ${updated} updated.`);
}

main().catch((err) => { console.error(err); process.exit(1); });
