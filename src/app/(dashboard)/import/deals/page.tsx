"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, Plus, CheckCircle2, AlertCircle, Download, ExternalLink } from "lucide-react";
import Papa from "papaparse";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import Link from "next/link";
import { useFamilyId } from "@/context/FamilyContext";

const STAGES = ["pre-seed", "seed", "series-a", "series-b", "series-c", "growth", "pe", "real-estate", "credit"];
const SOURCES = ["inbound", "network", "broker", "lp-intro"];
const SECTORS = ["Enterprise AI", "Biotech", "Clean Energy", "Defense Tech", "Real Estate", "Credit", "RegTech", "Healthcare IT", "FinTech", "SaaS", "Consumer"];

type Tab = "form" | "csv";

interface FormState {
  company: string; sector: string; stage: string; capitalAsk: string;
  valuation: string; sourceType: string; sourceContact: string; description: string;
}

const EMPTY_FORM: FormState = { company: "", sector: "", stage: "", capitalAsk: "", valuation: "", sourceType: "inbound", sourceContact: "", description: "" };

interface DealRow { company: string; sector?: string; stage?: string; capitalAsk?: string; valuation?: string; sourceType?: string; sourceContact?: string; }

const HEADER_MAP: Record<string, keyof DealRow> = {
  company: "company", "company name": "company", name: "company",
  sector: "sector", industry: "sector",
  stage: "stage", round: "stage",
  ask: "capitalAsk", "capital ask": "capitalAsk", "raise amount": "capitalAsk",
  "pre-money": "valuation", valuation: "valuation", "pre money": "valuation",
  source: "sourceType", "source type": "sourceType",
  "source contact": "sourceContact", referrer: "sourceContact",
};

function downloadTemplate() {
  const csv = "Company,Sector,Stage,Capital Ask,Valuation,Source,Source Contact\nAcme Corp,Enterprise AI,Series A,$5000000,$30000000,network,John Smith\n";
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = "inyo-deals-template.csv";
  a.click();
}

export default function ImportDealsPage() {
  const familyId = useFamilyId();
  const [tab, setTab] = useState<Tab>("form");

  // Form tab state
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formStatus, setFormStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [formMsg, setFormMsg] = useState("");

  // CSV tab state
  const [dragging, setDragging] = useState(false);
  const [rows, setRows] = useState<DealRow[]>([]);
  const [csvStatus, setCsvStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [csvMsg, setCsvMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Form submit
  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    if (!form.company.trim() || !familyId) return;
    setFormStatus("loading");
    try {
      const res = await fetch("/api/import/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ familyId, deal: { ...form, capitalAsk: form.capitalAsk || undefined, valuation: form.valuation || undefined } }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Import failed");
      setFormStatus("success");
      setFormMsg(`${form.company} added to pipeline.`);
      setForm(EMPTY_FORM);
    } catch (err: unknown) {
      setFormStatus("error");
      setFormMsg(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  // CSV parse
  function parseCSV(file: File) {
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: (res) => {
        const headers = res.meta.fields ?? [];
        const headerMapping: Record<string, keyof DealRow> = {};
        for (const h of headers) {
          const mapped = HEADER_MAP[h.toLowerCase().trim()];
          if (mapped) headerMapping[h] = mapped;
        }
        const parsed: DealRow[] = (res.data as Record<string, string>[])
          .map((raw) => {
            const row: Partial<DealRow> = {};
            for (const [csvCol, field] of Object.entries(headerMapping)) {
              const v = raw[csvCol]?.trim();
              if (v) row[field] = v;
            }
            return row as DealRow;
          })
          .filter((r) => r.company);
        setRows(parsed);
        setCsvStatus("idle");
        setCsvMsg("");
      },
    });
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file?.name.endsWith(".csv")) parseCSV(file);
  }, []);

  async function importCSV() {
    if (!rows.length || !familyId) return;
    setCsvStatus("loading");
    try {
      const res = await fetch("/api/import/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ familyId, deals: rows }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Import failed");
      setCsvStatus("success");
      setCsvMsg(`${data.imported} deal${data.imported !== 1 ? "s" : ""} imported successfully.`);
      setRows([]);
    } catch (err: unknown) {
      setCsvStatus("error");
      setCsvMsg(err instanceof Error ? err.message : "Import failed");
    }
  }

  const inputStyle = {
    background: "var(--bg-elevated)",
    border: "1px solid var(--border)",
    color: "var(--text-primary)",
    borderRadius: "4px",
    padding: "8px 12px",
    fontSize: "13px",
    width: "100%",
    outline: "none",
  } as React.CSSProperties;

  const labelStyle = { fontSize: "11px", color: "var(--text-muted)", marginBottom: "6px", display: "block", letterSpacing: "0.04em" } as React.CSSProperties;

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Add Deals"
        subtitle="Manually enter or bulk import via CSV"
        actions={
          <button onClick={downloadTemplate} className="flex items-center gap-1.5 px-3 py-2 rounded text-xs border transition-colors" style={{ borderColor: "var(--border)", color: "var(--text-muted)", background: "var(--bg-elevated)" }}>
            <Download size={12} /> Template
          </button>
        }
      />

      {/* Tab switcher */}
      <div className="flex border-b px-8" style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}>
        {(["form", "csv"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-3 text-sm border-b-2 transition-colors"
            style={{
              borderBottomColor: tab === t ? "var(--accent)" : "transparent",
              color: tab === t ? "var(--text-primary)" : "var(--text-muted)",
            }}
          >
            {t === "form" ? "Add Deal" : "Import CSV"}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-8">
        {/* ── Manual form ── */}
        {tab === "form" && (
          <div className="max-w-2xl">
            {formStatus === "success" && (
              <div className="flex items-center gap-2 p-4 rounded-md border mb-6 text-sm" style={{ background: "rgba(16,185,129,0.08)", borderColor: "rgba(16,185,129,0.2)", color: "#10b981" }}>
                <CheckCircle2 size={15} />
                {formMsg}
                <Link href="/opportunities" className="ml-auto flex items-center gap-1" style={{ color: "var(--accent)" }}>
                  View pipeline <ExternalLink size={12} />
                </Link>
              </div>
            )}
            {formStatus === "error" && (
              <div className="flex items-center gap-2 p-4 rounded-md border mb-6 text-sm" style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.2)", color: "#ef4444" }}>
                <AlertCircle size={15} /> {formMsg}
              </div>
            )}

            <form onSubmit={submitForm}>
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2">
                  <label style={labelStyle}>COMPANY NAME *</label>
                  <input required value={form.company} onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))} style={inputStyle} placeholder="Acme Corp" />
                </div>

                <div>
                  <label style={labelStyle}>SECTOR</label>
                  <input value={form.sector} onChange={(e) => setForm((p) => ({ ...p, sector: e.target.value }))} style={inputStyle} placeholder="Enterprise AI" list="sectors" />
                  <datalist id="sectors">{SECTORS.map((s) => <option key={s} value={s} />)}</datalist>
                </div>

                <div>
                  <label style={labelStyle}>STAGE</label>
                  <select value={form.stage} onChange={(e) => setForm((p) => ({ ...p, stage: e.target.value }))} style={inputStyle}>
                    <option value="">— Select —</option>
                    {STAGES.map((s) => <option key={s} value={s}>{s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>)}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>CAPITAL ASK</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: "var(--text-muted)" }}>$</span>
                    <input type="number" value={form.capitalAsk} onChange={(e) => setForm((p) => ({ ...p, capitalAsk: e.target.value }))} style={{ ...inputStyle, paddingLeft: "24px" }} placeholder="5000000" />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>VALUATION (PRE-MONEY)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: "var(--text-muted)" }}>$</span>
                    <input type="number" value={form.valuation} onChange={(e) => setForm((p) => ({ ...p, valuation: e.target.value }))} style={{ ...inputStyle, paddingLeft: "24px" }} placeholder="30000000" />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>SOURCE</label>
                  <select value={form.sourceType} onChange={(e) => setForm((p) => ({ ...p, sourceType: e.target.value }))} style={inputStyle}>
                    {SOURCES.map((s) => <option key={s} value={s}>{s.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>)}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>SOURCE CONTACT</label>
                  <input value={form.sourceContact} onChange={(e) => setForm((p) => ({ ...p, sourceContact: e.target.value }))} style={inputStyle} placeholder="Name of person who sent this" />
                </div>

                <div className="col-span-2">
                  <label style={labelStyle}>DESCRIPTION</label>
                  <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }} placeholder="Brief description of the opportunity..." />
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="submit"
                  disabled={formStatus === "loading" || !form.company.trim() || !familyId}
                  className="flex items-center gap-2 px-5 py-2.5 rounded text-sm font-medium transition-opacity"
                  style={{ background: "var(--accent)", color: "#fff", opacity: (formStatus === "loading" || !familyId) ? 0.7 : 1 }}
                >
                  <Plus size={14} />
                  {formStatus === "loading" ? "Adding..." : "Add to Pipeline"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── CSV Import ── */}
        {tab === "csv" && (
          <div className="max-w-3xl">
            {csvStatus === "success" && (
              <div className="flex items-center gap-2 p-4 rounded-md border mb-6 text-sm" style={{ background: "rgba(16,185,129,0.08)", borderColor: "rgba(16,185,129,0.2)", color: "#10b981" }}>
                <CheckCircle2 size={15} /> {csvMsg}
                <Link href="/opportunities" className="ml-auto flex items-center gap-1" style={{ color: "var(--accent)" }}>
                  View pipeline <ExternalLink size={12} />
                </Link>
              </div>
            )}
            {csvStatus === "error" && (
              <div className="flex items-center gap-2 p-4 rounded-md border mb-6 text-sm" style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.2)", color: "#ef4444" }}>
                <AlertCircle size={15} /> {csvMsg}
              </div>
            )}

            {!rows.length ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => fileRef.current?.click()}
                className="grid-bg flex flex-col items-center justify-center rounded-md border-2 border-dashed p-16 text-center cursor-pointer transition-colors"
                style={{ borderColor: dragging ? "var(--accent)" : "var(--border)", background: dragging ? "rgba(59,130,246,0.04)" : "var(--bg-surface)" }}
              >
                <Upload size={28} className="mb-4" style={{ color: dragging ? "var(--accent)" : "var(--text-muted)" }} />
                <div className="text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>Drop CSV file here or click to browse</div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>Columns: Company, Sector, Stage, Capital Ask, Valuation, Source, Source Contact</div>
                <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) parseCSV(f); }} />
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Preview</span>
                    <Badge label={`${rows.length} rows`} variant="accent" size="xs" />
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setRows([])} className="px-3 py-1.5 rounded text-xs border" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>Clear</button>
                    <button
                      onClick={importCSV}
                      disabled={csvStatus === "loading" || !familyId}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded text-xs font-medium"
                      style={{ background: "var(--accent)", color: "#fff", opacity: (csvStatus === "loading" || !familyId) ? 0.7 : 1 }}
                    >
                      {csvStatus === "loading" ? "Importing..." : `Import ${rows.length} deal${rows.length !== 1 ? "s" : ""}`}
                    </button>
                  </div>
                </div>

                <div className="rounded-md border overflow-hidden" style={{ borderColor: "var(--border)" }}>
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ background: "var(--bg-elevated)", borderBottom: "1px solid var(--border)" }}>
                        {["Company", "Sector", "Stage", "Ask", "Valuation"].map((h) => (
                          <th key={h} className="text-left px-4 py-2.5 font-medium" style={{ color: "var(--text-muted)" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 10).map((r, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-surface)" }}>
                          <td className="px-4 py-3 font-medium" style={{ color: "var(--text-primary)" }}>{r.company}</td>
                          <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>{r.sector ?? "—"}</td>
                          <td className="px-4 py-3">{r.stage ? <Badge label={r.stage} variant="muted" size="xs" /> : <span style={{ color: "var(--text-muted)" }}>—</span>}</td>
                          <td className="px-4 py-3 font-mono" style={{ color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums" }}>{r.capitalAsk ?? "—"}</td>
                          <td className="px-4 py-3 font-mono" style={{ color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums" }}>{r.valuation ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {rows.length > 10 && (
                  <div className="mt-2 text-xs text-center" style={{ color: "var(--text-muted)" }}>
                    Showing 10 of {rows.length} rows — all will be imported
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
