"use client";

import { useState, useEffect } from "react";
import { Search, Clock, Loader2, Sparkles, Plus, X, DollarSign } from "lucide-react";
import Badge from "@/components/ui/Badge";
import PageHeader from "@/components/ui/PageHeader";
import { useFamilyId } from "@/context/FamilyContext";

// ── Types ───────────────────────────────────────────────────────────────────

interface Contact {
  id: string;
  name: string;
  email?: string | null;
  company?: string | null;
  title?: string | null;
  type: string;
  lastContactAt?: string | Date | null;
  introducedBy?: string | null;
  warmPathNotes?: string | null;
  notes?: string | null;
  investorType?: string | null;
  assetClasses?: string[];
  checkSizeMin?: number | null;
  checkSizeMax?: number | null;
  portfolioNotes?: string | null;
  lastDealTogether?: string | null;
  linkedIn?: string | null;
}

const ASSET_CLASS_OPTIONS = ["tech", "real-estate", "sports", "credit", "pe", "other"] as const;

const investorTypeVariant: Record<string, "accent" | "success" | "warning" | "muted" | "default"> = {
  lp: "warning",
  "co-investor": "accent",
  "family-office": "success",
  vc: "accent",
  pe: "success",
  angel: "warning",
  strategic: "muted",
};

const INVESTOR_FILTERS = ["All", "LPs", "Co-Investors", "Family Offices", "VCs"] as const;
type InvestorFilter = typeof INVESTOR_FILTERS[number];

interface Interaction {
  id: string;
  type: string;
  subject?: string | null;
  occurredAt: string;
  contact: { name: string };
}

interface RelationshipResult {
  answer: string;
  contacts: string[];
  suggestedActions: string[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

function formatDate(val?: string | Date | null): string {
  if (!val) return "—";
  const d = typeof val === "string" ? new Date(val) : val;
  if (isNaN(d.getTime())) return "—";
  return d.toISOString().slice(0, 10);
}

function relativeTime(val: string): string {
  const d = new Date(val);
  if (isNaN(d.getTime())) return "";
  const diffMs = Date.now() - d.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "1d";
  if (diffDays < 7) return `${diffDays}d`;
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 5) return `${diffWeeks}w`;
  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths}mo`;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TYPE_FILTERS = ["All", "Founders", "LPs", "GPs", "Attorneys", "Advisors", "Family"] as const;

const typeMap: Record<string, string> = {
  Founders: "founder", LPs: "lp", GPs: "gp", Attorneys: "attorney", Advisors: "advisor", Family: "family",
};

const typeVariant: Record<string, "accent" | "success" | "warning" | "muted" | "default"> = {
  founder: "accent", gp: "success", lp: "warning", attorney: "muted", advisor: "default", banker: "muted", family: "success",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function RelationshipsPage() {
  const familyId = useFamilyId();

  const [filter, setFilter] = useState("All");
  const [investorFilter, setInvestorFilter] = useState<InvestorFilter>("All");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Modal form state
  const [modalForm, setModalForm] = useState({
    name: "", email: "", phone: "", company: "", title: "",
    type: "co-investor", linkedIn: "", notes: "",
    investorType: "", assetClasses: [] as string[],
    checkSizeMin: "", checkSizeMax: "", portfolioNotes: "",
  });
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Data state
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isMock, setIsMock] = useState(false);

  // Query box state
  const [query, setQuery] = useState("");
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryResult, setQueryResult] = useState<RelationshipResult | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);

  // Fetch data on mount and whenever familyId resolves
  useEffect(() => {
    let cancelled = false;
    setLoadingData(true);

    async function load() {
      const fid = familyId ?? "family_demo";
      let contactsMock = false;
      let interactionsMock = false;

      const [contactsRes, interactionsRes] = await Promise.allSettled([
        fetch(`/api/contacts?familyId=${encodeURIComponent(fid)}`),
        fetch(`/api/interactions?familyId=${encodeURIComponent(fid)}`),
      ]);

      let loadedContacts: Contact[] = [];
      let loadedInteractions: Interaction[] = [];

      if (contactsRes.status === "fulfilled" && contactsRes.value.ok) {
        const data = await contactsRes.value.json();
        loadedContacts = data.contacts ?? [];
        if (data._mock) contactsMock = true;
      }

      if (interactionsRes.status === "fulfilled" && interactionsRes.value.ok) {
        const data = await interactionsRes.value.json();
        loadedInteractions = data.interactions ?? [];
        if (data._mock) interactionsMock = true;
      }

      if (!cancelled) {
        setContacts(loadedContacts);
        setInteractions(loadedInteractions);
        setIsMock(contactsMock || interactionsMock);
        setLoadingData(false);
      }
    }

    load().catch(() => {
      if (!cancelled) setLoadingData(false);
    });

    return () => { cancelled = true; };
  }, [familyId]);

  async function handleAsk() {
    if (!query.trim()) return;
    setQueryLoading(true);
    setQueryResult(null);
    setQueryError(null);

    try {
      const fid = familyId ?? "family_demo";
      const res = await fetch("/api/agents/relationships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyId: fid,
          query: query.trim(),
          contacts: contacts.slice(0, 20),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setQueryError(data.error ?? "Something went wrong");
      } else {
        setQueryResult(data.result as RelationshipResult);
      }
    } catch {
      setQueryError("Network error — please try again");
    } finally {
      setQueryLoading(false);
    }
  }

  function handleQueryKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleAsk();
  }

  function fmtCheck(min?: number | null, max?: number | null): string {
    if (!min && !max) return "";
    const fmt = (n: number) =>
      n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(0)}M` : `$${(n / 1_000).toFixed(0)}K`;
    if (min && max) return `${fmt(min)}–${fmt(max)}`;
    if (min) return `${fmt(min)}+`;
    return `up to ${fmt(max!)}`;
  }

  async function saveContact() {
    if (!modalForm.name.trim()) { setModalError("Name is required"); return; }
    setModalSaving(true);
    setModalError(null);
    try {
      const fid = familyId ?? "family_demo";
      const body = {
        familyId: fid,
        name: modalForm.name.trim(),
        email: modalForm.email || null,
        phone: modalForm.phone || null,
        company: modalForm.company || null,
        title: modalForm.title || null,
        type: modalForm.type || "co-investor",
        linkedIn: modalForm.linkedIn || null,
        notes: modalForm.notes || null,
        investorType: modalForm.investorType || null,
        assetClasses: modalForm.assetClasses,
        checkSizeMin: modalForm.checkSizeMin ? parseFloat(modalForm.checkSizeMin) : null,
        checkSizeMax: modalForm.checkSizeMax ? parseFloat(modalForm.checkSizeMax) : null,
        portfolioNotes: modalForm.portfolioNotes || null,
      };
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setModalError(data.error ?? "Failed to save"); return; }
      setContacts((prev) => [data.contact as Contact, ...prev]);
      setShowAddModal(false);
      setModalForm({
        name: "", email: "", phone: "", company: "", title: "",
        type: "co-investor", linkedIn: "", notes: "",
        investorType: "", assetClasses: [],
        checkSizeMin: "", checkSizeMax: "", portfolioNotes: "",
      });
    } catch {
      setModalError("Network error — please try again");
    } finally {
      setModalSaving(false);
    }
  }

  function toggleAssetClass(cls: string) {
    setModalForm((f) => ({
      ...f,
      assetClasses: f.assetClasses.includes(cls)
        ? f.assetClasses.filter((c) => c !== cls)
        : [...f.assetClasses, cls],
    }));
  }

  // Investor network contacts: have investorType set or type is lp/gp/co-investor
  const investorContacts = contacts.filter((c) =>
    c.investorType || ["lp", "gp", "co-investor"].includes(c.type)
  );

  const filteredInvestors = investorContacts.filter((c) => {
    if (investorFilter === "LPs") return c.investorType === "lp" || c.type === "lp";
    if (investorFilter === "Co-Investors") return c.investorType === "co-investor" || c.type === "co-investor";
    if (investorFilter === "Family Offices") return c.investorType === "family-office";
    if (investorFilter === "VCs") return c.investorType === "vc" || c.type === "gp";
    return true;
  });

  const filtered = contacts.filter((c) => {
    const typeMatch = filter === "All" || c.type === typeMap[filter];
    const searchMatch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.company ?? "").toLowerCase().includes(search.toLowerCase());
    return typeMatch && searchMatch;
  });

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Relationships"
        subtitle={
          loadingData
            ? "Loading your network…"
            : `${contacts.length} contact${contacts.length !== 1 ? "s" : ""} in your network${isMock ? " (demo)" : ""}`
        }
        actions={
          <div className="flex items-center gap-2">
            {isMock && (
              <Badge label="Demo data" variant="warning" size="xs" />
            )}
            <div
              className="flex items-center gap-2 px-3 py-2 rounded border text-sm"
              style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-secondary)" }}
            >
              <Search size={13} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search contacts..."
                className="bg-transparent outline-none text-sm w-40"
                style={{ color: "var(--text-primary)" }}
              />
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded text-xs font-medium"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              <Plus size={12} /> Add LP / Co-Investor
            </button>
          </div>
        }
      />

      {/* Type filters */}
      <div
        className="flex items-center gap-1 px-8 py-3 border-b overflow-x-auto"
        style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}
      >
        {TYPE_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded text-xs whitespace-nowrap transition-colors"
            style={
              filter === f
                ? { background: "var(--accent)", color: "#fff" }
                : { color: "var(--text-secondary)", background: "transparent" }
            }
          >
            {f}
          </button>
        ))}
      </div>

      {/* AI Query Box */}
      <div
        className="mx-6 mt-5 mb-1 rounded-lg border p-4"
        style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={14} style={{ color: "var(--accent)" }} />
          <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
            Relationship Intelligence
          </span>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleQueryKeyDown}
            placeholder="Ask about your network... e.g. 'Who do I know at Andreessen?' or 'Find warm path to Stripe'"
            className="flex-1 px-3 py-2 rounded border text-sm bg-transparent outline-none"
            style={{
              borderColor: "var(--border)",
              color: "var(--text-primary)",
              background: "var(--bg-surface)",
            }}
          />
          <button
            onClick={handleAsk}
            disabled={queryLoading || !query.trim()}
            className="px-4 py-2 rounded text-sm font-medium transition-opacity disabled:opacity-50"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            {queryLoading ? (
              <span className="flex items-center gap-1.5">
                <Loader2 size={13} className="animate-spin" />
                Thinking…
              </span>
            ) : (
              "Ask"
            )}
          </button>
        </div>

        {/* Query result */}
        {queryLoading && !queryResult && (
          <div
            className="mt-3 flex items-center gap-2 text-sm px-3 py-2 rounded"
            style={{ color: "var(--text-muted)", background: "var(--bg-surface)" }}
          >
            <Loader2 size={13} className="animate-spin" />
            Thinking…
          </div>
        )}

        {queryError && (
          <div
            className="mt-3 text-xs px-3 py-2 rounded border"
            style={{ color: "var(--text-secondary)", borderColor: "var(--border)", background: "var(--bg-surface)" }}
          >
            {queryError}
          </div>
        )}

        {queryResult && (
          <div
            className="mt-3 rounded border p-4 space-y-3"
            style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
          >
            {/* Answer */}
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>
              {queryResult.answer}
            </p>

            {/* Relevant contacts */}
            {queryResult.contacts?.length > 0 && (
              <div>
                <div className="text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>
                  Relevant Contacts
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {queryResult.contacts.map((name) => (
                    <span
                      key={name}
                      className="px-2 py-0.5 rounded text-xs font-medium"
                      style={{ background: "var(--accent-muted)", color: "var(--accent)" }}
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested actions */}
            {queryResult.suggestedActions?.length > 0 && (
              <div>
                <div className="text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>
                  Suggested Actions
                </div>
                <ul className="space-y-1">
                  {queryResult.suggestedActions.map((action, i) => (
                    <li
                      key={i}
                      className="text-xs flex items-start gap-2"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      <span style={{ color: "var(--accent)" }} className="mt-0.5 shrink-0">→</span>
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Investor Network Section */}
      <div className="px-6 pt-4 pb-2">
        <div className="rounded-lg border" style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}>
          <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Investor Network</span>
            <div className="flex items-center gap-1">
              {INVESTOR_FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setInvestorFilter(f)}
                  className="px-2.5 py-1 rounded text-xs whitespace-nowrap transition-colors"
                  style={
                    investorFilter === f
                      ? { background: "var(--accent)", color: "#fff" }
                      : { color: "var(--text-secondary)", background: "transparent" }
                  }
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {filteredInvestors.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs" style={{ color: "var(--text-muted)" }}>
              No investor contacts yet.{" "}
              <button
                onClick={() => setShowAddModal(true)}
                className="underline hover:no-underline"
                style={{ color: "var(--accent)" }}
              >
                Add one
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 p-3">
              {filteredInvestors.map((c) => (
                <div
                  key={c.id}
                  className="p-3 rounded-md border"
                  style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
                >
                  <div className="flex items-start gap-2 mb-2">
                    <div
                      className="w-8 h-8 rounded-md flex items-center justify-center text-xs font-semibold shrink-0"
                      style={{ background: "var(--accent-muted)", color: "var(--accent)" }}
                    >
                      {initials(c.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>{c.name}</div>
                      <div className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                        {[c.title, c.company].filter(Boolean).join(", ") || "—"}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-2">
                    {c.investorType && (
                      <Badge label={c.investorType.replace(/-/g, " ")} variant={investorTypeVariant[c.investorType] ?? "default"} size="xs" />
                    )}
                    {(c.assetClasses ?? []).slice(0, 3).map((cls) => (
                      <span
                        key={cls}
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{ background: "var(--bg-elevated)", color: "var(--text-muted)", border: "1px solid var(--border)", fontSize: "10px" }}
                      >
                        {cls}
                      </span>
                    ))}
                  </div>

                  {(c.checkSizeMin || c.checkSizeMax) && (
                    <div className="flex items-center gap-1 text-xs mb-1.5" style={{ color: "var(--text-secondary)" }}>
                      <DollarSign size={10} style={{ color: "var(--text-muted)" }} />
                      {fmtCheck(c.checkSizeMin, c.checkSizeMax)}
                    </div>
                  )}

                  <div className="flex items-center gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
                    <Clock size={10} />
                    {formatDate(c.lastContactAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden mt-4">
        {/* Contact grid */}
        <div className="flex-1 overflow-auto p-6 pt-2">
          {loadingData ? (
            <div
              className="flex items-center justify-center h-32 gap-2 text-sm"
              style={{ color: "var(--text-muted)" }}
            >
              <Loader2 size={16} className="animate-spin" />
              Loading contacts…
            </div>
          ) : filtered.length === 0 ? (
            <div
              className="flex items-center justify-center h-32 text-sm"
              style={{ color: "var(--text-muted)" }}
            >
              No contacts found
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {filtered.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-md border cursor-pointer transition-colors group"
                  style={{ background: "var(--bg-surface)", borderColor: expandedId === c.id ? "var(--accent)" : "var(--border)" }}
                  onClick={() => setExpandedId(id => id === c.id ? null : c.id)}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className="w-9 h-9 rounded-md flex items-center justify-center text-sm font-semibold shrink-0"
                      style={{ background: "var(--accent-muted)", color: "var(--accent)" }}
                    >
                      {initials(c.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                        {c.name}
                      </div>
                      <div className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                        {[c.title, c.company].filter(Boolean).join(", ") || "—"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Badge label={c.type} variant={typeVariant[c.type] ?? "default"} size="xs" />
                    {c.introducedBy && (
                      <div className="text-xs truncate max-w-[100px]" style={{ color: "var(--text-muted)" }}>
                        via {c.introducedBy}
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex items-center gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
                    <Clock size={10} />
                    Last contact: {formatDate(c.lastContactAt)}
                  </div>

                  {expandedId === c.id && (
                    <div className="mt-3 pt-3 flex flex-col gap-1.5" style={{ borderTop: "1px solid var(--border)" }}>
                      {c.email && (
                        <div className="text-xs" style={{ color: "var(--text-secondary)" }}>{c.email}</div>
                      )}
                      {c.warmPathNotes && (
                        <div className="text-xs" style={{ color: "var(--text-muted)" }}>{c.warmPathNotes}</div>
                      )}
                      {c.notes && (
                        <div className="text-xs" style={{ color: "var(--text-muted)" }}>{c.notes}</div>
                      )}
                      {!c.email && !c.warmPathNotes && !c.notes && (
                        <div className="text-xs" style={{ color: "var(--text-muted)" }}>No additional details</div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Interaction feed */}
        <div
          className="w-72 shrink-0 border-l overflow-auto"
          style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}
        >
          <div
            className="px-4 py-3.5 border-b text-sm font-medium"
            style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
          >
            Recent Interactions
          </div>

          {loadingData ? (
            <div className="flex items-center justify-center h-20 gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
              <Loader2 size={13} className="animate-spin" />
              Loading…
            </div>
          ) : interactions.length === 0 ? (
            <div className="px-4 py-6 text-xs text-center" style={{ color: "var(--text-muted)" }}>
              No interactions yet
            </div>
          ) : (
            interactions.map((i) => (
              <div key={i.id} className="px-4 py-3.5 border-b" style={{ borderColor: "var(--border-subtle)" }}>
                <div className="text-xs font-medium mb-0.5" style={{ color: "var(--text-primary)" }}>
                  {i.contact.name}
                </div>
                <div className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>
                  {i.subject ?? "—"}
                </div>
                <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                  <Badge label={i.type} variant="muted" size="xs" />
                  {relativeTime(i.occurredAt)} ago
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      {/* Add LP/Co-Investor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div
            className="w-full max-w-lg rounded-lg border overflow-hidden"
            style={{ background: "var(--bg-surface)", borderColor: "var(--border)", maxHeight: "90vh", overflowY: "auto" }}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
              <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Add LP / Co-Investor</span>
              <button onClick={() => setShowAddModal(false)} style={{ color: "var(--text-muted)" }}>
                <X size={16} />
              </button>
            </div>

            {/* Modal form */}
            <div className="px-5 py-4 space-y-4">
              {/* Basic fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>Full Name *</label>
                  <input
                    value={modalForm.name}
                    onChange={(e) => setModalForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Jane Smith"
                    className="w-full rounded px-2.5 py-1.5 text-xs outline-none"
                    style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                  />
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>Company</label>
                  <input
                    value={modalForm.company}
                    onChange={(e) => setModalForm((f) => ({ ...f, company: e.target.value }))}
                    placeholder="Acme Capital"
                    className="w-full rounded px-2.5 py-1.5 text-xs outline-none"
                    style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                  />
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>Title</label>
                  <input
                    value={modalForm.title}
                    onChange={(e) => setModalForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="Managing Partner"
                    className="w-full rounded px-2.5 py-1.5 text-xs outline-none"
                    style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                  />
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>Email</label>
                  <input
                    type="email"
                    value={modalForm.email}
                    onChange={(e) => setModalForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="jane@acme.com"
                    className="w-full rounded px-2.5 py-1.5 text-xs outline-none"
                    style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                  />
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>LinkedIn URL</label>
                  <input
                    type="url"
                    value={modalForm.linkedIn}
                    onChange={(e) => setModalForm((f) => ({ ...f, linkedIn: e.target.value }))}
                    placeholder="https://linkedin.com/in/..."
                    className="w-full rounded px-2.5 py-1.5 text-xs outline-none"
                    style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                  />
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>Contact Type</label>
                  <select
                    value={modalForm.type}
                    onChange={(e) => setModalForm((f) => ({ ...f, type: e.target.value }))}
                    className="w-full rounded px-2.5 py-1.5 text-xs outline-none"
                    style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                  >
                    {["co-investor", "lp", "gp", "advisor", "contact"].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Investor type */}
              <div>
                <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>Investor Type</label>
                <select
                  value={modalForm.investorType}
                  onChange={(e) => setModalForm((f) => ({ ...f, investorType: e.target.value }))}
                  className="w-full rounded px-2.5 py-1.5 text-xs outline-none"
                  style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                >
                  <option value="">— Select investor type —</option>
                  {["lp", "co-investor", "family-office", "vc", "pe", "angel", "strategic"].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Asset classes */}
              <div>
                <label className="text-xs mb-2 block" style={{ color: "var(--text-muted)" }}>Asset Classes</label>
                <div className="flex flex-wrap gap-2">
                  {ASSET_CLASS_OPTIONS.map((cls) => (
                    <label key={cls} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={modalForm.assetClasses.includes(cls)}
                        onChange={() => toggleAssetClass(cls)}
                        className="rounded"
                        style={{ accentColor: "var(--accent)" }}
                      />
                      <span className="text-xs capitalize" style={{ color: "var(--text-secondary)" }}>{cls}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Check size */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>Min Check Size ($)</label>
                  <input
                    type="number"
                    value={modalForm.checkSizeMin}
                    onChange={(e) => setModalForm((f) => ({ ...f, checkSizeMin: e.target.value }))}
                    placeholder="1000000"
                    className="w-full rounded px-2.5 py-1.5 text-xs outline-none"
                    style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                  />
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>Max Check Size ($)</label>
                  <input
                    type="number"
                    value={modalForm.checkSizeMax}
                    onChange={(e) => setModalForm((f) => ({ ...f, checkSizeMax: e.target.value }))}
                    placeholder="10000000"
                    className="w-full rounded px-2.5 py-1.5 text-xs outline-none"
                    style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                  />
                </div>
              </div>

              {/* Portfolio notes */}
              <div>
                <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>Portfolio Notes / Thesis</label>
                <textarea
                  value={modalForm.portfolioNotes}
                  onChange={(e) => setModalForm((f) => ({ ...f, portfolioNotes: e.target.value }))}
                  placeholder="Investment thesis, focus areas, prior deals..."
                  rows={3}
                  className="w-full rounded px-2.5 py-1.5 text-xs outline-none resize-none"
                  style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)", fontFamily: "inherit" }}
                />
              </div>

              {/* General notes */}
              <div>
                <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>Notes</label>
                <textarea
                  value={modalForm.notes}
                  onChange={(e) => setModalForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Any additional notes..."
                  rows={2}
                  className="w-full rounded px-2.5 py-1.5 text-xs outline-none resize-none"
                  style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)", fontFamily: "inherit" }}
                />
              </div>

              {modalError && (
                <div className="text-xs px-3 py-2 rounded border" style={{ color: "#ef4444", borderColor: "rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.05)" }}>
                  {modalError}
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t" style={{ borderColor: "var(--border)" }}>
              <button
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 rounded text-xs"
                style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
              >
                Cancel
              </button>
              <button
                onClick={saveContact}
                disabled={modalSaving}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded text-xs font-medium disabled:opacity-50"
                style={{ background: "var(--accent)", color: "#fff" }}
              >
                {modalSaving ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}
                {modalSaving ? "Saving…" : "Add Contact"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
