"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard error]", error);
  }, [error]);

  return (
    <div
      className="flex flex-col items-center justify-center h-full gap-6 p-8"
      style={{ background: "var(--bg-base)" }}
    >
      <div
        className="flex items-center justify-center w-12 h-12 rounded-full"
        style={{ background: "rgba(239,68,68,0.1)" }}
      >
        <AlertTriangle size={22} style={{ color: "#ef4444" }} />
      </div>
      <div className="text-center max-w-sm">
        <div className="text-base font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
          Something went wrong
        </div>
        <div className="text-sm" style={{ color: "var(--text-muted)" }}>
          {error.message || "An unexpected error occurred. Try refreshing the page."}
        </div>
      </div>
      <button
        onClick={reset}
        className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium"
        style={{ background: "var(--accent)", color: "#fff" }}
      >
        <RefreshCw size={14} />
        Try again
      </button>
    </div>
  );
}
