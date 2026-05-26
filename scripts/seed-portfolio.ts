import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

const companies = [
  {
    name: "ClearReg",
    sector: "RegTech",
    stage: "growth",
    status: "active",
    investedAmount: 25000000,
    currentValue: 38500000,
    ownership: 4.2,
    investedAt: "2024-09-15",
    lastFundingDate: "2025-01-20",
    lastFundingRound: "Series C",
    website: "https://clearreg.io",
    description: "Regulatory reporting automation for financial services. $28M ARR, 180% NRR.",
    alertLevel: "normal",
  },
  {
    name: "Volta Energy",
    sector: "Climate Tech",
    stage: "series-b",
    status: "watchlist",
    investedAmount: 8000000,
    currentValue: 6200000,
    ownership: 2.8,
    investedAt: "2023-05-10",
    lastFundingDate: "2023-05-10",
    lastFundingRound: "Series B",
    website: "https://volta.energy",
    description: "Grid-scale battery storage and demand response platform. Revenue declined 18% last quarter.",
    alertLevel: "watch",
  },
  {
    name: "Apex Logistics",
    sector: "Supply Chain",
    stage: "series-c",
    status: "active",
    investedAmount: 15000000,
    currentValue: 31000000,
    ownership: 3.1,
    investedAt: "2022-11-01",
    lastFundingDate: "2024-06-01",
    lastFundingRound: "Series D",
    website: "https://apexlogistics.com",
    description: "AI freight optimization platform. 2.1x MOIC. Strong growth in cross-border.",
    alertLevel: "normal",
  },
  {
    name: "Helix Medical",
    sector: "HealthTech",
    stage: "series-a",
    status: "active",
    investedAmount: 5000000,
    currentValue: 9500000,
    ownership: 6.7,
    investedAt: "2023-08-22",
    lastFundingDate: "2024-03-15",
    lastFundingRound: "Series B",
    website: "https://helixmedical.com",
    description: "Remote patient monitoring for post-surgical care. 40 hospital partnerships.",
    alertLevel: "normal",
  },
  {
    name: "Nuvola Cloud",
    sector: "Cloud Infrastructure",
    stage: "series-b",
    status: "exited",
    investedAmount: 10000000,
    currentValue: 42000000,
    ownership: 0,
    investedAt: "2021-03-10",
    lastFundingDate: "2022-10-01",
    lastFundingRound: "Acquisition",
    website: null,
    description: "Acquired by AWS for $420M. 4.2x MOIC. Full exit completed Q4 2024.",
    alertLevel: "normal",
  },
  {
    name: "Strata Security",
    sector: "Cybersecurity",
    stage: "series-a",
    status: "watchlist",
    investedAmount: 4000000,
    currentValue: 3200000,
    ownership: 5.5,
    investedAt: "2023-01-15",
    lastFundingDate: "2023-01-15",
    lastFundingRound: "Series A",
    website: "https://stratasecurity.io",
    description: "Zero-trust network security for mid-market. Revenue flat. CEO recently departed.",
    alertLevel: "alert",
  },
];

const alerts = [
  {
    companyName: "Strata Security",
    type: "executive-departure",
    severity: "critical",
    title: "CEO Marcus Chen resigned — board searching for replacement",
    body: "Marcus Chen tendered his resignation effective immediately. The board has engaged Korn Ferry for an executive search.",
    source: "Company Update",
  },
  {
    companyName: "Volta Energy",
    type: "burn-rate",
    severity: "warning",
    title: "Runway extended to 14 months after bridge financing",
    body: "Volta closed a $6M bridge round led by existing investors. New CFO joining in 30 days.",
    source: "Quarterly Update",
  },
  {
    companyName: "ClearReg",
    type: "funding",
    severity: "info",
    title: "Series D process launching — targeting $80M at $400M pre",
    body: "Goldman Sachs Growth engaged as placement agent. Process expected to close Q3 2026.",
    source: "Board Meeting",
  },
];

async function main() {
  const families = await sql`SELECT id FROM families LIMIT 1`;
  if (families.length === 0) {
    console.error("No family found — run seed-deals.ts first");
    process.exit(1);
  }
  const familyId = families[0].id;
  console.log("Using family:", familyId);

  // Check existing columns
  const cols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'portfolio_companies'`;
  const colNames = new Set(cols.map((c) => c.column_name));

  let created = 0;
  for (const co of companies) {
    const existing = await sql`SELECT id FROM portfolio_companies WHERE "familyId" = ${familyId} AND name = ${co.name} LIMIT 1`;
    if (existing.length === 0) {
      const hasFamily = colNames.has("familyId");
      if (hasFamily) {
        await sql`
          INSERT INTO portfolio_companies (
            id, "familyId", name, sector, stage, status,
            "investedAmount", "currentValue", ownership,
            "investedAt", "lastFundingDate", "lastFundingRound",
            website, description, "alertLevel",
            "createdAt", "updatedAt"
          ) VALUES (
            gen_random_uuid()::text, ${familyId}, ${co.name}, ${co.sector}, ${co.stage}, ${co.status},
            ${co.investedAmount}, ${co.currentValue}, ${co.ownership},
            ${co.investedAt}::date, ${co.lastFundingDate ? co.lastFundingDate : null}::date, ${co.lastFundingRound},
            ${co.website}, ${co.description}, ${co.alertLevel},
            NOW(), NOW()
          )
        `;
      } else {
        await sql`
          INSERT INTO portfolio_companies (
            id, name, sector, stage, status,
            "investedAmount", "currentValue", ownership,
            "investedAt", "lastFundingDate", "lastFundingRound",
            website, description, "alertLevel",
            "createdAt", "updatedAt"
          ) VALUES (
            gen_random_uuid()::text, ${co.name}, ${co.sector}, ${co.stage}, ${co.status},
            ${co.investedAmount}, ${co.currentValue}, ${co.ownership},
            ${co.investedAt}::date, ${co.lastFundingDate ? co.lastFundingDate : null}::date, ${co.lastFundingRound},
            ${co.website}, ${co.description}, ${co.alertLevel},
            NOW(), NOW()
          )
        `;
      }
      console.log(`  ✅ Created: ${co.name}`);
      created++;
    } else {
      console.log(`  ⏭️  Exists:  ${co.name}`);
    }
  }

  // Seed alerts
  let alertsCreated = 0;
  for (const alert of alerts) {
    const company = await sql`SELECT id FROM portfolio_companies WHERE name = ${alert.companyName} AND "familyId" = ${familyId} LIMIT 1`;
    if (company.length === 0) {
      console.log(`  ⚠️  Company not found for alert: ${alert.companyName}`);
      continue;
    }
    const companyId = company[0].id;
    const existingAlert = await sql`SELECT id FROM portfolio_alerts WHERE "companyId" = ${companyId} AND title = ${alert.title} LIMIT 1`;
    if (existingAlert.length === 0) {
      await sql`
        INSERT INTO portfolio_alerts (id, "companyId", type, severity, title, body, source, "createdAt")
        VALUES (gen_random_uuid()::text, ${companyId}, ${alert.type}, ${alert.severity}, ${alert.title}, ${alert.body}, ${alert.source}, NOW())
      `;
      console.log(`  ✅ Alert: ${alert.title.slice(0, 50)}...`);
      alertsCreated++;
    }
  }

  console.log(`\nDone — ${created} companies, ${alertsCreated} alerts created.`);
}

main().catch((err) => { console.error(err); process.exit(1); });
