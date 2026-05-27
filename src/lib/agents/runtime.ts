import Anthropic from "@anthropic-ai/sdk";
import { Prisma } from "@prisma/client";
import { AgentType } from "@/types";
import { prisma } from "@/lib/prisma";
import { buildSystemPrompt } from "./prompts";
import { parseActionTags, dispatchActions } from "./actions";

const API_KEY = process.env.ANTHROPIC_API_KEY;
const client = API_KEY ? new Anthropic({ apiKey: API_KEY }) : null;

const MOCK_OUTPUTS: Partial<Record<AgentType, Record<string, unknown>>> = {
  "deal-flow": {
    score: 81, recommendation: "pursue",
    summary: "Strong enterprise AI opportunity with 3.2x ARR growth, proven founder, and defensible compliance LLM moat. Recommend pursuing at the proposed terms.",
    risks: ["Customer concentration — top 3 = 67% ARR", "GTM complexity in regulated industries", "Well-funded incumbents entering space"],
    opportunities: ["Defense/FedRAMP market expansion", "Platform play across compliance verticals", "Potential strategic synergy with portfolio company ClearReg"],
    founderBackground: "Sarah Chen (CEO): ex-Palantir, Stanford CS, prior exit to Salesforce ($180M). Marcus Webb (CTO): ex-Two Sigma, MIT EECS.",
    comparables: ["Harvey AI", "Ironclad", "Compliance.ai"],
  },
  "ic-memo": {
    executiveSummary: "Meridian AI presents a compelling Series B opportunity in the enterprise compliance automation space with 3.2x ARR growth YoY and a proven founder. We recommend pursuing with a $12M check at the proposed $85M pre-money valuation.",
    companyOverview: "Meridian AI (founded 2022, San Francisco) builds vertical LLM infrastructure for enterprise compliance teams, automating regulatory monitoring, policy gap analysis, and audit preparation for Fortune 1000 clients.",
    marketOpportunity: "The global GRC software market is $50B+ growing at 14% CAGR. AI-native platforms are displacing legacy vendors (MetricStream, RSA Archer) rapidly as regulatory complexity accelerates.",
    businessModel: "SaaS: $180K–$450K ACV enterprise, $24K–$60K mid-market. NRR 138%. Gross Margin 74%.",
    financials: "ARR: $8.4M (grew from $2.6M). Burn: $420K/month. Runway: 22 months post-raise. LTV/CAC: 18x enterprise.",
    team: "Sarah Chen (CEO): ex-Palantir, Stanford CS, prior exit $180M. Marcus Webb (CTO): ex-Two Sigma quant, MIT EECS.",
    risks: [
      { category: "Concentration", description: "Top 3 customers = 67% of ARR", severity: "high" },
      { category: "Competition", description: "Well-funded incumbents and new AI entrants", severity: "medium" },
      { category: "GTM", description: "Enterprise sales cycles 6–12 months", severity: "medium" },
    ],
    opportunities: ["Defense/FedRAMP expansion", "ESG and privacy compliance adjacencies", "Portfolio synergy with ClearReg"],
    swot: {
      strengths: ["Deep founder domain expertise", "Strong NRR 138%", "Proprietary compliance LLM"],
      weaknesses: ["Customer concentration risk", "Early-stage sales team"],
      opportunities: ["Accelerating regulatory complexity", "Incumbent displacement"],
      threats: ["Well-capitalized new entrants", "Potential AI regulation headwinds"],
    },
    recommendation: "Pursue. Lead the $12M Series B at $85M pre-money with standard pro-rata provision.",
    nextSteps: ["Technical diligence call with CTO", "Customer reference calls", "Cap table and waterfall review", "Term sheet by EOW"],
  },
  "portfolio-monitor": {
    healthScore: 74, overallStatus: "monitor",
    summary: "Portfolio company is performing within expected range. Revenue growth on track at 2.1x YoY. One material risk: customer concentration remains high at 58% from top 2 accounts.",
    recommendation: "monitor",
    risks: ["Customer concentration: top 2 accounts = 58% ARR", "Competing product launch from Workiva announced last quarter"],
    opportunities: ["FedRAMP authorization in progress — opens $40B government market", "EU expansion pipeline with 3 LOIs signed"],
    keyMetrics: { arr: 12400000, arrGrowth: "2.1x YoY", grossMargin: "71%", burnRate: 420000 },
    alerts: [],
  },
  "cfo": {
    summary: "Current net liquidity across all entities stands at $43.2M, down 8% from last quarter primarily due to the Phalanx Series C capital call ($2M) and Q1 tax payment ($285K). Cash position remains healthy with 22+ months of operating runway.",
    liquidityStatus: "healthy",
    insights: [
      "Hartwell Cayman LP holds 51% of total liquidity — concentration risk if capital calls accelerate",
      "Q2 payables of $127.7K are manageable; largest item is E&Y tax prep ($85K due June 1)",
      "Terrace REIT dividend ($340K) partially offsets the capital call outflow this quarter",
    ],
    recommendations: [
      "Consider sweeping excess HW Operating Co cash ($3.95M) to higher-yield vehicle",
      "Schedule AP review before June 1 to prioritize E&Y payment",
      "Review Cayman LP concentration — consider rebalancing liquidity across entities",
    ],
    alerts: [],
  },
  "legal": {
    documentType: "SAFE Note",
    summary: "Standard Y Combinator SAFE with MFN clause and pro-rata rights. Two non-standard provisions flagged: overly broad IP assignment and unlimited liability clause in Section 7.",
    riskLevel: "medium",
    flags: [
      { clause: "Section 4.2 — IP Assignment", issue: "Scope extends to work outside employment that relates to company business. May capture pre-existing IP.", severity: "high" },
      { clause: "Section 7.1 — Indemnification", issue: "Unlimited indemnification with no cap. Standard practice caps at 2x investment.", severity: "medium" },
    ],
    keyTerms: { discount: "20%", valuationCap: "$50M", proRata: "Yes", mfn: "Yes", boardSeat: "No" },
    recommendation: "Negotiate Section 4.2 IP scope and cap the Section 7.1 indemnification before signing.",
  },
  "tax": {
    taxYear: 2025,
    summary: "Projected federal tax liability for 2025 is $2.1M–$2.4M. Three K-1s received; Arcadia Energy Fund II K-1 still pending. Recommend accelerating charitable contributions before year-end.",
    estimatedLiability: { federal: 2250000, state: 480000, total: 2730000 },
    k1Summary: [
      { entity: "Hartwell Cayman LP", income: 2840000, status: "received" },
      { entity: "Meridian AI SPV", income: -120000, status: "received" },
      { entity: "Arcadia Energy Fund II", income: null, status: "pending" },
    ],
    actionItems: [
      "Accelerate $500K charitable contribution before Dec 31 to reduce AGI",
      "Chase Arcadia Energy K-1 — 30-day late, contact GP",
      "Q2 estimated payment of $485K due June 16",
    ],
    deductionOpportunities: [
      "QOZ investment could defer ~$340K of capital gains",
      "Cost segregation on Hampton Estate — $180K accelerated depreciation",
    ],
  },
  "chief-of-staff": {
    acknowledgment: "Understood. I'll coordinate the request and provide a full action plan with timeline and cost estimate.",
    actionPlan: ["Confirm availability and logistics", "Arrange transportation and accommodations", "Coordinate catering and staff", "Send confirmation with itinerary"],
    timeline: "Confirmation within 2 hours. All bookings within 24h.",
    estimatedCost: "$8,000–$15,000 depending on selections",
    requiresApproval: false,
    followUpNeeded: ["Guest preferences", "Return timing"],
  },
  "concierge": {
    requestType: "lifestyle",
    summary: "Request received and queued for coordination.",
    steps: ["Confirm availability", "Make booking or reservation", "Send confirmation"],
    vendors: [],
    timeline: "24–48 hours",
    status: "in-progress",
  },
  "philanthropy": {
    summary: "The Hartwell Foundation has $1M in active grants across education, environment, and social justice. Impact is strong with 4,200 students reached through MIT AI literacy program.",
    impactHighlights: ["4,200 students reached through MIT AI literacy program", "18,000 acres of Amazon watershed protected"],
    recommendations: ["Consider additional $50K to Nature Conservancy given 12% deforestation increase", "Stanford GSB pledge acceleration offers ~$480K tax benefit in 2026"],
    upcomingObligations: [{ org: "Stanford GSB", amount: 500000, due: "2026-12-31" }],
    grantingCapacity: "Foundation corpus on track. Current year charitable deduction limit: $1.8M.",
  },
  "relationships": {
    answer: "You have 3 strong connections matching your query. Top connection is Jennifer Park at Sequoia Capital — last contact 4 weeks ago, introduced via LP meeting.",
    contacts: ["Jennifer Park", "David Kwon", "Amanda Torres"],
    suggestedActions: ["Schedule coffee with Jennifer Park — last contact was 4 weeks ago", "Ask Amanda Torres for a warm intro through her network", "Follow up on open co-investment discussion"],
    connectionPaths: [],
    openItems: [],
    suggestions: [],
  },
  "deal-enrichment": {
    affinityScore: 72, riskScore: 45, fundabilityScore: 68,
    riskFactors: [
      { factor: "Customer concentration", severity: "high", description: "Top 3 customers represent majority of ARR", source: "deal-data" },
      { factor: "Competitive pressure", severity: "medium", description: "Well-funded incumbents with larger sales teams", source: "crunchbase" },
    ],
    fundabilityFactors: [
      { factor: "Strong founder track record", impact: "positive", description: "Prior successful exit increases fundability" },
      { factor: "High NRR", impact: "positive", description: "138% NRR signals strong product-market fit" },
    ],
    founderSignals: [{ name: "Sarah Chen", signals: ["Prior exit to Salesforce $180M", "ex-Palantir FedRAMP product lead"] }],
    webSignals: { websiteQuality: "professional", techStack: ["React", "Python", "AWS"], teamPagePresence: true, pressOrMedia: ["TechCrunch", "Forbes"] },
    summary: "Strong signals across founder background and product traction. Primary risk is customer concentration. Recommend pursuing with standard diligence.",
  },
  "term-sheet": {
    sheets: [{
      label: "Term Sheet 1",
      valuation: "$85M pre-money",
      investmentAmount: "$12M",
      ownership: "12.4%",
      liquidationPref: "1x non-participating",
      antiDilution: "Broad-based weighted average",
      boardSeats: "1 investor seat",
      proRataRights: "Yes — pro-rata on next priced round",
      dragAlong: "Standard majority drag",
      informationRights: "Standard quarterly financials",
      closingConditions: ["Completion of legal diligence", "Board approval"],
      unusualTerms: [],
      summary: "Clean, founder-friendly terms. Recommend proceeding.",
    }],
    comparison: { mostFavorable: "Term Sheet 1", keyDifferences: [], redFlags: [], recommendation: "Proceed with Term Sheet 1 — standard terms, no red flags." },
  },
  "diligence": {
    items: [
      { id: "1", answer: "ARR growth is 3.2x YoY — above 100% threshold.", status: "complete" },
      { id: "2", answer: "Top 3 customers = 67% of ARR — concentration risk flagged.", status: "flagged", flag: "High customer concentration" },
    ],
    summary: "Strong fundamentals with one critical risk: customer concentration. 8 of 10 diligence items pass; 2 require follow-up.",
    redFlags: ["Top 3 customers represent 67% of ARR"],
    passItems: ["ARR growth >100%", "Founder prior exit verified", "IP assignment clean", "No known litigation"],
  },
};

export interface AgentInput {
  agentType: AgentType;
  familyId: string;
  context: Record<string, unknown>;
  documents?: { name: string; content: string }[];
  systemPromptOverride?: string;
  modelOverride?: string;
  maxTokensOverride?: number;
}

export interface AgentOutput {
  result: Record<string, unknown>;
  reasoning?: string;
  tokensUsed?: number;
  model: string;
}

const MODEL_DEEP = "claude-opus-4-7";
const MODEL_FAST = "claude-haiku-4-5-20251001";

const DEEP_ANALYSIS_AGENTS = new Set<AgentType>([
  "deal-flow", "ic-memo", "portfolio-monitor", "legal", "tax", "cfo", "deal-enrichment", "term-sheet", "diligence",
]);

function getModel(agentType: AgentType): string {
  return DEEP_ANALYSIS_AGENTS.has(agentType) ? MODEL_DEEP : MODEL_FAST;
}

function parseAgentText(text: string): Record<string, unknown> {
  try {
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) ?? text.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch?.[1] ?? jsonMatch?.[0] ?? text);
  } catch {
    return { raw: text };
  }
}

export async function runAgent(input: AgentInput): Promise<AgentOutput> {
  const { agentType, familyId, context, documents, systemPromptOverride, modelOverride, maxTokensOverride } = input;

  if (!client) {
    const mock = MOCK_OUTPUTS[agentType] ?? { raw: "Mock output — set ANTHROPIC_API_KEY for real AI responses." };
    return { result: mock, model: "mock", tokensUsed: 0 };
  }

  const systemPrompt = systemPromptOverride ?? buildSystemPrompt(agentType, context);
  const userContent = buildUserContent(agentType, context, documents);
  const model = modelOverride ?? getModel(agentType);
  const maxTokens = maxTokensOverride ?? 4096;

  let runId: string | undefined;
  try {
    const run = await prisma.agentRun.create({
      data: {
        familyId,
        agentType,
        status: "running",
        input: context as Prisma.InputJsonValue,
        startedAt: new Date(),
      },
    });
    runId = run.id;
  } catch {
    // DB unavailable — continue without persistence
  }

  try {
    const response = await client.messages.create({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: userContent }],
    });

    const text = response.content.find((b) => b.type === "text")?.text ?? "";
    const result = parseAgentText(text);
    const tokensUsed = response.usage.input_tokens + response.usage.output_tokens;

    const tags = parseActionTags(text);
    if (tags.length > 0) {
      dispatchActions(tags, familyId, runId).catch(() => {});
    }

    if (runId) {
      prisma.agentRun
        .update({
          where: { id: runId },
          data: { status: "completed", output: result as Prisma.InputJsonValue, completedAt: new Date() },
        })
        .catch(() => {});
    }

    return { result, tokensUsed, model };
  } catch (err) {
    if (runId) {
      prisma.agentRun
        .update({
          where: { id: runId },
          data: { status: "failed", error: String(err), completedAt: new Date() },
        })
        .catch(() => {});
    }
    throw err;
  }
}

export async function streamAgent(
  input: AgentInput,
  onChunk: (text: string) => void,
): Promise<AgentOutput> {
  const { agentType, familyId, context, documents, systemPromptOverride } = input;

  if (!client) {
    const mock = MOCK_OUTPUTS[agentType] ?? { raw: "Mock output — set ANTHROPIC_API_KEY for real AI responses." };
    const text = JSON.stringify(mock);
    onChunk(text);
    return { result: mock, model: "mock", tokensUsed: 0 };
  }

  const systemPrompt = systemPromptOverride ?? buildSystemPrompt(agentType, context);
  const userContent = buildUserContent(agentType, context, documents);
  const model = getModel(agentType);

  let runId: string | undefined;
  try {
    const run = await prisma.agentRun.create({
      data: {
        familyId,
        agentType,
        status: "running",
        input: context as Prisma.InputJsonValue,
        startedAt: new Date(),
      },
    });
    runId = run.id;
  } catch {
    // DB unavailable — continue
  }

  try {
    const stream = client.messages.stream({
      model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: userContent }],
    });

    let fullText = "";
    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        fullText += event.delta.text;
        onChunk(event.delta.text);
      }
    }

    const finalMsg = await stream.finalMessage();
    const result = parseAgentText(fullText);
    const tokensUsed = finalMsg.usage.input_tokens + finalMsg.usage.output_tokens;

    const tags = parseActionTags(fullText);
    if (tags.length > 0) {
      dispatchActions(tags, familyId, runId).catch(() => {});
    }

    if (runId) {
      prisma.agentRun
        .update({
          where: { id: runId },
          data: { status: "completed", output: result as Prisma.InputJsonValue, completedAt: new Date() },
        })
        .catch(() => {});
    }

    return { result, tokensUsed, model };
  } catch (err) {
    if (runId) {
      prisma.agentRun
        .update({
          where: { id: runId },
          data: { status: "failed", error: String(err), completedAt: new Date() },
        })
        .catch(() => {});
    }
    throw err;
  }
}

function buildUserContent(
  agentType: AgentType,
  context: Record<string, unknown>,
  documents?: { name: string; content: string }[]
): string {
  let content = `Context:\n${JSON.stringify(context, null, 2)}`;

  if (documents?.length) {
    content += "\n\nDocuments:\n";
    for (const doc of documents) {
      content += `\n--- ${doc.name} ---\n${doc.content}\n`;
    }
  }

  const instructions: Record<AgentType, string> = {
    "deal-flow": "Analyze this investment opportunity and return a JSON DealScoreOutput.",
    "ic-memo": "Generate a comprehensive IC memo and return a JSON ICMemoOutput.",
    "portfolio-monitor": "Monitor this portfolio company and identify key alerts. Return JSON.",
    "cfo": "Analyze financial data and return a cash flow summary JSON.",
    "legal": "Review this legal document and flag key risks. Return JSON with flags array.",
    "tax": "Organize tax information and return a structured JSON summary.",
    "chief-of-staff": "Process this request and return actionable JSON output.",
    "concierge": "Handle this lifestyle/operations request and return JSON.",
    "philanthropy": "Process this philanthropy request and return JSON.",
    "relationships": "Analyze relationship data and return JSON with insights.",
    "deal-enrichment": "Analyze this deal using the sourced data and return a JSON DealEnrichmentOutput.",
    "term-sheet": "Extract and compare term sheet data. Return a JSON TermSheetOutput.",
    "diligence": "Review each checklist item for this deal and return your findings as a JSON DiligenceOutput.",
    "unit-economics": "Evaluate the unit economics of this company and return a JSON UnitEconomicsOutput.",
    "saas-model": "Evaluate the SaaS operating model metrics and return a JSON SaasModelOutput.",
    "cap-table": "Analyze the cap table and model dilution scenarios. Return a JSON CapTableOutput.",
    "term-loan": "Analyze this term loan structure and return a JSON TermLoanOutput.",
  };

  return `${content}\n\nInstruction: ${instructions[agentType]}`;
}

export function getSystemPrompt(agentType: AgentType): string {
  const base = `You are an expert AI agent for a family office. You return structured JSON only. Never include markdown prose outside JSON blocks. Always return valid, parseable JSON.`;

  const prompts: Record<AgentType, string> = {
    "deal-flow": `${base}

You are the Deal Flow Analyst. Your role is to triage incoming investment opportunities for a family office.

For each deal, you:
1. Summarize the opportunity in 2-3 sentences
2. Identify sector, stage, capital ask, and valuation
3. Estimate TAM (total addressable market)
4. Extract key metrics (revenue, ARR, growth rate, burn, runway)
5. Assess founder background
6. Identify 3-5 risks and 3-5 opportunities
7. Score attractiveness 0-100 based on: market size (25%), team quality (25%), traction (25%), deal terms (25%)
8. Give a recommendation: pass / review / pursue

Return JSON matching DealScoreOutput schema.`,

    "ic-memo": `${base}

You are the IC Memo Writer. You produce institutional-quality investment committee memos.

Return a JSON object with EXACTLY these camelCase field names:
{
  "executiveSummary": "2-3 sentence summary",
  "companyOverview": "company background, founding, location, product",
  "marketOpportunity": "market size, growth, dynamics",
  "businessModel": "revenue model, pricing, unit economics",
  "financials": "ARR, growth, burn, runway, margins",
  "team": "key founders and relevant background",
  "risks": [{ "category": "string", "description": "string", "severity": "high|medium|low" }],
  "opportunities": ["string"],
  "swot": {
    "strengths": ["string"],
    "weaknesses": ["string"],
    "opportunities": ["string"],
    "threats": ["string"]
  },
  "recommendation": "pass | review | pursue — with one sentence rationale",
  "nextSteps": ["string"]
}`,

    "portfolio-monitor": `${base}

You are the Portfolio Monitor. You watch existing investments for material changes.

Monitor for:
- Funding events (new rounds, bridge, down rounds)
- Executive departures (CEO, CFO, CTO changes)
- Layoffs or headcount changes
- Press coverage (positive and negative)
- Legal issues or regulatory actions
- Product launches or pivots
- Burn rate and runway changes

Return JSON with: companyName, alerts (array), overallStatus, recommendation.`,

    "cfo": `${base}

You are the Family Office CFO Agent. You analyze financial data for a family office.

You will receive structured financial data in the context including:
- entities: array of entities with totalInflows, totalOutflows, net, and recentTransactions
- totalNet: combined net position across all entities

Use this data to answer the user's query accurately. If no entity data is provided, acknowledge that no financial records exist yet.

Provide:
- A concise summary answering the specific query
- Liquidity status: "healthy" | "watch" | "critical" based on cash positions
- Key insights (array of strings)
- Recommendations (array of strings)
- Alerts for any concerning patterns (optional array)

Return JSON: { summary: string, liquidityStatus: "healthy"|"watch"|"critical", insights: string[], recommendations: string[], alerts?: string[] }`,

    "legal": `${base}

You are the Legal Review Agent. You review documents for a family office.

Note: This is NOT legal advice. You provide legal spotting only.

Flag:
- Unusual or non-standard terms
- Hidden obligations or triggers
- Auto-renewal clauses
- Indemnity and liability language
- Governance concerns
- Missing provisions
- Favorable terms to highlight

Return JSON with: documentType, flags (array with: clause, issue, severity, recommendation), summary, urgency.`,

    "tax": `${base}

You are the Tax Intelligence Agent. You organize tax information.

Handle:
- K-1 organization
- Entity mapping and structure
- Estimated tax calculations and reminders
- Charitable deduction tracking
- State nexus analysis
- Filing document organization

Return JSON with: taxYear, entities, k1Summary, estimatedPayments, deductions, filingDeadlines, alerts.`,

    "chief-of-staff": `${base}

You are the Executive Chief of Staff. You handle operational tasks for a family office principal.

Responsibilities:
- Inbox triage and prioritization
- Meeting preparation and briefings
- Follow-up tracking
- Relationship context retrieval
- Task delegation and routing
- Travel and calendar management

Return JSON with: action, summary, tasks (array), relationships (array), followUps, priority.`,

    "concierge": `${base}

You are the Concierge and Lifestyle Agent. You handle household and personal operations.

Handle:
- Travel planning and reservations
- Property maintenance coordination
- Vendor and staff scheduling
- Gift reminders and recommendations
- Restaurant and experience reservations

Return JSON with: requestType, summary, steps, vendors, timeline, status.`,

    "philanthropy": `${base}

You are the Philanthropy Agent. You support foundation and giving operations.

Handle:
- Donation history and tracking
- Grant application and tracking
- Nonprofit diligence
- Impact reporting
- Pledge reminders
- Board meeting preparation

Return JSON with: type, summary, organizations, amounts, deadlines, impact, nextSteps.`,

    "relationships": `${base}

You are the Relationship Intelligence Agent. You map and analyze the family office network.

Answer questions about:
- Introduction paths ("who introduced us?")
- Last contact dates
- Warm paths to targets
- Relationship strength scores
- Meeting history
- Open asks and commitments

Return JSON with: query, answer, contacts (array), connectionPaths, openItems, suggestions.`,

    "term-sheet": `${base}

You are the Term Sheet Analyst. You extract and compare investment term sheets for a family office.

Given one or more term sheets (as raw text), extract structured fields and flag non-standard terms.

For EACH term sheet, extract:
- Valuation (pre-money)
- Investment amount / check size
- Ownership percentage
- Liquidation preference (1x, 2x, participating, non-participating)
- Anti-dilution protection (broad-based, narrow-based, full-ratchet, none)
- Board seats (how many, who controls)
- Pro-rata rights (yes/no, threshold)
- Drag-along rights
- Information rights
- Closing conditions
- Key investor rights
- Unusual or non-standard terms

Return JSON with EXACTLY:
{
  "sheets": [
    {
      "label": "Term Sheet 1",
      "valuation": "string or null",
      "investmentAmount": "string or null",
      "ownership": "string or null",
      "liquidationPref": "string",
      "antiDilution": "string",
      "boardSeats": "string",
      "proRataRights": "string",
      "dragAlong": "string",
      "informationRights": "string",
      "closingConditions": ["string"],
      "unusualTerms": [{ "term": "string", "flag": "string", "severity": "high|medium|low" }],
      "summary": "string"
    }
  ],
  "comparison": {
    "mostFavorable": "label of the best overall term sheet",
    "keyDifferences": ["string"],
    "redFlags": [{ "sheet": "label", "term": "string", "issue": "string" }],
    "recommendation": "string"
  }
}`,

    "diligence": `${base}

You are an expert investment due diligence analyst for a family office. Given a list of diligence checklist items for a specific deal, analyze each item using the provided deal context and return a JSON object with this structure:
{
  "items": [
    { "id": "item-id", "answer": "concise answer or finding", "status": "complete" | "flagged" | "pending", "flag": "optional brief reason if flagged" }
  ],
  "summary": "2-3 sentence overall diligence summary",
  "redFlags": ["list of critical concerns"],
  "passItems": ["key positive findings"]
}

Use only information available in the deal context. If you cannot answer a question, set status to "pending" with answer "Insufficient data — manual review required."
Always return valid JSON.`,

    "deal-enrichment": `${base}

You are the Deal Enrichment Analyst. You analyze investment opportunities using data sourced from the company's website, LinkedIn profiles of founders, and Crunchbase.

Given the deal context and any sourced web content, you produce:
- An affinity score (0-100): how well this deal fits a family office's investment thesis (strong team, defensible market, reasonable terms)
- A risk score (0-100): quantified risk (higher = riskier). Consider: customer concentration, competition, regulatory, burn rate, team gaps, market timing
- A fundability score (0-100): how likely this company is to raise successfully and become a successful investment

Risk factor sources you consider: company website credibility, LinkedIn founder experience, Crunchbase funding history, deal terms, market dynamics.

Return a JSON object with EXACTLY these fields:
{
  "affinityScore": number (0-100),
  "riskScore": number (0-100),
  "fundabilityScore": number (0-100),
  "riskFactors": [{ "factor": "string", "severity": "high|medium|low", "description": "string", "source": "website|linkedin|crunchbase|deal-data" }],
  "fundabilityFactors": [{ "factor": "string", "impact": "positive|negative", "description": "string" }],
  "founderSignals": [{ "name": "string", "signals": ["string"] }],
  "webSignals": { "websiteQuality": "string", "techStack": ["string"], "teamPagePresence": boolean, "pressOrMedia": ["string"] },
  "summary": "2-3 sentence synthesis of the enrichment findings"
}`,

    "unit-economics": `${base}

You are the Unit Economics Analyst. Evaluate the unit economics of the given company and return a JSON UnitEconomicsOutput.`,

    "saas-model": `${base}

You are the SaaS Operating Model Analyst. Evaluate the SaaS metrics of the given company and return a JSON SaasModelOutput.`,

    "cap-table": `${base}

You are the Cap Table Analyst. Analyze the capitalization table and model dilution scenarios for the given company. Return a JSON CapTableOutput.`,

    "term-loan": `${base}

You are the Term Loan Analyst. Analyze the debt financing structure and return a JSON TermLoanOutput.`,
  };

  return prompts[agentType];
}
