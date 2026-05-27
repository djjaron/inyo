"use client";

import { useState } from "react";
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
  X,
  Copy,
  Check,
  LucideIcon,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
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

// ── Tool definitions ──────────────────────────────────────────────────────────

const TOOLS = [
  {
    id: "unit-economics",
    name: "Unit Economics",
    category: "Analysis",
    icon: "TrendingUp",
    description: "Cohort analysis — logo churn, gross dollar churn, NDR, and renewal rates by vintage.",
    color: "accent",
  },
  {
    id: "saas-model",
    name: "SaaS Financial Model",
    category: "Modeling",
    icon: "BarChart3",
    description: "3-statement model (IS/BS/CF) from minimal inputs. Fundraising readiness output.",
    color: "success",
  },
  {
    id: "cap-table",
    name: "Cap Table Analyzer",
    category: "Equity",
    icon: "PieChart",
    description: "All security types: SAFEs, convertible notes, shadow securities, and pro-rata.",
    color: "accent",
  },
  {
    id: "term-loan",
    name: "Term Loan Modeler",
    category: "Debt",
    icon: "DollarSign",
    description: "Multi-tranche schedules, warrant coverage equity cost, and blended rate analysis.",
    color: "warning",
  },
  {
    id: "sales-forecast",
    name: "Sales Forecast",
    category: "Revenue",
    icon: "Target",
    description: "3-element board framework: Closed, Scenarios, and Pipeline Changes tracker.",
    color: "success",
  },
  {
    id: "sales-quota",
    name: "Sales Quota Planner",
    category: "Revenue",
    icon: "Users",
    description: "Ramp-adjusted capacity planning with attrition modeling and hiring gap analysis.",
    color: "success",
  },
  {
    id: "cash-management",
    name: "Cash Management",
    category: "Treasury",
    icon: "Landmark",
    description: "Banking diversification, IntraFi ICS sweep accounts, and board investment policy.",
    color: "warning",
  },
  {
    id: "venture-stagger",
    name: "Venture Stagger",
    category: "Planning",
    icon: "CalendarDays",
    description: "Rolling AOP vs. forecast vs. actuals snapshots for monthly board reporting.",
    color: "muted",
  },
  {
    id: "option-grants",
    name: "Option Grants",
    category: "Equity",
    icon: "Award",
    description: "Policy matrix, option budget, and board approval workflows for equity grants.",
    color: "accent",
  },
  {
    id: "startup-kit",
    name: "Startup Kit",
    category: "Ecosystem",
    icon: "MapPin",
    description: "Texas ecosystem guide: communities, events, media, angel networks, accelerators.",
    color: "muted",
  },
] as const;

// ── Badge category variants ───────────────────────────────────────────────────

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

// ── Icon color map ────────────────────────────────────────────────────────────

const iconColorMap: Record<string, string> = {
  accent: "var(--accent)",
  success: "#10b981",
  warning: "#f59e0b",
  muted: "var(--text-muted)",
};

// ── Default inputs per tool ───────────────────────────────────────────────────

const DEFAULT_INPUTS: Record<string, Record<string, string>> = {
  "unit-economics": {
    company: "",
    cohortData: `[{"cohort":"2024-Q1","size":45,"retained_3m":41,"retained_6m":38,"retained_12m":33},{"cohort":"2024-Q2","size":52,"retained_3m":48,"retained_6m":43}]`,
    ndrTarget: "110",
  },
  "saas-model": {
    company: "",
    startingARR: "8400000",
    annualGrowthRate: "180",
    headcount: "42",
    monthlyBurn: "820000",
  },
  "cap-table": {
    company: "",
    stage: "Series A",
    totalShares: "10000000",
    securitiesData: `[{"type":"SAFE","investor":"a16z","amount":500000,"cap":8000000},{"type":"Series A","investor":"Sequoia","shares":1500000,"price":2.00}]`,
  },
  "term-loan": {
    company: "",
    totalPrincipal: "5000000",
    interestRate: "12.5",
    termMonths: "36",
    warrantCoverage: "15",
    tranchesData: `[{"tranche":1,"amount":2500000,"drawDate":"2025-01-01"},{"tranche":2,"amount":2500000,"drawDate":"2025-07-01"}]`,
  },
  "sales-forecast": {
    company: "",
    quarter: "Q3 2025",
    closedWon: "2800000",
    upsideScenarios: "900000",
    pipeline: "4200000",
    slippedFromLast: "340000",
  },
  "sales-quota": {
    company: "",
    totalReps: "12",
    quotaPerRep: "800000",
    avgRamp: "3",
    annualAttrition: "25",
    plannedHires: "4",
  },
  "cash-management": {
    company: "",
    totalCash: "14200000",
    bankingData: `[{"bank":"SVB","balance":8200000,"type":"operating"},{"bank":"First Republic","balance":6000000,"type":"money-market"}]`,
    fdicCoverage: "true",
  },
  "venture-stagger": {
    company: "",
    aopRevenue: "24000000",
    aopExpenses: "18000000",
    currentMonth: "May 2025",
    monthlyData: `[{"month":"Jan","aopRevenue":1800000,"forecastRevenue":1750000,"actualRevenue":1820000},{"month":"Feb","aopRevenue":1900000,"forecastRevenue":1850000,"actualRevenue":1790000},{"month":"Mar","aopRevenue":2000000,"forecastRevenue":2100000,"actualRevenue":2050000}]`,
  },
  "option-grants": {
    company: "",
    totalOptionPool: "2000000",
    previouslyGranted: "1100000",
    strikePrice409a: "0.85",
    grantsData: `[{"recipient":"VP Engineering","level":"VP","shares":150000,"vestingSchedule":"4yr/1yr cliff"},{"recipient":"Senior Engineer","level":"IC","shares":50000,"vestingSchedule":"4yr/1yr cliff"}]`,
  },
  "startup-kit": {
    founder: "",
    company: "",
    location: "Austin",
    stage: "Seed",
    sector: "",
    goalsText: "Find co-investors for next round\nBuild advisory board\nGet press coverage",
  },
};

// ── Types ─────────────────────────────────────────────────────────────────────

type Tool = (typeof TOOLS)[number];

// ── Input component helpers ───────────────────────────────────────────────────

const inputStyle = {
  background: "var(--bg-base)",
  border: "1px solid var(--border)",
  color: "var(--text-primary)",
  borderRadius: "6px",
  padding: "8px 12px",
  fontSize: "13px",
  width: "100%",
  outline: "none",
} as const;

const labelStyle = {
  display: "block",
  fontSize: "11px",
  fontWeight: 500,
  color: "var(--text-muted)",
  marginBottom: "4px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.04em",
} as const;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

// ── Tool Form ─────────────────────────────────────────────────────────────────

function ToolForm({
  tool,
  inputs,
  onChange,
}: {
  tool: Tool;
  inputs: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  const inp = (key: string) => inputs[key] ?? "";
  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    onChange(key, e.target.value);

  if (tool.id === "unit-economics") {
    return (
      <>
        <Field label="Company">
          <input style={inputStyle} type="text" placeholder="Acme Corp" value={inp("company")} onChange={set("company")} />
        </Field>
        <Field label="Cohort Data (JSON)">
          <textarea
            style={{ ...inputStyle, resize: "vertical", minHeight: 90, fontFamily: "monospace", fontSize: 11 }}
            value={inp("cohortData")}
            onChange={set("cohortData")}
          />
        </Field>
        <Field label="NDR Target %">
          <input style={inputStyle} type="number" value={inp("ndrTarget")} onChange={set("ndrTarget")} />
        </Field>
      </>
    );
  }

  if (tool.id === "saas-model") {
    return (
      <>
        <Field label="Company">
          <input style={inputStyle} type="text" placeholder="Acme Corp" value={inp("company")} onChange={set("company")} />
        </Field>
        <Field label="Starting ARR ($)">
          <input style={inputStyle} type="number" value={inp("startingARR")} onChange={set("startingARR")} />
        </Field>
        <Field label="Annual Growth Rate %">
          <input style={inputStyle} type="number" value={inp("annualGrowthRate")} onChange={set("annualGrowthRate")} />
        </Field>
        <Field label="Headcount">
          <input style={inputStyle} type="number" value={inp("headcount")} onChange={set("headcount")} />
        </Field>
        <Field label="Monthly Burn ($)">
          <input style={inputStyle} type="number" value={inp("monthlyBurn")} onChange={set("monthlyBurn")} />
        </Field>
      </>
    );
  }

  if (tool.id === "cap-table") {
    return (
      <>
        <Field label="Company">
          <input style={inputStyle} type="text" placeholder="Acme Corp" value={inp("company")} onChange={set("company")} />
        </Field>
        <Field label="Stage">
          <select style={inputStyle} value={inp("stage")} onChange={set("stage")}>
            {["Seed", "Series A", "Series B", "Series C"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field label="Total Shares">
          <input style={inputStyle} type="number" value={inp("totalShares")} onChange={set("totalShares")} />
        </Field>
        <Field label="Securities (JSON)">
          <textarea
            style={{ ...inputStyle, resize: "vertical", minHeight: 90, fontFamily: "monospace", fontSize: 11 }}
            value={inp("securitiesData")}
            onChange={set("securitiesData")}
          />
        </Field>
      </>
    );
  }

  if (tool.id === "term-loan") {
    return (
      <>
        <Field label="Company">
          <input style={inputStyle} type="text" placeholder="Acme Corp" value={inp("company")} onChange={set("company")} />
        </Field>
        <Field label="Total Principal ($)">
          <input style={inputStyle} type="number" value={inp("totalPrincipal")} onChange={set("totalPrincipal")} />
        </Field>
        <Field label="Interest Rate %">
          <input style={inputStyle} type="number" value={inp("interestRate")} onChange={set("interestRate")} />
        </Field>
        <Field label="Term (months)">
          <input style={inputStyle} type="number" value={inp("termMonths")} onChange={set("termMonths")} />
        </Field>
        <Field label="Warrant Coverage %">
          <input style={inputStyle} type="number" value={inp("warrantCoverage")} onChange={set("warrantCoverage")} />
        </Field>
        <Field label="Tranches (JSON)">
          <textarea
            style={{ ...inputStyle, resize: "vertical", minHeight: 90, fontFamily: "monospace", fontSize: 11 }}
            value={inp("tranchesData")}
            onChange={set("tranchesData")}
          />
        </Field>
      </>
    );
  }

  if (tool.id === "sales-forecast") {
    return (
      <>
        <Field label="Company">
          <input style={inputStyle} type="text" placeholder="Acme Corp" value={inp("company")} onChange={set("company")} />
        </Field>
        <Field label="Quarter">
          <input style={inputStyle} type="text" value={inp("quarter")} onChange={set("quarter")} />
        </Field>
        <Field label="Closed Won ($)">
          <input style={inputStyle} type="number" value={inp("closedWon")} onChange={set("closedWon")} />
        </Field>
        <Field label="Upside Scenarios ($)">
          <input style={inputStyle} type="number" value={inp("upsideScenarios")} onChange={set("upsideScenarios")} />
        </Field>
        <Field label="Pipeline ($)">
          <input style={inputStyle} type="number" value={inp("pipeline")} onChange={set("pipeline")} />
        </Field>
        <Field label="Slipped from Last Quarter ($)">
          <input style={inputStyle} type="number" value={inp("slippedFromLast")} onChange={set("slippedFromLast")} />
        </Field>
      </>
    );
  }

  if (tool.id === "sales-quota") {
    return (
      <>
        <Field label="Company">
          <input style={inputStyle} type="text" placeholder="Acme Corp" value={inp("company")} onChange={set("company")} />
        </Field>
        <Field label="Total Reps">
          <input style={inputStyle} type="number" value={inp("totalReps")} onChange={set("totalReps")} />
        </Field>
        <Field label="Quota per Rep ($)">
          <input style={inputStyle} type="number" value={inp("quotaPerRep")} onChange={set("quotaPerRep")} />
        </Field>
        <Field label="Average Ramp (months)">
          <input style={inputStyle} type="number" value={inp("avgRamp")} onChange={set("avgRamp")} />
        </Field>
        <Field label="Annual Attrition %">
          <input style={inputStyle} type="number" value={inp("annualAttrition")} onChange={set("annualAttrition")} />
        </Field>
        <Field label="Planned Hires (next 6mo)">
          <input style={inputStyle} type="number" value={inp("plannedHires")} onChange={set("plannedHires")} />
        </Field>
      </>
    );
  }

  if (tool.id === "cash-management") {
    return (
      <>
        <Field label="Company">
          <input style={inputStyle} type="text" placeholder="Acme Corp" value={inp("company")} onChange={set("company")} />
        </Field>
        <Field label="Total Cash ($)">
          <input style={inputStyle} type="number" value={inp("totalCash")} onChange={set("totalCash")} />
        </Field>
        <Field label="Banking Relationships (JSON)">
          <textarea
            style={{ ...inputStyle, resize: "vertical", minHeight: 90, fontFamily: "monospace", fontSize: 11 }}
            value={inp("bankingData")}
            onChange={set("bankingData")}
          />
        </Field>
        <Field label="FDIC Coverage Needed">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
            <input
              type="checkbox"
              id="fdicCoverage"
              checked={inp("fdicCoverage") === "true"}
              onChange={(e) => onChange("fdicCoverage", e.target.checked ? "true" : "false")}
              style={{ accentColor: "var(--accent)", width: 14, height: 14 }}
            />
            <label htmlFor="fdicCoverage" style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              Require FDIC coverage analysis
            </label>
          </div>
        </Field>
      </>
    );
  }

  if (tool.id === "venture-stagger") {
    return (
      <>
        <Field label="Company">
          <input style={inputStyle} type="text" placeholder="Acme Corp" value={inp("company")} onChange={set("company")} />
        </Field>
        <Field label="AOP Revenue ($)">
          <input style={inputStyle} type="number" value={inp("aopRevenue")} onChange={set("aopRevenue")} />
        </Field>
        <Field label="AOP Expenses ($)">
          <input style={inputStyle} type="number" value={inp("aopExpenses")} onChange={set("aopExpenses")} />
        </Field>
        <Field label="Current Month">
          <input style={inputStyle} type="text" value={inp("currentMonth")} onChange={set("currentMonth")} />
        </Field>
        <Field label="Monthly Data (JSON)">
          <textarea
            style={{ ...inputStyle, resize: "vertical", minHeight: 90, fontFamily: "monospace", fontSize: 11 }}
            value={inp("monthlyData")}
            onChange={set("monthlyData")}
          />
        </Field>
      </>
    );
  }

  if (tool.id === "option-grants") {
    return (
      <>
        <Field label="Company">
          <input style={inputStyle} type="text" placeholder="Acme Corp" value={inp("company")} onChange={set("company")} />
        </Field>
        <Field label="Total Option Pool">
          <input style={inputStyle} type="number" value={inp("totalOptionPool")} onChange={set("totalOptionPool")} />
        </Field>
        <Field label="Previously Granted">
          <input style={inputStyle} type="number" value={inp("previouslyGranted")} onChange={set("previouslyGranted")} />
        </Field>
        <Field label="409A Strike Price ($)">
          <input style={inputStyle} type="number" step="0.01" value={inp("strikePrice409a")} onChange={set("strikePrice409a")} />
        </Field>
        <Field label="Recent Grants (JSON)">
          <textarea
            style={{ ...inputStyle, resize: "vertical", minHeight: 90, fontFamily: "monospace", fontSize: 11 }}
            value={inp("grantsData")}
            onChange={set("grantsData")}
          />
        </Field>
      </>
    );
  }

  if (tool.id === "startup-kit") {
    return (
      <>
        <Field label="Founder Name">
          <input style={inputStyle} type="text" placeholder="Jane Smith" value={inp("founder")} onChange={set("founder")} />
        </Field>
        <Field label="Company">
          <input style={inputStyle} type="text" placeholder="Acme Corp" value={inp("company")} onChange={set("company")} />
        </Field>
        <Field label="Location">
          <select style={inputStyle} value={inp("location")} onChange={set("location")}>
            {["Austin", "Houston", "Dallas", "San Antonio", "Other TX"].map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </Field>
        <Field label="Stage">
          <select style={inputStyle} value={inp("stage")} onChange={set("stage")}>
            {["Pre-Seed", "Seed", "Series A", "Series B"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field label="Sector">
          <input style={inputStyle} type="text" placeholder="FinTech, HealthTech, etc." value={inp("sector")} onChange={set("sector")} />
        </Field>
        <Field label="Goals (one per line)">
          <textarea
            style={{ ...inputStyle, resize: "vertical", minHeight: 80 }}
            value={inp("goalsText")}
            onChange={set("goalsText")}
          />
        </Field>
      </>
    );
  }

  return null;
}

// ── Build context from inputs ─────────────────────────────────────────────────

function buildContext(
  toolId: string,
  inputs: Record<string, string>
): { context: Record<string, unknown>; error?: string } {
  try {
    switch (toolId) {
      case "unit-economics":
        return {
          context: {
            company: inputs.company,
            cohorts: JSON.parse(inputs.cohortData),
            ndrTarget: Number(inputs.ndrTarget),
          },
        };
      case "saas-model":
        return {
          context: {
            company: inputs.company,
            startingARR: Number(inputs.startingARR),
            annualGrowthRate: Number(inputs.annualGrowthRate),
            headcount: Number(inputs.headcount),
            monthlyBurn: Number(inputs.monthlyBurn),
          },
        };
      case "cap-table":
        return {
          context: {
            company: inputs.company,
            stage: inputs.stage,
            totalShares: Number(inputs.totalShares),
            securities: JSON.parse(inputs.securitiesData),
          },
        };
      case "term-loan":
        return {
          context: {
            company: inputs.company,
            totalPrincipal: Number(inputs.totalPrincipal),
            interestRate: Number(inputs.interestRate),
            termMonths: Number(inputs.termMonths),
            warrantCoverage: Number(inputs.warrantCoverage),
            tranches: JSON.parse(inputs.tranchesData),
          },
        };
      case "sales-forecast":
        return {
          context: {
            company: inputs.company,
            quarter: inputs.quarter,
            closedWon: Number(inputs.closedWon),
            upsideScenarios: Number(inputs.upsideScenarios),
            pipeline: Number(inputs.pipeline),
            slippedDeals: Number(inputs.slippedFromLast),
          },
        };
      case "sales-quota":
        return {
          context: {
            company: inputs.company,
            totalReps: Number(inputs.totalReps),
            quotaPerRep: Number(inputs.quotaPerRep),
            avgRamp: Number(inputs.avgRamp),
            annualAttrition: Number(inputs.annualAttrition),
            plannedHires: Number(inputs.plannedHires),
          },
        };
      case "cash-management":
        return {
          context: {
            company: inputs.company,
            totalCash: Number(inputs.totalCash),
            bankingRelationships: JSON.parse(inputs.bankingData),
            fdicCoverage: inputs.fdicCoverage === "true",
          },
        };
      case "venture-stagger":
        return {
          context: {
            company: inputs.company,
            aopRevenue: Number(inputs.aopRevenue),
            aopExpenses: Number(inputs.aopExpenses),
            currentMonth: inputs.currentMonth,
            monthlyData: JSON.parse(inputs.monthlyData),
          },
        };
      case "option-grants":
        return {
          context: {
            company: inputs.company,
            totalOptionPool: Number(inputs.totalOptionPool),
            previouslyGranted: Number(inputs.previouslyGranted),
            strikePrice409a: Number(inputs.strikePrice409a),
            recentGrants: JSON.parse(inputs.grantsData),
          },
        };
      case "startup-kit":
        return {
          context: {
            founder: inputs.founder,
            company: inputs.company,
            location: inputs.location,
            stage: inputs.stage,
            sector: inputs.sector,
            goals: inputs.goalsText.split("\n").filter(Boolean),
          },
        };
      default:
        return { context: {} };
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "JSON parse error";
    return { context: {}, error: `Invalid JSON: ${msg}` };
  }
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ToolsPage() {
  const familyId = useFamilyId();

  const [activeTool, setActiveTool] = useState<Tool | null>(null);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function launchTool(tool: Tool) {
    setActiveTool(tool);
    setInputs(DEFAULT_INPUTS[tool.id] ?? {});
    setResult(null);
    setParseError(null);
    setCopied(false);
  }

  function closeTool() {
    setActiveTool(null);
    setResult(null);
    setParseError(null);
    setCopied(false);
  }

  function handleInputChange(key: string, value: string) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  async function runAnalysis() {
    if (!activeTool) return;
    const { context, error } = buildContext(activeTool.id, inputs);
    if (error) {
      setParseError(error);
      return;
    }
    setParseError(null);
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/agents/${activeTool.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ familyId: familyId ?? "demo", context }),
      });
      const data = await res.json();
      setResult(data.result as Record<string, unknown>);
    } catch {
      setResult({ error: "Request failed. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  function copyResult() {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const resultSummary =
    result &&
    (typeof result.summary === "string"
      ? result.summary
      : typeof result.analysis === "string"
      ? result.analysis
      : null);

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--bg-base)" }}>
      <PageHeader
        title="Venture Tools"
        subtitle="S3-powered financial models and startup intelligence tools"
      />

      {/* Subtitle bar */}
      <div
        className="flex items-center gap-3 px-8 py-3 border-b"
        style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}
      >
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          10 tools available
        </span>
      </div>

      {/* Content area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Tool grid */}
        <div
          className="flex-1 p-8 overflow-y-auto"
          style={{ transition: "padding-right 0.15s ease" }}
        >
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: activeTool
                ? "repeat(2, minmax(0, 1fr))"
                : "repeat(3, minmax(0, 1fr))",
            }}
          >
            {TOOLS.map((tool) => {
              const Icon = ICONS[tool.icon];
              const iconColor = iconColorMap[tool.color] ?? "var(--accent)";
              const isActive = activeTool?.id === tool.id;

              return (
                <div
                  key={tool.id}
                  className="rounded-lg border flex flex-col gap-3 p-5 transition-colors"
                  style={{
                    background: isActive ? "var(--bg-elevated)" : "var(--bg-surface)",
                    borderColor: isActive ? "var(--accent)" : "var(--border)",
                    cursor: "default",
                  }}
                >
                  {/* Icon + badge */}
                  <div className="flex items-start justify-between">
                    <div
                      className="flex items-center justify-center w-9 h-9 rounded-md"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)" }}
                    >
                      {Icon && <Icon size={16} style={{ color: iconColor }} strokeWidth={1.75} />}
                    </div>
                    <Badge
                      label={tool.category}
                      variant={categoryVariant[tool.category] ?? "muted"}
                      size="xs"
                    />
                  </div>

                  {/* Name + description */}
                  <div>
                    <div
                      className="text-sm font-semibold mb-1 leading-snug"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {tool.name}
                    </div>
                    <div
                      className="text-xs leading-relaxed line-clamp-2"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {tool.description}
                    </div>
                  </div>

                  {/* Launch button */}
                  <button
                    onClick={() => launchTool(tool)}
                    className="mt-auto w-full py-2 rounded text-xs font-semibold transition-opacity hover:opacity-90"
                    style={
                      isActive
                        ? { background: "var(--accent)", color: "#fff", opacity: 0.75 }
                        : { background: "var(--accent)", color: "#fff" }
                    }
                  >
                    {isActive ? "Active" : "Launch"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Slide-over panel */}
        {activeTool && (
          <div
            className="flex flex-col border-l overflow-y-auto shrink-0"
            style={{
              width: 420,
              background: "var(--bg-elevated)",
              borderColor: "var(--border)",
            }}
          >
            {/* Panel header */}
            <div
              className="flex items-center justify-between px-6 py-4 border-b sticky top-0 z-10"
              style={{
                background: "var(--bg-elevated)",
                borderColor: "var(--border)",
              }}
            >
              <div>
                <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {activeTool.name}
                </div>
                <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {activeTool.description}
                </div>
              </div>
              <button
                onClick={closeTool}
                className="ml-3 shrink-0 p-1.5 rounded transition-colors hover:bg-white/5"
                style={{ color: "var(--text-muted)" }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Form */}
            <div className="flex flex-col gap-4 px-6 py-5">
              <ToolForm
                tool={activeTool}
                inputs={inputs}
                onChange={handleInputChange}
              />

              {/* Parse error */}
              {parseError && (
                <div
                  className="text-xs px-3 py-2 rounded border"
                  style={{
                    color: "#ef4444",
                    background: "rgba(239,68,68,0.08)",
                    borderColor: "rgba(239,68,68,0.2)",
                  }}
                >
                  {parseError}
                </div>
              )}

              {/* Run button */}
              <button
                onClick={runAnalysis}
                disabled={loading}
                className="w-full py-2.5 rounded text-sm font-semibold transition-opacity disabled:opacity-50"
                style={{ background: "var(--accent)", color: "#fff" }}
              >
                {loading ? "Analyzing..." : "Run Analysis"}
              </button>
            </div>

            {/* Output */}
            {result && (
              <div
                className="flex flex-col gap-3 px-6 pb-6 border-t pt-5"
                style={{ borderColor: "var(--border)" }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs font-medium uppercase tracking-wider"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Result
                  </span>
                  <button
                    onClick={copyResult}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors hover:bg-white/5"
                    style={{ color: "var(--text-secondary)", border: "1px solid var(--border)" }}
                  >
                    {copied ? (
                      <>
                        <Check size={11} />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy size={11} />
                        Copy
                      </>
                    )}
                  </button>
                </div>

                {/* Plain-text summary / analysis */}
                {resultSummary && (
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {resultSummary}
                  </p>
                )}

                {/* Raw JSON block */}
                <pre
                  className="text-xs rounded-md p-4 overflow-x-auto"
                  style={{
                    background: "var(--bg-base)",
                    border: "1px solid var(--border)",
                    color: "var(--text-secondary)",
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all",
                  }}
                >
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
