# FactoryFlow — Technology Stack Decision

> **Document ID:** ADR-001  
> **Status:** Locked — Draft v1  
> **Baseline:** Locked PRD Modules 1–7 (`PRD-MVP.md`); Locked Platform Architecture Addendum; Locked Database Architecture & Data Model Specification; Locked API Specification  
> **Locked:** Technology Stack Decision (ADR-001) v1 complete  
> **Purpose:** Record and justify platform technology choices that implement the locked architecture  
> **Scope:** Technology decisions and rationale locked — **implementation artifacts (DDL, endpoint catalogs, application code) deferred post-lock**

---

## Project documentation status

| Document | Status |
|---|---|
| PRD-MVP.md — Modules 1–7 | Locked |
| Platform Architecture Addendum | Locked — Draft v1 |
| Database Architecture & Data Model Specification | Locked — Draft v1 |
| API Specification | Locked — Draft v1 (structure) |
| **This document** | **Locked — Draft v1 (ADR-001)** |

**Design phase:** Functional architecture, platform layer, physical data model, API structure, and **technology stack** are locked. Next artifact: Prisma schema / SQL DDL from Database Architecture entity inventory.

---

## Document relationship

| Document | Role relative to this ADR |
|---|---|
| **PRD-MVP.md** | Drives functional complexity: Standard Engine Execution, meeting workflows, desktop-first UX, `factoryTimezone` semantics |
| **Platform Architecture Addendum** | Drives auth model, gateway, event delivery modes, release trains, reconciliation workers |
| **Database Architecture Specification** | Locks PostgreSQL, tenancy model, transactional boundaries, outbox entity |
| **API Specification** | Locks REST namespaces, public/internal/gateway surfaces, module ownership |
| **This document** | Authoritative for **implementation technology** until superseded by ADR-002+ |

When this ADR and a locked architecture document conflict on **business or API semantics**, the locked document wins. When they conflict on **technology choice**, this ADR wins after explicit approval.

---

## Table of contents

1. [Purpose](#1-purpose)
2. [Architecture style](#2-architecture-style)
3. [Backend technology](#3-backend-technology)
4. [Frontend technology](#4-frontend-technology)
5. [Database](#5-database)
6. [ORM / Data access](#6-orm--data-access)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [API framework](#8-api-framework)
9. [Event processing](#9-event-processing)
10. [Cache](#10-cache)
11. [File storage](#11-file-storage)
12. [Search](#12-search)
13. [Logging](#13-logging)
14. [Monitoring](#14-monitoring)
15. [Background jobs](#15-background-jobs)
16. [Containerization](#16-containerization)
17. [Deployment](#17-deployment)
18. [CI/CD](#18-cicd)
19. [Testing strategy](#19-testing-strategy)
20. [Development standards](#20-development-standards)
21. [Release strategy](#21-release-strategy)
22. [Future technology considerations](#22-future-technology-considerations)

**Appendices**

- [Appendix A — Decision summary matrix](#appendix-a--decision-summary-matrix)
- [Appendix B — Locked architecture traceability](#appendix-b--locked-architecture-traceability)
- [Appendix C — Document status](#appendix-c--document-status)
- [Appendix D — Cross-reference validation (locked baseline)](#appendix-d--cross-reference-validation-locked-baseline)

---

## 1. Purpose

### Decision

FactoryFlow adopts a **single ADR document (ADR-001)** as the platform technology decision record. All implementation teams — backend, frontend, platform, DevOps — align to this document until a superseding ADR is approved.

### Rationale

The locked architecture defines **what** the system must do (multi-tenant SaaS, TNA engine SSOT, module release trains, ERP gateway). It deliberately defers **how** to implement at the technology layer. This ADR closes that gap with explicit, traceable choices so:

- Engineering can begin DDL, endpoint catalogs, and application scaffolding without re-litigating fundamentals.
- Technology choices remain auditable and revisable via ADR versioning.
- No locked document requires amendment for standard stack selection.

### Constraints inherited from locked documents

| Constraint | Source |
|---|---|
| Single PostgreSQL cluster per environment | Database Architecture §1 |
| Row-level `organization_id` tenant isolation | Platform §2, Database §14 |
| Standard Engine Execution in one ACID transaction | PRD §2.4, §2.7 |
| REST module namespaces and three API surfaces | API Specification §26 |
| OIDC/SAML-compatible human auth; service accounts V1.1 | Platform §2.1 |
| In-process events (V1) → outbox (V1.1-F) | Platform §10 |
| Release trains V1 / V1.1-A–G / V1.2 | Platform §15 |

### Alternatives considered

| Alternative | Rejected because |
|---|---|
| Per-module ADRs without platform ADR | Fragmented ownership; cross-cutting concerns (auth, tenancy, events) need one record |
| Defer all technology decisions to implementation | Blocks parallel work on DDL, CI, and frontend shell |

---

## 2. Architecture style

### Decision

**Modular monolith** deployed as one primary application service in V1 and V1.1, with **logical module boundaries** matching locked module ownership (M1–M7 + Platform). Internal module communication uses **in-process calls and internal REST surfaces** (API Specification §26); no separate microservices until scale or team topology forces a split.

```
┌──────────────────────────────────────────────────────────────┐
│  Web SPA (React)                                              │
└────────────────────────────┬─────────────────────────────────┘
                             │ HTTPS — public API surface
                             ▼
┌──────────────────────────────────────────────────────────────┐
│  FactoryFlow API (modular monolith)                           │
│  ┌─────────┬─────────┬─────────┬─────────┬─────────┬────────┐ │
│  │ Platform│   M1    │   M2    │ M3–M7   │ Workers │Gateway│ │
│  │ auth/RBAC│ orders │  TNA    │ modules │ (jobs)  │ layer │ │
│  └─────────┴─────────┴─────────┴─────────┴─────────┴────────┘ │
└────────────────────────────┬─────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
   PostgreSQL            Object storage         Redis (V1.1+)
   (primary store,       (attachments/exports)  (cache/locks)
    pg-boss jobs)
```

Background job durability uses **pg-boss on PostgreSQL** (§15) — not Redis.

### Rationale

- **Transactional engine requirement:** PRD §2.4 requires TNA save + Business Rule Engine + KPI cache + Timeline + RiskSignal in **one database transaction**. A monolith with shared PostgreSQL connection and unit-of-work boundary is the simplest correct implementation.
- **Single database locked:** Database Architecture §1 mandates one PostgreSQL cluster; splitting services without splitting the database adds distributed-transaction complexity without benefit at MVP scale.
- **Module ownership preserved:** Code organization mirrors API Specification module namespaces and Platform §8 ownership — teams can extract modules later without changing external contracts.
- **Release train alignment:** Platform §15 incremental trains (V1.1-A–G) map to feature-flagged module packages within one deployable artifact.

### Boundaries

| Boundary | Rule |
|---|---|
| **Public API** | Browser and future mobile clients — human JWT only |
| **Internal API** | Module-to-module (M5 Confirm saga → M2/M1); not exposed to browser |
| **Internal gateway (stub)** | In-process module orchestration (e.g. M4 → M2 material transition) — V1.1-B onward; **not** external ERP ingress |
| **External ERP gateway** | `/integration/*` inbound + `reporting:pickup` — service accounts only; V1.1-F (API Specification §26) |
| **Extract candidate (future)** | Outbox worker, report generation worker, ERP connector adapters |

### Alternatives considered

| Alternative | Rejected because |
|---|---|
| Microservices per module | Violates single-transaction engine; premature for V1 scope |
| Modular monolith + separate DB per module | Contradicts locked single-database principle |

---

## 3. Backend technology

### Decision

**TypeScript on Node.js 22 LTS** as the primary backend runtime, organized as a **monorepo** with shared types between API and frontend packages.

| Package | Responsibility |
|---|---|
| `apps/api` | HTTP server, module handlers, engine, workers |
| `apps/web` | React SPA |
| `packages/shared` | DTOs, enums, error codes, validation schemas |
| `packages/engine` | Module 2 Standard Engine Execution (pure domain logic) |

### Rationale

- **Type safety across stack:** Shared contracts for `organizationId`, optimistic `version`, domain event envelope (Platform §10.3), and API error envelope (Platform §13.4) reduce drift between frontend and backend.
- **Ecosystem fit:** Mature PostgreSQL drivers, OpenAPI tooling, OIDC libraries, and job queue clients.
- **Engine testability:** Module 2 Business Rule Engine (PRD §2.4 step 2) benefits from isolation in `packages/engine` with deterministic unit tests — no HTTP or DB required for rule regression.
- **Team velocity:** Single language for full-stack features (meeting queue UX, TNA save flows) matches PM-led iteration preference.

### Runtime requirements

| Requirement | Implementation note |
|---|---|
| `factoryTimezone` date math | `Temporal` API or `date-fns-tz` — server-side only; never client-local for portfolio queries (PRD §3.6) |
| UUID v4 PKs | Native `crypto.randomUUID()` |
| JSON columns | Native PostgreSQL JSONB mapping |
| Correlation / request IDs | Middleware assigns `X-Request-Id` (Platform §12.2) |

### Alternatives considered

| Alternative | Rejected because |
|---|---|
| Python (FastAPI/Django) | Strong for data science but splits stack from React frontend; no locked requirement favors it |
| Java/Kotlin (Spring) | Higher ceremony for MVP; valid for future enterprise extract |
| Go | Weaker shared-type story with TypeScript frontend |

---

## 4. Frontend technology

### Decision

**React 19 + TypeScript** SPA built with **Vite**, styled with **Tailwind CSS** and a headless component library (**Radix UI**), client routing via **React Router**.

| Concern | Choice |
|---|---|
| State — server | TanStack Query (React Query) for API cache, mutation response updates, 409 refresh |
| State — client UI | React context + local component state; Zustand only where cross-route session state needed (Module 3 meeting queue) |
| Forms | React Hook Form + Zod (shared schemas from `packages/shared`) |
| Accessibility | WCAG 2.1 AA — PRD Module 2 §2.9 mandates keyboard path, aria-live KPI region, focus traps |
| Date display | Always label with factory timezone; server computes "today" boundaries |

### Server-response UI rule

**UI state is updated only from successful server responses.** TanStack Query mutation `onSuccess` handlers apply returned entity payloads to the cache — never client-side recomputation.

**Explicitly prohibited — optimistic or client-side updates to:**

| Field group | Source |
|---|---|
| CP Progress, `calculatedAt` | PRD §2.5 |
| Risk Level, `riskReasons[]` | PRD §2.5 |
| Summary status | PRD §2.3 |
| Next Critical Gate | PRD §2.5 |

Dirty TNA row edits remain **client-local** until batch save (PRD Workflow 4) — distinct from KPI display, which always reflects last successful save response.

### Rationale

- **Desktop-first planner workstation:** PRD Module 3 specifies 1440px+ optimization, meeting-native layout, keyboard shortcuts (`[` / `]` for prev/next order). React component model suits dense data grids and inline TNA editing.
- **No optimistic KPI/risk/summary updates:** PRD §2.5 — KPI cards, risk callouts, and summary status update from **save response only**. TanStack Query applies mutation response payloads; no local engine simulation.
- **409 handling:** Platform §13.3 requires version refresh on conflict — mutation error handlers reload entity with new `version`.
- **Module activation:** Feature-flag-driven navigation hides M3–M7 surfaces when org flags off (Platform §14).

### V1 scope exclusions

| Deferred | Train |
|---|---|
| Mobile-native app | V1.2 (PRD §3.8 mobile scan) |
| Offline / PWA edit | Out of scope V1 |
| Presentation mode | V1.2 |

### Alternatives considered

| Alternative | Rejected because |
|---|---|
| Next.js SSR | No SEO requirement for authenticated planner app; SSR adds complexity for session-bound pages |
| Vue / Angular | No advantage over React for stated UX requirements |

---

## 5. Database

### Decision

**PostgreSQL 16+** as the sole primary datastore — **locked** by Database Architecture §1. One cluster per environment (dev, staging, production).

| Aspect | Decision |
|---|---|
| Topology | Primary + synchronous standby (production); single instance acceptable for dev/staging |
| Schema organization | Shared schema, row-level tenancy — Database §14.1 |
| Naming | `snake_case` tables/columns; API exposes `camelCase` |
| Migrations | Version-controlled sequential migrations (see §6) |
| Connection pooling | PgBouncer or RDS Proxy in production — see §5.1 |

### §5.1 Prisma + connection pooling compatibility

Standard Engine Execution uses **Prisma interactive transactions** (`$transaction`) spanning multiple engine steps (PRD §2.4, §2.7). Connection pooling must preserve transaction pin semantics.

| Deployment option | Configuration | Use when |
|---|---|---|
| **RDS Proxy** (recommended production default) | Prisma connects via RDS Proxy; session multiplexing compatible with interactive transactions | AWS production |
| **PgBouncer session mode** | `pool_mode = session` — one server connection per client for transaction duration | Self-managed pooling |
| **PgBouncer transaction mode** | Requires `?pgbouncer=true` on Prisma datasource URL; `max_prepared_statements` tuned; **avoid** for engine path unless validated | Cost-optimized pooling only after CI proof |

**Required Prisma settings (PgBouncer transaction mode — if used):**

| Setting | Value |
|---|---|
| Datasource URL flag | `?pgbouncer=true` |
| Prepared statements | Disabled or limited per Prisma PgBouncer guidance |
| Interactive transactions | Must pass integration test proving full engine commit/rollback |

**Compatibility validation (CI gate):**

Integration test suite (§19) MUST include a **PgBouncer/RDS Proxy compatibility scenario**: multi-step engine transaction (TNA save → Timeline append → KPI cache write) commits atomically and rolls back atomically on forced failure — run against the same pooler configuration used in staging/production.

### Rationale

- **Already locked** — no alternative evaluated.
- **ACID transactions** for Standard Engine Execution (PRD §2.7).
- **Rich indexing** for portfolio queries — Database §13.2 partial and composite indexes on `order`, `tna_item`, `timeline_event`.
- **JSONB** for event payloads, report parameters, idempotency snapshots (Platform §6.4, §10.5).
- **Advisory locks / row locks** available for Confirm saga and outbox ordering without additional infrastructure.

### Extensions (approved)

| Extension | Use |
|---|---|
| `pgcrypto` | UUID generation if not app-side |
| `btree_gin` | Composite GIN patterns if needed for JSONB risk reasons (Database §13.5 — optional V1.1) |

### Alternatives considered

None — PostgreSQL is locked.

---

## 6. ORM / Data access

### Decision

**Prisma** as the ORM and migration tool, with **repository-style service layer** per module enforcing tenant guards.

| Layer | Responsibility |
|---|---|
| Prisma schema | Table definitions aligned to Database Architecture entity inventory |
| Prisma migrations | DDL source of truth (post-lock artifact) |
| Module repositories | Every query includes `organization_id` from authenticated context — Database §14 |
| Raw SQL escape hatch | Allowed for complex portfolio queries and index-hinted reports — reviewed in PR |

### Multi-tenancy defense-in-depth

| Layer | Mechanism | Release |
|---|---|---|
| **Application** | Repository base class rejects queries without `organization_id` — Platform §2.2 | V1 |
| **ORM** | Global tenant scope filter on all tenant tables | V1 |
| **Database (optional RLS)** | PostgreSQL RLS policies: `(organization_id = current_setting('app.tenant_id'))` — Database §14.1 | **V1.1-A roadmap** |

RLS is **defense-in-depth**, not a substitute for application guards. On each request, API sets `SET LOCAL app.tenant_id = '<organizationId>'` before queries when RLS is enabled.

### Rationale

- **Migration workflow:** Sequential migrations match release trains; Prisma diff supports iterative DDL from locked data model.
- **Type-safe queries:** Generated client reduces SQL injection risk and maps cleanly to TypeScript DTOs.
- **Tenant guard pattern:** Middleware injects `organizationId`; repository base class rejects queries without tenant filter — Platform §2.2 fail-closed rule.
- **Optimistic concurrency:** Prisma `version` field increment on update; catch unique/expected row count for 409 mapping (Platform §13.1).

### Rules

| Rule | Source |
|---|---|
| No engine logic in ORM hooks | Engine stays in `packages/engine` — PRD §2.4 |
| Append-only tables — insert only | Timeline, logs — Database §12 |
| No generic soft delete | Status enums only — Database §11 |

### Alternatives considered

| Alternative | Rejected because |
|---|---|
| Drizzle ORM | Lighter but less mature migration UX for large schema (~62 tables) |
| TypeORM | Heavier decorator model; weaker migration story |
| Raw SQL only | Slower iteration; loses type safety for 62-table model |

---

## 7. Authentication & Authorization

### Decision

| Actor | Mechanism | Provider |
|---|---|---|
| **Human users (V1/V1.1)** | OIDC authorization code flow with PKCE | **Clerk** (or Auth0 — org choice at contract) |
| **Internal worker service accounts (V1.1)** | Platform-managed credentials for scheduled jobs, saga scanners, export workers | `service_account` table — **not** ERP-exposed |
| **External ERP service accounts (V1.1-F)** | API key + optional mTLS for ERP connectors | `service_account` table + gateway middleware |
| **Session token** | FactoryFlow-issued JWT after session enrichment | Signed by platform — carries Platform §2.3 claims |

### Session enrichment (post-OIDC login)

Commercial IdPs authenticate identity (`sub`) but do **not** natively provide FactoryFlow tenant claims. After OIDC callback:

```
OIDC login (Clerk/Auth0)
  → Resolve FactoryFlow user by IdP subject
  → Load platform data: user_role, user_factory_assignment
  → Issue FactoryFlow session JWT with enriched claims
```

| Claim | Source | Notes |
|---|---|---|
| `userId` | IdP `sub` mapped to `user.id` | FK in platform store |
| `organizationId` | `user.organization_id` | **Never** assumed from IdP org metadata alone |
| `roles[]` | `user_role` rows | Platform §3 fixed enum in V1.1 |
| `factoryIds[]` | `user_factory_assignment` rows | Empty = no factory access — Platform §4 |

Human API requests validate the **FactoryFlow-issued session JWT**, not raw IdP tokens at module handlers.

### Service account types

| Type | Purpose | Available from | External exposure |
|---|---|---|---|
| **Internal worker** | pg-boss jobs, ConfirmPending scan, export generation, M6 backfill | **V1.1-A** (registry); **V1.1-C** (saga scanner) | No — internal network only |
| **External ERP** | `/integration/inbound/*`, `reporting:pickup` | **V1.1-F** | Yes — gateway edge only |

### Token claims (minimum)

Platform §2.3 — enforced at API middleware:

| Claim | Required |
|---|---|
| `sub` / `userId` | Yes |
| `organizationId` | Yes |
| `roles[]` | Yes |
| `factoryIds[]` | Yes (human); empty = no factory access |
| `sessionId` | Optional |

### Authorization implementation

| Layer | Implementation |
|---|---|
| RBAC | Policy middleware — role × route matrix from Platform §3 |
| Factory scope | Query filter injection + 403 on out-of-scope resource |
| Service account binding | Single-org keys; gateway routes reject planner JWT (API Specification §26) |
| Internal vs external SA | Internal worker SAs cannot call public planner endpoints (Platform §5.2) |
| Engine bypass | No admin flag skips Standard Engine Execution — enforced in code review + integration tests |

### Rationale

- **OIDC/SAML-compatible** — Platform §2.1 requirement; Clerk/Auth0 satisfy enterprise SSO path without building identity from scratch.
- **V1 scope:** Human auth only for M1+M2 (Platform §2.1); internal worker service account **registry** from V1.1-A; external ERP credentials from V1.1-F (Platform §15.3).
- **Fail closed:** Missing claim → 403, never default tenant (Platform §1.2 principle 6).

### Alternatives considered

| Alternative | Rejected because |
|---|---|
| Keycloak self-hosted | Valid for air-gapped enterprise — defer to ADR if customer mandates; higher ops burden for MVP |
| Custom auth | Violates focus; security-critical surface |

---

## 8. API framework

### Decision

**NestJS** on Fastify adapter for the HTTP server.

| Concern | Pattern |
|---|---|
| Module structure | NestJS modules map 1:1 to API Specification §§12–18 + Platform §§3–9 |
| Public / internal / gateway | Separate NestJS module guards; internal routes bound to loopback/service mesh only |
| Validation | `class-validator` + Zod shared schemas at controller boundary |
| OpenAPI | `@nestjs/swagger` — generated from decorators when endpoint catalogs are written (post-lock API phase) |
| Error envelope | Global exception filter → Platform §13.4 JSON shape |
| Pagination | Cursor-based defaults — Platform §9 read contracts |

### Rationale

- **Modular monolith fit:** NestJS dependency injection aligns with module ownership boundaries and testability.
- **Fastify performance:** Lower overhead for portfolio list endpoints (`GET /orders`) and dashboard bootstrap.
- **Guard pipeline matches Platform §2.2:** Authenticate → tenant → RBAC → factory scope → handler.

### API conventions (locked)

| Convention | Source |
|---|---|
| REST namespaces | API Specification Appendix B |
| `expectedVersion` on PATCH | Database §10.1 |
| `X-Request-Id` echo | Platform §12.2 |
| Gateway idempotency headers | Platform §6.4 — `sourceSystem`, `sourceEventId` |

### Alternatives considered

| Alternative | Rejected because |
|---|---|
| Express raw | No structured module/guard convention at scale |
| Fastify standalone | NestJS adds structure worth the overhead for 7 modules + platform |

---

## 9. Event processing

### Decision

Three execution modes aligned to Platform §10.4:

| Mode | V1 | V1.1+ | Implementation |
|---|---|---|---|
| **In-process synchronous** | ✅ Domain events (M3 cache invalidation) | ✅ | NestJS `EventEmitter` — **synchronous, inside Prisma `$transaction`** |
| **Post-commit async** | — | ✅ M6 activation on `OrderExFactoryCompleted` | pg-boss / worker queue **after** transaction commit |
| **Outbox worker** | — | ✅ V1.1-F | PostgreSQL `outbox_event` table — Database §2.2; poll + publish |

### V1 in-process transaction rule (mandatory)

V1 domain event handlers execute **synchronously inside the same Prisma interactive transaction** as Standard Engine Execution (PRD §2.4, §2.7; Platform §10.4):

| Rule | Detail |
|---|---|
| **Same transaction** | Handlers dispatch at engine step 6 — before KPI cache write (step 7) and before commit |
| **Synchronous only** | No `async`/`await` dispatch, `setImmediate`, or queue before commit |
| **Must not throw** | Uncaught exception rolls back entire save — Timeline, KPI cache, TNA state |
| **Must not read KPI cache** | Handlers use event envelope + in-memory engine state only — Platform §10.3 V1 consumer rule |
| **No post-commit for V1 handlers** | Post-commit async reserved for M6 activation (V1.1-D) and outbox (V1.1-F) |

Implementation pattern: engine service opens `prisma.$transaction(async (tx) => { ... emit sync handlers ... })` — EventEmitter listeners receive `tx` client, not global Prisma client.

### Outbox pattern

| Aspect | Decision |
|---|---|
| Store | PostgreSQL `outbox_event` — same cluster, same transaction as domain write |
| Delivery | At-least-once; consumers dedupe by `eventId` (Platform §10.3) |
| Ordering | Per-order sequence via `correlationId` — Platform §10.6 |
| External publish | HTTPS webhook or ERP pickup — no Kafka in V1.1 |

### Rationale

- **V1 in-process only** — Platform §15.2; no message broker infrastructure for MVP.
- **Post-commit for M6** — Platform §10.4 / §13.2: post-commit failure must not roll back Module 2 save → reconciliation queue instead.
- **PostgreSQL outbox** over Kafka for V1.1-F: aligns with single-database lock; ERP volume does not justify Kafka operational cost.

### Alternatives considered

| Alternative | Rejected because |
|---|---|
| Kafka / RabbitMQ (V1) | Operational overhead; locked architecture does not require external bus in V1 |
| Change Data Capture | Complex for MVP; outbox is explicit and testable |

---

## 10. Cache

### Decision

| Cache type | Technology | Scope |
|---|---|---|
| **KPI cache** | PostgreSQL denormalized columns on `order` | Authoritative derived store — not Redis (PRD §2.3, Database §1 principle 9) |
| **Application cache** | **Redis 7+** (V1.1-A onward) | Session-adjacent data, rate limiting, distributed locks |
| **Dashboard widget cache** | In-process LRU (V1) → Redis (V1.2) | M3 widget projections; invalidated by in-process domain events V1 |
| **Idempotency replay** | PostgreSQL `integration_idempotency_record.response_snapshot` | Platform §6.4 — not Redis |

### Redis use cases (V1.1+)

| Use case | Detail |
|---|---|
| Rate limiting | Platform §13.1 — 429 responses |
| Confirm saga lock | Prevent duplicate Confirm on stale `ConfirmPending` |
| Report run status | Short-TTL cache for polling `GET /reporting/runs/{id}` |

### Rationale

- **No alternate KPI SSOT:** Locked architecture explicitly denormalizes KPI to `order` row — Redis must not become a second KPI store.
- **Redis deferred to V1.1-A:** V1 (M1+M2 only) runs without Redis; PostgreSQL sufficient.
- **V1.2 event-informed invalidation:** Platform §15.4 — durable subscriptions may shift M3 cache to Redis pub/sub.

### Alternatives considered

| Alternative | Rejected because |
|---|---|
| Memcached | No data structures for locks/rate limit sliding window |
| No cache layer ever | Rate limiting and saga locks needed at V1.1 scale |

---

## 11. File storage

### Decision

**S3-compatible object storage** (AWS S3 in cloud deployment; **MinIO** for local dev).

| Artifact | Owner module | Storage pattern |
|---|---|---|
| Order attachments | Module 1 (`order_attachment`) | Private bucket; `{organizationId}/attachments/...` key prefix |
| Export artifacts | Module 7 (`export_artifact`) | Private bucket; `{organizationId}/exports/...` key prefix |
| Report run outputs | Module 7 | Same bucket + prefix; lifecycle policy for org-configurable retention |

### Object key and presigned URL rules

| Rule | Detail |
|---|---|
| **Key prefix** | All objects stored under `{organizationId}/...` — S3 key MUST include tenant prefix |
| **Presigned URL generation** | API validates `organization_id` ownership of metadata row **before** signing — cross-tenant key access forbidden |
| **Upload flow** | Presigned PUT issued only after authenticated create of `order_attachment` / `export_artifact` row in caller's org |
| **Download flow** | Presigned GET validates row `organization_id` matches session token — Platform §2.2 |

### Metadata in PostgreSQL

Only object key, MIME type, size, `organization_id`, and audit fields persist in DB — binary content never in PostgreSQL.

### Rationale

- Database Architecture defines `order_attachment` and `export_artifact` entities — blob storage is implied.
- Presigned URLs keep API server out of byte streaming path for large exports (M7 ERP pickup).
- PII redaction on export (Platform §12.3) applied at generation time before upload.

### Alternatives considered

| Alternative | Rejected because |
|---|---|
| PostgreSQL BYTEA | Poor fit for large files; backup bloat |
| Local filesystem (production) | Not portable across container replicas |

---

## 12. Search

### Decision

**PostgreSQL indexed queries** for V1 and V1.1 — **no dedicated search engine**.

| Query type | Implementation |
|---|---|
| Order portfolio / meeting queue | Composite indexes — Database §13.2 |
| Cross-order timeline (`GET /reporting/timeline-activity`) | `(organization_id, occurred_at)` index + cursor pagination |
| Full-text on chase notes / Quick Notes | **Deferred V1.2** — not in locked MVP workflows |
| Report catalog filter | SQL `ILIKE` on small catalog table |

### Rationale

- Locked read contracts use **cursor pagination** with max row limits (Platform §9.2) — not Elasticsearch relevance scoring.
- ~62 tables with tenant-scoped indexes satisfy apparel manufacturer scale at MVP.
- OpenSearch adds ops cost without locked requirement.

### Future trigger

Cross-org analytics search, fuzzy PO reference matching across 100k+ rows, or sub-second full-text on Timeline — evaluate **OpenSearch** or **PostgreSQL pg_trgm** in ADR-002.

---

## 13. Logging

### Decision

**Structured JSON logging** to stdout; aggregation via platform log pipeline.

| Field (standard) | Purpose |
|---|---|
| `timestamp`, `level`, `message` | Baseline |
| `requestId` | HTTP trace — Platform §12.2 |
| `correlationId` | Cross-module actions — Confirm saga, ERP inbound |
| `organizationId`, `userId` | Tenant audit — **never log full JWT** |
| `moduleCode` | M1–M7 / Platform |

### Log levels by content

| Content | Level | Rule |
|---|---|---|
| Request start/end, status code | INFO | Production default |
| Chase notes, Quick Note text, owner PII | **PROHIBITED at INFO** | Platform §12.3 |
| Engine step timing | DEBUG | Dev/staging only |
| Integration payload bodies | DEBUG with redaction | Staging; truncated in prod |

### Audit vs application logs

Application logs are **not** the audit trail. Append-only stores (`timeline_event`, module logs, `org_config_audit_log`) remain authoritative — Platform §12.1.

### Rationale

- Supports `X-Request-Id` support correlation without conflating audit tiers.
- PII rules from Platform §12.3 are enforceable via lint rules on log call sites.

---

## 14. Monitoring

### Decision

**OpenTelemetry (OTel)** instrumentation with export to **Grafana Cloud** (or self-hosted Grafana + Prometheus + Tempo + Loki).

| Signal | Target |
|---|---|
| **Metrics** | Request latency p50/p95/p99 by route; engine execution duration; outbox lag; reconciliation queue depth |
| **Traces** | Distributed traces across Confirm saga (M5 → M2 → M1) via shared `correlationId` |
| **Alerts** | Outbox retry exhaustion; ConfirmPending > 5 min (Platform §11.6); error rate spike; DB connection pool saturation |
| **Uptime** | Synthetic probe on `/health` and auth flow |

### Health checks

| Endpoint | Exposure |
|---|---|
| `/health/live` | Orchestrator liveness |
| `/health/ready` | DB connectivity + Redis (if enabled) |

### Rationale

- Confirm saga and outbox worker have explicit SLA triggers in locked Platform §11.6 — monitoring is required for operability, not optional.
- OTel avoids vendor lock-in while supporting Grafana/Datadog backends.

### Alternatives considered

| Alternative | Rejected because |
|---|---|
| Datadog-only | Valid enterprise choice — OTel still recommended as instrumentation layer |
| Logs-only monitoring | Insufficient for saga latency and outbox lag |

---

## 15. Background jobs

### Decision

**pg-boss** (PostgreSQL-backed job queue) for V1.1+ background work; **in-process schedulers** acceptable for V1.

| Job | Trigger | Train |
|---|---|---|
| ConfirmPending stale scan → `SAGA_INCOMPLETE` | Cron every 5 min | V1.1-C |
| M6 backfill on `module6Enabled` | Org flag toggle | V1.1-D |
| Export generation (`export_job`) | Async on `POST /reporting/runs` | V1.1-E |
| Outbox publish | Poll `outbox_event` | V1.1-F |
| Idempotency record cleanup (> 90 days) | Daily cron | V1.1-F |

### Rationale

- **pg-boss uses existing PostgreSQL** — consistent with single-database lock; no Redis dependency for job durability.
- **At-least-once execution** with idempotent handlers matches Platform §10.4 outbox semantics.
- Jobs run in same monorepo `apps/api` worker process initially; extract to separate worker deployment when CPU-bound report generation justifies it.

### Alternatives considered

| Alternative | Rejected because |
|---|---|
| BullMQ (Redis) | Adds Redis as hard dependency for jobs; pg-boss sufficient |
| Cron-only (no queue) | No retry/dead-letter for export and outbox jobs |

---

## 16. Containerization

### Decision

**Docker** containers for all deployable units.

| Image | Contents |
|---|---|
| `factoryflow-api` | NestJS API + embedded worker (pg-boss consumer) |
| `factoryflow-web` | Static SPA served by nginx or CDN origin |
| `factoryflow-migrate` | One-shot Prisma migrate job (CI/CD and deploy hook) |

### Local development

**Docker Compose** stack: PostgreSQL, MinIO, Redis (optional profile), API, Web.

### Rationale

- Reproducible environments for engine regression tests against real PostgreSQL.
- Migrate job pattern prevents schema drift between app and DB.

---

## 17. Deployment

### Decision

**AWS** as primary cloud (adjustable per customer contract):

| Component | AWS service |
|---|---|
| Compute | **ECS Fargate** (V1) — EKS if multi-service extract later |
| Database | **RDS PostgreSQL 16** Multi-AZ (production) |
| Object storage | **S3** |
| Cache | **ElastiCache Redis** (V1.1+) |
| CDN / static | **CloudFront** for SPA assets |
| Secrets | **AWS Secrets Manager** — integration credentials refs (Platform §6.5) |
| DNS / TLS | Route 53 + ACM |

### Environment topology

| Environment | Purpose |
|---|---|
| `dev` | Engineer local + shared dev |
| `staging` | Pre-production; full module flags enabled for QA |
| `production` | Customer-facing; per-org feature flags |

### Tenancy

Single deployment serves all organizations — row-level isolation (Database §14). No per-customer deployment in standard SaaS tier.

### Rationale

- Apparel manufacturers expect managed SaaS uptime; RDS Multi-AZ satisfies RPO/RTO without DBA team.
- ECS Fargate simpler than EKS for single-service V1.

### Alternatives considered

| Alternative | Rejected because |
|---|---|
| Azure/GCP | Valid — ADR amended if contract requires; architecture stays container-portable |
| On-prem Kubernetes | Future enterprise tier — not MVP default |

---

## 18. CI/CD

### Decision

**GitHub Actions** pipeline:

| Stage | Actions |
|---|---|
| **Lint & typecheck** | ESLint, TypeScript strict, Prettier |
| **Unit tests** | Engine package 100% path coverage target for rule regressions |
| **Integration tests** | Testcontainers PostgreSQL — tenant guard, engine transaction, 409 concurrency |
| **Build** | Docker images → ECR |
| **Migrate** | `factoryflow-migrate` job against target DB |
| **Deploy** | ECS rolling update; staging auto, production manual approval |
| **OpenAPI diff** | Post-lock — breaking change gate on endpoint catalogs |

### Branch strategy

| Branch | Deploys to |
|---|---|
| `main` | Staging (auto) |
| Tags `v*` | Production (manual approval) |
| Feature branches | Preview env (optional) |

### Rationale

- Engine regression safety is critical — PRD §2.4 Business Rule Engine must not silently change CP Progress behavior.
- Migration job in pipeline prevents deploy-without-migrate failures.

---

## 19. Testing strategy

### Decision

| Layer | Tool | Focus |
|---|---|---|
| **Unit** | Vitest | Engine rules, date math in `factoryTimezone`, state machines |
| **Integration** | Vitest + Testcontainers | Full engine transaction rollback, Timeline append, KPI cache write atomicity |
| **API contract** | Supertest + OpenAPI validator | Post-lock endpoint catalogs |
| **E2E** | Playwright | Meeting queue walk, TNA save + KPI update, 409 retry |
| **Load** | k6 (staging) | Portfolio list, dashboard bootstrap — before V1.1-A |

### Critical test scenarios (from locked docs)

| Scenario | Source |
|---|---|
| Engine failure rolls back entire save | PRD §2.7 |
| In-process handler throw rolls back save | Platform §10.4, §13.2 |
| In-process handler runs inside same `$transaction` — no async pre-commit | ADR §9; PRD §2.7 step 6 |
| PgBouncer/RDS Proxy — engine transaction commit and rollback | ADR §5.1 |
| Post-commit M6 handler failure → reconciliation, not rollback | Platform §13.2 |
| Optimistic concurrency 409 on `order.version`, `tna_item.version` | Database §10.1 |
| Tenant isolation — cross-org access 403/404 | Platform §2.2 |
| ERP duplicate inbound returns cached outcome | Platform §6.4 |
| Confirm saga `correlationId` persisted before M2/M1 calls | Platform §11.6 |

### Rationale

- Highest risk is engine correctness and transaction boundaries — test investment weighted there.
- Playwright E2E validates desktop-first meeting workflow (PRD Workflow 4).

---

## 20. Development standards

### Decision

| Standard | Rule |
|---|---|
| **Language** | TypeScript strict mode — no `any` in engine or API layers |
| **Monorepo** | Turborepo for build orchestration |
| **Formatting** | Prettier + ESLint; enforced in CI |
| **Commits** | Conventional Commits (`feat(m2):`, `fix(platform):`) |
| **PR requirements** | 1 review; 2 for engine/platform changes |
| **Module ownership** | CODEOWNERS per `apps/api/src/modules/m*` |
| **Secrets** | Never in repo; `.env.example` documents required vars |
| **Feature flags** | Platform org flags checked server-side — never UI-only (Platform §14) |

### API development order (post-lock)

Per API Specification Appendix D next step:

1. M1 → M2 (V1)
2. M3 → M4 → M5 → M6 → M7 (V1.1 trains)
3. Internal worker service accounts (V1.1-A/C) → external ERP gateway (V1.1-F)

### Rationale

- CODEOWNERS mirrors locked module ownership — prevents cross-module SSOT violations.
- Server-side feature flags enforce Platform §14.2 disable behavior (403 `MODULE_DISABLED`).

---

## 21. Release strategy

### Decision

Releases follow **Platform §15 release trains** — technology deployment aligns to module flags, not separate infra releases.

| Train | Product scope | Infrastructure additions |
|---|---|---|
| **V1** | M1 + M2; human auth; in-process events | PostgreSQL, S3, SPA — no Redis, no gateway |
| **V1.1-A** | M3 dashboard | Redis optional; portfolio indexes hot; **internal worker SA registry**; RLS roadmap |
| **V1.1-B** | M4 material | **Internal gateway stub** — in-process M4→M2 material transition (monolith); no external `/integration/*` |
| **V1.1-C** | M5 capacity | pg-boss jobs; Confirm saga monitoring; **internal worker SA** for stale ConfirmPending scan |
| **V1.1-D** | M6 shipment | Post-commit handlers |
| **V1.1-E** | M7 reporting | Export worker (internal SA); larger S3 lifecycle |
| **V1.1-F** | ERP integration (optional) | **External ERP gateway** — `/integration/inbound/*`, `reporting:pickup`, ERP service accounts, outbox worker, idempotency cleanup |
| **V1.1-G** | M3 optional widgets | No new infra |
| **V1.2** | Bulk ops, mobile scan, durable subscriptions | Redis pub/sub evaluate; mobile build pipeline |

### Internal gateway stub vs external ERP gateway

ADR interpretation of Platform §15.3 train overlap (no locked document change):

| Boundary | What ships | Callers | Train |
|---|---|---|---|
| **Internal gateway stub** | Module orchestration paths inside monolith — M4→M2 material transition, M5 Confirm saga → M2/M1 | In-process or internal API (API Specification §26) | V1.1-B/C |
| **External ERP gateway** | Platform `/integration/*` ingress, idempotency store, ERP service accounts, `reporting:pickup` | External ERP connectors only | **V1.1-F** (API Specification §26) |

Platform §15.3 references "Gateway material routes" at V1.1-B — in this ADR that means **internal typed transition routing**, not external SAP ingress. External ERP remains optional at V1.1-F per API Specification §26 release boundary.

### Compatibility rule

Platform §15.5 — V1.1 modules MUST NOT break V1 when flags off. Deployment uses **dark launch**: code ships behind org flags before default-on.

### Versioning

| Artifact | Version strategy |
|---|---|
| API | URL namespaces stable; breaking changes require version bump + ADR |
| Domain event envelope | `schemaVersion` — Platform §10.3 |
| ERP export | `exportSchemaVersion` — PRD §7.5 |
| Database | Forward-only migrations; no destructive DDL without backfill job |

---

## 22. Future technology considerations

Items **explicitly deferred** — require ADR-002+ if adopted:

| Topic | Trigger | Options |
|---|---|---|
| **Microservice extract** | Team > 15 engineers or independent scaling need | Extract M2 engine service, outbox worker, report worker |
| **Kafka / event streaming** | > 10k events/min or multi-subscriber fan-out | Kafka, Redpanda, or SNS/SQS |
| **OpenSearch** | Full-text Timeline search across org | OpenSearch, pg_trgm |
| **Mobile native** | V1.2 mobile scan (PRD §3.8) | React Native or Capacitor wrapper |
| **Read replicas** | Portfolio query load exceeds primary | RDS read replica for M3/M7 read paths only |
| **Multi-region** | Customer SLA > 99.9% with geo redundancy | Active-passive RDS, S3 cross-region replication |
| **GraphQL / BFF** | Mobile or third-party developer ecosystem | GraphQL federation layer over REST |
| **Keycloak self-hosted** | Air-gapped enterprise deployment | Replace Clerk/Auth0 |
| **Columnar analytics** | Cross-org BI beyond M7 reports | Snowflake/BigQuery ETL from outbox |
| **AI / ML** | Risk prediction beyond rule engine | Feature store — out of locked MVP scope |

### Standing review triggers

Revisit this ADR when:

- A locked document amendment changes transactional or event boundaries
- Production exceeds 500 concurrent planner sessions
- First enterprise customer mandates non-AWS deployment
- ERP integration exceeds 1000 inbound events/hour/org

---

## Appendix A — Decision summary matrix

| # | Area | Decision |
|---|---|---|
| 1 | Architecture | Modular monolith |
| 2 | Backend | TypeScript / Node.js 22 |
| 3 | Frontend | React 19 + Vite + Tailwind |
| 4 | Database | PostgreSQL 16+ (locked) |
| 5 | ORM | Prisma |
| 6 | Auth | OIDC via Clerk/Auth0; internal worker SA V1.1-A; external ERP SA V1.1-F |
| 7 | API framework | NestJS + Fastify |
| 8 | Events | In-process → post-commit → PostgreSQL outbox |
| 9 | Cache | DB KPI cache + Redis V1.1+ |
| 10 | Files | S3-compatible object storage |
| 11 | Search | PostgreSQL indexes (no ES V1) |
| 12 | Logging | Structured JSON, PII-safe |
| 13 | Monitoring | OpenTelemetry + Grafana stack |
| 14 | Jobs | pg-boss (PostgreSQL) |
| 15 | Containers | Docker |
| 16 | Deployment | AWS ECS Fargate + RDS |
| 17 | CI/CD | GitHub Actions |
| 18 | Testing | Vitest + Testcontainers + Playwright |
| 19 | Release | Platform §15 trains + org feature flags |

---

## Appendix B — Locked architecture traceability

| ADR section | Primary locked reference |
|---|---|
| §2 Architecture style | Database §1; Platform §1.1; API §26 |
| §3 Backend | PRD §2.4 engine; Platform §10 events |
| §4 Frontend | PRD M2 §2.9 a11y; M3 §3.1 desktop-first |
| §5 Database | Database §1 — PostgreSQL locked |
| §5.1 Pooling | PRD §2.7 transaction; Database §1 |
| §6 ORM | Database §14 tenancy; §10 concurrency |
| §7 Auth / session enrichment | Platform §2–§5; Database `user`, `user_role` |
| §7 Service account split | Platform §5, §15.3; API §26 |
| §8 API | API Specification §§1–11, §26; Appendix B |
| §9 Events | Platform §10; Database `outbox_event` |
| §10 Cache | PRD §2.3 KPI cache; Platform §15.4 |
| §11 Files | Database `order_attachment`, `export_artifact`; Database §14 |
| §12 Search | Platform §9 cursor pagination; Database §13 |
| §13 Logging | Platform §12 |
| §14 Monitoring | Platform §11.6 saga SLA |
| §15 Jobs | Platform §11.6, §14.2 backfill; API §21 |
| §21 Release / gateway boundary | Platform §15; API §26 |

---

## Appendix C — Document status

**Locked — Draft v1 (ADR-001).** Validated against all locked baseline documents (see Appendix D). Implementation artifacts (Prisma schema, DDL, application code, endpoint catalogs) are deferred to post-lock workstreams. Does not modify any locked document. Technology amendments require explicit approval and ADR version bump.

---

## Appendix D — Cross-reference validation (locked baseline)

Final validation performed against locked PRD Modules 1–7, locked Platform Architecture Addendum, locked Database Architecture Specification, and locked API Specification prior to lock.

| Check | Result |
|---|---|
| **Architecture consistency** | Pass — modular monolith, single PostgreSQL, three API surfaces preserved |
| **Release boundaries** | Pass — §21 trains align Platform §15; internal stub (V1.1-B/C) vs external gateway (V1.1-F) resolves API §26 |
| **Transaction model** | Pass — §9 synchronous in-transaction handlers; §5.1 pooling compatibility; defers to PRD §2.4/§2.7 |
| **Event model** | Pass — V1 in-process → V1.1-D post-commit → V1.1-F outbox matches Platform §10 |
| **Security** | Pass — §7 session enrichment, §11 presigned URL ownership, internal/external SA split |
| **Multi-tenancy** | Pass — app guards + RLS roadmap (Database §14.1); S3 `{organizationId}/` prefix |
| **Deployment** | Pass — ECS/RDS/S3; pg-boss on PostgreSQL; Redis cache/locks only |
| **ERP compatibility** | Pass — external credentials V1.1-F; idempotency/outbox per Platform §6–§7 |
| **Terminology** | Pass — defers business semantics to locked PRD; no duplicate engine rules |
| **Duplicated business rules** | Pass — technology layer only; KPI/risk/summary client rules reference PRD §2.5 |

**New P0 issues at lock:** None identified.
