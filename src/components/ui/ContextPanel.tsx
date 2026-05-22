"use client";

import { X } from "lucide-react";
import { usePanel } from "@/context/PanelContext";

interface ContextPanelTab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number;
}

interface ContextPanelProps {
  title: string;
  subtitle?: string;
  tabs?: ContextPanelTab[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export default function ContextPanel({
  title,
  subtitle,
  tabs,
  activeTab,
  onTabChange,
  actions,
  children,
}: ContextPanelProps) {
  const { closePanel } = usePanel();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          padding: "16px 16px 12px",
          borderBottom: tabs && tabs.length > 0 ? "none" : "1px solid var(--border)",
          flexShrink: 0,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--text-primary)",
              lineHeight: 1.3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                marginTop: 2,
                lineHeight: 1.4,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {subtitle}
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            marginLeft: 8,
            flexShrink: 0,
          }}
        >
          {actions}
          <button
            onClick={closePanel}
            aria-label="Close panel"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 24,
              height: 24,
              borderRadius: 4,
              border: "none",
              background: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--bg-elevated)";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "none";
              e.currentTarget.style.color = "var(--text-muted)";
            }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Tab bar (optional) */}
      {tabs && tabs.length > 0 && (
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid var(--border)",
            padding: "0 12px",
            flexShrink: 0,
            overflowX: "auto",
            scrollbarWidth: "none",
          }}
        >
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange?.(tab.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "7px 8px",
                  fontSize: 12,
                  fontWeight: isActive ? 500 : 400,
                  color: isActive ? "var(--text-primary)" : "var(--text-muted)",
                  borderBottom: isActive ? "2px solid var(--accent)" : "2px solid transparent",
                  background: "none",
                  border: "none",
                  borderRadius: 0,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  marginBottom: -1,
                  transition: "color 0.12s",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.color = "var(--text-secondary)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.color = "var(--text-muted)";
                }}
              >
                {tab.icon && (
                  <span style={{ display: "flex", alignItems: "center" }}>{tab.icon}</span>
                )}
                {tab.label}
                {tab.badge != null && tab.badge > 0 && (
                  <span
                    style={{
                      fontSize: 10,
                      background: "var(--accent-muted)",
                      color: "var(--accent)",
                      padding: "1px 5px",
                      borderRadius: 999,
                      fontWeight: 600,
                      lineHeight: 1.4,
                    }}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Scrollable body */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          padding: "16px",
        }}
      >
        {children}
      </div>
    </div>
  );
}
