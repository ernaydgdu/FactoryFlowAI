# Kepler ERP — Foundation Principles

> **Status:** Locked — Constitutional v1  
> **Authority:** This document overrides all future code, UI, AI, and integration decisions unless explicitly revised by product architecture review.  
> **Canonical reference:** [`docs/architecture/FOUNDATION.md`](architecture/FOUNDATION.md) — Architecture Bible Volume 1  
> **Scope:** Entire Kepler ERP platform — frontend domain, backend, Kepler Brain, integrations  
> **Audience:** Engineers, product, AI agents, reviewers

---

## Preamble

Kepler ERP is a **textile-specific production ERP** for contract manufacturers (fason tekstil). It is not a generic ERP adapted for apparel. Every architectural decision must serve real textile operations: merchandising, MRP, top-roll fabric, cutting, sewing, washing, quality, packaging, container planning, and EXF-driven delivery.

This document is **Kepler ERP's constitution**. When in doubt, these principles win.

---

## Principle 1 — Textile-Only Domain

Kepler ERP is built exclusively for the textile and apparel manufacturing industry.

| Allowed | Forbidden |
|---|---|
| Merchandising, sample approval, EXF, pastal, top-roll fabric, AQL, container plans | Generic manufacturing patterns copied without textile semantics |
| Fason (subcontract) workshop flows, lot-based washing, color/size matrix | "One size fits all" ERP modules with no textile vocabulary |

**Rule:** If a feature cannot be explained using textile industry language, it does not belong in Kepler ERP.

---

## Principle 2 — Business Rules Live in Domain

All business rules MUST reside in the **Domain layer**. UI is a thin consumer.

```
UI / Screen  →  calls  →  Domain Service  →  enforces rule
                ✗           never the reverse
```

| Layer | Responsibility |
|---|---|
| **Domain** | Business Rule Engine, validations, calculations, workflows |
| **UI** | Display, input capture, navigation — no business logic |

**Rule:** No `if (stock < min) { block }` in React components. Use `business-rule-engine`, `stock-ledger`, or equivalent domain services.

**Current implementation:** `frontend/src/domain/services/business-rule-engine.ts`

---

## Principle 3 — Stock Ledger Is the Single Source of Stock Truth

Stock is **never** updated directly. Every quantity change creates a **Stock Movement** entry.

```
Direct balance mutation     ✗  FORBIDDEN
recordMovement() → Ledger     ✓  REQUIRED
```

Supported movement types include: `RECEIPT`, `TRANSFER_OUT`, `TRANSFER_IN`, `RESERVATION`, `CONSUMPTION`, `WASTE`, `PRODUCTION_OUTPUT`, `SHIPMENT`.

**Rule:** `onHand`, `reserved`, and `available` are derived from movements — not edited in place.

**Current implementation:** `frontend/src/domain/services/stock-ledger.ts`, `frontend/src/domain/services/business-rule-engine.ts`

---

## Principle 4 — Master Data Is the Single Source of Reference Truth

Master Data is the **only** authority for reference entities: customers, brands, warehouses, workshops, colors, sizes, suppliers, incoterms, operations, etc.

| Allowed | Forbidden |
|---|---|
| `masterData.customer.getByCode('LCW')` | Hard-coded `'LC Waikiki'` in components or services |
| `colorCardRepository.getById(id)` | Inline color name arrays in UI |
| `sizeSetRepository`, `warehouseRepository` | Magic strings for depot or workshop names |

**Rule:** If a value appears in a dropdown, label, or calculation, it must resolve from Master Data or a domain entity keyed by Master Data ID.

**Current implementation:** `frontend/src/domain/master-data/`

---

## Principle 5 — Planning Engine Is Independent from Business Rules

The **Planning Engine** calculates feasibility, risk, capacity, and consolidated MRP. It does **not** mutate operational state.

```
Business Rule Engine  →  executes  →  orders, stock, PO, production state
Planning Engine       →  calculates →  termin, risk, capacity, MRP, cost projections
```

| Engine | Question it answers |
|---|---|
| Business Rules | "What happens when PO is received?" |
| Planning | "Will this order meet EXF given current capacity and material delays?" |

**Rule:** Planning services are read-only with respect to stock and order state. They may recommend; Business Rules execute.

**Current implementation:** `frontend/src/domain/services/planning-engine.ts`, `frontend/src/domain/services/planning/`

---

## Principle 6 — AI Advises; Humans Decide

AI **never** replaces Business Rules or auto-executes operational decisions.

| AI may | AI may not |
|---|---|
| Explain risk, suggest capacity split, simulate supplier change | Auto-approve BOM, auto-create PO, override stock |
| Surface timeline and KPI insights | Commit ledger movements without user action |

**Rule:** Every AI output is a **recommendation**. The user (or an explicit approval workflow) makes the decision.

**Current implementation:** `frontend/src/domain/services/planning/ai-layer.ts` (recommendation-only surface)

---

## Principle 7 — Kepler Brain: Full Tenant Isolation

Kepler Brain operates in **strict tenant isolation**.

- No customer data is visible to another customer.
- No AI memory from Tenant A is used when serving Tenant B.
- Cross-tenant learning, benchmarking, or "industry average" leakage is **forbidden**.

**Rule:** Every AI query, memory entry, and timeline is scoped by `tenantId`. Queries without tenant scope must fail.

---

## Principle 8 — Kepler Brain: Offline-Capable Core

If Kepler ERP is running, Kepler Brain must be usable **without internet**.

```
ERP online  →  Brain available  (mandatory)
Internet down →  Brain still works on local domain data
```

**Rule:** Core AI features depend on local domain stores (events, timeline, planning snapshots, AI memory) — not on external API availability.

---

## Principle 9 — No Mandatory External LLM Dependency

Kepler Brain must **not** require ChatGPT, Claude, Gemini, Copilot, or similar services in its core execution path.

| Integration type | Status |
|---|---|
| Local domain-driven responses (rules, KPIs, timeline, risk) | **Core — required** |
| External LLM (OpenAI, Anthropic, Google, Microsoft) | **Optional integration only** |

**Rule:** The system must pass acceptance tests with zero external AI API calls.

---

## Principle 10 — AI Answers Only from Authorized Domain Sources

All AI responses MUST be grounded exclusively in:

| Source | Purpose |
|---|---|
| ERP Domain | Orders, products, production state |
| Planning Engine | Termin, risk, capacity, MRP, cost |
| Business Rule Engine | Workflow state, rule outcomes |
| Stock Ledger | Movement history, balances |
| Master Data | Reference entity resolution |
| Timeline | Order lifecycle events |
| Audit | Change history |
| Approval | Workflow status |

**Rule:** AI must not invent data. If the domain store has no answer, AI says so — it does not hallucinate operational facts.

**Current implementation:** `frontend/src/domain/platform/services/ai-memory-service.ts`, `buildAiPlanningContext()`

---

## Principle 11 — No Cross-Company Examples in AI Responses

AI must **never** reference other companies as operational examples.

| Forbidden | Allowed |
|---|---|
| "Koton bunu şöyle yapıyor." | "Bu siparişin termin riski %72 — kumaş gecikmesi aktif faktör." |
| "LC Waikiki böyle planlıyor." | "FSN-A kapasitesi %92 dolu — sipariş bölünmesi önerilir." |

**Rule:** Insights come from **this tenant's data only** — never from named external brands or competitors.

---

## Principle 12 — Offline First

Kepler ERP is **Offline First**.

- Core workflows (order view, production tracking, stock inquiry, planning read) function without network.
- Sync is a layer on top — not a prerequisite for operation.
- Mock/local domain stores in the current frontend phase model this constraint.

**Rule:** No screen may hard-depend on a live API call for read-only operational data without a local fallback.

---

## Principle 13 — API First / Domain First

The platform is **API First**. All screens consume **Domain services** (and future APIs that expose the same contracts).

```
Screen  →  Domain Service  →  (future) API  →  persistence
         never: Screen → fetch → business logic inline
```

**Rule:** Domain service signatures are the contract. UI never bypasses domain to reach data stores directly.

**Layer map (current frontend):**

| Concern | Path |
|---|---|
| Master Data | `domain/master-data/` |
| Business Rules | `domain/services/business-rule-engine.ts` |
| Stock Ledger | `domain/services/stock-ledger.ts` |
| Planning Engine | `domain/services/planning-engine.ts` |
| Platform (audit, events, KPI) | `domain/platform/` |

---

## Principle 14 — Operations Over Aesthetics

Priority order when writing code:

1. **Correct textile operation modeling**
2. **Data model integrity and relationships**
3. **Business rule correctness**
4. **Calculations and workflows**
5. Visual polish

**Rule:** A plain table that correctly models top-roll fabric receipt beats a beautiful screen with wrong stock logic.

---

## Enforcement Checklist

Before merging any code, verify:

- [ ] No business logic in UI components
- [ ] No direct stock balance mutation
- [ ] No hard-coded master data strings
- [ ] Planning services do not write operational state
- [ ] AI outputs are recommendations, not autonomous actions
- [ ] Tenant scope respected (when multi-tenant)
- [ ] AI responses cite domain sources only
- [ ] No cross-company examples in AI copy
- [ ] Domain service is the data access boundary

---

## Document Hierarchy

```
KEPLER-ERP-FOUNDATION-PRINCIPLES.md   ← THIS DOCUMENT (supreme)
        ↓
PRD-MVP.md / Module specs
        ↓
Platform-Architecture-Addendum.md
        ↓
API-Specification.md
        ↓
Implementation code
```

When documents conflict, **Foundation Principles win**.

---

## Revision History

| Version | Date | Change |
|---|---|---|
| v1 | 2026-08-02 | Initial constitutional lock — 14 principles |
