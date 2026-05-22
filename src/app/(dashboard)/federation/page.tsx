"use client";

import { useEffect, useState, useCallback } from "react";
import { Plug, RefreshCw, Zap, Bot, CheckCircle2, AlertCircle, Clock, Activity } from "lucide-react";
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
  const [registering, setRegistering] = useState(false);
  const [registerResult, setRegisterResult] = useState<{ success: boolean; message: string } | null>(null);

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

  async function handleRegister() {
    setRegistering(true);
    setRegisterResult(null);
    try {
      const res = await fetch("/api/federation/register", { method: "POST" });
      const json = await res.json();
      if (res.ok) {
        setRegisterResult({ success: true, message: json.message ?? "Successfully registered with Dividen network." });
      } else {
        setRegisterResult({ success: false, message: json.error ?? "Registration failed." });
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
              onClick={loadStatus}
              className="flex items-center gap-1.5 px-3 py-2 rounded text-sm border"
              style={{ background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-secondary)" }}
            >
              <RefreshCw size={13} />
              Refresh
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
                <Badge label="Demo mode — set DIVIDEN_API_KEY to connect" variant="warning" size="xs" />
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
            className="rounded-md border px-4 py-3 text-sm"
            style={{
              background: registerResult.success ? "rgba(16,185,129,0.06)" : "rgba(239,68,68,0.06)",
              borderColor: registerResult.success ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)",
              color: registerResult.success ? "#10b981" : "#ef4444",
            }}
          >
            {registerResult.message}
          </div>
        )}

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

        {/* Recent runs table */}
        {stats && stats.recentRuns.length > 0 && (
          <div>
            <div className="text-xs font-medium tracking-wider uppercase mb-4" style={{ color: "var(--text-muted)" }}>
              Recent Runs
            </div>
            <div
              className="rounded-md border overflow-hidden"
              style={{ borderColor: "var(--border)" }}
            >
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ background: "var(--bg-elevated)", borderBottom: "1px solid var(--border)" }}>
                    {["Agent Type", "Status", "Started", "Duration"].map((h) => (
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
                  {stats.recentRuns.slice(0, 10).map((run) => (
                    <tr
                      key={run.id}
                      style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-surface)" }}
                    >
                      <td className="px-4 py-3 font-mono" style={{ color: "var(--text-secondary)" }}>
                        {run.agentType}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          label={run.status}
                          variant={runStatusVariant[run.status] ?? "muted"}
                          size="xs"
                        />
                      </td>
                      <td className="px-4 py-3" style={{ color: "var(--text-muted)" }}>
                        {runStarted(run.createdAt)}
                      </td>
                      <td className="px-4 py-3 font-mono" style={{ color: "var(--text-muted)" }}>
                        {runDuration(run)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
