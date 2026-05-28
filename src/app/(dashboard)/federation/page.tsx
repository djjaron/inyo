"use client";

import { useEffect, useState, useCallback } from "react";
import { Plug, RefreshCw, Zap, Bot, CheckCircle2, AlertCircle, Clock, Activity, Store, Upload } from "lucide-react";
import Badge from "@/components/ui/Badge";
import PageHeader from "@/components/ui/PageHeader";
import { useFamilyId } from "@/context/FamilyContext";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Capability {
  type: string;
  name: string;
  description: string;
  model: "deep" | "fast";
}

interface Manifest {
  instanceId: string;
  name: string;
  version: string;
  protocol: string;
  capabilities: Capability[];
  endpoints: { manifest: string; inbound: string; health: string };
  tags: string[];
  generatedAt: string;
}

interface FederationStatus {
  registered: boolean;
  instanceId: string | null;
  lastHeartbeatAt: string | null;
  peersCount: number;
  _mock: boolean;
}

interface RecentRun {
  id: string;
  agentType: string;
  status: string;
  familyId: string;
  createdAt: string;
  completedAt: string | null;
}

interface Stats {
  totalRuns: number;
  recentRuns: RecentRun[];
}

interface StatusResponse {
  manifest: Manifest;
  federation: FederationStatus;
  stats: Stats;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function relativeTime(val: string | null): string {
  if (!val) return "—";
  const d = new Date(val);
  if (isNaN(d.getTime())) return "—";
  const diffMs = Date.now() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

function runDuration(run: RecentRun): string {
  if (!run.completedAt) return "—";
  const ms = new Date(run.completedAt).getTime() - new Date(run.createdAt).getTime();
  if (ms < 0) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function runStarted(createdAt: string): string {
  const d = new Date(createdAt);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

const runStatusVariant: Record<string, "success" | "danger" | "accent" | "muted"> = {
  completed: "success",
  failed: "danger",
  running: "accent",
  pending: "muted",
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function FederationPage() {
  useFamilyId();

  const [data, setData] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [livePolling, setLivePolling] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [registerResult, setRegisterResult] = useState<{ success: boolean; message: string; platformToken?: string } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    success: boolean; created: number; updated: number; skipped: number; message: string; _mock: boolean;
  } | null>(null);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/federation/status");
      if (res.ok) {
        const json = await res.json();
        setData(json as StatusResponse);
      }
    } catch {
      // leave data as-is
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  // Live-poll every 10s to show incoming Dividen calls in real time
  useEffect(() => {
    if (!livePolling) return;
    const interval = setInterval(() => {
      fetch("/api/federation/status")
        .then((r) => r.json())
        .then((json) => setData(json as StatusResponse))
        .catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, [livePolling]);

  async function handleSyncAgents() {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/network/sync-agents", { method: "POST" });
      const json = await res.json();
      setSyncResult(json);
    } catch {
      setSyncResult({ success: false, created: 0, updated: 0, skipped: 0, message: "Network error — please try again.", _mock: false });
    } finally {
      setSyncing(false);
    }
  }

  async function handleRegister() {
    setRegistering(true);
    setRegisterResult(null);
    try {
      const res = await fetch("/api/federation/register", { method: "POST" });
      const json = await res.json();
      if (res.ok) {
        setRegisterResult({ success: true, message: json.message ?? "Successfully registered with Dividen network.", platformToken: json.platformToken });
      } else {
        setRegisterResult({ success: false, message: json.error ?? json.message ?? "Registration failed." });
      }
      await loadStatus();
    } catch {
      setRegisterResult({ success: false, message: "Network error — please try again." });
    } finally {
      setRegistering(false);
    }
  }

  const manifest = data?.manifest;
  const federation = data?.federation;
  const stats = data?.stats;

  const runStatusCounts = (stats?.recentRuns ?? []).reduce<Record<string, number>>((acc, run) => {
    acc[run.status] = (acc[run.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className={`flex flex-col h-full${loading ? " opacity-50 animate-pulse" : ""}`}>
      <PageHeader
        title="Federation"
        subtitle="Dividen network integration"
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLivePolling((p) => !p)}
              className="flex items-center gap-1.5 px-3 py-2 rounded text-sm border transition-colors"
              style={{
                background: livePolling ? "rgba(16,185,129,0.08)" : "var(--bg-surface)",
                borderColor: livePolling ? "rgba(16,185,129,0.3)" : "var(--border)",
                color: livePolling ? "#10b981" : "var(--text-secondary)",
              }}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${livePolling ? "animate-pulse" : ""}`}
                style={{ background: livePolling ? "#10b981" : "var(--text-muted)", flexShrink: 0 }}
              />
              {livePolling ? "Live" : "Paused"}
            </button>
            <button
              onClick={loadStatus}
              className="flex items-center gap-1.5 px-3 py-2 rounded text-sm border"
              style={{ background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-secondary)" }}
            >
              <RefreshCw size={13} />
              Refresh
            </button>
            <button
              onClick={handleSyncAgents}
              disabled={syncing}
              className="flex items-center gap-1.5 px-4 py-2 rounded text-sm font-semibold transition-opacity disabled:opacity-40"
              style={{ background: "rgba(139,92,246,0.15)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.3)" }}
            >
              {syncing ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  Syncing…
                </>
              ) : (
                <>
                  <Store size={13} />
                  Sync to Marketplace
                </>
              )}
            </button>
            <button
              onClick={handleRegister}
              disabled={registering}
              className="flex items-center gap-1.5 px-4 py-2 rounded text-sm font-semibold transition-opacity disabled:opacity-40"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              {registering ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  Registering…
                </>
              ) : (
                <>
                  <Plug size={13} />
                  Register
                </>
              )}
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-auto px-8 py-6 flex flex-col gap-6">
        {/* Connection status card */}
        <div
          className="rounded-lg border p-5"
          style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              {federation?.registered ? (
                <CheckCircle2 size={18} style={{ color: "#10b981", flexShrink: 0 }} />
              ) : (
                <AlertCircle size={18} style={{ color: "#f59e0b", flexShrink: 0 }} />
              )}
              <div>
                <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {federation?.registered
                    ? "Connected to Dividen network"
                    : "Not connected to Dividen network"}
                </div>
                {!federation?.registered && (
                  <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    Register this instance to join the federation
                  </div>
                )}
                {federation?.registered && federation.instanceId && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono"
                      style={{
                        background: "rgba(16,185,129,0.08)",
                        color: "#10b981",
                        border: "1px solid rgba(16,185,129,0.2)",
                      }}
                    >
                      {federation.instanceId}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {federation?._mock && (
                <Badge label="Demo mode — set DIVIDEN_PLATFORM_TOKEN to connect" variant="warning" size="xs" />
              )}
            </div>
          </div>

          {federation?.registered && (
            <div className="mt-4 flex items-center gap-6">
              <div className="flex items-center gap-1.5">
                <Activity size={12} style={{ color: "var(--text-muted)" }} />
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Peers:
                </span>
                <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                  {federation.peersCount}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={12} style={{ color: "var(--text-muted)" }} />
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Last heartbeat:
                </span>
                <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                  {relativeTime(federation.lastHeartbeatAt)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Register result */}
        {registerResult && (
          <div
            className="rounded-md border px-4 py-3 flex flex-col gap-2"
            style={{
              background: registerResult.success ? "rgba(16,185,129,0.06)" : "rgba(239,68,68,0.06)",
              borderColor: registerResult.success ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)",
            }}
          >
            <span className="text-sm" style={{ color: registerResult.success ? "#10b981" : "#ef4444" }}>
              {registerResult.message}
            </span>
            {registerResult.platformToken && (
              <div className="flex flex-col gap-1">
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  New platform token — update <code className="px-1 rounded" style={{ background: "var(--bg-elevated)" }}>DIVIDEN_PLATFORM_TOKEN</code> in Netlify if this differs from your current value:
                </span>
                <code
                  className="text-xs px-2 py-1.5 rounded font-mono break-all"
                  style={{ background: "var(--bg-elevated)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}
                >
                  {registerResult.platformToken}
                </code>
              </div>
            )}
          </div>
        )}

        {/* Sync result */}
        {syncResult && (
          <div
            className="rounded-md border px-4 py-3"
            style={{
              background: syncResult.success ? "rgba(139,92,246,0.06)" : "rgba(239,68,68,0.06)",
              borderColor: syncResult.success ? "rgba(139,92,246,0.25)" : "rgba(239,68,68,0.2)",
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-medium" style={{ color: syncResult.success ? "#a78bfa" : "#ef4444" }}>
                  {syncResult.success ? "Agents synced to Dividen Bubble Store" : "Sync failed"}
                </div>
                <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  {syncResult.message}
                </div>
              </div>
              {syncResult.success && (
                <div className="flex items-center gap-4 shrink-0">
                  {syncResult.created > 0 && (
                    <div className="text-center">
                      <div className="text-lg font-semibold font-mono" style={{ color: "#10b981" }}>{syncResult.created}</div>
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>created</div>
                    </div>
                  )}
                  {syncResult.updated > 0 && (
                    <div className="text-center">
                      <div className="text-lg font-semibold font-mono" style={{ color: "#3b82f6" }}>{syncResult.updated}</div>
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>updated</div>
                    </div>
                  )}
                </div>
              )}
            </div>
            {syncResult._mock && (
              <div className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
                Set <code className="px-1 rounded" style={{ background: "var(--bg-elevated)" }}>DIVIDEN_PLATFORM_TOKEN</code> in your environment to push to the live Bubble Store.
              </div>
            )}
          </div>
        )}

        {/* Marketplace submission info */}
        <div
          className="rounded-lg border p-5"
          style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Store size={14} style={{ color: "#a78bfa" }} />
            <span className="text-xs font-medium tracking-wider uppercase" style={{ color: "var(--text-muted)" }}>
              Dividen Bubble Store
            </span>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                Submit agents to the marketplace
              </div>
              <div className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                "Sync to Marketplace" pushes all 13 Inyo agents to the Dividen Bubble Store as a single batch.
                Synced agents enter <span style={{ color: "#f59e0b" }}>pending_review</span> status and require admin approval before going public.
              </div>
              <div className="mt-2 flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                  <Upload size={11} />
                  <span>Requires <code className="px-1 rounded" style={{ background: "var(--bg-elevated)" }}>DIVIDEN_PLATFORM_TOKEN</code> env var</span>
                </div>
                <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                  <CheckCircle2 size={11} />
                  <span>Agent card served at <code className="px-1 rounded" style={{ background: "var(--bg-elevated)" }}>/.well-known/agent-card.json</code></span>
                </div>
                <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                  <Activity size={11} />
                  <span>Inbound endpoint: <code className="px-1 rounded" style={{ background: "var(--bg-elevated)" }}>/api/federation/tasks</code></span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>13 agents ready to sync</div>
              <div className="grid grid-cols-2 gap-1">
                {[
                  "Deal Flow Analyst", "IC Memo Writer", "Portfolio Monitor",
                  "CFO Agent", "Legal Review", "Tax Intelligence",
                  "Chief of Staff", "Concierge", "Philanthropy",
                  "Relationship Intel", "Deal Enrichment", "Term Sheet Analyst", "Diligence Agent"
                ].map((name) => (
                  <div key={name} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#a78bfa" }} />
                    {name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Instance details + stats */}
        {manifest && stats && (
          <div className="grid grid-cols-2 gap-6">
            {/* Instance info */}
            <div
              className="rounded-lg border p-5 flex flex-col gap-4"
              style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
            >
              <div className="text-xs font-medium tracking-wider uppercase" style={{ color: "var(--text-muted)" }}>
                Instance
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>Instance ID</span>
                  <span className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>
                    {manifest.instanceId}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>Version</span>
                  <span className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>
                    {manifest.version}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>Protocol</span>
                  <span className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>
                    {manifest.protocol}
                  </span>
                </div>
                {manifest.tags.length > 0 && (
                  <div className="flex justify-between items-start gap-3">
                    <span className="text-xs shrink-0" style={{ color: "var(--text-muted)" }}>Tags</span>
                    <div className="flex flex-wrap gap-1 justify-end">
                      {manifest.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.5 rounded text-xs"
                          style={{
                            background: "var(--bg-elevated)",
                            color: "var(--text-secondary)",
                            border: "1px solid var(--border)",
                            fontSize: "10px",
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="border-t pt-4 flex flex-col gap-2" style={{ borderColor: "var(--border)" }}>
                <div className="text-xs font-medium tracking-wider uppercase mb-1" style={{ color: "var(--text-muted)" }}>
                  Endpoints
                </div>
                {(["manifest", "inbound", "health"] as const).map((key) => (
                  <div key={key} className="flex justify-between items-center gap-3">
                    <span className="text-xs capitalize shrink-0" style={{ color: "var(--text-muted)" }}>
                      {key}
                    </span>
                    <span
                      className="text-xs font-mono truncate"
                      style={{ color: "var(--text-secondary)", direction: "rtl", textAlign: "right" }}
                    >
                      {manifest.endpoints[key]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div
              className="rounded-lg border p-5 flex flex-col gap-4"
              style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
            >
              <div className="text-xs font-medium tracking-wider uppercase" style={{ color: "var(--text-muted)" }}>
                Stats
              </div>
              <div className="flex flex-col gap-2">
                <div
                  className="text-4xl font-semibold font-mono"
                  style={{ color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}
                >
                  {stats.totalRuns.toLocaleString()}
                </div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>Agent Runs</div>
              </div>
              {Object.keys(runStatusCounts).length > 0 && (
                <div className="flex flex-col gap-2 border-t pt-4" style={{ borderColor: "var(--border)" }}>
                  <div className="text-xs font-medium tracking-wider uppercase mb-1" style={{ color: "var(--text-muted)" }}>
                    Recent Breakdown
                  </div>
                  {Object.entries(runStatusCounts).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <Badge label={status} variant={runStatusVariant[status] ?? "muted"} size="xs" />
                      <span className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Agent capabilities */}
        {manifest && manifest.capabilities.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-medium tracking-wider uppercase" style={{ color: "var(--text-muted)" }}>
                Agent Capabilities
              </span>
              <span
                className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium"
                style={{
                  background: "rgba(59,130,246,0.1)",
                  color: "var(--accent)",
                  border: "1px solid rgba(59,130,246,0.2)",
                  fontSize: "10px",
                }}
              >
                {manifest.capabilities.length}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {manifest.capabilities.map((cap) => (
                <div
                  key={cap.type}
                  className="rounded-lg border p-4 flex flex-col gap-2"
                  style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className="flex items-center justify-center w-7 h-7 rounded-md shrink-0"
                      style={{
                        background: cap.model === "deep" ? "rgba(59,130,246,0.1)" : "rgba(139,144,153,0.1)",
                        color: cap.model === "deep" ? "var(--accent)" : "var(--text-muted)",
                      }}
                    >
                      {cap.model === "deep" ? <Zap size={13} /> : <Bot size={13} />}
                    </div>
                    <Badge
                      label={cap.model === "deep" ? "Opus" : "Haiku"}
                      variant={cap.model === "deep" ? "accent" : "muted"}
                      size="xs"
                    />
                  </div>
                  <div>
                    <div className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                      {cap.name}
                    </div>
                    <div className="text-xs mt-1 leading-relaxed" style={{ color: "var(--text-muted)" }}>
                      {cap.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Live execution log */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-medium tracking-wider uppercase" style={{ color: "var(--text-muted)" }}>
              Execution Log
            </span>
            {livePolling && (
              <span className="flex items-center gap-1.5 text-xs" style={{ color: "#10b981" }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#10b981" }} />
                polling every 10s
              </span>
            )}
            {stats && (
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {stats.totalRuns.toLocaleString()} total runs
              </span>
            )}
          </div>
          <div
            className="rounded-md border overflow-hidden"
            style={{ borderColor: "var(--border)" }}
          >
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: "var(--bg-elevated)", borderBottom: "1px solid var(--border)" }}>
                  {["Agent", "Source", "Status", "Duration", "When"].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-2.5 font-medium"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats && stats.recentRuns.length > 0 ? (
                  stats.recentRuns.map((run) => (
                    <tr
                      key={run.id}
                      style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-surface)" }}
                    >
                      <td className="px-4 py-3 font-mono" style={{ color: "var(--text-secondary)" }}>
                        {run.agentType}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-mono"
                          style={{
                            background: run.familyId === "dividen-external"
                              ? "rgba(139,92,246,0.1)"
                              : "rgba(59,130,246,0.1)",
                            color: run.familyId === "dividen-external" ? "#a78bfa" : "var(--accent)",
                            border: `1px solid ${run.familyId === "dividen-external" ? "rgba(139,92,246,0.25)" : "rgba(59,130,246,0.2)"}`,
                            fontSize: "10px",
                          }}
                        >
                          {run.familyId === "dividen-external" ? "dividen" : run.familyId}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          label={run.status}
                          variant={runStatusVariant[run.status] ?? "muted"}
                          size="xs"
                        />
                      </td>
                      <td className="px-4 py-3 font-mono" style={{ color: "var(--text-muted)" }}>
                        {runDuration(run)}
                      </td>
                      <td className="px-4 py-3" style={{ color: "var(--text-muted)" }}>
                        {relativeTime(run.createdAt)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center" style={{ color: "var(--text-muted)" }}>
                      No runs yet — executions from Dividen will appear here automatically
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
