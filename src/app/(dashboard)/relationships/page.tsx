"use client";

import { useState, useEffect } from "react";
import { Search, Clock, Loader2, Sparkles, Plus, X, DollarSign, Mail, Phone, Link, ExternalLink, Pencil } from "lucide-react";
import Badge from "@/components/ui/Badge";
import PageHeader from "@/components/ui/PageHeader";
import ContextPanel from "@/components/ui/ContextPanel";
import { useFamilyId } from "@/context/FamilyContext";
import { usePanel } from "@/context/PanelContext";

// ── Types ───────────────────────────────────────────────────────────────────

interface Contact {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
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

// ── ContactDetailPanel ────────────────────────────────────────────────────────

function ContactDetailPanel({ contact, interactions }: { contact: Contact; interactions: Interaction[] }) {
  const [panelTab, setPanelTab] = useState<"overview" | "interactions">("overview");

  const contactInteractions = interactions.filter(
    (i) => i.contact.name === contact.name
  );

  function fmtCheck(min?: number | null, max?: number | null): string {
    if (!min && !max) return "";
    const fmt = (n: number) =>
      n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(0)}M` : `$${(n / 1_000).toFixed(0)}K`;
    if (min && max) return `${fmt(min)}–${fmt(max)}`;
    if (min) return `${fmt(min)}+`;
    return `up to ${fmt(max!)}`;
  }

  return (
    <ContextPanel
      title={contact.name}
      subtitle={[contact.title, contact.company].filter(Boolean).join(", ") || undefined}
      tabs={[
        { id: "overview", label: "Overview" },
        { id: "interactions", label: "Interactions", badge: contactInteractions.length || undefined },
      ]}
      activeTab={panelTab}
      onTabChange={(id) => setPanelTab(id as "overview" | "interactions")}
    >
      {panelTab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 10,
                background: "var(--accent-muted)",
                color: "var(--accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              {initials(contact.name)}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>{contact.name}</div>
              {(contact.title || contact.company) && (
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                  {[contact.title, contact.company].filter(Boolean).join(", ")}
                </div>
              )}
              <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 4 }}>
                <Badge label={contact.type} variant={typeVariant[contact.type] ?? "default"} size="xs" />
                {contact.investorType && (
                  <Badge
                    label={contact.investorType.replace(/-/g, " ")}
                    variant={investorTypeVariant[contact.investorType] ?? "default"}
                    size="xs"
                  />
                )}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {contact.email && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Mail size={12} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                <a
                  href={`mailto:${contact.email}`}
                  style={{ fontSize: 12, color: "var(--accent)", textDecoration: "none" }}
                >
                  {contact.email}
                </a>
              </div>
            )}
            {contact.phone && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Phone size={12} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{contact.phone}</span>
              </div>
            )}
            {contact.linkedIn && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Link size={12} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                <a
                  href={contact.linkedIn}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 12, color: "var(--accent)", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}
                >
                  LinkedIn <ExternalLink size={10} />
                </a>
              </div>
            )}
          </div>

          {(contact.assetClasses ?? []).length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 500, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Asset Classes
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {(contact.assetClasses ?? []).map((cls) => (
                  <span
                    key={cls}
                    style={{
                      fontSize: 11,
                      padding: "2px 8px",
                      borderRadius: 4,
                      background: "var(--bg-elevated)",
                      color: "var(--text-secondary)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {cls}
                  </span>
                ))}
              </div>
            </div>
          )}

          {(contact.checkSizeMin || contact.checkSizeMax) && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 500, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Check Size
              </div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 5 }}>
                <DollarSign size={12} style={{ color: "var(--text-muted)" }} />
                {fmtCheck(contact.checkSizeMin, contact.checkSizeMax)}
              </div>
            </div>
          )}

          {contact.warmPathNotes && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 500, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Warm Path
              </div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>{contact.warmPathNotes}</div>
            </div>
          )}

          {contact.portfolioNotes && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 500, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Portfolio Notes
              </div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>{contact.portfolioNotes}</div>
            </div>
          )}

          {contact.notes && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 500, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Notes
              </div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>{contact.notes}</div>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {contact.lastContactAt && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Last Contact</span>
                <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{formatDate(contact.lastContactAt)}</span>
              </div>
            )}
            {contact.introducedBy && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Introduced By</span>
                <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{contact.introducedBy}</span>
              </div>
            )}
            {contact.lastDealTogether && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Last Deal Together</span>
                <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{contact.lastDealTogether}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {panelTab === "interactions" && (
        <div>
          {contactInteractions.length === 0 ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: 120,
                fontSize: 13,
                color: "var(--text-muted)",
              }}
            >
              No interactions recorded
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {contactInteractions.map((i) => (
                <div
                  key={i.id}
                  style={{
                    padding: "12px 0",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-primary)", marginBottom: 3 }}>
                    {i.subject ?? "—"}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Badge label={i.type} variant="muted" size="xs" />
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{relativeTime(i.occurredAt)} ago</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </ContextPanel>
  );
}

// ── EditContactModal ──────────────────────────────────────────────────────────

interface EditContactForm {
  name: string;
  email: string;
  phone: string;
  company: string;
  title: string;
  type: string;
  linkedIn: string;
  notes: string;
}

const CONTACT_TYPES = ["contact", "founder", "lp", "gp", "attorney", "banker", "advisor", "broker", "family"] as const;

function EditContactModal({
  contact,
  onClose,
  onSuccess,
}: {
  contact: Contact;
  onClose: () => void;
  onSuccess: (updated: Contact) => void;
}) {
  const [form, setForm] = useState<EditContactForm>({
    name: contact.name ?? "",
    email: contact.email ?? "",
    phone: contact.phone ?? "",
    company: contact.company ?? "",
    title: contact.title ?? "",
    type: contact.type ?? "contact",
    linkedIn: contact.linkedIn ?? "",
    notes: contact.notes ?? "",
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
      const res = await fetch(`/api/contacts/${contact.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          company: form.company.trim() || null,
          title: form.title.trim() || null,
          type: form.type,
          linkedIn: form.linkedIn.trim() || null,
          notes: form.notes.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to update contact");
        return;
      }
      const data = await res.json().catch(() => ({}));
      const updated: Contact = data.contact ?? {
        ...contact,
        name: form.name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        company: form.company.trim() || null,
        title: form.title.trim() || null,
        type: form.type,
        linkedIn: form.linkedIn.trim() || null,
        notes: form.notes.trim() || null,
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
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Edit Contact</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{contact.name}</p>
          </div>
          <button onClick={onClose} style={{ color: "var(--text-muted)" }}>
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          <form id="edit-contact-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={labelStyle}>
                Name <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Full name"
                className={inputCls}
                style={inputStyle}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={labelStyle}>Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="jane@example.com"
                  className={inputCls}
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={labelStyle}>Phone</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+1 (555) 000-0000"
                  className={inputCls}
                  style={inputStyle}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={labelStyle}>Company</label>
                <input
                  type="text"
                  value={form.company}
                  onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                  placeholder="Acme Capital"
                  className={inputCls}
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={labelStyle}>Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Managing Partner"
                  className={inputCls}
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={labelStyle}>Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                className={inputCls}
                style={inputStyle}
              >
                {CONTACT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={labelStyle}>LinkedIn URL</label>
              <input
                type="text"
                value={form.linkedIn}
                onChange={(e) => setForm((f) => ({ ...f, linkedIn: e.target.value }))}
                placeholder="https://linkedin.com/in/..."
                className={inputCls}
                style={inputStyle}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={labelStyle}>Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Any notes about this contact"
                rows={3}
                className={inputCls + " resize-none"}
                style={{ ...inputStyle, fontFamily: "inherit" }}
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
            form="edit-contact-form"
            disabled={!isValid || submitting}
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

// ── Component ─────────────────────────────────────────────────────────────────

export default function RelationshipsPage() {
  const familyId = useFamilyId();
  const { openPanel, closePanel, isPanelOpen } = usePanel();

  const [filter, setFilter] = useState("All");
  const [investorFilter, setInvestorFilter] = useState<InvestorFilter>("All");
  const [search, setSearch] = useState("");
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

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

  // Sync selectedContactId with panel open state
  useEffect(() => {
    if (!isPanelOpen) {
      setSelectedContactId(null);
    }
  }, [isPanelOpen]);

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

  function openContactPanel(contact: Contact) {
    if (selectedContactId === contact.id) {
      closePanel();
      setSelectedContactId(null);
      return;
    }
    setSelectedContactId(contact.id);
    openPanel(<ContactDetailPanel contact={contact} interactions={interactions} />);
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
    <>
      {editingContact && (
        <EditContactModal
          contact={editingContact}
          onClose={() => setEditingContact(null)}
          onSuccess={(updated) => {
            setContacts((prev) => prev.map((c) => c.id === updated.id ? updated : c));
          }}
        />
      )}
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
                style={{
                  background: "var(--bg-surface)",
                  borderColor: selectedContactId === c.id ? "var(--accent)" : "var(--border)",
                  borderLeft: selectedContactId === c.id ? "2px solid var(--accent)" : undefined,
                }}
                onClick={() => openContactPanel(c)}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className="w-9 h-9 rounded-md flex items-center justify-center text-sm font-semibold shrink-0"
                    style={{ background: "var(--accent-muted)", color: "var(--accent)" }}
                  >
                    {initials(c.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                      {c.name}
                    </div>
                    <div className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                      {[c.title, c.company].filter(Boolean).join(", ") || "—"}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingContact(c);
                    }}
                    className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    style={{ color: "var(--text-muted)" }}
                    title="Edit contact"
                    aria-label="Edit contact"
                  >
                    <Pencil size={13} />
                  </button>
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
    </>
  );
}
