import { cn } from "@/lib/utils";

interface BadgeProps {
  label: string;
  variant?: "default" | "success" | "warning" | "danger" | "muted" | "accent";
  size?: "sm" | "xs";
}

const variants = {
  default: { background: "rgba(139,144,153,0.1)", color: "var(--text-secondary)", border: "1px solid rgba(139,144,153,0.15)" },
  success: { background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" },
  warning: { background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" },
  danger: { background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" },
  muted: { background: "transparent", color: "var(--text-muted)", border: "1px solid var(--border)" },
  accent: { background: "rgba(59,130,246,0.1)", color: "var(--accent)", border: "1px solid rgba(59,130,246,0.2)" },
};

export default function Badge({ label, variant = "default", size = "sm" }: BadgeProps) {
  const s = variants[variant];
  return (
    <span
      style={{
        ...s,
        display: "inline-flex",
        alignItems: "center",
        borderRadius: "3px",
        padding: size === "xs" ? "1px 6px" : "2px 8px",
        fontSize: size === "xs" ? "10px" : "11px",
        fontWeight: 500,
        letterSpacing: "0.03em",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}
