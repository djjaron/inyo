"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import { ChevronDown, ChevronRight, Link as LinkIcon, Copy, CheckCheck } from "lucide-react";

interface OpenApiSpec {
  openapi: string;
  info: { title: string; description: string; version: string };
  tags: Array<{ name: string; description?: string }>;
  paths: Record<string, Record<string, PathItem>>;
  components?: { schemas?: Record<string, SchemaObject> };
}

interface PathItem {
  summary?: string;
  description?: string;
  tags?: string[];
  parameters?: Parameter[];
  requestBody?: { content: Record<string, { schema: SchemaObject }> };
  responses: Record<string, { description: string; content?: Record<string, { schema: SchemaObject }> }>;
}

interface Parameter {
  name: string;
  in: "query" | "path" | "header";
  required?: boolean;
  description?: string;
  schema?: { type: string; enum?: string[] };
}

interface SchemaObject {
  type?: string;
  properties?: Record<string, SchemaObject>;
  items?: SchemaObject;
  $ref?: string;
  description?: string;
  required?: string[];
  enum?: string[];
}

const METHOD_STYLES: Record<string, React.CSSProperties> = {
  get: { background: "rgba(59,130,246,0.15)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.3)" },
  post: { background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" },
  patch: { background: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" },
  delete: { background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" },
  put: { background: "rgba(139,92,246,0.15)", color: "#8b5cf6", border: "1px solid rgba(139,92,246,0.3)" },
};

const HTTP_METHODS = ["get", "post", "patch", "delete", "put"] as const;

function resolveSchemaProperties(
  schema: SchemaObject,
  schemas?: Record<string, SchemaObject>
): Record<string, SchemaObject> | null {
  if (schema.$ref && schemas) {
    const refName = schema.$ref.replace("#/components/schemas/", "");
    const resolved = schemas[refName];
    if (resolved?.properties) return resolved.properties;
  }
  if (schema.type === "array" && schema.items) {
    return resolveSchemaProperties(schema.items, schemas);
  }
  if (schema.properties) return schema.properties;
  return null;
}

function SchemaProperties({
  schema,
  schemas,
  indent = 0,
}: {
  schema: SchemaObject;
  schemas?: Record<string, SchemaObject>;
  indent?: number;
}) {
  const props = resolveSchemaProperties(schema, schemas);
  if (!props) return null;
  return (
    <div style={{ marginLeft: indent * 12 }}>
      {Object.entries(props).map(([key, val]) => (
        <div
          key={key}
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 8,
            padding: "3px 0",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          <span style={{ fontFamily: "monospace", fontSize: 12, color: "var(--text-primary)", minWidth: 120 }}>
            {key}
          </span>
          <span
            style={{
              fontSize: 10,
              color: "#f59e0b",
              background: "rgba(245,158,11,0.08)",
              border: "1px solid rgba(245,158,11,0.15)",
              borderRadius: 3,
              padding: "1px 5px",
              fontFamily: "monospace",
            }}
          >
            {val.type ?? (val.$ref ? val.$ref.replace("#/components/schemas/", "") : "object")}
          </span>
          {val.description && (
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{val.description}</span>
          )}
        </div>
      ))}
    </div>
  );
}

function EndpointCard({
  method,
  path,
  item,
  isExpanded,
  onToggle,
  schemas,
}: {
  method: string;
  path: string;
  item: PathItem;
  isExpanded: boolean;
  onToggle: () => void;
  schemas?: Record<string, SchemaObject>;
}) {
  const methodStyle = METHOD_STYLES[method] ?? METHOD_STYLES.get;

  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: 8,
        overflow: "hidden",
        marginBottom: 8,
      }}
    >
      {/* Row */}
      <button
        onClick={onToggle}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          width: "100%",
          padding: "12px 16px",
          background: isExpanded ? "var(--bg-elevated)" : "var(--bg-surface)",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          transition: "background 0.15s",
        }}
      >
        {/* Method badge */}
        <span
          style={{
            ...methodStyle,
            display: "inline-flex",
            alignItems: "center",
            borderRadius: 4,
            padding: "3px 8px",
            fontSize: 11,
            fontWeight: 700,
            fontFamily: "monospace",
            letterSpacing: "0.04em",
            minWidth: 56,
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {method.toUpperCase()}
        </span>

        {/* Path */}
        <span
          style={{
            fontFamily: "monospace",
            fontSize: 13,
            color: "var(--text-primary)",
            fontWeight: 500,
            flexShrink: 0,
          }}
        >
          {path}
        </span>

        {/* Summary */}
        {item.summary && (
          <span style={{ fontSize: 12, color: "var(--text-secondary)", marginLeft: 4 }}>
            {item.summary}
          </span>
        )}

        {/* Chevron */}
        <span style={{ marginLeft: "auto", color: "var(--text-muted)", flexShrink: 0 }}>
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: 16,
            margin: 12,
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          {/* Description */}
          {item.description && (
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
              {item.description}
            </p>
          )}

          {/* Parameters */}
          {item.parameters && item.parameters.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: 10,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: 8,
                  fontWeight: 600,
                }}
              >
                Parameters
              </div>
              <div
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  overflow: "hidden",
                }}
              >
                {/* Header */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "140px 70px 60px 80px 1fr",
                    gap: 8,
                    padding: "6px 12px",
                    background: "var(--bg-base)",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  {["Name", "In", "Required", "Type", "Description"].map((h) => (
                    <span
                      key={h}
                      style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}
                    >
                      {h}
                    </span>
                  ))}
                </div>
                {item.parameters.map((p) => (
                  <div
                    key={p.name}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "140px 70px 60px 80px 1fr",
                      gap: 8,
                      padding: "8px 12px",
                      borderBottom: "1px solid var(--border-subtle)",
                      alignItems: "start",
                    }}
                  >
                    <span style={{ fontFamily: "monospace", fontSize: 12, color: "var(--text-primary)" }}>
                      {p.name}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{p.in}</span>
                    <span>
                      {p.required ? (
                        <span style={{ fontSize: 10, color: "#ef4444", fontWeight: 600 }}>yes</span>
                      ) : (
                        <span style={{ fontSize: 10, color: "var(--text-muted)" }}>no</span>
                      )}
                    </span>
                    <span style={{ fontSize: 11, color: "#f59e0b", fontFamily: "monospace" }}>
                      {p.schema?.type ?? "string"}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      {p.description ?? "—"}
                      {p.schema?.enum && (
                        <span style={{ display: "block", marginTop: 2, color: "var(--text-muted)" }}>
                          One of: {p.schema.enum.join(", ")}
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Request body */}
          {item.requestBody && (
            <div>
              <div
                style={{
                  fontSize: 10,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: 8,
                  fontWeight: 600,
                }}
              >
                Request Body
              </div>
              {Object.entries(item.requestBody.content).map(([contentType, val]) => (
                <div key={contentType}>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6, fontFamily: "monospace" }}>
                    {contentType}
                  </div>
                  <div
                    style={{
                      border: "1px solid var(--border)",
                      borderRadius: 6,
                      overflow: "hidden",
                    }}
                  >
                    <SchemaProperties schema={val.schema} schemas={schemas} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Responses */}
          <div>
            <div
              style={{
                fontSize: 10,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 8,
                fontWeight: 600,
              }}
            >
              Responses
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {Object.entries(item.responses).map(([code, resp]) => {
                const isSuccess = code.startsWith("2");
                const codeStyle: React.CSSProperties = isSuccess
                  ? { background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }
                  : { background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" };

                return (
                  <div key={code} style={{ border: "1px solid var(--border)", borderRadius: 6, overflow: "hidden" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "8px 12px",
                        background: "var(--bg-base)",
                        borderBottom: resp.content ? "1px solid var(--border)" : "none",
                      }}
                    >
                      <span
                        style={{
                          ...codeStyle,
                          borderRadius: 4,
                          padding: "2px 8px",
                          fontSize: 11,
                          fontWeight: 700,
                          fontFamily: "monospace",
                        }}
                      >
                        {code}
                      </span>
                      <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                        {resp.description}
                      </span>
                    </div>
                    {resp.content && (
                      <div style={{ padding: "8px 12px" }}>
                        {Object.entries(resp.content).map(([ct, val]) => (
                          <div key={ct}>
                            <SchemaProperties schema={val.schema} schemas={schemas} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ApiDocsPage() {
  const [spec, setSpec] = useState<OpenApiSpec | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [expandedPath, setExpandedPath] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/openapi")
      .then((r) => r.json())
      .then((data: OpenApiSpec) => {
        setSpec(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function copySpecUrl() {
    navigator.clipboard.writeText(window.location.origin + "/api/openapi");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function toggleExpanded(key: string) {
    setExpandedPath((prev) => (prev === key ? null : key));
  }

  // Build flat list of (method, path, item) tuples filtered by activeTag
  const endpoints: Array<{ method: string; path: string; item: PathItem }> = [];
  if (spec) {
    for (const [path, pathObj] of Object.entries(spec.paths)) {
      for (const method of HTTP_METHODS) {
        const item = pathObj[method] as PathItem | undefined;
        if (!item) continue;
        if (activeTag !== null && !item.tags?.includes(activeTag)) continue;
        endpoints.push({ method, path, item });
      }
    }
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="API Reference"
        subtitle={spec?.info.description ?? "Interactive REST API documentation"}
        actions={
          <>
            {spec && (
              <Badge label={`v${spec.info.version}`} variant="accent" size="xs" />
            )}
            <button
              onClick={copySpecUrl}
              title="Copy OpenAPI spec URL"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: 6,
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                color: "var(--text-secondary)",
                fontSize: 12,
                cursor: "pointer",
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "var(--accent)"; e.currentTarget.style.borderColor = "var(--accent)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.borderColor = "var(--border)"; }}
            >
              {copied ? <CheckCheck size={13} /> : <Copy size={13} />}
              {copied ? "Copied!" : "Copy spec URL"}
              <LinkIcon size={12} style={{ opacity: 0.5 }} />
            </button>
          </>
        }
      />

      {/* Tag filter tabs */}
      {spec && (
        <div
          className="flex items-center gap-1 px-8 py-3 border-b overflow-x-auto"
          style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}
        >
          <button
            onClick={() => setActiveTag(null)}
            className="px-3 py-1.5 rounded text-xs whitespace-nowrap transition-colors"
            style={
              activeTag === null
                ? { background: "var(--accent)", color: "#fff" }
                : { color: "var(--text-secondary)" }
            }
          >
            All
          </button>
          {spec.tags.map((tag) => (
            <button
              key={tag.name}
              onClick={() => setActiveTag(tag.name)}
              className="px-3 py-1.5 rounded text-xs whitespace-nowrap transition-colors"
              style={
                activeTag === tag.name
                  ? { background: "var(--accent)", color: "#fff" }
                  : { color: "var(--text-secondary)" }
              }
              title={tag.description}
            >
              {tag.name}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto px-8 py-6">
        {loading ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: 120,
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                border: "2px solid var(--border)",
                borderTopColor: "var(--accent)",
                animation: "spin 0.7s linear infinite",
              }}
            />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : !spec ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text-muted)", fontSize: 13 }}>
            Failed to load API specification.
          </div>
        ) : endpoints.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text-muted)", fontSize: 13 }}>
            No endpoints in this category.
          </div>
        ) : (
          <div style={{ maxWidth: 900 }}>
            {endpoints.map(({ method, path, item }) => {
              const key = `${method}:${path}`;
              return (
                <EndpointCard
                  key={key}
                  method={method}
                  path={path}
                  item={item}
                  isExpanded={expandedPath === key}
                  onToggle={() => toggleExpanded(key)}
                  schemas={spec.components?.schemas}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
