# FactoryFlow — Platform Architecture Addendum

> **Status:** Locked — Draft v1  
> **Baseline:** Locked PRD Modules 1–7 (`PRD-MVP.md`)  
> **Locked:** Platform Architecture Addendum v1 complete  
> **Purpose:** Cross-cutting platform specification shared across all modules  
> **Scope:** Platform layer only — does **not** redefine business rules locked in Modules 1–7

---

## Document relationship

| Document | Role |
|---|---|
| **PRD-MVP.md (Modules 1–7)** | Module-specific purpose, workflows, data models, business rules, module UX |
| **This addendum** | Platform services, security, integration, API ownership, events, release boundaries |

When this addendum and a locked module conflict on **business logic**, the locked module wins. When they conflict on **platform infrastructure** (auth, gateway, API routing), this addendum wins after approval.

---

## 1. Platform Overview

### 1.1 Architectural stance

FactoryFlow is a **multi-tenant SaaS production planning workspace** for apparel manufacturers. The platform layers three concerns:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Experience modules (locked PRD)                                         │
│  M1 Order Command Center · M3 Planner Dashboard · M4–M6 workspaces      │
│  · M7 Reporting & Administration                                         │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ authenticated API calls
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Domain core (locked Module 2 + Module 1 aggregate)                      │
│  TNA SSOT · Standard Engine Execution · KPI cache · Timeline store     │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ events · orchestration · read APIs
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Platform layer (this document)                                          │
│  Auth/RBAC · Integration Gateway · Event bus · Reconciliation · Audit   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Platform principles

| # | Principle |
|---|---|
| 1 | **Single tenant boundary** — `organizationId` on every entity and request; derived from auth token |
| 2 | **Single write path for TNA** — all gate mutations route through Module 2 Standard Engine Execution (locked §2.4) |
| 3 | **Derived data is read-only** — KPI cache, RiskSignal, summary status consumed, never recomputed by platform consumers |
| 4 | **No silent dual write** — bounded contexts (material, capacity, shipment) orchestrate; Module 2 commits milestone state |
| 5 | **UUID-first integration** — external keys use instance UUID, Milestone Code, `sourceSystem` + `sourceEventId` |
| 6 | **Fail closed on auth** — missing tenant, factory, or role scope → reject |
| 7 | **Audit everything that mutates** — user, service account, and ERP actions leave traceable records |
| 8 | **Module activation is org-scoped** — feature flags gate V1.1 module surfaces independently |

### 1.3 Platform vs module ownership

| Concern | Owner |
|---|---|
| TNA business rules, CP Progress, risk catalog | Locked Module 2 |
| Order header, Overall Progress, Quick Notes, Documents | Locked Module 1 |
| Procurement entities, receipt audit | Locked Module 4 |
| Line registry, allocation records, load math | Locked Module 5 |
| Post-EXF shipment records | Locked Module 6 |
| Report catalog, export artifacts | Locked Module 7 |
| **Authentication, RBAC, factory scope** | **Platform (this doc)** |
| **Integration gateway, ERP mapping, idempotency store** | **Platform (this doc)** |
| **Cross-module read API routing** | **Platform (this doc)** |
| **Event envelope, delivery semantics, outbox** | **Platform (this doc)** |
| **Reconciliation framework pattern** | **Platform (this doc)** |
| **Release manifest** | **Platform (this doc)** |

---

## 2. Authentication & Authorization

### 2.1 Authentication model (V1 / V1.1)

| Actor type | Mechanism | Notes |
|---|---|---|
| **Human users** | Session-based auth (OIDC/SAML-compatible) | Access token carries `userId`, `organizationId`, roles, factory scope |
| **Service accounts** | API key or mTLS client credential | Bound to single org; scoped roles from §5 |

**V1:** Human auth for Module 1 + Module 2 only.  
**V1.1:** Service accounts enabled for ERP and scheduled jobs.

### 2.2 Authorization pipeline

Every inbound request passes through:

```
Request
  → Authenticate (identity)
  → Resolve organizationId from token (never trust body alone)
  → Evaluate RBAC (§3)
  → Evaluate factory scope (§4)
  → Route to module handler
```

| Rule | Detail |
|---|---|
| **Tenant isolation** | `organizationId` from token must match resource `organizationId` |
| **Order scope** | Order-scoped operations require parent order in caller's org + factory scope |
| **Engine bypass prohibited** | No admin or bulk path may skip Standard Engine Execution (locked §2.7) |
| **Service account binding** | Service accounts are **single-org**; cross-org keys forbidden |

### 2.3 Session claims (minimum)

| Claim | Required | Purpose |
|---|---|---|
| `sub` / `userId` | Yes | Actor identity |
| `organizationId` | Yes | Tenant boundary |
| `roles[]` | Yes | RBAC evaluation |
| `factoryIds[]` | Human users | Factory authorization (§4); empty = no factory access |
| `sessionId` | Optional | Audit correlation |

Service account tokens carry `organizationId` + `serviceRoles[]` instead of `factoryIds[]` unless explicitly factory-scoped.

---

## 3. RBAC (Role-Based Access Control)

### 3.1 Human roles (V1 / V1.1)

| Role | Platform intent | Module reference |
|---|---|---|
| **Org Admin** | Org configuration, module settings, ERP schedule, admin hub | §2.6, M4–M7 settings |
| **Production Manager** | Cross-order oversight, break-glass overrides, reports | M3 saved views, M7 reports, break-glass in M4–M6 |
| **Planner** | Daily TNA maintenance, order command center, dashboard | M1, M2, M3 operational surfaces |

**V1.1 note:** Production Manager config delegation remains deferred per locked §2.6 — Org Admin only for TNA org config in V1.

### 3.2 Platform permission model

Permissions are **coarse role gates at the platform layer**. Module-specific matrices in locked PRD sections remain authoritative for module UX actions. Platform enforces **minimum** boundaries:

| Permission domain | Org Admin | Production Manager | Planner |
|---|---|---|---|
| Org / module settings | ✅ | ❌ | ❌ |
| TNA read (all scoped factories) | ✅ | ✅ | ✅ |
| TNA write (order-scoped) | ✅ | ✅ | ✅ |
| Manual order overrides (Hold/Cancel/Close) | ✅ | ✅ | ✅ * |
| Break-glass sync bypass (M4/M5/M6) | ✅ | ✅ | ❌ |
| Module 3 dashboard | ✅ | ✅ | ✅ |
| Module 4–6 workspaces | ✅ | ✅ | ✅ |
| Module 7 reports (ad-hoc) | ✅ | ✅ | ❌ |
| Module 7 ERP schedule / admin hub | ✅ | ❌ | ❌ |
| Reconciliation queue admin actions | ✅ | ✅ | ❌ ** |

\* Planner may hold/cancel/close per locked Module 1 workflows — module UX governs entry points.  
\** Planner may resolve order-level reconciliation from module panels where locked workflows allow; admin queue bulk actions are manager/admin only.

### 3.3 Permission evaluation order

1. Deny if tenant mismatch  
2. Deny if factory scope mismatch (human users)  
3. Deny if role lacks platform permission  
4. Delegate to module handler for fine-grained rules (e.g., Org Admin-only Revert TNA Planning — locked §2.6)

### 3.4 Future IAM (V1.2+)

Full user invite, role builder, field-level TNA permissions — deferred to locked Module 7 §7.8 and §2.8. Platform reserves `RoleAssignment` entity; V1.1 uses fixed role enum only.

---

## 4. Factory Authorization Model

### 4.1 Purpose

Multi-factory organizations require **row-level factory scope** on portfolio queries, dashboards, reports, and exports. Locked modules reference "user's authorized factories" without defining the platform entity — this section does.

### 4.2 Entity: `UserFactoryAssignment`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | UUID | Yes | Primary key |
| `organizationId` | UUID | Yes | Tenant boundary |
| `userId` | UUID | Yes | FK → platform user |
| `factoryId` | UUID | Yes | FK → Module 1 `Factory` |
| `assignedAt` | Timestamp | Yes | Audit |
| `assignedByUserId` | UUID | Yes | Org Admin who granted |

**Uniqueness:** `(organizationId, userId, factoryId)`

### 4.3 Scope rules

| Rule | Detail |
|---|---|
| **Default deny** | User with no assignments sees zero orders/factories |
| **Org Admin** | Implicit access to **all factories** in org unless org policy restricts (V1.1: unrestricted) |
| **Production Manager / Planner** | Explicit `UserFactoryAssignment` rows required |
| **Portfolio queries** | Auto-filter: `Order.factoryId IN caller.factoryIds` |
| **Single-order access** | Order read/write requires order's `factoryId` in caller scope |
| **Cross-factory reports** | Module 7 never overrides factory scope in V1.1 |
| **Service accounts** | Factory scope optional; default = all factories in bound org unless `factoryIds[]` on credential |

### 4.4 Factory entity authority

`Factory` master data is owned by **Module 1** (locked). Platform reads factory list for assignment UI; does not duplicate factory records.

### 4.5 Timezone authority

All modules use **`OrganizationTnaSettings.factoryTimezone`** (locked §2.6) for calendar-day boundaries. Factory authorization is **orthogonal** to timezone — scope is by `factoryId`, not timezone.

---

## 5. Service Account Registry

### 5.1 Entity: `ServiceAccount`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | UUID | Yes | Primary key |
| `organizationId` | UUID | Yes | Single-org binding |
| `name` | String | Yes | e.g. `"erp-sap-prod"` |
| `roles[]` | Enum[] | Yes | From §5.2 — one or more scoped roles |
| `factoryIds[]` | UUID[] | No | Optional factory restriction |
| `status` | Enum | Yes | Active · Revoked |
| `createdByUserId` | UUID | Yes | Org Admin |
| `lastRotatedAt` | Timestamp | No | Credential rotation audit |

### 5.2 Scoped roles catalog

| Role slug | Write | Read | Module reference |
|---|---|---|---|
| `tna:transition:material` | Module 2 material gate transitions (via gateway) | Order/TNA read for matched docs | Locked §4.6 |
| `tna:transition:sla` | Module 2 SLA transitions + Confirm saga orchestration | Order/TNA/capacity read | Locked §5.6 |
| `shipment:inbound` | Module 6 shipment status updates | Shipment portfolio read | Locked §6.6 |
| `reporting:export` | Module 7 `ExportArtifact` generation | KPI read projections | Locked §7.6 |
| `reporting:pickup` | None | Module 7 export list/download only | Locked §7.6 |

### 5.3 Separation rules

| Rule | Detail |
|---|---|
| **No role stacking to escalate** | `reporting:pickup` MUST NOT imply `reporting:export` or any `tna:*` role |
| **ERP inbound ≠ ERP outbound** | Inbound material/SLA/shipment roles cannot schedule exports or pickup KPI snapshots |
| **No planner UI permissions** | Service accounts cannot access dashboard bootstrap or TNA planner endpoints except whitelisted transition routes via gateway |
| **Revocation** | Immediate — revoked credentials fail closed on next request |

### 5.4 Credential lifecycle

| Event | Platform action |
|---|---|
| Create | Org Admin via settings; generate one-time secret |
| Rotate | New secret; grace window configurable (default 24h) |
| Revoke | `status=Revoked`; audit log entry |

---

## 6. Integration Gateway

### 6.1 Purpose

Central **inbound/outbound integration boundary** between FactoryFlow and external systems (SAP, generic ERP, future webhooks). Modules 4–7 and locked §2.7 reference ERP fields — the gateway owns routing, credentials, and idempotency **infrastructure**.

### 6.2 Responsibilities

| Responsibility | Gateway | Module |
|---|---|---|
| Authenticate service account | ✅ | — |
| Validate `sourceSystem` + `sourceEventId` | ✅ | — |
| Route document to handler | ✅ | Handler executes domain logic |
| Persist idempotency record | ✅ | — |
| Append Timeline audit metadata | Orchestrates | Module 2 engine writes event |
| Business validation | — | ✅ Module 2 / 4 / 5 / 6 |

### 6.3 Inbound routing table (V1.1)

| Document / intent | Gateway route | Handler owner |
|---|---|---|
| Material GRN / receipt | `POST /integration/inbound/material-receipt` | Module 4 reconciliation worker → Module 2 transition API |
| PO line sync (stub) | `POST /integration/inbound/material-po` | Module 4 |
| PP order release / line assignment | `POST /integration/inbound/capacity-allocation` | Module 5 Confirm saga |
| Delivery confirmation | `POST /integration/inbound/shipment-status` | Module 6 |
| Generic TNA transition (fallback) | `POST /integration/inbound/tna-transition` | Module 2 — **discouraged**; prefer typed routes |

### 6.4 Idempotency store: `IntegrationIdempotencyRecord`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | UUID | Yes | Primary key |
| `organizationId` | UUID | Yes | Tenant |
| `sourceSystem` | String | Yes | e.g. `"sap-erp"`, `"factoryflow"` |
| `sourceEventId` | String | Yes | External or artifact UUID |
| `firstSeenAt` | Timestamp | Yes | |
| `lastResultStatus` | Enum | Yes | Applied · Rejected · Duplicate |
| `responseSnapshot` | JSON | No | Cached idempotent replay body |

**Uniqueness:** `(organizationId, sourceSystem, sourceEventId)`

Duplicate inbound → return cached result without re-applying (locked §2.7 pattern).

### 6.5 Outbound routing (V1.1)

| Artifact | Producer | Consumer |
|---|---|---|
| KPI snapshot JSON | Module 7 `reporting:export` job | ERP via `reporting:pickup` |
| Future: webhook fan-out | Platform outbox | External subscribers |

Gateway serves **credentials vault** reference per org (`IntegrationCredential` — store external, platform holds pointer only).

---

## 7. ERP Integration Architecture

### 7.1 Design stance

FactoryFlow is **not an ERP**. ERP integration is **optional per org**, **idempotent**, and **audit-parity** with planner actions. Business semantics remain in locked modules; this section defines **posting boundaries** and **mapping**.

### 7.2 Entity: `ErpIntegrationMapping`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | UUID | Yes | Primary key |
| `organizationId` | UUID | Yes | Tenant |
| `factoryId` | UUID | No | Null = org-default |
| `externalPlantReference` | String | Yes | SAP plant / MM plant code |
| `externalCompanyCode` | String | No | SAP company code |
| `orderExternalReferencePattern` | String | No | Validation hint for `Order.externalReference` |
| `erpMilestoneCodePrefix` | String | No | Optional prefix for gate library mapping |
| `isActive` | Boolean | Yes | |

**Resolution order:** factory-specific row → org-default row → export omits plant key with warning.

### 7.3 SAP-aligned posting map (reference)

Platform reference for integrators — **does not override** module workflows:

| Business event | FactoryFlow source | Typical SAP document | Module |
|---|---|---|---|
| Ex-factory / goods issue | EXF gate Complete on TNA | MM GI / order confirmation | M2 (SSOT) |
| Goods receipt (fabric/trim) | Material receipt → BFI/BTI | MM GRN | M4 → M2 |
| Production order release | SLA Confirm saga | PP order / work center | M5 → M2 |
| Customer delivery | Shipment → Delivered | SD delivery (optional) | M6 |
| KPI snapshot export | ExportArtifact JSON | Middleware / BW staging | M7 |

**Critical boundary (locked Module 7):** Summary status **Shipped** (EXF) ≠ logistics **Delivered** (Module 6). Do not double-post EXF and Delivered as the same SAP movement without integrator design.

### 7.4 Inbound minimum metadata

All ERP inbound calls through gateway MUST include:

| Field | Required |
|---|---|
| `sourceSystem` | Yes |
| `sourceEventId` | Yes |
| `organizationId` | From token |
| `externalReference` | When matching existing entity |
| `expectedVersion` | On TNA updates (optimistic concurrency) |

### 7.5 Outbound KPI envelope

Module 7 export schema (locked §7.5) is authoritative for payload shape. Platform adds:

| Field | Source |
|---|---|
| `sourceSystem` | `"factoryflow"` |
| `sourceEventId` | `ExportArtifact.id` |
| `externalPlantReference` | `ErpIntegrationMapping` lookup |

---

## 8. API Ownership Matrix

### 8.1 Write API ownership

| API surface | Owner module | Platform gateway |
|---|---|---|
| Order CRUD, overrides, Overall Progress | Module 1 | — |
| TNA read/write, chase, engine | Module 2 | ERP → gateway → M2 |
| Dashboard bootstrap, widgets, saved views | Module 3 | — |
| Material requirements, PO lines, receipts | Module 4 | ERP material → gateway |
| Line allocation, capacity engine | Module 5 | ERP SLA → gateway |
| Shipment records, status engine | Module 6 | ERP delivery → gateway |
| Report runs, exports, settings | Module 7 | ERP pickup → gateway |
| Integration inbound (typed) | **Platform gateway** | Routes to module handlers |
| User/factory assignment, service accounts | **Platform** | IAM API (V1.1 minimal) |

### 8.2 Namespace conventions

| Prefix | Owner |
|---|---|
| `/orders/*` | Module 1 (aggregate + KPI read) |
| `/orders/{id}/tna-items/*` | Module 2 |
| `/dashboard/*` | Module 3 |
| `/material/*` | Module 4 |
| `/capacity/*` | Module 5 |
| `/shipments/*` | Module 6 |
| `/reporting/*` | Module 7 — runs, exports, catalog (orchestration) |
| `/reporting/timeline-activity` | Module 1 — cross-order Timeline read (producer; locked M7 §7.6) |
| `/reporting/tna-revisions`, `/reporting/exf-projections` | Module 2 — batch read projections (producer; locked M7 §7.6) |
| `/integration/*` | Platform gateway |
| `/platform/*` | Platform IAM, audit, flags |

**Rule:** Module 7 MUST NOT implement producer endpoints under `/reporting/*` that duplicate Module 1–6 SSOT writes.

---

## 9. Cross-Module Read API Ownership

### 9.1 Purpose

Consumers (Module 3, Module 7) depend on cross-order reads. This table assigns **producer ownership** and **minimum contract** without redefining business rules.

### 9.2 Read contract table (V1.1)

| Endpoint | Producer | Primary consumers | Pagination | Factory scope |
|---|---|---|---|---|
| `GET /orders` | **Module 1** | M3, M7 | Cursor; default 50; max 200 bootstrap | Required |
| `GET /orders/{id}` | **Module 1** | M4, M5, M6 panels | — | Required |
| `PATCH /orders/{id}` | **Module 1** | M5 (assignedProductionLineId) | — | Required; optimistic `version` |
| `GET /orders/{id}/timeline` | **Module 1** | M1 UI | Per-order | Required |
| `GET /orders/{id}/tna-items` | **Module 2** | M3, M4 | Per-order | Required |
| `GET /reporting/timeline-activity` | **Module 1** | M7 `PLANNER_ACTIVITY` | Cursor; max 5000/run | Required |
| `GET /reporting/tna-revisions` | **Module 2** | M7 `GATE_SLIPPAGE` | Cursor; max 5000/run | Required |
| `GET /reporting/exf-projections` | **Module 2** | M7 `EXF_PERFORMANCE` | Cursor; batch | Required |
| `GET /material/po-lines` | **Module 4** | M3 widget, M4, M7 | Cursor | Required |
| `GET /capacity/lines` | **Module 5** | M3 widget, M5, M7 | Snapshot | Required |
| `GET /shipments/portfolio` | **Module 6** | M3 widget, M6, M7 | Snapshot | Required |
| `GET /dashboard/bootstrap` | **Module 3** | M3 UI | ≤200 orders | Required |
| `GET /reporting/*` | **Module 7** | M7 UI, ERP pickup | Per locked §7.6 | Required |

### 9.3 Module 7 read orchestration rule

Module 7 **orchestrates** reports by calling producer APIs above — it does **not** maintain parallel TNA/KPI stores. Immutable snapshots live in `ExportArtifact` only (locked §7.2).

### 9.4 Minimum `GET /orders` projection (platform contract)

Producer: Module 1. Module-specific KPI semantics remain locked §2.3 / §2.5.

| Field group | Included |
|---|---|
| Order header | `id`, `externalReference`, `factoryId`, `orderType`, `summaryStatus`, override flags |
| KPI cache | `cpProgress`, `riskLevel`, `riskReasons[]`, `daysToExFactory`, `calculatedAt`, `businessRuleVersion` |
| Concurrency | `version` (order aggregate) |

Filters: `factoryIds[]`, `orderTypes[]`, `summaryStatus[]`, `dateFrom`/`dateTo` (EXF actual via join or secondary call to `/reporting/exf-projections`).

**Path authority:** Cross-module reporting producer endpoints under `/reporting/*` are defined in locked Module 7 §7.6; producer ownership in this table remains authoritative.

### 9.5 Minimum `GET /material/po-lines` projection (platform contract)

Producer: Module 4. Business rules for PO status remain locked §4.

| Field group | Included |
|---|---|
| Line identity | `id`, `orderId`, `poReference`, `materialCode`, `status` |
| Quantities | `qtyOrdered`, `qtyReceived`, `uom` |
| Dates | `etaDate`, `isOverdue` |
| Factory scope | Via parent order |

---

## 10. Event Architecture

### 10.1 Relationship to locked Module 2 §2.7

Locked §2.7 defines the **domain event envelope** and Standard Engine Execution step-6 emission rules. This section defines **platform delivery layers** only.

### 10.2 Event categories

| Category | Examples | Delivery (V1) | Delivery (V1.1) |
|---|---|---|---|
| **Domain events** | `TnaItemCompleted`, `OrderExFactoryCompleted` | In-process, same transaction as save | + durable outbox |
| **Timeline events** | `PLANNED_DATE_REVISED`, `CHASE_LOGGED` | Sync append in engine step 5 | Unchanged |
| **Lifecycle signals** | On Hold, Cancelled, Closed | Timeline only (locked §2.7) | Optional domain events (V1.2) |
| **Module-local events** | Allocation Confirm, Shipment status change | Module store + logs | + outbox optional |

### 10.3 Standard envelope (reference)

Platform honors locked §2.7 envelope fields: `eventId`, `eventType`, `schemaVersion`, `occurredAt`, `organizationId`, `correlationId`, `aggregateType`, `aggregateId`, `aggregateVersion`, `businessRuleVersion`, `calculatedAt`, `payload`.

**V1 consumer rule (locked):** In-process handlers MUST NOT read KPI cache on event — use envelope + save response.

### 10.4 Handler execution modes

| Mode | When | Transaction rule |
|---|---|---|
| **In-process synchronous** | V1 domain event handlers (e.g. M3 cache invalidation) | Must not throw — rolls back save (locked §2.7) |
| **Post-commit async** | Module 6 activation on `OrderExFactoryCompleted` | Must not roll back Module 2 save (locked §6.6) |
| **Outbox worker (V1.1+)** | External ERP, analytics, webhooks | At-least-once; dedupe by `eventId` |

### 10.5 Entity: `OutboxEvent` (V1.1 readiness)

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | UUID | Yes | = domain `eventId` |
| `organizationId` | UUID | Yes | |
| `eventType` | String | Yes | |
| `payload` | JSON | Yes | Full envelope |
| `status` | Enum | Yes | Pending · Published · Failed |
| `publishedAt` | Timestamp | No | |
| `retryCount` | Integer | Yes | |

### 10.6 Emission ordering

Per-order ordering preserved by `correlationId` + sequence in locked §2.7. Platform outbox consumers MUST process same-order events in emission order when causal dependency exists.

---

## 11. Reconciliation Framework

### 11.1 Purpose

Modules 4, 5, and 6 define module-specific reconciliation queues (locked). This section defines the **shared platform pattern** without duplicating module business rules.

### 11.2 Reconciliation trigger categories

| Trigger | Platform code | Module |
|---|---|---|
| ERP inbound without matching local row | `ERP_ORPHAN_INBOUND` | M4, M5, M6 |
| Local state without ERP confirmation | `ERP_ORPHAN_LOCAL` | M4, M5, M6 |
| Break-glass bypass | `SYNC_BYPASS` | M4, M5, M6 (`MODULE*_SYNC_BYPASS` timeline) |
| Confirm saga partial failure | `SAGA_INCOMPLETE` | M5 |
| EXF without shipment record | `EXF_WITHOUT_RECORD` | M6 |
| Shipment without EXF | `RECORD_WITHOUT_EXF` | M6 |
| Gate qty ≠ PO line sum | `QTY_DIVERGENCE` | M4 |

### 11.3 Shared entity shape: `ReconciliationQueueItem` (platform base)

Modules extend with module-specific FKs. Minimum platform fields:

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | UUID | Yes | |
| `organizationId` | UUID | Yes | |
| `moduleCode` | Enum | Yes | M4 · M5 · M6 |
| `reasonCode` | String | Yes | From §11.2 |
| `orderId` | UUID | No | When order-scoped |
| `status` | Enum | Yes | Open · Acknowledged · Resolved · Archived |
| `severity` | Enum | Yes | Info · Warning · Error |
| `detectedAt` | Timestamp | Yes | |
| `resolvedAt` | Timestamp | No | |
| `resolvedByUserId` | UUID | No | |

### 11.4 UX pattern (platform)

| Surface | Behavior |
|---|---|
| **Module home banner** | Count of open items for that module |
| **Order panel banner** | Order-scoped open items — "Out of sync — reconcile" |
| **Admin reconciliation view** | Cross-order queue; filter by reason, factory, age |
| **Resolution actions** | Module workflow owns action — platform logs resolution audit |

### 11.5 Reconciliation on read

Modules MAY detect drift on panel load (locked M4 pattern). Platform recommends **non-blocking banner** + queue item upsert — never silent auto-repair except idempotent ERP replay through gateway.

### 11.6 Module 5 Confirm saga platform requirement

**Saga correlation:** Confirm saga MUST persist `correlationId` on `LineAllocation` before calling Module 2/1 (locked §5.5 enhanced at platform layer).

| Saga state | Meaning |
|---|---|
| `ConfirmPending` | Module 2 and/or M1 call in flight |
| `ConfirmFailed` | Compensating action attempted; manual queue if needed |
| `Confirmed` | Invariant satisfied |

Background worker scans stale `ConfirmPending` (> 5 min) → `SAGA_INCOMPLETE` reconciliation item.

---

## 12. Logging & Audit Strategy

### 12.1 Audit layers

| Layer | Store | Writer | Content |
|---|---|---|---|
| **Production Timeline** | Module 1 store | Module 2 engine (TNA); Module 1 (Quick Notes) | Planner-visible audit |
| **Module append logs** | Module stores | M4 ReceiptLog, M5 LineAllocationLog, M6 ShipmentStatusLog | Domain-specific audit |
| **Org config audit** | Platform | Org Admin mutations | Locked §2.6 `OrgConfigAuditLog` |
| **Integration audit** | Platform | Gateway | `sourceSystem`, `sourceEventId`, `actorServiceId` on Timeline via M2 |
| **Platform audit** | Platform | IAM, flag changes | User/role/factory assignment |

### 12.2 Correlation

| ID | Use |
|---|---|
| `correlationId` | Single user action spanning modules (e.g. Confirm saga) |
| `eventId` | Domain event deduplication |
| `sourceEventId` | ERP idempotency |
| `requestId` | HTTP request tracing |

All API responses SHOULD echo `X-Request-Id` for support correlation.

### 12.3 PII in logs and exports

Platform honors locked Module 7 `piiRedactionOnExport` for exports. Application logs MUST NOT write chase notes, Quick Note text, or owner PII at INFO level in production.

### 12.4 Retention (defaults)

| Store | Default retention |
|---|---|
| Timeline | Indefinite (append-only) |
| Module append logs | Indefinite |
| Integration idempotency records | 90 days minimum |
| Export artifacts | Org-configurable (`expiresAt`) |
| Platform access logs | 365 days |

---

## 13. Error Handling Principles

### 13.1 HTTP error taxonomy

| Code | Meaning | When |
|---|---|---|
| **400** | Validation failure | Business rule rejection surfaced from module |
| **403** | Forbidden | RBAC or factory scope denial |
| **404** | Not found | Resource absent or not visible in scope |
| **409** | Conflict | Optimistic concurrency (`TNAItem.version`, `Order.version`) |
| **422** | Unprocessable | State machine violation (e.g. invalid shipment transition) |
| **429** | Rate limited | Platform throttle |
| **500** | Internal error | Unexpected failure — rollback |

### 13.2 Transaction rules (platform)

| Scenario | Behavior |
|---|---|
| Engine execution fails | Full rollback — no partial KPI/TNA (locked §2.7) |
| In-process event handler throws | Roll back entire save (V1) |
| Post-commit handler fails | Log + reconciliation queue — never roll back committed domain save |
| Bulk chase partial success | Per-gate commit; aggregate result returned (locked §3.6) |
| ERP duplicate inbound | Idempotent 200/409 with cached outcome — no double apply |

### 13.3 Client guidance

| Rule | Detail |
|---|---|
| **409 handling** | Refresh entity versions; retry user action |
| **Optimistic UI** | KPI cards update from save response — no client-side engine (locked §2.5) |
| **Saga failure** | Show reconciliation banner; link to module panel |

### 13.4 Error envelope (API)

```json
{
  "errorCode": "OPTIMISTIC_CONCURRENCY_CONFLICT",
  "message": "Human-readable summary",
  "correlationId": "uuid",
  "details": { }
}
```

Module-specific `errorCode` catalogs remain in locked module sections.

---

## 14. Feature Flags & Module Activation

### 14.1 Org-level module flags

| Flag | Entity | Default | Gating surface |
|---|---|---|---|
| `module3Enabled` | Platform or M3 settings | true | Planner Dashboard |
| `module4Enabled` | `OrganizationMaterialSettings` | true | Material Planning |
| `module5Enabled` | `OrganizationCapacitySettings` | true | Capacity Planning |
| `module6Enabled` | `OrganizationShipmentSettings` | true | Shipment Tracking |
| `module7Enabled` | `OrganizationReportingSettings` | true | Reporting & Admin hub |

Module-specific settings entities remain authoritative (locked §4.3, §5.3, §6.3, §7.3). Platform treats them as **org feature flags** for routing and navigation.

### 14.2 Activation rules

| Rule | Detail |
|---|---|
| **Independent activation** | Org may enable M4 without M5 — dual-path rules apply (locked module sections) |
| **Dependency warnings** | Enabling M7 without M3 shows admin warning — reports work; handoff links inactive |
| **Backfill on enable** | M6 `module6Enabled` triggers ExfWithoutRecord queue (locked §6) — platform job scheduler |
| **Disable** | Read-only mode — data retained; write endpoints return 403 with `MODULE_DISABLED` |

### 14.3 Platform entity: `OrganizationPlatformSettings` (V1.1)

| Field | Default | Purpose |
|---|---|---|
| `integrationEnabled` | false | Master ERP gateway switch |
| `defaultFactoryTimezone` | UTC | Fallback until M2 settings loaded |
| `maintenanceMode` | false | Read-only org-wide banner |

---

## 15. Release Manifest (V1 / V1.1 / V1.2)

### 15.1 Purpose

Single platform view of **what ships when**. Module PRD sections define capabilities; this manifest defines **release trains**. Locked §2.8 V1 deferrals remain valid for the **V1 product slice** — this manifest supersedes §2.8 **only for release planning**, not business rules.

### 15.2 V1 — Production planning workspace (shipped scope)

| Component | Included |
|---|---|
| Module 1 | Order Command Center — full |
| Module 2 | Critical Path & TNA — Sections 2.1–2.8 |
| Module 3 | **Not shipped** — Workflow 4.1 order list fallback |
| Module 4–7 | **Not shipped** — manual TNA paths only |
| Platform | Human auth, Org Admin, single-org, no ERP gateway |
| `AssignedProductionLine` | Null |
| Domain events | In-process only |
| ERP connectors | None |

### 15.3 V1.1 — Operational & integration expansion

Ship as **incremental enablement** per org flags. Recommended build order matches locked PRD module design order.

| Train | Components | Platform dependencies |
|---|---|---|
| **V1.1-A** | Module 3 core dashboard (§3.1–3.7) | `GET /orders`, RBAC, factory scope |
| **V1.1-B** | Module 4 Material Planning | Gateway material routes, `tna:transition:material` |
| **V1.1-C** | Module 5 Capacity Planning | Confirm saga + `SAGA_INCOMPLETE` reconciliation |
| **V1.1-D** | Module 6 Shipment Tracking | Post-commit events, `shipment:inbound` |
| **V1.1-E** | Module 7 Reporting | Read API orchestration, `reporting:*` roles |
| **V1.1-F** | ERP integration (optional) | Gateway, `ErpIntegrationMapping`, idempotency store, outbox |
| **V1.1-G** | Module 3 optional widgets (locked §3.8 integrations) | Requires corresponding module read APIs — may ship with B/C/D/E |

**V1.1 platform deliverables:**

- `UserFactoryAssignment` + IAM API  
- Service account registry (§5)  
- Integration gateway (§6)  
- Cross-module read APIs (§9)  
- Reconciliation framework (§11)  
- Outbox (optional, for ERP/async)  

### 15.4 V1.2 — Planner power & lifecycle events

| Component | Target |
|---|---|
| Module 3 §3.8 bulk operations | Bulk date revision, bulk complete, bulk ownership |
| Module 3 UX | Snooze, presentation mode, mobile scan |
| Durable event subscriptions | Full async invalidation |
| Order lifecycle domain events | Hold/Cancel/Close as domain events |
| Production Manager config delegation | Locked §2.6 deferral |
| Full IAM UI | Locked §7.8 |

### 15.5 Compatibility rule

V1.1 modules MUST NOT break V1 behavior when flags are off. Orders created in V1 open in V1.1 without migration — reserved fields only.

---

## Appendix A — Platform entity summary

| Entity | Section |
|---|---|
| `UserFactoryAssignment` | §4.2 |
| `ServiceAccount` | §5.1 |
| `IntegrationIdempotencyRecord` | §6.4 |
| `ErpIntegrationMapping` | §7.2 |
| `OutboxEvent` | §10.5 |
| `ReconciliationQueueItem` (base) | §11.3 |
| `OrganizationPlatformSettings` | §14.3 |

---

## Appendix B — References to locked PRD

| Topic | PRD location |
|---|---|
| Standard Engine Execution | Locked §2.4 |
| Domain event envelope | Locked §2.7 |
| Module integration boundaries | Locked §2.7, M4 §4.6, M5 §5.6, M6 §6.6, M7 §7.6 |
| ERP export schema | Locked §7.5 |
| Module-specific RBAC detail | Locked §2.6, §7.1 |
| Break-glass timelines | Locked M4 §4.2, M5 §5.2, M6 §6.2 |

---

## Document status

**Locked — Draft v1.** Complements locked Modules 1–7 without modifying module business rules. Platform infrastructure amendments require explicit approval and version bump.
