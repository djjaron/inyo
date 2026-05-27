"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Play,
  Copy,
  Check,
  AlertCircle,
  Loader2,
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
import { useFamilyId } from "@/context/FamilyContext";

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

// ── Types ─────────────────────────────────────────────────────────────────────

type FieldType = "text" | "number" | "textarea" | "select";

interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  default?: string;
  options?: string[];
  rows?: number;
}

interface AgentDef {
  id: string;
  name: string;
  category: string;
  icon: string;
  delivers: string;
  description: string;
  fields: FieldDef[];
}

// ── Agent config ──────────────────────────────────────────────────────────────

const AGENT_CONFIG: Record<string, AgentDef> = {
  "unit-economics": {
    id: "unit-economics",
    name: "Unit Economics Analyst",
    category: "Analysis",
    icon: "TrendingUp",
    delivers: "Cohort Analysis Report",
    description:
      "Delivers a cohort-level breakdown of logo churn, gross dollar churn, net dollar retention, and renewal rates. Identifies weak vintage cohorts and retention risks.",
    fields: [
      { key: "company", label: "Company", type: "text", placeholder: "e.g. MedSync" },
      {
        key: "cohortData",
        label: "Cohort Data (JSON)",
        type: "textarea",
        rows: 5,
        default:
          '[{"cohort":"2024-Q1","size":45,"retained_3m":41,"retained_6m":38,"retained_12m":33},{"cohort":"2024-Q2","size":52,"retained_3m":48,"retained_6m":43}]',
      },
      { key: "ndrTarget", label: "NDR Target (%)", type: "number", default: "110" },
    ],
  },
  "saas-model": {
    id: "saas-model",
    name: "SaaS Financial Modeler",
    category: "Modeling",
    icon: "BarChart3",
    delivers: "3-Statement Financial Model",
    description:
      "Builds an IS/BS/CF model from minimal inputs. Outputs fundraising readiness assessment, key SaaS metrics, and 18-month projection.",
    fields: [
      { key: "company", label: "Company", type: "text", placeholder: "e.g. Meridian AI" },
      { key: "startingARR", label: "Starting ARR ($)", type: "number", default: "8400000" },
      { key: "annualGrowthRate", label: "Annual Growth Rate (%)", type: "number", default: "180" },
      { key: "headcount", label: "Headcount", type: "number", default: "42" },
      { key: "monthlyBurn", label: "Monthly Burn ($)", type: "number", default: "820000" },
    ],
  },
  "cap-table": {
    id: "cap-table",
    name: "Cap Table Analyzer",
    category: "Equity",
    icon: "PieChart",
    delivers: "Ownership & Dilution Summary",
    description:
      "Analyzes all security types — SAFEs, convertible notes, shadow securities — and produces a fully diluted ownership table with pro-rata calculations.",
    fields: [
      { key: "company", label: "Company", type: "text", placeholder: "e.g. PayFlow" },
      {
        key: "stage",
        label: "Stage",
        type: "select",
        options: ["Seed", "Series A", "Series B", "Series C"],
      },
      { key: "totalShares", label: "Total Authorized Shares", type: "number", default: "10000000" },
      {
        key: "securitiesData",
        label: "Securities (JSON)",
        type: "textarea",
        rows: 5,
        default:
          '[{"type":"SAFE","investor":"a16z","amount":500000,"cap":8000000},{"type":"Series A","investor":"Sequoia","shares":1500000,"price":2.00}]',
      },
    ],
  },
  "term-loan": {
    id: "term-loan",
    name: "Term Loan Modeler",
    category: "Debt",
    icon: "DollarSign",
    delivers: "Amortization Schedule & Cost Analysis",
    description:
      "Models multi-tranche term loans with full monthly amortization schedule, warrant coverage equity cost, and blended effective rate.",
    fields: [
      { key: "company", label: "Company", type: "text", placeholder: "e.g. Volta Energy" },
      { key: "totalPrincipal", label: "Total Principal ($)", type: "number", default: "5000000" },
      { key: "interestRate", label: "Interest Rate (%)", type: "number", default: "12.5" },
      { key: "termMonths", label: "Term (months)", type: "number", default: "36" },
      { key: "warrantCoverage", label: "Warrant Coverage (%)", type: "number", default: "15" },
      {
        key: "tranchesData",
        label: "Tranches (JSON)",
        type: "textarea",
        rows: 3,
        default:
          '[{"tranche":1,"amount":2500000,"drawDate":"2025-01-01"},{"tranche":2,"amount":2500000,"drawDate":"2025-07-01"}]',
      },
    ],
  },
  "sales-forecast": {
    id: "sales-forecast",
    name: "Sales Forecast Analyst",
    category: "Revenue",
    icon: "Target",
    delivers: "Board-Ready Forecast Report",
    description:
      "Produces a 3-element board forecast: Closed Won, Upside Scenarios, and Pipeline Changes. Includes slippage analysis and quarter-over-quarter variance.",
    fields: [
      { key: "company", label: "Company", type: "text", placeholder: "e.g. Meridian AI" },
      { key: "quarter", label: "Quarter", type: "text", default: "Q3 2025" },
      { key: "closedWon", label: "Closed Won ($)", type: "number", default: "2800000" },
      { key: "upsideScenarios", label: "Upside Scenarios ($)", type: "number", default: "900000" },
      { key: "pipeline", label: "Active Pipeline ($)", type: "number", default: "4200000" },
      {
        key: "slippedDeals",
        label: "Slipped from Last Quarter ($)",
        type: "number",
        default: "340000",
      },
    ],
  },
  "sales-quota": {
    id: "sales-quota",
    name: "Sales Quota Planner",
    category: "Revenue",
    icon: "Users",
    delivers: "Capacity Plan & Quota Model",
    description:
      "Builds a ramp-adjusted quota model with attrition-modeled rep capacity, hiring gap analysis, and attainment projections by quarter.",
    fields: [
      { key: "company", label: "Company", type: "text", placeholder: "e.g. ClearReg" },
      { key: "totalReps", label: "Current AEs", type: "number", default: "12" },
      { key: "quotaPerRep", label: "Quota per Rep ($)", type: "number", default: "800000" },
      { key: "avgRamp", label: "Average Ramp (months)", type: "number", default: "3" },
      { key: "annualAttrition", label: "Annual Attrition (%)", type: "number", default: "25" },
      { key: "plannedHires", label: "Planned Hires (next 6mo)", type: "number", default: "4" },
    ],
  },
  "cash-management": {
    id: "cash-management",
    name: "Cash Management Advisor",
    category: "Treasury",
    icon: "Landmark",
    delivers: "Banking Diversification Plan",
    description:
      "Analyzes banking concentration risk, recommends IntraFi ICS sweep account structure, FDIC coverage, and drafts board investment policy statement.",
    fields: [
      { key: "company", label: "Company", type: "text", placeholder: "e.g. Apex Logistics" },
      { key: "totalCash", label: "Total Cash ($)", type: "number", default: "14200000" },
      {
        key: "bankingData",
        label: "Banking Relationships (JSON)",
        type: "textarea",
        rows: 4,
        default:
          '[{"bank":"SVB","balance":8200000,"type":"operating"},{"bank":"First Republic","balance":6000000,"type":"money-market"}]',
      },
      {
        key: "fdicCoverage",
        label: "FDIC Coverage Needed ($250K limit aware)",
        type: "text",
        default: "yes",
      },
    ],
  },
  "venture-stagger": {
    id: "venture-stagger",
    name: "Venture Stagger Tracker",
    category: "Planning",
    icon: "CalendarDays",
    delivers: "AOP vs Actuals Board Report",
    description:
      "Produces monthly AOP vs. forecast vs. actuals variance table for board reporting. Identifies forecast drift and revenue gaps early.",
    fields: [
      { key: "company", label: "Company", type: "text", placeholder: "e.g. ClearReg" },
      { key: "aopRevenue", label: "Annual AOP Revenue ($)", type: "number", default: "24000000" },
      { key: "currentMonth", label: "Current Month", type: "text", default: "May 2025" },
      {
        key: "monthlyData",
        label: "Monthly Data (JSON)",
        type: "textarea",
        rows: 5,
        default:
          '[{"month":"Jan","aopRevenue":1800000,"forecastRevenue":1750000,"actualRevenue":1820000},{"month":"Feb","aopRevenue":1900000,"forecastRevenue":1850000,"actualRevenue":1790000},{"month":"Mar","aopRevenue":2000000,"forecastRevenue":2100000,"actualRevenue":2050000}]',
      },
    ],
  },
  "option-grants": {
    id: "option-grants",
    name: "Option Grants Advisor",
    category: "Equity",
    icon: "Award",
    delivers: "Grant Policy & Board Approval Package",
    description:
      "Produces a policy matrix by level, option budget analysis (pool remaining vs. 12-month grants needed), and board approval documentation for pending grants.",
    fields: [
      { key: "company", label: "Company", type: "text", placeholder: "e.g. MedSync" },
      {
        key: "totalOptionPool",
        label: "Total Option Pool (shares)",
        type: "number",
        default: "2000000",
      },
      {
        key: "previouslyGranted",
        label: "Previously Granted (shares)",
        type: "number",
        default: "1100000",
      },
      { key: "strikePrice409a", label: "409A Strike Price ($)", type: "number", default: "0.85" },
      {
        key: "grantsData",
        label: "Recent Grants (JSON)",
        type: "textarea",
        rows: 4,
        default:
          '[{"recipient":"VP Engineering","level":"VP","shares":150000,"vestingSchedule":"4yr/1yr cliff"},{"recipient":"Senior Engineer","level":"IC","shares":50000,"vestingSchedule":"4yr/1yr cliff"}]',
      },
    ],
  },
  "startup-kit": {
    id: "startup-kit",
    name: "Texas Startup Navigator",
    category: "Ecosystem",
    icon: "MapPin",
    delivers: "Personalized TX Ecosystem Guide",
    description:
      "Maps the Texas startup ecosystem to your specific company stage, sector, and goals. Outputs targeted communities, events, media contacts, angel networks, and accelerators.",
    fields: [
      { key: "founder", label: "Founder Name", type: "text", placeholder: "e.g. James Park" },
      { key: "company", label: "Company", type: "text", placeholder: "e.g. MedSync" },
      {
        key: "location",
        label: "Location",
        type: "select",
        options: ["Austin", "Houston", "Dallas", "San Antonio", "Other TX"],
      },
      {
        key: "stage",
        label: "Stage",
        type: "select",
        options: ["Pre-Seed", "Seed", "Series A", "Series B"],
      },
      { key: "sector", label: "Sector", type: "text", placeholder: "e.g. healthtech" },
      {
        key: "goals",
        label: "Goals (one per line)",
        type: "textarea",
        rows: 3,
        default: "Find co-investors for next round\nBuild advisory board\nGet press coverage",
      },
    ],
  },
};

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

// ── Build context ─────────────────────────────────────────────────────────────

function buildContext(id: string, values: Record<string, string>): Record<string, unknown> {
  const safe = (key: string) => values[key] ?? "";
  const num = (key: string) => parseFloat(values[key] ?? "0");
  const json = (key: string) => {
    try {
      return JSON.parse(values[key] ?? "[]");
    } catch {
      return [];
    }
  };

  switch (id) {
    case "unit-economics":
      return { company: safe("company"), cohorts: json("cohortData"), ndrTarget: num("ndrTarget") };
    case "saas-model":
      return {
        company: safe("company"),
        startingARR: num("startingARR"),
        annualGrowthRate: num("annualGrowthRate"),
        headcount: num("headcount"),
        monthlyBurn: num("monthlyBurn"),
      };
    case "cap-table":
      return {
        company: safe("company"),
        stage: safe("stage"),
        totalShares: num("totalShares"),
        securities: json("securitiesData"),
      };
    case "term-loan":
      return {
        company: safe("company"),
        totalPrincipal: num("totalPrincipal"),
        interestRate: num("interestRate"),
        termMonths: num("termMonths"),
        warrantCoverage: num("warrantCoverage"),
        tranches: json("tranchesData"),
      };
    case "sales-forecast":
      return {
        company: safe("company"),
        quarter: safe("quarter"),
        closedWon: num("closedWon"),
        upsideScenarios: num("upsideScenarios"),
        pipeline: num("pipeline"),
        slippedDeals: num("slippedDeals"),
      };
    case "sales-quota":
      return {
        company: safe("company"),
        totalReps: num("totalReps"),
        quotaPerRep: num("quotaPerRep"),
        avgRamp: num("avgRamp"),
        annualAttrition: num("annualAttrition"),
        plannedHires: num("plannedHires"),
      };
    case "cash-management":
      return {
        company: safe("company"),
        totalCash: num("totalCash"),
        bankingRelationships: json("bankingData"),
        fdicCoverage: safe("fdicCoverage") === "yes",
      };
    case "venture-stagger":
      return {
        company: safe("company"),
        aopRevenue: num("aopRevenue"),
        currentMonth: safe("currentMonth"),
        monthlyData: json("monthlyData"),
      };
    case "option-grants":
      return {
        company: safe("company"),
        totalOptionPool: num("totalOptionPool"),
        previouslyGranted: num("previouslyGranted"),
        strikePrice409a: num("strikePrice409a"),
        recentGrants: json("grantsData"),
      };
    case "startup-kit":
      return {
        founder: safe("founder"),
        company: safe("company"),
        location: safe("location"),
        stage: safe("stage"),
        sector: safe("sector"),
        goals: safe("goals")
          .split("\n")
          .filter(Boolean),
      };
    default:
      return Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v]));
  }
}

// ── Styles ────────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  background: "var(--bg-base)",
  border: "1px solid var(--border)",
  color: "var(--text-primary)",
  borderRadius: "6px",
  padding: "8px 12px",
  fontSize: "13px",
  width: "100%",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "11px",
  fontWeight: 500,
  color: "var(--text-muted)",
  marginBottom: "4px",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

// ── Output renderer ───────────────────────────────────────────────────────────

function isPrimitive(v: unknown): v is string | number | boolean {
  return typeof v === "string" || typeof v === "number" || typeof v === "boolean";
}

function isObjectOfPrimitives(v: unknown): v is Record<string, string | number | boolean> {
  return (
    typeof v === "object" &&
    v !== null &&
    !Array.isArray(v) &&
    Object.values(v).every(isPrimitive)
  );
}

function isArrayOfObjects(v: unknown): v is Record<string, unknown>[] {
  return Array.isArray(v) && v.length > 0 && typeof v[0] === "object" && v[0] !== null;
}

function isArrayOfStrings(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: "11px",
        fontWeight: 600,
        color: "var(--text-muted)",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        marginBottom: "10px",
      }}
    >
      {children}
    </div>
  );
}

function renderSection(key: string, value: unknown) {
  const title = key
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .trim();

  if (typeof value === "string") {
    return (
      <div
        key={key}
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          padding: "16px",
        }}
      >
        <SectionTitle>{title}</SectionTitle>
        <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.7, margin: 0 }}>
          {value}
        </p>
      </div>
    );
  }

  if (isArrayOfStrings(value)) {
    return (
      <div
        key={key}
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          padding: "16px",
        }}
      >
        <SectionTitle>{title}</SectionTitle>
        <ul style={{ margin: 0, paddingLeft: "16px" }}>
          {value.map((item, i) => (
            <li
              key={i}
              style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.7 }}
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (isObjectOfPrimitives(value)) {
    const entries = Object.entries(value);
    return (
      <div
        key={key}
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          padding: "16px",
        }}
      >
        <SectionTitle>{title}</SectionTitle>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "8px",
          }}
        >
          {entries.map(([k, v]) => (
            <div
              key={k}
              style={{
                background: "var(--bg-base)",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                padding: "10px 12px",
              }}
            >
              <div
                style={{
                  fontSize: "10px",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "3px",
                }}
              >
                {k.replace(/_/g, " ")}
              </div>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                {String(v)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isArrayOfObjects(value)) {
    const cols = Object.keys(value[0] as object);
    return (
      <div
        key={key}
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          padding: "16px",
          overflowX: "auto",
        }}
      >
        <SectionTitle>{title}</SectionTitle>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
          <thead>
            <tr>
              {cols.map((c) => (
                <th
                  key={c}
                  style={{
                    textAlign: "left",
                    padding: "6px 10px",
                    color: "var(--text-muted)",
                    borderBottom: "1px solid var(--border)",
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    fontSize: "10px",
                  }}
                >
                  {c.replace(/_/g, " ")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {value.map((row, i) => (
              <tr key={i}>
                {cols.map((c) => (
                  <td
                    key={c}
                    style={{
                      padding: "7px 10px",
                      color: "var(--text-secondary)",
                      borderBottom: "1px solid var(--border-subtle)",
                    }}
                  >
                    {String((row as Record<string, unknown>)[c] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Fallback: JSON
  return (
    <div
      key={key}
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        padding: "16px",
      }}
    >
      <SectionTitle>{title}</SectionTitle>
      <pre
        style={{
          margin: 0,
          fontSize: "11px",
          color: "var(--text-secondary)",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
          lineHeight: 1.6,
        }}
      >
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}

function renderOutput(
  result: Record<string, unknown>,
  copied: boolean,
  onCopy: () => void
) {
  const SKIP = new Set(["raw", "error", "message"]);
  const SUMMARY_KEYS = ["summary", "executive_summary", "analysis"];

  const summaryKey = SUMMARY_KEYS.find((k) => typeof result[k] === "string");
  const summaryValue = summaryKey ? (result[summaryKey] as string) : null;

  const remaining = Object.entries(result).filter(
    ([k]) => !SKIP.has(k) && k !== summaryKey
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {typeof result.message === "string" && (
        <div
          style={{
            background: "rgba(59,130,246,0.08)",
            border: "1px solid rgba(59,130,246,0.2)",
            borderRadius: "8px",
            padding: "12px 16px",
            fontSize: "13px",
            color: "var(--accent)",
          }}
        >
          {result.message}
        </div>
      )}

      {summaryValue && (
        <div
          style={{
            background: "rgba(59,130,246,0.05)",
            border: "1px solid rgba(59,130,246,0.15)",
            borderRadius: "8px",
            padding: "20px",
          }}
        >
          <SectionTitle>
            {summaryKey?.replace(/_/g, " ") ?? "Summary"}
          </SectionTitle>
          <p
            style={{
              margin: 0,
              fontSize: "14px",
              color: "var(--text-primary)",
              lineHeight: 1.75,
            }}
          >
            {summaryValue}
          </p>
        </div>
      )}

      {remaining.map(([k, v]) => renderSection(k, v))}

      <button
        onClick={onCopy}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          alignSelf: "flex-start",
          padding: "7px 14px",
          borderRadius: "6px",
          fontSize: "12px",
          fontWeight: 500,
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          color: "var(--text-secondary)",
          cursor: "pointer",
        }}
      >
        {copied ? <Check size={12} /> : <Copy size={12} />}
        {copied ? "Copied!" : "Copy JSON"}
      </button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ToolAgentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const agent = AGENT_CONFIG[id] ?? null;
  const familyId = useFamilyId();
  const router = useRouter();

  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!agent) return;
    setFormValues(
      Object.fromEntries(
        agent.fields.map((f) => [f.key, f.default ?? (f.options?.[0] ?? "")])
      )
    );
    setResult(null);
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!agent) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          gap: "12px",
          color: "var(--text-muted)",
        }}
      >
        <AlertCircle size={32} />
        <p style={{ fontSize: "14px" }}>Agent &ldquo;{id}&rdquo; not found.</p>
        <button
          onClick={() => router.back()}
          style={{
            fontSize: "13px",
            color: "var(--accent)",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          Go back
        </button>
      </div>
    );
  }

  const AgentIcon = ICONS[agent.icon] ?? TrendingUp;

  async function runAgent() {
    setRunning(true);
    setError(null);
    const context = buildContext(id, formValues);
    try {
      const res = await fetch(`/api/agents/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ familyId: familyId || "demo", context }),
      });
      const data = (await res.json()) as Record<string, unknown>;
      setResult((data.result as Record<string, unknown>) ?? data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed.");
    } finally {
      setRunning(false);
    }
  }

  function handleCopy() {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: "var(--bg-base)" }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-6 py-4 border-b shrink-0"
        style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}
      >
        <button
          onClick={() => router.back()}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 30,
            height: 30,
            borderRadius: "6px",
            border: "1px solid var(--border)",
            background: "var(--bg-base)",
            color: "var(--text-secondary)",
            cursor: "pointer",
          }}
        >
          <ArrowLeft size={14} />
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 34,
            height: 34,
            borderRadius: "8px",
            background: "rgba(59,130,246,0.1)",
            border: "1px solid rgba(59,130,246,0.2)",
          }}
        >
          <AgentIcon size={16} style={{ color: "var(--accent)" }} strokeWidth={1.75} />
        </div>

        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: "15px",
              fontWeight: 600,
              color: "var(--text-primary)",
              lineHeight: 1.2,
            }}
          >
            {agent.name}
          </div>
          <div
            style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}
          >
            Deliverable: {agent.delivers}
          </div>
        </div>

        <Badge
          label={agent.category}
          variant={categoryVariant[agent.category] ?? "muted"}
          size="xs"
        />
      </div>

      {/* Two-column body */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: Input panel */}
        <div
          className="flex flex-col overflow-auto p-5 gap-4 shrink-0"
          style={{
            width: 360,
            borderRight: "1px solid var(--border)",
            background: "var(--bg-surface)",
          }}
        >
          {/* Deliverable badge + description */}
          <div>
            <div style={{ marginBottom: "8px" }}>
              <Badge label={`Delivers: ${agent.delivers}`} variant="accent" size="xs" />
            </div>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.6, margin: 0 }}>
              {agent.description}
            </p>
          </div>

          {/* Divider */}
          <div style={{ height: "1px", background: "var(--border)" }} />

          {/* Fields */}
          {agent.fields.map((field) => (
            <div key={field.key}>
              <label style={labelStyle}>{field.label}</label>
              {field.type === "textarea" ? (
                <textarea
                  rows={field.rows ?? 4}
                  value={formValues[field.key] ?? ""}
                  placeholder={field.placeholder}
                  onChange={(e) =>
                    setFormValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                  }
                  style={{
                    ...inputStyle,
                    resize: "vertical",
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                    fontSize: "11px",
                    lineHeight: 1.5,
                  }}
                />
              ) : field.type === "select" ? (
                <select
                  value={formValues[field.key] ?? ""}
                  onChange={(e) =>
                    setFormValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                  }
                  style={inputStyle}
                >
                  {(field.options ?? []).map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type}
                  value={formValues[field.key] ?? ""}
                  placeholder={field.placeholder}
                  onChange={(e) =>
                    setFormValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                  }
                  style={inputStyle}
                />
              )}
            </div>
          ))}

          {/* Error */}
          {error && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 12px",
                borderRadius: "6px",
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.2)",
                color: "#ef4444",
                fontSize: "12px",
              }}
            >
              <AlertCircle size={13} />
              {error}
            </div>
          )}

          {/* Run button */}
          <button
            onClick={runAgent}
            disabled={running}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              width: "100%",
              padding: "10px",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: 600,
              background: running ? "var(--accent-muted)" : "var(--accent)",
              color: "#fff",
              border: "none",
              cursor: running ? "not-allowed" : "pointer",
              opacity: running ? 0.8 : 1,
            }}
          >
            {running ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play size={13} strokeWidth={2.5} />
                Run Agent
              </>
            )}
          </button>
        </div>

        {/* RIGHT: Output area */}
        <div className="flex-1 overflow-auto p-6">
          {!result && !running && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                gap: "12px",
                color: "var(--text-muted)",
              }}
            >
              <AgentIcon size={40} strokeWidth={1} />
              <p style={{ fontSize: "13px", textAlign: "center", maxWidth: "280px", lineHeight: 1.6 }}>
                Fill in the inputs and run the agent to receive your{" "}
                <span style={{ color: "var(--text-secondary)" }}>{agent.delivers}</span>.
              </p>
            </div>
          )}

          {running && !result && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                color: "var(--text-muted)",
                paddingTop: "8px",
              }}
            >
              <Loader2 className="animate-spin" size={16} />
              <span style={{ fontSize: "13px" }}>Agent running...</span>
            </div>
          )}

          {result && renderOutput(result, copied, handleCopy)}
        </div>
      </div>
    </div>
  );
}
