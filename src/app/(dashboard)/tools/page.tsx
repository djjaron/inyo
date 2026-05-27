import Link from "next/link";
import {
  TrendingUp,
  BarChart3,
  PieChart,
  DollarSign,
  Target,
  Users,
  Landmark,
  CalendarDays,
  Award,
  MapPin,
  type LucideIcon,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import PageHeader from "@/components/ui/PageHeader";

// ── Icon map ──────────────────────────────────────────────────────────────────

const ICONS: Record<string, LucideIcon> = {
  TrendingUp,
  BarChart3,
  PieChart,
  DollarSign,
  Target,
  Users,
  Landmark,
  CalendarDays,
  Award,
  MapPin,
};

// ── Agent catalog ─────────────────────────────────────────────────────────────

const AGENTS = [
  {
    id: "unit-economics",
    name: "Unit Economics Analyst",
    category: "Analysis",
    icon: "TrendingUp",
    delivers: "Cohort Analysis Report",
    description:
      "Delivers a cohort-level breakdown of logo churn, gross dollar churn, net dollar retention, and renewal rates. Identifies weak vintage cohorts and retention risks.",
  },
  {
    id: "saas-model",
    name: "SaaS Financial Modeler",
    category: "Modeling",
    icon: "BarChart3",
    delivers: "3-Statement Financial Model",
    description:
      "Builds an IS/BS/CF model from minimal inputs. Outputs fundraising readiness assessment, key SaaS metrics, and 18-month projection.",
  },
  {
    id: "cap-table",
    name: "Cap Table Analyzer",
    category: "Equity",
    icon: "PieChart",
    delivers: "Ownership & Dilution Summary",
    description:
      "Analyzes all security types — SAFEs, convertible notes, shadow securities — and produces a fully diluted ownership table with pro-rata calculations.",
  },
  {
    id: "term-loan",
    name: "Term Loan Modeler",
    category: "Debt",
    icon: "DollarSign",
    delivers: "Amortization Schedule & Cost Analysis",
    description:
      "Models multi-tranche term loans with full monthly amortization schedule, warrant coverage equity cost, and blended effective rate.",
  },
  {
    id: "sales-forecast",
    name: "Sales Forecast Analyst",
    category: "Revenue",
    icon: "Target",
    delivers: "Board-Ready Forecast Report",
    description:
      "Produces a 3-element board forecast: Closed Won, Upside Scenarios, and Pipeline Changes. Includes slippage analysis and quarter-over-quarter variance.",
  },
  {
    id: "sales-quota",
    name: "Sales Quota Planner",
    category: "Revenue",
    icon: "Users",
    delivers: "Capacity Plan & Quota Model",
    description:
      "Builds a ramp-adjusted quota model with attrition-modeled rep capacity, hiring gap analysis, and attainment projections by quarter.",
  },
  {
    id: "cash-management",
    name: "Cash Management Advisor",
    category: "Treasury",
    icon: "Landmark",
    delivers: "Banking Diversification Plan",
    description:
      "Analyzes banking concentration risk, recommends IntraFi ICS sweep account structure, FDIC coverage, and drafts board investment policy statement.",
  },
  {
    id: "venture-stagger",
    name: "Venture Stagger Tracker",
    category: "Planning",
    icon: "CalendarDays",
    delivers: "AOP vs Actuals Board Report",
    description:
      "Produces monthly AOP vs. forecast vs. actuals variance table for board reporting. Identifies forecast drift and revenue gaps early.",
  },
  {
    id: "option-grants",
    name: "Option Grants Advisor",
    category: "Equity",
    icon: "Award",
    delivers: "Grant Policy & Board Approval Package",
    description:
      "Produces a policy matrix by level, option budget analysis (pool remaining vs. 12-month grants needed), and board approval documentation for pending grants.",
  },
  {
    id: "startup-kit",
    name: "Texas Startup Navigator",
    category: "Ecosystem",
    icon: "MapPin",
    delivers: "Personalized TX Ecosystem Guide",
    description:
      "Maps the Texas startup ecosystem to your specific company stage, sector, and goals. Outputs targeted communities, events, media contacts, angel networks, and accelerators.",
  },
] as const;

// ── Category badge variants ───────────────────────────────────────────────────

const categoryVariant: Record<string, "accent" | "success" | "warning" | "muted"> = {
  Analysis: "accent",
  Modeling: "success",
  Equity: "accent",
  Debt: "warning",
  Revenue: "success",
  Treasury: "warning",
  Planning: "muted",
  Ecosystem: "muted",
};

const iconColorMap: Record<string, string> = {
  Analysis: "var(--accent)",
  Modeling: "#10b981",
  Equity: "var(--accent)",
  Debt: "#f59e0b",
  Revenue: "#10b981",
  Treasury: "#f59e0b",
  Planning: "var(--text-muted)",
  Ecosystem: "var(--text-muted)",
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ToolsPage() {
  return (
    <div className="flex flex-col h-full" style={{ background: "var(--bg-base)" }}>
      <PageHeader
        title="Venture Agents"
        subtitle="S3-powered. 10 specialized agents delivering financial models, equity analysis, and startup intelligence."
      />

      {/* Banner */}
      <div
        style={{
          margin: "24px 32px 0",
          padding: "16px 20px",
          borderRadius: "8px",
          background: "rgba(59,130,246,0.06)",
          border: "1px solid rgba(59,130,246,0.15)",
          fontSize: "13px",
          color: "var(--text-secondary)",
          lineHeight: 1.6,
        }}
      >
        <span style={{ color: "var(--accent)", fontWeight: 600 }}>Venture Agents</span>
        {" — "}Powered by S3 methodology. 10 specialized agents delivering financial models,
        equity analysis, and startup intelligence. Each agent is a professional service
        workspace, not a calculator form.
      </div>

      {/* Agent grid */}
      <div
        style={{
          flex: 1,
          padding: "24px 32px",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "16px",
          }}
        >
          {AGENTS.map((agent) => {
            const Icon = ICONS[agent.icon];
            const iconColor = iconColorMap[agent.category] ?? "var(--accent)";

            return (
              <div
                key={agent.id}
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "10px",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                  transition: "border-color 0.15s ease",
                }}
              >
                {/* Icon + category */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 38,
                      height: 38,
                      borderRadius: "8px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {Icon && <Icon size={17} style={{ color: iconColor }} strokeWidth={1.75} />}
                  </div>
                  <Badge
                    label={agent.category}
                    variant={categoryVariant[agent.category] ?? "muted"}
                    size="xs"
                  />
                </div>

                {/* Name */}
                <div>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      marginBottom: "4px",
                      lineHeight: 1.3,
                    }}
                  >
                    {agent.name}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "var(--accent)",
                      fontWeight: 500,
                      marginBottom: "8px",
                    }}
                  >
                    Delivers: {agent.delivers}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--text-muted)",
                      lineHeight: 1.65,
                    }}
                  >
                    {agent.description}
                  </div>
                </div>

                {/* Open Agent button */}
                <Link
                  href={`/tools/${agent.id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    marginTop: "auto",
                    padding: "9px 16px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: 600,
                    background: "var(--accent)",
                    color: "#fff",
                    textDecoration: "none",
                    transition: "opacity 0.15s ease",
                  }}
                >
                  Open Agent →
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
