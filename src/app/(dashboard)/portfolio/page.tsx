"use client";

import { useEffect, useState } from "react";
import { BarChart3, AlertTriangle, Loader2, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Pencil } from "lucide-react";
import Badge from "@/components/ui/Badge";
import PageHeader from "@/components/ui/PageHeader";
import ContextPanel from "@/components/ui/ContextPanel";
import { formatCurrency } from "@/lib/utils";
import { useFamilyId } from "@/context/FamilyContext";
import { usePanel } from "@/context/PanelContext";

interface PortfolioAlert {
  id: string;
  companyId: string;
  type: string;
  severity: string;
  title: string;
  body?: string;
  source?: string;
  read: boolean;
  createdAt: string;
}

interface PortfolioCompany {
  id: string;
  familyId?: string;
  name: string;
  sector?: string;
  stage?: string;
  status: string;
  investedAmount?: number;
  currentValue?: number;
  ownership?: number;
  alertLevel: string;
  description?: string;
  alerts: PortfolioAlert[];
}

// --- Analytics types ---
interface SectorBucket {
  sector: string;
  count: number;
  totalValue: number;
  pct: number;
}

interface StageBucket {
  stage: string;
  count: number;
  totalValue: number;
  pct: number;
}

interface VintageBucket {
  year: number;
  count: number;
  deployed: number;
}

interface ConcentrationWarning {
  type: string;
  label: string;
  pct: number;
  message: string;
}

interface AnalyticsData {
  allocationBySector: SectorBucket[];
  allocationByStage: StageBucket[];
  vintageByYear: VintageBucket[];
  concentrationWarnings: ConcentrationWarning[];
  totalDeployed: number;
  totalPortfolioValue: number;
  companiesCount: number;
  _mock?: boolean;
}

interface MonitorResult {
  healthScore: number;
  summary: string;
  recommendation: string;
  risks: string[];
  opportunities: string[];
  keyMetrics?: Record<string, string | number>;
  alerts?: string[];
}

// --- Color palettes ---
const alertColor: Record<string, string> = {
  critical: "#ef4444",
  warning: "#f59e0b",
  watch: "#f59e0b",
  info: "var(--accent)",
  normal: "var(--text-muted)",
  alert: "#ef4444",
};

const statusVariant: Record<string, "success" | "warning" | "danger" | "muted"> = {
  active: "success",
  watchlist: "warning",
  exited: "muted",
  "written-off": "danger",
};

const SECTOR_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];
const STAGE_COLORS = ["#10b981", "#6366f1", "#f59e0b", "#8b5cf6", "#06b6d4", "#ef4444"];

function moicColor(moic: number): string {
  if (moic >= 2) return "#10b981";
  if (moic >= 1) return "#f59e0b";
  return "#ef4444";
}

// --- Sub-components ---

function AllocationBars({
  items,
  labelKey,
  colors,
}: {
  items: Array<{ label: string; count: number; totalValue: number; pct: number }>;
  labelKey: string;
  colors: string[];
}) {
  return (
    <div className="flex flex-col gap-2.5">
      {items.map((item, i) => (
        <div key={`${labelKey}-${item.label}`} className="flex items-center gap-3">
          {/* Bar track */}
          <div
            className="relative flex-1 rounded"
            style={{ height: 6, background: "var(--bg-elevated)" }}
          >
            <div
              className="absolute inset-y-0 left-0 rounded"
              style={{
                width: `${item.pct}%`,
                background: colors[i % colors.length],
                height: 6,
                borderRadius: 3,
              }}
            />
          </div>
          {/* Label + stats */}
          <div className="flex items-center gap-2 w-64 shrink-0">
            <span
              className="text-xs font-medium truncate flex-1"
              style={{ color: "var(--text-primary)" }}
            >
              {item.label}
            </span>
            <span
              className="text-xs tabular-nums"
              style={{ color: "var(--text-muted)", minWidth: 28, textAlign: "right" }}
            >
              {item.pct}%
            </span>
            <span
              className="text-xs tabular-nums"
              style={{ color: "var(--text-secondary)", minWidth: 46, textAlign: "right" }}
            >
              {formatCurrency(item.totalValue)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function VintageHeatmap({ items }: { items: VintageBucket[] }) {
  const maxDeployed = Math.max(...items.map((v) => v.deployed), 1);
  return (
    <div className="flex flex-col gap-2">
      {items.map((v) => (
        <div key={v.year} className="flex items-center gap-3">
          <span
            className="text-xs tabular-nums font-medium"
            style={{ color: "var(--text-muted)", width: 36 }}
          >
            {v.year}
          </span>
          <div
            className="relative rounded"
            style={{ height: 6, flex: 1, background: "var(--bg-elevated)" }}
          >
            <div
              className="absolute inset-y-0 left-0 rounded"
              style={{
                width: `${(v.deployed / maxDeployed) * 100}%`,
                background: "var(--accent)",
                height: 6,
                borderRadius: 3,
              }}
            />
          </div>
          <span
            className="text-xs tabular-nums"
            style={{ color: "var(--text-secondary)", minWidth: 46, textAlign: "right" }}
          >
            {formatCurrency(v.deployed)}
          </span>
          <span
            className="text-xs tabular-nums"
            style={{ color: "var(--text-muted)", minWidth: 44, textAlign: "right" }}
          >
            {v.count} {v.count === 1 ? "co" : "cos"}
          </span>
        </div>
      ))}
    </div>
  );
}

// --- Company Detail Panel ---

function CompanyDetailPanel({ company }: { company: PortfolioCompany }) {
  const moic =
    company.investedAmount && company.currentValue && company.investedAmount > 0
      ? company.currentValue / company.investedAmount
      : null;

  const [monitorLoading, setMonitorLoading] = useState(false);
  const [monitorResult, setMonitorResult] = useState<MonitorResult | null>(null);
  const [monitorMock, setMonitorMock] = useState(false);

  async function runMonitor() {
    setMonitorLoading(true);
    setMonitorResult(null);
    try {
      const res = await fetch("/api/agents/portfolio-monitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyId: "demo",
          companyId: company.id,
          context: {
            name: company.name,
            sector: company.sector ?? "",
            stage: company.stage ?? "",
            status: company.status,
            investedAmount: company.investedAmount ?? 0,
            currentValue: company.currentValue ?? 0,
            ownership: company.ownership ?? 0,
            alertLevel: company.alertLevel,
          },
        }),
      });
      const data = await res.json();
      if (data.result) {
        setMonitorResult(data.result as MonitorResult);
        setMonitorMock(data.analysis?._mock === true);
      }
    } catch {
      // silently fail
    } finally {
      setMonitorLoading(false);
    }
  }

  return (
    <ContextPanel
      title={company.name}
      subtitle={[company.sector, company.stage].filter(Boolean).join(" · ") || undefined}
      actions={
        <Badge
          label={company.status}
          variant={statusVariant[company.status] ?? "muted"}
          size="xs"
        />
      }
    >
      {/* Metrics section */}
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "var(--text-muted)",
            marginBottom: 8,
          }}
        >
          Metrics
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            {
              label: "Invested",
              value: company.investedAmount ? formatCurrency(company.investedAmount) : "—",
              color: "var(--text-primary)" as string,
            },
            {
              label: "Current Value",
              value: company.currentValue ? formatCurrency(company.currentValue) : "—",
              color: "var(--text-primary)" as string,
            },
            {
              label: "MOIC",
              value: moic != null ? `${moic.toFixed(2)}x` : "—",
              color: moic != null ? moicColor(moic) : "var(--text-muted)",
            },
            {
              label: "Ownership",
              value: company.ownership != null ? `${company.ownership}%` : "—",
              color: "var(--text-primary)" as string,
            },
          ].map(({ label, value, color }) => (
            <div key={label}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>
                {label}
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Alert level (if not normal) */}
      {company.alertLevel !== "normal" && (
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--text-muted)",
              marginBottom: 8,
            }}
          >
            Alert Level
          </div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              fontWeight: 500,
              color: alertColor[company.alertLevel] ?? alertColor.info,
              background:
                company.alertLevel === "critical" || company.alertLevel === "alert"
                  ? "rgba(239,68,68,0.08)"
                  : "rgba(245,158,11,0.08)",
              border: `1px solid ${
                company.alertLevel === "critical" || company.alertLevel === "alert"
                  ? "rgba(239,68,68,0.2)"
                  : "rgba(245,158,11,0.2)"
              }`,
              borderRadius: 6,
              padding: "4px 10px",
            }}
          >
            <AlertTriangle size={12} />
            {company.alertLevel}
          </div>
        </div>
      )}

      {/* Description */}
      {company.description && (
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--text-muted)",
              marginBottom: 8,
            }}
          >
            Description
          </div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>
            {company.description}
          </div>
        </div>
      )}

      {/* Alerts section */}
      <div>
        <div
          style={{
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "var(--text-muted)",
            marginBottom: 8,
          }}
        >
          Alerts
        </div>
        {company.alerts.length === 0 ? (
          <div style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", padding: "12px 0" }}>
            No alerts
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {company.alerts.map((alert) => (
              <div
                key={alert.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  padding: "8px 10px",
                  borderRadius: 6,
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: alertColor[alert.severity] ?? alertColor.info,
                    marginTop: 3,
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-primary)" }}>
                    {alert.title}
                  </div>
                  {alert.body && (
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-secondary)",
                        marginTop: 2,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {alert.body}
                    </div>
                  )}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--text-muted)",
                    flexShrink: 0,
                    whiteSpace: "nowrap",
                  }}
                >
                  {new Date(alert.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Portfolio Monitor */}
      <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
        <button
          onClick={runMonitor}
          disabled={monitorLoading}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
            padding: "8px 12px",
            borderRadius: 5,
            fontSize: 11,
            fontWeight: 500,
            background: monitorResult ? "var(--bg-elevated)" : "var(--accent-muted)",
            color: monitorResult ? "var(--text-secondary)" : "var(--accent)",
            border: "1px solid",
            borderColor: monitorResult ? "var(--border)" : "rgba(59,130,246,0.3)",
            cursor: monitorLoading ? "wait" : "pointer",
            opacity: monitorLoading ? 0.7 : 1,
            width: "100%",
          }}
        >
          {monitorLoading ? (
            <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", border: "1.5px solid var(--border)", borderTopColor: "var(--accent)", animation: "spin 0.7s linear infinite" }} />
          ) : null}
          {monitorResult ? "Re-run Monitor" : "Run Portfolio Monitor"}
        </button>

        {monitorResult && (
          <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 6, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Score header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  fontSize: 22,
                  fontWeight: 700,
                  fontVariantNumeric: "tabular-nums",
                  color: monitorResult.healthScore >= 70 ? "#10b981" : monitorResult.healthScore >= 50 ? "#f59e0b" : "#ef4444",
                }}>
                  {monitorResult.healthScore}
                </span>
                <span style={{ fontSize: 10, color: "var(--text-muted)" }}>health</span>
                <Badge
                  label={monitorResult.recommendation}
                  variant={monitorResult.recommendation === "healthy" ? "success" : monitorResult.recommendation === "monitor" ? "warning" : "danger"}
                  size="xs"
                />
              </div>
              {monitorMock && <span style={{ fontSize: 10, color: "#f59e0b", opacity: 0.7 }}>demo · mock</span>}
            </div>
            {/* Summary */}
            <p style={{ fontSize: 11, lineHeight: 1.6, color: "var(--text-secondary)", margin: 0 }}>{monitorResult.summary}</p>
            {/* Key Metrics */}
            {monitorResult.keyMetrics && Object.keys(monitorResult.keyMetrics).length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 12px" }}>
                {Object.entries(monitorResult.keyMetrics).slice(0, 4).map(([k, v]) => (
                  <div key={k}>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{k.replace(/([A-Z])/g, " $1").trim()}</div>
                    <div style={{ fontSize: 11, color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums" }}>{String(v)}</div>
                  </div>
                ))}
              </div>
            )}
            {/* Risks */}
            {monitorResult.risks.length > 0 && (
              <div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Risks</div>
                <ul style={{ margin: 0, paddingLeft: 14, display: "flex", flexDirection: "column", gap: 3 }}>
                  {monitorResult.risks.slice(0, 3).map((r, i) => (
                    <li key={i} style={{ fontSize: 11, color: "var(--text-secondary)" }}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
            {/* Opportunities */}
            {monitorResult.opportunities.length > 0 && (
              <div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Opportunities</div>
                <ul style={{ margin: 0, paddingLeft: 14, display: "flex", flexDirection: "column", gap: 3 }}>
                  {monitorResult.opportunities.slice(0, 3).map((o, i) => (
                    <li key={i} style={{ fontSize: 11, color: "var(--text-secondary)" }}>{o}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </ContextPanel>
  );
}

// ── EditCompanyModal ──────────────────────────────────────────────────────────

interface EditCompanyForm {
  currentValue: string;
  investedAmount: string;
  ownership: string;
  alertLevel: string;
  status: string;
  description: string;
  website: string;
}

function EditCompanyModal({
  company,
  onClose,
  onSuccess,
}: {
  company: PortfolioCompany;
  onClose: () => void;
  onSuccess: (updated: PortfolioCompany) => void;
}) {
  const [form, setForm] = useState<EditCompanyForm>({
    currentValue: company.currentValue != null ? String(company.currentValue) : "",
    investedAmount: company.investedAmount != null ? String(company.investedAmount) : "",
    ownership: company.ownership != null ? String(company.ownership) : "",
    alertLevel: company.alertLevel ?? "normal",
    status: company.status ?? "active",
    description: company.description ?? "",
    website: (company as PortfolioCompany & { website?: string }).website ?? "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const body: Record<string, unknown> = {
        alertLevel: form.alertLevel,
        status: form.status,
        description: form.description.trim() || null,
        website: form.website.trim() || null,
      };
      if (form.currentValue !== "") body.currentValue = parseFloat(form.currentValue);
      if (form.investedAmount !== "") body.investedAmount = parseFloat(form.investedAmount);
      if (form.ownership !== "") body.ownership = parseFloat(form.ownership);

      const res = await fetch(`/api/portfolio/${company.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to update company");
        return;
      }
      const data = await res.json().catch(() => ({}));
      const updated: PortfolioCompany = data.company ?? {
        ...company,
        currentValue: form.currentValue !== "" ? parseFloat(form.currentValue) : company.currentValue,
        investedAmount: form.investedAmount !== "" ? parseFloat(form.investedAmount) : company.investedAmount,
        ownership: form.ownership !== "" ? parseFloat(form.ownership) : company.ownership,
        alertLevel: form.alertLevel,
        status: form.status,
        description: form.description.trim() || company.description,
      };
      onSuccess(updated);
      onClose();
    } catch {
      setError("Network error — please try again");
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls = "w-full rounded-md border px-3 py-2 text-sm focus:outline-none";
  const inputStyle = { background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-primary)" };
  const labelStyle = { color: "var(--text-secondary)" };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl shadow-2xl overflow-hidden"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", maxHeight: "90vh", display: "flex", flexDirection: "column" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <div>
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Edit Company</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{company.name}</p>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          <form id="edit-company-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={labelStyle}>Current Value ($)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={form.currentValue}
                  onChange={(e) => setForm((f) => ({ ...f, currentValue: e.target.value }))}
                  placeholder="e.g. 5000000"
                  className={inputCls}
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={labelStyle}>Invested Amount ($)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={form.investedAmount}
                  onChange={(e) => setForm((f) => ({ ...f, investedAmount: e.target.value }))}
                  placeholder="e.g. 2500000"
                  className={inputCls}
                  style={inputStyle}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={labelStyle}>Ownership (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={form.ownership}
                  onChange={(e) => setForm((f) => ({ ...f, ownership: e.target.value }))}
                  placeholder="e.g. 12.5"
                  className={inputCls}
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={labelStyle}>Alert Level</label>
                <select
                  value={form.alertLevel}
                  onChange={(e) => setForm((f) => ({ ...f, alertLevel: e.target.value }))}
                  className={inputCls}
                  style={inputStyle}
                >
                  <option value="normal">normal</option>
                  <option value="watch">watch</option>
                  <option value="alert">alert</option>
                  <option value="critical">critical</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={labelStyle}>Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className={inputCls}
                style={inputStyle}
              >
                <option value="active">active</option>
                <option value="watchlist">watchlist</option>
                <option value="exited">exited</option>
                <option value="written-off">written-off</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={labelStyle}>Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Brief description of the company"
                rows={3}
                className={inputCls + " resize-none"}
                style={{ ...inputStyle, fontFamily: "inherit" }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={labelStyle}>Website</label>
              <input
                type="text"
                value={form.website}
                onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                placeholder="https://example.com"
                className={inputCls}
                style={inputStyle}
              />
            </div>

            {error && (
              <p className="text-xs" style={{ color: "#ef4444" }}>{error}</p>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: "var(--border)" }}>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded text-sm font-medium border"
            style={{ background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-secondary)" }}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="edit-company-form"
            disabled={submitting}
            className="px-4 py-2 rounded text-sm font-semibold transition-opacity disabled:opacity-40"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            {submitting ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── PortfolioPage ─────────────────────────────────────────────────────────────

export default function PortfolioPage() {
  const familyId = useFamilyId();
  const { openPanel, closePanel } = usePanel();
  const [companies, setCompanies] = useState<PortfolioCompany[]>([]);
  const [isMock, setIsMock] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [editingCompany, setEditingCompany] = useState<PortfolioCompany | null>(null);

  // Construction analytics state
  const [showConstruction, setShowConstruction] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  useEffect(() => {
    if (!familyId) return;

    setLoading(true);
    fetch(`/api/portfolio?familyId=${familyId}`)
      .then((r) => r.json())
      .then((data) => {
        setCompanies(data.companies ?? []);
        setIsMock(!!(data._mock));
      })
      .catch(() => {
        setCompanies([]);
      })
      .finally(() => setLoading(false));
  }, [familyId]);

  // Fetch analytics in parallel
  useEffect(() => {
    if (!familyId) return;

    setAnalyticsLoading(true);
    fetch(`/api/portfolio/analytics?familyId=${familyId}`)
      .then((r) => r.json())
      .then((data: AnalyticsData) => setAnalytics(data))
      .catch(() => setAnalytics(null))
      .finally(() => setAnalyticsLoading(false));
  }, [familyId]);

  const totalInvested = companies.reduce((s, c) => s + (c.investedAmount ?? 0), 0);
  const totalValue = companies.reduce((s, c) => s + (c.currentValue ?? 0), 0);
  const totalMOIC = totalInvested > 0 ? totalValue / totalInvested : 0;

  const needsAttention = companies.filter((c) => c.alertLevel !== "normal").length;

  // Analytics derived values
  const unrealizedGL = analytics
    ? analytics.totalPortfolioValue - analytics.totalDeployed
    : 0;
  const unrealizedPositive = unrealizedGL >= 0;

  function openCompanyPanel(co: PortfolioCompany) {
    if (selectedCompanyId === co.id) {
      setSelectedCompanyId(null);
      closePanel();
    } else {
      setSelectedCompanyId(co.id);
      openPanel(<CompanyDetailPanel company={co} />);
    }
  }

  return (
    <>
      {editingCompany && (
        <EditCompanyModal
          company={editingCompany}
          onClose={() => setEditingCompany(null)}
          onSuccess={(updated) => {
            setCompanies((prev) => prev.map((c) => c.id === updated.id ? updated : c));
          }}
        />
      )}
    <div className="flex flex-col h-full">
      <PageHeader
        title="Portfolio"
        subtitle={
          loading
            ? "Loading..."
            : `${companies.length} companies · ${needsAttention} require attention`
        }
        actions={
          <button
            className="flex items-center gap-1.5 px-3 py-2 rounded text-sm transition-colors"
            style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
          >
            <BarChart3 size={13} />
            Monitor All
          </button>
        }
      />

      {/* Mock badge */}
      {isMock && (
        <div
          className="mx-6 mt-3 text-xs px-3 py-2 rounded"
          style={{ background: "rgba(245,158,11,0.08)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.18)" }}
        >
          Demo data — connect a database for live portfolio data
        </div>
      )}

      {/* Summary stats */}
      <div
        className="grid grid-cols-4 gap-0 border-b"
        style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}
      >
        {[
          { label: "Total Invested", value: formatCurrency(totalInvested) },
          { label: "Current Value", value: formatCurrency(totalValue) },
          { label: "Blended MOIC", value: totalInvested > 0 ? `${totalMOIC.toFixed(2)}x` : "—" },
          { label: "Active Companies", value: companies.filter((c) => c.status === "active").length.toString() },
        ].map(({ label, value }, i) => (
          <div
            key={label}
            className="px-8 py-5"
            style={{ borderLeft: i > 0 ? "1px solid var(--border)" : "none" }}
          >
            <div className="text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>{label}</div>
            <div
              className="text-xl font-semibold"
              style={{ color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Portfolio Construction Analytics ── */}
      <div
        className="border-b"
        style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}
      >
        {/* Toggle header */}
        <button
          onClick={() => setShowConstruction((v) => !v)}
          className="w-full flex items-center justify-between px-6 py-3.5 text-left transition-colors"
          style={{ background: "transparent" }}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              Portfolio Construction
            </span>
            {analytics?._mock && (
              <span
                className="text-xs px-1.5 py-0.5 rounded"
                style={{ background: "rgba(245,158,11,0.08)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.18)" }}
              >
                demo
              </span>
            )}
            {analyticsLoading && (
              <Loader2 size={12} className="animate-spin" style={{ color: "var(--text-muted)" }} />
            )}
          </div>
          {showConstruction ? (
            <ChevronUp size={15} style={{ color: "var(--text-muted)" }} />
          ) : (
            <ChevronDown size={15} style={{ color: "var(--text-muted)" }} />
          )}
        </button>

        {/* Expanded content */}
        {showConstruction && analytics && (
          <div className="px-6 pb-6">
            {/* Summary pills */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              {[
                { label: "Total Deployed", value: formatCurrency(analytics.totalDeployed) },
                { label: "Portfolio Value", value: formatCurrency(analytics.totalPortfolioValue) },
                { label: "Companies", value: String(analytics.companiesCount) },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 px-3 py-2 rounded"
                  style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
                >
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</span>
                  <span className="text-sm font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>
                    {value}
                  </span>
                </div>
              ))}
              {/* Unrealized G/L pill */}
              <div
                className="flex items-center gap-2 px-3 py-2 rounded"
                style={{
                  background: unrealizedPositive ? "rgba(16,185,129,0.06)" : "rgba(239,68,68,0.06)",
                  border: unrealizedPositive ? "1px solid rgba(16,185,129,0.18)" : "1px solid rgba(239,68,68,0.18)",
                }}
              >
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>Unrealized G/L</span>
                <span className="flex items-center gap-1 text-sm font-semibold tabular-nums" style={{ color: unrealizedPositive ? "#10b981" : "#ef4444" }}>
                  {unrealizedPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                  {unrealizedPositive ? "+" : ""}{formatCurrency(unrealizedGL)}
                </span>
              </div>
            </div>

            {/* Concentration warnings */}
            {analytics.concentrationWarnings.length > 0 && (
              <div className="mb-5 flex flex-col gap-2">
                {analytics.concentrationWarnings.map((w) => (
                  <div
                    key={`${w.type}-${w.label}`}
                    className="flex items-start gap-2 px-3 py-2.5 rounded text-xs"
                    style={{
                      background: "rgba(245,158,11,0.08)",
                      border: "1px solid rgba(245,158,11,0.2)",
                      color: "#f59e0b",
                    }}
                  >
                    <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                    <span>{w.message}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-8">
              {/* Left column: Sector + Stage */}
              <div className="flex flex-col gap-6">
                {/* Allocation by Sector */}
                <div>
                  <div
                    className="text-xs font-medium mb-3 uppercase tracking-wide"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Allocation by Sector
                  </div>
                  <AllocationBars
                    items={analytics.allocationBySector.map((s) => ({
                      label: s.sector,
                      count: s.count,
                      totalValue: s.totalValue,
                      pct: s.pct,
                    }))}
                    labelKey="sector"
                    colors={SECTOR_COLORS}
                  />
                </div>

                {/* Allocation by Stage */}
                <div>
                  <div
                    className="text-xs font-medium mb-3 uppercase tracking-wide"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Allocation by Stage
                  </div>
                  <AllocationBars
                    items={analytics.allocationByStage.map((s) => ({
                      label: s.stage,
                      count: s.count,
                      totalValue: s.totalValue,
                      pct: s.pct,
                    }))}
                    labelKey="stage"
                    colors={STAGE_COLORS}
                  />
                </div>
              </div>

              {/* Right column: Vintage */}
              <div>
                <div
                  className="text-xs font-medium mb-3 uppercase tracking-wide"
                  style={{ color: "var(--text-muted)" }}
                >
                  Vintage Year
                </div>
                <VintageHeatmap items={analytics.vintageByYear} />
              </div>
            </div>
          </div>
        )}

        {/* Loading state when expanded but data not ready */}
        {showConstruction && !analytics && analyticsLoading && (
          <div className="px-6 pb-6 flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
            <Loader2 size={14} className="animate-spin" />
            Loading analytics…
          </div>
        )}

        {/* Empty state when done loading but no data */}
        {showConstruction && !analytics && !analyticsLoading && (
          <div className="px-6 pb-6 text-sm" style={{ color: "var(--text-muted)" }}>
            No analytics data available.
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Companies grid */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-40" style={{ color: "var(--text-muted)" }}>
              <Loader2 size={20} className="animate-spin mr-2" /> Loading portfolio...
            </div>
          ) : companies.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-sm" style={{ color: "var(--text-muted)" }}>
              No portfolio companies found.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {companies.map((co) => {
                const moic =
                  co.investedAmount && co.currentValue && co.investedAmount > 0
                    ? co.currentValue / co.investedAmount
                    : null;
                const lastAlert = co.alerts[0] ?? null;
                const isSelected = selectedCompanyId === co.id;

                return (
                  <div
                    key={co.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => openCompanyPanel(co)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openCompanyPanel(co);
                      }
                    }}
                    className="p-5 rounded-md border group cursor-pointer transition-colors"
                    style={{
                      background: "var(--bg-surface)",
                      borderColor: isSelected
                        ? "var(--accent)"
                        : co.alertLevel === "critical"
                        ? "rgba(239,68,68,0.3)"
                        : co.alertLevel === "alert"
                        ? "rgba(239,68,68,0.2)"
                        : co.alertLevel === "watch"
                        ? "rgba(245,158,11,0.2)"
                        : "var(--border)",
                      borderLeft: isSelected
                        ? "2px solid var(--accent)"
                        : undefined,
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{co.name}</div>
                        <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                          {[co.sector, co.stage].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCompany(co);
                          }}
                          className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ color: "var(--text-muted)" }}
                          title="Edit company"
                          aria-label="Edit company"
                        >
                          <Pencil size={13} />
                        </button>
                        <Badge label={co.status} variant={statusVariant[co.status] ?? "muted"} size="xs" />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-3">
                      {[
                        { label: "Invested", value: co.investedAmount ? formatCurrency(co.investedAmount) : "—" },
                        { label: "Value", value: co.currentValue ? formatCurrency(co.currentValue) : "—" },
                        {
                          label: "MOIC",
                          value: moic != null ? `${moic.toFixed(2)}x` : "—",
                          color: moic != null ? moicColor(moic) : "var(--text-muted)",
                        },
                      ].map(({ label, value, color }) => (
                        <div key={label}>
                          <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>{label}</div>
                          <div
                            className="text-sm font-medium"
                            style={{ color: color ?? "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}
                          >
                            {value}
                          </div>
                        </div>
                      ))}
                    </div>

                    {lastAlert && (
                      <div
                        className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded"
                        style={{
                          background:
                            lastAlert.severity === "critical"
                              ? "rgba(239,68,68,0.08)"
                              : "rgba(245,158,11,0.08)",
                          color: alertColor[lastAlert.severity] ?? alertColor.info,
                          border: `1px solid ${
                            lastAlert.severity === "critical"
                              ? "rgba(239,68,68,0.2)"
                              : "rgba(245,158,11,0.2)"
                          }`,
                        }}
                      >
                        <AlertTriangle size={11} />
                        {lastAlert.title}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
