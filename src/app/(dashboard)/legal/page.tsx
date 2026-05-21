"use client";

import { useRef, useState, useEffect } from "react";
import { Scale, Upload, FileText, AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import Badge from "@/components/ui/Badge";
import PageHeader from "@/components/ui/PageHeader";
import { useFamilyId } from "@/context/FamilyContext";

// ─── Types ────────────────────────────────────────────────────────────────

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

// ─── Page ─────────────────────────────────────────────────────────────────

export default function LegalPage() {
  const familyId = useFamilyId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [reviewResult, setReviewResult] = useState<LegalReviewResult | null>(null);
  const [reviewedDocName, setReviewedDocName] = useState<string>("");
  const [isMock, setIsMock] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isDragOver, setIsDragOver] = useState(false);
  const [recentDocs, setRecentDocs] = useState<DocumentRow[]>([]);

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

        {/* Drop zone / Loading / Results */}
        {!reviewResult ? (
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
        ) : (
          /* ── Review Results Panel ── */
          <div className="col-span-2 rounded-md border overflow-hidden" style={{ borderColor: "var(--border)" }}>
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4 border-b"
              style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
            >
              <div className="flex items-center gap-3">
                <FileText size={16} style={{ color: "var(--text-muted)" }} />
                <div>
                  <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {reviewedDocName}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {reviewResult.documentType}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge label={`Risk: ${reviewResult.riskLevel}`} variant={riskVariant(reviewResult.riskLevel)} size="sm" />
                {isMock && (
                  <Badge label="mock" variant="muted" size="xs" />
                )}
                <button
                  onClick={resetReview}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs border transition-colors"
                  style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-secondary)" }}
                >
                  <RefreshCw size={11} />
                  Review another document
                </button>
              </div>
            </div>

            <div className="p-6 grid grid-cols-2 gap-6" style={{ background: "var(--bg-base)" }}>

              {/* Summary */}
              <div className="col-span-2">
                <div className="text-xs font-medium tracking-wider uppercase mb-2" style={{ color: "var(--text-muted)" }}>
                  Summary
                </div>
                <div className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>
                  {reviewResult.summary}
                </div>
              </div>

              {/* Flags */}
              <div className="col-span-2">
                <div className="text-xs font-medium tracking-wider uppercase mb-3" style={{ color: "var(--text-muted)" }}>
                  Flagged Clauses ({reviewResult.flags.length})
                </div>
                {reviewResult.flags.length === 0 ? (
                  <div className="text-sm" style={{ color: "#10b981" }}>No issues flagged — document appears clean.</div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {reviewResult.flags.map((flag, i) => (
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

              {/* Key Terms */}
              {Object.keys(reviewResult.keyTerms).length > 0 && (
                <div className="col-span-2">
                  <div className="text-xs font-medium tracking-wider uppercase mb-3" style={{ color: "var(--text-muted)" }}>
                    Key Terms
                  </div>
                  <div
                    className="rounded-md border grid grid-cols-2 overflow-hidden"
                    style={{ borderColor: "var(--border)" }}
                  >
                    {Object.entries(reviewResult.keyTerms).map(([term, value], i) => (
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

              {/* Recommendation */}
              <div className="col-span-2">
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
                  {reviewResult.recommendation}
                </div>
              </div>

            </div>
          </div>
        )}

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
