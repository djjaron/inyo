"use client";

import { Store, Download, Star, Zap } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";

const AGENT_PACKS = [
  {
    id: "1",
    name: "Private Market Research",
    description: "Track deal flow across AI, biotech, energy, real estate, and credit. Daily sector digests.",
    category: "Research",
    price: "+$3K/mo",
    rating: 4.9,
    installs: 42,
    status: "available",
  },
  {
    id: "2",
    name: "Real Estate Asset Manager",
    description: "NOI tracking, lease management, maintenance coordination, and vendor relationships across properties.",
    category: "Operations",
    price: "+$2.5K/mo",
    rating: 4.7,
    installs: 28,
    status: "available",
  },
  {
    id: "3",
    name: "Risk Radar",
    description: "Macro event monitoring, litigation tracking, geopolitical risk alerts, and regulatory change summaries.",
    category: "Intelligence",
    price: "+$2K/mo",
    rating: 4.8,
    installs: 35,
    status: "available",
  },
  {
    id: "4",
    name: "Yacht & Aviation Ops",
    description: "Maintenance scheduling, crew management, compliance tracking, and logistics coordination.",
    category: "Lifestyle",
    price: "+$4K/mo",
    rating: 4.6,
    installs: 12,
    status: "available",
  },
  {
    id: "5",
    name: "Bloomberg Data Bridge",
    description: "Live market data, pricing feeds, and analytics directly in your family office context.",
    category: "Data",
    price: "+$5K/mo",
    rating: 4.5,
    installs: 19,
    status: "coming-soon",
  },
  {
    id: "6",
    name: "CPA Integration Suite",
    description: "Direct sync with your accounting firm — automated K-1 collection, AP approvals, and filing confirmations.",
    category: "Finance",
    price: "Custom",
    rating: 0,
    installs: 0,
    status: "coming-soon",
  },
];

const categoryVariant: Record<string, "accent" | "success" | "warning" | "muted" | "default"> = {
  Research: "accent",
  Operations: "success",
  Intelligence: "warning",
  Lifestyle: "default",
  Data: "muted",
  Finance: "success",
};

export default function MarketplacePage() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Agent Marketplace"
        subtitle="Premium agent packs for advanced family office operations"
      />

      {/* Installed badge */}
      <div
        className="flex items-center gap-3 px-8 py-3 border-b text-xs"
        style={{ borderColor: "var(--border)", background: "var(--bg-surface)", color: "var(--text-muted)" }}
      >
        <Zap size={12} style={{ color: "var(--accent)" }} />
        <span>10 core agents active</span>
        <span className="mx-1">·</span>
        <span>0 premium packs installed</span>
      </div>

      <div className="flex-1 overflow-auto p-8">
        <div className="grid grid-cols-3 gap-4">
          {AGENT_PACKS.map((pack) => (
            <div
              key={pack.id}
              className="flex flex-col p-5 rounded-md border"
              style={{
                background: "var(--bg-surface)",
                borderColor: pack.status === "coming-soon" ? "var(--border-subtle)" : "var(--border)",
                opacity: pack.status === "coming-soon" ? 0.65 : 1,
              }}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{pack.name}</div>
                  <div className="mt-1">
                    <Badge label={pack.category} variant={categoryVariant[pack.category]} size="xs" />
                  </div>
                </div>
                {pack.status === "coming-soon" && (
                  <Badge label="Coming Soon" variant="muted" size="xs" />
                )}
              </div>

              <p className="text-xs flex-1 mb-4" style={{ color: "var(--text-secondary)", lineHeight: 1.65 }}>
                {pack.description}
              </p>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{pack.price}</div>
                  {pack.rating > 0 && (
                    <div className="flex items-center gap-1 text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      <Star size={10} fill="currentColor" />
                      {pack.rating} · {pack.installs} installs
                    </div>
                  )}
                </div>
                {pack.status === "available" ? (
                  <button
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium"
                    style={{ background: "var(--accent)", color: "#fff" }}
                  >
                    <Download size={11} />
                    Install
                  </button>
                ) : (
                  <button
                    className="px-3 py-1.5 rounded text-xs"
                    style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}
                    disabled
                  >
                    Notify Me
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
