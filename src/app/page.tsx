export default function Home() {
  const agents = [
    {
      symbol: "◈",
      name: "Deal Flow Analyst",
      description: "Screens inbound opportunities against your investment thesis in real time.",
    },
    {
      symbol: "◻",
      name: "IC Memo Writer",
      description: "Generates investment committee memoranda from raw deal materials.",
    },
    {
      symbol: "◉",
      name: "Portfolio Monitor",
      description: "Tracks mark-to-market, covenants, and reporting deadlines across holdings.",
    },
    {
      symbol: "◆",
      name: "CFO Agent",
      description: "Consolidates cash positions, forecasts liquidity, and flags treasury anomalies.",
    },
    {
      symbol: "▣",
      name: "Legal Review",
      description: "Parses subscription agreements, side letters, and LP documents at depth.",
    },
    {
      symbol: "◇",
      name: "Tax Intelligence",
      description: "Surfaces K-1 timing, loss harvesting windows, and entity-level exposures.",
    },
    {
      symbol: "▤",
      name: "Chief of Staff",
      description: "Coordinates principals, manages task queues, and synthesizes daily briefings.",
    },
    {
      symbol: "◌",
      name: "Concierge",
      description: "Handles travel, estate logistics, vendor relationships, and household operations.",
    },
    {
      symbol: "△",
      name: "Philanthropy",
      description: "Structures grant programs, tracks DAF balances, and manages foundation reporting.",
    },
    {
      symbol: "◎",
      name: "Relationship Intelligence",
      description: "Maps your network, surfaces warm introductions, and tracks interaction history.",
    },
  ];

  return (
    <div
      className="flex-1 h-full overflow-y-auto"
      style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}
    >
      {/* ── Navbar ───────────────────────────────────────────────────── */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 48px",
          height: "64px",
          background: "rgba(10, 11, 13, 0.92)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-inter), system-ui",
            fontSize: "13px",
            fontWeight: 600,
            letterSpacing: "0.28em",
            color: "var(--text-primary)",
          }}
        >
          INYO
        </span>
        <a
          href="#"
          style={{
            display: "inline-block",
            background: "var(--accent)",
            color: "#fff",
            textDecoration: "none",
            borderRadius: "3px",
            padding: "9px 20px",
            fontSize: "12px",
            fontWeight: 500,
            letterSpacing: "0.06em",
          }}
        >
          Request Access
        </a>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section
        className="grid-bg"
        style={{
          minHeight: "100vh",
          paddingTop: "64px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          alignItems: "center",
          gap: "80px",
          padding: "120px 80px 80px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Radial vignette — masks grid edges */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 70% 70% at 30% 50%, transparent 40%, var(--bg-base) 100%)",
            pointerEvents: "none",
          }}
        />

        {/* Left: copy */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <p
            style={{
              fontSize: "10px",
              letterSpacing: "0.22em",
              color: "var(--text-muted)",
              marginBottom: "32px",
              textTransform: "uppercase",
            }}
          >
            Powered by Dividen
          </p>

          <h1
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: "clamp(36px, 4.5vw, 58px)",
              fontWeight: 400,
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
              marginBottom: "28px",
              maxWidth: "560px",
            }}
          >
            Your family office, operating at machine speed.
          </h1>

          <p
            style={{
              fontSize: "16px",
              lineHeight: 1.75,
              color: "var(--text-secondary)",
              maxWidth: "480px",
              marginBottom: "48px",
            }}
          >
            Private AI infrastructure for deal flow, portfolio intelligence, legal review,
            and household operations — unified in one command center.
          </p>

          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <button
              style={{
                background: "var(--accent)",
                color: "#fff",
                border: "none",
                borderRadius: "3px",
                padding: "14px 28px",
                fontSize: "13px",
                fontWeight: 500,
                letterSpacing: "0.04em",
                cursor: "pointer",
              }}
            >
              Request Access
            </button>
            <button
              style={{
                background: "transparent",
                color: "var(--text-secondary)",
                border: "1px solid var(--border)",
                borderRadius: "3px",
                padding: "13px 28px",
                fontSize: "13px",
                fontWeight: 400,
                letterSpacing: "0.04em",
                cursor: "pointer",
              }}
            >
              See the Platform
            </button>
          </div>
        </div>

        {/* Right: Deal Scorecard */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <div
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: "4px",
              padding: "28px 32px",
              maxWidth: "400px",
              width: "100%",
              fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
            }}
          >
            {/* Card header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
                paddingBottom: "16px",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <span
                style={{
                  fontSize: "9px",
                  letterSpacing: "0.2em",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                }}
              >
                Deal Scorecard
              </span>
              <span
                style={{
                  fontSize: "9px",
                  letterSpacing: "0.1em",
                  color: "var(--success)",
                  background: "rgba(16,185,129,0.08)",
                  border: "1px solid rgba(16,185,129,0.2)",
                  padding: "3px 8px",
                  borderRadius: "2px",
                }}
              >
                LIVE
              </span>
            </div>

            {/* Score */}
            <div style={{ marginBottom: "24px" }}>
              <div
                style={{
                  fontSize: "9px",
                  letterSpacing: "0.16em",
                  color: "var(--text-muted)",
                  marginBottom: "6px",
                  textTransform: "uppercase",
                }}
              >
                Deal Score
              </div>
              <div
                style={{
                  fontSize: "52px",
                  fontWeight: 700,
                  color: "var(--accent)",
                  lineHeight: 1,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                84
              </div>
            </div>

            {/* Fields */}
            {[
              ["Company", "Meridian AI"],
              ["Sector", "Enterprise AI"],
              ["Stage", "Series B"],
              ["Ask", "$12M at $85M pre"],
            ].map(([label, value]) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px 0",
                  borderBottom: "1px solid var(--border-subtle, #15181f)",
                  fontSize: "11px",
                }}
              >
                <span style={{ color: "var(--text-muted)" }}>{label}</span>
                <span style={{ color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                  {value}
                </span>
              </div>
            ))}

            {/* Risks & Opportunities */}
            <div style={{ marginTop: "20px", marginBottom: "20px" }}>
              <div
                style={{
                  fontSize: "9px",
                  letterSpacing: "0.16em",
                  color: "var(--text-muted)",
                  marginBottom: "8px",
                  textTransform: "uppercase",
                }}
              >
                Risks
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "var(--text-secondary)",
                  lineHeight: 1.6,
                }}
              >
                Customer concentration, GTM complexity
              </div>

              <div
                style={{
                  fontSize: "9px",
                  letterSpacing: "0.16em",
                  color: "var(--text-muted)",
                  marginBottom: "8px",
                  marginTop: "14px",
                  textTransform: "uppercase",
                }}
              >
                Opportunities
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "var(--text-secondary)",
                  lineHeight: 1.6,
                }}
              >
                Defense market expansion, platform potential
              </div>
            </div>

            {/* Recommendation */}
            <div
              style={{
                borderTop: "1px solid var(--border)",
                paddingTop: "16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: "9px",
                  letterSpacing: "0.16em",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                }}
              >
                Recommendation
              </span>
              <span
                style={{
                  fontSize: "11px",
                  letterSpacing: "0.14em",
                  fontWeight: 600,
                  color: "var(--accent)",
                }}
              >
                PURSUE
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ────────────────────────────────────────────────── */}
      <section
        style={{
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-surface)",
          padding: "0 80px",
          display: "flex",
        }}
      >
        {[
          { value: "$2.4B+", label: "AUM managed" },
          { value: "10", label: "AI agents" },
          { value: "< 4 min", label: "average deal triage" },
        ].map((stat, i) => (
          <div
            key={stat.label}
            style={{
              flex: 1,
              padding: "40px 0",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              borderLeft: i > 0 ? "1px solid var(--border)" : "none",
              paddingLeft: i > 0 ? "64px" : 0,
            }}
          >
            <div
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: "clamp(28px, 3vw, 40px)",
                fontWeight: 400,
                color: "var(--text-primary)",
                fontVariantNumeric: "tabular-nums",
                lineHeight: 1,
              }}
            >
              {stat.value}
            </div>
            <div
              style={{
                fontSize: "11px",
                letterSpacing: "0.1em",
                color: "var(--text-muted)",
                textTransform: "uppercase",
              }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </section>

      {/* ── Agents section ───────────────────────────────────────────── */}
      <section
        style={{
          padding: "120px 80px",
          background: "var(--bg-base)",
        }}
      >
        <div style={{ maxWidth: "920px", margin: "0 auto" }}>
          {/* Section header */}
          <div style={{ marginBottom: "72px" }}>
            <p
              style={{
                fontSize: "10px",
                letterSpacing: "0.22em",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                marginBottom: "16px",
              }}
            >
              The Operating Layer
            </p>
            <h2
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: "clamp(28px, 3.5vw, 44px)",
                fontWeight: 400,
                letterSpacing: "-0.01em",
                color: "var(--text-primary)",
                lineHeight: 1.2,
              }}
            >
              Ten specialized agents.
              <br />
              <span style={{ color: "var(--text-secondary)" }}>One operating layer.</span>
            </h2>
          </div>

          {/* Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1px",
              background: "var(--border)",
            }}
          >
            {agents.map((agent) => (
              <div
                key={agent.name}
                style={{
                  background: "var(--bg-surface)",
                  padding: "28px 32px",
                  display: "flex",
                  gap: "20px",
                  alignItems: "flex-start",
                }}
              >
                <span
                  style={{
                    fontSize: "18px",
                    color: "var(--text-muted)",
                    lineHeight: 1,
                    marginTop: "3px",
                    flexShrink: 0,
                  }}
                >
                  {agent.symbol}
                </span>
                <div>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "var(--text-primary)",
                      letterSpacing: "0.01em",
                      marginBottom: "6px",
                    }}
                  >
                    {agent.name}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--text-secondary)",
                      lineHeight: 1.65,
                    }}
                  >
                    {agent.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features section ─────────────────────────────────────────── */}
      <section
        style={{
          padding: "120px 80px",
          background: "var(--bg-surface)",
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{ maxWidth: "920px", margin: "0 auto" }}>
          <div style={{ marginBottom: "72px" }}>
            <p
              style={{
                fontSize: "10px",
                letterSpacing: "0.22em",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                marginBottom: "16px",
              }}
            >
              Platform Architecture
            </p>
            <h2
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: "clamp(28px, 3.5vw, 44px)",
                fontWeight: 400,
                letterSpacing: "-0.01em",
                color: "var(--text-primary)",
              }}
            >
              Built for permanence.
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "40px",
            }}
          >
            {[
              {
                label: "01",
                title: "Proprietary Memory",
                body: "Every agent remembers your history, preferences, and relationships across every interaction.",
              },
              {
                label: "02",
                title: "Human Approval Gates",
                body: "High-stakes actions pause for review. You stay in control of every material decision.",
              },
              {
                label: "03",
                title: "Document Intelligence",
                body: "Ingest pitch decks, K-1s, LP agreements, and custodial statements in seconds.",
              },
            ].map((feature) => (
              <div
                key={feature.label}
                style={{
                  paddingTop: "28px",
                  borderTop: "1px solid var(--border)",
                }}
              >
                <div
                  style={{
                    fontFamily: "'SF Mono', 'Fira Code', monospace",
                    fontSize: "10px",
                    color: "var(--text-muted)",
                    letterSpacing: "0.12em",
                    marginBottom: "16px",
                  }}
                >
                  {feature.label}
                </div>
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: 500,
                    color: "var(--text-primary)",
                    letterSpacing: "0.01em",
                    marginBottom: "12px",
                  }}
                >
                  {feature.title}
                </h3>
                <p
                  style={{
                    fontSize: "13px",
                    color: "var(--text-secondary)",
                    lineHeight: 1.75,
                  }}
                >
                  {feature.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA section ──────────────────────────────────────────────── */}
      <section
        style={{
          padding: "160px 80px",
          background: "var(--bg-base)",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle radial glow */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "600px",
            height: "400px",
            background:
              "radial-gradient(ellipse at center, rgba(59,130,246,0.04) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative", zIndex: 1, maxWidth: "600px", margin: "0 auto" }}>
          <p
            style={{
              fontSize: "10px",
              letterSpacing: "0.22em",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              marginBottom: "24px",
            }}
          >
            Onboarding
          </p>

          <h2
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: "clamp(32px, 4vw, 52px)",
              fontWeight: 400,
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
              lineHeight: 1.2,
              marginBottom: "24px",
            }}
          >
            Built for families who move differently.
          </h2>

          <p
            style={{
              fontSize: "15px",
              color: "var(--text-secondary)",
              lineHeight: 1.75,
              marginBottom: "48px",
            }}
          >
            Private cloud deployment within your existing infrastructure. White-glove onboarding
            with dedicated technical support. Setup investment of $50K–$250K depending on scope.
          </p>

          <button
            style={{
              background: "transparent",
              color: "var(--text-primary)",
              border: "1px solid var(--border)",
              borderRadius: "3px",
              padding: "16px 36px",
              fontSize: "13px",
              fontWeight: 400,
              letterSpacing: "0.06em",
              cursor: "pointer",
            }}
          >
            Schedule a Consultation
          </button>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer
        style={{
          borderTop: "1px solid var(--border)",
          padding: "24px 80px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "var(--bg-surface)",
        }}
      >
        <span
          style={{
            fontSize: "11px",
            letterSpacing: "0.22em",
            fontWeight: 600,
            color: "var(--text-muted)",
          }}
        >
          INYO
        </span>
        <span
          style={{
            fontSize: "11px",
            color: "var(--text-muted)",
            letterSpacing: "0.03em",
          }}
        >
          © 2026 Inyo. Powered by Dividen.
        </span>
      </footer>
    </div>
  );
}
