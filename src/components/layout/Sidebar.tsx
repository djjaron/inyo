"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  LayoutDashboard,
  TrendingUp,
  BarChart3,
  CheckCircle2,
  DollarSign,
  Calendar,
  Scale,
  Receipt,
  Briefcase,
  Heart,
  Users,
  Store,
  Settings,
  Zap,
  Upload,
  Layers,
  Bell,
  AlertTriangle,
  CheckCircle,
  Activity,
  X,
  ClipboardList,
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { useFamilyId } from "@/context/FamilyContext";
import type { NotificationItem } from "@/app/api/notifications/route";

const nav = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Approvals", href: "/approvals", icon: CheckCircle2 },
  { label: "Opportunities", href: "/opportunities", icon: TrendingUp },
  { label: "Portfolio", href: "/portfolio", icon: BarChart3 },
  { label: "Finance", href: "/finance", icon: DollarSign },
  { label: "Legal", href: "/legal", icon: Scale },
  { label: "Tax", href: "/tax", icon: Receipt },
  { label: "Concierge", href: "/concierge", icon: Briefcase },
  { label: "Philanthropy", href: "/philanthropy", icon: Heart },
  { label: "Relationships", href: "/relationships", icon: Users },
];

const secondaryNav = [
  { label: "Calendar", href: "/calendar", icon: Calendar },
  { label: "SPV", href: "/spv", icon: Layers },
  { label: "Marketplace", href: "/marketplace", icon: Store },
  { label: "Audit Log", href: "/audit-log", icon: ClipboardList },
];

const importLinks = [
  { label: "Import Deals", href: "/import/deals", icon: Upload },
  { label: "Import Contacts", href: "/import/contacts", icon: Upload },
];

const SEVERITY_COLOR: Record<string, string> = {
  urgent: "#ef4444",
  critical: "#ef4444",
  warning: "#f59e0b",
  info: "var(--accent)",
};

const TYPE_ICON: Record<string, React.ReactNode> = {
  "approval": <CheckCircle size={12} />,
  "portfolio-alert": <AlertTriangle size={12} />,
  "agent-failure": <Activity size={12} />,
};

function NotificationPanel({
  notifications,
  unreadCount,
  onClose,
}: {
  notifications: NotificationItem[];
  unreadCount: number;
  onClose: () => void;
}) {
  const groups: Record<string, NotificationItem[]> = {};
  for (const n of notifications) {
    (groups[n.type] ??= []).push(n);
  }

  const GROUP_LABEL: Record<string, string> = {
    approval: "Approvals",
    "portfolio-alert": "Portfolio Alerts",
    "agent-failure": "Agent Failures",
  };

  return (
    <div
      className="fixed z-50 flex flex-col rounded-lg border overflow-hidden"
      style={{
        left: "248px",
        bottom: "56px",
        width: "320px",
        maxHeight: "480px",
        background: "var(--bg-surface)",
        borderColor: "var(--border)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b shrink-0"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Notifications
          </span>
          {unreadCount > 0 && (
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: "#ef4444", color: "#fff" }}
            >
              {unreadCount}
            </span>
          )}
        </div>
        <button onClick={onClose} style={{ color: "var(--text-muted)" }} className="hover:opacity-70">
          <X size={14} />
        </button>
      </div>

      {/* Items */}
      <div className="overflow-y-auto flex-1">
        {Object.entries(groups).map(([type, items]) => (
          <div key={type}>
            <div
              className="px-4 py-2 text-[10px] tracking-widest uppercase border-b"
              style={{ color: "var(--text-muted)", borderColor: "var(--border)", background: "var(--bg-elevated)" }}
            >
              {GROUP_LABEL[type] ?? type}
            </div>
            {items.map((n) => (
              <Link
                key={n.id}
                href={n.href}
                onClick={onClose}
                className="flex gap-3 px-4 py-3 hover:bg-white/5 transition-colors border-b"
                style={{ borderColor: "var(--border)" }}
              >
                <div
                  className="mt-0.5 shrink-0 flex items-center justify-center w-5 h-5 rounded-full"
                  style={{ color: SEVERITY_COLOR[n.severity] ?? "var(--accent)", background: `${SEVERITY_COLOR[n.severity] ?? "var(--accent)"}18` }}
                >
                  {TYPE_ICON[n.type]}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>
                    {n.title}
                  </div>
                  {n.body && (
                    <div className="text-xs mt-0.5 line-clamp-2" style={{ color: "var(--text-muted)" }}>
                      {n.body}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ))}
        {notifications.length === 0 && (
          <div className="px-4 py-8 text-center text-xs" style={{ color: "var(--text-muted)" }}>
            No notifications
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t px-4 py-2.5 shrink-0" style={{ borderColor: "var(--border)" }}>
        <Link
          href="/approvals"
          onClick={onClose}
          className="text-xs hover:opacity-80 transition-opacity"
          style={{ color: "var(--accent)" }}
        >
          View all approvals →
        </Link>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const path = usePathname();
  const familyId = useFamilyId();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    const url = familyId
      ? `/api/notifications?familyId=${encodeURIComponent(familyId)}`
      : "/api/notifications";
    const res = await fetch(url).catch(() => null);
    if (!res?.ok) return;
    const data = await res.json();
    setNotifications(data.notifications ?? []);
    setUnreadCount(data.unreadCount ?? 0);
  }, [familyId]);

  useEffect(() => {
    fetchNotifications();
    const id = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(id);
  }, [fetchNotifications]);

  // Close panel on outside click
  useEffect(() => {
    if (!showNotifications) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showNotifications]);

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
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Inyo
          </div>
          <div className="text-[10px] tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>
            Family Office OS
          </div>
        </div>
        <kbd
          className="text-[10px] px-1.5 py-0.5 rounded border shrink-0"
          style={{ color: "var(--text-muted)", borderColor: "var(--border)", background: "var(--bg-elevated)" }}
          title="Press ⌘K to search"
        >
          ⌘K
        </kbd>
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

        {/* Secondary nav */}
        <div className="mt-2 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
          <div className="px-3 py-1 text-[10px] tracking-widest uppercase mb-0.5" style={{ color: "var(--text-muted)" }}>
            More
          </div>
          {secondaryNav.map(({ label, href, icon: Icon }) => {
            const active = path === href || (href !== "/dashboard" && path.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn("flex items-center gap-2.5 px-3 py-1.5 rounded-md mb-0.5 text-sm transition-colors", active ? "font-medium" : "hover:bg-white/5")}
                style={active ? { background: "rgba(59,130,246,0.12)", color: "var(--accent)" } : { color: "var(--text-muted)" }}
              >
                <Icon size={14} strokeWidth={active ? 2 : 1.5} />
                {label}
              </Link>
            );
          })}
        </div>

        {/* Import links */}
        <div className="mt-1 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
          <div className="px-3 py-1 text-[10px] tracking-widest uppercase mb-0.5" style={{ color: "var(--text-muted)" }}>
            Import
          </div>
          {importLinks.map(({ label, href, icon: Icon }) => {
            const active = path.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn("flex items-center gap-2.5 px-3 py-1.5 rounded-md mb-0.5 text-sm transition-colors", active ? "font-medium" : "hover:bg-white/5")}
                style={active ? { background: "rgba(59,130,246,0.12)", color: "var(--accent)" } : { color: "var(--text-muted)" }}
              >
                <Icon size={14} strokeWidth={1.5} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom */}
      <div className="border-t px-2 py-3" style={{ borderColor: "var(--border)" }} ref={panelRef}>
        {showNotifications && (
          <NotificationPanel
            notifications={notifications}
            unreadCount={unreadCount}
            onClose={() => setShowNotifications(false)}
          />
        )}
        <Link
          href="/agents"
          className="flex items-center gap-2 px-3 py-2 rounded-md text-xs mb-1 hover:bg-white/5 transition-colors"
          style={{ color: "var(--text-muted)" }}
        >
          <Zap size={13} style={{ color: "var(--accent)" }} />
          <span>Agents</span>
          <span className="ml-auto" style={{ color: "var(--accent)" }}>→</span>
        </Link>
        {/* Notification bell */}
        <button
          onClick={() => setShowNotifications((v) => !v)}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm hover:bg-white/5 transition-colors mb-1 relative"
          style={{ color: "var(--text-secondary)" }}
        >
          <Bell size={15} strokeWidth={showNotifications ? 2 : 1.5} />
          <span>Notifications</span>
          {unreadCount > 0 && (
            <span
              className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: "#ef4444", color: "#fff" }}
            >
              {unreadCount}
            </span>
          )}
        </button>
        <Link
          href="/settings"
          className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm hover:bg-white/5 transition-colors mb-2"
          style={
            path === "/settings"
              ? { background: "rgba(59,130,246,0.12)", color: "var(--accent)" }
              : { color: "var(--text-secondary)" }
          }
        >
          <Settings size={15} strokeWidth={path === "/settings" ? 2 : 1.5} />
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
