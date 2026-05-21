"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ChevronLeft, Bot, FileText, RefreshCw, Zap, Loader2, Building2, Tag, DollarSign, Calendar, User, Link2 } from "lucide-react";
import Badge from "@/components/ui/Badge";
import ScoreRing from "@/components/ui/ScoreRing";
import DealAnalysisPanel from "@/components/ui/DealAnalysisPanel";
import ICMemoPanel from "@/components/ui/ICMemoPanel";
import { formatCurrency, formatDate } from "@/lib/utils";

const statusVariant: Record<string, "success" | "warning" | "accent" | "danger" | "muted" | "default"> = {
  inbound: "accent", reviewing: "accent", diligence: "warning",
  "ic-review": "warning", invested: "success", passed: "muted", archived: "muted",
};
const statusLabel: Record<string, string> = {
  inbound: "Inbound", reviewing: "Reviewing", diligence: "Diligence",
  "ic-review": "IC Review", invested: "Invested", passed: "Passed", archived: "Archived",
};

const SELECTABLE_STATUSES = [
  "inbound", "reviewing", "diligence", "ic-review", "passed", "invested",
] as const;

type Tab = "overview" | "analysis" | "memo";

interface Deal {
  id: string; familyId: string; company: string; name?: string;
  sector?: string; stage?: string; status: string;
  capitalAsk?: number; valuation?: number; description?: string;
  sourceType?: string; sourceContact?: string; dealScore?: number;
  createdAt: string; updatedAt?: string;
  documents?: Array<{ id: string; name: string; textContent?: string; createdAt: string }>;
  aiAnalyses?: Array<{ id: string; agentType: string; output: Record<string, unknown>; createdAt: string; _mock?: boolean }>;
}

export default function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");
  const [saving, setSaving] = useState(false);

  const [analysis, setAnalysis] = useState<Record<string, unknown> | null>(null);
  const [analysisMock, setAnalysisMock] = useState(false);
  const [runningAnalysis, setRunningAnalysis] = useState(false);
  const [analysisAck, setAnalysisAck] = useState<string | null>(null);

  const [icMemo, setIcMemo] = useState<Record<string, unknown> | null>(null);
  const [memoMock, setMemoMock] = useState(false);
  const [runningMemo, setRunningMemo] = useState(false);
  const [memoAck, setMemoAck] = useState<string | null>(null);

  const [docText, setDocText] = useState("");

  useEffect(() => {
    fetch(`/api/deals/${id}`)
      .then((r) => r.json())
      .then((data) => {
        const d: Deal = data.deal ?? data;
        setDeal(d);
        // Pre-load most recent analysis results if available
        const analyses: Deal["aiAnalyses"] = d.aiAnalyses ?? [];
        const latest = (type: string) => analyses.find((a) => a.agentType === type);
        const la = latest("deal-flow");
        if (la) { setAnalysis(la.output); setAnalysisMock(!!(la as { _mock?: boolean })._mock); }
        const lm = latest("ic-memo");
        if (lm) { setIcMemo(lm.output); setMemoMock(!!(lm as { _mock?: boolean })._mock); }
      })
      .catch(() => {
        setDeal({
          id, familyId: "family_demo", company: "Demo Deal", status: "inbound",
          createdAt: new Date().toISOString(),
        });
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function runDealFlow() {
    if (!deal) return;
    setRunningAnalysis(true);
    setAnalysisAck(null);
    setTab("analysis");
    try {
      const res = await fetch("/api/agents/deal-flow/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyId: deal.familyId,
          dealId: deal.id,
          context: {
            company: deal.company, sector: deal.sector, stage: deal.stage,
            status: deal.status, capitalAsk: deal.capitalAsk, valuation: deal.valuation,
            description: deal.description, sourceType: deal.sourceType, sourceContact: deal.sourceContact,
          },
          documentContent: docText || undefined,
        }),
      });
      if (!res.body) throw new Error("No stream");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() ?? "";
        for (const part of parts) {
          if (!part.startsWith("data: ")) continue;
          try {
            const p = JSON.parse(part.slice(6));
            if (p.type === "ack") setAnalysisAck(p.message);
            else if (p.type === "done") {
              setAnalysis(p.result ?? {});
              setAnalysisMock(p._mock === true);
              setRunningAnalysis(false);
            } else if (p.type === "error") {
              setRunningAnalysis(false);
            }
          } catch {}
        }
      }
    } catch {
      setRunningAnalysis(false);
    }
  }

  async function runICMemo() {
    if (!deal) return;
    setRunningMemo(true);
    setMemoAck(null);
    setTab("memo");
    try {
      const docs = docText ? [{ name: "Deal Document", content: docText }] : undefined;
      const res = await fetch("/api/agents/ic-memo/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyId: deal.familyId,
          dealId: deal.id,
          context: {
            company: deal.company, sector: deal.sector, stage: deal.stage,
            status: deal.status, capitalAsk: deal.capitalAsk, valuation: deal.valuation,
            description: deal.description, sourceType: deal.sourceType, sourceContact: deal.sourceContact,
          },
          documentContents: docs,
        }),
      });
      if (!res.body) throw new Error("No stream");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() ?? "";
        for (const part of parts) {
          if (!part.startsWith("data: ")) continue;
          try {
            const p = JSON.parse(part.slice(6));
            if (p.type === "ack") setMemoAck(p.message);
            else if (p.type === "done") {
              setIcMemo(p.result ?? {});
              setMemoMock(p._mock === true);
              setRunningMemo(false);
            } else if (p.type === "error") {
              setRunningMemo(false);
            }
          } catch {}
        }
      }
    } catch {
      setRunningMemo(false);
    }
  }

  async function updateStatus(newStatus: string) {
    if (!deal || newStatus === deal.status) return;
    const prevStatus = deal.status;
    setDeal({ ...deal, status: newStatus });
    setSaving(true);
    try {
      const res = await fetch(`/api/deals/${deal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) setDeal({ ...deal, status: prevStatus });
    } catch {
      setDeal({ ...deal, status: prevStatus });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full" style={{ color: "var(--text-muted)" }}>
        <Loader2 size={20} className="animate-spin mr-2" /> Loading deal...
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="flex items-center justify-center h-full text-sm" style={{ color: "var(--text-muted)" }}>
        Deal not found.{" "}
        <Link href="/opportunities" className="ml-2 underline" style={{ color: "var(--accent)" }}>Back to pipeline</Link>
      </div>
    );
  }

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "overview", label: "Overview", icon: <Building2 size={13} /> },
    { key: "analysis", label: "Deal Analysis", icon: <Bot size={13} /> },
    { key: "memo", label: "IC Memo", icon: <FileText size={13} /> },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Back + Header */}
      <div className="px-8 pt-6 pb-4 flex-shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
        <Link
          href="/opportunities"
          className="flex items-center gap-1 text-xs mb-4 w-fit"
          style={{ color: "var(--text-muted)" }}
        >
          <ChevronLeft size={13} /> Pipeline
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>{deal.company}</h1>
              {/* Status selector */}
              <div className="flex items-center gap-1.5">
                <select
                  value={deal.status}
                  onChange={(e) => updateStatus(e.target.value)}
                  disabled={saving}
                  style={{
                    background: "var(--bg-elevated)",
                    color: statusVariant[deal.status] === "accent" ? "var(--accent)"
                      : statusVariant[deal.status] === "warning" ? "#f59e0b"
                      : statusVariant[deal.status] === "success" ? "#10b981"
                      : "var(--text-muted)",
                    border: "1px solid var(--border)",
                    borderRadius: "3px",
                    fontSize: "10px",
                    fontWeight: 500,
                    letterSpacing: "0.03em",
                    padding: "1px 20px 1px 6px",
                    cursor: "pointer",
                    appearance: "auto",
                    outline: "none",
                    opacity: saving ? 0.6 : 1,
                  }}
                >
                  {SELECTABLE_STATUSES.map((s) => (
                    <option key={s} value={s}>{statusLabel[s]}</option>
                  ))}
                  {!SELECTABLE_STATUSES.includes(deal.status as typeof SELECTABLE_STATUSES[number]) && (
                    <option value={deal.status} disabled>{statusLabel[deal.status] ?? deal.status}</option>
                  )}
                </select>
                {saving && <Loader2 size={11} className="animate-spin" style={{ color: "var(--text-muted)" }} />}
                {saving && <span className="text-xs" style={{ color: "var(--text-muted)" }}>Saving...</span>}
              </div>
              {deal.stage && <Badge label={deal.stage.replace(/-/g, " ")} variant="muted" size="xs" />}
            </div>
            {deal.sector && (
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{deal.sector}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {deal.dealScore && <ScoreRing score={deal.dealScore} size={40} />}
            <button
              onClick={runDealFlow}
              disabled={runningAnalysis}
              className="flex items-center gap-1.5 px-3 py-2 rounded text-xs font-medium transition-opacity disabled:opacity-50"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              {runningAnalysis ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
              Analyze
            </button>
            <button
              onClick={runICMemo}
              disabled={runningMemo}
              className="flex items-center gap-1.5 px-3 py-2 rounded text-xs font-medium transition-opacity disabled:opacity-50"
              style={{ background: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
            >
              {runningMemo ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />}
              IC Memo
            </button>
          </div>
        </div>

        {/* Quick stats */}
        <div className="flex items-center gap-6 mt-4 flex-wrap">
          {deal.capitalAsk && (
            <div className="flex items-center gap-1.5 text-sm" style={{ color: "var(--text-secondary)" }}>
              <DollarSign size={13} style={{ color: "var(--text-muted)" }} />
              {formatCurrency(deal.capitalAsk)} ask
            </div>
          )}
          {deal.valuation && (
            <div className="flex items-center gap-1.5 text-sm" style={{ color: "var(--text-secondary)" }}>
              <Tag size={13} style={{ color: "var(--text-muted)" }} />
              {formatCurrency(deal.valuation)} valuation
            </div>
          )}
          {deal.sourceContact && (
            <div className="flex items-center gap-1.5 text-sm" style={{ color: "var(--text-secondary)" }}>
              <User size={13} style={{ color: "var(--text-muted)" }} />
              via {deal.sourceContact}
            </div>
          )}
          {deal.createdAt && (
            <div className="flex items-center gap-1.5 text-sm" style={{ color: "var(--text-muted)" }}>
              <Calendar size={13} />
              Added {formatDate(deal.createdAt)}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-8 py-0 flex-shrink-0" style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-surface)" }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex items-center gap-1.5 px-3 py-3 text-xs font-medium transition-colors border-b-2"
            style={tab === t.key
              ? { color: "var(--accent)", borderColor: "var(--accent)" }
              : { color: "var(--text-muted)", borderColor: "transparent" }
            }
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        {tab === "overview" && (
          <div className="p-8 max-w-4xl">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {/* Deal Details */}
              <div className="md:col-span-2 space-y-5">
                {deal.description && (
                  <div className="p-4 rounded-lg" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
                    <div className="text-xs font-semibold tracking-wide uppercase mb-2" style={{ color: "var(--text-muted)" }}>Description</div>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{deal.description}</p>
                  </div>
                )}

                {/* Paste pitch deck text */}
                <div className="p-4 rounded-lg" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
                  <div className="text-xs font-semibold tracking-wide uppercase mb-2" style={{ color: "var(--text-muted)" }}>Document / Pitch Deck Text</div>
                  <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>
                    Paste pitch deck or memo text here — it will be passed to the AI agents for richer analysis.
                  </p>
                  <textarea
                    value={docText}
                    onChange={(e) => setDocText(e.target.value)}
                    placeholder="Paste pitch deck text, executive summary, or any deal materials..."
                    rows={8}
                    className="w-full rounded text-xs p-3 resize-none outline-none"
                    style={{
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border)",
                      color: "var(--text-secondary)",
                      fontFamily: "inherit",
                    }}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {docText.length > 0 ? `${docText.length.toLocaleString()} chars` : "No document added"}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={runDealFlow}
                        disabled={runningAnalysis}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium disabled:opacity-50"
                        style={{ background: "var(--accent)", color: "#fff" }}
                      >
                        {runningAnalysis ? <Loader2 size={11} className="animate-spin" /> : <Zap size={11} />}
                        Run Analysis
                      </button>
                      <button
                        onClick={runICMemo}
                        disabled={runningMemo}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium disabled:opacity-50"
                        style={{ background: "var(--bg-surface)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
                      >
                        {runningMemo ? <Loader2 size={11} className="animate-spin" /> : <FileText size={11} />}
                        Generate IC Memo
                      </button>
                    </div>
                  </div>
                </div>

                {/* Prior analyses */}
                {deal.aiAnalyses && deal.aiAnalyses.length > 0 && (
                  <div className="p-4 rounded-lg" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
                    <div className="text-xs font-semibold tracking-wide uppercase mb-3" style={{ color: "var(--text-muted)" }}>Analysis History</div>
                    <div className="space-y-2">
                      {deal.aiAnalyses.map((a) => (
                        <div key={a.id} className="flex items-center justify-between text-xs py-2" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                          <div className="flex items-center gap-2">
                            <Bot size={12} style={{ color: "var(--text-muted)" }} />
                            <span style={{ color: "var(--text-secondary)" }}>
                              {a.agentType === "deal-flow" ? "Deal Flow Analysis" : a.agentType === "ic-memo" ? "IC Memo" : a.agentType}
                            </span>
                          </div>
                          <span style={{ color: "var(--text-muted)" }}>{formatDate(a.createdAt)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar metadata */}
              <div className="space-y-4">
                {[
                  { label: "Sector", value: deal.sector },
                  { label: "Stage", value: deal.stage?.replace(/-/g, " ") },
                  { label: "Status", value: statusLabel[deal.status] ?? deal.status },
                  { label: "Capital Ask", value: deal.capitalAsk ? formatCurrency(deal.capitalAsk) : undefined },
                  { label: "Valuation", value: deal.valuation ? formatCurrency(deal.valuation) : undefined },
                  { label: "Source Type", value: deal.sourceType?.replace(/-/g, " ") },
                  { label: "Source Contact", value: deal.sourceContact },
                  { label: "Added", value: deal.createdAt ? formatDate(deal.createdAt) : undefined },
                ].filter((f) => f.value).map((f) => (
                  <div key={f.label}>
                    <div className="text-xs mb-0.5" style={{ color: "var(--text-muted)" }}>{f.label}</div>
                    <div className="text-sm capitalize" style={{ color: "var(--text-secondary)" }}>{f.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "analysis" && (
          <div className="p-8 max-w-3xl">
            {runningAnalysis ? (
              <div className="flex flex-col gap-3 py-12">
                <div className="flex items-center gap-3" style={{ color: "var(--text-muted)" }}>
                  <Loader2 size={16} className="animate-spin flex-shrink-0" style={{ color: "var(--accent)" }} />
                  <span className="text-sm">
                    {analysisAck ?? "Starting Deal Flow Analysis…"}
                  </span>
                </div>
                {analysisAck && (
                  <div className="h-1 w-full rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{ background: "var(--accent)", width: "100%", animation: "indeterminate 2s linear infinite" }}
                    />
                  </div>
                )}
              </div>
            ) : analysis ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>Deal Flow Analysis</span>
                  <button
                    onClick={runDealFlow}
                    className="flex items-center gap-1 px-2.5 py-1 rounded text-xs"
                    style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
                  >
                    <RefreshCw size={11} /> Re-run
                  </button>
                </div>
                <DealAnalysisPanel output={analysis as Parameters<typeof DealAnalysisPanel>[0]["output"]} isMock={analysisMock} />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                <Bot size={36} style={{ color: "var(--text-muted)" }} />
                <div>
                  <p className="text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>No analysis yet</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>Run the Deal Flow agent to score this deal and surface risks and opportunities.</p>
                </div>
                <button
                  onClick={runDealFlow}
                  className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
                  style={{ background: "var(--accent)", color: "#fff" }}
                >
                  <Zap size={14} /> Run Deal Flow Analysis
                </button>
              </div>
            )}
          </div>
        )}

        {tab === "memo" && (
          <div className="p-8 max-w-3xl">
            {runningMemo ? (
              <div className="flex flex-col gap-3 py-12">
                <div className="flex items-center gap-3" style={{ color: "var(--text-muted)" }}>
                  <Loader2 size={16} className="animate-spin flex-shrink-0" style={{ color: "var(--accent)" }} />
                  <span className="text-sm">
                    {memoAck ?? "Starting IC Memo generation…"}
                  </span>
                </div>
                {memoAck && (
                  <div className="h-1 w-full rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{ background: "var(--accent)", width: "100%", animation: "indeterminate 2s linear infinite" }}
                    />
                  </div>
                )}
              </div>
            ) : icMemo ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>Investment Committee Memo</span>
                  <button
                    onClick={runICMemo}
                    className="flex items-center gap-1 px-2.5 py-1 rounded text-xs"
                    style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
                  >
                    <RefreshCw size={11} /> Regenerate
                  </button>
                </div>
                <ICMemoPanel output={icMemo as Parameters<typeof ICMemoPanel>[0]["output"]} isMock={memoMock} />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                <FileText size={36} style={{ color: "var(--text-muted)" }} />
                <div>
                  <p className="text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>No IC memo yet</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>Generate a full investment committee memo with SWOT, financials, team assessment, and recommendation.</p>
                </div>
                <button
                  onClick={runICMemo}
                  className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
                  style={{ background: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
                >
                  <FileText size={14} /> Generate IC Memo
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
