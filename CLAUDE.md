# Inyo — Family Office OS

Private AI operating system for modern family offices. Built on the Dividen agent runtime architecture.

## Project Structure

```
src/
  app/
    page.tsx                    # Public landing page
    (dashboard)/                # App shell (sidebar + layout)
      layout.tsx                # Sidebar layout wrapper
      dashboard/page.tsx        # Main dashboard
      opportunities/page.tsx    # Deal flow pipeline
      portfolio/page.tsx        # Portfolio monitoring
      finance/page.tsx          # CFO / cash flow
      legal/page.tsx            # Legal document review
      tax/page.tsx              # Tax intelligence
      concierge/page.tsx        # Lifestyle / household ops
      philanthropy/page.tsx     # Foundation / giving
      relationships/page.tsx    # Network intelligence
      marketplace/page.tsx      # Agent marketplace
    api/
      deals/                    # Deal CRUD + deal flow agent
      portfolio/                # Portfolio companies
      agents/
        deal-flow/              # Deal Flow Analyst agent endpoint
        ic-memo/                # IC Memo Writer agent endpoint
      approvals/                # Human approval gates
      contacts/                 # Relationship contacts
  components/
    layout/
      Sidebar.tsx               # Left nav
  lib/
    agents/
      runtime.ts                # Core agent execution (Anthropic SDK)
    prisma.ts                   # PrismaClient singleton
    utils.ts                    # cn(), formatCurrency(), etc.
  types/
    index.ts                    # Shared TypeScript types
prisma/
  schema.prisma                 # Database schema
```

## Stack

- **Framework**: Next.js 16, App Router, TypeScript
- **Styling**: Tailwind v4 (CSS variables, dark theme)
- **DB**: PostgreSQL via Prisma
- **AI**: Anthropic SDK (claude-opus-4-7)
- **Icons**: lucide-react
- **Package manager**: pnpm

## Running locally

```bash
cp .env.example .env.local
# Fill in DATABASE_URL and ANTHROPIC_API_KEY
pnpm install
npx prisma generate
npx prisma db push
pnpm dev
```

## Key design decisions

- Dark theme only — CSS variables in globals.css (--bg-base, --text-primary, etc.)
- Agent runtime in `src/lib/agents/runtime.ts` handles all AI execution
- All agents fall back to mock output when ANTHROPIC_API_KEY is not set
- DB operations wrapped in try/catch with mock fallback for demo

## Phase 1 agents (MVP)

1. Deal Flow Analyst — scores and triages inbound opportunities
2. IC Memo Writer — generates institutional investment committee memos
3. Portfolio Monitor — watches existing investments for material changes
4. CFO Agent — cash flow, entity liquidity, expense reporting
5. Relationship Intelligence — network graph, warm paths, interaction history
