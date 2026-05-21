"use client";

import { useState, useEffect } from "react";
import { Search, Clock, Loader2, Sparkles } from "lucide-react";
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
}

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
  const [search, setSearch] = useState("");

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
                  style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
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
    </div>
  );
}
