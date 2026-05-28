"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search, TrendingUp, Users, BarChart3, FileText,
  LayoutDashboard, DollarSign, Scale, Receipt,
  Briefcase, Heart, Calendar, Store, Layers, Zap, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFamilyId } from "@/context/FamilyContext";
import type { SearchResult } from "@/app/api/search/route";

// ─── Static nav items ──────────────────────────────────────────────────────

interface NavItem {
  id: string;
  type: "nav";
  title: string;
  subtitle: string;
  href: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { id: "nav-dashboard",       type: "nav", title: "Dashboard",          subtitle: "Overview & metrics",      href: "/dashboard",       icon: <LayoutDashboard size={14} /> },
  { id: "nav-opportunities",   type: "nav", title: "Opportunities",       subtitle: "Deal flow pipeline",      href: "/opportunities",   icon: <TrendingUp size={14} /> },
  { id: "nav-portfolio",       type: "nav", title: "Portfolio",           subtitle: "Active investments",      href: "/portfolio",       icon: <BarChart3 size={14} /> },
  { id: "nav-finance",         type: "nav", title: "Finance",             subtitle: "Cash flow & entities",    href: "/finance",         icon: <DollarSign size={14} /> },
  { id: "nav-legal",           type: "nav", title: "Legal",               subtitle: "Document review",         href: "/legal",           icon: <Scale size={14} /> },
  { id: "nav-tax",             type: "nav", title: "Tax",                 subtitle: "K-1s & deadlines",        href: "/tax",             icon: <Receipt size={14} /> },
  { id: "nav-concierge",       type: "nav", title: "Concierge",           subtitle: "Lifestyle & operations",  href: "/concierge",       icon: <Briefcase size={14} /> },
  { id: "nav-philanthropy",    type: "nav", title: "Philanthropy",        subtitle: "Grants & pledges",        href: "/philanthropy",    icon: <Heart size={14} /> },
  { id: "nav-relationships",   type: "nav", title: "Relationships",       subtitle: "Network intelligence",    href: "/relationships",   icon: <Users size={14} /> },
  { id: "nav-calendar",        type: "nav", title: "Calendar",            subtitle: "Capital calls & events",  href: "/calendar",        icon: <Calendar size={14} /> },
  { id: "nav-spv",             type: "nav", title: "SPV",                 subtitle: "Syndication manager",     href: "/spv",             icon: <Layers size={14} /> },
  { id: "nav-marketplace",     type: "nav", title: "Marketplace",         subtitle: "Agent catalog",           href: "/marketplace",     icon: <Store size={14} /> },
  { id: "nav-agents",          type: "nav", title: "Agents",              subtitle: "Run & monitor agents",    href: "/agents",          icon: <Zap size={14} /> },
  { id: "nav-approvals",       type: "nav", title: "Approvals",           subtitle: "Pending actions",         href: "/approvals",       icon: <Scale size={14} /> },
];

// ─── Type helpers ──────────────────────────────────────────────────────────

const RESULT_ICON: Record<string, React.ReactNode> = {
  deal:      <TrendingUp size={13} />,
  contact:   <Users size={13} />,
  portfolio: <BarChart3 size={13} />,
  document:  <FileText size={13} />,
  nav:       <LayoutDashboard size={13} />,
};

const RESULT_COLOR: Record<string, string> = {
  deal:      "var(--accent)",
  contact:   "#10b981",
  portfolio: "#8b5cf6",
  document:  "#f59e0b",
  nav:       "var(--text-muted)",
};

const TYPE_LABEL: Record<string, string> = {
  deal:      "Deal",
  contact:   "Contact",
  portfolio: "Portfolio",
  document:  "Document",
  nav:       "Page",
};

// ─── Item component ────────────────────────────────────────────────────────

type AnyItem = SearchResult | NavItem;

function Item({
  item,
  active,
  onSelect,
}: {
  item: AnyItem;
  active: boolean;
  onSelect: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (active) ref.current?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const icon = item.type === "nav" ? (item as NavItem).icon : RESULT_ICON[item.type];
  const color = RESULT_COLOR[item.type] ?? "var(--text-muted)";
  const badge = item.type !== "nav" ? (item as SearchResult).badge : null;

  return (
    <button
      ref={ref}
      onClick={onSelect}
      className="flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors"
      style={active ? { background: "rgba(59,130,246,0.10)" } : undefined}
    >
      <div
        className="shrink-0 flex items-center justify-center w-6 h-6 rounded"
        style={{ color, background: `${color}18` }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm truncate" style={{ color: "var(--text-primary)" }}>
          {item.title}
        </div>
        {item.type === "nav"
          ? <div className="text-xs" style={{ color: "var(--text-muted)" }}>{(item as NavItem).subtitle}</div>
          : (item as SearchResult).subtitle && (
              <div className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{(item as SearchResult).subtitle}</div>
            )
        }
      </div>
      {badge && (
        <span
          className="shrink-0 text-[10px] px-1.5 py-0.5 rounded font-medium"
          style={{ background: `${color}18`, color }}
        >
          {badge}
        </span>
      )}
      {item.type !== "nav" && (
        <span className="shrink-0 text-[10px]" style={{ color: "var(--text-muted)" }}>
          {TYPE_LABEL[item.type]}
        </span>
      )}
    </button>
  );
}

// ─── Main palette ──────────────────────────────────────────────────────────

export default function CommandPalette({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const familyId = useFamilyId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  // Displayed items: nav items when empty, search results when typing
  const filtered = query.trim().length === 0
    ? NAV_ITEMS
    : results;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const fetchResults = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const url = familyId
        ? `/api/search?q=${encodeURIComponent(q)}&familyId=${encodeURIComponent(familyId)}`
        : `/api/search?q=${encodeURIComponent(q)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [familyId]);

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => fetchResults(query), 200);
    return () => clearTimeout(t);
  }, [query, fetchResults]);

  function navigate(item: AnyItem) {
    router.push(item.href);
    onClose();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[activeIndex]) navigate(filtered[activeIndex]);
    } else if (e.key === "Escape") {
      onClose();
    }
  }

  const isEmpty = query.trim().length >= 2 && !loading && results.length === 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50"
        style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(2px)" }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed z-50 left-1/2 -translate-x-1/2 flex flex-col rounded-xl border overflow-hidden"
        style={{
          top: "15vh",
          width: "min(600px, calc(100vw - 32px))",
          maxHeight: "60vh",
          background: "var(--bg-surface)",
          borderColor: "var(--border)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
        }}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b" style={{ borderColor: "var(--border)" }}>
          <Search size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search deals, contacts, portfolio, pages…"
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "var(--text-primary)" }}
          />
          {loading && (
            <div
              className="w-3.5 h-3.5 rounded-full border-2 border-t-transparent animate-spin shrink-0"
              style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }}
            />
          )}
          {query && (
            <button onClick={() => setQuery("")} style={{ color: "var(--text-muted)" }} className="shrink-0 hover:opacity-70">
              <X size={14} />
            </button>
          )}
          <kbd
            className="shrink-0 text-[10px] px-1.5 py-0.5 rounded border"
            style={{ color: "var(--text-muted)", borderColor: "var(--border)", background: "var(--bg-elevated)" }}
          >
            ESC
          </kbd>
        </div>

        {/* Section label */}
        {query.trim().length === 0 && (
          <div
            className="px-4 py-2 text-[10px] tracking-widest uppercase"
            style={{ color: "var(--text-muted)", background: "var(--bg-elevated)", borderBottom: `1px solid var(--border)` }}
          >
            Navigate
          </div>
        )}
        {query.trim().length >= 2 && !loading && results.length > 0 && (
          <div
            className="px-4 py-2 text-[10px] tracking-widest uppercase"
            style={{ color: "var(--text-muted)", background: "var(--bg-elevated)", borderBottom: `1px solid var(--border)` }}
          >
            Results
          </div>
        )}

        {/* Items */}
        <div className="overflow-y-auto flex-1">
          {isEmpty ? (
            <div className="px-4 py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
              No results for &ldquo;{query}&rdquo;
            </div>
          ) : (
            filtered.map((item, i) => (
              <Item
                key={item.id}
                item={item}
                active={i === activeIndex}
                onSelect={() => navigate(item)}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div
          className={cn("flex items-center gap-4 px-4 py-2 text-[10px] border-t")}
          style={{ color: "var(--text-muted)", borderColor: "var(--border)", background: "var(--bg-elevated)" }}
        >
          <span><kbd className="font-mono">↑↓</kbd> navigate</span>
          <span><kbd className="font-mono">↵</kbd> open</span>
          <span><kbd className="font-mono">esc</kbd> close</span>
        </div>
      </div>
    </>
  );
}
