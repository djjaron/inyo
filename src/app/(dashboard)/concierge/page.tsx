"use client";

import { useState, useEffect } from "react";
import { Home } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import { useFamilyId } from "@/context/FamilyContext";

const REQUEST_TYPES = ["Travel", "Property", "Gifting", "Event", "Other"] as const;
type RequestType = (typeof REQUEST_TYPES)[number];

const TYPE_PLACEHOLDERS: Record<RequestType, string> = {
  Travel: "e.g. Aspen for 6, June 14–16",
  Property: "e.g. Hampton HVAC inspection",
  Gifting: "e.g. Anniversary gift for the Thorntons",
  Event: "e.g. Birthday dinner for 20 at La Bernardin",
  Other: "e.g. Describe your request...",
};

interface ConciergeRequest {
  id: string;
  type: string;
  title: string;
  status: string;
  assignee: string;
  created: string;
}

const INITIAL_REQUESTS: ConciergeRequest[] = [
  { id: "1", type: "travel", title: "Aspen — 6 guests, weekend of June 14", status: "in-progress", assignee: "Concierge Agent", created: "2026-05-19" },
  { id: "2", type: "property", title: "Hampton estate HVAC inspection", status: "pending", assignee: "Vendor: CoolAir Pro", created: "2026-05-17" },
  { id: "3", type: "gifting", title: "Anniversary gift — Patricia & James Thornton", status: "pending", assignee: "Concierge Agent", created: "2026-05-16" },
];

const STATUS_CYCLE: Record<string, string> = {
  pending: "in-progress",
  "in-progress": "completed",
  completed: "cancelled",
  cancelled: "pending",
};

const STATUS_VARIANT: Record<string, "accent" | "success" | "warning" | "muted"> = {
  pending: "muted",
  "in-progress": "accent",
  completed: "success",
  cancelled: "warning",
};

const PROPERTIES = [
  { name: "Manhattan Penthouse", address: "15 Central Park West", status: "occupied", staff: 3 },
  { name: "Hampton Estate", address: "24 Further Lane, East Hampton", status: "vacant", staff: 2 },
  { name: "Aspen Chalet", address: "Mountain Road, Aspen CO", status: "vacant", staff: 0 },
];

const typeVariant: Record<string, "accent" | "success" | "warning" | "muted"> = {
  travel: "accent",
  property: "success",
  gifting: "warning",
  event: "accent",
  other: "muted",
};

interface ChiefOfStaffResult {
  acknowledgment: string;
  actionPlan: string[];
  timeline: string;
  estimatedCost: string;
  requiresApproval: boolean;
  followUpNeeded: string[];
}

export default function ConciergePage() {
  const familyId = useFamilyId();

  const [requests, setRequests] = useState<ConciergeRequest[]>(INITIAL_REQUESTS);
  const [agentIsMock, setAgentIsMock] = useState(false);

  // Form panel state
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<RequestType>("Travel");
  const [formTitle, setFormTitle] = useState("");
  const [formDetails, setFormDetails] = useState("");

  // Agent response state
  const [agentLoading, setAgentLoading] = useState(false);
  const [agentResult, setAgentResult] = useState<ChiefOfStaffResult | null>(null);

  useEffect(() => {
    if (!familyId) return;
    fetch(`/api/concierge/requests?familyId=${encodeURIComponent(familyId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.requests && data.requests.length > 0) {
          setRequests(data.requests.map((r: { id: string; type: string; title: string; status: string; assignee: string; createdAt: string }) => ({
            id: r.id,
            type: r.type,
            title: r.title,
            status: r.status,
            assignee: r.assignee,
            created: r.createdAt.slice(0, 10),
          })));
        }
      })
      .catch(() => {});
  }, [familyId]);

  function openForm() {
    setShowForm(true);
    setFormType("Travel");
    setFormTitle("");
    setFormDetails("");
    setAgentResult(null);
  }

  function closeForm() {
    setShowForm(false);
    setAgentResult(null);
  }

  async function handleSubmit() {
    if (!formTitle.trim()) return;
    setAgentLoading(true);
    setAgentResult(null);
    try {
      const res = await fetch("/api/agents/chief-of-staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyId: familyId ?? "demo",
          request: formTitle,
          type: formType.toLowerCase(),
          context: formDetails ? { details: formDetails } : undefined,
        }),
      });
      const data = await res.json();
      setAgentResult(data.result as ChiefOfStaffResult);
      setAgentIsMock(data.analysis?._mock === true);
    } catch {
      // silently fail
    } finally {
      setAgentLoading(false);
    }
  }

  async function cycleStatus(id: string, currentStatus: string) {
    const nextStatus = STATUS_CYCLE[currentStatus] ?? "pending";
    setRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status: nextStatus } : req))
    );
    try {
      await fetch(`/api/concierge/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
    } catch {
      // silently fail
    }
  }

  async function addToActiveRequests() {
    if (!agentResult) return;
    // Persist to DB (best-effort)
    let persistedId = Date.now().toString();
    try {
      const res = await fetch("/api/concierge/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyId: familyId ?? "demo",
          type: formType.toLowerCase(),
          title: formTitle,
          details: formDetails || null,
        }),
      });
      const data = await res.json();
      if (data.request?.id) persistedId = data.request.id;
    } catch {
      // silently fail
    }
    const newRequest: ConciergeRequest = {
      id: persistedId,
      type: formType.toLowerCase(),
      title: formTitle,
      status: "pending",
      assignee: "Chief of Staff Agent",
      created: new Date().toISOString().slice(0, 10),
    };
    setRequests((prev) => [newRequest, ...prev]);
    closeForm();
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Concierge"
        subtitle="Household operations, travel, and lifestyle management"
        actions={
          <button
            onClick={openForm}
            className="flex items-center gap-1.5 px-3 py-2 rounded text-sm"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            + New Request
          </button>
        }
      />

      <div className="flex-1 p-8 grid grid-cols-3 gap-6 overflow-auto">
        {/* Active requests + form panel */}
        <div className="col-span-2">
          {/* New Request Form Panel */}
          {showForm && (
            <div
              className="rounded-lg border mb-6 p-5 flex flex-col gap-4"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  New Request
                </span>
                <button
                  onClick={closeForm}
                  className="text-xs px-2 py-1 rounded"
                  style={{ color: "var(--text-muted)" }}
                >
                  Cancel
                </button>
              </div>

              {/* Type selector pills */}
              <div>
                <div className="text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>Request Type</div>
                <div className="flex items-center gap-1 flex-wrap">
                  {REQUEST_TYPES.map((t) => (
                    <button
                      key={t}
                      onClick={() => setFormType(t)}
                      className="px-3 py-1.5 rounded text-xs whitespace-nowrap transition-colors"
                      style={
                        formType === t
                          ? { background: "var(--accent)", color: "#fff" }
                          : { color: "var(--text-secondary)", background: "var(--bg-surface)", border: "1px solid var(--border)" }
                      }
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title input */}
              <div>
                <div className="text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>Title</div>
                <input
                  type="text"
                  className="w-full rounded-md border px-4 py-2.5 text-sm focus:outline-none focus:ring-1"
                  placeholder={TYPE_PLACEHOLDERS[formType]}
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  style={{
                    background: "var(--bg-surface)",
                    borderColor: "var(--border)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              {/* Details textarea */}
              <div>
                <div className="text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>Details</div>
                <textarea
                  className="w-full rounded-md border px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-1"
                  rows={4}
                  placeholder="Describe the request in detail..."
                  value={formDetails}
                  onChange={(e) => setFormDetails(e.target.value)}
                  style={{
                    background: "var(--bg-surface)",
                    borderColor: "var(--border)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={agentLoading || !formTitle.trim()}
                className="self-start px-5 py-2 rounded text-sm font-semibold transition-opacity disabled:opacity-40"
                style={{ background: "var(--accent)", color: "#fff" }}
              >
                {agentLoading ? "Chief of Staff is planning..." : "Send to Chief of Staff"}
              </button>

              {/* Agent response card */}
              {agentResult && (
                <div
                  className="rounded-lg border p-5 flex flex-col gap-4 mt-1"
                  style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
                >
                  {/* Acknowledgment */}
                  <div className="flex items-start gap-2">
                    <p className="text-base leading-relaxed font-medium flex-1" style={{ color: "var(--text-primary)" }}>
                      {agentResult.acknowledgment}
                    </p>
                    {agentIsMock && (
                      <span style={{ fontSize: 10, color: "#f59e0b", opacity: 0.7 }}>demo · mock</span>
                    )}
                  </div>

                  {/* Action Plan */}
                  {agentResult.actionPlan?.length > 0 && (
                    <div>
                      <div className="text-xs font-medium tracking-wider uppercase mb-3" style={{ color: "var(--text-muted)" }}>
                        Action Plan
                      </div>
                      <ol className="flex flex-col gap-2">
                        {agentResult.actionPlan.map((step, i) => (
                          <li key={i} className="flex gap-3 text-sm" style={{ color: "var(--text-secondary)" }}>
                            <span
                              className="text-xs font-bold shrink-0 mt-0.5"
                              style={{ color: "var(--accent)", minWidth: "1.25rem" }}
                            >
                              {i + 1}.
                            </span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Timeline / Cost grid */}
                  <div
                    className="grid grid-cols-2 gap-0 rounded-md overflow-hidden border"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <div className="p-4 border-r" style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}>
                      <div className="text-xs font-medium tracking-wider uppercase mb-1" style={{ color: "var(--text-muted)" }}>
                        Timeline
                      </div>
                      <div className="text-sm" style={{ color: "var(--text-primary)" }}>
                        {agentResult.timeline}
                      </div>
                    </div>
                    <div className="p-4" style={{ background: "var(--bg-surface)" }}>
                      <div className="text-xs font-medium tracking-wider uppercase mb-1" style={{ color: "var(--text-muted)" }}>
                        Estimated Cost
                      </div>
                      <div className="text-sm" style={{ color: "var(--text-primary)" }}>
                        {agentResult.estimatedCost}
                      </div>
                    </div>
                  </div>

                  {/* Follow up needed badges */}
                  {agentResult.followUpNeeded?.length > 0 && (
                    <div>
                      <div className="text-xs font-medium tracking-wider uppercase mb-2" style={{ color: "var(--text-muted)" }}>
                        Follow-up Needed
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {agentResult.followUpNeeded.map((item, i) => (
                          <span
                            key={i}
                            className="text-xs px-2.5 py-1 rounded-full border"
                            style={{
                              background: "rgba(255,255,255,0.04)",
                              borderColor: "var(--border)",
                              color: "var(--text-secondary)",
                            }}
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Requires approval badge */}
                  {agentResult.requiresApproval && (
                    <div className="flex items-center gap-2">
                      <Badge label="Requires Approval" variant="warning" size="xs" />
                    </div>
                  )}

                  <button
                    onClick={addToActiveRequests}
                    className="self-start px-5 py-2 rounded text-sm font-semibold"
                    style={{ background: "var(--accent)", color: "#fff" }}
                  >
                    Add to Active Requests
                  </button>
                </div>
              )}
            </div>
          )}

          <h2 className="text-xs font-medium tracking-wider uppercase mb-4" style={{ color: "var(--text-muted)" }}>Active Requests</h2>
          <div className="flex flex-col gap-3 mb-8">
            {requests.map((r) => (
              <div key={r.id} className="p-4 rounded-md border" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>{r.title}</div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>{r.assignee} · {r.created}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge label={r.type} variant={typeVariant[r.type] ?? "muted"} size="xs" />
                    <button
                      onClick={(e) => { e.stopPropagation(); cycleStatus(r.id, r.status); }}
                      title="Click to advance status"
                      style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0 }}
                    >
                      <Badge label={r.status} variant={STATUS_VARIANT[r.status] ?? "muted"} size="xs" />
                    </button>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        setRequests((prev) => prev.filter((req) => req.id !== r.id));
                        try {
                          await fetch(`/api/concierge/requests/${r.id}`, { method: "DELETE" });
                        } catch {
                          // silently fail
                        }
                      }}
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        padding: "2px 4px",
                        color: "var(--text-muted)",
                        fontSize: 14,
                        lineHeight: 1,
                      }}
                      title="Remove request"
                    >
                      ×
                    </button>
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
