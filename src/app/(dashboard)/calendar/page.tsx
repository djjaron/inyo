"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Badge from "@/components/ui/Badge";
import PageHeader from "@/components/ui/PageHeader";
import { formatCurrency } from "@/lib/utils";
import { useFamilyId } from "@/context/FamilyContext";

// ── Types ─────────────────────────────────────────────────────────────────────

type CalendarStatus = "overdue" | "due-soon" | "upcoming";

interface CalendarItem {
  id: string;
  dealId: string;
  dealName: string;
  company: string;
  amount: number;
  dueDate: string;
  status: CalendarStatus;
  daysUntil: number;
  sector: string;
  type: "capital-call" | "distribution";
}

interface CalendarSummary {
  totalCallsNext90Days: number;
  totalDistributionsNext90Days: number;
  netNext90Days: number;
  dryPowder: number;
}

interface CalendarData {
  upcomingCalls: CalendarItem[];
  upcomingDistributions: CalendarItem[];
  cashFlowItems: CalendarItem[];
  summary: CalendarSummary;
  _mock?: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const statusBadgeVariant: Record<
  CalendarStatus,
  "danger" | "warning" | "muted"
> = {
  overdue: "danger",
  "due-soon": "warning",
  upcoming: "muted",
};

const statusLabel: Record<CalendarStatus, string> = {
  overdue: "Overdue",
  "due-soon": "Due Soon",
  upcoming: "Upcoming",
};

function formatShortDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCompactNet(amount: number): string {
  const abs = Math.abs(amount);
  let formatted: string;
  if (abs >= 1_000_000) {
    formatted = `$${(abs / 1_000_000).toFixed(1)}M`;
  } else if (abs >= 1_000) {
    formatted = `$${(abs / 1_000).toFixed(0)}K`;
  } else {
    formatted = `$${abs.toLocaleString()}`;
  }
  return amount < 0 ? `−${formatted}` : `+${formatted}`;
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  amount,
  color,
  prefix,
}: {
  label: string;
  amount: number;
  color: string;
  prefix?: string;
}) {
  return (
    <div
      className="rounded-lg border p-5 flex flex-col gap-1.5"
      style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
    >
      <span
        className="text-xs font-medium tracking-wider uppercase"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </span>
      <span
        className="text-2xl font-semibold font-mono"
        style={{ color, fontVariantNumeric: "tabular-nums" }}
      >
        {prefix}
        {formatCurrency(Math.abs(amount))}
      </span>
    </div>
  );
}

// ── Calendar Item Card ────────────────────────────────────────────────────────

function ItemCard({
  item,
  isCall,
}: {
  item: CalendarItem;
  isCall: boolean;
}) {
  const amountColor = isCall ? "#ef4444" : "#10b981";
  const isOverdue = item.status === "overdue";

  return (
    <div
      className="rounded-lg border p-4 flex flex-col gap-2 transition-colors"
      style={{
        background: "var(--bg-surface)",
        borderColor: isOverdue ? "#ef4444" : "var(--border)",
        borderLeftWidth: isOverdue ? "3px" : "1px",
      }}
    >
      {/* Company + status badge */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div
            className="text-sm font-semibold leading-tight"
            style={{ color: "var(--text-primary)" }}
          >
            {item.company}
          </div>
          <div
            className="text-xs mt-0.5 leading-tight"
            style={{ color: "var(--text-muted)" }}
          >
            {item.dealName !== item.company ? item.dealName : item.sector}
          </div>
        </div>
        <Badge
          label={statusLabel[item.status]}
          variant={statusBadgeVariant[item.status]}
          size="xs"
        />
      </div>

      {/* Amount */}
      <div
        className="text-xl font-semibold font-mono"
        style={{ color: amountColor, fontVariantNumeric: "tabular-nums" }}
      >
        {isCall ? "−" : "+"}{formatCurrency(item.amount)}
      </div>

      {/* Date row */}
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {isCall ? "Due" : "Expected"}{" "}
          <span style={{ color: "var(--text-secondary)" }}>
            {formatShortDate(item.dueDate)}
          </span>
        </span>
        {item.sector && item.sector !== "—" && (
          <span
            className="text-xs px-1.5 py-0.5 rounded"
            style={{
              background: "var(--bg-elevated)",
              color: "var(--text-muted)",
            }}
          >
            {item.sector}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Timeline Row ──────────────────────────────────────────────────────────────

function TimelineRow({ item }: { item: CalendarItem }) {
  const isCall = item.type === "capital-call";
  const amountColor = isCall ? "#ef4444" : "#10b981";

  return (
    <div
      className="flex items-center gap-4 py-3 border-b"
      style={{ borderColor: "var(--border-subtle, var(--border))" }}
    >
      {/* Date */}
      <div
        className="w-24 shrink-0 text-xs font-mono"
        style={{ color: "var(--text-muted)" }}
      >
        {formatShortDate(item.dueDate)}
      </div>

      {/* Dot */}
      <div
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ background: amountColor }}
      />

      {/* Company + type badge */}
      <div className="flex-1 flex items-center gap-2 min-w-0">
        <span
          className="text-sm font-medium truncate"
          style={{ color: "var(--text-primary)" }}
        >
          {item.company}
        </span>
        <Badge
          label={isCall ? "Capital Call" : "Distribution"}
          variant={isCall ? "danger" : "success"}
          size="xs"
        />
        {item.sector && item.sector !== "—" && (
          <span
            className="text-xs hidden sm:inline"
            style={{ color: "var(--text-muted)" }}
          >
            · {item.sector}
          </span>
        )}
      </div>

      {/* Amount */}
      <div
        className="text-sm font-semibold font-mono shrink-0"
        style={{ color: amountColor, fontVariantNumeric: "tabular-nums" }}
      >
        {isCall ? "−" : "+"}{formatCurrency(item.amount)}
      </div>
    </div>
  );
}

// ── Month Calendar ────────────────────────────────────────────────────────────

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/** Returns "YYYY-MM-DD" from local year/month/day ints — avoids UTC shift. */
function localDateKey(year: number, month: number, day: number): string {
  return `${year}-${pad2(month + 1)}-${pad2(day)}`;
}

function formatChipAmount(item: CalendarItem): string {
  const abs = item.amount;
  let str: string;
  if (abs >= 1_000_000) {
    str = `$${(abs / 1_000_000).toFixed(1)}M`;
  } else if (abs >= 1_000) {
    str = `$${Math.round(abs / 1_000)}K`;
  } else {
    str = `$${abs.toLocaleString()}`;
  }
  return item.type === "capital-call" ? `−${str}` : `+${str}`;
}

function EventChip({ item }: { item: CalendarItem }) {
  const isCall = item.type === "capital-call";
  const isOverdue = item.status === "overdue";
  const dotColor = isCall ? "#ef4444" : "#10b981";
  const chipBg = isCall ? "rgba(239,68,68,0.15)" : "rgba(16,185,129,0.12)";
  const chipColor = isCall ? "#ef4444" : "#10b981";

  return (
    <div
      className="flex items-center gap-1 rounded px-1 py-0.5 overflow-hidden"
      style={{
        background: chipBg,
        border: isOverdue ? `1px solid #ef4444` : "1px solid transparent",
        animation: isOverdue ? "pulse 2s cubic-bezier(0.4,0,0.6,1) infinite" : undefined,
        maxWidth: "100%",
      }}
    >
      <div
        className="shrink-0 rounded-full"
        style={{ width: 4, height: 4, background: dotColor }}
      />
      <span
        className="font-mono truncate"
        style={{ fontSize: 10, color: chipColor, lineHeight: "1.2" }}
      >
        {formatChipAmount(item)}
      </span>
    </div>
  );
}

function MonthCalendar({ items }: { items: CalendarItem[] }) {
  const [viewMonth, setViewMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const today = new Date();
  const todayKey = localDateKey(today.getFullYear(), today.getMonth(), today.getDate());

  // Build event map: "YYYY-MM-DD" → CalendarItem[]
  const eventMap = new Map<string, CalendarItem[]>();
  for (const item of items) {
    const key = item.dueDate.slice(0, 10);
    const bucket = eventMap.get(key) ?? [];
    bucket.push(item);
    eventMap.set(key, bucket);
  }

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();

  // First day of month and how many days to back up to reach Sunday
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay(); // 0=Sun…6=Sat

  // Build 42-cell grid
  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    cells.push(new Date(year, month, 1 - startOffset + i));
  }

  const monthLabel = viewMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  function prevMonth() {
    setViewMonth(new Date(year, month - 1, 1));
  }
  function nextMonth() {
    setViewMonth(new Date(year, month + 1, 1));
  }

  return (
    <div
      className="mx-8 mb-6 rounded-lg border overflow-hidden"
      style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
    >
      {/* Navigation header */}
      <div
        className="flex items-center justify-between px-5 py-3 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <button
          onClick={prevMonth}
          className="p-1.5 rounded transition-colors hover:opacity-70"
          style={{ color: "var(--text-secondary)" }}
          aria-label="Previous month"
        >
          <ChevronLeft size={16} />
        </button>
        <span
          className="text-sm font-semibold tracking-wide"
          style={{ color: "var(--text-primary)" }}
        >
          {monthLabel}
        </span>
        <button
          onClick={nextMonth}
          className="p-1.5 rounded transition-colors hover:opacity-70"
          style={{ color: "var(--text-secondary)" }}
          aria-label="Next month"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day-of-week header */}
      <div className="grid grid-cols-7">
        {DAY_NAMES.map((d) => (
          <div
            key={d}
            className="py-2 text-center text-xs font-medium tracking-wider uppercase border-b"
            style={{
              color: "var(--text-muted)",
              borderColor: "var(--border)",
            }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {cells.map((cell, idx) => {
          const cellYear = cell.getFullYear();
          const cellMonth = cell.getMonth();
          const cellDay = cell.getDate();
          const inViewMonth = cellMonth === month;
          const cellKey = localDateKey(cellYear, cellMonth, cellDay);
          const isToday = cellKey === todayKey;
          const dayEvents = inViewMonth ? (eventMap.get(cellKey) ?? []) : [];
          const hasEvents = dayEvents.length > 0;
          const visibleEvents = dayEvents.slice(0, 2);
          const overflow = dayEvents.length - 2;

          // Border logic: add right border except last col, add bottom except last row
          const col = idx % 7;
          const row = Math.floor(idx / 7);
          const borderRight = col < 6 ? "1px solid var(--border)" : "none";
          const borderBottom = row < 5 ? "1px solid var(--border)" : "none";

          return (
            <div
              key={cellKey + idx}
              className="flex flex-col gap-1 p-1.5 transition-colors relative"
              style={{
                minHeight: 72,
                borderRight,
                borderBottom,
                opacity: inViewMonth ? 1 : 0.3,
                background: isToday
                  ? "rgba(99,102,241,0.08)"
                  : hasEvents
                  ? "var(--bg-elevated)"
                  : "transparent",
                ...(isToday && {
                  outline: "1px solid var(--accent)",
                  outlineOffset: "-1px",
                }),
              }}
            >
              {/* Day number */}
              <div
                className="text-xs font-mono self-end px-0.5"
                style={{
                  color: isToday ? "var(--accent)" : "var(--text-secondary)",
                  fontWeight: isToday ? 700 : 400,
                }}
              >
                {cellDay}
              </div>

              {/* Event chips */}
              {inViewMonth && (
                <div className="flex flex-col gap-0.5">
                  {visibleEvents.map((ev) => (
                    <EventChip key={ev.id} item={ev} />
                  ))}
                  {overflow > 0 && (
                    <span
                      className="text-center"
                      style={{ fontSize: 9, color: "var(--text-muted)", lineHeight: "1.4" }}
                    >
                      +{overflow} more
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const familyId = useFamilyId();

  const [data, setData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!familyId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/calendar?familyId=${encodeURIComponent(familyId)}`
      );
      const json: CalendarData = await res.json();
      setData(json);
    } catch {
      // leave null — empty state will render
    } finally {
      setLoading(false);
    }
  }, [familyId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const summary = data?.summary;
  const net = summary?.netNext90Days ?? 0;
  const netPositive = net >= 0;

  const isEmpty =
    !loading &&
    data !== null &&
    data.upcomingCalls.length === 0 &&
    data.upcomingDistributions.length === 0;

  return (
    <div
      className={`flex flex-col h-full overflow-auto${loading ? " opacity-50 animate-pulse" : ""}`}
    >
      {/* Page Header */}
      <PageHeader
        title="Capital Calendar"
        subtitle="Calls & distributions — next 90 days"
        actions={
          <div className="flex items-center gap-3">
            {data?._mock && (
              <Badge label="Mock Data" variant="warning" size="xs" />
            )}
            {summary && (
              <span
                className="px-3 py-1.5 rounded-md text-sm font-semibold font-mono"
                style={{
                  background: netPositive
                    ? "rgba(16,185,129,0.1)"
                    : "rgba(239,68,68,0.1)",
                  color: netPositive ? "#10b981" : "#ef4444",
                  border: `1px solid ${netPositive ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {formatCompactNet(net)} net
              </span>
            )}
          </div>
        }
      />

      {/* Empty state */}
      {isEmpty && (
        <div
          className="flex-1 flex flex-col items-center justify-center gap-3 px-8"
        >
          <p
            className="text-sm text-center max-w-sm"
            style={{ color: "var(--text-muted)" }}
          >
            No upcoming capital calls or distributions. Log transactions in
            Finance to populate this view.
          </p>
          <Link
            href="/finance"
            className="px-5 py-2 rounded text-sm font-semibold"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            Go to Finance
          </Link>
        </div>
      )}

      {!isEmpty && data && (
        <div className="flex-1 flex flex-col gap-0">
          {/* Summary stat cards */}
          <div
            className="px-8 py-5 border-b"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard
                label="Capital Calls · 90d"
                amount={summary?.totalCallsNext90Days ?? 0}
                color="#ef4444"
                prefix="−"
              />
              <StatCard
                label="Distributions · 90d"
                amount={summary?.totalDistributionsNext90Days ?? 0}
                color="#10b981"
                prefix="+"
              />
              <StatCard
                label="Net Position · 90d"
                amount={Math.abs(net)}
                color={netPositive ? "#10b981" : "#ef4444"}
                prefix={netPositive ? "+" : "−"}
              />
              <StatCard
                label="Dry Powder"
                amount={summary?.dryPowder ?? 0}
                color="var(--accent)"
              />
            </div>
          </div>

          {/* Month Calendar grid */}
          <div className="pt-6">
            <MonthCalendar items={data.cashFlowItems} />
          </div>

          {/* Divider */}
          <div
            className="mx-8 mb-4"
            style={{ height: 1, background: "var(--border)" }}
          />

          {/* Two-column timeline */}
          <div
            className="grid grid-cols-1 lg:grid-cols-2 gap-0 border-b"
            style={{ borderColor: "var(--border)" }}
          >
            {/* Capital Calls column */}
            <div
              className="px-8 py-6 border-r"
              style={{ borderColor: "var(--border)" }}
            >
              <h2
                className="text-xs font-medium tracking-wider uppercase mb-4"
                style={{ color: "var(--text-muted)" }}
              >
                Capital Calls
                <span
                  className="ml-2 font-mono normal-case tracking-normal"
                  style={{ color: "#ef4444" }}
                >
                  {data.upcomingCalls.length > 0
                    ? `(${data.upcomingCalls.length})`
                    : ""}
                </span>
              </h2>
              {data.upcomingCalls.length === 0 ? (
                <p
                  className="text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  No upcoming capital calls.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {data.upcomingCalls.map((item) => (
                    <ItemCard key={item.id} item={item} isCall={true} />
                  ))}
                </div>
              )}
            </div>

            {/* Distributions column */}
            <div className="px-8 py-6">
              <h2
                className="text-xs font-medium tracking-wider uppercase mb-4"
                style={{ color: "var(--text-muted)" }}
              >
                Distributions
                <span
                  className="ml-2 font-mono normal-case tracking-normal"
                  style={{ color: "#10b981" }}
                >
                  {data.upcomingDistributions.length > 0
                    ? `(${data.upcomingDistributions.length})`
                    : ""}
                </span>
              </h2>
              {data.upcomingDistributions.length === 0 ? (
                <p
                  className="text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  No upcoming distributions.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {data.upcomingDistributions.map((item) => (
                    <ItemCard key={item.id} item={item} isCall={false} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Cash Flow Timeline */}
          {data.cashFlowItems.length > 0 && (
            <div className="px-8 py-6">
              <h2
                className="text-xs font-medium tracking-wider uppercase mb-4"
                style={{ color: "var(--text-muted)" }}
              >
                Cash Flow Timeline
              </h2>
              <div
                className="rounded-lg border overflow-hidden"
                style={{ borderColor: "var(--border)" }}
              >
                <div className="px-5">
                  {data.cashFlowItems.map((item) => (
                    <TimelineRow key={item.id} item={item} />
                  ))}
                  {/* Remove bottom border on last row */}
                  <div className="h-0" />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
