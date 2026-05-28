"use client";

import { useEffect, useState, useCallback } from "react";
import { Trash2 } from "lucide-react";
import Badge from "@/components/ui/Badge";
import PageHeader from "@/components/ui/PageHeader";
import ContextPanel from "@/components/ui/ContextPanel";
import CashFlowChart from "@/components/ui/CashFlowChart";
import { formatCurrency } from "@/lib/utils";
import { useFamilyId } from "@/context/FamilyContext";
import { usePanel } from "@/context/PanelContext";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Entity {
  id: string;
  name: string;
  type: string;
  totalInflows: number;
  totalOutflows: number;
  net: number;
}

interface CashFlow {
  id: string;
  entityId: string;
  entityName: string;
  type: string;
  category?: string;
  amount: number;
  currency: string;
  description: string;
  occurredAt: string;
}

interface SummaryData {
  entities: Entity[];
  totalNet: number;
  recentCashFlows: CashFlow[];
  _mock?: boolean;
}

interface CfoResult {
  summary: string;
  liquidityStatus: "healthy" | "watch" | "critical";
  insights: string[];
  recommendations: string[];
  alerts?: string[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const typeVariant: Record<string, "success" | "danger" | "accent" | "warning" | "muted"> = {
  income: "success",
  distribution: "success",
  expense: "danger",
  "capital-call": "danger",
  "tax-payment": "muted",
};

const typeColor: Record<string, string> = {
  income: "#10b981",
  distribution: "#10b981",
  expense: "#ef4444",
  "capital-call": "#ef4444",
  "tax-payment": "#ef4444",
};

const liquidityVariant: Record<string, "success" | "warning" | "danger"> = {
  healthy: "success",
  watch: "warning",
  critical: "danger",
};

const ENTITY_TYPES = ["LLC", "LP", "Trust", "Corp", "Foundation", "Individual"] as const;
const TRANSACTION_TYPES = ["income", "expense", "distribution", "capital-call", "tax-payment"] as const;

// ── Modal: Add Entity ─────────────────────────────────────────────────────────

interface AddEntityForm {
  name: string;
  type: string;
  jurisdiction: string;
  description: string;
}

function AddEntityModal({
  onClose,
  onSuccess,
  familyId,
}: {
  onClose: () => void;
  onSuccess: () => void;
  familyId: string;
}) {
  const [form, setForm] = useState<AddEntityForm>({
    name: "",
    type: "LLC",
    jurisdiction: "",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isValid = form.name.trim().length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/entities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyId,
          name: form.name.trim(),
          type: form.type,
          jurisdiction: form.jurisdiction.trim() || undefined,
          description: form.description.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to create entity");
        return;
      }
      onSuccess();
      onClose();
    } catch {
      setError("Network error — please try again");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl shadow-2xl p-6"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold mb-5" style={{ color: "var(--text-primary)" }}>
          Add Entity
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Name <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Hartwell Family Trust"
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
              style={{ background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Type <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
              style={{ background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
            >
              {ENTITY_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Jurisdiction <span style={{ color: "var(--text-muted)" }}>(optional)</span>
            </label>
            <input
              type="text"
              value={form.jurisdiction}
              onChange={(e) => setForm((f) => ({ ...f, jurisdiction: e.target.value }))}
              placeholder="e.g. Delaware, Cayman Islands"
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
              style={{ background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Description <span style={{ color: "var(--text-muted)" }}>(optional)</span>
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Brief description"
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
              style={{ background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
            />
          </div>
          {error && (
            <p className="text-xs" style={{ color: "#ef4444" }}>{error}</p>
          )}
          <div className="flex justify-end gap-3 mt-1">
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
              disabled={!isValid || submitting}
              className="px-4 py-2 rounded text-sm font-semibold transition-opacity disabled:opacity-40"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              {submitting ? "Creating…" : "Create Entity"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Modal: Log Transaction ────────────────────────────────────────────────────

interface LogTransactionForm {
  entityId: string;
  type: string;
  category: string;
  amount: string;
  description: string;
  occurredAt: string;
}

function LogTransactionModal({
  entities,
  defaultEntityId,
  onClose,
  onSuccess,
  familyId,
}: {
  entities: Entity[];
  defaultEntityId: string | null;
  onClose: () => void;
  onSuccess: () => void;
  familyId: string;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState<LogTransactionForm>({
    entityId: defaultEntityId ?? entities[0]?.id ?? "",
    type: "income",
    category: "",
    amount: "",
    description: "",
    occurredAt: today,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isValid =
    form.entityId.length > 0 &&
    form.description.trim().length > 0 &&
    parseFloat(form.amount) > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/finance/cashflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyId,
          entityId: form.entityId,
          type: form.type,
          category: form.category.trim() || undefined,
          amount: parseFloat(form.amount),
          currency: "USD",
          description: form.description.trim(),
          occurredAt: form.occurredAt,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to log transaction");
        return;
      }
      onSuccess();
      onClose();
    } catch {
      setError("Network error — please try again");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl shadow-2xl p-6"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold mb-5" style={{ color: "var(--text-primary)" }}>
          Log Transaction
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Entity <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <select
              value={form.entityId}
              onChange={(e) => setForm((f) => ({ ...f, entityId: e.target.value }))}
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
              style={{ background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
            >
              {entities.map((en) => (
                <option key={en.id} value={en.id}>{en.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Type <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
                style={{ background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
              >
                {TRANSACTION_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Category <span style={{ color: "var(--text-muted)" }}>(optional)</span>
              </label>
              <input
                type="text"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                placeholder="e.g. Operating"
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
                style={{ background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Amount <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="0.00"
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
                style={{ background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Date <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="date"
                value={form.occurredAt}
                onChange={(e) => setForm((f) => ({ ...f, occurredAt: e.target.value }))}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
                style={{ background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Description <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Brief description of the transaction"
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
              style={{ background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
            />
          </div>
          {error && (
            <p className="text-xs" style={{ color: "#ef4444" }}>{error}</p>
          )}
          <div className="flex justify-end gap-3 mt-1">
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
              disabled={!isValid || submitting}
              className="px-4 py-2 rounded text-sm font-semibold transition-opacity disabled:opacity-40"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              {submitting ? "Logging…" : "Log Transaction"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Entity Detail Panel ───────────────────────────────────────────────────────

function EntityDetailPanel({ entity, onLogTransaction }: { entity: Entity; onLogTransaction: () => void }) {
  return (
    <ContextPanel title={entity.name} subtitle={entity.type.toUpperCase()}>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          <div
            className="rounded-md p-3 flex items-center justify-between"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
          >
            <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Net</span>
            <span
              className="text-sm font-semibold font-mono"
              style={{
                color: entity.net >= 0 ? "#10b981" : "#ef4444",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {entity.net >= 0 ? "+" : ""}{formatCurrency(entity.net)}
            </span>
          </div>
          <div
            className="rounded-md p-3 flex items-center justify-between"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
          >
            <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Total Inflows</span>
            <span
              className="text-sm font-semibold font-mono"
              style={{ color: "#10b981", fontVariantNumeric: "tabular-nums" }}
            >
              +{formatCurrency(entity.totalInflows)}
            </span>
          </div>
          <div
            className="rounded-md p-3 flex items-center justify-between"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
          >
            <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Total Outflows</span>
            <span
              className="text-sm font-semibold font-mono"
              style={{ color: "#ef4444", fontVariantNumeric: "tabular-nums" }}
            >
              -{formatCurrency(entity.totalOutflows)}
            </span>
          </div>
        </div>
        <button
          onClick={onLogTransaction}
          className="w-full py-2 rounded text-sm font-semibold"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          Log Transaction
        </button>
      </div>
    </ContextPanel>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function FinancePage() {
  const familyId = useFamilyId();
  const { openPanel, closePanel } = usePanel();

  // Data state
  const [entities, setEntities] = useState<Entity[]>([]);
  const [cashFlows, setCashFlows] = useState<CashFlow[]>([]);
  const [totalNet, setTotalNet] = useState(0);
  const [isMock, setIsMock] = useState(false);
  const [loading, setLoading] = useState(true);

  // UI state
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [showAddEntity, setShowAddEntity] = useState(false);
  const [showLogTransaction, setShowLogTransaction] = useState(false);

  // CFO agent state
  const [cfoQuery, setCfoQuery] = useState("");
  const [cfoResult, setCfoResult] = useState<CfoResult | null>(null);
  const [cfoLoading, setCfoLoading] = useState(false);

  const fetchSummary = useCallback(async () => {
    if (!familyId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/finance/summary?familyId=${encodeURIComponent(familyId)}`);
      const data: SummaryData = await res.json();
      setEntities(data.entities ?? []);
      setCashFlows(data.recentCashFlows ?? []);
      setTotalNet(data.totalNet ?? 0);
      setIsMock(!!data._mock);
    } catch {
      // Leave empty — page will show gracefully
    } finally {
      setLoading(false);
    }
  }, [familyId]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  async function handleDeleteCashFlow(id: string) {
    try {
      await fetch(`/api/finance/cashflows/${id}`, { method: "DELETE" });
      await fetchSummary();
    } catch {
      // silently fail
    }
  }

  async function handleAnalyze() {
    if (!cfoQuery.trim()) return;
    setCfoLoading(true);
    setCfoResult(null);
    try {
      const res = await fetch("/api/agents/cfo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ familyId: familyId ?? "demo", query: cfoQuery }),
      });
      const data = await res.json();
      setCfoResult(data.result as CfoResult);
    } catch {
      // silently fail
    } finally {
      setCfoLoading(false);
    }
  }

  const filteredCashFlows = selectedEntityId
    ? cashFlows.filter((cf) => cf.entityId === selectedEntityId)
    : cashFlows;

  const isEmpty = entities.length === 0 && cashFlows.length === 0;

  return (
    <>
      {/* Modals */}
      {showAddEntity && familyId && (
        <AddEntityModal
          familyId={familyId}
          onClose={() => setShowAddEntity(false)}
          onSuccess={fetchSummary}
        />
      )}
      {showLogTransaction && familyId && (
        <LogTransactionModal
          entities={entities}
          defaultEntityId={selectedEntityId}
          familyId={familyId}
          onClose={() => setShowLogTransaction(false)}
          onSuccess={fetchSummary}
        />
      )}

      <div className={`flex flex-col h-full${loading ? " opacity-50 animate-pulse" : ""}`}>
        {/* Page Header */}
        <PageHeader
          title="Finance"
          subtitle={`${entities.length} ${entities.length === 1 ? "entity" : "entities"} · ${formatCurrency(totalNet)} net`}
          actions={
            <div className="flex items-center gap-3">
              {isMock && <Badge label="Mock Data" variant="warning" size="xs" />}
              <button
                onClick={() => setShowAddEntity(true)}
                className="px-4 py-2 rounded text-sm font-semibold"
                style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
              >
                Add Entity
              </button>
              <button
                onClick={() => setShowLogTransaction(true)}
                className="px-4 py-2 rounded text-sm font-semibold"
                style={{ background: "var(--accent)", color: "#fff" }}
              >
                Log Transaction
              </button>
            </div>
          }
        />

        {/* Empty state */}
        {!loading && isEmpty && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              No financial data yet. Add an entity to get started.
            </p>
            <button
              onClick={() => setShowAddEntity(true)}
              className="px-5 py-2 rounded text-sm font-semibold"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              Add Entity
            </button>
          </div>
        )}

        {!isEmpty && (
          <>
            {/* Entity cards row */}
            <div
              className="px-8 py-5 border-b overflow-x-auto"
              style={{ borderColor: "var(--border)" }}
            >
              <h2
                className="text-xs font-medium tracking-wider uppercase mb-4"
                style={{ color: "var(--text-muted)" }}
              >
                Entities
              </h2>
              <div className="flex gap-3 pb-1">
                {entities.map((entity) => {
                  const isSelected = selectedEntityId === entity.id;
                  return (
                    <button
                      key={entity.id}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedEntityId(null);
                          closePanel();
                        } else {
                          setSelectedEntityId(entity.id);
                          openPanel(
                            <EntityDetailPanel
                              entity={entity}
                              onLogTransaction={() => setShowLogTransaction(true)}
                            />
                          );
                        }
                      }}
                      className="shrink-0 w-52 rounded-lg border p-4 text-left transition-all"
                      style={{
                        background: isSelected
                          ? "var(--bg-elevated)"
                          : "var(--bg-surface)",
                        borderColor: isSelected
                          ? "var(--accent)"
                          : "var(--border)",
                        cursor: "pointer",
                      }}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span
                          className="text-sm font-semibold leading-tight"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {entity.name}
                        </span>
                        <Badge
                          label={entity.type.toUpperCase()}
                          variant="muted"
                          size="xs"
                        />
                      </div>
                      <div
                        className="text-lg font-semibold font-mono mb-2"
                        style={{
                          color: entity.net >= 0 ? "#10b981" : "#ef4444",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {entity.net >= 0 ? "+" : ""}
                        {formatCurrency(entity.net)}
                      </div>
                      <div className="flex gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
                        <span>
                          In{" "}
                          <span style={{ color: "#10b981", fontVariantNumeric: "tabular-nums" }}>
                            {formatCurrency(entity.totalInflows)}
                          </span>
                        </span>
                        <span>
                          Out{" "}
                          <span style={{ color: "#ef4444", fontVariantNumeric: "tabular-nums" }}>
                            {formatCurrency(entity.totalOutflows)}
                          </span>
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cash Flow Chart */}
            {cashFlows.length > 0 && (
              <div className="mx-8 mb-6">
                <div className="rounded-lg border overflow-hidden" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
                  <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: "var(--border)" }}>
                    <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Cash Flow — Last 6 Months</span>
                  </div>
                  <div className="px-2 py-2">
                    <CashFlowChart cashFlows={cashFlows} />
                  </div>
                </div>
              </div>
            )}

            {/* Transaction list */}
            <div className="flex-1 overflow-auto px-8 py-5">
              <div className="flex items-center justify-between mb-4">
                <h2
                  className="text-xs font-medium tracking-wider uppercase"
                  style={{ color: "var(--text-muted)" }}
                >
                  {selectedEntityId
                    ? `Transactions · ${entities.find((e) => e.id === selectedEntityId)?.name ?? ""}`
                    : "All Transactions"}
                </h2>
                <button
                  onClick={() => setShowLogTransaction(true)}
                  className="px-3 py-1.5 rounded text-xs font-semibold"
                  style={{ background: "var(--accent)", color: "#fff" }}
                >
                  Log Transaction
                </button>
              </div>

              <div
                className="rounded-md border overflow-hidden"
                style={{ borderColor: "var(--border)" }}
              >
                <table className="w-full text-xs">
                  <thead>
                    <tr
                      style={{
                        background: "var(--bg-surface)",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      {["Date", "Entity", "Type", "Category", "Description", "Amount", ""].map(
                        (h) => (
                          <th
                            key={h}
                            className="text-left px-4 py-2.5 font-medium"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCashFlows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-12 text-center text-xs"
                          style={{ color: "var(--text-muted)" }}
                        >
                          No transactions yet.
                        </td>
                      </tr>
                    ) : (
                      filteredCashFlows.map((cf) => (
                        <tr
                          key={cf.id}
                          style={{
                            borderBottom: "1px solid var(--border-subtle)",
                            background: "var(--bg-surface)",
                          }}
                        >
                          <td
                            className="px-4 py-3 font-mono"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {cf.occurredAt
                              ? new Date(cf.occurredAt).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })
                              : "—"}
                          </td>
                          <td
                            className="px-4 py-3 max-w-32 truncate"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {cf.entityName}
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              label={cf.type}
                              variant={typeVariant[cf.type] ?? "muted"}
                              size="xs"
                            />
                          </td>
                          <td
                            className="px-4 py-3"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {cf.category ?? "—"}
                          </td>
                          <td
                            className="px-4 py-3 max-w-48 truncate"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {cf.description}
                          </td>
                          <td
                            className="px-4 py-3 font-mono text-right font-medium"
                            style={{
                              color: typeColor[cf.type] ?? "var(--text-secondary)",
                              fontVariantNumeric: "tabular-nums",
                            }}
                          >
                            {["income", "distribution"].includes(cf.type) ? "+" : "-"}
                            {formatCurrency(Math.abs(cf.amount))}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleDeleteCashFlow(cf.id)}
                              className="p-1 rounded hover:bg-white/5 transition-colors"
                              style={{ color: "var(--text-muted)" }}
                              title="Delete transaction"
                            >
                              <Trash2 size={12} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* CFO Agent Panel */}
        <div className="px-8 py-6 border-t" style={{ borderColor: "var(--border)" }}>
          <h2
            className="text-xs font-medium tracking-wider uppercase mb-4"
            style={{ color: "var(--text-muted)" }}
          >
            CFO Agent
          </h2>
          <div className="flex gap-6">
            {/* Left: prompt input */}
            <div className="flex-1 flex flex-col gap-3">
              <input
                type="text"
                className="w-full rounded-md border px-4 py-2.5 text-sm focus:outline-none focus:ring-1"
                placeholder="Ask the CFO agent… e.g. 'What's our Q2 cash position?' or 'Summarize AP exposure by entity'"
                value={cfoQuery}
                onChange={(e) => setCfoQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAnalyze();
                }}
                style={{
                  background: "var(--bg-surface)",
                  borderColor: "var(--border)",
                  color: "var(--text-primary)",
                }}
              />
              <button
                onClick={handleAnalyze}
                disabled={cfoLoading || !cfoQuery.trim()}
                className="self-start px-5 py-2 rounded text-sm font-semibold transition-opacity disabled:opacity-40"
                style={{ background: "var(--accent)", color: "#fff" }}
              >
                {cfoLoading ? "Analyzing…" : "Analyze"}
              </button>
            </div>

            {/* Right: agent response */}
            {cfoResult && (
              <div
                className="flex-1 rounded-md border p-5 flex flex-col gap-4"
                style={{
                  background: "var(--bg-elevated)",
                  borderColor: "var(--border)",
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {cfoResult.summary}
                  </p>
                  {cfoResult.liquidityStatus && (
                    <Badge
                      label={
                        cfoResult.liquidityStatus.charAt(0).toUpperCase() +
                        cfoResult.liquidityStatus.slice(1)
                      }
                      variant={liquidityVariant[cfoResult.liquidityStatus] ?? "muted"}
                      size="xs"
                    />
                  )}
                </div>

                {cfoResult.insights?.length > 0 && (
                  <div>
                    <div
                      className="text-xs font-medium tracking-wider uppercase mb-2"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Insights
                    </div>
                    <ul className="flex flex-col gap-1">
                      {cfoResult.insights.map((insight, i) => (
                        <li
                          key={i}
                          className="text-xs flex gap-2"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          <span style={{ color: "var(--text-muted)" }}>·</span>
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {cfoResult.recommendations?.length > 0 && (
                  <div>
                    <div
                      className="text-xs font-medium tracking-wider uppercase mb-2"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Recommendations
                    </div>
                    <ul className="flex flex-col gap-1">
                      {cfoResult.recommendations.map((rec, i) => (
                        <li
                          key={i}
                          className="text-xs flex gap-2"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          <span style={{ color: "var(--accent)" }}>→</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
