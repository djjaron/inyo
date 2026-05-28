export default function Loading() {
  return (
    <div
      className="flex flex-col h-full p-8 gap-6 animate-pulse"
      style={{ background: "var(--bg-base)" }}
    >
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <div className="h-3 w-32 rounded" style={{ background: "var(--bg-elevated)" }} />
          <div className="h-7 w-48 rounded" style={{ background: "var(--bg-elevated)" }} />
        </div>
        <div className="h-8 w-24 rounded-md" style={{ background: "var(--bg-elevated)" }} />
      </div>

      {/* KPI cards skeleton */}
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-5 rounded-md border"
            style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="h-3 w-20 rounded" style={{ background: "var(--bg-elevated)" }} />
              <div className="h-4 w-4 rounded" style={{ background: "var(--bg-elevated)" }} />
            </div>
            <div className="h-8 w-24 rounded mb-2" style={{ background: "var(--bg-elevated)" }} />
            <div className="h-3 w-16 rounded" style={{ background: "var(--bg-elevated)" }} />
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 360px" }}>
        <div
          className="rounded-md border"
          style={{ background: "var(--bg-surface)", borderColor: "var(--border)", minHeight: 280 }}
        >
          <div className="px-5 py-4 border-b flex items-center gap-3" style={{ borderColor: "var(--border)" }}>
            <div className="h-4 w-4 rounded" style={{ background: "var(--bg-elevated)" }} />
            <div className="h-4 w-32 rounded" style={{ background: "var(--bg-elevated)" }} />
          </div>
          <div className="p-4 flex flex-col gap-3">
            {[80, 65, 75, 55].map((w) => (
              <div key={w} className="rounded-md border p-3 flex items-center gap-3"
                style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}>
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: "var(--border)" }} />
                <div className="flex-1 flex flex-col gap-1.5">
                  <div className="h-3 rounded" style={{ width: `${w}%`, background: "var(--border)" }} />
                  <div className="h-2.5 rounded w-20" style={{ background: "var(--border)" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div
          className="rounded-md border"
          style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
        />
      </div>
    </div>
  );
}
