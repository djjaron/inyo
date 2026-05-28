"use client";

import { useRef, useState, useEffect } from "react";
import { Receipt, AlertCircle, FileText, Calendar, TrendingUp, Loader2, Trash2, Plus } from "lucide-react";
import Badge from "@/components/ui/Badge";
import PageHeader from "@/components/ui/PageHeader";
import { formatCurrency } from "@/lib/utils";
import { useFamilyId } from "@/context/FamilyContext";

interface K1Row {
  id: string;
  entity: string;
  year: number;
  status: string;
  amount: number | null;
  filed: boolean;
}

interface DeadlineRow {
  id: string;
  label: string;
  date: string;
  amount: number | null;
  status: string;
}

const K1S_FALLBACK: K1Row[] = [
  { id: "k1", entity: "Hartwell Cayman LP", year: 2025, status: "received", amount: 2_840_000, filed: false },
  { id: "k2", entity: "Arcadia Energy Fund II", year: 2025, status: "pending", amount: null, filed: false },
  { id: "k3", entity: "Meridian AI SPV", year: 2025, status: "received", amount: -120_000, filed: false },
  { id: "k4", entity: "Terrace REIT", year: 2025, status: "received", amount: 380_000, filed: true },
];

const DEADLINES_FALLBACK: DeadlineRow[] = [
  { id: "d1", label: "Q2 Federal Estimated Payment", date: "2026-06-16", amount: 485_000, status: "upcoming" },
  { id: "d2", label: "State Tax Returns — CA, NY, DE", date: "2026-10-15", amount: null, status: "upcoming" },
  { id: "d3", label: "Foundation 990-PF Filing", date: "2026-11-15", amount: null, status: "upcoming" },
  { id: "d4", label: "FBAR Foreign Account Report", date: "2026-10-15", amount: null, status: "upcoming" },
];

interface EstimatedLiability {
  federal: number;
  state: number;
  total: number;
}

interface K1SummaryItem {
  entity: string;
  income: number;
  deductions: number;
  status: string;
}

interface TaxResult {
  taxYear?: number;
  summary: string;
  estimatedLiability: EstimatedLiability;
  k1Summary?: K1SummaryItem[];
  actionItems: string[];
  deductionOpportunities: string[];
}

interface TaxAnalysis {
  _mock?: boolean;
}

// ── Modal: Add Deadline ───────────────────────────────────────────────────────

interface AddDeadlineForm {
  label: string;
  date: string;
  amount: string;
  status: string;
}

function AddDeadlineModal({
  familyId,
  onClose,
  onSuccess,
}: {
  familyId: string;
  onClose: () => void;
  onSuccess: (row: DeadlineRow) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState<AddDeadlineForm>({ label: "", date: today, amount: "", status: "upcoming" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isValid = form.label.trim().length > 0 && form.date.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/tax/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyId,
          label: form.label.trim(),
          eventDate: form.date,
          type: "deadline",
          amount: form.amount ? parseFloat(form.amount) : undefined,
          status: form.status,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to create deadline");
        return;
      }
      const data = await res.json();
      const ev = data.event;
      onSuccess({
        id: ev.id,
        label: ev.label,
        date: ev.eventDate?.slice(0, 10) ?? form.date,
        amount: ev.amount ?? null,
        status: ev.status,
      });
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
          Add Deadline
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Label <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input
              type="text"
              required
              value={form.label}
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
              placeholder="e.g. Q3 Federal Estimated Payment"
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
              style={{ background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Date <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
                style={{ background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Amount ($) <span style={{ color: "var(--text-muted)" }}>(optional)</span>
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
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Status
            </label>
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
              style={{ background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
            >
              <option value="upcoming">Upcoming</option>
              <option value="overdue">Overdue</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          {error && <p className="text-xs" style={{ color: "#ef4444" }}>{error}</p>}
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
              {submitting ? "Adding…" : "Add Deadline"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Modal: Add K-1 ────────────────────────────────────────────────────────────

interface AddK1Form {
  entityName: string;
  year: string;
  status: string;
  amount: string;
}

function AddK1Modal({
  familyId,
  onClose,
  onSuccess,
}: {
  familyId: string;
  onClose: () => void;
  onSuccess: (row: K1Row) => void;
}) {
  const currentYear = new Date().getFullYear() - 1;
  const [form, setForm] = useState<AddK1Form>({
    entityName: "",
    year: String(currentYear),
    status: "pending",
    amount: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isValid = form.entityName.trim().length > 0 && form.year.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const yearInt = parseInt(form.year);
      const res = await fetch("/api/tax/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyId,
          label: form.entityName.trim(),
          eventDate: `${yearInt}-12-31`,
          type: "k1",
          entityName: form.entityName.trim(),
          year: yearInt,
          status: form.status,
          amount: form.amount ? parseFloat(form.amount) : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to add K-1");
        return;
      }
      const data = await res.json();
      const ev = data.event;
      onSuccess({
        id: ev.id,
        entity: ev.entityName ?? form.entityName.trim(),
        year: ev.year ?? yearInt,
        status: ev.status,
        amount: ev.amount ?? null,
        filed: ev.filed ?? false,
      });
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
          Add K-1
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Entity Name <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input
              type="text"
              required
              value={form.entityName}
              onChange={(e) => setForm((f) => ({ ...f, entityName: e.target.value }))}
              placeholder="e.g. Hartwell Cayman LP"
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
              style={{ background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Year <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="number"
                required
                value={form.year}
                onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
                placeholder="2025"
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
                style={{ background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Amount ($) <span style={{ color: "var(--text-muted)" }}>(optional)</span>
              </label>
              <input
                type="number"
                step="any"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="0.00"
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
                style={{ background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Status
            </label>
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
              style={{ background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
            >
              <option value="pending">Pending</option>
              <option value="received">Received</option>
              <option value="filed">Filed</option>
            </select>
          </div>
          {error && <p className="text-xs" style={{ color: "#ef4444" }}>{error}</p>}
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
              {submitting ? "Adding…" : "Add K-1"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function TaxPage() {
  const familyId = useFamilyId();

  const [k1s, setK1s] = useState<K1Row[]>(K1S_FALLBACK);
  const [deadlines, setDeadlines] = useState<DeadlineRow[]>(DEADLINES_FALLBACK);

  const [showAddDeadline, setShowAddDeadline] = useState(false);
  const [showAddK1, setShowAddK1] = useState(false);

  // Tax intelligence query
  const [taxQuery, setTaxQuery] = useState("");
  const [taxResult, setTaxResult] = useState<TaxResult | null>(null);
  const [taxAnalysis, setTaxAnalysis] = useState<TaxAnalysis | null>(null);
  const [taxLoading, setTaxLoading] = useState(false);
  const [taxResultNote, setTaxResultNote] = useState<string | null>(null);

  // K-1 upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (!familyId) return;
    fetch(`/api/tax/events?familyId=${encodeURIComponent(familyId)}&type=k1`)
      .then((r) => r.json())
      .then((data) => {
        if (data.events?.length) setK1s(data.events.map((e: { id: string; entityName?: string; year?: number; status: string; amount?: number; filed: boolean }) => ({
          id: e.id,
          entity: e.entityName ?? "Unknown",
          year: e.year ?? new Date().getFullYear() - 1,
          status: e.status,
          amount: e.amount ?? null,
          filed: e.filed,
        })));
      })
      .catch(() => {});
    fetch(`/api/tax/events?familyId=${encodeURIComponent(familyId)}&type=deadline`)
      .then((r) => r.json())
      .then((data) => {
        if (data.events?.length) setDeadlines(data.events.map((e: { id: string; label: string; eventDate: string; amount?: number; status: string }) => ({
          id: e.id,
          label: e.label,
          date: e.eventDate?.slice(0, 10) ?? "",
          amount: e.amount ?? null,
          status: e.status,
        })));
      })
      .catch(() => {});
  }, [familyId]);

  async function handleDeleteDeadline(id: string) {
    setDeadlines((prev) => prev.filter((d) => d.id !== id));
    try {
      await fetch(`/api/tax/events?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    } catch {
      // optimistic delete already applied
    }
  }

  async function handleDeleteK1(id: string) {
    setK1s((prev) => prev.filter((k) => k.id !== id));
    try {
      await fetch(`/api/tax/events?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    } catch {
      // optimistic delete already applied
    }
  }

  async function handleToggleFiled(k: K1Row) {
    const nextFiled = !k.filed;
    setK1s((prev) => prev.map((row) => row.id === k.id ? { ...row, filed: nextFiled } : row));
    try {
      await fetch(`/api/tax/events/${encodeURIComponent(k.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filed: nextFiled }),
      });
    } catch {
      // optimistic update already applied
    }
  }

  async function handleAnalyze() {
    if (!taxQuery.trim()) return;
    setTaxLoading(true);
    setTaxResult(null);
    setTaxAnalysis(null);
    setTaxResultNote(null);
    try {
      const res = await fetch("/api/agents/tax", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ familyId: familyId ?? "demo", query: taxQuery }),
      });
      const data = await res.json();
      setTaxResult(data.result as TaxResult);
      setTaxAnalysis(data.analysis as TaxAnalysis);
    } catch {
      // silently fail
    } finally {
      setTaxLoading(false);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadLoading(true);
    setUploadError(null);
    setTaxResult(null);
    setTaxAnalysis(null);
    setTaxResultNote("K-1 analysis:");

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("familyId", familyId ?? "demo");
      const uploadRes = await fetch("/api/upload/document", {
        method: "POST",
        body: form,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        setUploadError(uploadData.error ?? "Upload failed");
        return;
      }

      const extractedText: string = uploadData.document?.textContent ?? "";

      const agentRes = await fetch("/api/agents/tax", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyId: familyId ?? "demo",
          documentContent: extractedText,
          context: { type: "k1-review" },
        }),
      });
      const agentData = await agentRes.json();
      setTaxResult(agentData.result as TaxResult);
      setTaxAnalysis(agentData.analysis as TaxAnalysis);
    } catch {
      setUploadError("Something went wrong. Please try again.");
    } finally {
      setUploadLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const isMock = taxAnalysis?._mock === true;

  void Receipt;

  return (
    <>
      {showAddDeadline && familyId && (
        <AddDeadlineModal
          familyId={familyId}
          onClose={() => setShowAddDeadline(false)}
          onSuccess={(row) => setDeadlines((prev) => [row, ...prev])}
        />
      )}
      {showAddK1 && familyId && (
        <AddK1Modal
          familyId={familyId}
          onClose={() => setShowAddK1(false)}
          onSuccess={(row) => setK1s((prev) => [row, ...prev])}
        />
      )}

      <div className="flex flex-col h-full">
        <PageHeader
          title="Tax"
          subtitle="K-1 tracking, estimated payments, and filing calendar"
        />

        <div className="flex-1 overflow-auto">
          <div className="p-8 flex flex-col gap-8">

            {/* K-1 Tracker */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-medium tracking-wider uppercase" style={{ color: "var(--text-muted)" }}>
                  K-1 Tracker — Tax Year 2025
                </h2>
                <button
                  onClick={() => setShowAddK1(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold"
                  style={{ background: "var(--accent)", color: "#fff" }}
                >
                  <Plus size={12} />
                  Add K-1
                </button>
              </div>
              <div className="rounded-md border overflow-hidden" style={{ borderColor: "var(--border)" }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border)" }}>
                      {["Entity", "Year", "Status", "Income/Loss", "Filed", ""].map((h) => (
                        <th key={h} className="text-left px-5 py-3 text-xs font-medium" style={{ color: "var(--text-muted)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {k1s.map((k) => (
                      <tr key={k.id} style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-surface)" }}>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <FileText size={13} style={{ color: "var(--text-muted)" }} />
                            <span style={{ color: "var(--text-primary)" }}>{k.entity}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-xs font-mono" style={{ color: "var(--text-muted)" }}>{k.year}</td>
                        <td className="px-5 py-3.5">
                          <Badge
                            label={k.status}
                            variant={k.status === "received" ? "success" : "warning"}
                            size="xs"
                          />
                        </td>
                        <td
                          className="px-5 py-3.5 text-xs font-mono"
                          style={{
                            color: k.amount === null ? "var(--text-muted)" : k.amount > 0 ? "#10b981" : "#ef4444",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {k.amount === null ? "—" : formatCurrency(Math.abs(k.amount))}
                        </td>
                        <td className="px-5 py-3.5">
                          <button
                            onClick={() => handleToggleFiled(k)}
                            className="flex items-center gap-1.5 transition-opacity hover:opacity-70"
                            title={k.filed ? "Mark unfiled" : "Mark filed"}
                          >
                            <Badge label={k.filed ? "Filed" : "Pending"} variant={k.filed ? "success" : "muted"} size="xs" />
                          </button>
                        </td>
                        <td className="px-5 py-3.5">
                          <button
                            onClick={() => handleDeleteK1(k.id)}
                            className="p-1 rounded hover:bg-white/5 transition-colors"
                            style={{ color: "var(--text-muted)" }}
                            title="Delete K-1"
                          >
                            <Trash2 size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* K-1 Document Upload */}
              <div className="mt-4 flex items-center gap-4">
                <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Upload K-1 Document</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadLoading}
                  className="px-4 py-1.5 rounded text-xs font-medium border transition-opacity disabled:opacity-40"
                  style={{
                    background: "var(--bg-surface)",
                    borderColor: "var(--border)",
                    color: "var(--text-secondary)",
                  }}
                >
                  {uploadLoading ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 size={11} className="animate-spin" />
                      Uploading…
                    </span>
                  ) : (
                    "Choose file (.pdf, .txt)"
                  )}
                </button>
                {uploadError && (
                  <span className="text-xs flex items-center gap-1" style={{ color: "#ef4444" }}>
                    <AlertCircle size={11} />
                    {uploadError}
                  </span>
                )}
              </div>
            </div>

            {/* Tax Intelligence Query Box */}
            <div>
              <h2 className="text-xs font-medium tracking-wider uppercase mb-4" style={{ color: "var(--text-muted)" }}>
                Tax Intelligence
              </h2>
              <div className="flex gap-3">
                <input
                  type="text"
                  className="flex-1 rounded-md border px-4 py-2.5 text-sm focus:outline-none focus:ring-1"
                  placeholder="Ask about your tax position... e.g. 'What's my estimated Q3 liability?' or 'Summarize K-1 income'"
                  value={taxQuery}
                  onChange={(e) => setTaxQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAnalyze(); }}
                  style={{
                    background: "var(--bg-surface)",
                    borderColor: "var(--border)",
                    color: "var(--text-primary)",
                  }}
                />
                <button
                  onClick={handleAnalyze}
                  disabled={taxLoading || !taxQuery.trim()}
                  className="px-5 py-2.5 rounded text-sm font-semibold transition-opacity disabled:opacity-40 shrink-0"
                  style={{ background: "var(--accent)", color: "#fff" }}
                >
                  {taxLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 size={13} className="animate-spin" />
                      Analyzing…
                    </span>
                  ) : (
                    "Analyze"
                  )}
                </button>
              </div>

              {/* Results Card */}
              {taxResult && (
                <div
                  className="mt-4 rounded-md border p-5 flex flex-col gap-5"
                  style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-1">
                      {taxResultNote && (
                        <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                          {taxResultNote}
                        </span>
                      )}
                      <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>
                        {taxResult.summary}
                      </p>
                    </div>
                    {isMock && (
                      <Badge label="Mock" variant="warning" size="xs" />
                    )}
                  </div>

                  {taxResult.estimatedLiability && (
                    <div>
                      <div className="text-xs font-medium tracking-wider uppercase mb-3" style={{ color: "var(--text-muted)" }}>
                        Estimated Liability {taxResult.taxYear ? `— ${taxResult.taxYear}` : ""}
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div
                          className="rounded px-4 py-3 flex flex-col gap-1"
                          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
                        >
                          <span className="text-xs" style={{ color: "var(--text-muted)" }}>Federal</span>
                          <span className="text-sm font-semibold font-mono" style={{ color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                            {formatCurrency(taxResult.estimatedLiability.federal)}
                          </span>
                        </div>
                        <div
                          className="rounded px-4 py-3 flex flex-col gap-1"
                          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
                        >
                          <span className="text-xs" style={{ color: "var(--text-muted)" }}>State</span>
                          <span className="text-sm font-semibold font-mono" style={{ color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                            {formatCurrency(taxResult.estimatedLiability.state)}
                          </span>
                        </div>
                        <div
                          className="rounded px-4 py-3 flex flex-col gap-1"
                          style={{ background: "color-mix(in srgb, var(--accent) 12%, var(--bg-surface))", border: "1px solid var(--border)" }}
                        >
                          <span className="text-xs font-medium" style={{ color: "var(--accent)" }}>Total</span>
                          <span className="text-sm font-semibold font-mono" style={{ color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                            {formatCurrency(taxResult.estimatedLiability.total)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {taxResult.actionItems?.length > 0 && (
                    <div>
                      <div className="text-xs font-medium tracking-wider uppercase mb-2" style={{ color: "var(--text-muted)" }}>
                        Action Items
                      </div>
                      <ol className="flex flex-col gap-1.5">
                        {taxResult.actionItems.map((item, i) => (
                          <li key={i} className="text-xs flex gap-2.5 items-start">
                            <span className="font-semibold shrink-0 w-4 text-right" style={{ color: "var(--accent)" }}>
                              {i + 1}.
                            </span>
                            <span style={{ color: "var(--text-secondary)" }}>{item}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {taxResult.deductionOpportunities?.length > 0 && (
                    <div>
                      <div className="text-xs font-medium tracking-wider uppercase mb-2" style={{ color: "var(--text-muted)" }}>
                        Deduction Opportunities
                      </div>
                      <ul className="flex flex-col gap-1.5">
                        {taxResult.deductionOpportunities.map((opp, i) => (
                          <li key={i} className="text-xs flex gap-2 items-start">
                            <TrendingUp size={12} className="shrink-0 mt-0.5" style={{ color: "#10b981" }} />
                            <span style={{ color: "var(--text-secondary)" }}>{opp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Filing Calendar */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-medium tracking-wider uppercase" style={{ color: "var(--text-muted)" }}>
                  Filing Calendar
                </h2>
                <button
                  onClick={() => setShowAddDeadline(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold"
                  style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
                >
                  <Plus size={12} />
                  Add Deadline
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {deadlines.map((d) => (
                  <div
                    key={d.id}
                    className="p-4 rounded-md border group"
                    style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{d.label}</div>
                      <button
                        onClick={() => handleDeleteDeadline(d.id)}
                        className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-white/5 transition-all shrink-0"
                        style={{ color: "var(--text-muted)" }}
                        title="Delete deadline"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                        <Calendar size={11} />
                        {d.date}
                      </div>
                      {d.amount && (
                        <span
                          className="text-xs font-mono font-medium"
                          style={{ color: "#f59e0b", fontVariantNumeric: "tabular-nums" }}
                        >
                          {formatCurrency(d.amount)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
