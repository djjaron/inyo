"use client";

import ScoreRing from "@/components/ui/ScoreRing";
import Badge from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, AlertTriangle, CheckCircle2, Users, BarChart3 } from "lucide-react";

interface DealAnalysisOutput {
  score?: number;
  sector?: string;
  stage?: string;
  capitalAsk?: number;
  valuation?: number;
  summary?: string;
  risks?: string[];
  opportunities?: string[];
  founderBackground?: string;
  comparables?: string[];
  recommendation?: string;
  raw?: string;
}

export default function DealAnalysisPanel({ output, isMock }: { output: DealAnalysisOutput; isMock?: boolean }) {
  const rec = output.recommendation?.toLowerCase();

  const recVariant =
    rec === "pursue" ? "success"
    : rec === "pass" ? "danger"
    : "warning";

  return (
    <div className="space-y-5">
      {isMock && (
        <div className="text-xs px-3 py-2 rounded" style={{ background: "rgba(245,158,11,0.08)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.18)" }}>
          Demo analysis — add an Anthropic API key for real AI output
        </div>
      )}

      {/* Score + Recommendation */}
      <div className="flex items-center gap-6 p-5 rounded-lg" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
        {output.score != null && <ScoreRing score={output.score} size={72} />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1.5">
            <span className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Deal Score</span>
            {output.recommendation && (
              <Badge label={output.recommendation.toUpperCase()} variant={recVariant} size="xs" />
            )}
          </div>
          {output.summary && (
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{output.summary}</p>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      {(output.sector || output.stage || output.capitalAsk || output.valuation) && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Sector", value: output.sector },
            { label: "Stage", value: output.stage?.replace(/-/g, " ") },
            { label: "Capital Ask", value: output.capitalAsk ? formatCurrency(output.capitalAsk) : undefined },
            { label: "Valuation", value: output.valuation ? formatCurrency(output.valuation) : undefined },
          ].filter((m) => m.value).map((m) => (
            <div key={m.label} className="p-3 rounded-lg" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
              <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>{m.label}</div>
              <div className="text-sm font-medium capitalize" style={{ color: "var(--text-primary)" }}>{m.value}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Risks */}
        {output.risks && output.risks.length > 0 && (
          <div className="p-4 rounded-lg" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={14} style={{ color: "#f59e0b" }} />
              <span className="text-xs font-semibold tracking-wide uppercase" style={{ color: "var(--text-muted)" }}>Risks</span>
            </div>
            <ul className="space-y-2">
              {output.risks.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                  <span className="mt-1.5 shrink-0 w-1 h-1 rounded-full" style={{ background: "#f59e0b" }} />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Opportunities */}
        {output.opportunities && output.opportunities.length > 0 && (
          <div className="p-4 rounded-lg" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={14} style={{ color: "#10b981" }} />
              <span className="text-xs font-semibold tracking-wide uppercase" style={{ color: "var(--text-muted)" }}>Opportunities</span>
            </div>
            <ul className="space-y-2">
              {output.opportunities.map((o, i) => (
                <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                  <span className="mt-1.5 shrink-0 w-1 h-1 rounded-full" style={{ background: "#10b981" }} />
                  {o}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Founder Background */}
      {output.founderBackground && (
        <div className="p-4 rounded-lg" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2 mb-2">
            <Users size={14} style={{ color: "var(--text-muted)" }} />
            <span className="text-xs font-semibold tracking-wide uppercase" style={{ color: "var(--text-muted)" }}>Founding Team</span>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{output.founderBackground}</p>
        </div>
      )}

      {/* Comparables */}
      {output.comparables && output.comparables.length > 0 && (
        <div className="p-4 rounded-lg" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={14} style={{ color: "var(--text-muted)" }} />
            <span className="text-xs font-semibold tracking-wide uppercase" style={{ color: "var(--text-muted)" }}>Comparables</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {output.comparables.map((c) => (
              <span key={c} className="px-2.5 py-1 rounded text-xs" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Raw fallback */}
      {output.raw && !output.summary && (
        <pre className="text-xs p-4 rounded-lg overflow-auto" style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
          {output.raw}
        </pre>
      )}
    </div>
  );
}
