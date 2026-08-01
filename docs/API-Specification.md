# FactoryFlow — API Specification

> **Status:** Locked — Draft v1  
> **Baseline:** Locked PRD Modules 1–7 (`PRD-MVP.md`); Locked Platform Architecture Addendum; Locked Database Architecture & Data Model Specification  
> **Locked:** API Specification v1 complete (structure, ownership, namespaces, release boundaries)  
> **Purpose:** Single contract between frontend, backend, ERP integrations, and future mobile clients  
> **Scope:** API structure, ownership, and release boundaries locked — **endpoint catalogs, request/response schemas, and OpenAPI deferred post-lock**

---

## Project documentation status

| Document | Status |
|---|---|
| PRD-MVP.md — Modules 1–7 | Locked |
| Platform Architecture Addendum | Locked — Draft v1 |
| Database Architecture & Data Model Specification | Locked — Draft v1 |
| **This document** | **Locked — Draft v1 (structure)** |

**Design phase:** Functional architecture, platform layer, physical data model, and **API structure** are locked. Next artifact: API endpoint catalogs and schemas (post-lock), then SQL DDL.

---

## Document relationship

| Document | Role relative to this spec |
|---|---|
| **PRD-MVP.md (Modules 1–7)** | Authoritative for business rules, workflows, and module UX actions that APIs expose |
| **Platform Architecture Addendum** | Authoritative for auth, RBAC, factory scope, gateway, cross-module read ownership, errors, release trains |
| **Database Architecture & Data Model Specification** | Authoritative for persisted entities, keys, concurrency fields, and query/index constraints APIs must honor |
| **This document** | Authoritative for HTTP API surface — paths, ownership, contracts, and consumer boundaries |

When this spec and a locked module conflict on **business semantics**, the locked module wins. When they conflict on **route ownership or platform infrastructure**, the Platform Addendum wins after explicit spec amendment. Physical persistence details defer to the Database Architecture spec.

---

## Table of contents

1. [Specification principles](#1-specification-principles)
2. [API architecture overview](#2-api-architecture-overview)
3. [Platform — authentication & session](#3-platform--authentication--session)
4. [Platform — RBAC & factory authorization](#4-platform--rbac--factory-authorization)
5. [Platform — IAM & service accounts](#5-platform--iam--service-accounts)
6. [Platform — tenancy, headers & correlation](#6-platform--tenancy-headers--correlation)
7. [Platform — integration gateway (inbound)](#7-platform--integration-gateway-inbound)
8. [Platform — integration gateway (outbound & ERP pickup)](#8-platform--integration-gateway-outbound--erp-pickup)
9. [Platform — feature flags & module activation](#9-platform--feature-flags--module-activation)
10. [Common API patterns](#10-common-api-patterns)
11. [Error handling & HTTP semantics](#11-error-handling--http-semantics)
12. [Module 1 — Order Command Center](#12-module-1--order-command-center)
13. [Module 2 — Critical Path & TNA](#13-module-2--critical-path--tna)
14. [Module 3 — Planner Dashboard](#14-module-3--planner-dashboard)
15. [Module 4 — Material Planning & Procurement](#15-module-4--material-planning--procurement)
16. [Module 5 — Capacity Planning & Line Allocation](#16-module-5--capacity-planning--line-allocation)
17. [Module 6 — Shipment Tracking](#17-module-6--shipment-tracking)
18. [Module 7 — Reporting & Administration Hub](#18-module-7--reporting--administration-hub)
19. [Cross-module read contracts](#19-cross-module-read-contracts)
20. [Reporting producer endpoints (`/reporting/*` read projections)](#20-reporting-producer-endpoints-reporting-read-projections)
21. [Reconciliation & admin queue APIs](#21-reconciliation--admin-queue-apis)
22. [Domain events & async integration](#22-domain-events--async-integration)
23. [Release manifest — API surface by train](#23-release-manifest--api-surface-by-train)
24. [Future clients & compatibility](#24-future-clients--compatibility)
25. [Module org settings & admin configuration APIs](#25-module-org-settings--admin-configuration-apis)
26. [API surface boundaries (public, internal, gateway)](#26-api-surface-boundaries-public-internal-gateway)

**Appendices**

- [Appendix A — API ownership matrix (summary)](#appendix-a--api-ownership-matrix-summary)
- [Appendix B — Namespace & route pattern index](#appendix-b--namespace--route-pattern-index)
- [Appendix C — Locked architecture references](#appendix-c--locked-architecture-references)
- [Appendix D — Document status](#appendix-d--document-status)
- [Appendix E — Cross-reference validation (locked baseline)](#appendix-e--cross-reference-validation-locked-baseline)

---

## 1. Specification principles

### Purpose

Define the non-negotiable rules governing all FactoryFlow HTTP APIs so every consumer (web UI, mobile, ERP gateway, internal workers) implements against one contract.

### Ownership

**Platform + cross-module architecture** — this section is normative for all modules; individual modules may not override these principles in their route catalogs.

### Scope

Contract principles only: SSOT write paths, engine bypass prohibition, idempotency expectations, and document hierarchy. Does not list routes.

### Dependencies

Locked PRD §2.7 (integration boundaries, Standard Engine Execution); Platform Addendum §1–2, §8, §13; Database Architecture §1 (data architecture principles).

### Release boundary

**All releases (V1, V1.1, V1.2)** — principles apply from first public API.

### References

| Topic | Source |
|---|---|
| SSOT & engine execution | PRD Locked §2.3, §2.4, §2.7 |
| API ownership matrix | Platform §8 |
| Error taxonomy | Platform §13 |
| Optimistic concurrency | Database Architecture §10.1 |

**Endpoint catalog:** Deferred — see §§12–21.

---

## 2. API architecture overview

### Purpose

Describe the logical API topology: how modules expose routes, how the platform gateway sits in front of ERP traffic, and how read vs write responsibilities split across producers.

### Ownership

**Platform architecture** — module teams implement routes under assigned namespaces per Platform §8.2.

### Scope

High-level diagrams and producer/consumer relationships. No path-level detail.

### Dependencies

Platform Addendum §1.3 (platform vs module ownership); Database Architecture §3 (domain boundaries), §4 (entity ownership).

### Release boundary

| Release | API topology |
|---|---|
| **V1** | Module 1 + Module 2 synchronous core; in-process events; no gateway |
| **V1.1** | Module 3–7 namespaces; platform gateway; cross-module read APIs |
| **V1.2** | Bulk/dashboard extensions; durable subscriptions; expanded IAM |

### References

| Topic | Source |
|---|---|
| Platform vs module ownership | Platform §1.3, §8 |
| Domain boundaries | Database Architecture §3 |
| Release trains | Platform §15 |

**Endpoint catalog:** Deferred — namespace index in Appendix B (placeholder).

---

## 3. Platform — authentication & session

### Purpose

Define how human users and service accounts authenticate, how sessions/tokens carry tenant and scope claims, and which endpoints require which credential type.

### Ownership

**Platform** — IAM service; modules consume validated claims only.

### Scope

Authentication flows, token claims (`organizationId`, `roles[]`, `factoryIds[]`, `sessionId`), human vs service account distinction. Login/logout/refresh routes only at structure level.

### Dependencies

Platform Addendum §2 (authentication model, session claims); Database Architecture §4.9 (`user`, `service_account`).

### Release boundary

| Release | Surface |
|---|---|
| **V1** | Human auth, Org Admin; single-org; no service accounts |
| **V1.1** | Service account tokens; factory-scoped human sessions |
| **V1.2** | Full IAM UI (deferred) |

### References

| Topic | Source |
|---|---|
| Session claims | Platform §2.3 |
| Service account binding | Platform §2.2, §5 |

**Endpoint catalog:** Deferred to Draft v2 §3.

---

## 4. Platform — RBAC & factory authorization

### Purpose

Define platform-layer permission gates applied before module handlers run: role checks, factory row-level scope, and evaluation order.

### Ownership

**Platform** — coarse role gates; module handlers enforce fine-grained UX rules from locked PRD.

### Scope

Org Admin / Production Manager / Planner platform matrix; factory assignment enforcement on portfolio and order-scoped routes; deny rules (tenant mismatch, factory mismatch).

### Dependencies

Platform Addendum §3 (RBAC), §4 (factory authorization); Database Architecture §14.2 (`user_factory_assignment`).

### Release boundary

| Release | Surface |
|---|---|
| **V1** | Fixed role enum; implicit Org Admin factory access |
| **V1.1** | `UserFactoryAssignment` enforced on cross-order reads |
| **V1.2** | Role builder / field-level permissions (deferred) |

### References

| Topic | Source |
|---|---|
| Role matrix | Platform §3.2 |
| Factory scope rules | Platform §4.3 |
| Module-specific RBAC detail | PRD Locked §2.6, §7.1 |

**Endpoint catalog:** Deferred to Draft v2 §4.

---

## 5. Platform — IAM & service accounts

### Purpose

Define APIs for provisioning and managing platform identity artifacts: users, factory assignments, service accounts, and credential lifecycle.

### Ownership

**Platform** — Org Admin only for mutations.

### Scope

CRUD for `UserFactoryAssignment`, `ServiceAccount`, credential rotation/revocation. Does not expose Module 2 org config or module settings (those remain module-owned).

### Dependencies

Platform Addendum §4.2, §5; Database Architecture §4.9, §2.1–2.2.

### Release boundary

| Release | Surface |
|---|---|
| **V1** | Minimal human user + Org Admin |
| **V1.1** | Service account registry + scoped roles (`tna:*`, `shipment:*`, `reporting:*`) |
| **V1.2** | Full IAM UI |

### References

| Topic | Source |
|---|---|
| Service account roles | Platform §5.2 |
| Credential lifecycle | Platform §5.4 |
| ERP role separation | Platform §5.3 |

**Endpoint catalog:** Deferred to Draft v2 §5 (`/platform/*` namespace).

---

## 6. Platform — tenancy, headers & correlation

### Purpose

Define mandatory request/response metadata: tenant isolation, `X-Request-Id`, `correlationId`, and idempotency keys for integration calls.

### Ownership

**Platform** — middleware applies to all routes; modules echo and persist per Database Architecture audit fields.

### Scope

Header conventions, claim-derived `organizationId` (never trust client body alone), correlation propagation across Confirm saga and ERP inbound.

### Dependencies

Platform Addendum §2.2, §12.2; Database Architecture §12.2 (`correlation_id` on append logs), §14 (multi-tenancy).

### Release boundary

**All releases** — tenant guard from V1; correlation headers fully normative from V1.1 integration train.

### References

| Topic | Source |
|---|---|
| Tenant isolation | PRD Locked §2.7; Platform §2.2 |
| Correlation IDs | Platform §12.2 |
| Saga correlation on allocation | Platform §11.6; Database Architecture Appendix A (`line_allocation`) |

**Endpoint catalog:** Deferred — cross-cutting; applied in §10.

---

## 7. Platform — integration gateway (inbound)

### Purpose

Define the single inbound boundary for ERP and external systems: authentication, routing, idempotency, and handler delegation to module services.

### Ownership

**Platform gateway** routes; **Modules 2, 4, 5, 6** execute business handlers; Module 2 engine is sole TNA writer.

### Scope

Typed inbound routes (`/integration/inbound/*`), required metadata (`sourceSystem`, `sourceEventId`), idempotency store interaction, discouraged generic TNA fallback.

### Dependencies

Platform Addendum §6; Database Architecture §2.2 (`integration_idempotency_record`), §4.5–4.7 (module write via M2 API).

### Release boundary

| Release | Surface |
|---|---|
| **V1** | None — no ERP gateway |
| **V1.1-F** | Material, capacity, shipment inbound routes; optional outbox |
| **V1.2+** | Webhook subscriptions (reserved) |

### References

| Topic | Source |
|---|---|
| Inbound routing table | Platform §6.3 |
| Idempotency record | Platform §6.4; Database Architecture §9 |
| Material ERP reconciliation | PRD Locked §4.6 |
| Capacity Confirm saga inbound | PRD Locked §5.6 |
| Shipment inbound | PRD Locked §6.6 |

**Endpoint catalog:** Deferred to Draft v2 §7.

---

## 8. Platform — integration gateway (outbound & ERP pickup)

### Purpose

Define outbound artifact delivery: KPI snapshot export, signed download URLs, and idempotent ERP pickup by `sourceSystem` + `sourceEventId`.

### Ownership

**Module 7** produces `ExportArtifact`; **Platform gateway** serves credentials; **`reporting:pickup`** service account reads only.

### Scope

Export listing, signed URL download, envelope fields (`exportSchemaVersion`, `sourceEventId`). No KPI recomputation at pickup time.

### Dependencies

Platform Addendum §6.5, §7; PRD Locked §7.5–7.6; Database Architecture §2.9 (`export_artifact`).

### Release boundary

| Release | Surface |
|---|---|
| **V1** | None |
| **V1.1-E/F** | Scheduled export job + pickup list/download |
| **V1.2+** | Webhook fan-out (reserved) |

### References

| Topic | Source |
|---|---|
| ERP export envelope | PRD Locked §7.5 (P0-4) |
| `reporting:export` / `reporting:pickup` roles | Platform §5.2 |
| Plant mapping | Platform §7.2 (`ErpIntegrationMapping`) |

**Endpoint catalog:** Deferred to Draft v2 §8.

---

## 9. Platform — feature flags & module activation

### Purpose

Define how org-level module enablement gates API availability (`403 MODULE_DISABLED`) without breaking read access to historical data.

### Ownership

**Platform** reads flags; **module settings entities** remain authoritative per module (Database Architecture §17.5).

### Scope

`module3Enabled` through `module7Enabled`, `integrationEnabled`, `maintenanceMode`; disable → read-only behavior.

### Dependencies

Platform Addendum §14; Database Architecture §2.6–2.9 (org settings tables), §4.8–4.9.

### Release boundary

| Release | Surface |
|---|---|
| **V1** | Core M1/M2 always on |
| **V1.1** | Per-module flags on M3–M7 and integration |
| **All** | `maintenanceMode` read-only org banner |

### References

| Topic | Source |
|---|---|
| Flag catalog | Platform §14.1 |
| Activation / backfill rules | Platform §14.2 |
| Module settings ownership | PRD Locked §4.3, §5.3, §6.3, §7.3 |

**Endpoint catalog:** Deferred to Draft v2 §9.

---

## 10. Common API patterns

### Purpose

Define shared contract mechanics reused across all modules: pagination, sorting, filtering, optimistic concurrency, date/timezone handling, and field naming (camelCase JSON).

### Ownership

**Platform** defines patterns; **module producers** implement within assigned namespaces.

### Scope

Cursor pagination defaults, `expectedVersion` / `409` flow, `factoryTimezone` calendar-date boundaries, factory scope query params, PII redaction flags on export.

### Dependencies

Platform Addendum §9 (pagination defaults); Database Architecture §10 (versioning), §16 (naming); PRD Locked §3.2 (timezone authority).

### Release boundary

| Pattern | Release |
|---|---|
| Optimistic concurrency (`version`) | V1 — `order`, `tna_item` |
| Extended concurrency fields | V1.1 — M4/M5/M6 entities |
| Cursor pagination on portfolio reads | V1.1 |
| Report run point-in-time boundary | V1.1 (`reportRunStartedAt`) |

### References

| Topic | Source |
|---|---|
| Concurrency | Platform §13.1 (`409`); Database Architecture §10.1 |
| `GET /orders` minimum projection | Platform §9.4 |
| Timezone | PRD Locked §2.6 (`factoryTimezone`); Platform §4.5 |
| JSON naming | Database Architecture §16 |

**Endpoint catalog:** N/A — patterns applied in module sections.

---

## 11. Error handling & HTTP semantics

### Purpose

Define standard HTTP status usage, error envelope shape, module-specific `errorCode` catalogs (by reference), and client retry guidance.

### Ownership

**Platform** defines envelope and taxonomy; **modules** emit business `errorCode` values from locked PRD workflows.

### Scope

400/403/404/409/422/429/500 mapping, `{ errorCode, message, correlationId, details }`, saga failure UX hooks, ERP duplicate inbound behavior.

### Dependencies

Platform Addendum §13; PRD Locked module workflow error cases (Confirm saga, shipment transitions, TNA validation).

### Release boundary

**All releases** — envelope stable from V1; module code catalogs grow with V1.1 modules.

### References

| Topic | Source |
|---|---|
| HTTP taxonomy | Platform §13.1 |
| Transaction rules | Platform §13.2 |
| Client 409 handling | Platform §13.3 |
| Error envelope | Platform §13.4 |

**Endpoint catalog:** Deferred — error code registry in Draft v2 appendix.

---

## 12. Module 1 — Order Command Center

### Purpose

Expose the order aggregate: header CRUD, manual lifecycle overrides, Overall Progress, Quick Notes, Documents, KPI cache read, and timeline read — the home base for all order-scoped workflows.

### Ownership

**Module 1** — all `/orders/*` routes except TNA sub-resources delegated to Module 2 (Platform §8.2).

### Scope

Order create/read/update; On Hold / Cancelled / Closed; `production_progress`; `quick_note`; `order_attachment`; KPI cache fields on read; `PATCH assignedProductionLineId` (orchestrated by M5). Does not mutate TNA state or KPI cache directly from client.

### Dependencies

PRD Locked Module 1; Database Architecture §4.1, §12 (`timeline_event` store); Platform §9.4 (`GET /orders` projection).

### Release boundary

| Release | Surface |
|---|---|
| **V1** | Full Order Command Center API |
| **V1.1** | `assignedProductionLineId` PATCH (M5 orchestration); cross-order `GET /orders` for M3/M7 |
| **V1.2** | CSV import (deferred) |

### References

| Topic | Source |
|---|---|
| Order entities | PRD Locked Module 1; Database Architecture §2.3 |
| KPI cache write authority | PRD Locked §2.7; Database Architecture §4.1 |
| Dual progress boundary | PRD Locked §2.7 |
| Producer: timeline activity | Platform §9.2; PRD Locked §7.6 |

**Endpoint catalog:** Deferred to Draft v2 §12.

---

## 13. Module 2 — Critical Path & TNA

### Purpose

Expose the sole write path for TNA instance state, Standard Engine Execution, chase actions, planning confirm/revert, and org TNA configuration — the planning SSOT API.

### Ownership

**Module 2** — `/orders/{id}/tna-items/*` and org TNA config routes; engine is mandatory for all TNA mutations.

### Scope

TNA item read/write; bulk date confirm; chase; material/SLA transition APIs (called by M4/M5/gateway); org gate library, templates, runtime settings (Org Admin). No parallel milestone store.

### Dependencies

PRD Locked §2.1–2.8; Database Architecture §4.2, §2.4; Platform §8.1 (ERP → gateway → M2).

### Release boundary

| Release | Surface |
|---|---|
| **V1** | Full embedded TNA + org config |
| **V1.1** | Material/SLA transition endpoints for M4/M5/gateway |
| **V1.2** | Bulk dashboard orchestration (N × saves) |

### References

| Topic | Source |
|---|---|
| Engine execution | PRD Locked §2.3, §2.4 |
| TNA org config | PRD Locked §2.6 |
| Optimistic concurrency | Database Architecture §10.1 (`tna_item.version`) |
| Producer: tna-revisions, exf-projections | Platform §9.2; PRD Locked §7.6 |

**Endpoint catalog:** Deferred to Draft v2 §13.

---

## 14. Module 3 — Planner Dashboard

### Purpose

Expose cross-order portfolio reads, dashboard bootstrap, widget projections, saved views, session/meeting queue — configuration and read orchestration only, no planning SSOT writes.

### Ownership

**Module 3** — `/dashboard/*`; all TNA mutations delegate to Module 2 APIs.

### Scope

`GET /dashboard/bootstrap`; per-widget refresh; saved view CRUD; session snapshot; deep-link query param contracts (`meetingQueue`, `tnaItem`, `group`). Reads `GET /orders`, `GET /orders/{id}/tna-items`, and V1.1 module read APIs.

### Dependencies

PRD Locked §3.1–3.8; Platform §9.2; Database Architecture §4.4, §2.5.

### Release boundary

| Release | Surface |
|---|---|
| **V1** | Not shipped — Workflow 4.1 order list fallback |
| **V1.1-A** | Core dashboard §3.1–3.7 |
| **V1.1-G** | Optional widgets §3.8 (requires M4/M5/M6 read APIs) |
| **V1.2** | Bulk operations §3.8 |

### References

| Topic | Source |
|---|---|
| Widget query logic | PRD Locked §3.3 |
| Bootstrap contract | PRD Locked §3.2 |
| Index requirements | PRD Locked §3.6; Database Architecture §13.2 |
| Bulk chase | PRD Locked §3.6 → M2 chase API |

**Endpoint catalog:** Deferred to Draft v2 §14.

---

## 15. Module 4 — Material Planning & Procurement

### Purpose

Expose material requirements, PO lines, receipt workflows, and material portfolio reads — all gate state changes route through Module 2 material transition API.

### Ownership

**Module 4** — `/material/*`; **Module 2** owns TNA material gate fields.

### Scope

Requirements CRUD; PO line CRUD; receipt workspace; `GET /material/po-lines`; reconciliation queue read/resolution; dual-path read-only TNA qty when Module 4 active.

### Dependencies

PRD Locked §4.1–4.8; Database Architecture §4.5, §17.4 (reconciliation); Platform §6.3 (inbound material).

### Release boundary

| Release | Surface |
|---|---|
| **V1** | Not shipped — manual TNA material path |
| **V1.1-B** | Full Module 4 API + gateway material inbound |
| **V1.2+** | ERP inbound sync maturity; PO header entity (reserved) |

### References

| Topic | Source |
|---|---|
| Material transition API | PRD Locked §4.6 |
| PO line identity | Database Architecture §9.2 |
| Ownership matrix | PRD Locked §4.2 |
| Read projection | Platform §9.5 |

**Endpoint catalog:** Deferred to Draft v2 §15.

---

## 16. Module 5 — Capacity Planning & Line Allocation

### Purpose

Expose line registry, capacity profiles, allocation CRUD, Confirm saga orchestration, load/engine read APIs — SLA completion only via Module 2 after saga success.

### Ownership

**Module 5** — `/capacity/*`; **Module 1** owns `assignedProductionLineId` field (PATCH via M1 API); **Module 2** owns SLA gate state.

### Scope

Line admin; allocation Draft/ConfirmPending/Confirmed/Archived; Confirm saga (`correlationId` persisted first); load preview; reconciliation queue; `GET /capacity/lines`.

### Dependencies

PRD Locked §5.1–5.8; Platform §11.6 (Confirm saga); Database Architecture §4.6, Appendix A (`line_allocation`).

### Release boundary

| Release | Surface |
|---|---|
| **V1** | Not shipped — manual SLA on TNA |
| **V1.1-C** | Full Module 5 + gateway capacity inbound |
| **V1.2+** | Multi-line split allocation (reserved) |

### References

| Topic | Source |
|---|---|
| Confirm saga sequence | PRD Locked §5.4–5.5 |
| Partial unique allocations | Database Architecture §9.1 |
| M1 PATCH contract | PRD Locked §5.3 |
| Gateway inbound | Platform §6.3 |

**Endpoint catalog:** Deferred to Draft v2 §16.

---

## 17. Module 6 — Shipment Tracking

### Purpose

Expose post-EXF shipment registry, status transitions, document links, portfolio reads, and activation handler triggers — logistics SSOT separate from EXF on TNA.

### Ownership

**Module 6** — `/shipments/*`; **Module 2** owns EXF gate; **Module 1** owns attachment files (M6 links only).

### Scope

ShipmentRecord CRUD; status engine transitions; `GET /shipments/portfolio`; post-commit activation on `OrderExFactoryCompleted`; reconciliation queue; break-glass sync banners.

### Dependencies

PRD Locked §6.1–6.8; Database Architecture §4.7; Platform §10.4 (post-commit async).

### Release boundary

| Release | Surface |
|---|---|
| **V1** | Not shipped — EXF on TNA only |
| **V1.1-D** | Full Module 6 + event handler + gateway inbound |
| **V1.2+** | Partial/multi-shipment (reserved) |

### References

| Topic | Source |
|---|---|
| Status transition matrix | PRD Locked §6.3 (P0-4) |
| Summary vs Delivered | PRD Locked §6.2, §7.2 |
| Idempotency on activation | Database Architecture §9 |
| Shipped-untracked rule | PRD Locked §6.2 |

**Endpoint catalog:** Deferred to Draft v2 §17.

---

## 18. Module 7 — Reporting & Administration Hub

### Purpose

Expose report catalog, async report runs, export jobs/artifacts, ERP schedule, and administration hub navigation — read orchestration across producer APIs; writes limited to Module 7 entities.

### Ownership

**Module 7** — `/reporting/*` for runs, exports, catalog, settings; **does not** own producer read projections (see §20).

### Scope

`POST /reporting/runs`; poll run status; export download; admin hub deep-links to module settings (link only, no inline PATCH of M2 settings); PII redaction on all export formats.

### Dependencies

PRD Locked §7.1–7.8; Platform §9.3; Database Architecture §4.8.

### Release boundary

| Release | Surface |
|---|---|
| **V1** | Not shipped |
| **V1.1-E** | Report catalog, async runs, ad-hoc export |
| **V1.1-F** | ERP scheduled snapshot + pickup (with gateway) |
| **V1.2+** | Trend warehouse reports (reserved) |

### References

| Topic | Source |
|---|---|
| Report types & engine | PRD Locked §7.5 |
| Async run contract | PRD Locked §7.4 (P0-3) |
| No KPI duplicate store | PRD Locked §7.2 |
| Handoff from M3 | PRD Locked §7.4 (P1-5) |

**Endpoint catalog:** Deferred to Draft v2 §18.

---

## 19. Cross-module read contracts

### Purpose

Document producer-owned read APIs consumed by Module 3, Module 7, and module panels — minimum projections, pagination, and factory scope without redefining business rules.

### Ownership

**Per producer module** (see Platform §9.2); **Platform** maintains the ownership table as normative.

### Scope

`GET /orders`, `GET /orders/{id}`, `GET /orders/{id}/tna-items`, module portfolio reads, pagination caps, factory filter requirements. Consumer modules must not bypass producers to query SSOT stores directly from the client.

### Dependencies

Platform Addendum §9; Database Architecture §13 (index support for queries).

### Release boundary

| Release | Surface |
|---|---|
| **V1** | Per-order reads only |
| **V1.1** | Full cross-module read table (Platform §9.2) |
| **V1.2** | Event-informed cache invalidation (deferred) |

### References

| Topic | Source |
|---|---|
| Read contract table | Platform §9.2 |
| Minimum order projection | Platform §9.4 |
| Minimum material projection | Platform §9.5 |
| M7 orchestration rule | Platform §9.3 |

**Endpoint catalog:** Deferred to Draft v2 §19 (extends Platform §9.2 with full schemas).

---

## 20. Reporting producer endpoints (`/reporting/*` read projections)

### Purpose

Isolate cross-order **producer** routes under `/reporting/*` that are owned by Modules 1 and 2 but consumed by Module 7 — distinct from Module 7 orchestration routes in §18.

### Ownership

| Route prefix | Producer |
|---|---|
| `/reporting/timeline-activity` | **Module 1** |
| `/reporting/tna-revisions` | **Module 2** |
| `/reporting/exf-projections` | **Module 2** |

Module 7 orchestrates; producers serve paginated read projections only.

### Scope

Path authority split (Platform §8.2, §9.2 footnote); pagination max per report run; no SSOT writes under these paths.

### Dependencies

PRD Locked §7.6 (P0-1); Platform §8.2, §9.2; Database Architecture §12 (`timeline_event`, `tna_item_date_revision`).

### Release boundary

**V1.1-E** — required for GATE_SLIPPAGE, EXF_PERFORMANCE, PLANNER_ACTIVITY report types.

### References

| Topic | Source |
|---|---|
| Path authority | Platform §9.2 footnote; PRD Locked §7.6 |
| Report type → producer map | PRD Locked §7.5 |
| Namespace rule | Platform §8.2 |

### Routing precedence under `/reporting/*`

Module 7 and Modules 1/2 share the `/reporting/*` prefix (Platform §8.2). The following rules apply at the **routing layer** — before endpoint catalogs are populated:

| Rule | Detail |
|---|---|
| **Static path registry** | Producer paths (`timeline-activity`, `tna-revisions`, `exf-projections`) are **fixed static segments** registered on the **producer module service** (M1 or M2) — not parameterized catch-alls |
| **Longest-prefix wins** | Routers MUST match static producer paths before any Module 7 parameterized routes (e.g. `/reporting/runs/{id}`) to prevent shadowing |
| **M7 registration prohibition** | Module 7 MUST NOT register handlers for producer static paths — orchestration routes only (`runs`, `exports`, `definitions`, `bootstrap`, `settings`) |
| **Write prohibition** | No SSOT write verbs under any `/reporting/*` path — producers are read-only projections (Platform §8.2 rule) |
| **Service ownership** | Producer implementations deploy with Module 1 / Module 2 codebases; Module 7 consumes via internal or edge-routed HTTP — never re-implements producer logic |

**Endpoint catalog:** Deferred — producer and orchestration paths listed in Appendix B.

---

## 21. Reconciliation & admin queue APIs

### Purpose

Expose module reconciliation queues and resolution actions for ERP drift, saga failures, and break-glass bypass — unified admin view optional, module workflows own resolution.

### Ownership

**Modules 4, 5, 6** — respective `/material/reconciliation`, `/capacity/reconciliation`, `/shipments/reconciliation` (or equivalent); **Platform** defines shared queue shape.

### Scope

List open items (platform base fields + module `reason` enum); order-scoped banners; resolution mutations; `SAGA_INCOMPLETE` worker surfacing. Does not auto-repair silently except idempotent ERP replay via gateway.

### Dependencies

Platform Addendum §11; Database Architecture §17.4; PRD Locked M4 §4.6, M5 §5.3, M6 §6.3.

### Release boundary

**V1.1-B/C/D** — queues ship with respective modules; **V1.1-F** — ERP orphan triggers intensify queue usage.

### References

| Topic | Source |
|---|---|
| Platform reason codes | Platform §11.2 |
| Shared entity shape | Platform §11.3; Database Architecture §17.4 |
| Confirm saga queue | Platform §11.6 |
| UX pattern | Platform §11.4 |

**Endpoint catalog:** Deferred to Draft v2 §21.

---

## 22. Domain events & async integration

### Purpose

Document how in-process domain events (V1), post-commit handlers (V1.1), and outbox delivery (V1.1-F) relate to API behavior — not a public REST surface for all events, but contract-relevant for integrators.

### Ownership

**Platform** — outbox infrastructure; **Module 2** — domain event envelope; **Module 6** — post-commit activation handler.

### Scope

Event envelope fields (`eventId`, `correlationId`, `schemaVersion`); in-process vs post-commit vs outbox modes; idempotency on consumers; ordering per order.

### Dependencies

Platform Addendum §10; PRD Locked §2.7; Database Architecture §2.2 (`outbox_event`).

### Release boundary

| Mode | Release |
|---|---|
| In-process synchronous handlers | V1 |
| Post-commit async (M6 activation) | V1.1-D |
| Outbox worker + external ERP | V1.1-F |
| Durable subscriptions | V1.2 |

### References

| Topic | Source |
|---|---|
| Event envelope | PRD Locked §2.7; Platform §10.1 |
| Handler execution modes | Platform §10.4 |
| Outbox entity | Platform §10.5; Database Architecture §2.2 |
| Emission ordering | Platform §10.6 |

**Endpoint catalog:** Internal/event contracts deferred to Draft v2 §22; public webhook API reserved V1.2+.

---

## 23. Release manifest — API surface by train

### Purpose

Single view of which API namespaces ship in V1, V1.1 trains (A–G), and V1.2 — aligned with Platform release manifest without redefining business rules.

### Ownership

**Platform** — release planning; **module sections** (§§12–18) are authoritative for route detail when populated.

### Scope

Train-to-namespace matrix; platform dependencies per train; compatibility rule (V1.1 off → V1 behavior preserved).

### Dependencies

Platform Addendum §15; PRD Locked §2.8 (V1 deferrals); Database Architecture project status.

### Release boundary

This section **is** the release boundary index for the entire spec.

### References

| Topic | Source |
|---|---|
| V1 / V1.1 / V1.2 manifest | Platform §15.2–15.4 |
| Compatibility rule | Platform §15.5 |
| Module V1 limitations | PRD Locked §2.8, M4 §4.7, M5 §5.7, M6 §6.7, M7 §7.7 |

**Endpoint catalog:** Per-train route lists deferred to Draft v2 §23 tables.

---

## 24. Future clients & compatibility

### Purpose

Define how mobile clients, ERP connectors, and third-party integrations MUST consume the same contract: versioning, feature detection, read-only mobile constraints, and deprecation policy.

### Ownership

**Platform** — compatibility policy; **all modules** — backward-compatible field additions only within a major API version.

### Scope

API version header strategy (placeholder); mobile read-only TNA constraint (PRD §2.5); ERP idempotency requirements; OpenAPI generation target (deferred).

### Dependencies

PRD Locked §2.5 (mobile read-only); Platform §15.5; Database Architecture §18 (reserved fields).

### Release boundary

| Client | Release |
|---|---|
| Web (primary) | V1+ |
| ERP gateway | V1.1-F+ |
| Mobile read-only | V1+ (TNA edit deferred) |
| Mobile editing | V1.2+ (deferred) |

### References

| Topic | Source |
|---|---|
| Mobile/tablet V1 | PRD Locked §2.5 |
| Service account separation | Platform §5.3 |
| Reserved schema | PRD Locked §2.8; Database Architecture §18 |

**Endpoint catalog:** N/A — policy section.

---

## 25. Module org settings & admin configuration APIs

### Purpose

Define the cross-cutting pattern for **org-level configuration APIs** — each module owns its settings entity; Module 7 Administration Hub provides **navigation links only** (no duplicate config store or cross-module inline PATCH).

### Ownership

| Settings domain | Owner module | Route prefix (convention) | Settings entity (Database Architecture) |
|---|---|---|---|
| Orders & Styles (size scales, stage weights) | **Module 1** | `/orders/settings/*` | `size_scale`, `production_stage_weight` |
| Critical Path & TNA (gate library, templates, runtime) | **Module 2** | `/orders/tna-settings/*` | `organization_tna_settings`, `tna_*` config tables |
| Material Planning | **Module 4** | `/material/settings/*` | `organization_material_settings` |
| Capacity Planning | **Module 5** | `/capacity/settings/*` | `organization_capacity_settings` |
| Shipment Tracking | **Module 6** | `/shipments/settings/*` | `organization_shipment_settings` |
| Reporting | **Module 7** | `/reporting/settings/*` | `organization_reporting_settings` |
| Platform (integration master switch, maintenance) | **Platform** | `/platform/settings/*` | `organization_platform_settings` |

**Administration Hub (Module 7):** `GET` navigation metadata and deep-links to the owning module settings routes above — **link only** per locked PRD §7.2 / §7.4 (P1-11).

### Scope

Org Admin–gated mutations for configuration entities; planners cannot access config screens in V1 unless granted Org Admin (PRD Locked §2.6). Settings APIs do **not** trigger Standard Engine Execution on save — engine reads runtime settings on next planner save (PRD Locked §2.6). Factory master data (`factory`) remains Module 1–owned — not duplicated under platform settings.

### Dependencies

PRD Locked §2.6 (M2 org config); PRD Locked §7.4 (admin hub); Database Architecture §17.5 (settings aggregates per module); Platform §8.1 (write ownership).

### Release boundary

| Release | Surface |
|---|---|
| **V1** | M2 `/orders/tna-settings/*` (full §2.6 config); M1 `/orders/settings/*` (size scales, stage weights) |
| **V1.1** | M4–M7 module settings routes when respective modules ship |
| **V1.1** | M7 admin hub link metadata (with Module 7 train E) |
| **All** | `/platform/settings/*` when platform settings entity ships (V1.1) |

### References

| Topic | Source |
|---|---|
| M2 org configuration | PRD Locked §2.6 |
| Module settings entities | PRD Locked §4.3, §5.3, §6.3, §7.3; Database Architecture §2.6–2.9 |
| Admin hub — links not forks | PRD Locked §7.2, §7.4 |
| Org Admin audience | PRD Locked §2.6 |

**Endpoint catalog:** Deferred — settings CRUD routes per module in Draft v2+ endpoint phase.

---

## 26. API surface boundaries (public, internal, gateway)

### Purpose

Separate three distinct HTTP surfaces so clients, module services, and ERP integrators implement against the correct authentication boundary — preventing browser access to internal transition handlers and preventing modules from bypassing the integration gateway.

### Ownership

**Platform** defines boundaries; **modules** register routes on the correct surface only.

### Scope

Three surfaces — no endpoint catalogs in this section:

| Surface | Callers | Authentication | Examples (structural) |
|---|---|---|---|
| **Public (planner / UI)** | Web app, future mobile (read-only V1) | Human JWT — `organizationId`, `roles[]`, `factoryIds[]` (Platform §2.3) | `/orders/*`, `/orders/{id}/tna-items/*`, `/dashboard/*`, module workspace routes |
| **Internal (module-to-module)** | FactoryFlow services only — not browser-callable | Service identity or mTLS/internal network policy; same `organizationId` tenant guard | M4 → M2 material transition; M5 Confirm saga → M2 TNA save + M1 `PATCH /orders/{id}`; M4 ERP reconciliation worker → M2; post-commit M6 activation handler |
| **Gateway (ERP / external)** | ERP connectors, scoped service accounts | Service account token + Platform gateway — `sourceSystem`, `sourceEventId` (Platform §6) | `/integration/inbound/*`; M7 `reporting:pickup` export list/download |

**Rules:**

| Rule | Detail |
|---|---|
| **No browser on internal** | Internal transition endpoints MUST NOT be exposed on the public edge router or CORS-allowed to browser origins |
| **No client on gateway-only** | ERP inbound routes accept service accounts only — not planner JWT |
| **M2 sole TNA writer** | Internal and gateway paths that mutate TNA state MUST invoke Module 2 Standard Engine Execution — never direct persistence bypass (PRD Locked §2.7) |
| **Gateway routing** | ERP traffic enters only via `/integration/*` — modules do not expose parallel public ERP endpoints (Platform §6) |
| **M5 Confirm saga** | Orchestration sequence (M2 SLA save → M1 PATCH) is **internal**; public UI calls Module 5 routes that trigger internal orchestration (PRD Locked §5.4–5.5) |

### Dependencies

Platform Addendum §2, §5–§6, §11.6; PRD Locked §2.7, §4.6, §5.6, §6.6; Database Architecture §3 (domain boundaries), §4 (write authority).

### Release boundary

| Surface | Release |
|---|---|
| **Public** | V1 (M1/M2); V1.1 (M3–M7) |
| **Internal** | V1 (engine in-process); V1.1 (M4/M5/M6 orchestration) |
| **Gateway** | V1.1-F (optional ERP) |

### References

| Topic | Source |
|---|---|
| Integration gateway | Platform §6 |
| Service account roles | Platform §5.2 |
| Write path rule | PRD Locked §2.7 |
| Confirm saga | Platform §11.6; PRD Locked §5.5 |
| Engine bypass prohibited | Platform §2.2; PRD Locked §2.7 |

**Endpoint catalog:** Internal route inventory deferred — classified per module in Draft v2+ endpoint phase.

---

## Appendix A — API ownership matrix (summary)

### Purpose

Provide a single-page summary of write and read ownership across namespaces — populated from Platform §8–9; detailed routes deferred.

### Ownership

**Platform architecture** — summary only; authoritative detail in §§12–20 when endpoint catalogs are written.

### Scope

Namespace → owner module matrix; gateway vs module handler split. **Endpoint detail deferred post-lock.**

### Dependencies

Platform Addendum §8.1, §8.2, §9.2.

### Release boundary

Updated as trains ship (§23).

### References

Platform §8, §9; Database Architecture §4 (entity ownership).

**Endpoint catalog:** Deferred post-lock — populate from Appendix B when schemas are written.

---

## Appendix B — Namespace & route pattern index

### Purpose

Master index of route prefixes **and locked route patterns** from PRD / Platform — owning module, spec section, and release train. Supports parallel implementation without duplicate routes. **Not** a full endpoint catalog (methods, schemas deferred).

### Ownership

**This document** — maintained alongside module endpoint catalogs.

### Scope

Prefix table + route pattern table indexed from locked architecture. Schemas and HTTP method matrices deferred.

### Dependencies

Platform §8.2, §9.2; PRD Locked §3.7, §5.6, §6.6, §7.6; §25 settings convention.

### Release boundary

Grows with each V1.1 train (§23).

### References

Platform §8.2, §9.2; PRD module integration sections.

### B.1 Namespace prefixes

| Prefix | Owner | Spec section | Release |
|---|---|---|---|
| `/orders/*` | Module 1 | §12 | V1 |
| `/orders/settings/*` | Module 1 | §25 | V1 |
| `/orders/tna-settings/*` | Module 2 | §25 | V1 |
| `/orders/{id}/tna-items/*` | Module 2 | §13 | V1 |
| `/dashboard/*` | Module 3 | §14 | V1.1-A |
| `/material/*` | Module 4 | §15 | V1.1-B |
| `/material/settings/*` | Module 4 | §25 | V1.1-B |
| `/capacity/*` | Module 5 | §16 | V1.1-C |
| `/capacity/settings/*` | Module 5 | §25 | V1.1-C |
| `/shipments/*` | Module 6 | §17 | V1.1-D |
| `/shipments/settings/*` | Module 6 | §25 | V1.1-D |
| `/reporting/*` (orchestration — M7) | Module 7 | §18, §20 | V1.1-E |
| `/reporting/timeline-activity` | Module 1 (producer) | §20 | V1.1-E |
| `/reporting/tna-revisions` | Module 2 (producer) | §20 | V1.1-E |
| `/reporting/exf-projections` | Module 2 (producer) | §20 | V1.1-E |
| `/reporting/settings/*` | Module 7 | §25 | V1.1-E |
| `/integration/*` | Platform (gateway) | §7–§8, §26 | V1.1-F |
| `/platform/*` | Platform | §5, §25 | V1.1 |

### B.2 Locked route patterns (from PRD / Platform — structural index)

| Route pattern | Owner | Surface | Spec | Release |
|---|---|---|---|---|
| `GET /orders` | M1 | Public | §12, §19 | V1.1 (cross-order); per-order list per §12 |
| `GET /orders/{id}` | M1 | Public | §12, §19 | V1 |
| `PATCH /orders/{id}` | M1 | Public / Internal (M5 saga) | §12, §16, §26 | V1.1 (assigned line) |
| `GET /orders/{id}/timeline` | M1 | Public | §12, §19 | V1 |
| `GET /orders/{id}/tna-items` | M2 | Public | §13, §19 | V1 |
| `POST /orders/{orderId}/tna-items/{tnaItemUuid}/chase` | M2 | Public | §13, §14 | V1.1 |
| `GET /dashboard/bootstrap` | M3 | Public | §14 | V1.1-A |
| `GET /dashboard/widgets/{type}` | M3 | Public | §14 | V1.1-A |
| `GET /dashboard/saved-views` | M3 | Public | §14 | V1.1-A |
| `GET /material/po-lines` | M4 | Public | §15, §19 | V1.1-B |
| `GET /material/reconciliation` | M4 | Public | §21 | V1.1-B |
| `GET /capacity/bootstrap` | M5 | Public | §16 | V1.1-C |
| `GET /capacity/lines` | M5 | Public | §16, §19 | V1.1-C |
| `GET /capacity/orders/{orderId}/allocation` | M5 | Public | §16 | V1.1-C |
| `GET /capacity/reconciliation` | M5 | Public | §21 | V1.1-C |
| `GET /shipments/bootstrap` | M6 | Public | §17 | V1.1-D |
| `GET /shipments/portfolio` | M6 | Public | §17, §19 | V1.1-D |
| `GET /shipments/orders/{orderId}` | M6 | Public | §17 | V1.1-D |
| `GET /shipments/reconciliation` | M6 | Public | §21 | V1.1-D |
| `GET /reporting/bootstrap` | M7 | Public | §18 | V1.1-E |
| `GET /reporting/definitions` | M7 | Public | §18 | V1.1-E |
| `POST /reporting/runs` | M7 | Public | §18 | V1.1-E |
| `GET /reporting/runs/{id}` | M7 | Public | §18 | V1.1-E |
| `GET /reporting/runs/{id}/download` | M7 | Public | §18 | V1.1-E |
| `GET /reporting/exports` | M7 | Gateway (`reporting:pickup`) | §8, §18 | V1.1-F |
| `GET /reporting/exports/{id}/download` | M7 | Gateway (`reporting:pickup`) | §8, §18 | V1.1-F |
| `GET /reporting/timeline-activity` | M1 | Public (M7 consumer) | §20 | V1.1-E |
| `GET /reporting/tna-revisions` | M2 | Public (M7 consumer) | §20 | V1.1-E |
| `GET /reporting/exf-projections` | M2 | Public (M7 consumer) | §20 | V1.1-E |
| `POST /integration/inbound/material-receipt` | Platform → M4 | Gateway | §7, §26 | V1.1-F |
| `POST /integration/inbound/material-po` | Platform → M4 | Gateway | §7 | V1.1-F |
| `POST /integration/inbound/capacity-allocation` | Platform → M5 | Gateway | §7, §26 | V1.1-F |
| `POST /integration/inbound/shipment-status` | Platform → M6 | Gateway | §7 | V1.1-F |
| `POST /integration/inbound/tna-transition` | Platform → M2 | Gateway (discouraged) | §7 | V1.1-F |
| M2 material transition (internal) | M2 | Internal | §15, §26 | V1.1-B |
| M2 SLA transition (internal) | M2 | Internal | §16, §26 | V1.1-C |
| M5 Confirm saga orchestration (internal) | M5 | Internal | §16, §26 | V1.1-C |

**Endpoint catalog:** HTTP methods, request/response bodies, and error codes deferred to module endpoint phase.

---

## Appendix C — Locked architecture references

| Topic | Document | Location |
|---|---|---|
| Module business rules & workflows | PRD-MVP.md | Locked Modules 1–7 |
| Auth, RBAC, gateway, read ownership | Platform Architecture Addendum | §2–§9, §11–§15 |
| Entities, concurrency, indexes | Database Architecture Spec | §2–§4, §9–§13, §17 |
| Standard Engine Execution | PRD-MVP.md | Locked §2.4 |
| Integration boundaries | PRD-MVP.md | Locked §2.7 |
| Module integration sections | PRD-MVP.md | M3 §3.7, M4 §4.6, M5 §5.6, M6 §6.6, M7 §7.6 |

---

## Appendix E — Cross-reference validation (locked baseline)

Final validation performed against locked PRD Modules 1–7, locked Platform Architecture Addendum, and locked Database Architecture Specification prior to lock.

| Check | Result |
|---|---|
| **API ownership** | Pass — §§12–18, §25, Appendix B align Platform §8.1–8.2 |
| **Namespace consistency** | Pass — Appendix B.1–B.2 match Platform §8.2 and locked PRD route patterns |
| **REST routing** | Pass — §20 precedence rules; Appendix B.2 order-nested routes |
| **Internal / public / gateway boundaries** | Pass — §26 aligns Platform §2, §5–§6, §11.6 |
| **Module ownership** | Pass — SSOT write paths match PRD §2.7 and Database Architecture §4 |
| **Release boundaries** | Pass — §23 aligned with Platform §15 trains (V1 / V1.1-A–G / V1.2) |
| **ERP integration alignment** | Pass — §7–§8, §26, Appendix B.2 inbound routes match Platform §6–§7 |
| **Cross-module consistency** | Pass — §19–§20 producer/consumer split; §25 admin hub links-not-forks (PRD §7.2) |
| **Duplicated business rules** | Pass — spec defers semantics to locked PRD; structure only |
| **Terminology consistency** | Pass — namespaces, camelCase JSON, module codes match locked sources |

**New P0 issues at lock:** None identified.

---

## Appendix D — Document status

**Locked — Draft v1 (structure).** Validated against all locked baseline documents (see Appendix E). Endpoint catalogs, request/response schemas, and OpenAPI artifacts are deferred to a post-lock amendment. Does not modify any locked document. Structural amendments require explicit approval and version bump.
