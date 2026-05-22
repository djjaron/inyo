"use client";

import { useEffect, useState, useCallback } from "react";
import { Trash2, ExternalLink, ChevronDown, ChevronUp, RefreshCw, Loader2 } from "lucide-react";
import Badge from "@/components/ui/Badge";
import PageHeader from "@/components/ui/PageHeader";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useFamilyId } from "@/context/FamilyContext";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SPVInvestor {
  id: string;
  name: string;
  email: string;
  commitment: number;
  status: "invited" | "committed" | "funded" | "withdrawn";
  committedAt?: string;
  fundedAt?: string;
}

interface SPV {
  id: string;
  familyId: string;
  dealId?: string;
  name: string;
  status: "draft" | "launching" | "active" | "closed" | "cancelled";
  spvType: "syndicate" | "secondary" | "layered";
  sydecarId?: string;
  sydecarUrl?: string;
  targetRaise?: number;
  totalCommitted?: number;
  managementFee?: number;
  carry?: number;
  closingDate?: string;
  investmentType?: string;
  description?: string;
  launchedAt?: string;
  createdAt: string;
  investors?: SPVInvestor[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const statusVariant: Record<string, "muted" | "warning" | "success" | "danger"> = {
  draft: "muted",
  launching: "warning",
  active: "success",
  closed: "muted",
  cancelled: "danger",
};

const investorStatusVariant: Record<string, "muted" | "warning" | "success" | "danger" | "accent"> = {
  invited: "warning",
  committed: "accent",
  funded: "success",
  withdrawn: "danger",
};

const INPUT_STYLE = {
  background: "var(--bg-surface)",
  borderColor: "var(--border)",
  color: "var(--text-primary)",
} as const;

// ── Create SPV Modal ──────────────────────────────────────────────────────────

interface CreateForm {
  name: string;
  spvType: string;
  investmentType: string;
  targetRaise: string;
  managementFee: string;
  carry: string;
  description: string;
}

interface PendingInvestor {
  name: string;
  email: string;
  commitment: string;
}

function CreateSPVModal({
  familyId,
  onClose,
  onSuccess,
}: {
  familyId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [createStep, setCreateStep] = useState<1 | 2>(1);
  const [createForm, setCreateForm] = useState<CreateForm>({
    name: "",
    spvType: "syndicate",
    investmentType: "equity",
    targetRaise: "",
    managementFee: "2",
    carry: "20",
    description: "",
  });
  const [pendingInvestors, setPendingInvestors] = useState<PendingInvestor[]>([]);
  const [invForm, setInvForm] = useState<PendingInvestor>({ name: "", email: "", commitment: "" });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const isStep1Valid = createForm.name.trim().length > 0;
  const isInvFormValid = invForm.name.trim().length > 0 && invForm.email.trim().length > 0;

  function addPendingInvestor() {
    if (!isInvFormValid) return;
    setPendingInvestors((prev) => [...prev, { ...invForm }]);
    setInvForm({ name: "", email: "", commitment: "" });
  }

  function removePendingInvestor(idx: number) {
    setPendingInvestors((prev) => prev.filter((_, i) => i !== idx));
  }

  async function createSpv() {
    if (!isStep1Valid || creating) return;
    setCreating(true);
    setError("");
    try {
      const targetRaiseNum = parseFloat(createForm.targetRaise);
      const managementFeeNum = parseFloat(createForm.managementFee);
      const carryNum = parseFloat(createForm.carry);

      const res = await fetch("/api/spv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyId,
          name: createForm.name.trim(),
          spvType: createForm.spvType,
          investmentType: createForm.investmentType,
          targetRaise: Number.isFinite(targetRaiseNum) ? targetRaiseNum : undefined,
          managementFee: Number.isFinite(managementFeeNum) ? managementFeeNum : undefined,
          carry: Number.isFinite(carryNum) ? carryNum : undefined,
          description: createForm.description.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to create SPV");
        return;
      }

      const data = await res.json();
      const newId: string = data.spv?.id;

      if (newId && pendingInvestors.length > 0) {
        await Promise.all(
          pendingInvestors.map((inv) => {
            const commitmentNum = parseFloat(inv.commitment);
            return fetch(`/api/spv/${newId}/investors`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: inv.name.trim(),
                email: inv.email.trim(),
                commitment: Number.isFinite(commitmentNum) ? commitmentNum : 0,
              }),
            });
          })
        );
      }

      onSuccess();
      onClose();
    } catch {
      setError("Network error — please try again");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl shadow-2xl p-6"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Wizard step indicator */}
        <div className="flex items-center gap-2 mb-5">
          <span
            className="text-xs font-medium px-2 py-0.5 rounded"
            style={{
              background: createStep === 1 ? "var(--accent)" : "var(--bg-surface)",
              color: createStep === 1 ? "#fff" : "var(--text-muted)",
            }}
          >
            1 Details
          </span>
          <span style={{ color: "var(--text-muted)", fontSize: "10px" }}>›</span>
          <span
            className="text-xs font-medium px-2 py-0.5 rounded"
            style={{
              background: createStep === 2 ? "var(--accent)" : "var(--bg-surface)",
              color: createStep === 2 ? "#fff" : "var(--text-muted)",
            }}
          >
            2 Investors
          </span>
        </div>

        <h2 className="text-base font-semibold mb-5" style={{ color: "var(--text-primary)" }}>
          {createStep === 1 ? "Create SPV" : "Add Investors (optional)"}
        </h2>

        {/* Step 1 — Details */}
        {createStep === 1 && (
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Name <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="text"
                required
                autoFocus
                value={createForm.name}
                onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Meridian AI Series B SPV"
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
                style={INPUT_STYLE}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  SPV Type <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <select
                  value={createForm.spvType}
                  onChange={(e) => setCreateForm((f) => ({ ...f, spvType: e.target.value }))}
                  className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
                  style={INPUT_STYLE}
                >
                  <option value="syndicate">Syndicate</option>
                  <option value="secondary">Secondary</option>
                  <option value="layered">Layered</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Investment Type
                </label>
                <select
                  value={createForm.investmentType}
                  onChange={(e) => setCreateForm((f) => ({ ...f, investmentType: e.target.value }))}
                  className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
                  style={INPUT_STYLE}
                >
                  <option value="equity">Equity</option>
                  <option value="convertible-note">Convertible Note</option>
                  <option value="safe">SAFE</option>
                  <option value="debt">Debt</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Target Raise ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={createForm.targetRaise}
                  onChange={(e) => setCreateForm((f) => ({ ...f, targetRaise: e.target.value }))}
                  placeholder="5000000"
                  className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
                  style={INPUT_STYLE}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Mgmt Fee %
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="any"
                  value={createForm.managementFee}
                  onChange={(e) => setCreateForm((f) => ({ ...f, managementFee: e.target.value }))}
                  placeholder="2"
                  className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
                  style={INPUT_STYLE}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Carry %
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="any"
                  value={createForm.carry}
                  onChange={(e) => setCreateForm((f) => ({ ...f, carry: e.target.value }))}
                  placeholder="20"
                  className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
                  style={INPUT_STYLE}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Description <span style={{ color: "var(--text-muted)" }}>(optional)</span>
              </label>
              <textarea
                rows={3}
                value={createForm.description}
                onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Brief description of this SPV…"
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none resize-none"
                style={INPUT_STYLE}
              />
            </div>

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
                type="button"
                disabled={!isStep1Valid}
                onClick={() => setCreateStep(2)}
                className="px-4 py-2 rounded text-sm font-semibold transition-opacity disabled:opacity-40"
                style={{ background: "var(--accent)", color: "#fff" }}
              >
                Next: Add Investors →
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — Investors */}
        {createStep === 2 && (
          <div className="flex flex-col gap-4">
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Add investors now or skip — you can add them later.
            </p>

            {/* Inline investor form */}
            <div className="flex gap-2">
              <input
                type="text"
                value={invForm.name}
                onChange={(e) => setInvForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Investor name"
                className="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none"
                style={INPUT_STYLE}
              />
              <input
                type="email"
                value={invForm.email}
                onChange={(e) => setInvForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="Email"
                className="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none"
                style={INPUT_STYLE}
              />
              <input
                type="number"
                min="0"
                step="any"
                value={invForm.commitment}
                onChange={(e) => setInvForm((f) => ({ ...f, commitment: e.target.value }))}
                placeholder="Commit $"
                className="w-28 rounded-md border px-3 py-2 text-sm focus:outline-none"
                style={INPUT_STYLE}
              />
              <button
                type="button"
                disabled={!isInvFormValid}
                onClick={addPendingInvestor}
                className="px-3 py-2 rounded text-sm font-medium border transition-opacity disabled:opacity-40"
                style={{ background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-secondary)" }}
              >
                Add
              </button>
            </div>

            {/* Pending investors table */}
            {pendingInvestors.length > 0 && (
              <div
                className="rounded-md border overflow-hidden"
                style={{ borderColor: "var(--border)" }}
              >
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border)" }}>
                      {["Name", "Email", "Commitment", ""].map((h) => (
                        <th
                          key={h}
                          className="text-left px-3 py-2 font-medium"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pendingInvestors.map((inv, idx) => (
                      <tr
                        key={idx}
                        style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-surface)" }}
                      >
                        <td className="px-3 py-2" style={{ color: "var(--text-primary)" }}>{inv.name}</td>
                        <td className="px-3 py-2" style={{ color: "var(--text-secondary)" }}>{inv.email}</td>
                        <td className="px-3 py-2 font-mono" style={{ color: "var(--text-secondary)" }}>
                          {inv.commitment ? formatCurrency(parseFloat(inv.commitment)) : "—"}
                        </td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => removePendingInvestor(idx)}
                            className="p-1 rounded hover:bg-white/5"
                            style={{ color: "var(--text-muted)" }}
                          >
                            <Trash2 size={11} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {error && (
              <p className="text-xs" style={{ color: "#ef4444" }}>{error}</p>
            )}

            <div className="flex justify-between gap-3 mt-1">
              <button
                type="button"
                onClick={() => setCreateStep(1)}
                className="px-4 py-2 rounded text-sm font-medium border"
                style={{ background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-secondary)" }}
              >
                ← Back
              </button>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded text-sm font-medium border"
                  style={{ background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-secondary)" }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={creating}
                  onClick={createSpv}
                  className="px-4 py-2 rounded text-sm font-semibold transition-opacity disabled:opacity-40 flex items-center gap-2"
                  style={{ background: "var(--accent)", color: "#fff" }}
                >
                  {creating && <Loader2 size={13} className="animate-spin" />}
                  {creating ? "Creating…" : "Create SPV"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── SPV Card ──────────────────────────────────────────────────────────────────

function SPVCard({
  spv,
  expanded,
  launching,
  onToggleExpand,
  onLaunch,
  onSync,
  onDelete,
  onAddInvestor,
  onRemoveInvestor,
}: {
  spv: SPV;
  expanded: boolean;
  launching: boolean;
  onToggleExpand: () => void;
  onLaunch: () => void;
  onSync: () => void;
  onDelete: () => void;
  onAddInvestor: (inv: { name: string; email: string; commitment: number }) => void;
  onRemoveInvestor: (investorId: string) => void;
}) {
  const [addInvForm, setAddInvForm] = useState({ name: "", email: "", commitment: "" });
  const isAddInvValid = addInvForm.name.trim().length > 0 && addInvForm.email.trim().length > 0;

  const target = spv.targetRaise ?? 0;
  const committed = spv.totalCommitted ?? 0;
  const pct = target > 0 ? Math.min(100, (committed / target) * 100) : 0;
  const investorCount = spv.investors?.length ?? 0;

  function handleAddInvestor() {
    if (!isAddInvValid) return;
    const commitmentNum = parseFloat(addInvForm.commitment);
    onAddInvestor({
      name: addInvForm.name.trim(),
      email: addInvForm.email.trim(),
      commitment: Number.isFinite(commitmentNum) ? commitmentNum : 0,
    });
    setAddInvForm({ name: "", email: "", commitment: "" });
  }

  return (
    <div
      className="rounded-lg border flex flex-col"
      style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
    >
      {/* Card header */}
      <div className="p-5 flex flex-col gap-3">
        {/* Top row: status badge + type */}
        <div className="flex items-center justify-between gap-2">
          <Badge
            label={spv.status.charAt(0).toUpperCase() + spv.status.slice(1)}
            variant={statusVariant[spv.status] ?? "muted"}
            size="xs"
          />
          <span className="text-xs capitalize" style={{ color: "var(--text-muted)" }}>
            {spv.spvType}
          </span>
        </div>

        {/* Name */}
        <div>
          <h3 className="text-sm font-semibold leading-tight" style={{ color: "var(--text-primary)" }}>
            {spv.name}
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {spv.investmentType
              ? spv.investmentType.charAt(0).toUpperCase() + spv.investmentType.slice(1)
              : "—"}
            {spv.closingDate ? ` · closes ${formatDate(spv.closingDate)}` : ""}
          </p>
        </div>

        {/* Progress */}
        {target > 0 && (
          <div className="flex flex-col gap-1.5">
            <div
              style={{
                height: "4px",
                borderRadius: "2px",
                background: "var(--bg-elevated)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${pct}%`,
                  background: pct >= 100 ? "#10b981" : "var(--accent)",
                  borderRadius: "2px",
                  transition: "width 0.4s ease",
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                {formatCurrency(committed)} committed of {formatCurrency(target)} target
              </span>
              <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                {pct.toFixed(0)}%
              </span>
            </div>
          </div>
        )}

        {/* Fee row */}
        <div className="flex items-center gap-4 text-xs" style={{ color: "var(--text-muted)" }}>
          {spv.managementFee != null && (
            <span>
              Mgmt Fee{" "}
              <span style={{ color: "var(--text-secondary)" }}>{spv.managementFee}%</span>
            </span>
          )}
          {spv.carry != null && (
            <span>
              Carry{" "}
              <span style={{ color: "var(--text-secondary)" }}>{spv.carry}%</span>
            </span>
          )}
          <span>
            <span style={{ color: "var(--text-secondary)" }}>{investorCount}</span>{" "}
            {investorCount === 1 ? "investor" : "investors"}
          </span>
        </div>

        {/* Sydecar link */}
        {spv.sydecarUrl && (
          <a
            href={spv.sydecarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs"
            style={{ color: "var(--accent)" }}
          >
            View on Sydecar <ExternalLink size={11} />
          </a>
        )}

        {/* Actions row */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            onClick={onToggleExpand}
            className="inline-flex items-center gap-1 text-xs font-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            {expanded ? (
              <>View Less <ChevronUp size={13} /></>
            ) : (
              <>View Details <ChevronDown size={13} /></>
            )}
          </button>

          <div className="flex items-center gap-2">
            {spv.status === "launching" && (
              <Badge label="Launching…" variant="warning" size="xs" />
            )}
            {spv.status === "draft" && (
              <button
                onClick={onLaunch}
                disabled={launching}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold border transition-opacity disabled:opacity-50"
                style={{
                  background: "var(--bg-elevated)",
                  borderColor: "var(--border)",
                  color: "var(--text-primary)",
                }}
              >
                {launching ? (
                  <><Loader2 size={11} className="animate-spin" /> Launching…</>
                ) : (
                  <>Launch to Sydecar <ExternalLink size={11} /></>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expanded detail panel */}
      {expanded && (
        <div
          className="border-t px-5 py-4 flex flex-col gap-4"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          {/* Larger progress bar */}
          {target > 0 && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs mb-1" style={{ color: "var(--text-muted)" }}>
                <span>Fundraise Progress</span>
                <span>{pct.toFixed(1)}%</span>
              </div>
              <div
                style={{
                  height: "8px",
                  borderRadius: "4px",
                  background: "var(--bg-elevated)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${pct}%`,
                    background: pct >= 100 ? "#10b981" : "var(--accent)",
                    borderRadius: "4px",
                    transition: "width 0.4s ease",
                  }}
                />
              </div>
              <div className="flex justify-between text-xs" style={{ color: "var(--text-muted)" }}>
                <span>{formatCurrency(committed)} committed</span>
                <span>{formatCurrency(target)} target</span>
              </div>
            </div>
          )}

          {/* Investor table */}
          <div>
            <div
              className="text-xs font-medium tracking-wider uppercase mb-2"
              style={{ color: "var(--text-muted)" }}
            >
              Investors
            </div>
            {spv.investors && spv.investors.length > 0 ? (
              <div
                className="rounded-md border overflow-hidden"
                style={{ borderColor: "var(--border)" }}
              >
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ background: "var(--bg-elevated)", borderBottom: "1px solid var(--border)" }}>
                      {["Name", "Email", "Commitment", "Status", "Committed", ""].map((h) => (
                        <th
                          key={h}
                          className="text-left px-3 py-2 font-medium"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {spv.investors.map((inv) => (
                      <tr
                        key={inv.id}
                        style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-surface)" }}
                      >
                        <td className="px-3 py-2.5 font-medium" style={{ color: "var(--text-primary)" }}>
                          {inv.name}
                        </td>
                        <td className="px-3 py-2.5" style={{ color: "var(--text-secondary)" }}>
                          {inv.email}
                        </td>
                        <td className="px-3 py-2.5 font-mono" style={{ color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums" }}>
                          {formatCurrency(inv.commitment)}
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge
                            label={inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                            variant={investorStatusVariant[inv.status] ?? "muted"}
                            size="xs"
                          />
                        </td>
                        <td className="px-3 py-2.5" style={{ color: "var(--text-muted)" }}>
                          {inv.committedAt ? formatDate(inv.committedAt) : "—"}
                        </td>
                        <td className="px-3 py-2.5">
                          <button
                            onClick={() => onRemoveInvestor(inv.id)}
                            className="p-1 rounded hover:bg-white/5"
                            style={{ color: "var(--text-muted)" }}
                            title="Remove investor"
                          >
                            <Trash2 size={11} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>No investors yet.</p>
            )}
          </div>

          {/* Add investor inline form */}
          <div>
            <div
              className="text-xs font-medium tracking-wider uppercase mb-2"
              style={{ color: "var(--text-muted)" }}
            >
              Add Investor
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={addInvForm.name}
                onChange={(e) => setAddInvForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Name"
                className="flex-1 rounded-md border px-3 py-2 text-xs focus:outline-none"
                style={INPUT_STYLE}
              />
              <input
                type="email"
                value={addInvForm.email}
                onChange={(e) => setAddInvForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="Email"
                className="flex-1 rounded-md border px-3 py-2 text-xs focus:outline-none"
                style={INPUT_STYLE}
              />
              <input
                type="number"
                min="0"
                step="any"
                value={addInvForm.commitment}
                onChange={(e) => setAddInvForm((f) => ({ ...f, commitment: e.target.value }))}
                placeholder="Commit $"
                className="w-28 rounded-md border px-3 py-2 text-xs focus:outline-none"
                style={INPUT_STYLE}
              />
              <button
                onClick={handleAddInvestor}
                disabled={!isAddInvValid}
                className="px-3 py-2 rounded text-xs font-medium border transition-opacity disabled:opacity-40"
                style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-secondary)" }}
              >
                Add
              </button>
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between pt-1">
            {spv.sydecarId ? (
              <button
                onClick={onSync}
                className="inline-flex items-center gap-1.5 text-xs font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                <RefreshCw size={11} />
                Sync from Sydecar
              </button>
            ) : (
              <span />
            )}

            <button
              onClick={onDelete}
              className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded border"
              style={{ color: "#ef4444", borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.05)" }}
            >
              <Trash2 size={11} />
              Delete SPV
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SPVPage() {
  const familyId = useFamilyId();
  const [spvs, setSpvs] = useState<SPV[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedSpvId, setSelectedSpvId] = useState<string | null>(null);
  const [launching, setLaunching] = useState<string | null>(null);

  // ── Data fetching ────────────────────────────────────────────────────────────

  const fetchSpvs = useCallback(async () => {
    if (!familyId) return;
    try {
      const res = await fetch(`/api/spv?familyId=${encodeURIComponent(familyId)}`);
      const data = await res.json();
      setSpvs(data.spvs ?? []);
      setIsMock(!!data._mock);
    } catch {
      // leave empty
    } finally {
      setLoading(false);
    }
  }, [familyId]);

  useEffect(() => {
    fetchSpvs();
  }, [fetchSpvs]);

  // ── Actions ──────────────────────────────────────────────────────────────────

  async function launchSpv(spvId: string) {
    setLaunching(spvId);
    try {
      await fetch(`/api/spv/${spvId}/launch`, { method: "POST" });
      await fetchSpvs();
    } catch {
      // silently fail
    } finally {
      setLaunching(null);
    }
  }

  async function syncSpv(spvId: string) {
    try {
      await fetch(`/api/spv/${spvId}/sync`, { method: "POST" });
      await fetchSpvs();
    } catch {
      // silently fail
    }
  }

  async function deleteSpv(spvId: string) {
    try {
      await fetch(`/api/spv/${spvId}`, { method: "DELETE" });
      setSpvs((prev) => prev.filter((s) => s.id !== spvId));
      if (selectedSpvId === spvId) setSelectedSpvId(null);
    } catch {
      // silently fail
    }
  }

  async function addInvestorToSpv(spvId: string, inv: { name: string; email: string; commitment: number }) {
    try {
      await fetch(`/api/spv/${spvId}/investors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inv),
      });
      await fetchSpvs();
    } catch {
      // silently fail
    }
  }

  async function removeInvestor(spvId: string, investorId: string) {
    try {
      await fetch(`/api/spv/${spvId}/investors/${investorId}`, { method: "DELETE" });
      await fetchSpvs();
    } catch {
      // silently fail
    }
  }

  // ── Derived ──────────────────────────────────────────────────────────────────

  const totalCommitted = spvs.reduce((sum, s) => sum + (s.totalCommitted ?? 0), 0);
  const subtitle = `${spvs.length} ${spvs.length === 1 ? "vehicle" : "vehicles"} · ${formatCurrency(totalCommitted)} total committed`;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Create Modal */}
      {showCreate && familyId && (
        <CreateSPVModal
          familyId={familyId}
          onClose={() => setShowCreate(false)}
          onSuccess={fetchSpvs}
        />
      )}

      <div className={`flex flex-col h-full${loading ? " opacity-50 animate-pulse" : ""}`}>
        <PageHeader
          title="SPVs"
          subtitle={subtitle}
          actions={
            <div className="flex items-center gap-3">
              {isMock && <Badge label="Mock Data" variant="warning" size="xs" />}
              <button
                onClick={() => setShowCreate(true)}
                className="px-4 py-2 rounded text-sm font-semibold"
                style={{ background: "var(--accent)", color: "#fff" }}
              >
                Create SPV
              </button>
            </div>
          }
        />

        {/* Empty state */}
        {!loading && spvs.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              No SPVs yet. Create your first vehicle to pool investor capital.
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="px-5 py-2 rounded text-sm font-semibold"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              Create SPV
            </button>
          </div>
        )}

        {/* SPV grid */}
        {spvs.length > 0 && (
          <div className="flex-1 overflow-auto px-8 py-6">
            <div className="grid grid-cols-2 gap-4">
              {spvs.map((spv) => (
                <SPVCard
                  key={spv.id}
                  spv={spv}
                  expanded={selectedSpvId === spv.id}
                  launching={launching === spv.id}
                  onToggleExpand={() =>
                    setSelectedSpvId((prev) => (prev === spv.id ? null : spv.id))
                  }
                  onLaunch={() => launchSpv(spv.id)}
                  onSync={() => syncSpv(spv.id)}
                  onDelete={() => deleteSpv(spv.id)}
                  onAddInvestor={(inv) => addInvestorToSpv(spv.id, inv)}
                  onRemoveInvestor={(investorId) => removeInvestor(spv.id, investorId)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
