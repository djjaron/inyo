import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "USD"): string {
  if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function scoreColor(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-amber-400";
  return "text-red-400";
}

export function scoreBg(score: number): string {
  if (score >= 80) return "bg-emerald-400/10 border-emerald-400/20";
  if (score >= 60) return "bg-amber-400/10 border-amber-400/20";
  return "bg-red-400/10 border-red-400/20";
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    active: "text-emerald-400",
    invested: "text-emerald-400",
    completed: "text-emerald-400",
    inbound: "text-sky-400",
    reviewing: "text-sky-400",
    diligence: "text-amber-400",
    "ic-review": "text-amber-400",
    pending: "text-amber-400",
    passed: "text-zinc-500",
    archived: "text-zinc-600",
    "written-off": "text-red-500",
    watchlist: "text-orange-400",
    alert: "text-red-400",
    critical: "text-red-500",
  };
  return map[status] ?? "text-zinc-400";
}
