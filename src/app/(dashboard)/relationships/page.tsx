"use client";

import { useState } from "react";
import { Users, Search, MessageSquare, Clock } from "lucide-react";
import Badge from "@/components/ui/Badge";
import PageHeader from "@/components/ui/PageHeader";

const CONTACTS = [
  { id: "1", name: "Sarah Chen", title: "CEO", company: "Meridian AI", type: "founder", lastContact: "2026-05-15", mutuals: 4, strength: "strong" },
  { id: "2", name: "David Kwon", title: "Managing Partner", company: "Sequoia Capital", type: "gp", lastContact: "2026-04-28", mutuals: 7, strength: "strong" },
  { id: "3", name: "Patricia Mills", title: "Partner", company: "Latham & Watkins", type: "attorney", lastContact: "2026-05-10", mutuals: 2, strength: "warm" },
  { id: "4", name: "James Thornton", title: "Family Principal", company: "Thornton Capital", type: "lp", lastContact: "2026-03-20", mutuals: 3, strength: "warm" },
  { id: "5", name: "Olivia Park", title: "Managing Director", company: "Goldman Sachs", type: "banker", lastContact: "2026-05-01", mutuals: 5, strength: "strong" },
  { id: "6", name: "Carlos Reyes", title: "Founder & CTO", company: "Phalanx Defense", type: "founder", lastContact: "2026-05-18", mutuals: 2, strength: "strong" },
  { id: "7", name: "William Hart III", title: "Principal", company: "Hartwell Family", type: "family", lastContact: "2026-05-20", mutuals: 12, strength: "strong" },
  { id: "8", name: "Nadia Osei", title: "Director", company: "UBS Family Office", type: "advisor", lastContact: "2026-04-15", mutuals: 3, strength: "warm" },
  { id: "9", name: "Marcus Webb", title: "Co-Founder", company: "Meridian AI", type: "founder", lastContact: "2026-05-14", mutuals: 4, strength: "warm" },
];

const INTERACTIONS = [
  { contact: "Carlos Reyes", type: "meeting", subject: "IC presentation — Phalanx Series C", ago: "2d" },
  { contact: "Sarah Chen", type: "email", subject: "Q1 business update + data room access", ago: "5d" },
  { contact: "Olivia Park", type: "call", subject: "Deal flow — 3 new opportunities", ago: "1w" },
  { contact: "Patricia Mills", type: "email", subject: "NDA review for new portfolio deal", ago: "1w" },
  { contact: "David Kwon", type: "meeting", subject: "LP update + co-investment discussion", ago: "3w" },
];

const TYPE_FILTERS = ["All", "Founders", "LPs", "GPs", "Attorneys", "Advisors", "Family"] as const;

const typeMap: Record<string, string> = {
  Founders: "founder", LPs: "lp", GPs: "gp", Attorneys: "attorney", Advisors: "advisor", Family: "family",
};

const typeVariant: Record<string, "accent" | "success" | "warning" | "muted" | "default"> = {
  founder: "accent", gp: "success", lp: "warning", attorney: "muted", advisor: "default", banker: "muted", family: "success",
};

const strengthColor: Record<string, string> = {
  strong: "#10b981",
  warm: "#f59e0b",
  cold: "var(--text-muted)",
};

const interactionIcon: Record<string, typeof MessageSquare> = {
  meeting: MessageSquare,
  email: MessageSquare,
  call: MessageSquare,
};

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

export default function RelationshipsPage() {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = CONTACTS.filter((c) => {
    const typeMatch = filter === "All" || c.type === typeMap[filter];
    const searchMatch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.company.toLowerCase().includes(search.toLowerCase());
    return typeMatch && searchMatch;
  });

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Relationships"
        subtitle={`${CONTACTS.length} contacts in your network`}
        actions={
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

      <div className="flex-1 flex overflow-hidden">
        {/* Contact grid */}
        <div className="flex-1 overflow-auto p-6">
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
                    <div className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{c.name}</div>
                    <div className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{c.title}, {c.company}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Badge label={c.type} variant={typeVariant[c.type]} size="xs" />
                  <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: strengthColor[c.strength] }} />
                    {c.mutuals} mutual
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
                  <Clock size={10} />
                  Last contact: {c.lastContact}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Interaction feed */}
        <div
          className="w-72 shrink-0 border-l overflow-auto"
          style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}
        >
          <div className="px-4 py-3.5 border-b text-sm font-medium" style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}>
            Recent Interactions
          </div>
          {INTERACTIONS.map((i, idx) => (
            <div key={idx} className="px-4 py-3.5 border-b" style={{ borderColor: "var(--border-subtle)" }}>
              <div className="text-xs font-medium mb-0.5" style={{ color: "var(--text-primary)" }}>{i.contact}</div>
              <div className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>{i.subject}</div>
              <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                <Badge label={i.type} variant="muted" size="xs" />
                {i.ago} ago
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
