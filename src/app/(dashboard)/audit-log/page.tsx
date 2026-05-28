"use client";

import { useState, useEffect, useCallback } from "react";
import {
  TrendingUp,
  Users,
  CheckCircle2,
  FileText,
  Building2,
  ClipboardList,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import { useFamilyId } from "@/context/FamilyContext";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuditLogEntry {
  id: string;
  familyId: string | null;
  action: string;
  resourceType: string;
  resourceId: string;
  resourceName: string | null;
  diff: { before?: Record<string, unknown>; after?: Record<string, unknown> } | null;
  performedBy: string | null;
  createdAt: string;
}

type ResourceFilter = "all" | "deal" | "contact" | "approval" | "document";
type ActionFilter = "all" | "create" | "update" | "delete" | "approve" | "reject";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function actionVariant(action: string): "accent" | "muted" | "danger" | "success" | "warning" | "default" {
  switch (action) {
    case "create": return "accent";
    case "update": return "muted";
    case "delete": return "danger";
    case "approve": return "success";
    case "reject": return "danger";
    case "restore": return "warning";
    default: return "default";
  }
}

function actionLabel(action: string): string {
  switch (action) {
    case "create": return "created";
    case "update": return "updated";
    case "delete": return "deleted";
    case "approve": return "approved";
    case "reject": return "rejected";
    case "restore": return "restored";
    default: return action;
  }
}

function ResourceIcon({ type }: { type: string }) {
  const props = { size: 13, style: { color: "var(--text-muted)" } };
  switch (type) {
    case "deal": return <TrendingUp {...props} />;
    case "contact": return <Users {...props} />;
    case "approval": return <CheckCircle2 {...props} />;
    case "document": return <FileText {...props} />;
    case "entity": return <Building2 {...props} />;
    default: return <ClipboardList {...props} />;
  }
}

// ---------------------------------------------------------------------------
// Single log row
// ---------------------------------------------------------------------------

function LogRow({ entry }: { entry: AuditLogEntry }) {
  const [expanded, setExpanded] = useState(false);
  const hasDiff = !!entry.diff && (entry.diff.before || entry.diff.after);

  return (
    <div
      className="border-b last:border-0"
      style={{ borderColor: "var(--border)" }}
    >
      <div className="flex items-start gap-3 px-6 py-3.5 hover:bg-white/[0.02] transition-colors">
        {/* Action badge */}
        <div className="pt-0.5 shrink-0">
          <Badge
            label={entry.action.toUpperCase()}
            variant={actionVariant(entry.action)}
            size="xs"
          />
        </div>

        {/* Icon + text */}
        <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
          <ResourceIcon type={entry.resourceType} />
        </div>

        {/* Main text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm leading-snug" style={{ color: "var(--text-secondary)" }}>
            <span className="font-medium" style={{ color: "var(--text-primary)" }}>
              {entry.performedBy ?? "system"}
            </span>
            {" "}{actionLabel(entry.action)}{" "}
            <span className="font-medium" style={{ color: "var(--text-primary)" }}>
              {entry.resourceName ?? entry.resourceId}
            </span>
          </p>

          {/* Resource type chip */}
          <div className="flex items-center gap-2 mt-1">
            <span
              className="text-[10px] capitalize"
              style={{ color: "var(--text-muted)" }}
            >
              {entry.resourceType}
            </span>
            {hasDiff && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="flex items-center gap-0.5 text-[10px] hover:opacity-70 transition-opacity"
                style={{ color: "var(--accent)" }}
              >
                {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                {expanded ? "hide diff" : "show diff"}
              </button>
            )}
          </div>

          {/* Diff preview */}
          {expanded && hasDiff && (
            <div
              className="mt-2 rounded px-3 py-2 text-xs font-mono"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
            >
              {entry.diff?.before && (
                <div className="mb-1">
                  {Object.entries(entry.diff.before).map(([k, v]) => (
                    <div key={k} style={{ color: "#ef4444" }}>
                      - {k}: {String(v)}
                    </div>
                  ))}
                </div>
              )}
              {entry.diff?.after && (
                <div>
                  {Object.entries(entry.diff.after).map(([k, v]) => (
                    <div key={k} style={{ color: "#10b981" }}>
                      + {k}: {String(v)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Timestamp */}
        <span className="text-xs shrink-0 mt-0.5" style={{ color: "var(--text-muted)" }}>
          {timeAgo(entry.createdAt)}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton rows
// ---------------------------------------------------------------------------

function SkeletonRows() {
  return (
    <div className="animate-pulse">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-start gap-3 px-6 py-3.5 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="rounded w-14 h-4 shrink-0" style={{ background: "var(--bg-elevated)" }} />
          <div className="flex-1 flex flex-col gap-1.5">
            <div className="rounded h-3.5 w-2/3" style={{ background: "var(--bg-elevated)" }} />
            <div className="rounded h-2.5 w-1/4" style={{ background: "var(--bg-elevated)" }} />
          </div>
          <div className="rounded h-3 w-12 shrink-0" style={{ background: "var(--bg-elevated)" }} />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const RESOURCE_TABS: { label: string; value: ResourceFilter }[] = [
  { label: "All", value: "all" },
  { label: "Deals", value: "deal" },
  { label: "Contacts", value: "contact" },
  { label: "Approvals", value: "approval" },
  { label: "Documents", value: "document" },
];

const ACTION_CHIPS: { label: string; value: ActionFilter }[] = [
  { label: "All", value: "all" },
  { label: "Create", value: "create" },
  { label: "Update", value: "update" },
  { label: "Delete", value: "delete" },
  { label: "Approve", value: "approve" },
  { label: "Reject", value: "reject" },
];

export default function AuditLogPage() {
  const familyId = useFamilyId();
  const [resourceFilter, setResourceFilter] = useState<ResourceFilter>("all");
  const [actionFilter, setActionFilter] = useState<ActionFilter>("all");
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (familyId) params.set("familyId", familyId);
    if (resourceFilter !== "all") params.set("resourceType", resourceFilter);
    if (actionFilter !== "all") params.set("action", actionFilter);
    params.set("limit", "50");

    try {
      const res = await fetch(`/api/audit-logs?${params.toString()}`);
      const json = await res.json();
      setLogs(json.logs ?? []);
      setIsMock(!!json._mock);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [familyId, resourceFilter, actionFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="flex flex-col min-h-full" style={{ background: "var(--bg-base)" }}>
      <PageHeader
        title="Audit Log"
        subtitle="Activity trail across deals, contacts, and approvals"
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

      {/* Resource type tabs */}
      <div
        className="flex items-center gap-1 px-8 pt-5 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        {RESOURCE_TABS.map(({ label, value }) => {
          const active = resourceFilter === value;
          return (
            <button
              key={value}
              onClick={() => setResourceFilter(value)}
              className="px-4 py-2 text-sm font-medium border-b-2 transition-colors"
              style={
                active
                  ? { color: "var(--accent)", borderColor: "var(--accent)" }
                  : { color: "var(--text-secondary)", borderColor: "transparent" }
              }
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Action filter chips */}
      <div
        className="flex items-center gap-2 px-8 py-3 border-b"
        style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}
      >
        {ACTION_CHIPS.map(({ label, value }) => {
          const active = actionFilter === value;
          return (
            <button
              key={value}
              onClick={() => setActionFilter(value)}
              className="px-2.5 py-1 rounded text-xs font-medium transition-all"
              style={
                active
                  ? {
                      background: "rgba(59,130,246,0.12)",
                      color: "var(--accent)",
                      border: "1px solid rgba(59,130,246,0.25)",
                    }
                  : {
                      color: "var(--text-muted)",
                      border: "1px solid var(--border)",
                    }
              }
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Timeline */}
      <div className="flex-1 px-0">
        <div
          className="rounded-none"
          style={{ background: "var(--bg-surface)" }}
        >
          {loading && <SkeletonRows />}

          {!loading && logs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <ClipboardList size={36} style={{ color: "var(--text-muted)", opacity: 0.35 }} />
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                No audit log entries found
              </p>
            </div>
          )}

          {!loading && logs.length > 0 && (
            <div>
              {logs.map((entry) => (
                <LogRow key={entry.id} entry={entry} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
