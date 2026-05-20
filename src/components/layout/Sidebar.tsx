"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  BarChart3,
  DollarSign,
  Scale,
  Receipt,
  Briefcase,
  Heart,
  Users,
  Store,
  Settings,
  Zap,
  Upload,
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

const nav = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Opportunities", href: "/opportunities", icon: TrendingUp },
  { label: "Portfolio", href: "/portfolio", icon: BarChart3 },
  { label: "Finance", href: "/finance", icon: DollarSign },
  { label: "Legal", href: "/legal", icon: Scale },
  { label: "Tax", href: "/tax", icon: Receipt },
  { label: "Concierge", href: "/concierge", icon: Briefcase },
  { label: "Philanthropy", href: "/philanthropy", icon: Heart },
  { label: "Relationships", href: "/relationships", icon: Users },
  { label: "Marketplace", href: "/marketplace", icon: Store },
];

const importLinks = [
  { label: "Import Deals", href: "/import/deals", icon: Upload },
  { label: "Import Contacts", href: "/import/contacts", icon: Upload },
];

export default function Sidebar() {
  const path = usePathname();

  return (
    <aside
      className="flex flex-col shrink-0 h-full border-r"
      style={{
        width: "var(--sidebar-width)",
        background: "var(--bg-surface)",
        borderColor: "var(--border)",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-5 border-b" style={{ borderColor: "var(--border)" }}>
        <div
          className="flex items-center justify-center w-7 h-7 rounded-md text-white text-xs font-bold tracking-tight"
          style={{ background: "var(--accent)" }}
        >
          FO
        </div>
        <div>
          <div className="text-sm font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Inyo
          </div>
          <div className="text-[10px] tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>
            Family Office OS
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {nav.map(({ label, href, icon: Icon }) => {
          const active = path === href || (href !== "/dashboard" && path.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-md mb-0.5 text-sm transition-colors",
                active
                  ? "font-medium"
                  : "hover:bg-white/5"
              )}
              style={
                active
                  ? { background: "rgba(59,130,246,0.12)", color: "var(--accent)" }
                  : { color: "var(--text-secondary)" }
              }
            >
              <Icon size={15} strokeWidth={active ? 2 : 1.5} />
              {label}
            </Link>
          );
        })}

        {/* Import links */}
        <div className="mt-2 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
          <div className="px-3 py-1 text-xs tracking-widest uppercase mb-1" style={{ color: "var(--text-muted)" }}>
            Import
          </div>
          {importLinks.map(({ label, href, icon: Icon }) => {
            const active = path.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-md mb-0.5 text-sm transition-colors",
                  active ? "font-medium" : "hover:bg-white/5"
                )}
                style={
                  active
                    ? { background: "rgba(59,130,246,0.12)", color: "var(--accent)" }
                    : { color: "var(--text-muted)" }
                }
              >
                <Icon size={14} strokeWidth={1.5} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom */}
      <div className="border-t px-2 py-3" style={{ borderColor: "var(--border)" }}>
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-md text-xs mb-1"
          style={{ color: "var(--text-muted)" }}
        >
          <Zap size={13} />
          <span>3 agents active</span>
          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 agent-active" />
        </div>
        <Link
          href="/settings"
          className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm hover:bg-white/5 transition-colors mb-2"
          style={{ color: "var(--text-secondary)" }}
        >
          <Settings size={15} strokeWidth={1.5} />
          Settings
        </Link>
        <div className="px-3 py-2">
          <UserButton
            appearance={{
              variables: { colorPrimary: "#3b82f6" },
              elements: {
                userButtonAvatarBox: { width: "28px", height: "28px" },
              },
            }}
          />
        </div>
      </div>
    </aside>
  );
}
