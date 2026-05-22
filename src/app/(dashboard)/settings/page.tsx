"use client";

import { useState, useEffect } from "react";
import { UserProfile } from "@clerk/nextjs";
import { Settings, Building2, Zap, CheckCircle2, AlertCircle } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import { useFamilyId } from "@/context/FamilyContext";

type Tab = "profile" | "workspace";

const CURRENCIES = ["USD", "EUR", "GBP", "CHF", "AED", "SGD", "CAD", "AUD"] as const;

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "profile", label: "Profile", icon: <Settings size={14} /> },
  { key: "workspace", label: "Workspace", icon: <Building2 size={14} /> },
];

const clerkAppearance = {
  variables: {
    colorBackground: "#0f1014",
    colorInputBackground: "#14161b",
    colorInputText: "#e8eaed",
    colorText: "#e8eaed",
    colorTextSecondary: "#8b9099",
    colorPrimary: "#3b82f6",
    colorNeutral: "#1e2229",
    borderRadius: "4px",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  elements: {
    card: { boxShadow: "none", border: "1px solid #1e2229", background: "#0f1014" },
    navbar: { background: "#0a0b0d", borderRight: "1px solid #1e2229" },
    navbarButton: { color: "#8b9099" },
    navbarButtonActive: { color: "#e8eaed", background: "rgba(59,130,246,0.12)" },
    pageScrollBox: { background: "#0f1014" },
  },
};

function WorkspaceTab() {
  const familyId = useFamilyId();

  const [familyName, setFamilyName] = useState("");
  const [aum, setAum] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [apiKeySet, setApiKeySet] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/user/setup")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.family) {
          setFamilyName(data.family.name ?? "");
          setAum(data.family.aum != null ? String(data.family.aum) : "");
          setCurrency(data.family.currency ?? "USD");
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetch("/api/agents/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data != null) setApiKeySet(!!data.apiKeySet);
      })
      .catch(() => {});
  }, []);

  async function handleSave() {
    if (!familyId || saving) return;
    setSaving(true);
    setSaved(false);
    setSaveError("");

    const aumValue = aum.trim() === "" ? null : parseFloat(aum);

    try {
      const res = await fetch(`/api/family/${familyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: familyName.trim(),
          aum: aumValue,
          currency,
        }),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } else {
        const data = await res.json().catch(() => ({}));
        setSaveError(data.error ?? "Failed to save changes");
      }
    } catch {
      setSaveError("Network error — please try again");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-sm" style={{ color: "var(--text-muted)" }}>
        Loading workspace settings…
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl flex flex-col gap-8">
      <div
        className="rounded-lg border p-6 flex flex-col gap-5"
        style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
      >
        <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Family Office
        </h2>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            Family Name
          </label>
          <input
            type="text"
            value={familyName}
            onChange={(e) => setFamilyName(e.target.value)}
            placeholder="e.g. Hartwell Family Office"
            className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
            style={{
              background: "var(--bg-surface)",
              borderColor: "var(--border)",
              color: "var(--text-primary)",
            }}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            Assets Under Management
          </label>
          <input
            type="number"
            value={aum}
            onChange={(e) => setAum(e.target.value)}
            placeholder="e.g. 50000000"
            min={0}
            className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
            style={{
              background: "var(--bg-surface)",
              borderColor: "var(--border)",
              color: "var(--text-primary)",
            }}
          />
          {aum.trim() !== "" && !isNaN(parseFloat(aum)) && (
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {formatAum(parseFloat(aum), currency)}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            Base Currency
          </label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
            style={{
              background: "var(--bg-surface)",
              borderColor: "var(--border)",
              color: "var(--text-primary)",
            }}
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={handleSave}
            disabled={!familyId || saving}
            className="px-4 py-2 rounded text-sm font-semibold transition-opacity disabled:opacity-40"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
          {saved && (
            <span className="flex items-center gap-1.5 text-xs" style={{ color: "#10b981" }}>
              <CheckCircle2 size={13} /> Saved
            </span>
          )}
          {saveError && (
            <span className="flex items-center gap-1.5 text-xs" style={{ color: "#ef4444" }}>
              <AlertCircle size={13} /> {saveError}
            </span>
          )}
        </div>
      </div>

      <div
        className="rounded-lg border p-6 flex flex-col gap-4"
        style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
      >
        <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Integrations
        </h2>

        <div
          className="flex items-center justify-between rounded-md border px-4 py-3"
          style={{ borderColor: "var(--border)", background: "var(--bg-base)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center rounded-md"
              style={{
                width: 32,
                height: 32,
                background: "rgba(59,130,246,0.1)",
                border: "1px solid rgba(59,130,246,0.2)",
              }}
            >
              <Zap size={14} style={{ color: "var(--accent)" }} />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                Anthropic AI
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {apiKeySet === false
                  ? "Set ANTHROPIC_API_KEY in Netlify environment variables"
                  : "Powers all AI agents and analysis"}
              </p>
            </div>
          </div>
          <Badge
            label={apiKeySet === true ? "Connected" : apiKeySet === false ? "Not configured" : "Checking…"}
            variant={apiKeySet === true ? "success" : apiKeySet === false ? "warning" : "muted"}
            size="xs"
          />
        </div>

        <div
          className="flex items-center justify-between rounded-md border px-4 py-3"
          style={{ borderColor: "var(--border)", background: "var(--bg-base)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center rounded-md"
              style={{
                width: 32,
                height: 32,
                background: "rgba(245,158,11,0.1)",
                border: "1px solid rgba(245,158,11,0.2)",
              }}
            >
              <Building2 size={14} style={{ color: "#f59e0b" }} />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                Sydecar
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Configure via SYDECAR_API_KEY environment variable
              </p>
            </div>
          </div>
          <Badge label="API integration available" variant="warning" size="xs" />
        </div>
      </div>
    </div>
  );
}

function formatAum(amount: number, currency: string): string {
  const symbol = currency === "USD" ? "$"
    : currency === "EUR" ? "€"
    : currency === "GBP" ? "£"
    : currency === "CHF" ? "CHF "
    : currency === "AED" ? "AED "
    : currency === "SGD" ? "S$"
    : currency === "CAD" ? "C$"
    : currency === "AUD" ? "A$"
    : "$";
  if (amount >= 1_000_000_000) return `${symbol}${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `${symbol}${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${symbol}${(amount / 1_000).toFixed(0)}K`;
  return `${symbol}${amount.toFixed(0)}`;
}

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("profile");

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Settings" subtitle="Account and workspace configuration" />

      <div className="flex flex-1 overflow-hidden">
        <nav
          className="flex flex-col gap-1 p-3 flex-shrink-0"
          style={{
            width: 180,
            borderRight: "1px solid var(--border)",
            background: "var(--bg-base)",
          }}
        >
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded text-xs font-medium text-left transition-colors border-l-2"
              style={
                tab === t.key
                  ? {
                      color: "var(--accent)",
                      borderColor: "var(--accent)",
                      background: "rgba(59,130,246,0.08)",
                    }
                  : {
                      color: "var(--text-muted)",
                      borderColor: "transparent",
                    }
              }
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </nav>

        <div className="flex-1 overflow-auto" style={{ background: "var(--bg-base)" }}>
          {tab === "profile" && (
            <div className="p-8">
              <UserProfile appearance={clerkAppearance} />
            </div>
          )}
          {tab === "workspace" && <WorkspaceTab />}
        </div>
      </div>
    </div>
  );
}
