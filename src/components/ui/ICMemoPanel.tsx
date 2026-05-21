"use client";

import Badge from "@/components/ui/Badge";
import { CheckCircle2, AlertTriangle, TrendingUp, Users, DollarSign, Globe, Briefcase } from "lucide-react";

interface RiskItem {
  category: string;
  description: string;
  severity?: "high" | "medium" | "low";
}

interface SwotData {
  strengths?: string[];
  weaknesses?: string[];
  opportunities?: string[];
  threats?: string[];
}

interface ICMemoOutput {
  executiveSummary?: string;
  companyOverview?: string;
  marketOpportunity?: string;
  businessModel?: string;
  financials?: string;
  team?: string;
  risks?: RiskItem[];
  opportunities?: string[];
  swot?: SwotData;
  recommendation?: string;
  nextSteps?: string[];
  raw?: string;
}

const severityVariant = (s?: string) =>
  s === "high" ? "danger" : s === "medium" ? "warning" : "muted";

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="p-4 rounded-lg space-y-2" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
      <div className="flex items-center gap-2 mb-1">
        <span style={{ color: "var(--text-muted)" }}>{icon}</span>
        <span className="text-xs font-semibold tracking-wide uppercase" style={{ color: "var(--text-muted)" }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

export default function ICMemoPanel({ output, isMock }: { output: ICMemoOutput; isMock?: boolean }) {
  return (
    <div className="space-y-4">
      {isMock && (
        <div className="text-xs px-3 py-2 rounded" style={{ background: "rgba(245,158,11,0.08)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.18)" }}>
          Demo memo — add an Anthropic API key for real AI output
        </div>
      )}

      {/* Executive Summary — top card */}
      {output.executiveSummary && (
        <div className="p-5 rounded-lg" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
          <p className="text-xs font-semibold tracking-wide uppercase mb-2" style={{ color: "var(--text-muted)" }}>Executive Summary</p>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>{output.executiveSummary}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {output.companyOverview && (
          <Section icon={<Briefcase size={13} />} title="Company Overview">
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{output.companyOverview}</p>
          </Section>
        )}
        {output.marketOpportunity && (
          <Section icon={<Globe size={13} />} title="Market Opportunity">
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{output.marketOpportunity}</p>
          </Section>
        )}
        {output.businessModel && (
          <Section icon={<TrendingUp size={13} />} title="Business Model">
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{output.businessModel}</p>
          </Section>
        )}
        {output.financials && (
          <Section icon={<DollarSign size={13} />} title="Financials">
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{output.financials}</p>
          </Section>
        )}
        {output.team && (
          <Section icon={<Users size={13} />} title="Team">
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{output.team}</p>
          </Section>
        )}
      </div>

      {/* SWOT */}
      {output.swot && (
        <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          <div className="px-4 py-2.5" style={{ background: "var(--bg-elevated)", borderBottom: "1px solid var(--border)" }}>
            <span className="text-xs font-semibold tracking-wide uppercase" style={{ color: "var(--text-muted)" }}>SWOT Analysis</span>
          </div>
          <div className="grid grid-cols-2">
            {[
              { key: "strengths", label: "Strengths", color: "#10b981" },
              { key: "weaknesses", label: "Weaknesses", color: "#f59e0b" },
              { key: "opportunities", label: "Opportunities", color: "#3b82f6" },
              { key: "threats", label: "Threats", color: "#ef4444" },
            ].map(({ key, label, color }, idx) => {
              const items = output.swot?.[key as keyof SwotData] ?? [];
              const isRight = idx % 2 === 1;
              const isBottom = idx >= 2;
              return (
                <div
                  key={key}
                  className="p-4"
                  style={{
                    background: "var(--bg-surface)",
                    borderRight: isRight ? "none" : "1px solid var(--border)",
                    borderTop: isBottom ? "1px solid var(--border)" : "none",
                  }}
                >
                  <div className="text-xs font-semibold mb-2" style={{ color }}>{label}</div>
                  <ul className="space-y-1.5">
                    {(items as string[]).map((item, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
                        <span className="mt-1.5 shrink-0 w-1 h-1 rounded-full" style={{ background: color }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Risks */}
      {output.risks && output.risks.length > 0 && (
        <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: "var(--bg-elevated)", borderBottom: "1px solid var(--border)" }}>
            <AlertTriangle size={13} style={{ color: "#f59e0b" }} />
            <span className="text-xs font-semibold tracking-wide uppercase" style={{ color: "var(--text-muted)" }}>Key Risks</span>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
            {output.risks.map((r, i) => (
              <div key={i} className="px-4 py-3 flex items-start gap-3" style={{ background: "var(--bg-surface)" }}>
                <Badge label={r.category} variant={severityVariant(r.severity)} size="xs" />
                <p className="text-sm flex-1" style={{ color: "var(--text-secondary)" }}>{r.description}</p>
                {r.severity && (
                  <span className="text-xs shrink-0 capitalize" style={{ color: r.severity === "high" ? "#ef4444" : r.severity === "medium" ? "#f59e0b" : "var(--text-muted)" }}>
                    {r.severity}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Opportunities list */}
      {output.opportunities && output.opportunities.length > 0 && (
        <Section icon={<TrendingUp size={13} />} title="Opportunities">
          <ul className="space-y-2">
            {output.opportunities.map((o, i) => (
              <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                <span className="mt-1.5 shrink-0 w-1 h-1 rounded-full" style={{ background: "#10b981" }} />
                {o}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Recommendation */}
      {output.recommendation && (
        <div className="p-4 rounded-lg" style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.18)" }}>
          <p className="text-xs font-semibold tracking-wide uppercase mb-2" style={{ color: "#3b82f6" }}>Recommendation</p>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>{output.recommendation}</p>
        </div>
      )}

      {/* Next Steps */}
      {output.nextSteps && output.nextSteps.length > 0 && (
        <Section icon={<CheckCircle2 size={13} />} title="Next Steps">
          <ul className="space-y-2">
            {output.nextSteps.map((s, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm" style={{ color: "var(--text-secondary)" }}>
                <span className="shrink-0 mt-0.5 w-4 h-4 rounded border text-xs flex items-center justify-center" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Raw fallback */}
      {output.raw && !output.executiveSummary && (
        <pre className="text-xs p-4 rounded-lg overflow-auto" style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
          {output.raw}
        </pre>
      )}
    </div>
  );
}
