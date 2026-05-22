"use client";

import { usePanel } from "@/context/PanelContext";

export default function ThreeColumnLayout({ children }: { children: React.ReactNode }) {
  const { panelContent, isPanelOpen } = usePanel();

  return (
    <div style={{ display: "flex", flex: 1, height: "100%", overflow: "hidden", minWidth: 0 }}>
      {/* Column 2 — main content */}
      <div
        style={{
          flex: 1,
          minWidth: isPanelOpen ? "var(--col2-min-width)" : 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          background: "var(--bg-base)",
        }}
      >
        {children}
      </div>

      {/* Column 3 — context panel (slides in/out) */}
      <div
        aria-hidden={!isPanelOpen}
        style={{
          width: isPanelOpen ? "var(--panel-width)" : 0,
          minWidth: isPanelOpen ? "var(--panel-width)" : 0,
          overflow: "hidden",
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          background: "var(--bg-surface)",
          borderLeft: isPanelOpen ? "1px solid var(--border)" : "none",
          transition: "width 200ms ease, min-width 200ms ease",
          height: "100%",
        }}
      >
        {isPanelOpen ? panelContent : null}
      </div>
    </div>
  );
}
