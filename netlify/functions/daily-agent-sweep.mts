// Netlify Scheduled Function — runs daily at 9 AM UTC
// Triggers portfolio-monitor for every portfolio company and CFO summary for each family

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Config = any;

export default async () => {
  const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://inyo-fo.netlify.app";

  const headers: Record<string, string> = { "Content-Type": "application/json" };

  // Fetch families and portfolio companies from the app's own API
  try {
    const familiesRes = await fetch(`${BASE}/api/families`, { headers });
    if (!familiesRes.ok) {
      // No families API yet — fall back to querying the DB directly if env is available
      console.log("[sweep] families API not available, skipping");
      return;
    }
    const { families } = (await familiesRes.json()) as { families: Array<{ id: string; name: string }> };

    for (const family of families) {
      const fid = family.id;

      // CFO daily summary
      try {
        await fetch(`${BASE}/api/agents/cfo`, {
          method: "POST",
          headers,
          body: JSON.stringify({ familyId: fid, query: "Generate today's daily cash position and liquidity summary", triggerType: "scheduled" }),
        });
        console.log(`[sweep] CFO done for ${fid}`);
      } catch (e) {
        console.error(`[sweep] CFO failed for ${fid}:`, e);
      }

      // Portfolio Monitor — one call per company
      try {
        const portRes = await fetch(`${BASE}/api/portfolio?familyId=${encodeURIComponent(fid)}`, { headers });
        if (portRes.ok) {
          const { companies } = (await portRes.json()) as { companies: Array<{ id: string; name: string; sector: string; investedAmount: number; currentValue: number; alertLevel: string }> };
          for (const co of companies) {
            await fetch(`${BASE}/api/agents/portfolio-monitor`, {
              method: "POST",
              headers,
              body: JSON.stringify({
                familyId: fid,
                context: { id: co.id, name: co.name, sector: co.sector, investedAmount: co.investedAmount, currentValue: co.currentValue, alertLevel: co.alertLevel },
                triggerType: "scheduled",
              }),
            });
          }
          console.log(`[sweep] portfolio-monitor done for ${fid} (${companies.length} companies)`);
        }
      } catch (e) {
        console.error(`[sweep] portfolio-monitor failed for ${fid}:`, e);
      }
    }
  } catch (e) {
    console.error("[sweep] fatal error:", e);
  }
};

export const config: Config = {
  schedule: "0 9 * * *",
};
