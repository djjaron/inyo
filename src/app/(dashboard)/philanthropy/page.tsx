"use client";

import { useState, useEffect } from "react";
import { Heart, Calendar, Loader2, Trash2, Plus } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import { useFamilyId } from "@/context/FamilyContext";

interface GrantRow {
  id?: string;
  org: string;
  category?: string | null;
  amount: number;
  year: number;
  status: string;
  impact?: string | null;
}

interface PledgeRow {
  id?: string;
  org: string;
  amount: number;
  remaining: number;
  deadline?: string | null;
}

const GRANTS: GrantRow[] = [
  { id: "g1", org: "MIT Media Lab", category: "Education", amount: 500_000, year: 2026, status: "active", impact: "AI literacy programs" },
  { id: "g2", org: "Nature Conservancy", category: "Environment", amount: 250_000, year: 2026, status: "active", impact: "Amazon watershed protection" },
  { id: "g3", org: "Robin Hood Foundation", category: "Poverty", amount: 100_000, year: 2025, status: "completed", impact: "NYC youth employment" },
  { id: "g4", org: "MacArthur Foundation", category: "Justice", amount: 150_000, year: 2025, status: "completed", impact: "Criminal justice reform" },
];

const PLEDGES: PledgeRow[] = [
  { id: "p1", org: "Stanford GSB", amount: 2_000_000, remaining: 1_500_000, deadline: "2028-12-31" },
  { id: "p2", org: "New York Public Library", amount: 500_000, remaining: 300_000, deadline: "2027-06-30" },
];

interface PhilanthropyResult {
  summary: string;
  impactHighlights: string[];
  recommendations: string[];
  upcomingObligations: { org: string; amount: number; due: string; note: string }[];
  grantingCapacity: string;
}

// ── Add Grant Modal ────────────────────────────────────────────────────────────

function AddGrantModal({
  familyId,
  onClose,
  onSuccess,
}: {
  familyId: string;
  onClose: () => void;
  onSuccess: (grant: GrantRow) => void;
}) {
  const currentYear = new Date().getFullYear();
  const [form, setForm] = useState({
    org: "",
    category: "",
    amount: "",
    year: String(currentYear),
    impact: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isValid = form.org.trim().length > 0 && parseFloat(form.amount) > 0 && parseInt(form.year) > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/philanthropy/grants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyId,
          org: form.org.trim(),
          amount: parseFloat(form.amount),
          year: parseInt(form.year),
          category: form.category.trim() || undefined,
          impact: form.impact.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create grant");
        return;
      }
      onSuccess(data.grant);
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
          Add Grant
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Org Name <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input
              type="text"
              required
              value={form.org}
              onChange={(e) => setForm((f) => ({ ...f, org: e.target.value }))}
              placeholder="e.g. MIT Media Lab"
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
              style={{ background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Category <span style={{ color: "var(--text-muted)" }}>(optional)</span>
            </label>
            <input
              type="text"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              placeholder="e.g. Education"
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
              style={{ background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Amount ($) <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="0"
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
                style={{ background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Year <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="number"
                min="2000"
                max="2100"
                required
                value={form.year}
                onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
                style={{ background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Impact <span style={{ color: "var(--text-muted)" }}>(optional)</span>
            </label>
            <input
              type="text"
              value={form.impact}
              onChange={(e) => setForm((f) => ({ ...f, impact: e.target.value }))}
              placeholder="e.g. AI literacy programs"
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
              {submitting ? "Adding…" : "Add Grant"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Add Pledge Modal ───────────────────────────────────────────────────────────

function AddPledgeModal({
  familyId,
  onClose,
  onSuccess,
}: {
  familyId: string;
  onClose: () => void;
  onSuccess: (pledge: PledgeRow) => void;
}) {
  const [form, setForm] = useState({
    org: "",
    amount: "",
    remaining: "",
    deadline: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isValid =
    form.org.trim().length > 0 &&
    parseFloat(form.amount) > 0 &&
    parseFloat(form.remaining) >= 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/philanthropy/pledges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyId,
          org: form.org.trim(),
          amount: parseFloat(form.amount),
          remaining: parseFloat(form.remaining),
          deadline: form.deadline || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create pledge");
        return;
      }
      const p = data.pledge;
      onSuccess({
        id: p.id,
        org: p.org,
        amount: p.amount,
        remaining: p.remaining,
        deadline: p.deadline ? p.deadline.slice(0, 10) : null,
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
          Add Pledge
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Org Name <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input
              type="text"
              required
              value={form.org}
              onChange={(e) => setForm((f) => ({ ...f, org: e.target.value }))}
              placeholder="e.g. Stanford GSB"
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
              style={{ background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Total Amount ($) <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="0"
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
                style={{ background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Remaining ($) <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={form.remaining}
                onChange={(e) => setForm((f) => ({ ...f, remaining: e.target.value }))}
                placeholder="0"
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
                style={{ background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Deadline <span style={{ color: "var(--text-muted)" }}>(optional)</span>
            </label>
            <input
              type="date"
              value={form.deadline}
              onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
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
              {submitting ? "Adding…" : "Add Pledge"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function PhilanthropyPage() {
  const familyId = useFamilyId();
  const [grants, setGrants] = useState<GrantRow[]>(GRANTS);
  const [pledges, setPledges] = useState<PledgeRow[]>(PLEDGES);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PhilanthropyResult | null>(null);
  const [isMock, setIsMock] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddGrant, setShowAddGrant] = useState(false);
  const [showAddPledge, setShowAddPledge] = useState(false);

  useEffect(() => {
    if (!familyId) return;
    fetch(`/api/philanthropy/grants?familyId=${encodeURIComponent(familyId)}`)
      .then((r) => r.json())
      .then((data) => { if (data.grants?.length) setGrants(data.grants); })
      .catch(() => {});
    fetch(`/api/philanthropy/pledges?familyId=${encodeURIComponent(familyId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.pledges?.length) {
          setPledges(data.pledges.map((p: { id: string; org: string; amount: number; remaining: number; deadline?: string | null }) => ({
            id: p.id,
            org: p.org,
            amount: p.amount,
            remaining: p.remaining,
            deadline: p.deadline ? p.deadline.slice(0, 10) : null,
          })));
        }
      })
      .catch(() => {});
  }, [familyId]);

  const totalGiven = grants.reduce((s, g) => s + g.amount, 0);

  async function handleDeleteGrant(id: string | undefined) {
    if (!id) return;
    setGrants((prev) => prev.filter((g) => g.id !== id));
    try {
      await fetch(`/api/philanthropy/grants?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    } catch {
      // optimistic — silent fail
    }
  }

  async function handleDeletePledge(id: string | undefined) {
    if (!id) return;
    setPledges((prev) => prev.filter((p) => p.id !== id));
    try {
      await fetch(`/api/philanthropy/pledges?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    } catch {
      // optimistic — silent fail
    }
  }

  async function handleAnalyze() {
    if (!familyId || !query.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/agents/philanthropy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ familyId, query: query.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Analysis failed");
        return;
      }
      setResult(data.result as PhilanthropyResult);
      setIsMock(data.analysis?._mock === true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {showAddGrant && familyId && (
        <AddGrantModal
          familyId={familyId}
          onClose={() => setShowAddGrant(false)}
          onSuccess={(grant) => setGrants((prev) => [grant, ...prev])}
        />
      )}
      {showAddPledge && familyId && (
        <AddPledgeModal
          familyId={familyId}
          onClose={() => setShowAddPledge(false)}
          onSuccess={(pledge) => setPledges((prev) => [pledge, ...prev])}
        />
      )}

      <div className="flex flex-col h-full">
        <PageHeader
          title="Philanthropy"
          subtitle="Foundation operations, grants, and impact tracking"
          actions={
            <div
              className="text-sm font-semibold px-4 py-2 rounded"
              style={{ background: "var(--bg-elevated)", color: "#10b981" }}
            >
              {formatCurrency(totalGiven)} given
            </div>
          }
        />

        <div className="flex-1 p-8 grid grid-cols-3 gap-6 overflow-auto">
          {/* Grant portfolio */}
          <div className="col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-medium tracking-wider uppercase" style={{ color: "var(--text-muted)" }}>Grant Portfolio</h2>
              <button
                onClick={() => setShowAddGrant(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold"
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
              >
                <Plus size={12} />
                Add Grant
              </button>
            </div>
            <div className="rounded-md border overflow-hidden" style={{ borderColor: "var(--border)" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border)" }}>
                    {["Organization", "Category", "Amount", "Year", "Status", "Impact", ""].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-medium" style={{ color: "var(--text-muted)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {grants.map((g, i) => (
                    <tr
                      key={g.id ?? i}
                      className="group"
                      style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-surface)" }}
                    >
                      <td className="px-5 py-3.5 font-medium" style={{ color: "var(--text-primary)" }}>{g.org}</td>
                      <td className="px-5 py-3.5"><Badge label={g.category ?? "—"} variant="muted" size="xs" /></td>
                      <td className="px-5 py-3.5 text-xs font-mono" style={{ color: "#10b981", fontVariantNumeric: "tabular-nums" }}>{formatCurrency(g.amount)}</td>
                      <td className="px-5 py-3.5 text-xs font-mono" style={{ color: "var(--text-muted)" }}>{g.year}</td>
                      <td className="px-5 py-3.5"><Badge label={g.status} variant={g.status === "active" ? "success" : "muted"} size="xs" /></td>
                      <td className="px-5 py-3.5 text-xs max-w-32 truncate" style={{ color: "var(--text-secondary)" }}>{g.impact ?? "—"}</td>
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => handleDeleteGrant(g.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity hover:bg-white/5"
                          style={{ color: "var(--text-muted)" }}
                          title="Delete grant"
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pledges */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-medium tracking-wider uppercase" style={{ color: "var(--text-muted)" }}>Open Pledges</h2>
              <button
                onClick={() => setShowAddPledge(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold"
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
              >
                <Plus size={12} />
                Add Pledge
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {pledges.map((p, i) => {
                const pct = Math.round(((p.amount - p.remaining) / p.amount) * 100);
                return (
                  <div
                    key={p.id ?? i}
                    className="group p-4 rounded-md border relative"
                    style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
                  >
                    <button
                      onClick={() => handleDeletePledge(p.id)}
                      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity hover:bg-white/5"
                      style={{ color: "var(--text-muted)" }}
                      title="Delete pledge"
                    >
                      <Trash2 size={12} />
                    </button>
                    <div className="text-sm font-medium mb-1 pr-6" style={{ color: "var(--text-primary)" }}>{p.org}</div>
                    <div className="flex justify-between text-xs mb-2" style={{ color: "var(--text-muted)" }}>
                      <span>{formatCurrency(p.amount - p.remaining)} paid</span>
                      <span>{formatCurrency(p.remaining)} remaining</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "#10b981" }} />
                    </div>
                    {p.deadline && (
                      <div className="mt-2 flex items-center gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
                        <Calendar size={10} />
                        Due {p.deadline}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Philanthropy Intelligence — full width */}
          <div className="col-span-3">
            <div
              className="rounded-md border p-6"
              style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
            >
              {/* Header */}
              <div className="flex items-center gap-2 mb-4">
                <Heart size={16} style={{ color: "var(--accent)" }} />
                <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  Philanthropy Intelligence
                </h2>
                {isMock && (
                  <span
                    className="ml-2 text-xs px-2 py-0.5 rounded"
                    style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.25)" }}
                  >
                    Demo
                  </span>
                )}
              </div>

              {/* Query input */}
              <div className="flex gap-3 mb-5">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAnalyze(); }}
                  placeholder="Ask about your giving... e.g. 'What's my total impact this year?' or 'How should I optimize my Q4 giving?'"
                  className="flex-1 text-sm px-4 py-2 rounded-md"
                  style={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                    outline: "none",
                  }}
                />
                <button
                  onClick={handleAnalyze}
                  disabled={loading || !familyId || !query.trim()}
                  className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium"
                  style={{
                    background: loading || !familyId || !query.trim() ? "var(--bg-elevated)" : "var(--accent)",
                    color: loading || !familyId || !query.trim() ? "var(--text-muted)" : "#fff",
                    cursor: loading || !familyId || !query.trim() ? "not-allowed" : "pointer",
                    transition: "background 0.15s",
                  }}
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : null}
                  Analyze
                </button>
              </div>

              {/* Error */}
              {error && (
                <div className="text-xs px-4 py-3 rounded mb-4" style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
                  {error}
                </div>
              )}

              {/* Loading shimmer */}
              {loading && (
                <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Analyzing your philanthropy portfolio...</span>
                </div>
              )}

              {/* Results */}
              {result && !loading && (
                <div className="flex flex-col gap-5">
                  {/* Summary */}
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {result.summary}
                  </p>

                  <div className="grid grid-cols-2 gap-6">
                    {/* Impact Highlights */}
                    <div>
                      <h3 className="text-xs font-medium tracking-wider uppercase mb-3" style={{ color: "var(--text-muted)" }}>
                        Impact Highlights
                      </h3>
                      <ul className="flex flex-col gap-2">
                        {result.impactHighlights.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                            <span className="mt-1 flex-shrink-0 w-2 h-2 rounded-full" style={{ background: "#10b981" }} />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Recommendations */}
                    <div>
                      <h3 className="text-xs font-medium tracking-wider uppercase mb-3" style={{ color: "var(--text-muted)" }}>
                        Recommendations
                      </h3>
                      <ol className="flex flex-col gap-2">
                        {result.recommendations.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                            <span className="font-semibold flex-shrink-0 w-4 text-right" style={{ color: "var(--accent)" }}>
                              {i + 1}.
                            </span>
                            {item}
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>

                  {/* Upcoming Obligations */}
                  {result.upcomingObligations?.length > 0 && (
                    <div>
                      <h3 className="text-xs font-medium tracking-wider uppercase mb-3" style={{ color: "var(--text-muted)" }}>
                        Upcoming Obligations
                      </h3>
                      <div className="rounded-md border overflow-hidden" style={{ borderColor: "var(--border)" }}>
                        <table className="w-full text-xs">
                          <thead>
                            <tr style={{ background: "var(--bg-elevated)", borderBottom: "1px solid var(--border)" }}>
                              {["Organization", "Amount", "Due Date", "Note"].map((h) => (
                                <th key={h} className="text-left px-4 py-2.5 font-medium" style={{ color: "var(--text-muted)" }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {result.upcomingObligations.map((ob, i) => (
                              <tr key={i} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                                <td className="px-4 py-2.5 font-medium" style={{ color: "var(--text-primary)" }}>{ob.org}</td>
                                <td className="px-4 py-2.5 font-mono" style={{ color: "#10b981" }}>{formatCurrency(ob.amount)}</td>
                                <td className="px-4 py-2.5" style={{ color: "var(--text-muted)" }}>{ob.due}</td>
                                <td className="px-4 py-2.5" style={{ color: "var(--text-secondary)" }}>{ob.note}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Granting Capacity */}
                  {result.grantingCapacity && (
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {result.grantingCapacity}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
