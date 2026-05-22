"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Scale, Upload, FileText, AlertTriangle, Loader2, Calendar, Pencil } from "lucide-react";
import Badge from "@/components/ui/Badge";
import PageHeader from "@/components/ui/PageHeader";
import ContextPanel from "@/components/ui/ContextPanel";
import { useFamilyId } from "@/context/FamilyContext";
import { usePanel } from "@/context/PanelContext";

// ─── Types ────────────────────────────────────────────────────────────────

type ExpiryStatus = "expired" | "critical" | "warning" | "upcoming";

interface ExpiryDoc {
  id: string;
  name: string;
  type: string;
  dealId: string | null;
  dealName: string | null;
  expiresAt: string;
  daysUntil: number;
  status: ExpiryStatus;
  keyDates: unknown[];
}

interface ExpiryResponse {
  _mock: boolean;
  expiring: ExpiryDoc[];
  recentlyExpired: ExpiryDoc[];
}

interface LegalFlag {
  clause: string;
  issue: string;
  severity: "high" | "medium" | "low";
}

interface LegalReviewResult {
  documentType: string;
  summary: string;
  riskLevel: "low" | "medium" | "high";
  flags: LegalFlag[];
  keyTerms: Record<string, string>;
  recommendation: string;
}

interface DocumentRow {
  id: string;
  name: string;
  type: string;
  createdAt: string;
  flags?: number;
  urgency?: string;
  status?: string;
  _mock?: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function expiryVariant(status: ExpiryStatus): "danger" | "warning" | "muted" {
  if (status === "critical") return "danger";
  if (status === "warning") return "warning";
  return "muted";
}

function expiryBorderColor(status: ExpiryStatus): string {
  if (status === "critical") return "#ef4444";
  if (status === "warning") return "#f59e0b";
  if (status === "expired") return "var(--border)";
  return "var(--border)";
}

function expiryLabel(daysUntil: number): string {
  if (daysUntil < 0) return `Expired ${Math.abs(daysUntil)} day${Math.abs(daysUntil) !== 1 ? "s" : ""} ago`;
  if (daysUntil === 0) return "Expires today";
  return `Expires in ${daysUntil} day${daysUntil !== 1 ? "s" : ""}`;
}

function riskVariant(level: string): "success" | "warning" | "danger" {
  if (level === "low") return "success";
  if (level === "high") return "danger";
  return "warning";
}

function severityColor(severity: string): string {
  if (severity === "high") return "#ef4444";
  if (severity === "medium") return "#f59e0b";
  return "#10b981";
}

function docTypeLabel(type: string): string {
  const map: Record<string, string> = {
    safe: "SAFE Note",
    lpa: "LP Agreement",
    nda: "NDA",
    "pitch-deck": "Pitch Deck",
    "ic-memo": "IC Memo",
    k1: "K-1",
    "tax-doc": "Tax Doc",
    contract: "Contract",
    other: "Document",
  };
  return map[type] ?? type;
}

// ─── Legal Review Panel ───────────────────────────────────────────────────

function LegalReviewPanelContent({
  result,
  docName,
  isMock,
}: {
  result: LegalReviewResult;
  docName: string;
  isMock: boolean;
}) {
  return (
    <ContextPanel
      title={docName}
      subtitle={result.documentType}
      actions={
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Badge label={`Risk: ${result.riskLevel}`} variant={riskVariant(result.riskLevel)} size="sm" />
          {isMock && <Badge label="mock" variant="muted" size="xs" />}
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <div className="text-xs font-medium tracking-wider uppercase mb-2" style={{ color: "var(--text-muted)" }}>
            Summary
          </div>
          <div className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>
            {result.summary}
          </div>
        </div>

        <div>
          <div className="text-xs font-medium tracking-wider uppercase mb-3" style={{ color: "var(--text-muted)" }}>
            Flagged Clauses ({result.flags.length})
          </div>
          {result.flags.length === 0 ? (
            <div className="text-sm" style={{ color: "#10b981" }}>No issues flagged — document appears clean.</div>
          ) : (
            <div className="flex flex-col gap-3">
              {result.flags.map((flag, i) => (
                <div
                  key={i}
                  className="flex gap-3 rounded-md px-4 py-3"
                  style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
                >
                  <div
                    className="mt-1 shrink-0 rounded-full"
                    style={{
                      width: 8,
                      height: 8,
                      background: severityColor(flag.severity),
                      boxShadow: `0 0 4px ${severityColor(flag.severity)}66`,
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium mb-1" style={{ color: "var(--text-primary)" }}>
                      {flag.clause}
                    </div>
                    <div className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      {flag.issue}
                    </div>
                  </div>
                  <div className="shrink-0">
                    <Badge
                      label={flag.severity}
                      variant={flag.severity === "high" ? "danger" : flag.severity === "medium" ? "warning" : "muted"}
                      size="xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {Object.keys(result.keyTerms).length > 0 && (
          <div>
            <div className="text-xs font-medium tracking-wider uppercase mb-3" style={{ color: "var(--text-muted)" }}>
              Key Terms
            </div>
            <div
              className="rounded-md border overflow-hidden"
              style={{ borderColor: "var(--border)" }}
            >
              {Object.entries(result.keyTerms).map(([term, value], i) => (
                <div
                  key={term}
                  className="flex justify-between px-4 py-2.5 text-xs"
                  style={{
                    background: i % 2 === 0 ? "var(--bg-surface)" : "var(--bg-elevated)",
                    borderBottom: "1px solid var(--border-subtle)",
                  }}
                >
                  <span style={{ color: "var(--text-muted)" }}>{term}</span>
                  <span style={{ color: "var(--text-primary)" }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="text-xs font-medium tracking-wider uppercase mb-2" style={{ color: "var(--text-muted)" }}>
            Recommendation
          </div>
          <div
            className="rounded-md px-4 py-3 text-sm leading-relaxed"
            style={{
              background: "rgba(59,130,246,0.07)",
              border: "1px solid rgba(59,130,246,0.2)",
              color: "var(--text-primary)",
            }}
          >
            {result.recommendation}
          </div>
        </div>
      </div>
    </ContextPanel>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default function LegalPage() {
  const familyId = useFamilyId();
  const { openPanel } = usePanel();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [reviewResult, setReviewResult] = useState<LegalReviewResult | null>(null);
  const [reviewedDocName, setReviewedDocName] = useState<string>("");
  const [isMock, setIsMock] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isDragOver, setIsDragOver] = useState(false);
  const [recentDocs, setRecentDocs] = useState<DocumentRow[]>([]);

  // Expiry tracking state
  const [expiryData, setExpiryData] = useState<ExpiryResponse | null>(null);
  const [editingExpiryId, setEditingExpiryId] = useState<string | null>(null);
  const [editingExpiryDate, setEditingExpiryDate] = useState<string>("");

  const loadExpiry = useCallback(() => {
    if (!familyId) return;
    fetch(`/api/documents/expiry?familyId=${familyId}`)
      .then((r) => r.json())
      .then((data: ExpiryResponse) => setExpiryData(data))
      .catch(() => {});
  }, [familyId]);

  useEffect(() => {
    loadExpiry();
  }, [loadExpiry]);

  async function saveExpiryDate(docId: string) {
    if (!editingExpiryDate) return;
    try {
      await fetch(`/api/documents/${docId}/expiry`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expiresAt: editingExpiryDate }),
      });
      setEditingExpiryId(null);
      setEditingExpiryDate("");
      loadExpiry();
    } catch {
      // ignore
    }
  }

  // Load recent documents
  useEffect(() => {
    if (!familyId) return;
    fetch(`/api/documents?familyId=${familyId}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.documents)) setRecentDocs(data.documents);
      })
      .catch(() => {});
  }, [familyId, reviewResult]);

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !familyId) return;

    // Reset input so same file can be re-selected
    e.target.value = "";

    setError(null);
    setReviewResult(null);
    setReviewedDocName(file.name);
    setUploading(true);

    let textContent = "";
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("familyId", familyId);

      const uploadRes = await fetch("/api/upload/document", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({ error: "Upload failed" }));
        setError(err.error ?? "Upload failed");
        setUploading(false);
        return;
      }

      const uploadData = await uploadRes.json();
      textContent = uploadData.document?.textContent ?? "";
    } catch {
      setError("Upload failed. Please try again.");
      setUploading(false);
      return;
    }

    setUploading(false);
    setReviewing(true);

    try {
      const legalRes = await fetch("/api/agents/legal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyId,
          documentContent: textContent,
          documentName: file.name,
        }),
      });

      if (!legalRes.ok) {
        const err = await legalRes.json().catch(() => ({ error: "Review failed" }));
        setError(err.error ?? "Legal review failed");
        setReviewing(false);
        return;
      }

      const legalData = await legalRes.json();
      setReviewResult(legalData.result as LegalReviewResult);
      setIsMock(legalData.analysis?._mock === true);
      openPanel(
        <LegalReviewPanelContent
          result={legalData.result as LegalReviewResult}
          docName={file.name}
          isMock={legalData.analysis?._mock === true}
        />
      );
    } catch {
      setError("Legal review failed. Please try again.");
    } finally {
      setReviewing(false);
    }
  }

  async function handleDrop(file: File) {
    if (!familyId) return;
    setError(null);
    setReviewResult(null);
    setReviewedDocName(file.name);
    setUploading(true);

    let textContent = "";
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("familyId", familyId);
      const uploadRes = await fetch("/api/upload/document", { method: "POST", body: formData });
      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({ error: "Upload failed" }));
        setError(err.error ?? "Upload failed");
        setUploading(false);
        return;
      }
      const uploadData = await uploadRes.json();
      textContent = uploadData.document?.textContent ?? "";
    } catch {
      setError("Upload failed. Please try again.");
      setUploading(false);
      return;
    }

    setUploading(false);
    setReviewing(true);

    try {
      const legalRes = await fetch("/api/agents/legal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ familyId, documentContent: textContent, documentName: file.name }),
      });
      if (!legalRes.ok) {
        const err = await legalRes.json().catch(() => ({ error: "Review failed" }));
        setError(err.error ?? "Legal review failed");
        setReviewing(false);
        return;
      }
      const legalData = await legalRes.json();
      setReviewResult(legalData.result as LegalReviewResult);
      setIsMock(legalData.analysis?._mock === true);
      openPanel(
        <LegalReviewPanelContent
          result={legalData.result as LegalReviewResult}
          docName={file.name}
          isMock={legalData.analysis?._mock === true}
        />
      );
    } catch {
      setError("Legal review failed. Please try again.");
    } finally {
      setReviewing(false);
    }
  }

  function resetReview() {
    setReviewResult(null);
    setReviewedDocName("");
    setError(null);
    setIsMock(false);
  }

  const isLoading = uploading || reviewing;

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Legal"
        subtitle="Document review and compliance flagging"
        actions={
          <button
            onClick={openFilePicker}
            className="flex items-center gap-1.5 px-3 py-2 rounded text-sm border transition-colors"
            style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-secondary)" }}
          >
            <Upload size={13} />
            Upload Document
          </button>
        }
      />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.txt,.md"
        className="hidden"
        onChange={handleFileSelect}
      />

      <div className="flex-1 p-8 grid grid-cols-2 gap-6 overflow-auto">

        {/* ── Expiring Documents ───────────────────────────────────────────── */}
        <div className="col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-medium tracking-wider uppercase" style={{ color: "var(--text-muted)" }}>
              Expiring Documents
            </h2>
            {expiryData?._mock && (
              <Badge label="mock" variant="muted" size="xs" />
            )}
          </div>

          {(!expiryData || (expiryData.expiring.length === 0 && expiryData.recentlyExpired.length === 0)) ? (
            <div
              className="rounded-md border px-5 py-4 text-xs"
              style={{ borderColor: "var(--border)", background: "var(--bg-surface)", color: "var(--text-muted)" }}
            >
              No documents expiring in the next 90 days — your vault is clear.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {[...(expiryData?.expiring ?? []), ...(expiryData?.recentlyExpired ?? [])].map((doc) => (
                <div
                  key={doc.id}
                  className="rounded-md border overflow-hidden"
                  style={{
                    borderColor: "var(--border)",
                    borderLeft: `2px solid ${expiryBorderColor(doc.status)}`,
                    background: doc.status === "expired" ? "var(--bg-base)" : "var(--bg-surface)",
                    opacity: doc.status === "expired" ? 0.65 : 1,
                  }}
                >
                  <div className="px-4 py-3">
                    {/* Row 1: type badge + doc name + pencil */}
                    <div className="flex items-center gap-2">
                      <Badge label={docTypeLabel(doc.type)} variant="muted" size="xs" />
                      <span
                        className="flex-1 text-sm font-medium truncate"
                        style={{ color: doc.status === "expired" ? "var(--text-muted)" : "var(--text-primary)" }}
                      >
                        {doc.name}
                      </span>
                      {/* Set / edit expiry inline */}
                      {!doc.id.startsWith("mock-") && (
                        <button
                          title="Set expiry date"
                          onClick={() => {
                            if (editingExpiryId === doc.id) {
                              setEditingExpiryId(null);
                              setEditingExpiryDate("");
                            } else {
                              setEditingExpiryId(doc.id);
                              setEditingExpiryDate(doc.expiresAt.slice(0, 10));
                            }
                          }}
                          className="flex items-center justify-center rounded p-1 transition-colors shrink-0"
                          style={{
                            background: editingExpiryId === doc.id ? "rgba(59,130,246,0.12)" : "transparent",
                            color: editingExpiryId === doc.id ? "var(--accent)" : "var(--text-muted)",
                            border: "1px solid transparent",
                          }}
                        >
                          <Pencil size={11} />
                        </button>
                      )}
                    </div>

                    {/* Row 2: deal name (left) + expiry status (right) */}
                    <div className="flex items-center justify-between mt-1 gap-4">
                      <div className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                        {doc.dealName ?? ""}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {doc.status !== "expired" && (
                          <AlertTriangle
                            size={12}
                            style={{
                              color: doc.status === "critical" ? "#ef4444" : doc.status === "warning" ? "#f59e0b" : "var(--text-muted)",
                            }}
                          />
                        )}
                        <span
                          className="text-xs"
                          style={{
                            color:
                              doc.status === "critical"
                                ? "#ef4444"
                                : doc.status === "warning"
                                ? "#f59e0b"
                                : "var(--text-muted)",
                          }}
                        >
                          {expiryLabel(doc.daysUntil)}
                        </span>
                        <Badge
                          label={doc.status}
                          variant={expiryVariant(doc.status)}
                          size="xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Inline date editor */}
                  {editingExpiryId === doc.id && (
                    <div
                      className="flex items-center gap-2 px-4 pb-3"
                      style={{ borderTop: "1px solid var(--border-subtle)" }}
                    >
                      <Calendar size={12} style={{ color: "var(--text-muted)" }} />
                      <input
                        type="date"
                        value={editingExpiryDate}
                        onChange={(e) => setEditingExpiryDate(e.target.value)}
                        className="rounded px-2 py-1 text-xs"
                        style={{
                          background: "var(--bg-elevated)",
                          border: "1px solid var(--border)",
                          color: "var(--text-primary)",
                          outline: "none",
                        }}
                      />
                      <button
                        onClick={() => saveExpiryDate(doc.id)}
                        disabled={!editingExpiryDate}
                        className="px-2 py-1 rounded text-xs disabled:opacity-40"
                        style={{ background: "var(--accent)", color: "#fff" }}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => { setEditingExpiryId(null); setEditingExpiryDate(""); }}
                        className="px-2 py-1 rounded text-xs"
                        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Drop zone */}
        <div
          className="col-span-2 flex flex-col items-center justify-center rounded-md border border-dashed p-16 text-center grid-bg"
          style={{
            borderColor: isDragOver && !isLoading ? "var(--accent)" : "var(--border)",
            background: isDragOver && !isLoading ? "rgba(59,130,246,0.06)" : "var(--bg-surface)",
          }}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragEnter={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            if (isLoading || !familyId) return;
            const file = e.dataTransfer.files?.[0];
            if (!file) return;
            handleDrop(file);
          }}
        >
          {isLoading ? (
            <>
              <Loader2
                size={28}
                className="mb-4 animate-spin"
                style={{ color: "var(--accent)" }}
              />
              <div className="text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>
                {uploading ? "Uploading document..." : "Analyzing document..."}
              </div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                {reviewing ? "AI is reviewing clauses and flagging risks" : "Extracting text content"}
              </div>
            </>
          ) : (
            <>
              <Scale size={28} className="mb-4" style={{ color: isDragOver ? "var(--accent)" : "var(--text-muted)" }} />
              <div className="text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>
                {isDragOver ? "Drop to analyze" : "Drop a document to review"}
              </div>
              <div className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
                {isDragOver ? "" : "NDAs, subscription docs, LP agreements, SAFE notes, side letters, loan agreements, employment contracts"}
              </div>
              {error && (
                <div
                  className="text-xs mb-3 px-3 py-2 rounded"
                  style={{ color: "#ef4444", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
                >
                  {error}
                </div>
              )}
              <button
                onClick={openFilePicker}
                disabled={!familyId}
                className="px-4 py-2 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "var(--accent)", color: "#fff" }}
              >
                Select File
              </button>
              <div className="mt-3 text-xs" style={{ color: "var(--text-muted)" }}>
                Not legal advice. Legal spotting only.
              </div>
            </>
          )}
        </div>

        {/* Recent Reviews */}
        <div className="col-span-2">
          <h2 className="text-xs font-medium tracking-wider uppercase mb-4" style={{ color: "var(--text-muted)" }}>
            Recent Reviews
          </h2>
          <div className="rounded-md border overflow-hidden" style={{ borderColor: "var(--border)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border)" }}>
                  {["Document", "Type", "Reviewed"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentDocs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-5 py-6 text-center text-xs"
                      style={{ color: "var(--text-muted)", background: "var(--bg-surface)" }}
                    >
                      No documents reviewed yet.
                    </td>
                  </tr>
                ) : (
                  recentDocs.map((doc, i) => (
                    <tr key={doc.id ?? i} style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-surface)" }}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <FileText size={13} style={{ color: "var(--text-muted)" }} />
                          <span style={{ color: "var(--text-primary)" }}>{doc.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge label={docTypeLabel(doc.type)} variant="muted" size="xs" />
                      </td>
                      <td className="px-5 py-3.5 text-xs" style={{ color: "var(--text-muted)" }}>
                        {typeof doc.createdAt === "string"
                          ? doc.createdAt.slice(0, 10)
                          : new Date(doc.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
