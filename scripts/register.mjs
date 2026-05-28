#!/usr/bin/env node
// One-shot script: register Inyo with the Dividen network and save the
// returned DIVIDEN_PLATFORM_TOKEN to .env.local automatically.
//
// Usage: node scripts/register.mjs

import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const ROOT = new URL("..", import.meta.url).pathname;
const ENV_PATH = resolve(ROOT, ".env.local");
const DIVIDEN_BASE = "https://dividen.ai";

// Read current .env.local
let envContents = "";
try {
  envContents = readFileSync(ENV_PATH, "utf8");
} catch {
  console.error("Could not read .env.local — make sure you're in the project root.");
  process.exit(1);
}

// API key: CLI arg > env var > .env.local
const apiKey =
  process.argv[2] ||
  process.env.DIVIDEN_API_KEY ||
  envContents.match(/^DIVIDEN_API_KEY\s*=\s*"?([^"\n]+)"?/m)?.[1] ||
  null;

if (!apiKey) {
  console.error("No DIVIDEN_API_KEY found. Provide it one of three ways:");
  console.error("  node scripts/register.mjs <your-api-key>");
  console.error("  DIVIDEN_API_KEY=<key> node scripts/register.mjs");
  console.error("  Add DIVIDEN_API_KEY=<key> to .env.local");
  process.exit(1);
}

// Parse NEXT_PUBLIC_APP_URL from env
const appUrlMatch = envContents.match(/^NEXT_PUBLIC_APP_URL\s*=\s*"?([^"\n]+)"?/m);
const baseUrl = (appUrlMatch?.[1] ?? "https://inyo-fo.netlify.app").replace(/\/$/, "");

console.log(`Registering Inyo with Dividen...`);
console.log(`  Instance URL: ${baseUrl}`);
console.log(`  Hub: ${DIVIDEN_BASE}`);
console.log();

let data;
try {
  const res = await fetch(`${DIVIDEN_BASE}/api/v2/federation/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Inyo",
      description: "Private AI operating system for modern family offices",
      baseUrl,
      apiKey,
      version: "1.0.0",
      tags: ["family-office", "investment", "wealth-management", "legal", "tax"],
      endpoints: {
        manifest: `${baseUrl}/api/federation/manifest`,
        inbound: `${baseUrl}/api/federation/tasks`,
        health: `${baseUrl}/api/federation/status`,
      },
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    console.error(`Dividen API returned ${res.status}:`);
    console.error(text);
    process.exit(1);
  }

  data = JSON.parse(text);
} catch (err) {
  console.error("Request failed:", err.message);
  process.exit(1);
}

console.log("Response from Dividen:");
console.log(JSON.stringify(data, null, 2));
console.log();

const token = data.platformToken ?? data.token ?? data.apiKey ?? null;
const instanceId = data.instanceId ?? data.id ?? null;

if (!token) {
  console.warn("No platformToken in response — may need admin approval first.");
  console.warn("Check the response above and set DIVIDEN_PLATFORM_TOKEN manually.");
  process.exit(0);
}

// Write token (and instanceId if present) to .env.local
let updated = envContents;

if (updated.includes("DIVIDEN_PLATFORM_TOKEN=")) {
  updated = updated.replace(/^DIVIDEN_PLATFORM_TOKEN=.*/m, `DIVIDEN_PLATFORM_TOKEN="${token}"`);
} else {
  updated += `\n# Dividen Federation\nDIVIDEN_PLATFORM_TOKEN="${token}"\n`;
}

if (instanceId) {
  if (updated.includes("DIVIDEN_INSTANCE_ID=")) {
    updated = updated.replace(/^DIVIDEN_INSTANCE_ID=.*/m, `DIVIDEN_INSTANCE_ID="${instanceId}"`);
  } else {
    updated = updated.replace(
      `DIVIDEN_PLATFORM_TOKEN="${token}"`,
      `DIVIDEN_PLATFORM_TOKEN="${token}"\nDIVIDEN_INSTANCE_ID="${instanceId}"`
    );
  }
}

writeFileSync(ENV_PATH, updated, "utf8");

console.log(`✓ DIVIDEN_PLATFORM_TOKEN written to .env.local`);
if (instanceId) console.log(`✓ DIVIDEN_INSTANCE_ID=${instanceId} written to .env.local`);
console.log();
console.log("Next: add DIVIDEN_PLATFORM_TOKEN to Netlify env vars, then run:");
console.log("  curl -X POST https://inyo-fo.netlify.app/api/network/sync-agents");
