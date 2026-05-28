// Netlify Scheduled Function — runs every 5 minutes
// Sends a heartbeat to the Dividen network to keep the Inyo instance alive

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Config = any;

export default async () => {
  const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://inyo-fo.netlify.app";

  try {
    const res = await fetch(`${BASE}/api/network/heartbeat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) {
      const data = await res.json();
      console.log("[heartbeat] success", JSON.stringify(data));
    } else {
      console.error("[heartbeat] failed with status", res.status, await res.text().catch(() => ""));
    }
  } catch (e) {
    console.error("[heartbeat] error:", e);
  }
};

export const config: Config = {
  schedule: "*/5 * * * *",
};
