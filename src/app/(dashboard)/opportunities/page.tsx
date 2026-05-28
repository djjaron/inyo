"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, Plus, Filter, ChevronRight, ExternalLink, Zap, RefreshCw, ChevronDown, LayoutList, Kanban, X } from "lucide-react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import ScoreRing from "@/components/ui/ScoreRing";
import PageHeader from "@/components/ui/PageHeader";
import ContextPanel from "@/components/ui/ContextPanel";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useFamilyId } from "@/context/FamilyContext";
import { usePanel } from "@/context/PanelContext";

const STATUS_FILTERS = ["All", "Inbound", "Reviewing", "Diligence", "IC Review", "Invested", "Passed"] as const;

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

interface Deal {
  id: string; company: string; sector?: string; stage?: string;
  capitalAsk?: number; dealScore?: number; status: string;
  createdAt: string; sourceType?: string;
}

interface FullDeal {
  id: string;
  company: string;
  sector?: string;
  stage?: string;
  status: string;
  capitalAsk?: number;
  valuation?: number;
  ownership?: number;
  description?: string;
  sourceType?: string;
  sourceContact?: string;
  dealScore?: number;
  icMemoUrl?: string | null;
  dataRoomUrl?: string | null;
  pitchDeckUrl?: string | null;
  website?: string | null;
  linkedinUrl?: string | null;
  crunchbaseUrl?: string | null;
}

interface DealScoreResult {
  score: number;
  summary: string;
  risks: string[];
  opportunities: string[];
  recommendation: string;
  founderBackground?: string;
  comparables?: string[];
}

interface ICMemoResult {
  executiveSummary: string;
  risks: Array<{ category: string; description: string; severity: string }>;
  opportunities: string[];
  recommendation: string;
  nextSteps: string[];
}

// Fallback mock data used when DB has no deals
const MOCK_DEALS: Deal[] = [
  { id: "mock-1", company: "Meridian AI", sector: "Enterprise AI", stage: "series-b", capitalAsk: 12_000_000, dealScore: 84, status: "diligence", createdAt: "2026-05-14", sourceType: "lp-intro" },
  { id: "mock-2", company: "Verdant Bio", sector: "Biotech", stage: "series-a", capitalAsk: 8_000_000, dealScore: 71, status: "reviewing", createdAt: "2026-05-12", sourceType: "inbound" },
  { id: "mock-3", company: "Phalanx Defense", sector: "Defense Tech", stage: "series-c", capitalAsk: 60_000_000, dealScore: 88, status: "ic-review", createdAt: "2026-05-03", sourceType: "network" },
  { id: "mock-4", company: "Arcadia Energy", sector: "Clean Energy", stage: "growth", capitalAsk: 45_000_000, dealScore: 79, status: "ic-review", createdAt: "2026-05-08", sourceType: "broker" },
  { id: "mock-5", company: "Terrace REIT", sector: "Real Estate", stage: "pe", capitalAsk: 18_000_000, dealScore: 73, status: "inbound", createdAt: "2026-04-25", sourceType: "broker" },
];

function DealPreviewPanel({ deal, familyId }: { deal: Deal; familyId: string }) {
  const [fullDeal, setFullDeal] = useState<FullDeal | null>(null);
  const [fetching, setFetching] = useState(true);

  // AI Analysis state
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<DealScoreResult | null>(null);
  const [memoLoading, setMemoLoading] = useState(false);
  const [memoResult, setMemoResult] = useState<ICMemoResult | null>(null);
  const [agentMock, setAgentMock] = useState(false);
  const [memoExpanded, setMemoExpanded] = useState(false);

  useEffect(() => {
    setFetching(true);
    setFullDeal(null);
    fetch(`/api/deals/${deal.id}`)
      .then((r) => r.json())
      .then((data) => {
        setFullDeal(data.deal ?? null);
      })
      .catch(() => {
        setFullDeal(null);
      })
      .finally(() => {
        setFetching(false);
      });
  }, [deal.id]);

  const d = fullDeal ?? deal as FullDeal;

  async function runDealAnalysis() {
    setAnalysisLoading(true);
    setAnalysisResult(null);
    try {
      const res = await fetch("/api/agents/deal-flow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyId,
          dealId: deal.id,
          context: {
            company: d.company,
            sector: d.sector,
            stage: d.stage,
            capitalAsk: d.capitalAsk,
            valuation: d.valuation,
            description: d.description ?? "",
          },
        }),
      });
      const data = await res.json();
      if (data.result) {
        setAnalysisResult(data.result as DealScoreResult);
        setAgentMock(data.analysis?._mock === true);
        // Write score back to deal record
        if (typeof data.result.score === "number") {
          fetch(`/api/deals/${deal.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dealScore: data.result.score }),
          }).catch(() => {});
        }
      }
    } catch {
      // silently fail
    } finally {
      setAnalysisLoading(false);
    }
  }

  async function runICMemo() {
    setMemoLoading(true);
    setMemoResult(null);
    try {
      const res = await fetch("/api/agents/ic-memo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyId,
          dealId: deal.id,
          context: {
            company: d.company,
            sector: d.sector,
            stage: d.stage,
            capitalAsk: d.capitalAsk,
            valuation: d.valuation,
            description: d.description ?? "",
          },
        }),
      });
      const data = await res.json();
      if (data.result) {
        setMemoResult(data.result as ICMemoResult);
        if (!agentMock) setAgentMock(data.analysis?._mock === true);
        setMemoExpanded(true);
      }
    } catch {
      // silently fail
    } finally {
      setMemoLoading(false);
    }
  }

  const subtitle = [d.sector, d.stage?.replace(/-/g, " ")].filter(Boolean).join(" · ") || undefined;

  const links: { label: string; url: string }[] = (
    [
      { label: "Pitch Deck", url: fullDeal?.pitchDeckUrl },
      { label: "IC Memo", url: fullDeal?.icMemoUrl },
      { label: "Data Room", url: fullDeal?.dataRoomUrl },
      { label: "Website", url: fullDeal?.website },
      { label: "LinkedIn", url: fullDeal?.linkedinUrl },
      { label: "Crunchbase", url: fullDeal?.crunchbaseUrl },
    ] as { label: string; url: string | null | undefined }[]
  ).filter((l): l is { label: string; url: string } => typeof l.url === "string" && l.url.length > 0);

  return (
    <ContextPanel
      title={deal.company}
      subtitle={subtitle}
      actions={
        <Badge
          label={statusLabel[deal.status] ?? deal.status}
          variant={statusVariant[deal.status] ?? "default"}
          size="xs"
        />
      }
    >
      {fetching ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "32px 0",
          }}
        >
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              border: "2px solid var(--border)",
              borderTopColor: "var(--accent)",
              animation: "spin 0.7s linear infinite",
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Score */}
          {d.dealScore != null && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <ScoreRing score={d.dealScore} size={48} />
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Deal Score</span>
            </div>
          )}

          {/* Metrics grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px 12px",
            }}
          >
            {[
              { label: "Capital Ask", value: d.capitalAsk ? formatCurrency(d.capitalAsk) : null },
              { label: "Valuation", value: fullDeal?.valuation ? formatCurrency(fullDeal.valuation) : null },
              { label: "Ownership", value: fullDeal?.ownership != null ? `${fullDeal.ownership}%` : null },
              { label: "Source", value: d.sourceType ? d.sourceType.replace(/-/g, " ") : null },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>
                  {label}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums" }}>
                  {value ?? "—"}
                </div>
              </div>
            ))}
          </div>

          {/* Description */}
          {d.description && (
            <div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                Description
              </div>
              <p style={{ fontSize: 12, lineHeight: 1.6, color: "var(--text-secondary)", margin: 0 }}>
                {d.description}
              </p>
            </div>
          )}

          {/* Links */}
          {links.length > 0 && (
            <div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                Links
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {links.map(({ label, url }) => (
                  <a
                    key={label}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 11,
                      padding: "4px 8px",
                      borderRadius: 4,
                      background: "var(--bg-elevated)",
                      color: "var(--text-secondary)",
                      border: "1px solid var(--border)",
                      textDecoration: "none",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "var(--accent)";
                      e.currentTarget.style.borderColor = "var(--accent)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "var(--text-secondary)";
                      e.currentTarget.style.borderColor = "var(--border)";
                    }}
                  >
                    <ExternalLink size={10} />
                    {label}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* AI Agent Actions */}
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={runDealAnalysis}
              disabled={analysisLoading}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                padding: "7px 10px",
                borderRadius: 5,
                fontSize: 11,
                fontWeight: 500,
                background: analysisResult ? "var(--bg-elevated)" : "var(--accent-muted)",
                color: analysisResult ? "var(--text-secondary)" : "var(--accent)",
                border: "1px solid",
                borderColor: analysisResult ? "var(--border)" : "rgba(59,130,246,0.3)",
                cursor: analysisLoading ? "wait" : "pointer",
                opacity: analysisLoading ? 0.6 : 1,
              }}
            >
              {analysisLoading ? (
                <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", border: "1.5px solid var(--border)", borderTopColor: "var(--accent)", animation: "spin 0.7s linear infinite" }} />
              ) : (
                <Zap size={10} />
              )}
              {analysisResult ? "Re-analyze" : "Analyze"}
            </button>
            <button
              onClick={runICMemo}
              disabled={memoLoading}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                padding: "7px 10px",
                borderRadius: 5,
                fontSize: 11,
                fontWeight: 500,
                background: memoResult ? "var(--bg-elevated)" : "transparent",
                color: "var(--text-secondary)",
                border: "1px solid var(--border)",
                cursor: memoLoading ? "wait" : "pointer",
                opacity: memoLoading ? 0.6 : 1,
              }}
            >
              {memoLoading ? (
                <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", border: "1.5px solid var(--border)", borderTopColor: "var(--text-muted)", animation: "spin 0.7s linear infinite" }} />
              ) : null}
              IC Memo
            </button>
          </div>

          {/* Deal Score Analysis Results */}
          {analysisResult && (
            <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 6, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
              {/* Header: score + mock badge */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{
                    fontSize: 22,
                    fontWeight: 700,
                    fontVariantNumeric: "tabular-nums",
                    color: analysisResult.score >= 70 ? "#10b981" : analysisResult.score >= 50 ? "#f59e0b" : "#ef4444",
                  }}>
                    {analysisResult.score}
                  </span>
                  <span style={{ fontSize: 10, color: "var(--text-muted)" }}>/ 100</span>
                  <Badge
                    label={analysisResult.recommendation}
                    variant={analysisResult.recommendation === "pursue" ? "success" : analysisResult.recommendation === "pass" ? "danger" : "warning"}
                    size="xs"
                  />
                </div>
                {agentMock && (
                  <span style={{ fontSize: 10, color: "#f59e0b", opacity: 0.7 }}>demo · mock</span>
                )}
              </div>
              {/* Summary */}
              <p style={{ fontSize: 11, lineHeight: 1.6, color: "var(--text-secondary)", margin: 0 }}>{analysisResult.summary}</p>
              {/* Risks */}
              {analysisResult.risks.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Risks</div>
                  <ul style={{ margin: 0, paddingLeft: 14, display: "flex", flexDirection: "column", gap: 3 }}>
                    {analysisResult.risks.slice(0, 3).map((r, i) => (
                      <li key={i} style={{ fontSize: 11, color: "var(--text-secondary)" }}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
              {/* Opportunities */}
              {analysisResult.opportunities.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Upside</div>
                  <ul style={{ margin: 0, paddingLeft: 14, display: "flex", flexDirection: "column", gap: 3 }}>
                    {analysisResult.opportunities.slice(0, 3).map((o, i) => (
                      <li key={i} style={{ fontSize: 11, color: "var(--text-secondary)" }}>{o}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* IC Memo Results */}
          {memoResult && (
            <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 6, overflow: "hidden" }}>
              <button
                onClick={() => setMemoExpanded((v) => !v)}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "transparent", border: "none", cursor: "pointer" }}
              >
                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)" }}>IC Memo</span>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {agentMock && <span style={{ fontSize: 10, color: "#f59e0b", opacity: 0.7 }}>demo · mock</span>}
                  <ChevronDown size={12} style={{ color: "var(--text-muted)", transform: memoExpanded ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
                </div>
              </button>
              {memoExpanded && (
                <div style={{ padding: "0 14px 12px", display: "flex", flexDirection: "column", gap: 10, borderTop: "1px solid var(--border-subtle)" }}>
                  <p style={{ fontSize: 11, lineHeight: 1.6, color: "var(--text-secondary)", margin: "10px 0 0" }}>{memoResult.executiveSummary}</p>
                  <div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Recommendation</div>
                    <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: 0 }}>{memoResult.recommendation}</p>
                  </div>
                  {memoResult.nextSteps.length > 0 && (
                    <div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Next Steps</div>
                      <ol style={{ margin: 0, paddingLeft: 14, display: "flex", flexDirection: "column", gap: 3 }}>
                        {memoResult.nextSteps.slice(0, 3).map((s, i) => (
                          <li key={i} style={{ fontSize: 11, color: "var(--text-secondary)" }}>{s}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Full details CTA */}
          <Link
            href={`/opportunities/${deal.id}`}
            style={{
              display: "block",
              textAlign: "center",
              padding: "8px 12px",
              borderRadius: 6,
              background: "var(--accent)",
              color: "#fff",
              fontSize: 12,
              fontWeight: 500,
              textDecoration: "none",
              marginTop: 4,
            }}
          >
            View Full Details →
          </Link>
        </div>
      )}
    </ContextPanel>
  );
}

function StatusDropdown({
  deal,
  onUpdate,
}: {
  deal: Deal;
  onUpdate: (dealId: string, newStatus: string, prevStatus: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "3px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: 0,
        }}
        title="Change status"
      >
        <Badge
          label={statusLabel[deal.status] ?? deal.status}
          variant={statusVariant[deal.status] ?? "default"}
          size="xs"
        />
        <ChevronDown
          size={10}
          style={{ color: "var(--text-muted)", flexShrink: 0, marginTop: "1px" }}
        />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            zIndex: 50,
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            borderRadius: "6px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            minWidth: "130px",
            overflow: "hidden",
          }}
        >
          {SELECTABLE_STATUSES.map((s) => (
            <button
              key={s}
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                if (s !== deal.status) {
                  onUpdate(deal.id, s, deal.status);
                }
              }}
              style={{
                display: "flex",
                alignItems: "center",
                width: "100%",
                padding: "7px 10px",
                gap: "8px",
                background: s === deal.status ? "rgba(255,255,255,0.05)" : "transparent",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <Badge label={statusLabel[s]} variant={statusVariant[s] ?? "default"} size="xs" />
              {s === deal.status && (
                <span style={{ marginLeft: "auto", fontSize: "9px", color: "var(--text-muted)" }}>✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const PIPELINE_STATUSES = ["inbound", "reviewing", "diligence", "ic-review", "invested"] as const;

const COLUMN_ACCENT: Record<string, string> = {
  inbound: "var(--accent)",
  reviewing: "var(--accent)",
  diligence: "#f59e0b",
  "ic-review": "#f59e0b",
  invested: "#10b981",
};

interface KanbanBoardProps {
  filtered: Deal[];
  loading: boolean;
  handleStatusUpdate: (dealId: string, newStatus: string, prevStatus: string) => void;
  openDealPanel: (deal: Deal) => void;
}

function KanbanBoard({ filtered, loading, handleStatusUpdate, openDealPanel }: KanbanBoardProps) {
  // Group deals by status
  const columns = PIPELINE_STATUSES.map((status) => ({
    status,
    deals: filtered.filter((d) => d.status === status),
  }));

  function getNextStatus(status: string): string | null {
    const idx = PIPELINE_STATUSES.indexOf(status as typeof PIPELINE_STATUSES[number]);
    if (idx === -1 || idx === PIPELINE_STATUSES.length - 1) return null;
    return PIPELINE_STATUSES[idx + 1];
  }

  const canPass = (status: string) =>
    ["inbound", "reviewing", "diligence", "ic-review"].includes(status);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        gap: 12,
        overflowX: "auto",
        overflowY: "hidden",
        paddingBottom: 16,
        height: "100%",
        alignItems: "flex-start",
      }}
    >
      {columns.map(({ status, deals: colDeals }) => {
        const totalAsk = colDeals.reduce((sum, d) => sum + (d.capitalAsk ?? 0), 0);
        const accent = COLUMN_ACCENT[status] ?? "var(--accent)";

        return (
          <div
            key={status}
            style={{
              minWidth: 280,
              maxWidth: 280,
              display: "flex",
              flexDirection: "column",
              height: "100%",
              flexShrink: 0,
            }}
          >
            {/* Column header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 4px",
                marginBottom: 8,
                borderBottom: `2px solid ${accent}`,
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {statusLabel[status] ?? status}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: accent,
                  background: `${accent}22`,
                  borderRadius: 10,
                  padding: "1px 7px",
                  lineHeight: 1.5,
                  border: `1px solid ${accent}44`,
                }}
              >
                {loading ? "—" : colDeals.length}
              </span>
              {!loading && totalAsk > 0 && (
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: 11,
                    color: "var(--text-muted)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {formatCurrency(totalAsk)}
                </span>
              )}
            </div>

            {/* Cards area */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {loading ? (
                // Skeleton ghost cards
                [0, 1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      padding: 12,
                      background: "var(--bg-surface)",
                      opacity: 0.5,
                    }}
                  >
                    <div
                      style={{
                        height: 12,
                        borderRadius: 4,
                        background: "var(--bg-elevated)",
                        marginBottom: 8,
                        width: "70%",
                      }}
                    />
                    <div
                      style={{
                        height: 10,
                        borderRadius: 4,
                        background: "var(--bg-elevated)",
                        marginBottom: 6,
                        width: "45%",
                      }}
                    />
                    <div
                      style={{
                        height: 10,
                        borderRadius: 4,
                        background: "var(--bg-elevated)",
                        width: "55%",
                      }}
                    />
                  </div>
                ))
              ) : colDeals.length === 0 ? (
                // Empty state
                <div
                  style={{
                    border: "1px dashed var(--border)",
                    borderRadius: 8,
                    padding: "24px 12px",
                    textAlign: "center",
                    color: "var(--text-muted)",
                    fontSize: 12,
                  }}
                >
                  No deals
                </div>
              ) : (
                colDeals.map((deal) => {
                  const nextStatus = getNextStatus(deal.status);
                  return (
                    <div
                      key={deal.id}
                      onClick={() => openDealPanel(deal)}
                      style={{
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        padding: 12,
                        background: "var(--bg-surface)",
                        cursor: "pointer",
                        position: "relative",
                        transition: "border-color 0.15s, background 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLDivElement).style.background = "var(--bg-elevated)";
                        (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(99,102,241,0.4)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLDivElement).style.background = "var(--bg-surface)";
                        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)";
                      }}
                    >
                      {/* Score ring — top right if present */}
                      {deal.dealScore != null && (
                        <div
                          style={{ position: "absolute", top: 10, right: 10 }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ScoreRing score={deal.dealScore} size={28} />
                        </div>
                      )}

                      {/* Company name */}
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "var(--text-primary)",
                          paddingRight: deal.dealScore != null ? 36 : 0,
                          marginBottom: 4,
                          lineHeight: 1.3,
                        }}
                      >
                        {deal.company}
                      </div>

                      {/* Sector + stage */}
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 4,
                          marginBottom: 6,
                          alignItems: "center",
                        }}
                      >
                        {deal.sector && (
                          <span
                            style={{
                              fontSize: 10,
                              color: "var(--text-muted)",
                              background: "var(--bg-elevated)",
                              borderRadius: 4,
                              padding: "1px 5px",
                              border: "1px solid var(--border)",
                            }}
                          >
                            {deal.sector}
                          </span>
                        )}
                        {deal.stage && (
                          <span
                            style={{
                              fontSize: 10,
                              color: "var(--text-muted)",
                            }}
                          >
                            {deal.stage.replace(/-/g, " ")}
                          </span>
                        )}
                      </div>

                      {/* Capital ask */}
                      {deal.capitalAsk != null && (
                        <div
                          style={{
                            fontSize: 12,
                            color: "var(--text-secondary)",
                            fontVariantNumeric: "tabular-nums",
                            marginBottom: 4,
                          }}
                        >
                          {formatCurrency(deal.capitalAsk)}
                        </div>
                      )}

                      {/* Source type chip */}
                      {deal.sourceType && (
                        <div
                          style={{
                            fontSize: 10,
                            color: "var(--text-muted)",
                            marginBottom: 8,
                          }}
                        >
                          via {deal.sourceType.replace(/-/g, " ")}
                        </div>
                      )}

                      {/* Bottom row: view link + action buttons */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginTop: 6,
                        }}
                      >
                        <Link
                          href={`/opportunities/${deal.id}`}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            fontSize: 10,
                            color: "var(--accent)",
                            textDecoration: "none",
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.textDecoration = "underline";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.textDecoration = "none";
                          }}
                        >
                          View details
                        </Link>

                        <div
                          style={{ display: "flex", alignItems: "center", gap: 4 }}
                        >
                          {/* Pass button */}
                          {canPass(deal.status) && (
                            <button
                              title="Pass on deal"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusUpdate(deal.id, "passed", deal.status);
                              }}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: 22,
                                height: 22,
                                borderRadius: 4,
                                border: "1px solid var(--border)",
                                background: "transparent",
                                cursor: "pointer",
                                color: "var(--text-muted)",
                                padding: 0,
                              }}
                              onMouseEnter={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.color = "#ef4444";
                                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(239,68,68,0.4)";
                                (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.08)";
                              }}
                              onMouseLeave={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)";
                                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
                                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                              }}
                            >
                              <X size={11} />
                            </button>
                          )}

                          {/* Advance button */}
                          {nextStatus && (
                            <button
                              title={`Advance to ${statusLabel[nextStatus] ?? nextStatus}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusUpdate(deal.id, nextStatus, deal.status);
                              }}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: 22,
                                height: 22,
                                borderRadius: 4,
                                border: "1px solid var(--border)",
                                background: "transparent",
                                cursor: "pointer",
                                color: "var(--text-muted)",
                                padding: 0,
                              }}
                              onMouseEnter={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.color = "var(--accent)";
                                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(59,130,246,0.4)";
                                (e.currentTarget as HTMLButtonElement).style.background = "var(--accent-muted)";
                              }}
                              onMouseLeave={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)";
                                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
                                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                              }}
                            >
                              <ChevronRight size={11} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function OpportunitiesPage() {
  const familyId = useFamilyId();
  const router = useRouter();
  const { openPanel, closePanel, isPanelOpen } = usePanel();
  const [filter, setFilter] = useState("All");
  const [viewMode, setViewMode] = useState<"list" | "board">("list");
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingMock, setUsingMock] = useState(false);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);

  // Keep row highlight in sync when panel is closed externally (e.g. via X button)
  useEffect(() => {
    if (!isPanelOpen) setSelectedDealId(null);
  }, [isPanelOpen]);

  async function loadDeals(fid: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/deals?familyId=${encodeURIComponent(fid)}`);
      const data = await res.json();
      const loaded: Deal[] = data.deals ?? data;
      if (loaded.length > 0) {
        setDeals(loaded);
        setUsingMock(false);
      } else {
        setDeals(MOCK_DEALS);
        setUsingMock(true);
      }
    } catch {
      setDeals(MOCK_DEALS);
      setUsingMock(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (familyId) loadDeals(familyId);
  }, [familyId]);

  const handleStatusUpdate = useCallback(async (dealId: string, newStatus: string, prevStatus: string) => {
    // Optimistic update
    setDeals((prev) => prev.map((d) => d.id === dealId ? { ...d, status: newStatus } : d));
    try {
      const res = await fetch(`/api/deals/${dealId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        // Revert on failure
        setDeals((prev) => prev.map((d) => d.id === dealId ? { ...d, status: prevStatus } : d));
      }
    } catch {
      setDeals((prev) => prev.map((d) => d.id === dealId ? { ...d, status: prevStatus } : d));
    }
  }, []);

  function openDealPanel(deal: Deal) {
    if (selectedDealId === deal.id) {
      setSelectedDealId(null);
      closePanel();
    } else {
      setSelectedDealId(deal.id);
      openPanel(<DealPreviewPanel deal={deal} familyId={familyId ?? "demo"} />);
    }
  }

  const filtered = filter === "All"
    ? deals
    : deals.filter((d) => d.status === filter.toLowerCase().replace(" ", "-"));

  // router is kept for potential future use
  void router;

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Opportunities"
        subtitle={`${deals.length} deal${deals.length !== 1 ? "s" : ""} in pipeline`}
        actions={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* View toggle */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                border: "1px solid var(--border)",
                borderRadius: 6,
                overflow: "hidden",
              }}
            >
              <button
                onClick={() => setViewMode("list")}
                title="List view"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                  padding: "6px 10px",
                  border: "none",
                  background: viewMode === "list" ? "var(--accent)" : "transparent",
                  color: viewMode === "list" ? "#fff" : "var(--text-muted)",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                <LayoutList size={13} />
                List
              </button>
              <button
                onClick={() => setViewMode("board")}
                title="Board view"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                  padding: "6px 10px",
                  border: "none",
                  borderLeft: "1px solid var(--border)",
                  background: viewMode === "board" ? "var(--accent)" : "transparent",
                  color: viewMode === "board" ? "#fff" : "var(--text-muted)",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                <Kanban size={13} />
                Board
              </button>
            </div>

            <Link
              href="/import/deals"
              className="flex items-center gap-1.5 px-3 py-2 rounded text-sm font-medium"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              <Plus size={14} />
              Add Deal
            </Link>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-1 px-8 py-3 border-b overflow-x-auto" style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}>
        {STATUS_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded text-xs whitespace-nowrap transition-colors"
            style={filter === f ? { background: "var(--accent)", color: "#fff" } : { color: "var(--text-secondary)" }}
          >
            {f}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          {usingMock && (
            <span className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}>
              demo data — import real deals
            </span>
          )}
          <button onClick={() => { if (familyId) loadDeals(familyId); }} className="p-1.5 rounded hover:bg-white/5 transition-colors" style={{ color: "var(--text-muted)" }}>
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* Content: List or Board */}
      {viewMode === "list" ? (
        <div className="flex-1 overflow-auto px-8 py-4">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-sm" style={{ color: "var(--text-muted)" }}>
              Loading deals...
            </div>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Company", "Sector", "Stage", "Ask", "Score", "Status", "Added", ""].map((h) => (
                    <th key={h} className="text-left py-2.5 px-3 text-xs font-medium tracking-wide" style={{ color: "var(--text-muted)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((deal) => (
                  <tr
                    key={deal.id}
                    className="group transition-colors"
                    style={{
                      borderBottom: "1px solid var(--border-subtle)",
                      cursor: "pointer",
                      background: selectedDealId === deal.id ? "var(--bg-elevated)" : "transparent",
                      borderLeft: selectedDealId === deal.id ? "2px solid var(--accent)" : "2px solid transparent",
                    }}
                    onClick={() => openDealPanel(deal)}
                    onMouseEnter={(e) => { if (selectedDealId !== deal.id) e.currentTarget.style.background = "var(--bg-elevated)"; }}
                    onMouseLeave={(e) => { if (selectedDealId !== deal.id) e.currentTarget.style.background = "transparent"; }}
                  >
                    <td className="py-3 px-3">
                      <div className="font-medium" style={{ color: "var(--text-primary)" }}>{deal.company}</div>
                      {deal.sourceType && <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{deal.sourceType.replace("-", " ")}</div>}
                    </td>
                    <td className="py-3 px-3" style={{ color: "var(--text-secondary)" }}>{deal.sector ?? "—"}</td>
                    <td className="py-3 px-3">
                      {deal.stage ? <Badge label={deal.stage.replace(/-/g, " ")} variant="muted" size="xs" /> : <span style={{ color: "var(--text-muted)" }}>—</span>}
                    </td>
                    <td className="py-3 px-3 font-mono text-xs" style={{ color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums" }}>
                      {deal.capitalAsk ? formatCurrency(deal.capitalAsk) : "—"}
                    </td>
                    <td className="py-3 px-3">
                      {deal.dealScore ? <ScoreRing score={deal.dealScore} size={36} /> : <span className="text-xs" style={{ color: "var(--text-muted)" }}>—</span>}
                    </td>
                    <td className="py-3 px-3">
                      <StatusDropdown deal={deal} onUpdate={handleStatusUpdate} />
                    </td>
                    <td className="py-3 px-3 text-xs" style={{ color: "var(--text-muted)" }}>
                      {deal.createdAt ? formatDate(deal.createdAt) : "—"}
                    </td>
                    <td className="py-3 px-3">
                      <Link
                        href={`/opportunities/${deal.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-opacity"
                        style={{ background: "var(--accent-muted)", color: "var(--accent)", border: "1px solid rgba(59,130,246,0.2)" }}
                      >
                        <ExternalLink size={11} /> Full Details
                      </Link>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                      No deals match this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="flex-1 px-8 py-4" style={{ overflow: "hidden" }}>
          <KanbanBoard
            filtered={filtered}
            loading={loading}
            handleStatusUpdate={handleStatusUpdate}
            openDealPanel={openDealPanel}
          />
        </div>
      )}
    </div>
  );
}
