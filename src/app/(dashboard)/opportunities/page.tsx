"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, Plus, Filter, ChevronRight, ExternalLink, Zap, RefreshCw, ChevronDown } from "lucide-react";
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

  // familyId is threaded through props but not used in this fetch since the API uses deal.id
  void familyId;

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

export default function OpportunitiesPage() {
  const familyId = useFamilyId();
  const router = useRouter();
  const { openPanel, closePanel, isPanelOpen } = usePanel();
  const [filter, setFilter] = useState("All");
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
          <Link
            href="/import/deals"
            className="flex items-center gap-1.5 px-3 py-2 rounded text-sm font-medium"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            <Plus size={14} />
            Add Deal
          </Link>
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

      {/* Table */}
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
    </div>
  );
}
