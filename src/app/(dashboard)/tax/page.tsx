"use client";

import { useRef, useState, useEffect } from "react";
import { Receipt, AlertCircle, FileText, Calendar, TrendingUp, Loader2 } from "lucide-react";
import Badge from "@/components/ui/Badge";
import PageHeader from "@/components/ui/PageHeader";
import { formatCurrency } from "@/lib/utils";
import { useFamilyId } from "@/context/FamilyContext";

interface K1Row {
  entity: string;
  year: number;
  status: string;
  amount: number | null;
  filed: boolean;
}

interface DeadlineRow {
  label: string;
  date: string;
  amount: number | null;
  status: string;
}

const K1S: K1Row[] = [
  { entity: "Hartwell Cayman LP", year: 2025, status: "received", amount: 2_840_000, filed: false },
  { entity: "Arcadia Energy Fund II", year: 2025, status: "pending", amount: null, filed: false },
  { entity: "Meridian AI SPV", year: 2025, status: "received", amount: -120_000, filed: false },
  { entity: "Terrace REIT", year: 2025, status: "received", amount: 380_000, filed: true },
];

const DEADLINES: DeadlineRow[] = [
  { label: "Q2 Federal Estimated Payment", date: "2026-06-16", amount: 485_000, status: "upcoming" },
  { label: "State Tax Returns — CA, NY, DE", date: "2026-10-15", amount: null, status: "upcoming" },
  { label: "Foundation 990-PF Filing", date: "2026-11-15", amount: null, status: "upcoming" },
  { label: "FBAR Foreign Account Report", date: "2026-10-15", amount: null, status: "upcoming" },
];

interface EstimatedLiability {
  federal: number;
  state: number;
  total: number;
}

interface K1SummaryItem {
  entity: string;
  income: number;
  deductions: number;
  status: string;
}

interface TaxResult {
  taxYear?: number;
  summary: string;
  estimatedLiability: EstimatedLiability;
  k1Summary?: K1SummaryItem[];
  actionItems: string[];
  deductionOpportunities: string[];
}

interface TaxAnalysis {
  _mock?: boolean;
}

export default function TaxPage() {
  const familyId = useFamilyId();

  const [k1s, setK1s] = useState<K1Row[]>(K1S);
  const [deadlines, setDeadlines] = useState<DeadlineRow[]>(DEADLINES);

  // Tax intelligence query
  const [taxQuery, setTaxQuery] = useState("");
  const [taxResult, setTaxResult] = useState<TaxResult | null>(null);
  const [taxAnalysis, setTaxAnalysis] = useState<TaxAnalysis | null>(null);
  const [taxLoading, setTaxLoading] = useState(false);
  const [taxResultNote, setTaxResultNote] = useState<string | null>(null);

  // K-1 upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (!familyId) return;
    fetch(`/api/tax/events?familyId=${encodeURIComponent(familyId)}&type=k1`)
      .then((r) => r.json())
      .then((data) => {
        if (data.events?.length) setK1s(data.events.map((e: { id: string; entityName?: string; year?: number; status: string; amount?: number; filed: boolean }) => ({
          entity: e.entityName ?? "Unknown",
          year: e.year ?? new Date().getFullYear() - 1,
          status: e.status,
          amount: e.amount ?? null,
          filed: e.filed,
        })));
      })
      .catch(() => {});
    fetch(`/api/tax/events?familyId=${encodeURIComponent(familyId)}&type=deadline`)
      .then((r) => r.json())
      .then((data) => {
        if (data.events?.length) setDeadlines(data.events.map((e: { label: string; eventDate: string; amount?: number; status: string }) => ({
          label: e.label,
          date: e.eventDate?.slice(0, 10) ?? "",
          amount: e.amount ?? null,
          status: e.status,
        })));
      })
      .catch(() => {});
  }, [familyId]);

  async function handleAnalyze() {
    if (!taxQuery.trim()) return;
    setTaxLoading(true);
    setTaxResult(null);
    setTaxAnalysis(null);
    setTaxResultNote(null);
    try {
      const res = await fetch("/api/agents/tax", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ familyId: familyId ?? "demo", query: taxQuery }),
      });
      const data = await res.json();
      setTaxResult(data.result as TaxResult);
      setTaxAnalysis(data.analysis as TaxAnalysis);
    } catch {
      // silently fail
    } finally {
      setTaxLoading(false);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadLoading(true);
    setUploadError(null);
    setTaxResult(null);
    setTaxAnalysis(null);
    setTaxResultNote("K-1 analysis:");

    try {
      // Step 1: upload document
      const form = new FormData();
      form.append("file", file);
      form.append("familyId", familyId ?? "demo");
      const uploadRes = await fetch("/api/upload/document", {
        method: "POST",
        body: form,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        setUploadError(uploadData.error ?? "Upload failed");
        return;
      }

      const extractedText: string = uploadData.document?.textContent ?? "";

      // Step 2: run tax agent with document content
      const agentRes = await fetch("/api/agents/tax", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyId: familyId ?? "demo",
          documentContent: extractedText,
          context: { type: "k1-review" },
        }),
      });
      const agentData = await agentRes.json();
      setTaxResult(agentData.result as TaxResult);
      setTaxAnalysis(agentData.analysis as TaxAnalysis);
    } catch {
      setUploadError("Something went wrong. Please try again.");
    } finally {
      setUploadLoading(false);
      // Reset input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const isMock = taxAnalysis?._mock === true;

  // suppress unused import warning
  void Receipt;

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Tax"
        subtitle="K-1 tracking, estimated payments, and filing calendar"
      />

      <div className="flex-1 overflow-auto">
        <div className="p-8 flex flex-col gap-8">

          {/* K-1 Tracker */}
          <div>
            <h2 className="text-xs font-medium tracking-wider uppercase mb-4" style={{ color: "var(--text-muted)" }}>
              K-1 Tracker — Tax Year 2025
            </h2>
            <div className="rounded-md border overflow-hidden" style={{ borderColor: "var(--border)" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border)" }}>
                    {["Entity", "Year", "Status", "Income/Loss", "Filed"].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-medium" style={{ color: "var(--text-muted)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {k1s.map((k, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-surface)" }}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <FileText size={13} style={{ color: "var(--text-muted)" }} />
                          <span style={{ color: "var(--text-primary)" }}>{k.entity}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-xs font-mono" style={{ color: "var(--text-muted)" }}>{k.year}</td>
                      <td className="px-5 py-3.5">
                        <Badge
                          label={k.status}
                          variant={k.status === "received" ? "success" : "warning"}
                          size="xs"
                        />
                      </td>
                      <td
                        className="px-5 py-3.5 text-xs font-mono"
                        style={{
                          color: k.amount === null ? "var(--text-muted)" : k.amount > 0 ? "#10b981" : "#ef4444",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {k.amount === null ? "—" : formatCurrency(Math.abs(k.amount))}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge label={k.filed ? "Filed" : "Pending"} variant={k.filed ? "success" : "muted"} size="xs" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* K-1 Document Upload */}
            <div className="mt-4 flex items-center gap-4">
              <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Upload K-1 Document</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadLoading}
                className="px-4 py-1.5 rounded text-xs font-medium border transition-opacity disabled:opacity-40"
                style={{
                  background: "var(--bg-surface)",
                  borderColor: "var(--border)",
                  color: "var(--text-secondary)",
                }}
              >
                {uploadLoading ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 size={11} className="animate-spin" />
                    Uploading…
                  </span>
                ) : (
                  "Choose file (.pdf, .txt)"
                )}
              </button>
              {uploadError && (
                <span className="text-xs flex items-center gap-1" style={{ color: "#ef4444" }}>
                  <AlertCircle size={11} />
                  {uploadError}
                </span>
              )}
            </div>
          </div>

          {/* Tax Intelligence Query Box */}
          <div>
            <h2 className="text-xs font-medium tracking-wider uppercase mb-4" style={{ color: "var(--text-muted)" }}>
              Tax Intelligence
            </h2>
            <div className="flex gap-3">
              <input
                type="text"
                className="flex-1 rounded-md border px-4 py-2.5 text-sm focus:outline-none focus:ring-1"
                placeholder="Ask about your tax position... e.g. 'What's my estimated Q3 liability?' or 'Summarize K-1 income'"
                value={taxQuery}
                onChange={(e) => setTaxQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAnalyze(); }}
                style={{
                  background: "var(--bg-surface)",
                  borderColor: "var(--border)",
                  color: "var(--text-primary)",
                }}
              />
              <button
                onClick={handleAnalyze}
                disabled={taxLoading || !taxQuery.trim()}
                className="px-5 py-2.5 rounded text-sm font-semibold transition-opacity disabled:opacity-40 shrink-0"
                style={{ background: "var(--accent)", color: "#fff" }}
              >
                {taxLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={13} className="animate-spin" />
                    Analyzing…
                  </span>
                ) : (
                  "Analyze"
                )}
              </button>
            </div>

            {/* Results Card */}
            {taxResult && (
              <div
                className="mt-4 rounded-md border p-5 flex flex-col gap-5"
                style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    {taxResultNote && (
                      <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                        {taxResultNote}
                      </span>
                    )}
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>
                      {taxResult.summary}
                    </p>
                  </div>
                  {isMock && (
                    <Badge label="Mock" variant="warning" size="xs" />
                  )}
                </div>

                {/* Estimated Liability Grid */}
                {taxResult.estimatedLiability && (
                  <div>
                    <div className="text-xs font-medium tracking-wider uppercase mb-3" style={{ color: "var(--text-muted)" }}>
                      Estimated Liability {taxResult.taxYear ? `— ${taxResult.taxYear}` : ""}
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div
                        className="rounded px-4 py-3 flex flex-col gap-1"
                        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
                      >
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>Federal</span>
                        <span className="text-sm font-semibold font-mono" style={{ color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                          {formatCurrency(taxResult.estimatedLiability.federal)}
                        </span>
                      </div>
                      <div
                        className="rounded px-4 py-3 flex flex-col gap-1"
                        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
                      >
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>State</span>
                        <span className="text-sm font-semibold font-mono" style={{ color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                          {formatCurrency(taxResult.estimatedLiability.state)}
                        </span>
                      </div>
                      <div
                        className="rounded px-4 py-3 flex flex-col gap-1"
                        style={{ background: "color-mix(in srgb, var(--accent) 12%, var(--bg-surface))", border: "1px solid var(--border)" }}
                      >
                        <span className="text-xs font-medium" style={{ color: "var(--accent)" }}>Total</span>
                        <span className="text-sm font-semibold font-mono" style={{ color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                          {formatCurrency(taxResult.estimatedLiability.total)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Items */}
                {taxResult.actionItems?.length > 0 && (
                  <div>
                    <div className="text-xs font-medium tracking-wider uppercase mb-2" style={{ color: "var(--text-muted)" }}>
                      Action Items
                    </div>
                    <ol className="flex flex-col gap-1.5">
                      {taxResult.actionItems.map((item, i) => (
                        <li key={i} className="text-xs flex gap-2.5 items-start">
                          <span className="font-semibold shrink-0 w-4 text-right" style={{ color: "var(--accent)" }}>
                            {i + 1}.
                          </span>
                          <span style={{ color: "var(--text-secondary)" }}>{item}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Deduction Opportunities */}
                {taxResult.deductionOpportunities?.length > 0 && (
                  <div>
                    <div className="text-xs font-medium tracking-wider uppercase mb-2" style={{ color: "var(--text-muted)" }}>
                      Deduction Opportunities
                    </div>
                    <ul className="flex flex-col gap-1.5">
                      {taxResult.deductionOpportunities.map((opp, i) => (
                        <li key={i} className="text-xs flex gap-2 items-start">
                          <TrendingUp size={12} className="shrink-0 mt-0.5" style={{ color: "#10b981" }} />
                          <span style={{ color: "var(--text-secondary)" }}>{opp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Filing Calendar */}
          <div>
            <h2 className="text-xs font-medium tracking-wider uppercase mb-4" style={{ color: "var(--text-muted)" }}>
              Filing Calendar
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {deadlines.map((d, i) => (
                <div
                  key={i}
                  className="p-4 rounded-md border"
                  style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
                >
                  <div className="text-xs font-medium mb-1" style={{ color: "var(--text-primary)" }}>{d.label}</div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                      <Calendar size={11} />
                      {d.date}
                    </div>
                    {d.amount && (
                      <span
                        className="text-xs font-mono font-medium"
                        style={{ color: "#f59e0b", fontVariantNumeric: "tabular-nums" }}
                      >
                        {formatCurrency(d.amount)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
