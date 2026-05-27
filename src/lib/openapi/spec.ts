export const openApiSpec = {
  openapi: "3.0.0",
  info: {
    title: "Inyo API",
    description:
      "REST API for the Inyo Family Office OS — deal flow, portfolio, CRM, documents, finance, SPV, and AI agents. Requires active Clerk session. Pass `familyId` query param to scope to your family.",
    version: "1.0.0",
    contact: { name: "Inyo", url: "https://inyo.app" },
  },
  servers: [{ url: "/api", description: "Inyo API" }],
  tags: [
    { name: "Deals", description: "Deal flow pipeline and diligence" },
    { name: "Portfolio", description: "Portfolio companies and monitoring" },
    { name: "Contacts", description: "CRM contacts and relationship management" },
    { name: "Interactions", description: "Contact interaction log" },
    { name: "Documents", description: "Document vault with versioning and expiry tracking" },
    { name: "Finance", description: "Entity cash flows and financial summary" },
    { name: "Entities", description: "Legal entities (LLC, LP, Trust, etc.)" },
    { name: "SPV", description: "Special Purpose Vehicle management via Sydecar" },
    { name: "Agents", description: "AI agent execution and streaming" },
    { name: "Federation", description: "Dividen network federation" },
    { name: "Approvals", description: "Human approval gates for agent actions" },
    { name: "Family", description: "Family office settings" },
    { name: "User", description: "Current user identity" },
    { name: "Import", description: "Bulk import endpoints" },
    { name: "Calendar", description: "Capital call and distribution calendar" },
    { name: "Dashboard", description: "Aggregate dashboard stats" },
  ],
  paths: {
    "/deals": {
      get: {
        summary: "List deals",
        description: "Returns a paginated list of deals. Filter by status.",
        tags: ["Deals"],
        parameters: [
          { name: "familyId", in: "query", schema: { type: "string" }, description: "Scope to a specific family" },
          { name: "status", in: "query", schema: { type: "string", enum: ["inbound","reviewing","diligence","ic-review","passed","invested","archived"] } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
        ],
        responses: {
          "200": {
            description: "Paginated deal list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    deals: { type: "array", items: { "$ref": "#/components/schemas/Deal" } },
                    pagination: { "$ref": "#/components/schemas/Pagination" },
                    _mock: { type: "boolean" },
                  },
                },
              },
            },
          },
          "500": { "$ref": "#/components/responses/ServerError" },
        },
      },
      post: {
        summary: "Create deal",
        tags: ["Deals"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["familyId","name","company"],
                properties: {
                  familyId: { type: "string" },
                  name: { type: "string" },
                  company: { type: "string" },
                  entityId: { type: "string", nullable: true },
                  sector: { type: "string", nullable: true },
                  stage: { type: "string", nullable: true },
                  status: { type: "string", default: "inbound" },
                  capitalAsk: { type: "number", nullable: true },
                  valuation: { type: "number", nullable: true },
                  description: { type: "string", nullable: true },
                  sourceType: { type: "string", nullable: true },
                  sourceContact: { type: "string", nullable: true },
                  pitchDeckUrl: { type: "string", nullable: true },
                  dataRoomUrl: { type: "string", nullable: true },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Created deal",
            content: {
              "application/json": {
                schema: { type: "object", properties: { deal: { "$ref": "#/components/schemas/Deal" }, _mock: { type: "boolean" } } },
              },
            },
          },
          "400": { "$ref": "#/components/responses/BadRequest" },
          "500": { "$ref": "#/components/responses/ServerError" },
        },
      },
    },
    "/deals/{id}": {
      get: {
        summary: "Get deal by ID",
        description: "Returns a single deal with documents, AI analyses, and founders.",
        tags: ["Deals"],
        parameters: [{ "$ref": "#/components/parameters/IdPath" }],
        responses: {
          "200": {
            description: "Deal with relations",
            content: {
              "application/json": {
                schema: { type: "object", properties: { deal: { "$ref": "#/components/schemas/DealWithRelations" }, _mock: { type: "boolean" } } },
              },
            },
          },
          "404": { "$ref": "#/components/responses/NotFound" },
          "500": { "$ref": "#/components/responses/ServerError" },
        },
      },
      patch: {
        summary: "Update deal",
        description: "Partial update. Advancing status to ic-review auto-creates a pending Approval.",
        tags: ["Deals"],
        parameters: [{ "$ref": "#/components/parameters/IdPath" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string" },
                  name: { type: "string" },
                  company: { type: "string" },
                  sector: { type: "string", nullable: true },
                  stage: { type: "string", nullable: true },
                  capitalAsk: { type: "number", nullable: true },
                  valuation: { type: "number", nullable: true },
                  ownership: { type: "number", nullable: true },
                  description: { type: "string", nullable: true },
                  sourceType: { type: "string", nullable: true },
                  sourceContact: { type: "string", nullable: true },
                  dealScore: { type: "integer", nullable: true },
                  icMemoUrl: { type: "string", nullable: true },
                  dataRoomUrl: { type: "string", nullable: true },
                  pitchDeckUrl: { type: "string", nullable: true },
                  website: { type: "string", nullable: true },
                  linkedinUrl: { type: "string", nullable: true },
                  crunchbaseUrl: { type: "string", nullable: true },
                  affinityScore: { type: "number", nullable: true },
                  riskScore: { type: "number", nullable: true },
                  fundabilityScore: { type: "number", nullable: true },
                  enrichedAt: { type: "string", format: "date-time", nullable: true },
                  investedAt: { type: "string", format: "date-time", nullable: true },
                  entityId: { type: "string", nullable: true },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Updated deal",
            content: {
              "application/json": {
                schema: { type: "object", properties: { deal: { "$ref": "#/components/schemas/Deal" }, _mock: { type: "boolean" } } },
              },
            },
          },
          "400": { "$ref": "#/components/responses/BadRequest" },
          "404": { "$ref": "#/components/responses/NotFound" },
          "500": { "$ref": "#/components/responses/ServerError" },
        },
      },
      delete: {
        summary: "Soft delete deal",
        tags: ["Deals"],
        parameters: [{ "$ref": "#/components/parameters/IdPath" }],
        responses: {
          "200": { "$ref": "#/components/responses/DeleteSuccess" },
          "404": { "$ref": "#/components/responses/NotFound" },
          "500": { "$ref": "#/components/responses/ServerError" },
        },
      },
    },
    "/deals/{id}/diligence": {
      get: {
        summary: "Get diligence checklist",
        tags: ["Deals"],
        parameters: [{ "$ref": "#/components/parameters/IdPath" }],
        responses: {
          "200": {
            description: "Diligence state",
            content: { "application/json": { schema: { type: "object", properties: { diligence: { type: "object" } } } } },
          },
          "404": { "$ref": "#/components/responses/NotFound" },
        },
      },
      patch: {
        summary: "Update diligence checklist",
        tags: ["Deals"],
        parameters: [{ "$ref": "#/components/parameters/IdPath" }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", description: "Partial diligence data" } } },
        },
        responses: {
          "200": {
            description: "Updated diligence",
            content: { "application/json": { schema: { type: "object", properties: { deal: { "$ref": "#/components/schemas/Deal" } } } } },
          },
          "404": { "$ref": "#/components/responses/NotFound" },
        },
      },
    },
    "/deals/{id}/enrich/stream": {
      post: {
        summary: "Stream deal enrichment (SSE)",
        description: "Server-Sent Events stream. Runs the deal enrichment agent and streams analysis tokens.",
        tags: ["Deals"],
        parameters: [{ "$ref": "#/components/parameters/IdPath" }],
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: { type: "object", properties: { context: { type: "object" }, documentContent: { type: "string" } } },
            },
          },
        },
        responses: {
          "200": {
            description: "SSE stream of enrichment tokens",
            content: { "text/event-stream": { schema: { type: "string" } } },
          },
          "404": { "$ref": "#/components/responses/NotFound" },
          "500": { "$ref": "#/components/responses/ServerError" },
        },
      },
    },
    "/deals/{id}/founders": {
      get: {
        summary: "List founders for deal",
        tags: ["Deals"],
        parameters: [{ "$ref": "#/components/parameters/IdPath" }],
        responses: {
          "200": {
            description: "Founder list",
            content: { "application/json": { schema: { type: "object", properties: { founders: { type: "array", items: { "$ref": "#/components/schemas/Founder" } } } } } },
          },
          "404": { "$ref": "#/components/responses/NotFound" },
        },
      },
      post: {
        summary: "Add founder",
        tags: ["Deals"],
        parameters: [{ "$ref": "#/components/parameters/IdPath" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string" },
                  title: { type: "string", nullable: true },
                  linkedinUrl: { type: "string", nullable: true },
                  bio: { type: "string", nullable: true },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Created founder",
            content: { "application/json": { schema: { type: "object", properties: { founder: { "$ref": "#/components/schemas/Founder" } } } } },
          },
          "400": { "$ref": "#/components/responses/BadRequest" },
          "404": { "$ref": "#/components/responses/NotFound" },
        },
      },
    },
    "/deals/{id}/founders/{founderId}": {
      patch: {
        summary: "Update founder",
        tags: ["Deals"],
        parameters: [
          { "$ref": "#/components/parameters/IdPath" },
          { name: "founderId", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  title: { type: "string", nullable: true },
                  linkedinUrl: { type: "string", nullable: true },
                  bio: { type: "string", nullable: true },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Updated founder",
            content: { "application/json": { schema: { type: "object", properties: { founder: { "$ref": "#/components/schemas/Founder" } } } } },
          },
          "404": { "$ref": "#/components/responses/NotFound" },
        },
      },
      delete: {
        summary: "Remove founder",
        tags: ["Deals"],
        parameters: [
          { "$ref": "#/components/parameters/IdPath" },
          { name: "founderId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { "$ref": "#/components/responses/DeleteSuccess" },
          "404": { "$ref": "#/components/responses/NotFound" },
        },
      },
    },
    "/deals/{id}/restore": {
      post: {
        summary: "Restore soft-deleted deal",
        tags: ["Deals"],
        parameters: [{ "$ref": "#/components/parameters/IdPath" }],
        responses: {
          "200": {
            description: "Restored deal",
            content: { "application/json": { schema: { type: "object", properties: { deal: { "$ref": "#/components/schemas/Deal" } } } } },
          },
          "404": { "$ref": "#/components/responses/NotFound" },
        },
      },
    },
    "/portfolio": {
      get: {
        summary: "List portfolio companies",
        description: "Returns all portfolio companies with recent alerts.",
        tags: ["Portfolio"],
        parameters: [
          { name: "familyId", in: "query", schema: { type: "string" } },
          { name: "status", in: "query", schema: { type: "string", enum: ["active","exited","written-off","watchlist"] } },
        ],
        responses: {
          "200": {
            description: "Portfolio list",
            content: { "application/json": { schema: { type: "object", properties: { companies: { type: "array", items: { "$ref": "#/components/schemas/PortfolioCompany" } }, _mock: { type: "boolean" } } } } },
          },
          "500": { "$ref": "#/components/responses/ServerError" },
        },
      },
      post: {
        summary: "Create portfolio company",
        tags: ["Portfolio"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string" },
                  familyId: { type: "string", nullable: true },
                  sector: { type: "string", nullable: true },
                  stage: { type: "string", nullable: true },
                  status: { type: "string", default: "active" },
                  investedAmount: { type: "number", nullable: true },
                  currentValue: { type: "number", nullable: true },
                  ownership: { type: "number", nullable: true },
                  investedAt: { type: "string", format: "date-time", nullable: true },
                  lastFundingDate: { type: "string", format: "date-time", nullable: true },
                  lastFundingRound: { type: "string", nullable: true },
                  website: { type: "string", nullable: true },
                  description: { type: "string", nullable: true },
                  alertLevel: { type: "string", default: "normal" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Created company",
            content: { "application/json": { schema: { type: "object", properties: { company: { "$ref": "#/components/schemas/PortfolioCompany" }, _mock: { type: "boolean" } } } } },
          },
          "400": { "$ref": "#/components/responses/BadRequest" },
        },
      },
    },
    "/portfolio/analytics": {
      get: {
        summary: "Portfolio construction analytics",
        description: "Aggregate metrics: allocation by sector, stage, and status.",
        tags: ["Portfolio"],
        parameters: [{ name: "familyId", in: "query", schema: { type: "string" } }],
        responses: {
          "200": {
            description: "Portfolio analytics",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    bySector: { type: "array", items: { type: "object" } },
                    byStage: { type: "array", items: { type: "object" } },
                    byStatus: { type: "array", items: { type: "object" } },
                    totalValue: { type: "number" },
                    totalInvested: { type: "number" },
                    _mock: { type: "boolean" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/portfolio/{id}": {
      get: {
        summary: "Get portfolio company",
        tags: ["Portfolio"],
        parameters: [{ "$ref": "#/components/parameters/IdPath" }],
        responses: {
          "200": {
            description: "Portfolio company with alerts",
            content: { "application/json": { schema: { type: "object", properties: { company: { "$ref": "#/components/schemas/PortfolioCompany" }, _mock: { type: "boolean" } } } } },
          },
          "404": { "$ref": "#/components/responses/NotFound" },
        },
      },
      patch: {
        summary: "Update portfolio company",
        tags: ["Portfolio"],
        parameters: [{ "$ref": "#/components/parameters/IdPath" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  sector: { type: "string", nullable: true },
                  stage: { type: "string", nullable: true },
                  status: { type: "string" },
                  investedAmount: { type: "number", nullable: true },
                  currentValue: { type: "number", nullable: true },
                  ownership: { type: "number", nullable: true },
                  alertLevel: { type: "string" },
                  description: { type: "string", nullable: true },
                  website: { type: "string", nullable: true },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Updated company",
            content: { "application/json": { schema: { type: "object", properties: { company: { "$ref": "#/components/schemas/PortfolioCompany" } } } } },
          },
          "404": { "$ref": "#/components/responses/NotFound" },
        },
      },
      delete: {
        summary: "Soft delete portfolio company",
        tags: ["Portfolio"],
        parameters: [{ "$ref": "#/components/parameters/IdPath" }],
        responses: {
          "200": { "$ref": "#/components/responses/DeleteSuccess" },
          "404": { "$ref": "#/components/responses/NotFound" },
        },
      },
    },
    "/contacts": {
      get: {
        summary: "List contacts",
        tags: ["Contacts"],
        parameters: [
          { name: "familyId", in: "query", schema: { type: "string" } },
          { name: "type", in: "query", schema: { type: "string", enum: ["founder","lp","gp","attorney","banker","advisor","broker","family","contact"] } },
          { name: "limit", in: "query", schema: { type: "integer" } },
        ],
        responses: {
          "200": {
            description: "Contact list",
            content: { "application/json": { schema: { type: "object", properties: { contacts: { type: "array", items: { "$ref": "#/components/schemas/Contact" } }, _mock: { type: "boolean" } } } } },
          },
        },
      },
      post: {
        summary: "Create contact",
        tags: ["Contacts"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["familyId","name"],
                properties: {
                  familyId: { type: "string" },
                  name: { type: "string" },
                  email: { type: "string", nullable: true },
                  phone: { type: "string", nullable: true },
                  company: { type: "string", nullable: true },
                  title: { type: "string", nullable: true },
                  type: { type: "string", default: "contact" },
                  linkedIn: { type: "string", nullable: true },
                  notes: { type: "string", nullable: true },
                  lastContactAt: { type: "string", format: "date-time", nullable: true },
                  introducedBy: { type: "string", nullable: true },
                  warmPathNotes: { type: "string", nullable: true },
                  investorType: { type: "string", nullable: true },
                  assetClasses: { type: "array", items: { type: "string" } },
                  checkSizeMin: { type: "number", nullable: true },
                  checkSizeMax: { type: "number", nullable: true },
                  portfolioNotes: { type: "string", nullable: true },
                  lastDealTogether: { type: "string", nullable: true },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Created contact",
            content: { "application/json": { schema: { type: "object", properties: { contact: { "$ref": "#/components/schemas/Contact" }, _mock: { type: "boolean" } } } } },
          },
          "400": { "$ref": "#/components/responses/BadRequest" },
        },
      },
    },
    "/contacts/match": {
      post: {
        summary: "Fuzzy match contact",
        description: "Finds the closest matching contact by name or email.",
        tags: ["Contacts"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  email: { type: "string" },
                  familyId: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Matched contact or null",
            content: { "application/json": { schema: { type: "object", properties: { contact: { "$ref": "#/components/schemas/Contact", nullable: true }, score: { type: "number" } } } } },
          },
        },
      },
    },
    "/contacts/{id}": {
      get: {
        summary: "Get contact",
        tags: ["Contacts"],
        parameters: [{ "$ref": "#/components/parameters/IdPath" }],
        responses: {
          "200": {
            description: "Contact",
            content: { "application/json": { schema: { type: "object", properties: { contact: { "$ref": "#/components/schemas/Contact" } } } } },
          },
          "404": { "$ref": "#/components/responses/NotFound" },
        },
      },
      patch: {
        summary: "Update contact",
        tags: ["Contacts"],
        parameters: [{ "$ref": "#/components/parameters/IdPath" }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { "$ref": "#/components/schemas/ContactInput" } } },
        },
        responses: {
          "200": {
            description: "Updated contact",
            content: { "application/json": { schema: { type: "object", properties: { contact: { "$ref": "#/components/schemas/Contact" } } } } },
          },
          "404": { "$ref": "#/components/responses/NotFound" },
        },
      },
      delete: {
        summary: "Soft delete contact",
        tags: ["Contacts"],
        parameters: [{ "$ref": "#/components/parameters/IdPath" }],
        responses: {
          "200": { "$ref": "#/components/responses/DeleteSuccess" },
          "404": { "$ref": "#/components/responses/NotFound" },
        },
      },
    },
    "/interactions": {
      get: {
        summary: "List interactions",
        tags: ["Interactions"],
        parameters: [
          { name: "familyId", in: "query", schema: { type: "string" } },
          { name: "contactId", in: "query", schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "Interaction list",
            content: { "application/json": { schema: { type: "object", properties: { interactions: { type: "array", items: { "$ref": "#/components/schemas/Interaction" } }, _mock: { type: "boolean" } } } } },
          },
        },
      },
      post: {
        summary: "Log interaction",
        tags: ["Interactions"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["contactId","type"],
                properties: {
                  contactId: { type: "string" },
                  type: { type: "string", enum: ["email","call","meeting","note","intro"] },
                  subject: { type: "string", nullable: true },
                  notes: { type: "string", nullable: true },
                  outcome: { type: "string", nullable: true },
                  occurredAt: { type: "string", format: "date-time" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Created interaction",
            content: { "application/json": { schema: { type: "object", properties: { interaction: { "$ref": "#/components/schemas/Interaction" } } } } },
          },
          "400": { "$ref": "#/components/responses/BadRequest" },
        },
      },
    },
    "/documents": {
      get: {
        summary: "List documents",
        description: "familyId is required.",
        tags: ["Documents"],
        parameters: [
          { name: "familyId", in: "query", required: true, schema: { type: "string" } },
          { name: "dealId", in: "query", schema: { type: "string" } },
          { name: "companyId", in: "query", schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "Document list",
            content: { "application/json": { schema: { type: "object", properties: { documents: { type: "array", items: { "$ref": "#/components/schemas/Document" } }, _mock: { type: "boolean" } } } } },
          },
          "400": { "$ref": "#/components/responses/BadRequest" },
        },
      },
    },
    "/documents/expiry": {
      get: {
        summary: "List expiring/expired documents",
        tags: ["Documents"],
        parameters: [{ name: "familyId", in: "query", required: true, schema: { type: "string" } }],
        responses: {
          "200": {
            description: "Expiry-filtered document list",
            content: { "application/json": { schema: { type: "object", properties: { documents: { type: "array", items: { "$ref": "#/components/schemas/Document" } }, _mock: { type: "boolean" } } } } },
          },
          "400": { "$ref": "#/components/responses/BadRequest" },
        },
      },
    },
    "/documents/{id}": {
      get: {
        summary: "Get document",
        tags: ["Documents"],
        parameters: [{ "$ref": "#/components/parameters/IdPath" }],
        responses: {
          "200": {
            description: "Document",
            content: { "application/json": { schema: { type: "object", properties: { document: { "$ref": "#/components/schemas/Document" } } } } },
          },
          "404": { "$ref": "#/components/responses/NotFound" },
        },
      },
      patch: {
        summary: "Update document metadata",
        tags: ["Documents"],
        parameters: [{ "$ref": "#/components/parameters/IdPath" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  type: { type: "string" },
                  expiresAt: { type: "string", format: "date-time", nullable: true },
                  alertDays: { type: "integer", nullable: true },
                  keyDates: { type: "array", items: { type: "object" }, nullable: true },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Updated document",
            content: { "application/json": { schema: { type: "object", properties: { document: { "$ref": "#/components/schemas/Document" } } } } },
          },
          "404": { "$ref": "#/components/responses/NotFound" },
        },
      },
      delete: {
        summary: "Soft delete document",
        tags: ["Documents"],
        parameters: [{ "$ref": "#/components/parameters/IdPath" }],
        responses: {
          "200": { "$ref": "#/components/responses/DeleteSuccess" },
          "404": { "$ref": "#/components/responses/NotFound" },
        },
      },
    },
    "/documents/{id}/versions": {
      get: {
        summary: "List document versions",
        tags: ["Documents"],
        parameters: [{ "$ref": "#/components/parameters/IdPath" }],
        responses: {
          "200": {
            description: "Version list",
            content: { "application/json": { schema: { type: "object", properties: { versions: { type: "array", items: { "$ref": "#/components/schemas/DocumentVersion" } } } } } },
          },
          "404": { "$ref": "#/components/responses/NotFound" },
        },
      },
    },
    "/documents/{id}/expiry": {
      patch: {
        summary: "Set document expiry date",
        tags: ["Documents"],
        parameters: [{ "$ref": "#/components/parameters/IdPath" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["expiresAt"],
                properties: {
                  expiresAt: { type: "string", format: "date-time" },
                  alertDays: { type: "integer" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Updated document",
            content: { "application/json": { schema: { type: "object", properties: { document: { "$ref": "#/components/schemas/Document" } } } } },
          },
          "400": { "$ref": "#/components/responses/BadRequest" },
          "404": { "$ref": "#/components/responses/NotFound" },
        },
      },
    },
    "/documents/{id}/restore": {
      post: {
        summary: "Restore deleted document",
        tags: ["Documents"],
        parameters: [{ "$ref": "#/components/parameters/IdPath" }],
        responses: {
          "200": {
            description: "Restored document",
            content: { "application/json": { schema: { type: "object", properties: { document: { "$ref": "#/components/schemas/Document" } } } } },
          },
          "404": { "$ref": "#/components/responses/NotFound" },
        },
      },
    },
    "/upload/document": {
      post: {
        summary: "Upload document",
        description: "Multipart upload. Fields: file, familyId, optional dealId/companyId/name/type.",
        tags: ["Documents"],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["file","familyId"],
                properties: {
                  file: { type: "string", format: "binary" },
                  familyId: { type: "string" },
                  dealId: { type: "string" },
                  companyId: { type: "string" },
                  name: { type: "string" },
                  type: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Created document",
            content: { "application/json": { schema: { type: "object", properties: { document: { "$ref": "#/components/schemas/Document" } } } } },
          },
          "400": { "$ref": "#/components/responses/BadRequest" },
          "500": { "$ref": "#/components/responses/ServerError" },
        },
      },
    },
    "/finance/summary": {
      get: {
        summary: "Entity financial summary",
        description: "Per-entity inflows/outflows/net and recent transactions. familyId required.",
        tags: ["Finance"],
        parameters: [{ name: "familyId", in: "query", required: true, schema: { type: "string" } }],
        responses: {
          "200": {
            description: "Financial summary",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    entities: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          name: { type: "string" },
                          type: { type: "string" },
                          totalInflows: { type: "number" },
                          totalOutflows: { type: "number" },
                          net: { type: "number" },
                        },
                      },
                    },
                    totalNet: { type: "number" },
                    recentCashFlows: { type: "array", items: { "$ref": "#/components/schemas/CashFlowItem" } },
                    _mock: { type: "boolean" },
                  },
                },
              },
            },
          },
          "400": { "$ref": "#/components/responses/BadRequest" },
        },
      },
    },
    "/finance/cashflows": {
      get: {
        summary: "List cash flows",
        tags: ["Finance"],
        parameters: [
          { name: "familyId", in: "query", schema: { type: "string" } },
          { name: "entityId", in: "query", schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "Cash flow list",
            content: { "application/json": { schema: { type: "object", properties: { cashFlows: { type: "array", items: { "$ref": "#/components/schemas/CashFlow" } }, _mock: { type: "boolean" } } } } },
          },
        },
      },
      post: {
        summary: "Log cash flow",
        tags: ["Finance"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["entityId","type","amount","occurredAt"],
                properties: {
                  entityId: { type: "string" },
                  type: { type: "string", enum: ["income","expense","distribution","capital-call","tax-payment"] },
                  category: { type: "string", nullable: true },
                  amount: { type: "number" },
                  currency: { type: "string", default: "USD" },
                  description: { type: "string", nullable: true },
                  occurredAt: { type: "string", format: "date-time" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Created cash flow",
            content: { "application/json": { schema: { type: "object", properties: { cashFlow: { "$ref": "#/components/schemas/CashFlow" } } } } },
          },
          "400": { "$ref": "#/components/responses/BadRequest" },
        },
      },
    },
    "/finance/cashflows/{id}": {
      delete: {
        summary: "Delete cash flow",
        tags: ["Finance"],
        parameters: [{ "$ref": "#/components/parameters/IdPath" }],
        responses: {
          "200": { "$ref": "#/components/responses/DeleteSuccess" },
          "404": { "$ref": "#/components/responses/NotFound" },
        },
      },
    },
    "/finance": {
      get: {
        summary: "Finance overview (deprecated)",
        description: "Deprecated alias for /finance/summary.",
        tags: ["Finance"],
        deprecated: true,
        parameters: [{ name: "familyId", in: "query", schema: { type: "string" } }],
        responses: {
          "200": { description: "See /finance/summary", content: { "application/json": { schema: { type: "object" } } } },
        },
      },
    },
    "/entities": {
      get: {
        summary: "List entities",
        tags: ["Entities"],
        parameters: [{ name: "familyId", in: "query", required: true, schema: { type: "string" } }],
        responses: {
          "200": {
            description: "Entity list",
            content: { "application/json": { schema: { type: "object", properties: { entities: { type: "array", items: { "$ref": "#/components/schemas/Entity" } }, _mock: { type: "boolean" } } } } },
          },
          "400": { "$ref": "#/components/responses/BadRequest" },
        },
      },
      post: {
        summary: "Create entity",
        tags: ["Entities"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["familyId","name","type"],
                properties: {
                  familyId: { type: "string" },
                  name: { type: "string" },
                  type: { type: "string", enum: ["llc","lp","trust","corp","foundation","individual"] },
                  jurisdiction: { type: "string", nullable: true },
                  taxId: { type: "string", nullable: true },
                  description: { type: "string", nullable: true },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Created entity",
            content: { "application/json": { schema: { type: "object", properties: { entity: { "$ref": "#/components/schemas/Entity" } } } } },
          },
          "400": { "$ref": "#/components/responses/BadRequest" },
        },
      },
    },
    "/entities/{id}": {
      patch: {
        summary: "Update entity",
        tags: ["Entities"],
        parameters: [{ "$ref": "#/components/parameters/IdPath" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  type: { type: "string" },
                  jurisdiction: { type: "string", nullable: true },
                  taxId: { type: "string", nullable: true },
                  description: { type: "string", nullable: true },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Updated entity",
            content: { "application/json": { schema: { type: "object", properties: { entity: { "$ref": "#/components/schemas/Entity" } } } } },
          },
          "404": { "$ref": "#/components/responses/NotFound" },
        },
      },
      delete: {
        summary: "Soft delete entity",
        tags: ["Entities"],
        parameters: [{ "$ref": "#/components/parameters/IdPath" }],
        responses: {
          "200": { "$ref": "#/components/responses/DeleteSuccess" },
          "404": { "$ref": "#/components/responses/NotFound" },
        },
      },
    },
    "/spv": {
      get: {
        summary: "List SPVs",
        tags: ["SPV"],
        parameters: [{ name: "familyId", in: "query", schema: { type: "string" } }],
        responses: {
          "200": {
            description: "SPV list",
            content: { "application/json": { schema: { type: "object", properties: { spvs: { type: "array", items: { "$ref": "#/components/schemas/SPVWithInvestors" } }, _mock: { type: "boolean" } } } } },
          },
        },
      },
      post: {
        summary: "Create SPV",
        tags: ["SPV"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["familyId","name"],
                properties: {
                  familyId: { type: "string" },
                  name: { type: "string" },
                  dealId: { type: "string", nullable: true },
                  spvType: { type: "string", enum: ["syndicate","secondary","layered"], default: "syndicate" },
                  targetRaise: { type: "number", nullable: true },
                  managementFee: { type: "number", default: 2 },
                  carry: { type: "number", default: 20 },
                  closingDate: { type: "string", format: "date-time", nullable: true },
                  investmentType: { type: "string", nullable: true },
                  description: { type: "string", nullable: true },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Created SPV",
            content: { "application/json": { schema: { type: "object", properties: { spv: { "$ref": "#/components/schemas/SPV" }, _mock: { type: "boolean" } } } } },
          },
          "400": { "$ref": "#/components/responses/BadRequest" },
        },
      },
    },
    "/spv/{id}": {
      get: {
        summary: "Get SPV",
        tags: ["SPV"],
        parameters: [{ "$ref": "#/components/parameters/IdPath" }],
        responses: {
          "200": {
            description: "SPV with investors",
            content: { "application/json": { schema: { type: "object", properties: { spv: { "$ref": "#/components/schemas/SPVWithInvestors" }, _mock: { type: "boolean" } } } } },
          },
          "404": { "$ref": "#/components/responses/NotFound" },
        },
      },
      patch: {
        summary: "Update SPV",
        tags: ["SPV"],
        parameters: [{ "$ref": "#/components/parameters/IdPath" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  status: { type: "string" },
                  targetRaise: { type: "number", nullable: true },
                  managementFee: { type: "number" },
                  carry: { type: "number" },
                  closingDate: { type: "string", format: "date-time", nullable: true },
                  investmentType: { type: "string", nullable: true },
                  description: { type: "string", nullable: true },
                  sydecarId: { type: "string", nullable: true },
                  sydecarUrl: { type: "string", nullable: true },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Updated SPV",
            content: { "application/json": { schema: { type: "object", properties: { spv: { "$ref": "#/components/schemas/SPV" } } } } },
          },
          "404": { "$ref": "#/components/responses/NotFound" },
        },
      },
      delete: {
        summary: "Soft delete SPV",
        tags: ["SPV"],
        parameters: [{ "$ref": "#/components/parameters/IdPath" }],
        responses: {
          "200": { "$ref": "#/components/responses/DeleteSuccess" },
          "404": { "$ref": "#/components/responses/NotFound" },
        },
      },
    },
    "/spv/{id}/investors": {
      get: {
        summary: "List SPV investors",
        tags: ["SPV"],
        parameters: [{ "$ref": "#/components/parameters/IdPath" }],
        responses: {
          "200": {
            description: "Investor list",
            content: { "application/json": { schema: { type: "object", properties: { investors: { type: "array", items: { "$ref": "#/components/schemas/SPVInvestor" } } } } } },
          },
          "404": { "$ref": "#/components/responses/NotFound" },
        },
      },
      post: {
        summary: "Add investor to SPV",
        tags: ["SPV"],
        parameters: [{ "$ref": "#/components/parameters/IdPath" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name","email"],
                properties: {
                  name: { type: "string" },
                  email: { type: "string", format: "email" },
                  contactId: { type: "string", nullable: true },
                  commitment: { type: "number", default: 0 },
                  status: { type: "string", default: "invited" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Created investor",
            content: { "application/json": { schema: { type: "object", properties: { investor: { "$ref": "#/components/schemas/SPVInvestor" } } } } },
          },
          "400": { "$ref": "#/components/responses/BadRequest" },
          "404": { "$ref": "#/components/responses/NotFound" },
        },
      },
    },
    "/spv/{id}/investors/{investorId}": {
      patch: {
        summary: "Update SPV investor",
        tags: ["SPV"],
        parameters: [
          { "$ref": "#/components/parameters/IdPath" },
          { name: "investorId", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  commitment: { type: "number" },
                  status: { type: "string", enum: ["invited","committed","funded","withdrawn"] },
                  committedAt: { type: "string", format: "date-time", nullable: true },
                  fundedAt: { type: "string", format: "date-time", nullable: true },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Updated investor",
            content: { "application/json": { schema: { type: "object", properties: { investor: { "$ref": "#/components/schemas/SPVInvestor" } } } } },
          },
          "404": { "$ref": "#/components/responses/NotFound" },
        },
      },
      delete: {
        summary: "Remove SPV investor",
        tags: ["SPV"],
        parameters: [
          { "$ref": "#/components/parameters/IdPath" },
          { name: "investorId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { "$ref": "#/components/responses/DeleteSuccess" },
          "404": { "$ref": "#/components/responses/NotFound" },
        },
      },
    },
    "/spv/{id}/launch": {
      post: {
        summary: "Launch SPV to Sydecar",
        description: "Submits the SPV to the Sydecar API to begin legal entity formation.",
        tags: ["SPV"],
        parameters: [{ "$ref": "#/components/parameters/IdPath" }],
        responses: {
          "200": {
            description: "Launch result with Sydecar IDs",
            content: { "application/json": { schema: { type: "object", properties: { spv: { "$ref": "#/components/schemas/SPV" }, sydecarId: { type: "string" }, sydecarUrl: { type: "string" } } } } },
          },
          "404": { "$ref": "#/components/responses/NotFound" },
          "500": { "$ref": "#/components/responses/ServerError" },
        },
      },
    },
    "/spv/{id}/sync": {
      post: {
        summary: "Sync SPV status from Sydecar",
        tags: ["SPV"],
        parameters: [{ "$ref": "#/components/parameters/IdPath" }],
        responses: {
          "200": {
            description: "Synced SPV",
            content: { "application/json": { schema: { type: "object", properties: { spv: { "$ref": "#/components/schemas/SPV" } } } } },
          },
          "404": { "$ref": "#/components/responses/NotFound" },
          "500": { "$ref": "#/components/responses/ServerError" },
        },
      },
    },
    "/agents/{type}": {
      post: {
        summary: "Run any Inyo agent",
        description: "Unified agent execution endpoint. Pass the agent type in the path and a `context` object matching that agent's input schema. All 23 Inyo agents are accessible here. Requires Clerk session.",
        tags: ["Agents"],
        parameters: [
          {
            name: "type",
            in: "path",
            required: true,
            description: "Agent identifier",
            schema: {
              type: "string",
              enum: [
                "deal-flow", "ic-memo", "portfolio-monitor", "cfo", "legal", "tax",
                "chief-of-staff", "concierge", "philanthropy", "relationships",
                "deal-enrichment", "term-sheet", "diligence",
                "unit-economics", "saas-model", "cap-table", "term-loan",
                "sales-forecast", "sales-quota", "cash-management", "venture-stagger",
                "option-grants", "startup-kit",
              ],
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["familyId", "context"],
                properties: {
                  familyId: { type: "string", description: "Your family office ID" },
                  context: { type: "object", description: "Input data for the agent — shape varies by type. See agent descriptions and sample prompts in the Dividen Bubble Store." },
                  documents: {
                    type: "array",
                    description: "Optional document attachments (used by term-sheet, diligence, legal agents)",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        content: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Agent result",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    result: { type: "object", description: "Structured JSON output — shape varies by agent type. Always includes `_preview` field with a one-line summary." },
                    tokensUsed: { type: "integer" },
                    model: { type: "string" },
                  },
                },
              },
            },
          },
          "400": { description: "Unknown agent type", content: { "application/json": { schema: { type: "object", properties: { error: { type: "string" } } } } } },
          "500": { "$ref": "#/components/responses/ServerError" },
        },
      },
    },
    "/agents/{type}/stream": {
      get: {
        summary: "Stream agent output (SSE)",
        description: "Server-Sent Events stream of agent tokens. Supported for: deal-flow, ic-memo, term-sheet, diligence.",
        tags: ["Agents"],
        parameters: [
          { name: "type", in: "path", required: true, schema: { type: "string", enum: ["deal-flow","ic-memo","term-sheet","diligence"] } },
          { name: "dealId", in: "query", schema: { type: "string" } },
          { name: "familyId", in: "query", schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "SSE token stream", content: { "text/event-stream": { schema: { type: "string" } } } },
        },
      },
    },
    "/agents/ic-memo": {
      post: {
        summary: "Run IC memo writer agent (legacy path)",
        description: "Generates an institutional investment committee memo for a deal. Prefer `/agents/ic-memo` via the unified `/agents/{type}` route.",
        tags: ["Agents"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["familyId","dealId"],
                properties: {
                  familyId: { type: "string" },
                  dealId: { type: "string" },
                  context: { type: "object" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "IC memo result",
            content: { "application/json": { schema: { type: "object", properties: { analysis: { "$ref": "#/components/schemas/AgentRun" }, result: { type: "object" } } } } },
          },
          "400": { "$ref": "#/components/responses/BadRequest" },
          "500": { "$ref": "#/components/responses/ServerError" },
        },
      },
    },
    "/agents/ic-memo/stream": {
      get: {
        summary: "Stream IC memo agent (SSE)",
        description: "Server-Sent Events stream of IC memo generation tokens.",
        tags: ["Agents"],
        parameters: [
          { name: "dealId", in: "query", schema: { type: "string" } },
          { name: "familyId", in: "query", schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "SSE token stream", content: { "text/event-stream": { schema: { type: "string" } } } },
        },
      },
    },
    "/agents/cfo": {
      post: {
        summary: "Run CFO agent",
        description: "Analyzes cash flow, entity liquidity, and expense reporting.",
        tags: ["Agents"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["familyId","context"],
                properties: { familyId: { type: "string" }, context: { type: "object" } },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "CFO analysis",
            content: { "application/json": { schema: { type: "object", properties: { analysis: { "$ref": "#/components/schemas/AgentRun" }, result: { type: "object" } } } } },
          },
          "400": { "$ref": "#/components/responses/BadRequest" },
          "500": { "$ref": "#/components/responses/ServerError" },
        },
      },
    },
    "/agents/legal": {
      post: {
        summary: "Run legal review agent",
        tags: ["Agents"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["familyId","context"],
                properties: {
                  familyId: { type: "string" },
                  context: { type: "object" },
                  documentContent: { type: "string", nullable: true },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Legal review result",
            content: { "application/json": { schema: { type: "object", properties: { analysis: { "$ref": "#/components/schemas/AgentRun" }, result: { type: "object" } } } } },
          },
          "400": { "$ref": "#/components/responses/BadRequest" },
          "500": { "$ref": "#/components/responses/ServerError" },
        },
      },
    },
    "/agents/portfolio-monitor": {
      post: {
        summary: "Run portfolio monitor agent",
        tags: ["Agents"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["familyId","context"],
                properties: { familyId: { type: "string" }, context: { type: "object" } },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Portfolio monitor result",
            content: { "application/json": { schema: { type: "object", properties: { analysis: { "$ref": "#/components/schemas/AgentRun" }, result: { type: "object" } } } } },
          },
          "400": { "$ref": "#/components/responses/BadRequest" },
          "500": { "$ref": "#/components/responses/ServerError" },
        },
      },
    },
    "/agents/relationships": {
      post: {
        summary: "Run relationship intelligence agent",
        tags: ["Agents"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["familyId","context"],
                properties: { familyId: { type: "string" }, context: { type: "object" } },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Relationship intelligence result",
            content: { "application/json": { schema: { type: "object", properties: { analysis: { "$ref": "#/components/schemas/AgentRun" }, result: { type: "object" } } } } },
          },
          "400": { "$ref": "#/components/responses/BadRequest" },
          "500": { "$ref": "#/components/responses/ServerError" },
        },
      },
    },
    "/agents/tax": {
      post: {
        summary: "Run tax intelligence agent",
        tags: ["Agents"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["familyId","context"],
                properties: { familyId: { type: "string" }, context: { type: "object" } },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Tax agent result",
            content: { "application/json": { schema: { type: "object", properties: { analysis: { "$ref": "#/components/schemas/AgentRun" }, result: { type: "object" } } } } },
          },
          "400": { "$ref": "#/components/responses/BadRequest" },
          "500": { "$ref": "#/components/responses/ServerError" },
        },
      },
    },
    "/agents/philanthropy": {
      post: {
        summary: "Run philanthropy agent",
        tags: ["Agents"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["familyId","context"],
                properties: { familyId: { type: "string" }, context: { type: "object" } },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Philanthropy agent result",
            content: { "application/json": { schema: { type: "object", properties: { analysis: { "$ref": "#/components/schemas/AgentRun" }, result: { type: "object" } } } } },
          },
          "400": { "$ref": "#/components/responses/BadRequest" },
          "500": { "$ref": "#/components/responses/ServerError" },
        },
      },
    },
    "/agents/chief-of-staff": {
      post: {
        summary: "Run chief of staff agent",
        description: "Coordinates tasks across agents; surfaces actions requiring human approval.",
        tags: ["Agents"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["familyId","context"],
                properties: { familyId: { type: "string" }, context: { type: "object" } },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Chief of staff result",
            content: { "application/json": { schema: { type: "object", properties: { analysis: { "$ref": "#/components/schemas/AgentRun" }, result: { type: "object" } } } } },
          },
          "400": { "$ref": "#/components/responses/BadRequest" },
          "500": { "$ref": "#/components/responses/ServerError" },
        },
      },
    },
    "/agents/term-sheet/stream": {
      get: {
        summary: "Stream term sheet analysis (SSE)",
        description: "Server-Sent Events stream of term sheet comparison tokens.",
        tags: ["Agents"],
        parameters: [
          { name: "dealId", in: "query", schema: { type: "string" } },
          { name: "familyId", in: "query", schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "SSE token stream", content: { "text/event-stream": { schema: { type: "string" } } } },
        },
      },
    },
    "/agents/diligence/stream": {
      get: {
        summary: "Stream diligence analysis (SSE)",
        description: "Server-Sent Events stream of diligence checklist analysis tokens.",
        tags: ["Agents"],
        parameters: [
          { name: "dealId", in: "query", schema: { type: "string" } },
          { name: "familyId", in: "query", schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "SSE token stream", content: { "text/event-stream": { schema: { type: "string" } } } },
        },
      },
    },
    "/agents/status": {
      get: {
        summary: "Agent run stats",
        description: "Returns last-run timestamps and total run counts for all agent types.",
        tags: ["Agents"],
        responses: {
          "200": {
            description: "Agent status",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    apiKeySet: { type: "boolean" },
                    agents: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          type: { type: "string" },
                          lastRun: { type: "string", format: "date-time", nullable: true },
                          totalRuns: { type: "integer" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/federation/manifest": {
      get: {
        summary: "Instance capability manifest",
        description: "Returns the Dividen federation manifest for this instance.",
        tags: ["Federation"],
        responses: {
          "200": { description: "Federation manifest", content: { "application/json": { schema: { type: "object" } } } },
        },
      },
    },
    "/federation/status": {
      get: {
        summary: "Federation connection status",
        tags: ["Federation"],
        responses: {
          "200": {
            description: "Federation status",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    connected: { type: "boolean" },
                    peers: { type: "array", items: { type: "object" } },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/federation/register": {
      post: {
        summary: "Register with Dividen network",
        tags: ["Federation"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  instanceUrl: { type: "string" },
                  capabilities: { type: "array", items: { type: "string" } },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Registration result", content: { "application/json": { schema: { type: "object" } } } },
          "400": { "$ref": "#/components/responses/BadRequest" },
        },
      },
    },
    "/federation/tasks": {
      post: {
        summary: "Inbound A2A task (Dividen federation)",
        description: "Primary Inyo federation endpoint. Accepts agent-to-agent tasks from Dividen peers and executes them using the Inyo agent runtime. Authentication is handled by the Dividen platform — no Clerk session required for this route.",
        tags: ["Federation"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["agentType", "context"],
                properties: {
                  agentType: {
                    type: "string",
                    description: "Which Inyo agent to invoke",
                    enum: [
                      "deal-flow", "ic-memo", "portfolio-monitor", "cfo", "legal", "tax",
                      "chief-of-staff", "concierge", "philanthropy", "relationships",
                      "deal-enrichment", "term-sheet", "diligence",
                      "unit-economics", "saas-model", "cap-table", "term-loan",
                      "sales-forecast", "sales-quota", "cash-management", "venture-stagger",
                      "option-grants", "startup-kit",
                    ],
                  },
                  context: { type: "object", description: "Agent input data — shape varies by agentType. See Dividen Bubble Store sample prompts for each agent." },
                  documents: {
                    type: "array",
                    description: "Optional documents (used by term-sheet, diligence, legal)",
                    items: { type: "object", properties: { name: { type: "string" }, content: { type: "string" } } },
                  },
                  taskId: { type: "string", description: "Optional correlation ID from the calling peer" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Task completed",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    taskId: { type: "string" },
                    status: { type: "string", enum: ["completed", "failed"] },
                    result: { type: "object", description: "Structured agent output. Always includes `_preview` summary field." },
                    tokensUsed: { type: "integer" },
                    model: { type: "string" },
                  },
                },
              },
            },
          },
          "400": { "$ref": "#/components/responses/BadRequest" },
          "500": { "$ref": "#/components/responses/ServerError" },
        },
      },
    },
    "/approvals": {
      get: {
        summary: "List approvals",
        description: "Defaults to pending status.",
        tags: ["Approvals"],
        parameters: [
          { name: "familyId", in: "query", schema: { type: "string" } },
          { name: "status", in: "query", schema: { type: "string", enum: ["pending","approved","rejected"], default: "pending" } },
        ],
        responses: {
          "200": {
            description: "Approval list",
            content: { "application/json": { schema: { type: "object", properties: { approvals: { type: "array", items: { "$ref": "#/components/schemas/Approval" } }, _mock: { type: "boolean" } } } } },
          },
        },
      },
      post: {
        summary: "Create approval",
        tags: ["Approvals"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["familyId","type","title"],
                properties: {
                  familyId: { type: "string" },
                  agentRunId: { type: "string", nullable: true },
                  type: { type: "string", enum: ["agent-action","document-sign","transaction","deal-advance"] },
                  title: { type: "string" },
                  description: { type: "string", nullable: true },
                  priority: { type: "string", enum: ["low","normal","high","urgent"], default: "normal" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Created approval",
            content: { "application/json": { schema: { type: "object", properties: { approval: { "$ref": "#/components/schemas/Approval" } } } } },
          },
          "400": { "$ref": "#/components/responses/BadRequest" },
        },
      },
    },
    "/approvals/{id}": {
      patch: {
        summary: "Review approval (approve/reject)",
        tags: ["Approvals"],
        parameters: [{ "$ref": "#/components/parameters/IdPath" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: { type: "string", enum: ["approved","rejected"] },
                  reviewNote: { type: "string", nullable: true },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Reviewed approval",
            content: { "application/json": { schema: { type: "object", properties: { approval: { "$ref": "#/components/schemas/Approval" } } } } },
          },
          "400": { "$ref": "#/components/responses/BadRequest" },
          "404": { "$ref": "#/components/responses/NotFound" },
        },
      },
    },
    "/dashboard": {
      get: {
        summary: "Dashboard stats",
        description: "Aggregate stats, recent deals, and portfolio alerts.",
        tags: ["Dashboard"],
        parameters: [{ name: "familyId", in: "query", schema: { type: "string" } }],
        responses: {
          "200": {
            description: "Dashboard data",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    stats: {
                      type: "object",
                      properties: {
                        totalDeals: { type: "integer" },
                        pipelineValue: { type: "number" },
                        activeDeals: { type: "integer" },
                        portfolioCompanies: { type: "integer" },
                      },
                    },
                    recentDeals: { type: "array", items: { type: "object" } },
                    alerts: { type: "array", items: { type: "object" } },
                    _mock: { type: "boolean" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/calendar": {
      get: {
        summary: "Capital call and distribution calendar",
        description: "Returns upcoming capital calls, distributions, and a 90-day cash flow summary. familyId required.",
        tags: ["Calendar"],
        parameters: [{ name: "familyId", in: "query", required: true, schema: { type: "string" } }],
        responses: {
          "200": {
            description: "Calendar data",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    upcomingCalls: { type: "array", items: { "$ref": "#/components/schemas/CalendarItem" } },
                    upcomingDistributions: { type: "array", items: { "$ref": "#/components/schemas/CalendarItem" } },
                    cashFlowItems: { type: "array", items: { "$ref": "#/components/schemas/CalendarItem" } },
                    summary: {
                      type: "object",
                      properties: {
                        totalCallsNext90Days: { type: "number" },
                        totalDistributionsNext90Days: { type: "number" },
                        netNext90Days: { type: "number" },
                        dryPowder: { type: "number" },
                      },
                    },
                    _mock: { type: "boolean" },
                  },
                },
              },
            },
          },
          "400": { "$ref": "#/components/responses/BadRequest" },
        },
      },
    },
    "/me": {
      get: {
        summary: "Current user info",
        description: "Returns the authenticated user's Clerk userId and resolved familyId.",
        tags: ["User"],
        responses: {
          "200": {
            description: "Current user",
            content: { "application/json": { schema: { type: "object", properties: { userId: { type: "string" }, familyId: { type: "string" } } } } },
          },
          "401": {
            description: "Unauthorized",
            content: { "application/json": { schema: { "$ref": "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },
    "/family/{id}": {
      get: {
        summary: "Get family",
        tags: ["Family"],
        parameters: [{ "$ref": "#/components/parameters/IdPath" }],
        responses: {
          "200": {
            description: "Family",
            content: { "application/json": { schema: { type: "object", properties: { family: { "$ref": "#/components/schemas/Family" } } } } },
          },
          "404": { "$ref": "#/components/responses/NotFound" },
        },
      },
      patch: {
        summary: "Update family",
        description: "Updatable fields: name, aum, currency.",
        tags: ["Family"],
        parameters: [{ "$ref": "#/components/parameters/IdPath" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  aum: { type: "number", nullable: true },
                  currency: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Updated family",
            content: { "application/json": { schema: { type: "object", properties: { family: { "$ref": "#/components/schemas/Family" } } } } },
          },
          "404": { "$ref": "#/components/responses/NotFound" },
          "500": { "$ref": "#/components/responses/ServerError" },
        },
      },
    },
    "/import/deals": {
      post: {
        summary: "Bulk import deals",
        description: "Accepts an array of deal objects (CSV/JSON) and bulk-creates them.",
        tags: ["Import"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["familyId","deals"],
                properties: {
                  familyId: { type: "string" },
                  deals: {
                    type: "array",
                    items: {
                      type: "object",
                      required: ["company"],
                      properties: {
                        company: { type: "string" },
                        name: { type: "string" },
                        sector: { type: "string" },
                        stage: { type: "string" },
                        status: { type: "string" },
                        capitalAsk: { type: "string" },
                        valuation: { type: "string" },
                        description: { type: "string" },
                        sourceType: { type: "string" },
                        sourceContact: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Import result",
            content: { "application/json": { schema: { type: "object", properties: { imported: { type: "integer" }, total: { type: "integer" }, _mock: { type: "boolean" } } } } },
          },
          "400": { "$ref": "#/components/responses/BadRequest" },
        },
      },
    },
    "/import/contacts": {
      post: {
        summary: "Bulk import contacts",
        tags: ["Import"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["familyId","contacts"],
                properties: {
                  familyId: { type: "string" },
                  contacts: {
                    type: "array",
                    items: {
                      type: "object",
                      required: ["name"],
                      properties: {
                        name: { type: "string" },
                        email: { type: "string" },
                        company: { type: "string" },
                        title: { type: "string" },
                        type: { type: "string" },
                        phone: { type: "string" },
                        linkedIn: { type: "string" },
                        notes: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Import result",
            content: { "application/json": { schema: { type: "object", properties: { imported: { type: "integer" }, total: { type: "integer" }, _mock: { type: "boolean" } } } } },
          },
          "400": { "$ref": "#/components/responses/BadRequest" },
        },
      },
    },
  },
  components: {
    parameters: {
      IdPath: {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string" },
        description: "Resource ID",
      },
    },
    responses: {
      BadRequest: {
        description: "Bad request — missing or invalid parameters",
        content: { "application/json": { schema: { "$ref": "#/components/schemas/ErrorResponse" } } },
      },
      NotFound: {
        description: "Resource not found",
        content: { "application/json": { schema: { "$ref": "#/components/schemas/ErrorResponse" } } },
      },
      ServerError: {
        description: "Internal server error or database unavailable",
        content: { "application/json": { schema: { "$ref": "#/components/schemas/ErrorResponse" } } },
      },
      DeleteSuccess: {
        description: "Successfully deleted",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean" },
                deletedAt: { type: "string", format: "date-time" },
              },
            },
          },
        },
      },
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        required: ["error"],
        properties: {
          error: { type: "string" },
        },
      },
      Pagination: {
        type: "object",
        properties: {
          page: { type: "integer" },
          pageSize: { type: "integer" },
          total: { type: "integer" },
          totalPages: { type: "integer" },
        },
      },
      Deal: {
        type: "object",
        properties: {
          id: { type: "string" },
          familyId: { type: "string" },
          entityId: { type: "string", nullable: true },
          name: { type: "string" },
          company: { type: "string" },
          sector: { type: "string", nullable: true },
          stage: { type: "string", nullable: true, enum: ["pre-seed","seed","series-a","series-b","series-c","growth","pe","real-estate","credit"] },
          status: { type: "string", enum: ["inbound","reviewing","diligence","ic-review","passed","invested","archived"] },
          capitalAsk: { type: "number", nullable: true },
          valuation: { type: "number", nullable: true },
          ownership: { type: "number", nullable: true },
          description: { type: "string", nullable: true },
          sourceType: { type: "string", nullable: true, enum: ["inbound","network","broker","lp-intro"] },
          sourceContact: { type: "string", nullable: true },
          dealScore: { type: "integer", nullable: true },
          icMemoUrl: { type: "string", nullable: true },
          dataRoomUrl: { type: "string", nullable: true },
          pitchDeckUrl: { type: "string", nullable: true },
          website: { type: "string", nullable: true },
          linkedinUrl: { type: "string", nullable: true },
          crunchbaseUrl: { type: "string", nullable: true },
          affinityScore: { type: "number", nullable: true },
          riskScore: { type: "number", nullable: true },
          fundabilityScore: { type: "number", nullable: true },
          enrichedAt: { type: "string", format: "date-time", nullable: true },
          investedAt: { type: "string", format: "date-time", nullable: true },
          deletedAt: { type: "string", format: "date-time", nullable: true },
          diligenceData: { type: "object", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      DealWithRelations: {
        allOf: [
          { "$ref": "#/components/schemas/Deal" },
          {
            type: "object",
            properties: {
              documents: { type: "array", items: { "$ref": "#/components/schemas/Document" } },
              aiAnalyses: { type: "array", items: { "$ref": "#/components/schemas/AgentRun" } },
              founders: { type: "array", items: { "$ref": "#/components/schemas/Founder" } },
            },
          },
        ],
      },
      Founder: {
        type: "object",
        properties: {
          id: { type: "string" },
          dealId: { type: "string" },
          name: { type: "string" },
          title: { type: "string", nullable: true },
          linkedinUrl: { type: "string", nullable: true },
          bio: { type: "string", nullable: true },
          deletedAt: { type: "string", format: "date-time", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      PortfolioCompany: {
        type: "object",
        properties: {
          id: { type: "string" },
          familyId: { type: "string", nullable: true },
          name: { type: "string" },
          sector: { type: "string", nullable: true },
          stage: { type: "string", nullable: true },
          status: { type: "string", enum: ["active","exited","written-off","watchlist"] },
          investedAmount: { type: "number", nullable: true },
          currentValue: { type: "number", nullable: true },
          ownership: { type: "number", nullable: true },
          investedAt: { type: "string", format: "date-time", nullable: true },
          lastFundingDate: { type: "string", format: "date-time", nullable: true },
          lastFundingRound: { type: "string", nullable: true },
          website: { type: "string", nullable: true },
          description: { type: "string", nullable: true },
          alertLevel: { type: "string", enum: ["normal","watch","alert","critical"] },
          deletedAt: { type: "string", format: "date-time", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          alerts: { type: "array", items: { "$ref": "#/components/schemas/PortfolioAlert" } },
        },
      },
      PortfolioAlert: {
        type: "object",
        properties: {
          id: { type: "string" },
          companyId: { type: "string" },
          type: { type: "string", enum: ["funding","executive-departure","layoffs","press","legal","burn-rate"] },
          severity: { type: "string", enum: ["info","warning","critical"] },
          title: { type: "string" },
          body: { type: "string", nullable: true },
          source: { type: "string", nullable: true },
          read: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Contact: {
        type: "object",
        properties: {
          id: { type: "string" },
          familyId: { type: "string" },
          name: { type: "string" },
          email: { type: "string", nullable: true },
          phone: { type: "string", nullable: true },
          company: { type: "string", nullable: true },
          title: { type: "string", nullable: true },
          type: { type: "string", enum: ["founder","lp","gp","attorney","banker","advisor","broker","family","contact"] },
          linkedIn: { type: "string", nullable: true },
          notes: { type: "string", nullable: true },
          lastContactAt: { type: "string", format: "date-time", nullable: true },
          introducedBy: { type: "string", nullable: true },
          warmPathNotes: { type: "string", nullable: true },
          investorType: { type: "string", nullable: true, enum: ["lp","co-investor","family-office","vc","pe","angel","strategic"] },
          assetClasses: { type: "array", items: { type: "string" } },
          checkSizeMin: { type: "number", nullable: true },
          checkSizeMax: { type: "number", nullable: true },
          portfolioNotes: { type: "string", nullable: true },
          lastDealTogether: { type: "string", nullable: true },
          deletedAt: { type: "string", format: "date-time", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      ContactInput: {
        type: "object",
        properties: {
          name: { type: "string" },
          email: { type: "string", nullable: true },
          phone: { type: "string", nullable: true },
          company: { type: "string", nullable: true },
          title: { type: "string", nullable: true },
          type: { type: "string" },
          linkedIn: { type: "string", nullable: true },
          notes: { type: "string", nullable: true },
          lastContactAt: { type: "string", format: "date-time", nullable: true },
          introducedBy: { type: "string", nullable: true },
          warmPathNotes: { type: "string", nullable: true },
          investorType: { type: "string", nullable: true },
          assetClasses: { type: "array", items: { type: "string" } },
          checkSizeMin: { type: "number", nullable: true },
          checkSizeMax: { type: "number", nullable: true },
          portfolioNotes: { type: "string", nullable: true },
          lastDealTogether: { type: "string", nullable: true },
        },
      },
      Interaction: {
        type: "object",
        properties: {
          id: { type: "string" },
          contactId: { type: "string" },
          type: { type: "string", enum: ["email","call","meeting","note","intro"] },
          subject: { type: "string", nullable: true },
          notes: { type: "string", nullable: true },
          outcome: { type: "string", nullable: true },
          occurredAt: { type: "string", format: "date-time" },
          createdAt: { type: "string", format: "date-time" },
          contact: { type: "object", nullable: true, properties: { name: { type: "string" } } },
        },
      },
      Document: {
        type: "object",
        properties: {
          id: { type: "string" },
          familyId: { type: "string" },
          dealId: { type: "string", nullable: true },
          companyId: { type: "string", nullable: true },
          contactId: { type: "string", nullable: true },
          name: { type: "string" },
          type: { type: "string", enum: ["pitch-deck","ic-memo","nda","lpa","safe","k1","tax-doc","bank-statement","report","contract","other"] },
          mimeType: { type: "string", nullable: true },
          storageUrl: { type: "string", nullable: true },
          textContent: { type: "string", nullable: true },
          checksum: { type: "string", nullable: true },
          fileSize: { type: "integer", nullable: true },
          processed: { type: "boolean" },
          expiresAt: { type: "string", format: "date-time", nullable: true },
          keyDates: { type: "array", items: { type: "object" }, nullable: true },
          alertDays: { type: "integer", nullable: true },
          deletedAt: { type: "string", format: "date-time", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      DocumentVersion: {
        type: "object",
        properties: {
          id: { type: "string" },
          documentId: { type: "string" },
          name: { type: "string" },
          textContent: { type: "string", nullable: true },
          checksum: { type: "string", nullable: true },
          mimeType: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Entity: {
        type: "object",
        properties: {
          id: { type: "string" },
          familyId: { type: "string" },
          name: { type: "string" },
          type: { type: "string", enum: ["llc","lp","trust","corp","foundation","individual"] },
          jurisdiction: { type: "string", nullable: true },
          taxId: { type: "string", nullable: true },
          description: { type: "string", nullable: true },
          deletedAt: { type: "string", format: "date-time", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      CashFlow: {
        type: "object",
        properties: {
          id: { type: "string" },
          entityId: { type: "string" },
          type: { type: "string", enum: ["income","expense","distribution","capital-call","tax-payment"] },
          category: { type: "string", nullable: true },
          amount: { type: "number" },
          currency: { type: "string" },
          description: { type: "string", nullable: true },
          occurredAt: { type: "string", format: "date-time" },
          deletedAt: { type: "string", format: "date-time", nullable: true },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      CashFlowItem: {
        type: "object",
        description: "Cash flow enriched with entity name",
        properties: {
          id: { type: "string" },
          entityId: { type: "string" },
          entityName: { type: "string" },
          type: { type: "string" },
          category: { type: "string", nullable: true },
          amount: { type: "number" },
          currency: { type: "string" },
          description: { type: "string", nullable: true },
          occurredAt: { type: "string", format: "date-time" },
        },
      },
      SPV: {
        type: "object",
        properties: {
          id: { type: "string" },
          familyId: { type: "string" },
          dealId: { type: "string", nullable: true },
          name: { type: "string" },
          status: { type: "string", enum: ["draft","launching","active","closed","cancelled"] },
          spvType: { type: "string", enum: ["syndicate","secondary","layered"] },
          sydecarId: { type: "string", nullable: true },
          sydecarUrl: { type: "string", nullable: true },
          targetRaise: { type: "number", nullable: true },
          totalCommitted: { type: "number" },
          managementFee: { type: "number" },
          carry: { type: "number" },
          closingDate: { type: "string", format: "date-time", nullable: true },
          investmentType: { type: "string", nullable: true },
          description: { type: "string", nullable: true },
          launchedAt: { type: "string", format: "date-time", nullable: true },
          deletedAt: { type: "string", format: "date-time", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      SPVWithInvestors: {
        allOf: [
          { "$ref": "#/components/schemas/SPV" },
          {
            type: "object",
            properties: {
              investors: { type: "array", items: { "$ref": "#/components/schemas/SPVInvestor" } },
            },
          },
        ],
      },
      SPVInvestor: {
        type: "object",
        properties: {
          id: { type: "string" },
          spvId: { type: "string" },
          contactId: { type: "string", nullable: true },
          name: { type: "string" },
          email: { type: "string", format: "email" },
          commitment: { type: "number" },
          status: { type: "string", enum: ["invited","committed","funded","withdrawn"] },
          sydecarPersonId: { type: "string", nullable: true },
          sydecarProfileId: { type: "string", nullable: true },
          invitedAt: { type: "string", format: "date-time", nullable: true },
          committedAt: { type: "string", format: "date-time", nullable: true },
          fundedAt: { type: "string", format: "date-time", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Approval: {
        type: "object",
        properties: {
          id: { type: "string" },
          familyId: { type: "string" },
          agentRunId: { type: "string", nullable: true },
          type: { type: "string", enum: ["agent-action","document-sign","transaction","deal-advance"] },
          title: { type: "string" },
          description: { type: "string", nullable: true },
          status: { type: "string", enum: ["pending","approved","rejected"] },
          priority: { type: "string", enum: ["low","normal","high","urgent"] },
          reviewedAt: { type: "string", format: "date-time", nullable: true },
          reviewNote: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      AgentRun: {
        type: "object",
        properties: {
          id: { type: "string" },
          agentType: { type: "string", enum: ["deal-flow","ic-memo","portfolio-monitor","cfo","legal","tax","chief-of-staff","concierge","philanthropy","relationships"] },
          dealId: { type: "string", nullable: true },
          companyId: { type: "string", nullable: true },
          documentId: { type: "string", nullable: true },
          input: { type: "object" },
          output: { type: "object", nullable: true },
          model: { type: "string", nullable: true },
          tokensUsed: { type: "integer", nullable: true },
          status: { type: "string", enum: ["pending","running","awaiting-approval","completed","failed"] },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      DealFlowResult: {
        type: "object",
        description: "Structured output from the deal flow agent",
        properties: {
          score: { type: "integer", description: "Deal score 0-100" },
          sector: { type: "string" },
          stage: { type: "string" },
          capitalAsk: { type: "number", nullable: true },
          valuation: { type: "number", nullable: true },
          summary: { type: "string" },
          risks: { type: "array", items: { type: "string" } },
          opportunities: { type: "array", items: { type: "string" } },
          founderBackground: { type: "string", nullable: true },
          comparables: { type: "array", items: { type: "string" } },
          recommendation: { type: "string", enum: ["pursue","pass","watch"] },
        },
      },
      Family: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          slug: { type: "string" },
          tier: { type: "string" },
          aum: { type: "number", nullable: true },
          currency: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      CalendarItem: {
        type: "object",
        properties: {
          id: { type: "string" },
          dealId: { type: "string" },
          dealName: { type: "string" },
          company: { type: "string" },
          amount: { type: "number" },
          dueDate: { type: "string", format: "date" },
          status: { type: "string", enum: ["overdue","due-soon","upcoming"] },
          daysUntil: { type: "integer" },
          sector: { type: "string" },
          type: { type: "string", enum: ["capital-call","distribution"] },
        },
      },
    },
  },
} as const;
