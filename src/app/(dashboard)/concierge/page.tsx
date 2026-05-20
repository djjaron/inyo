"use client";

import { Briefcase, MapPin, Home, Calendar, Gift } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";

const REQUESTS = [
  { id: "1", type: "travel", title: "Aspen — 6 guests, weekend of June 14", status: "in-progress", assignee: "Concierge Agent", created: "2026-05-19" },
  { id: "2", type: "property", title: "Hampton estate HVAC inspection", status: "scheduled", assignee: "Vendor: CoolAir Pro", created: "2026-05-17" },
  { id: "3", type: "gifting", title: "Anniversary gift — Patricia & James Thornton", status: "pending", assignee: "Concierge Agent", created: "2026-05-16" },
];

const PROPERTIES = [
  { name: "Manhattan Penthouse", address: "15 Central Park West", status: "occupied", staff: 3 },
  { name: "Hampton Estate", address: "24 Further Lane, East Hampton", status: "vacant", staff: 2 },
  { name: "Aspen Chalet", address: "Mountain Road, Aspen CO", status: "vacant", staff: 0 },
];

const typeVariant: Record<string, "accent" | "success" | "warning"> = {
  travel: "accent",
  property: "success",
  gifting: "warning",
};

export default function ConciergePage() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Concierge"
        subtitle="Household operations, travel, and lifestyle management"
        actions={
          <button
            className="flex items-center gap-1.5 px-3 py-2 rounded text-sm"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            + New Request
          </button>
        }
      />

      <div className="flex-1 p-8 grid grid-cols-3 gap-6 overflow-auto">
        {/* Active requests */}
        <div className="col-span-2">
          <h2 className="text-xs font-medium tracking-wider uppercase mb-4" style={{ color: "var(--text-muted)" }}>Active Requests</h2>
          <div className="flex flex-col gap-3 mb-8">
            {REQUESTS.map((r) => (
              <div key={r.id} className="p-4 rounded-md border" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>{r.title}</div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>{r.assignee} · {r.created}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge label={r.type} variant={typeVariant[r.type]} size="xs" />
                    <Badge label={r.status} variant={r.status === "in-progress" ? "accent" : r.status === "scheduled" ? "success" : "muted"} size="xs" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Voice prompt */}
          <div
            className="flex items-center gap-4 p-5 rounded-md border"
            style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
          >
            <div className="text-2xl">🎙</div>
            <div>
              <div className="text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>Voice coming in Phase 3</div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                "Book Aspen for 6 next weekend" — KlawVoice integration planned
              </div>
            </div>
          </div>
        </div>

        {/* Properties */}
        <div>
          <h2 className="text-xs font-medium tracking-wider uppercase mb-4" style={{ color: "var(--text-muted)" }}>Properties</h2>
          <div className="flex flex-col gap-3">
            {PROPERTIES.map((p) => (
              <div key={p.name} className="p-4 rounded-md border" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
                <div className="flex items-start gap-2.5 mb-2">
                  <Home size={14} className="mt-0.5 shrink-0" style={{ color: "var(--text-muted)" }} />
                  <div>
                    <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{p.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{p.address}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Badge label={p.status} variant={p.status === "occupied" ? "success" : "muted"} size="xs" />
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>{p.staff} staff on-site</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
