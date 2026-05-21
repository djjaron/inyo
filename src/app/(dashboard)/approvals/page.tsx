"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import { useFamilyId } from "@/context/FamilyContext";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Approval {
  id: string;
  familyId: string;
  agentRunId: string | null;
  type: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  reviewedAt: string | null;
  reviewNote: string | null;
  createdAt: string;
}

type FilterTab = "pending" | "approved" | "rejected";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const priorityVariant: Record<string, "danger" | "warning" | "muted"> = {
  urgent: "danger",
  high: "warning",
  normal: "muted",
  low: "muted",
};

const typeVariant: Record<string, "accent" | "warning" | "muted" | "default"> = {
  "deal-advance": "accent",
  transaction: "warning",
  "agent-action": "muted",
  "document-sign": "default",
};

const typeLabel: Record<string, string> = {
  "deal-advance": "Deal Advance",
  transaction: "Transaction",
  "agent-action": "Agent Action",
  "document-sign": "Document Sign",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Inline review form
// ---------------------------------------------------------------------------

interface ReviewFormProps {
  onConfirm: (note: string) => void;
  onCancel: () => void;
  action: "approve" | "reject";
  loading: boolean;
}

function ReviewForm({ onConfirm, onCancel, action, loading }: ReviewFormProps) {
  const [note, setNote] = useState("");
  return (
    <div
      className="mt-3 p-3 rounded border"
      style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
    >
      <textarea
        className="w-full text-xs resize-none rounded p-2 outline-none"
        style={{
          background: "var(--bg-base)",
          border: "1px solid var(--border)",
          color: "var(--text-primary)",
          minHeight: "60px",
        }}
        placeholder={`Optional note for ${action}…`}
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <div className="flex items-center gap-2 mt-2">
        <button
          disabled={loading}
          onClick={() => onConfirm(note)}
          className="px-3 py-1 rounded text-xs font-medium"
          style={
            action === "approve"
              ? { background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" }
              : { background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }
          }
        >
          {loading ? "Saving…" : action === "approve" ? "Confirm Approve" : "Confirm Reject"}
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1 rounded text-xs"
          style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single approval card
// ---------------------------------------------------------------------------

interface ApprovalCardProps {
  approval: Approval;
  isPending: boolean;
  onAction: (id: string, status: "approved" | "rejected", note: string) => Promise<void>;
}

function ApprovalCard({ approval, isPending, onAction }: ApprovalCardProps) {
  const [review, setReview] = useState<"approve" | "reject" | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleConfirm(note: string) {
    if (!review) return;
    setLoading(true);
    await onAction(approval.id, review === "approve" ? "approved" : "rejected", note);
    if (review === "approve") {
      setSuccess("Approval recorded.");
    }
    setLoading(false);
    setReview(null);
  }

  return (
    <div
      className="rounded-md border p-5"
      style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            label={approval.priority.charAt(0).toUpperCase() + approval.priority.slice(1)}
            variant={priorityVariant[approval.priority] ?? "muted"}
            size="xs"
          />
          <Badge
            label={typeLabel[approval.type] ?? approval.type}
            variant={typeVariant[approval.type] ?? "default"}
            size="xs"
          />
        </div>
        <span className="text-xs shrink-0" style={{ color: "var(--text-muted)" }}>
          {formatDate(approval.createdAt)}
        </span>
      </div>

      {/* Title */}
      <div className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
        {approval.title}
      </div>

      {/* Description */}
      {approval.description && (
        <p
          className="text-xs mb-3 line-clamp-2"
          style={{ color: "var(--text-secondary)" }}
        >
          {approval.description}
        </p>
      )}

      {/* Pending actions */}
      {isPending && !success && (
        <>
          {review === null && (
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={() => setReview("approve")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium"
                style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}
              >
                <CheckCircle2 size={11} /> Approve
              </button>
              <button
                onClick={() => setReview("reject")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium"
                style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}
              >
                <XCircle size={11} /> Reject
              </button>
            </div>
          )}
          {review !== null && (
            <ReviewForm
              action={review}
              loading={loading}
              onConfirm={handleConfirm}
              onCancel={() => setReview(null)}
            />
          )}
        </>
      )}

      {/* Success flash */}
      {success && (
        <div
          className="mt-3 text-xs px-3 py-1.5 rounded"
          style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}
        >
          {success}
        </div>
      )}

      {/* Reviewed state (approved/rejected) */}
      {!isPending && (
        <div className="flex items-center gap-3 mt-3 flex-wrap">
          <Badge
            label={approval.status.charAt(0).toUpperCase() + approval.status.slice(1)}
            variant={approval.status === "approved" ? "success" : "danger"}
            size="xs"
          />
          {approval.reviewedAt && (
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              Reviewed {formatDate(approval.reviewedAt)}
            </span>
          )}
          {approval.reviewNote && (
            <span
              className="text-xs italic"
              style={{ color: "var(--text-secondary)" }}
            >
              &ldquo;{approval.reviewNote}&rdquo;
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ApprovalsPage() {
  const familyId = useFamilyId();
  const [filter, setFilter] = useState<FilterTab>("pending");
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);

  const fetchApprovals = useCallback(async () => {
    if (!familyId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/approvals?familyId=${familyId}&status=${filter}`);
      const json = await res.json();
      setApprovals(json.approvals ?? []);
      setIsMock(!!json._mock);
    } catch {
      setApprovals([]);
    } finally {
      setLoading(false);
    }
  }, [familyId, filter]);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  // Also fire once without familyId check (for demo/mock path)
  useEffect(() => {
    if (!familyId) {
      setLoading(false);
    }
  }, [familyId]);

  async function handleAction(id: string, status: "approved" | "rejected", reviewNote: string) {
    // Optimistic: remove from list immediately for pending tab
    setApprovals((prev) => prev.filter((a) => a.id !== id));

    try {
      await fetch(`/api/approvals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reviewNote: reviewNote || undefined }),
      });
    } catch {
      // ignore — we already optimistically removed from list
    }
  }

  const tabs: FilterTab[] = ["pending", "approved", "rejected"];
  const pendingCount = filter === "pending" ? approvals.length : null;

  return (
    <div className="flex flex-col min-h-full" style={{ background: "var(--bg-base)" }}>
      <PageHeader
        title="Approvals"
        subtitle={
          pendingCount !== null
            ? `${pendingCount} pending approval${pendingCount === 1 ? "" : "s"}`
            : undefined
        }
        actions={
          isMock ? (
            <span
              className="text-xs px-2 py-0.5 rounded"
              style={{
                background: "rgba(245,158,11,0.1)",
                color: "#f59e0b",
                border: "1px solid rgba(245,158,11,0.2)",
              }}
            >
              demo data
            </span>
          ) : undefined
        }
      />

      {/* Filter tabs */}
      <div
        className="flex items-center gap-1 px-8 pt-5 pb-0 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        {tabs.map((tab) => {
          const active = filter === tab;
          return (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className="px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors"
              style={
                active
                  ? {
                      color: "var(--accent)",
                      borderColor: "var(--accent)",
                    }
                  : {
                      color: "var(--text-secondary)",
                      borderColor: "transparent",
                    }
              }
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className={`flex-1 px-8 py-6${loading ? " opacity-50 animate-pulse" : ""}`}>
        {!loading && approvals.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <CheckCircle2 size={36} style={{ color: "var(--text-muted)", opacity: 0.4 }} />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {filter === "pending"
                ? "No pending approvals"
                : `No ${filter} approvals`}
            </p>
          </div>
        )}

        {approvals.length > 0 && (
          <div className="flex flex-col gap-3 max-w-2xl">
            {approvals.map((approval) => (
              <ApprovalCard
                key={approval.id}
                approval={approval}
                isPending={filter === "pending"}
                onAction={handleAction}
              />
            ))}
          </div>
        )}

        {loading && approvals.length === 0 && (
          <div className="flex flex-col gap-3 max-w-2xl">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-md border h-28"
                style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
