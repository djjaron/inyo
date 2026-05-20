"use client";

import { Scale, Upload, FileText, AlertTriangle } from "lucide-react";
import Badge from "@/components/ui/Badge";
import PageHeader from "@/components/ui/PageHeader";

const RECENT_REVIEWS = [
  { doc: "Phalanx Defense — SAFE Note", flags: 3, urgency: "high", date: "2026-05-16", status: "reviewed" },
  { doc: "Arcadia Energy — LP Agreement", flags: 1, urgency: "normal", date: "2026-05-12", status: "reviewed" },
  { doc: "Meridian AI — NDA", flags: 0, urgency: "low", date: "2026-05-10", status: "clean" },
  { doc: "Hartwell Trust — Subscription Docs", flags: 2, urgency: "high", date: "2026-05-08", status: "reviewed" },
];

export default function LegalPage() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Legal"
        subtitle="Document review and compliance flagging"
        actions={
          <button
            className="flex items-center gap-1.5 px-3 py-2 rounded text-sm border transition-colors"
            style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-secondary)" }}
          >
            <Upload size={13} />
            Upload Document
          </button>
        }
      />

      <div className="flex-1 p-8 grid grid-cols-2 gap-6 overflow-auto">
        {/* Drop zone */}
        <div
          className="col-span-2 flex flex-col items-center justify-center rounded-md border border-dashed p-16 text-center grid-bg"
          style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}
        >
          <Scale size={28} className="mb-4" style={{ color: "var(--text-muted)" }} />
          <div className="text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>Drop a document to review</div>
          <div className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
            NDAs, subscription docs, LP agreements, SAFE notes, side letters, loan agreements, employment contracts
          </div>
          <button
            className="px-4 py-2 rounded text-sm"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            Select File
          </button>
          <div className="mt-3 text-xs" style={{ color: "var(--text-muted)" }}>
            Not legal advice. Legal spotting only.
          </div>
        </div>

        {/* Recent reviews */}
        <div className="col-span-2">
          <h2 className="text-xs font-medium tracking-wider uppercase mb-4" style={{ color: "var(--text-muted)" }}>Recent Reviews</h2>
          <div className="rounded-md border overflow-hidden" style={{ borderColor: "var(--border)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border)" }}>
                  {["Document", "Flags", "Urgency", "Reviewed", "Status"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-medium" style={{ color: "var(--text-muted)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {RECENT_REVIEWS.map((r, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-surface)" }}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <FileText size={13} style={{ color: "var(--text-muted)" }} />
                        <span style={{ color: "var(--text-primary)" }}>{r.doc}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {r.flags > 0 ? (
                        <div className="flex items-center gap-1.5 text-sm" style={{ color: r.flags >= 3 ? "#ef4444" : "#f59e0b" }}>
                          <AlertTriangle size={13} />
                          {r.flags}
                        </div>
                      ) : (
                        <span className="text-xs" style={{ color: "#10b981" }}>Clean</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge
                        label={r.urgency}
                        variant={r.urgency === "high" ? "danger" : r.urgency === "normal" ? "warning" : "muted"}
                        size="xs"
                      />
                    </td>
                    <td className="px-5 py-3.5 text-xs" style={{ color: "var(--text-muted)" }}>{r.date}</td>
                    <td className="px-5 py-3.5">
                      <Badge label={r.status} variant={r.status === "clean" ? "success" : "default"} size="xs" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
