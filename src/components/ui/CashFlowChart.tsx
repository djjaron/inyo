const INFLOW_TYPES = new Set(["income", "distribution"]);
const OUTFLOW_TYPES = new Set(["expense", "capital-call", "tax-payment"]);

const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function compactAmount(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${Math.round(abs / 1_000)}K`;
  return `$${Math.round(abs)}`;
}

interface CashFlowChartProps {
  cashFlows: Array<{ type: string; amount: number; occurredAt: string }>;
}

export default function CashFlowChart({ cashFlows }: CashFlowChartProps) {
  // Build the last 6 calendar months (oldest first)
  const now = new Date();
  const months: Array<{ year: number; month: number }> = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth() }); // month is 0-indexed
  }

  // Aggregate per month
  const buckets = months.map(({ year, month }) => {
    let inflows = 0;
    let outflows = 0;
    for (const cf of cashFlows) {
      if (!cf.occurredAt) continue;
      const d = new Date(cf.occurredAt);
      if (d.getFullYear() === year && d.getMonth() === month) {
        if (INFLOW_TYPES.has(cf.type)) inflows += Math.abs(cf.amount);
        else if (OUTFLOW_TYPES.has(cf.type)) outflows += Math.abs(cf.amount);
      }
    }
    return { year, month, inflows, outflows };
  });

  const maxValue = Math.max(...buckets.map((b) => Math.max(b.inflows, b.outflows)), 0);
  const CHART_HEIGHT = 120;
  const COL_WIDTH = 100;

  return (
    <div style={{ background: "var(--bg-elevated)", borderRadius: 8, padding: "16px 0 0" }}>
      <svg
        width="100%"
        height="180"
        viewBox="0 0 600 180"
        preserveAspectRatio="none"
        aria-label="Cash flow bar chart"
      >
        {/* Legend */}
        <rect x="8" y="6" width="8" height="8" rx="1" fill="#10b981" />
        <text x="20" y="14" fontSize="9" fill="var(--text-muted)">Inflows</text>
        <rect x="60" y="6" width="8" height="8" rx="1" fill="#ef4444" />
        <text x="72" y="14" fontSize="9" fill="var(--text-muted)">Outflows</text>

        {buckets.map((bucket, i) => {
          const colX = i * COL_WIDTH;
          const centerX = colX + 50;

          // Bar dimensions — grow upward from y=120
          const inflowH = maxValue > 0 ? Math.max((bucket.inflows / maxValue) * CHART_HEIGHT, 0) : 0;
          const outflowH = maxValue > 0 ? Math.max((bucket.outflows / maxValue) * CHART_HEIGHT, 0) : 0;

          // Left bar (inflows): center at colX+30, width 28
          const inflowX = colX + 30 - 14; // colX+16
          // Right bar (outflows): center at colX+62, width 28
          const outflowX = colX + 62 - 14; // colX+48

          // Month label
          const monthAbbr = MONTH_ABBR[bucket.month];
          const isFirst = i === 0;
          const isJanuary = bucket.month === 0;
          const showYear = isFirst || isJanuary;
          const yearSuffix = showYear ? ` '${String(bucket.year).slice(2)}` : "";
          const monthLabel = monthAbbr + yearSuffix;

          // Net label
          const net = bucket.inflows - bucket.outflows;
          const netLabel = net === 0 ? "$0" : (net > 0 ? "+" : "-") + compactAmount(net);
          const netColor = net >= 0 ? "#10b981" : "#ef4444";

          return (
            <g key={`${bucket.year}-${bucket.month}`}>
              {/* Inflow bar */}
              {inflowH > 0 && (
                <rect
                  x={inflowX}
                  y={CHART_HEIGHT - inflowH}
                  width="28"
                  height={inflowH}
                  rx="2"
                  fill="#10b981"
                  opacity="0.85"
                />
              )}
              {inflowH === 0 && (
                <rect
                  x={inflowX}
                  y={CHART_HEIGHT - 1}
                  width="28"
                  height="1"
                  fill="#10b981"
                  opacity="0.3"
                />
              )}

              {/* Outflow bar */}
              {outflowH > 0 && (
                <rect
                  x={outflowX}
                  y={CHART_HEIGHT - outflowH}
                  width="28"
                  height={outflowH}
                  rx="2"
                  fill="#ef4444"
                  opacity="0.85"
                />
              )}
              {outflowH === 0 && (
                <rect
                  x={outflowX}
                  y={CHART_HEIGHT - 1}
                  width="28"
                  height="1"
                  fill="#ef4444"
                  opacity="0.3"
                />
              )}

              {/* Month label */}
              <text
                x={centerX}
                y="148"
                textAnchor="middle"
                fontSize="10"
                fill="var(--text-muted)"
              >
                {monthLabel}
              </text>

              {/* Net label */}
              <text
                x={centerX}
                y="162"
                textAnchor="middle"
                fontSize="9"
                fill={netColor}
              >
                {netLabel}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
