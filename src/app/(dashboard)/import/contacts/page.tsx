"use client";

import { useState, useRef, useCallback, useId } from "react";
import Papa from "papaparse";
import {
  Upload,
  FileText,
  Download,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronDown,
  Loader2,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import PageHeader from "@/components/ui/PageHeader";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

type ContactType =
  | "founder"
  | "lp"
  | "gp"
  | "attorney"
  | "banker"
  | "advisor"
  | "broker"
  | "family"
  | "contact";

interface ContactRow {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  type: ContactType;
  linkedIn?: string;
  notes?: string;
}

type Step = "upload" | "map" | "preview" | "done";

const CONTACT_FIELDS: Array<{ key: keyof ContactRow; label: string; required?: boolean }> = [
  { key: "name", label: "Name", required: true },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "company", label: "Company" },
  { key: "title", label: "Title" },
  { key: "type", label: "Type" },
  { key: "linkedIn", label: "LinkedIn" },
  { key: "notes", label: "Notes" },
];

const CONTACT_TYPES: ContactType[] = [
  "founder", "lp", "gp", "attorney", "banker", "advisor", "broker", "family", "contact",
];

const TYPE_VARIANT: Record<ContactType, "accent" | "success" | "warning" | "muted" | "default"> = {
  founder: "accent",
  lp: "warning",
  gp: "success",
  attorney: "muted",
  banker: "muted",
  advisor: "default",
  broker: "default",
  family: "success",
  contact: "default",
};

// Auto-mapping: common CSV header names → contact field keys
const AUTO_MAP: Record<string, keyof ContactRow> = {
  name: "name",
  "full name": "name",
  fullname: "name",
  contact: "name",
  "contact name": "name",
  email: "email",
  "email address": "email",
  "e-mail": "email",
  phone: "phone",
  "phone number": "phone",
  mobile: "phone",
  cell: "phone",
  company: "company",
  organization: "company",
  firm: "company",
  employer: "company",
  title: "title",
  "job title": "title",
  role: "title",
  position: "title",
  type: "type",
  category: "type",
  linkedin: "linkedIn",
  "linkedin url": "linkedIn",
  "linkedin profile": "linkedIn",
  url: "linkedIn",
  notes: "notes",
  note: "notes",
  comments: "notes",
  description: "notes",
};

function autoMapHeaders(headers: string[]): Record<string, keyof ContactRow | ""> {
  const result: Record<string, keyof ContactRow | ""> = {};
  for (const h of headers) {
    const normalized = h.trim().toLowerCase();
    result[h] = AUTO_MAP[normalized] ?? "";
  }
  return result;
}

// ─── Template download ────────────────────────────────────────────────────────

function downloadTemplate() {
  const headers = ["Name", "Email", "Phone", "Company", "Title", "Type", "LinkedIn", "Notes"];
  const example = [
    "Sarah Chen",
    "sarah@meridianai.com",
    "+1-415-555-0100",
    "Meridian AI",
    "CEO",
    "founder",
    "https://linkedin.com/in/sarahchen",
    "Met at a16z dinner. Ex-Palantir.",
  ];
  const csv = [headers.join(","), example.join(",")].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "inyo-contacts-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: Step }) {
  const steps: Array<{ id: Step; label: string }> = [
    { id: "upload", label: "Upload" },
    { id: "map", label: "Map Columns" },
    { id: "preview", label: "Preview" },
    { id: "done", label: "Done" },
  ];
  const order: Step[] = ["upload", "map", "preview", "done"];
  const currentIdx = order.indexOf(current);

  return (
    <div className="flex items-center gap-0">
      {steps.map((step, idx) => {
        const isComplete = idx < currentIdx;
        const isActive = idx === currentIdx;
        return (
          <div key={step.id} className="flex items-center">
            <div className="flex items-center gap-2 px-4 py-2">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-mono font-semibold shrink-0"
                style={
                  isComplete
                    ? { background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" }
                    : isActive
                    ? { background: "rgba(59,130,246,0.15)", color: "var(--accent)", border: "1px solid rgba(59,130,246,0.35)" }
                    : { background: "transparent", color: "var(--text-muted)", border: "1px solid var(--border)" }
                }
              >
                {isComplete ? "✓" : idx + 1}
              </div>
              <span
                className="text-xs font-medium"
                style={{ color: isActive ? "var(--text-primary)" : isComplete ? "#10b981" : "var(--text-muted)" }}
              >
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <ArrowRight size={12} style={{ color: "var(--text-muted)" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ImportContactsPage() {
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<string, keyof ContactRow | "">>({});
  const [rowTypes, setRowTypes] = useState<Record<number, ContactType>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ── Parse file ──────────────────────────────────────────────────────────────

  const parseFile = useCallback((file: File) => {
    if (!file.name.endsWith(".csv")) {
      setError("Only .csv files are accepted.");
      return;
    }
    setFileName(file.name);
    setError(null);

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields ?? [];
        const rows = results.data as Record<string, string>[];
        setCsvHeaders(headers);
        setCsvRows(rows);
        setMapping(autoMapHeaders(headers));
        setRowTypes({});
        setStep("map");
      },
      error: (err) => {
        setError(`Parse error: ${err.message}`);
      },
    });
  }, []);

  // ── Drag & drop ─────────────────────────────────────────────────────────────

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) parseFile(file);
    },
    [parseFile]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!dropZoneRef.current?.contains(e.relatedTarget as Node)) {
      setDragging(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
    e.target.value = "";
  };

  // ── Transform rows ──────────────────────────────────────────────────────────

  function buildContacts(): ContactRow[] {
    return csvRows.slice(0, 500).map((row, idx) => {
      const contact: Partial<ContactRow> = {};
      for (const [csvCol, fieldKey] of Object.entries(mapping)) {
        if (!fieldKey) continue;
        const val = row[csvCol]?.trim();
        if (!val) continue;
        if (fieldKey === "type") {
          const normalized = val.toLowerCase() as ContactType;
          contact.type = CONTACT_TYPES.includes(normalized) ? normalized : "contact";
        } else {
          (contact as Record<string, string>)[fieldKey] = val;
        }
      }
      // Row-level type override
      if (rowTypes[idx]) contact.type = rowTypes[idx];
      if (!contact.type) contact.type = "contact";
      if (!contact.name) contact.name = "(unnamed)";
      return contact as ContactRow;
    });
  }

  // ── Import ──────────────────────────────────────────────────────────────────

  async function handleImport() {
    setLoading(true);
    setError(null);
    const contacts = buildContacts();

    try {
      const res = await fetch("/api/import/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ familyId: "family_demo", contacts }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Server error ${res.status}`);
      }

      const data = await res.json();
      setResult({ imported: data.imported ?? contacts.length, skipped: data.skipped ?? 0 });
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setLoading(false);
    }
  }

  // ── Reset ────────────────────────────────────────────────────────────────────

  function reset() {
    setStep("upload");
    setFileName("");
    setCsvHeaders([]);
    setCsvRows([]);
    setMapping({});
    setRowTypes({});
    setResult(null);
    setError(null);
    setLoading(false);
  }

  // ── Preview rows ─────────────────────────────────────────────────────────────

  const previewContacts = buildContacts().slice(0, 10);
  const totalRows = csvRows.length;
  const mappedFieldCount = Object.values(mapping).filter(Boolean).length;

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--bg-base)" }}>
      <PageHeader
        title="Import Contacts"
        subtitle="Upload a CSV file to bulk-import contacts into your network"
        actions={
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-3 py-2 rounded border text-xs font-medium transition-colors"
            style={{
              background: "var(--bg-elevated)",
              borderColor: "var(--border)",
              color: "var(--text-secondary)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--text-primary)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--text-secondary)")
            }
          >
            <Download size={13} />
            Download Template
          </button>
        }
      />

      {/* Step indicator */}
      <div
        className="px-8 py-3 border-b flex items-center justify-between"
        style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}
      >
        <StepIndicator current={step} />
        {step !== "upload" && step !== "done" && (
          <button
            onClick={reset}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded transition-colors"
            style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--text-secondary)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--text-muted)")
            }
          >
            <X size={11} />
            Start over
          </button>
        )}
      </div>

      <div className="flex-1 overflow-auto p-8">
        {/* Error banner */}
        {error && (
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-md border mb-6 text-sm"
            style={{
              background: "rgba(239,68,68,0.08)",
              borderColor: "rgba(239,68,68,0.25)",
              color: "#ef4444",
            }}
          >
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto"
              style={{ color: "rgba(239,68,68,0.6)" }}
            >
              <X size={13} />
            </button>
          </div>
        )}

        {/* ── STEP: UPLOAD ── */}
        {step === "upload" && (
          <div className="max-w-2xl mx-auto">
            <div
              ref={dropZoneRef}
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={cn(
                "grid-bg relative rounded-lg border-2 border-dashed cursor-pointer transition-all duration-150 flex flex-col items-center justify-center py-20 px-8 text-center select-none"
              )}
              style={
                dragging
                  ? {
                      borderColor: "var(--accent)",
                      background: "rgba(59,130,246,0.04)",
                    }
                  : {
                      borderColor: "var(--border)",
                    }
              }
            >
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-5"
                style={{
                  background: dragging
                    ? "rgba(59,130,246,0.12)"
                    : "var(--bg-elevated)",
                  border: "1px solid",
                  borderColor: dragging ? "rgba(59,130,246,0.35)" : "var(--border)",
                  transition: "all 0.15s",
                }}
              >
                <Upload
                  size={22}
                  style={{ color: dragging ? "var(--accent)" : "var(--text-muted)" }}
                />
              </div>

              <p
                className="text-base font-medium mb-1.5"
                style={{ color: dragging ? "var(--accent)" : "var(--text-primary)" }}
              >
                {dragging ? "Release to upload" : "Drop CSV file here or click to browse"}
              </p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Accepts{" "}
                <span className="font-mono" style={{ color: "var(--text-secondary)" }}>
                  .csv
                </span>{" "}
                files up to 500 contacts
              </p>

              <input
                id={fileInputId}
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileInput}
              />
            </div>

            {/* Hint cards */}
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                {
                  label: "Expected columns",
                  value: "Name, Email, Company, Type",
                  note: "Any order — you'll map them next",
                },
                {
                  label: "Contact types",
                  value: "founder · lp · gp · attorney",
                  note: "banker · advisor · broker · family",
                },
                {
                  label: "Duplicates",
                  value: "Skipped automatically",
                  note: "Existing contacts are preserved",
                },
              ].map((card) => (
                <div
                  key={card.label}
                  className="p-4 rounded-md border"
                  style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
                >
                  <div
                    className="text-xs font-mono font-medium mb-2"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {card.label}
                  </div>
                  <div className="text-xs font-medium mb-0.5" style={{ color: "var(--text-primary)" }}>
                    {card.value}
                  </div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {card.note}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP: MAP ── */}
        {step === "map" && (
          <div className="max-w-3xl mx-auto">
            {/* File badge */}
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-md border mb-6"
              style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
            >
              <FileText size={15} style={{ color: "var(--accent)" }} />
              <span className="text-sm font-mono" style={{ color: "var(--text-primary)" }}>
                {fileName}
              </span>
              <Badge label={`${totalRows} rows`} variant="muted" size="xs" />
              <Badge label={`${csvHeaders.length} columns`} variant="muted" size="xs" />
            </div>

            {/* Mapping table */}
            <div
              className="rounded-md border overflow-hidden mb-6"
              style={{ borderColor: "var(--border)" }}
            >
              <div
                className="grid px-5 py-2.5 text-xs font-mono font-semibold border-b"
                style={{
                  gridTemplateColumns: "1fr 40px 1fr",
                  background: "var(--bg-elevated)",
                  borderColor: "var(--border)",
                  color: "var(--text-muted)",
                  letterSpacing: "0.06em",
                }}
              >
                <span>CSV COLUMN</span>
                <span></span>
                <span>CONTACT FIELD</span>
              </div>

              {csvHeaders.map((header) => (
                <div
                  key={header}
                  className="grid items-center px-5 py-3 border-b last:border-b-0"
                  style={{
                    gridTemplateColumns: "1fr 40px 1fr",
                    borderColor: "var(--border)",
                    background: "var(--bg-surface)",
                  }}
                >
                  {/* CSV column name */}
                  <div className="flex items-center gap-2">
                    <span
                      className="font-mono text-xs px-2 py-1 rounded"
                      style={{
                        background: "var(--bg-elevated)",
                        color: "var(--text-primary)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      {header}
                    </span>
                  </div>

                  {/* Arrow */}
                  <div className="flex justify-center">
                    <ArrowRight
                      size={13}
                      style={{
                        color: mapping[header] ? "var(--accent)" : "var(--text-muted)",
                      }}
                    />
                  </div>

                  {/* Dropdown */}
                  <div className="relative">
                    <select
                      value={mapping[header] ?? ""}
                      onChange={(e) =>
                        setMapping((m) => ({
                          ...m,
                          [header]: e.target.value as keyof ContactRow | "",
                        }))
                      }
                      className="w-full appearance-none text-xs px-3 py-2 pr-8 rounded border outline-none"
                      style={{
                        background: "var(--bg-elevated)",
                        borderColor: mapping[header] ? "rgba(59,130,246,0.4)" : "var(--border)",
                        color: mapping[header] ? "var(--text-primary)" : "var(--text-muted)",
                        cursor: "pointer",
                      }}
                    >
                      <option value="">— skip this column —</option>
                      {CONTACT_FIELDS.map((f) => (
                        <option key={f.key} value={f.key}>
                          {f.label}{f.required ? " *" : ""}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={12}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: "var(--text-muted)" }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div
              className="flex items-center justify-between text-xs mb-4"
              style={{ color: "var(--text-muted)" }}
            >
              <span>
                <span style={{ color: "var(--accent)" }}>{mappedFieldCount}</span> of{" "}
                {csvHeaders.length} columns mapped
              </span>
              {!Object.values(mapping).includes("name") && (
                <span style={{ color: "#f59e0b" }}>
                  ⚠ Map a "Name" column to continue
                </span>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setStep("preview")}
                disabled={!Object.values(mapping).includes("name")}
                className="flex items-center gap-2 px-5 py-2.5 rounded text-sm font-medium transition-colors"
                style={
                  Object.values(mapping).includes("name")
                    ? { background: "var(--accent)", color: "#fff" }
                    : { background: "var(--bg-elevated)", color: "var(--text-muted)", cursor: "not-allowed" }
                }
              >
                Preview Data
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP: PREVIEW ── */}
        {step === "preview" && (
          <div className="max-w-5xl mx-auto">
            {/* Summary bar */}
            <div
              className="flex items-center gap-4 px-5 py-3 rounded-md border mb-5"
              style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
            >
              <FileText size={14} style={{ color: "var(--accent)" }} />
              <span className="text-sm font-mono" style={{ color: "var(--text-secondary)" }}>
                {fileName}
              </span>
              <Badge label={`${totalRows} contacts to import`} variant="accent" size="xs" />
              {totalRows > 10 && (
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Showing first 10
                </span>
              )}
            </div>

            {/* Preview table */}
            <div
              className="rounded-md border overflow-hidden mb-5"
              style={{ borderColor: "var(--border)" }}
            >
              {/* Table header */}
              <div
                className="grid text-xs font-mono font-semibold border-b"
                style={{
                  gridTemplateColumns: "2fr 2fr 2fr 1.5fr 1.5fr",
                  background: "var(--bg-elevated)",
                  borderColor: "var(--border)",
                  color: "var(--text-muted)",
                  letterSpacing: "0.06em",
                }}
              >
                {["NAME", "EMAIL", "COMPANY", "TITLE", "TYPE"].map((col) => (
                  <div key={col} className="px-4 py-2.5">
                    {col}
                  </div>
                ))}
              </div>

              {/* Rows */}
              {previewContacts.map((contact, idx) => (
                <div
                  key={idx}
                  className="grid items-center border-b last:border-b-0"
                  style={{
                    gridTemplateColumns: "2fr 2fr 2fr 1.5fr 1.5fr",
                    borderColor: "var(--border)",
                    background: idx % 2 === 0 ? "var(--bg-surface)" : "var(--bg-base)",
                  }}
                >
                  {/* Name */}
                  <div
                    className="px-4 py-3 text-sm font-medium truncate"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {contact.name}
                  </div>
                  {/* Email */}
                  <div
                    className="px-4 py-3 text-xs font-mono truncate"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {contact.email ?? (
                      <span style={{ color: "var(--text-muted)" }}>—</span>
                    )}
                  </div>
                  {/* Company */}
                  <div
                    className="px-4 py-3 text-sm truncate"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {contact.company ?? (
                      <span style={{ color: "var(--text-muted)" }}>—</span>
                    )}
                  </div>
                  {/* Title */}
                  <div
                    className="px-4 py-3 text-xs truncate"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {contact.title ?? "—"}
                  </div>
                  {/* Type dropdown per row */}
                  <div className="px-4 py-3">
                    <div className="relative inline-block w-full max-w-[130px]">
                      <select
                        value={rowTypes[idx] ?? contact.type}
                        onChange={(e) =>
                          setRowTypes((t) => ({
                            ...t,
                            [idx]: e.target.value as ContactType,
                          }))
                        }
                        className="w-full appearance-none text-xs px-2.5 py-1.5 pr-6 rounded border outline-none"
                        style={{
                          background: "var(--bg-elevated)",
                          borderColor: "var(--border)",
                          color: "var(--text-primary)",
                          cursor: "pointer",
                        }}
                      >
                        {CONTACT_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={11}
                        className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ color: "var(--text-muted)" }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Type distribution preview */}
            <div className="flex flex-wrap gap-2 mb-6">
              {Object.entries(
                buildContacts().reduce<Record<string, number>>((acc, c) => {
                  acc[c.type] = (acc[c.type] ?? 0) + 1;
                  return acc;
                }, {})
              ).map(([type, count]) => (
                <Badge
                  key={type}
                  label={`${count} ${type}`}
                  variant={TYPE_VARIANT[type as ContactType] ?? "default"}
                  size="xs"
                />
              ))}
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep("map")}
                className="text-sm px-4 py-2.5 rounded border transition-colors"
                style={{
                  background: "transparent",
                  borderColor: "var(--border)",
                  color: "var(--text-secondary)",
                }}
              >
                ← Back to mapping
              </button>

              <button
                onClick={handleImport}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 rounded text-sm font-medium transition-colors"
                style={
                  loading
                    ? { background: "var(--bg-elevated)", color: "var(--text-muted)", cursor: "not-allowed" }
                    : { background: "var(--accent)", color: "#fff" }
                }
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Importing…
                  </>
                ) : (
                  <>
                    Import {totalRows} Contact{totalRows !== 1 ? "s" : ""}
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP: DONE ── */}
        {step === "done" && result && (
          <div className="max-w-xl mx-auto text-center py-12">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{
                background: "rgba(16,185,129,0.1)",
                border: "1px solid rgba(16,185,129,0.3)",
              }}
            >
              <CheckCircle2 size={28} style={{ color: "#10b981" }} />
            </div>

            <h2
              className="text-2xl font-semibold mb-2"
              style={{ color: "var(--text-primary)" }}
            >
              Import complete
            </h2>
            <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
              Your contacts have been added to the network.
            </p>

            <div
              className="grid grid-cols-2 gap-4 mb-8 text-left rounded-md border p-5"
              style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
            >
              <div>
                <div className="text-xs font-mono mb-1" style={{ color: "var(--text-muted)" }}>
                  IMPORTED
                </div>
                <div className="text-3xl font-semibold tabular-nums" style={{ color: "#10b981" }}>
                  {result.imported}
                </div>
              </div>
              <div>
                <div className="text-xs font-mono mb-1" style={{ color: "var(--text-muted)" }}>
                  SKIPPED (DUPLICATES)
                </div>
                <div className="text-3xl font-semibold tabular-nums" style={{ color: "var(--text-secondary)" }}>
                  {result.skipped}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={reset}
                className="px-5 py-2.5 rounded border text-sm font-medium transition-colors"
                style={{
                  background: "transparent",
                  borderColor: "var(--border)",
                  color: "var(--text-secondary)",
                }}
              >
                Import another file
              </button>
              <a
                href="/relationships"
                className="flex items-center gap-2 px-5 py-2.5 rounded text-sm font-medium"
                style={{ background: "var(--accent)", color: "#fff" }}
              >
                View Contacts
                <ArrowRight size={14} />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
