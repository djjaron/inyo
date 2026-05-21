"use client";

import { useState } from "react";
import Link from "next/link";
import { Plug, Copy, Check, ArrowRight, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { useFamilyId } from "@/context/FamilyContext";

// ─── Copy Button ──────────────────────────────────────────────────────────────

function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: "5px 10px",
        borderRadius: "5px",
        border: "1px solid var(--border)",
        background: "var(--bg-elevated)",
        color: copied ? "#10b981" : "var(--text-secondary)",
        fontSize: "12px",
        fontWeight: 500,
        cursor: "pointer",
        whiteSpace: "nowrap",
        transition: "color 0.15s",
      }}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

// ─── Integrations Page ────────────────────────────────────────────────────────

export default function IntegrationsPage() {
  const familyId = useFamilyId();

  const ingestEmail = familyId
    ? `deals+${familyId}@inyo-fo.netlify.app`
    : "deals+your-id@inyo-fo.netlify.app";

  const webhookUrl = "https://inyo-fo.netlify.app/api/ingest/email";

  const [testState, setTestState] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleTest() {
    setTestState("loading");
    try {
      const res = await fetch("/api/ingest/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyId: familyId ?? "family_demo",
          subject: "Test: Demo Deal Series A — $5M raise",
          body: "This is a test ingestion from the Integrations page. Company is building AI infrastructure for enterprise.",
          from: "test@inyo-fo.netlify.app",
        }),
      });
      if (res.ok) {
        setTestState("success");
      } else {
        setTestState("error");
      }
    } catch {
      setTestState("error");
    }
  }

  const samplePayload = `{
  "familyId": "fam_abc123",
  "subject": "Intro: TechCo Series A — $8M raise",
  "body": "Hi, wanted to introduce you to TechCo...",
  "from": "john@vcfirm.com"
}`;

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--bg-base)" }}>
      <PageHeader
        title="Integrations"
        subtitle="Connect external data sources"
      />

      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-2xl flex flex-col gap-6">

          {/* ── Section 1: Email Ingestion ── */}
          <div
            className="rounded-lg border overflow-hidden"
            style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
          >
            {/* Card header */}
            <div
              className="flex items-start gap-4 px-6 py-5 border-b"
              style={{ borderColor: "var(--border)" }}
            >
              <div
                className="w-9 h-9 rounded-md flex items-center justify-center shrink-0"
                style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)" }}
              >
                <Plug size={16} style={{ color: "var(--accent)" }} />
              </div>
              <div>
                <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  Deal Inbox
                </div>
                <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  Forward deal flow emails to auto-create inbound deals
                </div>
              </div>
            </div>

            <div className="px-6 py-5">
              {/* Email address display */}
              <div className="mb-1 text-xs font-mono font-medium tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>
                Your unique deal inbox address
              </div>
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-md border mb-5"
                style={{
                  background: "var(--bg-elevated)",
                  borderColor: "var(--border)",
                }}
              >
                <span
                  className="flex-1 text-sm font-mono truncate"
                  style={{ color: familyId ? "var(--text-primary)" : "var(--text-muted)" }}
                >
                  {ingestEmail}
                </span>
                <CopyButton text={ingestEmail} />
              </div>

              {/* Setup instructions */}
              <div
                className="rounded-md border mb-5"
                style={{ borderColor: "var(--border)", background: "var(--bg-base)" }}
              >
                <div
                  className="px-4 py-2.5 text-xs font-mono font-semibold border-b tracking-widest uppercase"
                  style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                >
                  Setup instructions
                </div>
                <ol className="px-4 py-3 flex flex-col gap-3">
                  {[
                    "Copy your unique deal inbox address above",
                    <>
                      In Postmark (or SendGrid / Mailgun), create an inbound route that forwards to:{" "}
                      <span className="font-mono text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--bg-elevated)", color: "var(--accent)" }}>
                        POST {webhookUrl}
                      </span>
                    </>,
                    "Set your email client to BCC or forward deal emails to your deal inbox address",
                    <>
                      Inbound deals will appear automatically in your{" "}
                      <Link href="/opportunities" style={{ color: "var(--accent)" }}>
                        Pipeline
                      </Link>{" "}
                      as "Inbound" status
                    </>,
                  ].map((step, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 text-sm pl-1"
                      style={{
                        color: "var(--text-secondary)",
                        borderLeft: "2px solid var(--border)",
                        paddingLeft: "12px",
                        marginLeft: "4px",
                      }}
                    >
                      <span
                        className="shrink-0 w-5 h-5 rounded-full text-xs font-semibold font-mono flex items-center justify-center"
                        style={{
                          background: "rgba(59,130,246,0.1)",
                          color: "var(--accent)",
                          border: "1px solid rgba(59,130,246,0.2)",
                        }}
                      >
                        {idx + 1}
                      </span>
                      <span style={{ lineHeight: "1.5" }}>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Test button and result */}
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={handleTest}
                  disabled={testState === "loading" || !familyId}
                  className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-colors"
                  style={
                    testState === "loading" || !familyId
                      ? {
                          background: "var(--bg-elevated)",
                          color: "var(--text-muted)",
                          cursor: "not-allowed",
                          border: "1px solid var(--border)",
                        }
                      : {
                          background: "var(--accent)",
                          color: "#fff",
                          cursor: "pointer",
                        }
                  }
                >
                  {testState === "loading" ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      Testing…
                    </>
                  ) : (
                    "Test Ingestion"
                  )}
                </button>

                {testState === "success" && (
                  <div
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-medium"
                    style={{
                      background: "rgba(16,185,129,0.08)",
                      borderColor: "rgba(16,185,129,0.25)",
                      color: "#10b981",
                    }}
                  >
                    <CheckCircle2 size={13} />
                    Test successful — check your{" "}
                    <Link href="/opportunities" className="underline underline-offset-2" style={{ color: "#10b981" }}>
                      Pipeline
                    </Link>
                    <ArrowRight size={11} />
                  </div>
                )}

                {testState === "error" && (
                  <div
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-medium"
                    style={{
                      background: "rgba(239,68,68,0.08)",
                      borderColor: "rgba(239,68,68,0.25)",
                      color: "#ef4444",
                    }}
                  >
                    <AlertCircle size={13} />
                    Test failed
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Section 2: Webhook URL ── */}
          <div
            className="rounded-lg border overflow-hidden"
            style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
          >
            {/* Card header */}
            <div
              className="flex items-start gap-4 px-6 py-5 border-b"
              style={{ borderColor: "var(--border)" }}
            >
              <div
                className="w-9 h-9 rounded-md flex items-center justify-center shrink-0"
                style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)" }}
              >
                <Plug size={16} style={{ color: "var(--accent)" }} />
              </div>
              <div>
                <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  Inbound Webhook
                </div>
                <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  Direct webhook endpoint for programmatic deal creation
                </div>
              </div>
            </div>

            <div className="px-6 py-5">
              {/* Webhook URL */}
              <div className="mb-1 text-xs font-mono font-medium tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>
                Endpoint
              </div>
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-md border mb-5"
                style={{
                  background: "var(--bg-elevated)",
                  borderColor: "var(--border)",
                }}
              >
                <span
                  className="flex-1 text-xs font-mono truncate"
                  style={{ color: "var(--text-primary)" }}
                >
                  <span style={{ color: "var(--text-muted)" }}>POST </span>
                  {webhookUrl}
                </span>
                <CopyButton text={`POST ${webhookUrl}`} />
              </div>

              {/* Payload format */}
              <div className="mb-1 text-xs font-mono font-medium tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>
                Expected payload format
              </div>
              <div
                className="relative rounded-md border overflow-hidden"
                style={{ borderColor: "var(--border)" }}
              >
                <pre
                  className="text-xs p-4 overflow-auto font-mono leading-relaxed"
                  style={{
                    background: "var(--bg-base)",
                    color: "var(--text-secondary)",
                    margin: 0,
                  }}
                >
                  {samplePayload}
                </pre>
                <div className="absolute top-2 right-2">
                  <CopyButton text={samplePayload} />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
