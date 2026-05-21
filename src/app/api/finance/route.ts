import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FinanceEntity {
  id: string;
  name: string;
  type: string;
  cash: number;
  receivables: number;
  payables: number;
}

interface FinanceTransaction {
  id: string;
  date: string;
  entity: string;
  type: string;
  category: string;
  amount: number;
  description: string;
}

interface FinancePayable {
  vendor: string;
  amount: number;
  due: string;
  entity: string;
  category: string;
}

interface FinanceResponse {
  entities: FinanceEntity[];
  transactions: FinanceTransaction[];
  payables: FinancePayable[];
  _mock: boolean;
}

// ---------------------------------------------------------------------------
// Mock fallback data (from existing finance page)
// ---------------------------------------------------------------------------

const MOCK_ENTITIES: FinanceEntity[] = [
  { id: "1", name: "Hartwell Delaware LLC", type: "llc", cash: 12_400_000, receivables: 850_000, payables: 320_000 },
  { id: "2", name: "Hartwell Cayman LP", type: "lp", cash: 22_100_000, receivables: 2_400_000, payables: 1_100_000 },
  { id: "3", name: "Hartwell Family Trust", type: "trust", cash: 8_700_000, receivables: 0, payables: 45_000 },
  { id: "4", name: "HW Operating Co", type: "corp", cash: 3_950_000, receivables: 620_000, payables: 890_000 },
];

const MOCK_TRANSACTIONS: FinanceTransaction[] = [
  { id: "t1", date: "2026-05-19", entity: "Hartwell Delaware LLC", type: "expense", category: "Legal", amount: -48_500, description: "Orrick LLP — LP Agreement drafting" },
  { id: "t2", date: "2026-05-18", entity: "HW Operating Co", type: "income", category: "Management Fee", amount: 125_000, description: "Q2 management fee — Arcadia Energy" },
  { id: "t3", date: "2026-05-17", entity: "Hartwell Cayman LP", type: "capital-call", category: "Investment", amount: -2_000_000, description: "Capital call — Phalanx Defense Series C" },
  { id: "t4", date: "2026-05-15", entity: "Hartwell Family Trust", type: "distribution", category: "Distribution", amount: -500_000, description: "Monthly family distribution" },
  { id: "t5", date: "2026-05-14", entity: "Hartwell Delaware LLC", type: "expense", category: "Tax", amount: -285_000, description: "Q1 federal estimated tax payment" },
  { id: "t6", date: "2026-05-12", entity: "Hartwell Cayman LP", type: "income", category: "Dividend", amount: 340_000, description: "Terrace REIT quarterly dividend" },
];

const MOCK_PAYABLES: FinancePayable[] = [
  { vendor: "Ernst & Young LLP", amount: 85_000, due: "2026-06-01", entity: "Hartwell Family Trust", category: "Tax" },
  { vendor: "Orrick Herrington", amount: 24_500, due: "2026-06-15", entity: "Hartwell Delaware LLC", category: "Legal" },
  { vendor: "Salesforce Enterprise", amount: 18_200, due: "2026-06-30", entity: "HW Operating Co", category: "Software" },
];

const MOCK_RESPONSE: FinanceResponse = {
  entities: MOCK_ENTITIES,
  transactions: MOCK_TRANSACTIONS,
  payables: MOCK_PAYABLES,
  _mock: true,
};

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const familyId = searchParams.get("familyId");

  if (!familyId) {
    return NextResponse.json(MOCK_RESPONSE);
  }

  try {
    const [dbEntities, dbCashFlows] = await Promise.all([
      prisma.entity.findMany({ where: { familyId } }),
      prisma.cashFlow.findMany({
        where: { entity: { familyId } },
        orderBy: { occurredAt: "desc" },
        take: 20,
        include: { entity: { select: { name: true } } },
      }),
    ]);

    // Build entity summary: cash = sum of income flows, payables = sum of future expense flows
    const entities: FinanceEntity[] = dbEntities.map((e) => {
      const flows = dbCashFlows.filter((cf) => cf.entityId === e.id);
      const cash = flows
        .filter((cf) => cf.type === "income")
        .reduce((sum, cf) => sum + cf.amount, 0);
      const receivables = 0; // Not directly available from CashFlow
      const payables = flows
        .filter((cf) => cf.type === "expense" && new Date(cf.occurredAt) > new Date())
        .reduce((sum, cf) => sum + Math.abs(cf.amount), 0);
      return { id: e.id, name: e.name, type: e.type, cash, receivables, payables };
    });

    // Transactions: all cash flows
    const transactions: FinanceTransaction[] = dbCashFlows.map((cf) => ({
      id: cf.id,
      date: cf.occurredAt.toISOString().slice(0, 10),
      entity: cf.entity.name,
      type: cf.type,
      category: cf.category ?? cf.type,
      amount: cf.amount,
      description: cf.description ?? "",
    }));

    // Payables: expense-type flows in the future
    const payables: FinancePayable[] = dbCashFlows
      .filter((cf) => cf.type === "expense" && new Date(cf.occurredAt) > new Date())
      .map((cf) => ({
        vendor: cf.description ?? "Unknown",
        amount: Math.abs(cf.amount),
        due: cf.occurredAt.toISOString().slice(0, 10),
        entity: cf.entity.name,
        category: cf.category ?? "Expense",
      }));

    return NextResponse.json({ entities, transactions, payables, _mock: false });
  } catch {
    return NextResponse.json(MOCK_RESPONSE);
  }
}
