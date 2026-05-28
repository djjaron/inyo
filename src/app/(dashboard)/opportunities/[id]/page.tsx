"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ChevronLeft, Bot, FileText, RefreshCw, Zap, Loader2, Building2, Tag, DollarSign, Calendar, User, Globe, Link2, TrendingUp, Pencil, X, Plus, AlertTriangle, Users, ChevronDown, ChevronUp, Scale, Layers, CheckSquare, Square, AlertOctagon, StickyNote } from "lucide-react";
import Badge from "@/components/ui/Badge";
import ScoreRing from "@/components/ui/ScoreRing";
import DealAnalysisPanel from "@/components/ui/DealAnalysisPanel";
import ICMemoPanel from "@/components/ui/ICMemoPanel";
import { formatCurrency, formatDate } from "@/lib/utils";

const statusVariant: Record<string, "success" | "warning" | "accent" | "danger" | "muted" | "default"> = {
  inbound: "accent", reviewing: "accent", diligence: "warning",
  "ic-review": "warning", invested: "success", passed: "muted", archived: "muted",
};
const statusLabel: Record<string, string> = {
  inbound: "Inbound", reviewing: "Reviewing", diligence: "Diligence",
  "ic-review": "IC Review", invested: "Invested", passed: "Passed", archived: "Archived",
};

const SELECTABLE_STATUSES = [
  "inbound", "reviewing", "diligence", "ic-review", "passed", "invested",
] as const;

const spvStatusVariant: Record<string, "success" | "warning" | "accent" | "danger" | "muted" | "default"> = {
  active: "success",
  launching: "warning",
  draft: "muted",
  closed: "default",
  cancelled: "danger",
};

type Tab = "overview" | "analysis" | "memo" | "terms" | "diligence" | "notes";

interface TermSheetSheet {
  label: string;
  valuation: string | null;
  investmentAmount: string | null;
  ownership: string | null;
  liquidationPref: string;
  antiDilution: string;
  boardSeats: string;
  proRataRights: string;
  dragAlong: string;
  informationRights: string;
  closingConditions: string[];
  unusualTerms: Array<{ term: string; flag: string; severity: "high" | "medium" | "low" }>;
  summary: string;
}

interface TermSheetResult {
  sheets: TermSheetSheet[];
  comparison: {
    mostFavorable: string;
    keyDifferences: string[];
    redFlags: Array<{ sheet: string; term: string; issue: string }>;
    recommendation: string;
  };
}

interface Founder {
  id: string;
  name: string;
  title?: string;
  linkedinUrl?: string;
}

interface EnrichmentResult {
  affinityScore: number;
  riskScore: number;
  fundabilityScore: number;
  riskFactors: Array<{ factor: string; severity: "high" | "medium" | "low"; description: string; source: string }>;
  fundabilityFactors: Array<{ factor: string; impact: "positive" | "negative"; description: string }>;
  founderSignals: Array<{ name: string; signals: string[] }>;
  webSignals: { websiteQuality: string; techStack: string[]; teamPagePresence: boolean; pressOrMedia: string[] };
  summary: string;
}

interface CoInvestorMatch {
  id: string;
  name: string;
  company?: string | null;
  title?: string | null;
  linkedIn?: string | null;
  investorType?: string | null;
  assetClasses: string[];
  checkSizeMin?: number | null;
  checkSizeMax?: number | null;
  score: number;
  lastContactAt?: string | null;
}

interface SPVSummary {
  id: string;
  name: string;
  status: "draft" | "launching" | "active" | "closed" | "cancelled";
  spvType: string;
  sydecarId?: string;
  sydecarUrl?: string;
  targetRaise?: number;
  totalCommitted?: number;
  managementFee?: number;
  carry?: number;
  closingDate?: string;
  launchedAt?: string;
  investors?: Array<{ id: string; name: string; status: string; commitment: number }>;
}

interface Deal {
  id: string; familyId: string; company: string; name?: string;
  sector?: string; stage?: string; status: string;
  capitalAsk?: number; valuation?: number; description?: string;
  sourceType?: string; sourceContact?: string; dealScore?: number;
  createdAt: string; updatedAt?: string;
  website?: string;
  linkedinUrl?: string;
  crunchbaseUrl?: string;
  affinityScore?: number;
  riskScore?: number;
  fundabilityScore?: number;
  enrichedAt?: string;
  documents?: Array<{ id: string; name: string; textContent?: string; createdAt: string }>;
  aiAnalyses?: Array<{ id: string; agentType: string; output: Record<string, unknown>; createdAt: string; _mock?: boolean }>;
}

interface DiligenceItem {
  id: string;
  category: string;
  question: string;
  status: "pending" | "in-progress" | "complete" | "flagged";
  notes: string;
  aiAnswer?: string;
  aiFlag?: string;
}

const DILIGENCE_TEMPLATES: Record<string, Array<{ id: string; category: string; question: string }>> = {
  "real-estate": [
    { id: "re-1", category: "Financials", question: "What is the cap rate and how does it compare to market comps?" },
    { id: "re-2", category: "Financials", question: "Net Operating Income (NOI) — verified or projected?" },
    { id: "re-3", category: "Debt", question: "Debt Service Coverage Ratio (DSCR) and LTV within acceptable limits?" },
    { id: "re-4", category: "Asset Quality", question: "Current occupancy rate and lease roll schedule reviewed?" },
    { id: "re-5", category: "Asset Quality", question: "Physical inspection and environmental assessment completed?" },
    { id: "re-6", category: "Legal", question: "Zoning, entitlements, and title review clear?" },
    { id: "re-7", category: "Market", question: "Market comps support the underwritten rent assumptions?" },
    { id: "re-8", category: "Capital Stack", question: "Cap stack reviewed — preferred equity, mezz, senior debt terms acceptable?" },
  ],
  "tech": [
    { id: "tech-1", category: "Revenue", question: "ARR/MRR growth trajectory and NRR above 100%?" },
    { id: "tech-2", category: "Revenue", question: "Customer concentration risk — top 3 customers as % of ARR?" },
    { id: "tech-3", category: "Unit Economics", question: "CAC/LTV ratio sustainable? Payback period under 18 months?" },
    { id: "tech-4", category: "Burn & Runway", question: "Current burn rate and runway at current pace?" },
    { id: "tech-5", category: "IP", question: "Key IP, patents, or proprietary technology identified and protected?" },
    { id: "tech-6", category: "Team", question: "Founding team background, domain expertise, and retention?" },
    { id: "tech-7", category: "Market", question: "TAM/SAM validated and market leadership thesis credible?" },
    { id: "tech-8", category: "Competition", question: "Competitive moat — switching costs, network effects, or defensibility?" },
    { id: "tech-9", category: "Technical", question: "Tech stack, scalability, and security posture reviewed?" },
  ],
  "sports": [
    { id: "spt-1", category: "Valuation", question: "Franchise valuation methodology — comparable recent transactions reviewed?" },
    { id: "spt-2", category: "Revenue", question: "Media rights — local and national deal terms and duration?" },
    { id: "spt-3", category: "Revenue", question: "Revenue diversity — tickets, sponsorships, merchandise, licensing breakdown?" },
    { id: "spt-4", category: "Liabilities", question: "Player contract liabilities and guaranteed money reviewed?" },
    { id: "spt-5", category: "Facility", question: "Stadium/venue ownership, lease terms, or renovation obligations?" },
    { id: "spt-6", category: "Market", question: "Market demographics and fan base size and engagement metrics?" },
    { id: "spt-7", category: "League", question: "League revenue sharing, salary cap rules, and ownership transfer approval?" },
    { id: "spt-8", category: "Management", question: "Front office and coaching stability — key man risk?" },
  ],
  "pe": [
    { id: "pe-1", category: "Financials", question: "Revenue quality — recurring vs. transactional, contract terms?" },
    { id: "pe-2", category: "Financials", question: "EBITDA margins and trajectory compared to sector comps?" },
    { id: "pe-3", category: "Debt", question: "Leverage profile — debt/EBITDA, covenant compliance, refinancing risk?" },
    { id: "pe-4", category: "Team", question: "Management team depth, incentive alignment, and rollover equity?" },
    { id: "pe-5", category: "Market", question: "Market position — pricing power, customer retention, competitive threats?" },
    { id: "pe-6", category: "Exit", question: "Exit path analysis — strategic buyers, sponsor-to-sponsor, IPO feasibility?" },
    { id: "pe-7", category: "Operations", question: "Operational improvement opportunities identified and quantified?" },
    { id: "pe-8", category: "Legal", question: "Material contracts, litigation exposure, and regulatory compliance?" },
  ],
  "credit": [
    { id: "crd-1", category: "Collateral", question: "Collateral quality, valuation, and enforceability reviewed?" },
    { id: "crd-2", category: "Covenants", question: "Covenant structure — maintenance vs. incurrence, headroom adequate?" },
    { id: "crd-3", category: "Coverage", question: "Interest coverage ratio and DSCR at current leverage?" },
    { id: "crd-4", category: "Borrower", question: "Borrower credit history, management track record, and liquidity?" },
    { id: "crd-5", category: "Documentation", question: "Loan documentation, intercreditor agreements reviewed by counsel?" },
    { id: "crd-6", category: "Recovery", question: "Downside scenario — recovery analysis in restructuring scenario?" },
  ],
  "biotech": [
    { id: "bio-1", category: "Pipeline", question: "Lead asset stage, trial readiness, and data package quality?" },
    { id: "bio-2", category: "IP", question: "Patent landscape — composition of matter, method, and expiry dates?" },
    { id: "bio-3", category: "Regulatory", question: "FDA pathway clarity — IND filed, Fast Track or Breakthrough status?" },
    { id: "bio-4", category: "Financials", question: "Burn rate vs. upcoming milestones — cash runway to value inflection?" },
    { id: "bio-5", category: "Team", question: "Management team — clinical development, regulatory, and CMC expertise?" },
    { id: "bio-6", category: "Partnerships", question: "Partnership or licensing potential with Big Pharma identified?" },
  ],
  "default": [
    { id: "gen-1", category: "Business", question: "Business model clearly understood and revenue streams validated?" },
    { id: "gen-2", category: "Financials", question: "Financials reviewed — growth rate, margins, and unit economics?" },
    { id: "gen-3", category: "Team", question: "Founding team background, track record, and references checked?" },
    { id: "gen-4", category: "Market", question: "Market size (TAM/SAM) validated with credible methodology?" },
    { id: "gen-5", category: "Competition", question: "Competitive landscape mapped and differentiation articulated?" },
    { id: "gen-6", category: "Legal", question: "Legal structure, IP ownership, and any known litigation reviewed?" },
    { id: "gen-7", category: "References", question: "Customer and investor references conducted?" },
    { id: "gen-8", category: "Terms", question: "Investment terms, valuation, and governance rights acceptable?" },
  ],
};

function getTemplate(sector?: string): typeof DILIGENCE_TEMPLATES["default"] {
  if (!sector) return DILIGENCE_TEMPLATES.default;
  const s = sector.toLowerCase();
  if (s.includes("real-estate") || s.includes("real estate") || s.includes("reit")) return DILIGENCE_TEMPLATES["real-estate"];
  if (s.includes("tech") || s.includes("ai") || s.includes("saas") || s.includes("software")) return DILIGENCE_TEMPLATES.tech;
  if (s.includes("sport")) return DILIGENCE_TEMPLATES.sports;
  if (s.includes("pe") || s.includes("private equity") || s.includes("buyout")) return DILIGENCE_TEMPLATES.pe;
  if (s.includes("credit") || s.includes("debt") || s.includes("lending")) return DILIGENCE_TEMPLATES.credit;
  if (s.includes("bio") || s.includes("health") || s.includes("pharma") || s.includes("medtech")) return DILIGENCE_TEMPLATES.biotech;
  return DILIGENCE_TEMPLATES.default;
}

export default function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");
  const [saving, setSaving] = useState(false);

  const [analysis, setAnalysis] = useState<Record<string, unknown> | null>(null);
  const [analysisMock, setAnalysisMock] = useState(false);
  const [runningAnalysis, setRunningAnalysis] = useState(false);
  const [analysisAck, setAnalysisAck] = useState<string | null>(null);

  const [icMemo, setIcMemo] = useState<Record<string, unknown> | null>(null);
  const [memoMock, setMemoMock] = useState(false);
  const [runningMemo, setRunningMemo] = useState(false);
  const [memoAck, setMemoAck] = useState<string | null>(null);

  const [docText, setDocText] = useState("");

  // Term sheet state
  const [termSheets, setTermSheets] = useState([
    { label: "Term Sheet 1", content: "" },
    { label: "Term Sheet 2", content: "" },
  ]);
  const [termResult, setTermResult] = useState<TermSheetResult | null>(null);
  const [termRunning, setTermRunning] = useState(false);
  const [termAck, setTermAck] = useState<string | null>(null);

  // Enrichment state
  const [founders, setFounders] = useState<Founder[]>([]);
  const [enrichment, setEnrichment] = useState<EnrichmentResult | null>(null);
  const [enriching, setEnriching] = useState(false);
  const [enrichProgress, setEnrichProgress] = useState("");
  const [showAddFounder, setShowAddFounder] = useState(false);

  // Co-investor match state
  const [coMatches, setCoMatches] = useState<CoInvestorMatch[]>([]);
  const [coMatchesExpanded, setCoMatchesExpanded] = useState(true);
  const [coMatchesMock, setCoMatchesMock] = useState(false);

  // SPV state
  const [spvs, setSpvs] = useState<SPVSummary[]>([]);
  const [showCreateSpv, setShowCreateSpv] = useState(false);
  const [launchingSpv, setLaunchingSpv] = useState<string | null>(null);

  // Source URL editing state
  const [sourceEditing, setSourceEditing] = useState(false);
  const [sourceForm, setSourceForm] = useState({ website: "", linkedinUrl: "", crunchbaseUrl: "" });

  // Diligence state
  const [diligenceItems, setDiligenceItems] = useState<DiligenceItem[]>([]);
  const [diligenceRunning, setDiligenceRunning] = useState(false);
  const [diligenceAck, setDiligenceAck] = useState<string | null>(null);
  const [diligenceLoaded, setDiligenceLoaded] = useState(false);
  const [expandedDiligenceItems, setExpandedDiligenceItems] = useState<Set<string>>(new Set());

  // Notes state
  const [notes, setNotes] = useState<Array<{ id: string; input: Record<string, unknown>; createdAt: string }>>([]);
  const [notesLoaded, setNotesLoaded] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/deals/${id}`)
      .then((r) => r.json())
      .then(async (data) => {
        const d: Deal = data.deal ?? data;
        setDeal(d);
        // Pre-load most recent analysis results if available
        const analyses: Deal["aiAnalyses"] = d.aiAnalyses ?? [];
        const latest = (type: string) => analyses.find((a) => a.agentType === type);
        const la = latest("deal-flow");
        if (la) { setAnalysis(la.output); setAnalysisMock(!!(la as { _mock?: boolean })._mock); }
        const lm = latest("ic-memo");
        if (lm) { setIcMemo(lm.output); setMemoMock(!!(lm as { _mock?: boolean })._mock); }

        // Initialize sourceForm from deal data
        setSourceForm({ website: d.website ?? "", linkedinUrl: d.linkedinUrl ?? "", crunchbaseUrl: d.crunchbaseUrl ?? "" });

        // Load founders
        try {
          const foundersRes = await fetch(`/api/deals/${id}/founders`);
          const foundersData = await foundersRes.json();
          setFounders(foundersData.founders ?? []);
        } catch {
          // ignore founders fetch error
        }

        // Load SPVs linked to this deal
        try {
          const spvRes = await fetch(`/api/spv?familyId=${d.familyId}&dealId=${d.id}`);
          const spvData = await spvRes.json();
          setSpvs(spvData.spvs ?? []);
        } catch { /* ignore */ }

        // If deal already has scores, load enrichment display
        if (d.affinityScore != null) {
          setEnrichment({
            affinityScore: d.affinityScore,
            riskScore: d.riskScore ?? 0,
            fundabilityScore: d.fundabilityScore ?? 0,
            riskFactors: [],
            fundabilityFactors: [],
            founderSignals: [],
            webSignals: { websiteQuality: "", techStack: [], teamPagePresence: false, pressOrMedia: [] },
            summary: "",
          });
        }
      })
      .catch(() => {
        setDeal({
          id, familyId: "family_demo", company: "Demo Deal", status: "inbound",
          createdAt: new Date().toISOString(),
        });
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Load co-investor matches once deal is available
  useEffect(() => {
    if (!deal) return;
    const params = new URLSearchParams({ familyId: deal.familyId });
    if (deal.sector) params.set("sector", deal.sector);
    if (deal.stage) params.set("stage", deal.stage);
    if (deal.capitalAsk) params.set("amount", String(deal.capitalAsk));
    fetch(`/api/contacts/match?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setCoMatches(data.matches ?? []);
        if (data._mock) setCoMatchesMock(true);
      })
      .catch(() => {});
  }, [deal?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load diligence when tab is first activated
  useEffect(() => {
    if (tab !== "diligence" || !deal || diligenceLoaded) return;
    setDiligenceLoaded(true);
    fetch(`/api/deals/${id}/diligence`)
      .then(r => r.json())
      .then(data => {
        if (data.diligenceData && Array.isArray((data.diligenceData as { items?: unknown[] }).items)) {
          setDiligenceItems((data.diligenceData as { items: DiligenceItem[] }).items);
        } else {
          const template = getTemplate(deal.sector);
          setDiligenceItems(template.map(t => ({ ...t, status: "pending" as const, notes: "" })));
        }
      })
      .catch(() => {
        const template = getTemplate(deal?.sector);
        setDiligenceItems(template.map(t => ({ ...t, status: "pending" as const, notes: "" })));
      });
  }, [tab, deal, id, diligenceLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save diligence (debounced 1s)
  useEffect(() => {
    if (!diligenceLoaded || diligenceItems.length === 0) return;
    const t = setTimeout(() => {
      fetch(`/api/deals/${id}/diligence`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ diligenceData: { items: diligenceItems } }),
      }).catch(() => {});
    }, 1000);
    return () => clearTimeout(t);
  }, [diligenceItems, diligenceLoaded, id]);

  // Load notes when tab is first activated
  useEffect(() => {
    if (tab !== "notes" || !deal || notesLoaded) return;
    fetch(`/api/deals/${id}/notes`)
      .then(r => r.json())
      .then(data => {
        setNotes(data.notes ?? []);
        setNotesLoaded(true);
      });
  }, [tab, deal, notesLoaded, id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function runDealFlow() {
    if (!deal) return;
    setRunningAnalysis(true);
    setAnalysisAck(null);
    setTab("analysis");
    try {
      const res = await fetch("/api/agents/deal-flow/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyId: deal.familyId,
          dealId: deal.id,
          context: {
            company: deal.company, sector: deal.sector, stage: deal.stage,
            status: deal.status, capitalAsk: deal.capitalAsk, valuation: deal.valuation,
            description: deal.description, sourceType: deal.sourceType, sourceContact: deal.sourceContact,
          },
          documentContent: docText || undefined,
        }),
      });
      if (!res.body) throw new Error("No stream");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() ?? "";
        for (const part of parts) {
          if (!part.startsWith("data: ")) continue;
          try {
            const p = JSON.parse(part.slice(6));
            if (p.type === "ack") setAnalysisAck(p.message);
            else if (p.type === "done") {
              setAnalysis(p.result ?? {});
              setAnalysisMock(p._mock === true);
              setRunningAnalysis(false);
            } else if (p.type === "error") {
              setRunningAnalysis(false);
            }
          } catch {}
        }
      }
    } catch {
      setRunningAnalysis(false);
    }
  }

  async function runICMemo() {
    if (!deal) return;
    setRunningMemo(true);
    setMemoAck(null);
    setTab("memo");
    try {
      const docs = docText ? [{ name: "Deal Document", content: docText }] : undefined;
      const res = await fetch("/api/agents/ic-memo/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyId: deal.familyId,
          dealId: deal.id,
          context: {
            company: deal.company, sector: deal.sector, stage: deal.stage,
            status: deal.status, capitalAsk: deal.capitalAsk, valuation: deal.valuation,
            description: deal.description, sourceType: deal.sourceType, sourceContact: deal.sourceContact,
          },
          documentContents: docs,
        }),
      });
      if (!res.body) throw new Error("No stream");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() ?? "";
        for (const part of parts) {
          if (!part.startsWith("data: ")) continue;
          try {
            const p = JSON.parse(part.slice(6));
            if (p.type === "ack") setMemoAck(p.message);
            else if (p.type === "done") {
              setIcMemo(p.result ?? {});
              setMemoMock(p._mock === true);
              setRunningMemo(false);
            } else if (p.type === "error") {
              setRunningMemo(false);
            }
          } catch {}
        }
      }
    } catch {
      setRunningMemo(false);
    }
  }

  async function runTermSheet() {
    if (!deal || termRunning) return;
    const validSheets = termSheets.filter((s) => s.content.trim());
    if (!validSheets.length) return;
    setTermRunning(true);
    setTermAck("Analyzing term sheets…");
    setTermResult(null);
    try {
      const res = await fetch("/api/agents/term-sheet/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyId: deal.familyId,
          dealId: deal.id,
          sheets: validSheets,
        }),
      });
      if (!res.body) throw new Error("No stream");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() ?? "";
        for (const part of parts) {
          if (!part.startsWith("data: ")) continue;
          try {
            const p = JSON.parse(part.slice(6));
            if (p.type === "ack") setTermAck(p.message);
            else if (p.type === "done") {
              setTermResult(p.result ?? null);
              setTermRunning(false);
            } else if (p.type === "error") {
              setTermRunning(false);
            }
          } catch {}
        }
      }
    } catch {
      setTermRunning(false);
    }
  }

  async function updateStatus(newStatus: string) {
    if (!deal || newStatus === deal.status) return;
    const prevStatus = deal.status;
    setDeal({ ...deal, status: newStatus });
    setSaving(true);
    try {
      const res = await fetch(`/api/deals/${deal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) setDeal({ ...deal, status: prevStatus });
    } catch {
      setDeal({ ...deal, status: prevStatus });
    } finally {
      setSaving(false);
    }
  }

  async function saveSources() {
    if (!deal) return;
    await fetch(`/api/deals/${deal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        website: sourceForm.website || null,
        linkedinUrl: sourceForm.linkedinUrl || null,
        crunchbaseUrl: sourceForm.crunchbaseUrl || null,
      }),
    });
    const updated = await fetch(`/api/deals/${deal.id}`).then((r) => r.json());
    if (updated.deal) {
      setDeal(updated.deal);
      setSourceForm({
        website: updated.deal.website ?? "",
        linkedinUrl: updated.deal.linkedinUrl ?? "",
        crunchbaseUrl: updated.deal.crunchbaseUrl ?? "",
      });
    }
    setSourceEditing(false);
  }

  async function addFounder(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = (fd.get("name") as string).trim();
    if (!name || !deal) return;
    const res = await fetch(`/api/deals/${deal.id}/founders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        title: (fd.get("title") as string) || undefined,
        linkedinUrl: (fd.get("linkedinUrl") as string) || undefined,
      }),
    });
    const data = await res.json();
    if (data.founder) { setFounders((f) => [...f, data.founder as Founder]); setShowAddFounder(false); }
  }

  async function removeFounder(founderId: string) {
    if (!deal) return;
    await fetch(`/api/deals/${deal.id}/founders/${founderId}`, { method: "DELETE" });
    setFounders((f) => f.filter((x) => x.id !== founderId));
  }

  async function createSpvFromDeal(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!deal) return;
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/spv", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        familyId: deal.familyId,
        dealId: deal.id,
        name: fd.get("name") as string,
        spvType: fd.get("spvType") as string,
        investmentType: fd.get("investmentType") as string,
        targetRaise: parseFloat(fd.get("targetRaise") as string) || undefined,
        managementFee: parseFloat(fd.get("managementFee") as string) || 2,
        carry: parseFloat(fd.get("carry") as string) || 20,
      }),
    });
    const data = await res.json();
    if (data.spv) {
      setSpvs(s => [...s, data.spv]);
      setShowCreateSpv(false);
    }
  }

  async function launchSpv(spvId: string) {
    setLaunchingSpv(spvId);
    try {
      const res = await fetch(`/api/spv/${spvId}/launch`, { method: "POST" });
      const data = await res.json();
      if (data.launched) {
        // Refresh SPVs list
        const spvRes = await fetch(`/api/spv?familyId=${deal!.familyId}&dealId=${deal!.id}`);
        const spvData = await spvRes.json();
        setSpvs(spvData.spvs ?? []);
      }
    } catch { /* silently fail */ }
    finally { setLaunchingSpv(null); }
  }

  async function runEnrichment() {
    if (!deal || enriching) return;
    setEnriching(true);
    setEnrichProgress("Starting enrichment…");

    const res = await fetch(`/api/deals/${deal.id}/enrich/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        familyId: deal.familyId,
        context: {
          company: deal.company,
          sector: deal.sector,
          stage: deal.stage,
          description: deal.description,
          website: deal.website,
          linkedinUrl: deal.linkedinUrl,
          crunchbaseUrl: deal.crunchbaseUrl,
        },
      }),
    });

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buf = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        try {
          const evt = JSON.parse(line.slice(6)) as { type: string; message?: string; result?: EnrichmentResult };
          if (evt.type === "ack" || evt.type === "progress") setEnrichProgress(evt.message ?? "");
          if (evt.type === "done") {
            setEnrichment(evt.result as EnrichmentResult);
            setEnriching(false);
            setEnrichProgress("");
            // Reload deal to get updated scores
            const updated = await fetch(`/api/deals/${deal.id}`).then((r) => r.json());
            if (updated.deal) setDeal(updated.deal as Deal);
          }
          if (evt.type === "error") {
            setEnriching(false);
            setEnrichProgress("");
          }
        } catch {}
      }
    }
  }

  async function runDiligence() {
    if (!deal) return;
    setDiligenceRunning(true);
    setDiligenceAck("Analyzing deal for diligence responses…");
    try {
      const res = await fetch("/api/agents/diligence/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyId: deal.familyId,
          context: {
            company: deal.company, sector: deal.sector, stage: deal.stage,
            description: deal.description, capitalAsk: deal.capitalAsk, valuation: deal.valuation,
            affinityScore: deal.affinityScore, riskScore: deal.riskScore, fundabilityScore: deal.fundabilityScore,
          },
          items: diligenceItems.map(i => ({ id: i.id, category: i.category, question: i.question })),
        }),
      });
      const reader = res.body?.getReader();
      const dec = new TextDecoder();
      if (!reader) return;
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          const raw = line.startsWith("data: ") ? line.slice(6) : null;
          if (!raw) continue;
          try {
            const event = JSON.parse(raw);
            if (event.type === "progress") setDiligenceAck(event.message);
            if (event.type === "done" && event.result) {
              const result = event.result as { items?: Array<{ id: string; answer?: string; status?: string; flag?: string }> };
              if (result.items) {
                setDiligenceItems(prev => prev.map(item => {
                  const ai = result.items!.find(r => r.id === item.id);
                  if (!ai) return item;
                  return { ...item, aiAnswer: ai.answer, status: (ai.status as DiligenceItem["status"]) ?? item.status, aiFlag: ai.flag };
                }));
              }
            }
          } catch {}
        }
      }
    } finally {
      setDiligenceRunning(false);
      setDiligenceAck(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full" style={{ color: "var(--text-muted)" }}>
        <Loader2 size={20} className="animate-spin mr-2" /> Loading deal...
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="flex items-center justify-center h-full text-sm" style={{ color: "var(--text-muted)" }}>
        Deal not found.{" "}
        <Link href="/opportunities" className="ml-2 underline" style={{ color: "var(--accent)" }}>Back to pipeline</Link>
      </div>
    );
  }

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "overview", label: "Overview", icon: <Building2 size={13} /> },
    { key: "analysis", label: "Deal Analysis", icon: <Bot size={13} /> },
    { key: "memo", label: "IC Memo", icon: <FileText size={13} /> },
    { key: "terms", label: "Terms", icon: <Scale size={13} /> },
    { key: "diligence", label: "Diligence", icon: <CheckSquare size={13} /> },
    { key: "notes", label: "Notes", icon: <StickyNote size={13} /> },
  ];

  const scoreCards: Array<{ label: string; value: number; color: string; inverted?: boolean }> = [
    { label: "Affinity Score", value: enrichment?.affinityScore ?? deal.affinityScore ?? 0, color: "var(--accent)" },
    { label: "Fundability", value: enrichment?.fundabilityScore ?? deal.fundabilityScore ?? 0, color: "#10b981" },
    { label: "Risk Score", value: enrichment?.riskScore ?? deal.riskScore ?? 0, color: "#ef4444", inverted: true },
  ];

  const severityVariant: Record<string, "danger" | "warning" | "muted"> = {
    high: "danger",
    medium: "warning",
    low: "muted",
  };

  function fmtCheck(min?: number | null, max?: number | null): string {
    if (!min && !max) return "";
    const fmt = (n: number) =>
      n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(0)}M` : `$${(n / 1_000).toFixed(0)}K`;
    if (min && max) return `${fmt(min)}–${fmt(max)}`;
    if (min) return `${fmt(min)}+`;
    return `up to ${fmt(max!)}`;
  }

  function matchDot(score: number) {
    if (score >= 8) return "#10b981";
    if (score >= 5) return "#f59e0b";
    return "var(--text-muted)";
  }

  return (
    <div className="flex flex-col h-full">
      {/* Back + Header */}
      <div className="px-8 pt-6 pb-4 flex-shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
        <Link
          href="/opportunities"
          className="flex items-center gap-1 text-xs mb-4 w-fit"
          style={{ color: "var(--text-muted)" }}
        >
          <ChevronLeft size={13} /> Pipeline
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>{deal.company}</h1>
              {/* Status selector */}
              <div className="flex items-center gap-1.5">
                <select
                  value={deal.status}
                  onChange={(e) => updateStatus(e.target.value)}
                  disabled={saving}
                  style={{
                    background: "var(--bg-elevated)",
                    color: statusVariant[deal.status] === "accent" ? "var(--accent)"
                      : statusVariant[deal.status] === "warning" ? "#f59e0b"
                      : statusVariant[deal.status] === "success" ? "#10b981"
                      : "var(--text-muted)",
                    border: "1px solid var(--border)",
                    borderRadius: "3px",
                    fontSize: "10px",
                    fontWeight: 500,
                    letterSpacing: "0.03em",
                    padding: "1px 20px 1px 6px",
                    cursor: "pointer",
                    appearance: "auto",
                    outline: "none",
                    opacity: saving ? 0.6 : 1,
                  }}
                >
                  {SELECTABLE_STATUSES.map((s) => (
                    <option key={s} value={s}>{statusLabel[s]}</option>
                  ))}
                  {!SELECTABLE_STATUSES.includes(deal.status as typeof SELECTABLE_STATUSES[number]) && (
                    <option value={deal.status} disabled>{statusLabel[deal.status] ?? deal.status}</option>
                  )}
                </select>
                {saving && <Loader2 size={11} className="animate-spin" style={{ color: "var(--text-muted)" }} />}
                {saving && <span className="text-xs" style={{ color: "var(--text-muted)" }}>Saving...</span>}
              </div>
              {deal.stage && <Badge label={deal.stage.replace(/-/g, " ")} variant="muted" size="xs" />}
            </div>
            {deal.sector && (
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{deal.sector}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {deal.dealScore && <ScoreRing score={deal.dealScore} size={40} />}
            <button
              onClick={runDealFlow}
              disabled={runningAnalysis}
              className="flex items-center gap-1.5 px-3 py-2 rounded text-xs font-medium transition-opacity disabled:opacity-50"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              {runningAnalysis ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
              Analyze
            </button>
            <button
              onClick={runICMemo}
              disabled={runningMemo}
              className="flex items-center gap-1.5 px-3 py-2 rounded text-xs font-medium transition-opacity disabled:opacity-50"
              style={{ background: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
            >
              {runningMemo ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />}
              IC Memo
            </button>
          </div>
        </div>

        {/* Quick stats */}
        <div className="flex items-center gap-6 mt-4 flex-wrap">
          {deal.capitalAsk && (
            <div className="flex items-center gap-1.5 text-sm" style={{ color: "var(--text-secondary)" }}>
              <DollarSign size={13} style={{ color: "var(--text-muted)" }} />
              {formatCurrency(deal.capitalAsk)} ask
            </div>
          )}
          {deal.valuation && (
            <div className="flex items-center gap-1.5 text-sm" style={{ color: "var(--text-secondary)" }}>
              <Tag size={13} style={{ color: "var(--text-muted)" }} />
              {formatCurrency(deal.valuation)} valuation
            </div>
          )}
          {deal.sourceContact && (
            <div className="flex items-center gap-1.5 text-sm" style={{ color: "var(--text-secondary)" }}>
              <User size={13} style={{ color: "var(--text-muted)" }} />
              via {deal.sourceContact}
            </div>
          )}
          {deal.createdAt && (
            <div className="flex items-center gap-1.5 text-sm" style={{ color: "var(--text-muted)" }}>
              <Calendar size={13} />
              Added {formatDate(deal.createdAt)}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-8 py-0 flex-shrink-0" style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-surface)" }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex items-center gap-1.5 px-3 py-3 text-xs font-medium transition-colors border-b-2"
            style={tab === t.key
              ? { color: "var(--accent)", borderColor: "var(--accent)" }
              : { color: "var(--text-muted)", borderColor: "transparent" }
            }
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        {tab === "overview" && (
          <div className="p-8 max-w-4xl">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {/* Deal Details */}
              <div className="md:col-span-2 space-y-5">

                {/* Enrichment Score Cards — shown when scores exist */}
                {(enrichment || deal.affinityScore != null) && (
                  <div className="grid grid-cols-3 gap-4">
                    {scoreCards.map(({ label, value, color, inverted }) => (
                      <div
                        key={label}
                        className="rounded-lg border p-4 flex items-center gap-3"
                        style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
                      >
                        <div
                          className="flex items-center justify-center rounded-full flex-shrink-0"
                          style={{
                            width: 48,
                            height: 48,
                            background: `${color}18`,
                            border: `2px solid ${color}40`,
                          }}
                        >
                          <span
                            className="text-lg font-bold"
                            style={{ color, fontVariantNumeric: "tabular-nums" }}
                          >
                            {value}
                          </span>
                        </div>
                        <div>
                          <div className="text-xs font-medium tracking-wider uppercase" style={{ color: "var(--text-muted)" }}>{label}</div>
                          {inverted && (
                            <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>higher = more risk</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {deal.description && (
                  <div className="p-4 rounded-lg" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
                    <div className="text-xs font-semibold tracking-wide uppercase mb-2" style={{ color: "var(--text-muted)" }}>Description</div>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{deal.description}</p>
                  </div>
                )}

                {/* Data Sources & Enrichment */}
                <div className="p-4 rounded-lg" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-xs font-semibold tracking-wide uppercase" style={{ color: "var(--text-muted)" }}>
                      Data Sources & Enrichment
                    </div>
                    <button
                      onClick={() => setSourceEditing((v) => !v)}
                      className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors"
                      style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
                    >
                      {sourceEditing ? <X size={11} /> : <Pencil size={11} />}
                      {sourceEditing ? "Cancel" : "Edit"}
                    </button>
                  </div>

                  {/* URL fields */}
                  <div className="space-y-2 mb-4">
                    {sourceEditing ? (
                      <>
                        <div className="flex items-center gap-2">
                          <Globe size={13} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                          <input
                            type="url"
                            placeholder="https://company.com"
                            value={sourceForm.website}
                            onChange={(e) => setSourceForm((f) => ({ ...f, website: e.target.value }))}
                            className="flex-1 rounded px-2.5 py-1.5 text-xs outline-none"
                            style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Link2 size={13} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                          <input
                            type="url"
                            placeholder="https://linkedin.com/company/..."
                            value={sourceForm.linkedinUrl}
                            onChange={(e) => setSourceForm((f) => ({ ...f, linkedinUrl: e.target.value }))}
                            className="flex-1 rounded px-2.5 py-1.5 text-xs outline-none"
                            style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp size={13} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                          <input
                            type="url"
                            placeholder="https://crunchbase.com/organization/..."
                            value={sourceForm.crunchbaseUrl}
                            onChange={(e) => setSourceForm((f) => ({ ...f, crunchbaseUrl: e.target.value }))}
                            className="flex-1 rounded px-2.5 py-1.5 text-xs outline-none"
                            style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
                          />
                        </div>
                        <button
                          onClick={saveSources}
                          className="mt-1 px-3 py-1.5 rounded text-xs font-medium"
                          style={{ background: "var(--accent)", color: "#fff" }}
                        >
                          Save Sources
                        </button>
                      </>
                    ) : (
                      <>
                        {[
                          { icon: <Globe size={13} />, label: "Website", value: deal.website },
                          { icon: <Link2 size={13} />, label: "LinkedIn", value: deal.linkedinUrl },
                          { icon: <TrendingUp size={13} />, label: "Crunchbase", value: deal.crunchbaseUrl },
                        ].map(({ icon, label, value }) => (
                          <div key={label} className="flex items-center gap-2">
                            <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>{icon}</span>
                            <span className="text-xs w-20 flex-shrink-0" style={{ color: "var(--text-muted)" }}>{label}</span>
                            {value ? (
                              <a
                                href={value}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs truncate max-w-xs hover:underline"
                                style={{ color: "var(--accent)" }}
                              >
                                {value}
                              </a>
                            ) : (
                              <span className="text-xs" style={{ color: "var(--border)" }}>—</span>
                            )}
                          </div>
                        ))}
                      </>
                    )}
                  </div>

                  {/* Founders */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-medium tracking-wider uppercase" style={{ color: "var(--text-muted)" }}>Founders</div>
                      <button
                        onClick={() => setShowAddFounder((v) => !v)}
                        className="flex items-center gap-1 px-2 py-1 rounded text-xs"
                        style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
                      >
                        {showAddFounder ? <X size={11} /> : <Plus size={11} />}
                        {showAddFounder ? "Cancel" : "Add"}
                      </button>
                    </div>

                    {founders.length > 0 && (
                      <div className="space-y-1.5 mb-2">
                        {founders.map((f) => (
                          <div
                            key={f.id}
                            className="flex items-center gap-2 py-1.5 px-2 rounded"
                            style={{ background: "var(--bg-surface)" }}
                          >
                            <div className="flex-1 flex items-center gap-2 min-w-0">
                              <span className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{f.name}</span>
                              {f.title && <span className="text-xs flex-shrink-0" style={{ color: "var(--text-muted)" }}>{f.title}</span>}
                              {f.linkedinUrl && (
                                <a
                                  href={f.linkedinUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-shrink-0 hover:opacity-70"
                                  style={{ color: "var(--accent)" }}
                                >
                                  <Link2 size={11} />
                                </a>
                              )}
                            </div>
                            <button
                              onClick={() => removeFounder(f.id)}
                              className="flex-shrink-0 hover:opacity-70"
                              style={{ color: "var(--text-muted)" }}
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {founders.length === 0 && !showAddFounder && (
                      <p className="text-xs" style={{ color: "var(--border)" }}>No founders added yet.</p>
                    )}

                    {showAddFounder && (
                      <form onSubmit={addFounder} className="space-y-2 p-3 rounded" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
                        <input
                          name="name"
                          required
                          placeholder="Full name"
                          className="w-full rounded px-2.5 py-1.5 text-xs outline-none"
                          style={{ background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
                        />
                        <input
                          name="title"
                          placeholder="Title (e.g. CEO)"
                          className="w-full rounded px-2.5 py-1.5 text-xs outline-none"
                          style={{ background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
                        />
                        <input
                          name="linkedinUrl"
                          type="url"
                          placeholder="LinkedIn URL (optional)"
                          className="w-full rounded px-2.5 py-1.5 text-xs outline-none"
                          style={{ background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
                        />
                        <button
                          type="submit"
                          className="px-3 py-1.5 rounded text-xs font-medium"
                          style={{ background: "var(--accent)", color: "#fff" }}
                        >
                          Add Founder
                        </button>
                      </form>
                    )}
                  </div>

                  {/* Enrich button */}
                  <div className="flex items-center gap-3 pt-1" style={{ borderTop: "1px solid var(--border)" }}>
                    <button
                      onClick={runEnrichment}
                      disabled={enriching}
                      className="flex items-center gap-1.5 px-3 py-2 rounded text-xs font-medium disabled:opacity-50 transition-opacity"
                      style={{ background: "var(--accent)", color: "#fff" }}
                    >
                      {enriching ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                      Enrich Deal
                    </button>
                    {enrichProgress && (
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>{enrichProgress}</span>
                    )}
                    {deal.enrichedAt && !enriching && (
                      <span className="text-xs ml-auto" style={{ color: "var(--text-muted)" }}>
                        Last enriched {formatDate(deal.enrichedAt)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Risk Factors — shown after enrichment */}
                {enrichment && enrichment.riskFactors.length > 0 && (
                  <div className="p-4 rounded-lg" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle size={13} style={{ color: "#ef4444" }} />
                      <div className="text-xs font-semibold tracking-wide uppercase" style={{ color: "var(--text-muted)" }}>Risk Factors</div>
                    </div>
                    <div className="space-y-2">
                      {enrichment.riskFactors.map((rf, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 py-2"
                          style={{ borderBottom: i < enrichment.riskFactors.length - 1 ? "1px solid var(--border)" : "none" }}
                        >
                          <Badge label={rf.severity} variant={severityVariant[rf.severity] ?? "muted"} size="xs" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium mb-0.5" style={{ color: "var(--text-primary)" }}>{rf.factor}</div>
                            <div className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>{rf.description}</div>
                            {rf.source && (
                              <div className="text-xs mt-0.5" style={{ color: "var(--border)" }}>Source: {rf.source}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Fundability Factors — shown after enrichment */}
                {enrichment && enrichment.fundabilityFactors.length > 0 && (
                  <div className="p-4 rounded-lg" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
                    <div className="text-xs font-semibold tracking-wide uppercase mb-3" style={{ color: "var(--text-muted)" }}>Fundability Signals</div>
                    <div className="space-y-1.5">
                      {enrichment.fundabilityFactors.map((ff, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span
                            className="text-xs flex-shrink-0 mt-0.5"
                            style={{ color: ff.impact === "positive" ? "#10b981" : "#ef4444" }}
                          >
                            {ff.impact === "positive" ? "+" : "−"}
                          </span>
                          <div>
                            <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{ff.factor}</span>
                            {ff.description && (
                              <span className="text-xs ml-1.5" style={{ color: "var(--text-muted)" }}>{ff.description}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Paste pitch deck text */}
                <div className="p-4 rounded-lg" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
                  <div className="text-xs font-semibold tracking-wide uppercase mb-2" style={{ color: "var(--text-muted)" }}>Document / Pitch Deck Text</div>
                  <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>
                    Paste pitch deck or memo text here — it will be passed to the AI agents for richer analysis.
                  </p>
                  <textarea
                    value={docText}
                    onChange={(e) => setDocText(e.target.value)}
                    placeholder="Paste pitch deck text, executive summary, or any deal materials..."
                    rows={8}
                    className="w-full rounded text-xs p-3 resize-none outline-none"
                    style={{
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border)",
                      color: "var(--text-secondary)",
                      fontFamily: "inherit",
                    }}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {docText.length > 0 ? `${docText.length.toLocaleString()} chars` : "No document added"}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={runDealFlow}
                        disabled={runningAnalysis}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium disabled:opacity-50"
                        style={{ background: "var(--accent)", color: "#fff" }}
                      >
                        {runningAnalysis ? <Loader2 size={11} className="animate-spin" /> : <Zap size={11} />}
                        Run Analysis
                      </button>
                      <button
                        onClick={runICMemo}
                        disabled={runningMemo}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium disabled:opacity-50"
                        style={{ background: "var(--bg-surface)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
                      >
                        {runningMemo ? <Loader2 size={11} className="animate-spin" /> : <FileText size={11} />}
                        Generate IC Memo
                      </button>
                    </div>
                  </div>
                </div>

                {/* Prior analyses */}
                {deal.aiAnalyses && deal.aiAnalyses.length > 0 && (
                  <div className="p-4 rounded-lg" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
                    <div className="text-xs font-semibold tracking-wide uppercase mb-3" style={{ color: "var(--text-muted)" }}>Analysis History</div>
                    <div className="space-y-2">
                      {deal.aiAnalyses.map((a) => (
                        <div key={a.id} className="flex items-center justify-between text-xs py-2" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                          <div className="flex items-center gap-2">
                            <Bot size={12} style={{ color: "var(--text-muted)" }} />
                            <span style={{ color: "var(--text-secondary)" }}>
                              {a.agentType === "deal-flow" ? "Deal Flow Analysis" : a.agentType === "ic-memo" ? "IC Memo" : a.agentType}
                            </span>
                          </div>
                          <span style={{ color: "var(--text-muted)" }}>{formatDate(a.createdAt)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar metadata */}
              <div className="space-y-4">
                {[
                  { label: "Sector", value: deal.sector },
                  { label: "Stage", value: deal.stage?.replace(/-/g, " ") },
                  { label: "Status", value: statusLabel[deal.status] ?? deal.status },
                  { label: "Capital Ask", value: deal.capitalAsk ? formatCurrency(deal.capitalAsk) : undefined },
                  { label: "Valuation", value: deal.valuation ? formatCurrency(deal.valuation) : undefined },
                  { label: "Source Type", value: deal.sourceType?.replace(/-/g, " ") },
                  { label: "Source Contact", value: deal.sourceContact },
                  { label: "Added", value: deal.createdAt ? formatDate(deal.createdAt) : undefined },
                ].filter((f) => f.value).map((f) => (
                  <div key={f.label}>
                    <div className="text-xs mb-0.5" style={{ color: "var(--text-muted)" }}>{f.label}</div>
                    <div className="text-sm capitalize" style={{ color: "var(--text-secondary)" }}>{f.value}</div>
                  </div>
                ))}

                {/* Co-Investor Matches */}
                <div
                  className="rounded-lg border overflow-hidden"
                  style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
                >
                  <button
                    onClick={() => setCoMatchesExpanded((v) => !v)}
                    className="w-full flex items-center justify-between px-3 py-2.5"
                    style={{ color: "var(--text-primary)" }}
                  >
                    <div className="flex items-center gap-2">
                      <Users size={12} style={{ color: "var(--accent)" }} />
                      <span className="text-xs font-semibold tracking-wide uppercase" style={{ color: "var(--text-muted)" }}>
                        Co-Investor Matches
                      </span>
                      {coMatchesMock && (
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--bg-elevated)", color: "var(--text-muted)", fontSize: "10px" }}>demo</span>
                      )}
                    </div>
                    {coMatchesExpanded
                      ? <ChevronUp size={12} style={{ color: "var(--text-muted)" }} />
                      : <ChevronDown size={12} style={{ color: "var(--text-muted)" }} />
                    }
                  </button>

                  {coMatchesExpanded && (
                    <div className="px-3 pb-3 space-y-2">
                      {coMatches.length === 0 ? (
                        <p className="text-xs py-2" style={{ color: "var(--text-muted)" }}>No matches found.</p>
                      ) : (
                        coMatches.slice(0, 3).map((m) => (
                          <div
                            key={m.id}
                            className="p-2.5 rounded-md border"
                            style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
                          >
                            <div className="flex items-start justify-between gap-1 mb-1">
                              <div className="min-w-0">
                                <div className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>{m.name}</div>
                                {m.company && (
                                  <div className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{m.company}</div>
                                )}
                              </div>
                              <span
                                className="flex-shrink-0 w-2 h-2 rounded-full mt-0.5"
                                style={{ background: matchDot(m.score), marginTop: "3px" }}
                                title={`Match score: ${m.score}`}
                              />
                            </div>

                            <div className="flex flex-wrap gap-1 mb-1.5">
                              {m.investorType && (
                                <Badge label={m.investorType.replace(/-/g, " ")} variant="accent" size="xs" />
                              )}
                              {m.assetClasses.slice(0, 3).map((cls) => (
                                <span
                                  key={cls}
                                  className="text-xs px-1.5 py-0.5 rounded"
                                  style={{ background: "var(--bg-surface)", color: "var(--text-muted)", border: "1px solid var(--border)", fontSize: "10px" }}
                                >
                                  {cls}
                                </span>
                              ))}
                            </div>

                            {fmtCheck(m.checkSizeMin, m.checkSizeMax) && (
                              <div className="text-xs mb-1.5" style={{ color: "var(--text-secondary)" }}>
                                {fmtCheck(m.checkSizeMin, m.checkSizeMax)}
                              </div>
                            )}

                            {m.linkedIn ? (
                              <a
                                href={m.linkedIn}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-medium hover:underline"
                                style={{ color: "var(--accent)" }}
                              >
                                Reach Out →
                              </a>
                            ) : (
                              <Link href={`/relationships`} className="text-xs font-medium hover:underline" style={{ color: "var(--accent)" }}>
                                View Contact →
                              </Link>
                            )}
                          </div>
                        ))
                      )}

                      <Link
                        href="/relationships"
                        className="block text-xs text-center pt-1 hover:underline"
                        style={{ color: "var(--text-muted)" }}
                      >
                        View all investors →
                      </Link>
                    </div>
                  )}
                </div>

                {/* Special Purpose Vehicles */}
                <div
                  className="rounded-lg border overflow-hidden"
                  style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
                >
                  <div className="flex items-center justify-between px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <Layers size={12} style={{ color: "var(--accent)" }} />
                      <span className="text-xs font-semibold tracking-wide uppercase" style={{ color: "var(--text-muted)" }}>
                        Special Purpose Vehicles
                      </span>
                    </div>
                    <button
                      onClick={() => setShowCreateSpv(true)}
                      className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors"
                      style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
                    >
                      <Plus size={11} /> {spvs.length > 0 ? "Add" : "Create SPV"}
                    </button>
                  </div>

                  <div className="px-3 pb-3">
                    {spvs.length === 0 ? (
                      <p className="text-xs py-1" style={{ color: "var(--text-muted)" }}>No SPVs for this deal.</p>
                    ) : (
                      <div className="space-y-2.5">
                        {spvs.map((spv) => (
                          <div
                            key={spv.id}
                            className="p-2.5 rounded-md border"
                            style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
                          >
                            <div className="flex items-center justify-between gap-1 mb-1.5">
                              <span className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>{spv.name}</span>
                              <Badge label={spv.status} variant={spvStatusVariant[spv.status] ?? "muted"} size="xs" />
                            </div>
                            <div className="text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>
                              {formatCurrency(spv.totalCommitted ?? 0)} / {spv.targetRaise ? formatCurrency(spv.targetRaise) : "—"}
                              {" · "}
                              {spv.investors?.length ?? 0} investor{(spv.investors?.length ?? 0) !== 1 ? "s" : ""}
                            </div>
                            {spv.sydecarUrl && (
                              <a
                                href={spv.sydecarUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-medium hover:underline block mb-1"
                                style={{ color: "var(--accent)" }}
                              >
                                View on Sydecar ↗
                              </a>
                            )}
                            {spv.status === "draft" && (
                              <button
                                onClick={() => launchSpv(spv.id)}
                                disabled={launchingSpv === spv.id}
                                className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium disabled:opacity-50 transition-opacity"
                                style={{ background: "var(--bg-surface)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
                              >
                                {launchingSpv === spv.id ? <Loader2 size={11} className="animate-spin" /> : <Zap size={11} />}
                                Launch to Sydecar
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "analysis" && (
          <div className="p-8 max-w-3xl">
            {runningAnalysis ? (
              <div className="flex flex-col gap-3 py-12">
                <div className="flex items-center gap-3" style={{ color: "var(--text-muted)" }}>
                  <Loader2 size={16} className="animate-spin flex-shrink-0" style={{ color: "var(--accent)" }} />
                  <span className="text-sm">
                    {analysisAck ?? "Starting Deal Flow Analysis…"}
                  </span>
                </div>
                {analysisAck && (
                  <div className="h-1 w-full rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{ background: "var(--accent)", width: "100%", animation: "indeterminate 2s linear infinite" }}
                    />
                  </div>
                )}
              </div>
            ) : analysis ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>Deal Flow Analysis</span>
                  <button
                    onClick={runDealFlow}
                    className="flex items-center gap-1 px-2.5 py-1 rounded text-xs"
                    style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
                  >
                    <RefreshCw size={11} /> Re-run
                  </button>
                </div>
                <DealAnalysisPanel output={analysis as Parameters<typeof DealAnalysisPanel>[0]["output"]} isMock={analysisMock} />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                <Bot size={36} style={{ color: "var(--text-muted)" }} />
                <div>
                  <p className="text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>No analysis yet</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>Run the Deal Flow agent to score this deal and surface risks and opportunities.</p>
                </div>
                <button
                  onClick={runDealFlow}
                  className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
                  style={{ background: "var(--accent)", color: "#fff" }}
                >
                  <Zap size={14} /> Run Deal Flow Analysis
                </button>
              </div>
            )}
          </div>
        )}

        {tab === "memo" && (
          <div className="p-8 max-w-3xl">
            {runningMemo ? (
              <div className="flex flex-col gap-3 py-12">
                <div className="flex items-center gap-3" style={{ color: "var(--text-muted)" }}>
                  <Loader2 size={16} className="animate-spin flex-shrink-0" style={{ color: "var(--accent)" }} />
                  <span className="text-sm">
                    {memoAck ?? "Starting IC Memo generation…"}
                  </span>
                </div>
                {memoAck && (
                  <div className="h-1 w-full rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{ background: "var(--accent)", width: "100%", animation: "indeterminate 2s linear infinite" }}
                    />
                  </div>
                )}
              </div>
            ) : icMemo ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>Investment Committee Memo</span>
                  <button
                    onClick={runICMemo}
                    className="flex items-center gap-1 px-2.5 py-1 rounded text-xs"
                    style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
                  >
                    <RefreshCw size={11} /> Regenerate
                  </button>
                </div>
                <ICMemoPanel output={icMemo as Parameters<typeof ICMemoPanel>[0]["output"]} isMock={memoMock} />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                <FileText size={36} style={{ color: "var(--text-muted)" }} />
                <div>
                  <p className="text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>No IC memo yet</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>Generate a full investment committee memo with SWOT, financials, team assessment, and recommendation.</p>
                </div>
                <button
                  onClick={runICMemo}
                  className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
                  style={{ background: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
                >
                  <FileText size={14} /> Generate IC Memo
                </button>
              </div>
            )}
          </div>
        )}

        {tab === "diligence" && (
          <div className="p-8 max-w-4xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Diligence Checklist</h2>
                {deal.sector && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: "var(--bg-elevated)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
                  >
                    {deal.sector}
                  </span>
                )}
              </div>
              <button
                onClick={runDiligence}
                disabled={diligenceRunning || diligenceItems.length === 0}
                className="flex items-center gap-1.5 px-3 py-2 rounded text-xs font-medium transition-opacity disabled:opacity-50"
                style={{ background: "var(--accent)", color: "#fff" }}
              >
                {diligenceRunning ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                Run AI Diligence
              </button>
            </div>

            {/* Progress summary */}
            {diligenceItems.length > 0 && (
              <div className="flex items-center gap-4 mb-5 text-xs" style={{ color: "var(--text-muted)" }}>
                <span>
                  <span style={{ color: "#10b981", fontWeight: 500 }}>
                    {diligenceItems.filter(i => i.status === "complete").length}
                  </span>
                  {" of "}
                  <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{diligenceItems.length}</span>
                  {" complete"}
                </span>
                {diligenceItems.filter(i => i.status === "flagged").length > 0 && (
                  <span className="flex items-center gap-1" style={{ color: "#ef4444" }}>
                    <AlertOctagon size={11} />
                    {diligenceItems.filter(i => i.status === "flagged").length} flagged
                  </span>
                )}
                {diligenceItems.filter(i => i.status === "in-progress").length > 0 && (
                  <span style={{ color: "#f59e0b" }}>
                    {diligenceItems.filter(i => i.status === "in-progress").length} in progress
                  </span>
                )}
              </div>
            )}

            {/* AI running progress */}
            {diligenceRunning && diligenceAck && (
              <div className="flex items-center gap-3 mb-5 p-3 rounded-lg" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
                <Loader2 size={13} className="animate-spin flex-shrink-0" style={{ color: "var(--accent)" }} />
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>{diligenceAck}</span>
              </div>
            )}

            {/* Items grouped by category */}
            {diligenceItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                <CheckSquare size={32} style={{ color: "var(--text-muted)" }} />
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading checklist…</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(
                  diligenceItems.reduce<Record<string, DiligenceItem[]>>((acc, item) => {
                    if (!acc[item.category]) acc[item.category] = [];
                    acc[item.category].push(item);
                    return acc;
                  }, {})
                ).map(([category, items]) => (
                  <div key={category}>
                    <div className="text-xs font-semibold tracking-wide uppercase mb-2" style={{ color: "var(--text-muted)" }}>
                      {category}
                    </div>
                    <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                      {items.map((item, idx) => {
                        const isExpanded = expandedDiligenceItems.has(item.id);
                        const statusDot: Record<DiligenceItem["status"], string> = {
                          pending: "var(--text-muted)",
                          "in-progress": "#f59e0b",
                          complete: "#10b981",
                          flagged: "#ef4444",
                        };
                        const statusLabel: Record<DiligenceItem["status"], string> = {
                          pending: "Pending",
                          "in-progress": "In Progress",
                          complete: "Complete",
                          flagged: "Flagged",
                        };
                        const cycleStatus = (current: DiligenceItem["status"]): DiligenceItem["status"] => {
                          const order: DiligenceItem["status"][] = ["pending", "in-progress", "complete", "flagged"];
                          return order[(order.indexOf(current) + 1) % order.length];
                        };
                        return (
                          <div
                            key={item.id}
                            style={{
                              background: idx % 2 === 0 ? "var(--bg-elevated)" : "var(--bg-surface)",
                              borderBottom: idx < items.length - 1 ? "1px solid var(--border)" : "none",
                            }}
                          >
                            <div
                              className="flex items-start gap-3 px-4 py-3 cursor-pointer"
                              onClick={() => setExpandedDiligenceItems(prev => {
                                const next = new Set(prev);
                                if (next.has(item.id)) next.delete(item.id);
                                else next.add(item.id);
                                return next;
                              })}
                            >
                              {/* Status dot */}
                              <span
                                className="flex-shrink-0 mt-1 rounded-full"
                                style={{ width: 8, height: 8, background: statusDot[item.status], display: "inline-block", marginTop: "5px" }}
                              />

                              {/* Question */}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{item.question}</p>
                                {item.aiAnswer && !isExpanded && (
                                  <p className="text-xs mt-1 truncate" style={{ color: "var(--text-muted)" }}>{item.aiAnswer}</p>
                                )}
                                {item.aiFlag && (
                                  <p className="text-xs mt-0.5" style={{ color: "#ef4444" }}>{item.aiFlag}</p>
                                )}
                              </div>

                              {/* Status badge (click to cycle) */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDiligenceItems(prev => prev.map(i =>
                                    i.id === item.id ? { ...i, status: cycleStatus(i.status) } : i
                                  ));
                                }}
                                className="flex-shrink-0 text-xs px-2 py-0.5 rounded font-medium transition-opacity hover:opacity-70"
                                style={{
                                  background: item.status === "complete" ? "#10b98120"
                                    : item.status === "flagged" ? "#ef444420"
                                    : item.status === "in-progress" ? "#f59e0b20"
                                    : "var(--bg-surface)",
                                  color: statusDot[item.status],
                                  border: `1px solid ${statusDot[item.status]}40`,
                                }}
                              >
                                {statusLabel[item.status]}
                              </button>

                              {/* Expand toggle */}
                              <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>
                                {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                              </span>
                            </div>

                            {/* Expanded: AI answer + notes */}
                            {isExpanded && (
                              <div className="px-4 pb-3 space-y-2">
                                {item.aiAnswer && (
                                  <div
                                    className="p-3 rounded text-xs leading-relaxed"
                                    style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
                                  >
                                    <div className="flex items-center gap-1.5 mb-1.5">
                                      <Bot size={10} style={{ color: "var(--accent)" }} />
                                      <span className="font-medium text-xs" style={{ color: "var(--accent)" }}>AI Finding</span>
                                    </div>
                                    {item.aiAnswer}
                                    {item.aiFlag && (
                                      <p className="mt-1.5 text-xs font-medium" style={{ color: "#ef4444" }}>
                                        Flag: {item.aiFlag}
                                      </p>
                                    )}
                                  </div>
                                )}
                                <textarea
                                  value={item.notes}
                                  onChange={(e) => setDiligenceItems(prev => prev.map(i =>
                                    i.id === item.id ? { ...i, notes: e.target.value } : i
                                  ))}
                                  onClick={(e) => e.stopPropagation()}
                                  placeholder="Add notes…"
                                  rows={3}
                                  className="w-full rounded text-xs p-2.5 resize-none outline-none"
                                  style={{
                                    background: "var(--bg-surface)",
                                    border: "1px solid var(--border)",
                                    color: "var(--text-secondary)",
                                    fontFamily: "inherit",
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create SPV Modal */}
        {showCreateSpv && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.5)" }}
            onClick={() => setShowCreateSpv(false)}
          >
            <div
              className="w-full max-w-md rounded-xl shadow-2xl p-6"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                  Create SPV from Deal
                </h2>
                <button
                  onClick={() => setShowCreateSpv(false)}
                  className="hover:opacity-70"
                  style={{ color: "var(--text-muted)" }}
                >
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={createSpvFromDeal} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                    SPV Name <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    name="name"
                    type="text"
                    required
                    defaultValue={`${deal.company} SPV`}
                    className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
                    style={{ background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                      SPV Type
                    </label>
                    <select
                      name="spvType"
                      defaultValue="Syndicate"
                      className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
                      style={{ background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                    >
                      <option value="Syndicate">Syndicate</option>
                      <option value="Fund">Fund</option>
                      <option value="Co-Invest">Co-Invest</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                      Investment Type
                    </label>
                    {deal.stage === "series-a" || deal.stage === "series-b" ? (
                      <input
                        name="investmentType"
                        type="text"
                        value="Equity"
                        readOnly
                        className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
                        style={{ background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-muted)" }}
                      />
                    ) : (
                      <select
                        name="investmentType"
                        defaultValue="SAFE"
                        className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
                        style={{ background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                      >
                        <option value="SAFE">SAFE</option>
                        <option value="Convertible Note">Convertible Note</option>
                        <option value="Equity">Equity</option>
                        <option value="Other">Other</option>
                      </select>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                    Target Raise ($)
                  </label>
                  <input
                    name="targetRaise"
                    type="number"
                    min="0"
                    step="1000"
                    defaultValue={deal.capitalAsk ?? ""}
                    placeholder="e.g. 2000000"
                    className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
                    style={{ background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                      Management Fee (%)
                    </label>
                    <input
                      name="managementFee"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      defaultValue={2}
                      className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
                      style={{ background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                      Carry (%)
                    </label>
                    <input
                      name="carry"
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      defaultValue={20}
                      className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
                      style={{ background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium"
                    style={{ background: "var(--accent)", color: "#fff" }}
                  >
                    <Layers size={14} /> Create SPV
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateSpv(false)}
                    className="px-4 py-2 rounded-md text-sm font-medium"
                    style={{ background: "var(--bg-surface)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {tab === "terms" && (
          <div className="p-8 max-w-5xl">
            {termRunning ? (
              /* ── Running state ── */
              <div className="flex flex-col gap-3 py-12">
                <div className="flex items-center gap-3" style={{ color: "var(--text-muted)" }}>
                  <Loader2 size={16} className="animate-spin flex-shrink-0" style={{ color: "var(--accent)" }} />
                  <span className="text-sm">{termAck ?? "Analyzing term sheets…"}</span>
                </div>
                {termAck && (
                  <div className="h-1 w-full rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{ background: "var(--accent)", width: "100%", animation: "indeterminate 2s linear infinite" }}
                    />
                  </div>
                )}
              </div>
            ) : termResult ? (
              /* ── Results view ── */
              <div className="space-y-6">
                {/* Header with re-analyze */}
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>Term Sheet Comparison</span>
                  <button
                    onClick={() => setTermResult(null)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded text-xs"
                    style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
                  >
                    <RefreshCw size={11} /> Re-analyze
                  </button>
                </div>

                {/* Sheet cards — side by side */}
                <div className="flex gap-4 flex-wrap">
                  {termResult.sheets.map((sheet) => {
                    const isFavorable = sheet.label === termResult.comparison.mostFavorable;
                    return (
                      <div
                        key={sheet.label}
                        className="flex-1 min-w-[280px] rounded-lg border p-5 space-y-4"
                        style={{
                          background: "var(--bg-elevated)",
                          borderColor: isFavorable ? "var(--accent)" : "var(--border)",
                        }}
                      >
                        {/* Sheet label + favorite badge */}
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                            {sheet.label}
                          </h3>
                          {isFavorable && (
                            <span
                              className="text-xs px-2 py-0.5 rounded-full font-medium"
                              style={{ background: "var(--accent)20", color: "var(--accent)", border: "1px solid var(--accent)40" }}
                            >
                              Most Favorable
                            </span>
                          )}
                        </div>

                        {/* Field grid */}
                        <div className="grid grid-cols-1 gap-2">
                          {[
                            { label: "Valuation", value: sheet.valuation },
                            { label: "Investment", value: sheet.investmentAmount },
                            { label: "Ownership", value: sheet.ownership },
                            { label: "Liquidation Pref", value: sheet.liquidationPref },
                            { label: "Anti-Dilution", value: sheet.antiDilution },
                            { label: "Board Seats", value: sheet.boardSeats },
                            { label: "Pro-Rata Rights", value: sheet.proRataRights },
                            { label: "Drag-Along", value: sheet.dragAlong },
                            { label: "Info Rights", value: sheet.informationRights },
                          ].map(({ label, value }) => (
                            <div key={label} className="flex gap-3 py-1.5" style={{ borderBottom: "1px solid var(--border)" }}>
                              <span className="text-xs w-32 flex-shrink-0 font-medium" style={{ color: "var(--text-muted)" }}>
                                {label}
                              </span>
                              <span className="text-sm flex-1" style={{ color: value ? "var(--text-secondary)" : "var(--border)" }}>
                                {value ?? "—"}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Closing conditions */}
                        {sheet.closingConditions.length > 0 && (
                          <div>
                            <div className="text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>
                              Closing Conditions
                            </div>
                            <ul className="space-y-1">
                              {sheet.closingConditions.map((c, i) => (
                                <li key={i} className="flex items-start gap-1.5">
                                  <span className="text-xs mt-0.5 flex-shrink-0" style={{ color: "var(--text-muted)" }}>·</span>
                                  <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{c}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Unusual terms */}
                        {sheet.unusualTerms.length > 0 && (
                          <div>
                            <div className="flex items-center gap-1.5 mb-2">
                              <AlertTriangle size={12} style={{ color: "#f59e0b" }} />
                              <div className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                                Non-Standard Terms
                              </div>
                            </div>
                            <div className="space-y-2">
                              {sheet.unusualTerms.map((ut, i) => (
                                <div
                                  key={i}
                                  className="p-2.5 rounded-md"
                                  style={{
                                    background: "var(--bg-surface)",
                                    border: `1px solid ${ut.severity === "high" ? "#ef444440" : ut.severity === "medium" ? "#f59e0b40" : "var(--border)"}`,
                                  }}
                                >
                                  <div className="flex items-center gap-2 mb-1">
                                    <span
                                      className="text-xs px-1.5 py-0.5 rounded font-medium"
                                      style={{
                                        background: ut.severity === "high" ? "#ef444420" : ut.severity === "medium" ? "#f59e0b20" : "var(--bg-elevated)",
                                        color: ut.severity === "high" ? "#ef4444" : ut.severity === "medium" ? "#f59e0b" : "var(--text-muted)",
                                      }}
                                    >
                                      {ut.severity}
                                    </span>
                                    <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{ut.term}</span>
                                  </div>
                                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{ut.flag}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Summary */}
                        {sheet.summary && (
                          <p className="text-xs leading-relaxed pt-1" style={{ color: "var(--text-muted)", borderTop: "1px solid var(--border)", paddingTop: "12px" }}>
                            {sheet.summary}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Comparison section */}
                <div className="space-y-4">
                  {/* Key differences */}
                  {termResult.comparison.keyDifferences.length > 0 && (
                    <div
                      className="p-4 rounded-lg"
                      style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
                    >
                      <div className="text-xs font-semibold tracking-wide uppercase mb-3" style={{ color: "var(--text-muted)" }}>
                        Key Differences
                      </div>
                      <ul className="space-y-2">
                        {termResult.comparison.keyDifferences.map((d, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-xs flex-shrink-0 mt-0.5" style={{ color: "var(--accent)" }}>·</span>
                            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{d}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Red flags */}
                  {termResult.comparison.redFlags.length > 0 && (
                    <div
                      className="p-4 rounded-lg"
                      style={{ background: "var(--bg-elevated)", border: "1px solid #ef444430" }}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle size={13} style={{ color: "#ef4444" }} />
                        <div className="text-xs font-semibold tracking-wide uppercase" style={{ color: "var(--text-muted)" }}>
                          Red Flags
                        </div>
                      </div>
                      <div className="space-y-0" style={{ border: "1px solid var(--border)", borderRadius: "6px", overflow: "hidden" }}>
                        <div
                          className="grid grid-cols-3 gap-3 px-3 py-2 text-xs font-medium"
                          style={{ background: "var(--bg-surface)", color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}
                        >
                          <span>Sheet</span>
                          <span>Term</span>
                          <span>Issue</span>
                        </div>
                        {termResult.comparison.redFlags.map((rf, i) => (
                          <div
                            key={i}
                            className="grid grid-cols-3 gap-3 px-3 py-2.5 text-xs"
                            style={{
                              color: "var(--text-secondary)",
                              borderBottom: i < termResult.comparison.redFlags.length - 1 ? "1px solid var(--border)" : "none",
                              background: i % 2 === 0 ? "var(--bg-elevated)" : "var(--bg-surface)",
                            }}
                          >
                            <span style={{ color: "var(--text-muted)" }}>{rf.sheet}</span>
                            <span className="font-medium" style={{ color: "var(--text-primary)" }}>{rf.term}</span>
                            <span>{rf.issue}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendation */}
                  {termResult.comparison.recommendation && (
                    <div
                      className="p-4 rounded-lg"
                      style={{ background: "var(--accent)0d", border: "1px solid var(--accent)30" }}
                    >
                      <div className="text-xs font-semibold tracking-wide uppercase mb-2" style={{ color: "var(--accent)" }}>
                        Recommendation
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>
                        {termResult.comparison.recommendation}
                      </p>
                      {termResult.comparison.mostFavorable && (
                        <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                          Most favorable: <span style={{ color: "var(--accent)" }}>{termResult.comparison.mostFavorable}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* ── Input view ── */
              <div className="space-y-5">
                <div>
                  <h2 className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                    Term Sheet Comparison
                  </h2>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Paste raw term sheet text below. The AI will extract structured fields, compare side-by-side, and flag non-market-standard terms.
                  </p>
                </div>

                {/* Sheet inputs */}
                <div className="flex gap-4 flex-wrap">
                  {termSheets.map((sheet, idx) => (
                    <div key={idx} className="flex-1 min-w-[260px] space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={sheet.label}
                          onChange={(e) =>
                            setTermSheets((prev) =>
                              prev.map((s, i) => i === idx ? { ...s, label: e.target.value } : s)
                            )
                          }
                          placeholder={`Term Sheet ${idx + 1}`}
                          className="flex-1 rounded px-2.5 py-1.5 text-xs font-medium outline-none"
                          style={{
                            background: "var(--bg-elevated)",
                            border: "1px solid var(--border)",
                            color: "var(--text-primary)",
                          }}
                        />
                        {termSheets.length > 1 && (
                          <button
                            onClick={() => setTermSheets((prev) => prev.filter((_, i) => i !== idx))}
                            className="flex-shrink-0 hover:opacity-70"
                            style={{ color: "var(--text-muted)" }}
                          >
                            <X size={13} />
                          </button>
                        )}
                      </div>
                      <textarea
                        value={sheet.content}
                        onChange={(e) =>
                          setTermSheets((prev) =>
                            prev.map((s, i) => i === idx ? { ...s, content: e.target.value } : s)
                          )
                        }
                        placeholder={`Paste ${sheet.label || `Term Sheet ${idx + 1}`} text here…`}
                        rows={14}
                        className="w-full rounded text-xs p-3 resize-none outline-none"
                        style={{
                          background: "var(--bg-elevated)",
                          border: "1px solid var(--border)",
                          color: "var(--text-secondary)",
                          fontFamily: "inherit",
                        }}
                      />
                      <div className="text-xs" style={{ color: "var(--border)" }}>
                        {sheet.content.length > 0 ? `${sheet.content.length.toLocaleString()} chars` : "Empty"}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={() =>
                      setTermSheets((prev) => [...prev, { label: `Term Sheet ${prev.length + 1}`, content: "" }])
                    }
                    className="flex items-center gap-1.5 px-3 py-2 rounded text-xs font-medium transition-opacity"
                    style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
                  >
                    <Plus size={12} /> Add Another Sheet
                  </button>
                  <button
                    onClick={runTermSheet}
                    disabled={termRunning || !termSheets.some((s) => s.content.trim())}
                    className="flex items-center gap-1.5 px-4 py-2 rounded text-xs font-medium transition-opacity disabled:opacity-50"
                    style={{ background: "var(--accent)", color: "#fff" }}
                  >
                    {termRunning ? <Loader2 size={12} className="animate-spin" /> : <Scale size={12} />}
                    Analyze Terms
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "notes" && (
          <div className="p-8 max-w-3xl">
            <div className="mb-6">
              <h2 className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Deal Notes</h2>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Private notes for this deal. Visible to your team only.
              </p>
            </div>

            {/* Add note form */}
            <div
              className="mb-6 rounded-lg p-4 space-y-3"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
            >
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add a note…"
                rows={3}
                className="w-full rounded text-sm p-3 resize-none outline-none"
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                  fontFamily: "inherit",
                  lineHeight: 1.6,
                }}
              />
              <div className="flex items-center justify-end">
                <button
                  disabled={noteSaving || !noteText.trim()}
                  onClick={async () => {
                    if (!noteText.trim()) return;
                    setNoteSaving(true);
                    try {
                      const res = await fetch(`/api/deals/${id}/notes`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ text: noteText.trim() }),
                      });
                      const data = await res.json();
                      if (data.note) {
                        setNotes((prev) => [data.note, ...prev]);
                        setNoteText("");
                      }
                    } catch {
                      // silently fail
                    } finally {
                      setNoteSaving(false);
                    }
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded text-xs font-medium transition-opacity disabled:opacity-40"
                  style={{ background: "var(--accent)", color: "#fff" }}
                >
                  {noteSaving ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}
                  Add Note
                </button>
              </div>
            </div>

            {/* Notes list */}
            {!notesLoaded ? (
              <div className="flex items-center gap-2 py-8 justify-center text-sm" style={{ color: "var(--text-muted)" }}>
                <Loader2 size={14} className="animate-spin" />
                Loading notes…
              </div>
            ) : notes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                <StickyNote size={32} style={{ color: "var(--text-muted)", opacity: 0.4 }} />
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>No notes yet. Add the first note above.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notes.map((note) => {
                  const text = (note.input as { text?: string }).text ?? "";
                  const author = (note.input as { authorLabel?: string }).authorLabel ?? "Team";
                  const created = new Date(note.createdAt);
                  const now = Date.now();
                  const diffMs = now - created.getTime();
                  const diffMin = Math.floor(diffMs / 60000);
                  const diffHr = Math.floor(diffMin / 60);
                  const diffDay = Math.floor(diffHr / 24);
                  const relTime = diffDay > 30
                    ? created.toLocaleDateString()
                    : diffDay > 0
                    ? `${diffDay}d ago`
                    : diffHr > 0
                    ? `${diffHr}h ago`
                    : diffMin > 0
                    ? `${diffMin}m ago`
                    : "just now";

                  return (
                    <div
                      key={note.id}
                      className="rounded-lg p-4"
                      style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
                    >
                      <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--text-primary)", whiteSpace: "pre-wrap" }}>
                        {text}
                      </p>
                      <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                        <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>{author}</span>
                        <span>·</span>
                        <span>{relTime}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
