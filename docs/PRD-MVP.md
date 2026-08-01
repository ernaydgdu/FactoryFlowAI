# FactoryFlow — Version 1 (MVP) Product Design

> **Status:** Module design phase — Modules 1–7 locked  
> **Last updated:** Module 7 locked (Sections 7.1–7.8)

## Locked: Section 1 — Vision (Summary)

- **Product:** FactoryFlow — modern production planning workspace for apparel manufacturers
- **V1 goal:** Best daily production planning workspace; NOT an ERP; NOT AI
- **Positioning:** Workspace first; AI Copilot deferred to future versions
- **Integrates with:** ERP / Excel (does not replace)

---

## MVP Principles

1. Solve the **production planner's daily workflow** end-to-end for one order lifecycle slice
2. **Planner-native** — apparel milestones, language, and workflows
3. **Standalone value** — useful without AI, without full ERP replacement
4. **One workspace** — orders, timeline, materials, capacity in one place
5. **Manual + structured** — planners enter/update data; system organizes and surfaces it

---

## Module Design Order (Recommended)

Design in dependency order. Build will follow the same sequence.

| Order | Module | Rationale |
|-------|--------|-----------|
| **1** | Orders & Styles | Foundation — every other module attaches to an order |
| **2** | Critical Path & Milestones | Core daily planner work — the heart of V1 |
| **3** | Planner Dashboard (Today View) | Daily entry point — aggregates orders, risks, due milestones |
| **4** | Material Planning & Procurement | Parallel track; depends on order + BOM data |
| **5** | Capacity Planning & Line Allocation | Depends on orders + production dates |
| **6** | Shipment & Ex-Factory Tracking | End of lifecycle; depends on order + milestone completion |
| **7** | Reporting | Cross-cutting; needs data from modules 1–6 |

**Explicitly out of V1 scope:** AI Copilot, purchasing/PO issuance, full supplier CRM, inventory/WMS, accounting, PLM/tech pack authoring, brand buyer portal, multi-agent automation.

---

> **Status:** Module 1 locked; Module 2 locked; Module 3 locked; Module 4 locked; Module 5 locked; Module 6 locked; Module 7 locked  
> **Last updated:** Module 7 locked (Sections 7.1–7.8)

---

## Locked: Module 1 — Order Command Center

### Purpose
Starting point and daily home base for the entire production planning process.

### Data hierarchy
```
Order → Style → Colorway → Size Breakdown
```

### Size scales (org-configurable)
- Organization defines **Size Scale** templates (e.g. Alpha XS–XXL, EU Numeric 36–44, Waist 28–32)
- Each **Style** selects a size scale — matrix columns match that scale
- Scales managed in org settings; unlimited templates

### Weighted overall progress
- Each production stage has a **weight** (org-configurable; sensible V1 defaults)
- Formula: `Overall Progress = Σ(stage_pct × stage_weight) / Σ(weights)`
- V1 defaults (example): Cutting 15%, Sewing 45%, Finishing 25%, Packing 15%
- Architecture: weights stored in `ProductionStageWeight` per org/factory — not hardcoded

### Core principles
- Single-page command center (no tabs)
- Order Type: New Development, Repeat, Repeat with Revision, Sample, SMS
- Milestone-driven summary status (milestones = source of truth; Module 2)
- Quantity-based production progress (qty in → % out)
- KPI cards: Days to Ex-Factory, Overall Progress (weighted), CP Progress, Risk Level
- Risk level + explicit reasons (never color alone)
- Documents by category: Commercial, Technical, Creative, Shipping
- Quick Notes + Production Timeline
- Assigned Production Line field reserved (null in V1; future Band Planning)
- CSV import → V1.1

### Key entities
`Order`, `Style`, `Colorway`, `SizeBreakdown`, `SizeScale`, `SizeScaleSize`, `ProductionProgress`, `ProductionStageWeight`, `RiskSignal`, `QuickNote`, `TimelineEvent`, `OrderAttachment`, `Factory`, `ProductionStage`, `AssignedProductionLine` (reserved)

### Manual overrides only
On Hold, Cancelled, Closed

---

## Module 2: Critical Path & TNA

> **Status:** Module 2 locked — Sections 2.1–2.8 complete

---

## Locked: Section 2.1 — Purpose & Scope

### Purpose

Module 2 is the **Time & Action (TNA) / Critical Path workspace** for each order. It is where production planners build, maintain, and defend the plan that determines whether an order ships on ex-factory.

In apparel factories, the TNA is not a generic task list. It is a living schedule of milestones — fabric readiness, buyer approvals, cutting, sewing, inspection, packing, shipment — each owned by someone inside or outside the factory, each with a plan that shifts as reality changes. Module 2 replaces the Excel TNA that planners maintain today, while integrating with the Order Command Center (Module 1) as the single source of truth for **plan dates, slippage, and risk**.

The TNA is the **primary planning document used in daily production meetings and production planning discussions**. Planners and production managers walk through active orders using the TNA each day — not as a static report, but as a working surface where dates are revised, ETAs updated, and blockers recorded in real time. FactoryFlow must support this ritual directly: overdue and at-risk milestones (gates) surface first, risk reasons read aloud without translation, and changes made during the meeting log immediately to the Production Timeline. The TNA must help planners answer four questions in every session:

- **What should happen today?** — milestones (gates) with Current Planned Date or Expected Date of today
- **What is blocking production?** — incomplete critical milestones (gates) that hard-block downstream production steps
- **Which external parties must be chased?** — overdue or at-risk milestones (gates) owned by Buyer, Fabric Mill, Trim Supplier, Testing Lab, or Subcontractor
- **Which orders are at risk to Ex-Factory?** — orders where slippage, material ETAs, or open approval milestones (gates) threaten the ex-factory date

**Primary planner outcomes:**

1. **Build** a TNA quickly — from an order-type template, by copying a prior order, or via the Backward Planning Assistant from ex-factory
2. **Maintain** the TNA daily — revise dates, update material ETAs, track approval status, record partial receipts
3. **See risk in plain language** — not abstract flags, but reasons a planner would say in a production meeting
4. **Feed Module 1 KPIs** — CP Progress (weighted/phase-based), Days to Ex-Factory, Risk Level, summary status

### Terminology

FactoryFlow uses **planner-native language** in this module. UI labels, timeline events, and risk messages follow these terms.

| Term | Meaning | Avoid |
|---|---|---|
| **TNA** | The full Time & Action schedule for an order — all milestones from PO to ex-factory | "Project plan," "task list" |
| **Milestone (Gate)** | A single row on the TNA — one trackable step (e.g. Bulk Fabric In-House, PP Sample Approved). "Milestone" matches buyer CP documents; "Gate" reflects factory planning language | "Task" |
| **Critical Path (CP)** | The subset of milestones (gates) that directly determine ex-factory timing | Generic "critical path" without apparel context |
| **Ex-Factory** | The anchor ship date — goods leave the factory | "Due date," "deadline" |
| **Original Planned Date** | The date set when the TNA was first built (baseline) | — |
| **Current Planned Date** | The latest target date after revisions | "Planned date" alone (ambiguous) |
| **Expected Date** | Best estimate for an open item — especially material ETAs and pending approvals | — |
| **Actual Date** | Date the milestone (gate) was cleared | "Completion date" |
| **Slippage** | Variance between Original Planned Date and Actual Date, or between Current Planned Date and Expected Date | — |
| **Chase** | Follow-up on an externally owned milestone (gate) that is late or at risk | "Escalation" (reserved for internal escalation) |
| **Backward Planning Assistant** | Initial planning aid that proposes dates from ex-factory using org-configurable lead times — planner must confirm or edit every proposed date | "Auto-scheduler" |

Module 1 KPI card **CP Progress** retains its label for consistency across the command center; it is calculated from TNA data in this module.

### What this module is

Module 2 provides:

- **One TNA per Order** (V1) — the primary planning surface for that PO's timeline to ex-factory. The underlying data model includes an optional scope level (`Order` | `Style` | `Colorway`); V1 uses `Order` only. The data model is already designed to support Style-level and Colorway-level TNAs in future versions without database redesign
- **Milestone (Gate) types** with type-specific behavior (detailed in Section 2.2):
  - **Standard** — production and commercial milestones (binary complete/incomplete)
  - **Approval** — buyer or internal approval workflow (Submitted → Under Review → Approved / Rejected)
  - **Material** — fabric/trim readiness with ETD, ETA, and partial receipt tracking
- **Four-date model** on every milestone (gate) (where applicable)
- **Internal and external ownership** — each milestone (gate) assigned to a factory user/role or an external party type
- **Order-type TNA templates** — org-configurable templates keyed to Module 1 Order Type only (New Development, Repeat, Repeat with Revision, Sample, SMS). The underlying data model includes an optional `Buyer` dimension on templates; V1 templates have no buyer assignment. The data model is already designed to support buyer-specific templates in future versions without database redesign
- **Backward Planning Assistant** — initial planning aid only; proposes TNA dates working back from ex-factory using org-configurable lead times between milestones (gates). Planners always remain in control and must confirm or edit every proposed date. Not used for ongoing replanning after initial TNA setup — date revisions thereafter are manual
- **Copy TNA from previous order** — duplicate milestone (gate) structure and optionally dates/owners from a prior order of the same Order Type
- **Weighted and phase-based CP Progress** — progress that reflects milestone (gate) criticality, not flat item counting
- **Human-readable risk reasons** — surfaced in Module 1 Risk Level with explicit text (Module 1 principle: never color alone)

### What this module is not (V1)

| Out of scope | Notes |
|---|---|
| Full Gantt / timeline chart | V1.1 |
| Calendar engine (factory holidays, supplier shutdowns) | V1.1 — V1 uses calendar days only |
| Buyer notifications or external messaging | V1.1 |
| Auto cascade rescheduling of downstream milestones (gates) | V1.1 — V1 offers Backward Planning Assistant at setup and manual date revision thereafter |
| AI-recommended dates or risk predictions | Deferred (future versions) |
| Multi-predecessor dependency engine | V1.1 — V1 uses sequence order + explicit hard gates (Section 2.3). The underlying data model is already designed to support multi-predecessor dependencies without database redesign |
| Buyer CSV TNA import/export | V1.1 (Module 1 notes CSV import → V1.1) |
| Buyer-specific, factory-type, or product-category TNA templates | Not enabled in V1 — one template dimension only: **Order Type**. Data model supports future buyer-specific template layer without redesign |
| Material procurement / PO issuance | Module 4 — Material milestones (gates) reference readiness; they do not place orders |
| Automatic scheduling from line capacity | Module 5 — capacity conflicts may surface as risk; no auto-reschedule |
| Style-level or Colorway-level TNAs | Not enabled in V1 — data model prepared; see V1 boundaries |
| Partial shipment / split ex-factory dates | V1.1 — V1 assumes one ex-factory milestone (gate) per order. The underlying data model is already designed to support multiple ex-factory milestones (gates) per order without database redesign |

### Relationship to Module 1

Module 2 is embedded in the Order Command Center as a **primary panel** — not a separate tab or page. Planners do not context-switch to "update the TNA"; the TNA lives on the order.

| Module 1 (locked) | Module 2 provides |
|---|---|
| **Order Command Center** — single-page home base | TNA panel — primary daily editing surface and production meeting view |
| KPI: **Days to Ex-Factory** | Driven by Ex-Factory milestone (gate) Current Planned Date (or Actual if complete) |
| KPI: **CP Progress** | Weighted/phase-based calculation from milestone (gate) completion (Section 2.3) |
| KPI: **Overall Progress** | Separate — quantity-based production progress; not derived from TNA |
| KPI: **Risk Level + explicit reasons** | Human-readable risk reasons generated from TNA slippage, ETAs, approval status, hard-gate conflicts |
| **Summary status** (milestone-driven) | Derived from milestone (gate) states — TNA is source of truth for planning status |
| **Production Timeline** | All TNA date changes, status changes, receipt updates, and approval transitions logged as timeline events |
| **Quick Notes** | Planner may add notes during delay handling; not auto-generated from TNA |
| Order Type (New Dev, Repeat, etc.) | Selects default TNA template on order creation |
| Order manual overrides: On Hold, Cancelled, Closed | On Hold suppresses stall-based risk signals; Cancelled/Closed freeze TNA editing |

**Data flow principle:** Module 1 displays CP Progress and Risk Level; planners never enter those values directly. All inputs happen on the TNA.

### V1 boundaries

#### Scope: one TNA per order (data model ready for style/colorway)

- V1: all styles and colorways on an order share **one TNA**
- If one colorway's lab dip lags while others proceed, planner captures this in **milestone (gate) Notes** and **Expected Date** revision — not a separate TNA
- **Data model:** `TNAItemScope` enum (`Order` | `Style` | `Colorway`) exists on every TNA item. V1 assigns `Order` to all items. Future versions can enable Style-level or Colorway-level milestones (gates) — particularly for material and development items — without database redesign

#### Scope: order-type templates only (data model ready for buyer layer)

- Organization configures TNA templates in org settings — **one default template per Order Type** (five templates matching Module 1 order types)
- Planners may add, remove, or reorder milestones (gates) on a specific order
- No buyer-specific, factory-type, or product-category template layers enabled in V1
- **Data model:** `TNATemplate` includes an optional nullable `Buyer` reference. V1 templates leave this null. Future buyer-specific templates attach via this field as overrides or alternatives — no database redesign required

#### Planner-driven planning with system assist

- **FactoryFlow proposes dates using lead times. The planner reviews, confirms, or edits them.**
- Date proposal sources in V1:
  - **Backward Planning Assistant** — used at initial TNA setup only; proposes dates from ex-factory + org-configurable lead times between milestones (gates). Presents all proposed dates for planner review; nothing is saved until planner confirms or edits each date individually
  - **Copy TNA from previous order** — copies milestone (gate) list and optionally dates/owners from a prior order; planner adjusts as needed
  - **Order-type template** — populates milestone (gate) structure; dates proposed when planner runs Backward Planning Assistant or copies from prior order
- After initial setup, all date revisions are **manual** — planner edits Current Planned Date or Expected Date directly. System calculates progress, slippage, and risk but never auto-reschedules downstream milestones (gates) in V1

#### Ownership model

Every milestone (gate) has exactly one **owner**:

| Owner type | Description | V1 values |
|---|---|---|
| **Internal** | Factory user or role responsible for clearing the milestone (gate) | Selected from org user list; role label optional (e.g. "Production Planner," "Cutting Supervisor") |
| **External** | Party outside the factory responsible for clearing the milestone (gate) | One of: **Buyer**, **Fabric Mill**, **Trim Supplier**, **Testing Lab**, **Subcontractor** |

External ownership enables **chase lists** in Module 3 (Dashboard) — "all milestones (gates) owned by Fabric Mill that are overdue or ETA at risk this week."

#### Date model (summary — full rules in Section 2.3)

| Date field | When set | Purpose |
|---|---|---|
| **Original Planned Date** | On first assignment during TNA setup, Backward Planning Assistant, or copy | Baseline for slippage reporting; never auto-changed |
| **Current Planned Date** | Initial setup; revised when plan changes | Active target the planner is working to |
| **Expected Date** | Optional on open items; required when Current Planned Date is missed or for Material ETAs | Best current estimate — "when we actually expect this to clear" |
| **Actual Date** | On milestone (gate) completion | Record of when the milestone (gate) cleared |

When Current Planned Date is revised, Original Planned Date is preserved. Each revision is logged in Production Timeline with old → new value and optional reason code.

#### CP Progress model (summary — full formula in Section 2.3)

V1 replaces flat item counting with **weighted milestone (gate) progress**:

- Each milestone (gate) has a **weight** (org-configurable per template; sensible defaults per milestone type)
- CP Progress = weighted completion across applicable milestones (gates)
- Displayed as **percentage + phase breakdown** (e.g. "58% — Pre-Production 80% · Production 40% · Shipment 0%")
- **Next Critical Gate** shown alongside percentage — the nearest incomplete milestone (gate) marked Critical that blocks ex-factory

This aligns with Module 1's weighted Overall Progress philosophy — planners distrust flat counts where "PO Confirmed" equals "Bulk Fabric In-House."

#### Risk model (summary — full rules in Section 2.3)

Risk signals feed Module 1 Risk Level. Every signal includes a **human-readable reason** written as a planner would speak:

- *"Bulk Fabric In-House: ETA (Mar 12) is after Cutting Start plan (Mar 10)"*
- *"PP Sample Approved: rejected — awaiting resubmission"*
- *"Ex-Factory in 6 days — Finishing Complete not yet started"*

No signal is color-only. Severity (Medium / High) is configurable per org with sensible defaults.

### Core principles

1. **TNA-first language** — UI, docs, and timeline events use planner terms (milestone, gate, ex-factory, chase, slippage), not generic PM vocabulary
2. **Four dates tell the story** — Original plan, current plan, expected reality, actual result — on one row
3. **External ownership is first-class** — half the CP is outside the factory; the system must reflect who planners chase
4. **Type-specific milestone (gate) behavior** — Approval, Material, and Standard milestones behave differently; one status model forced on all types is not acceptable
5. **Weighted progress, not checkbox counting** — CP Progress reflects what matters for ex-factory
6. **Readable risk, not alert codes** — every risk reason is a complete sentence a planner can read aloud in a production meeting
7. **Propose, confirm, edit** — FactoryFlow proposes dates using lead times; the planner reviews, confirms, or edits them
8. **Backward Planning Assistant is setup-only** — proposes initial dates from ex-factory; planner confirms every date; not used for ongoing auto-replanning
9. **Order-level V1, extensible scope** — one TNA per order in V1; data model supports Style-level and Colorway-level TNAs without redesign
10. **Order-type templates in V1, extensible template layer** — five templates in V1; data model supports future buyer-specific templates without redesign
11. **Production meeting ready** — TNA answers what happens today, what's blocking, who to chase, and what's at risk to ex-factory
12. **Audit trail** — every date revision, status change, receipt update, and approval transition logs to Production Timeline (Module 1)

### Key concepts (introduced here; specified in later sections)

| Concept | Section |
|---|---|
| Milestone (Gate) types (Standard, Approval, Material) | 2.2 |
| TNA milestone (gate) library and order-type templates | 2.2 |
| Milestone (gate) properties (full field list) | 2.2 |
| TNA phases (Pre-Production, Production, Shipment) | 2.2 |
| Date rules, revision logging, slippage calculation | 2.3 |
| Status transitions per milestone (gate) type | 2.3 |
| Hard gates and sequence dependencies | 2.3 |
| CP Progress formula (weighted + phase) | 2.3 |
| Risk signal triggers and human-readable reason templates | 2.3 |
| Ex-Factory as anchor milestone (gate) | 2.3 |
| TNA setup workflow (template, copy, backward planning) | 2.4 |
| Daily TNA update workflow | 2.4 |
| Delay handling and chase workflow | 2.4 |
| Order-type-specific TNA paths | 2.4 |
| TNA panel UX within Order Command Center | 2.5 |
| Org settings: templates, milestone weights, lead times | 2.6 |
| Integration with Modules 3, 4, 5, 6 | 2.7 |
| V1.1 deferrals | 2.8 |

### Key entities (conceptual — for cross-module reference)

`TNA`, `TNAItem`, `TNAItemScope` (Order | Style | Colorway — V1: Order only), `TNAItemType`, `TNATemplate`, `TNATemplateItem`, `TNATemplateBuyer` (nullable — reserved for future buyer-specific templates), `TNAItemWeight`, `TNAPhase`, `TNAItemDateRevision`, `TNAItemApprovalState`, `TNAItemMaterialTracking`, `TNAItemOwner`, `TNACriticalGate`, `TNALeadTime`, `TNADependency` (reserved — V1 uses sequence + hard gates; data model supports multi-predecessor in V1.1 without redesign)

Module 1 entities consumed: `Order`, `OrderType`, `TimelineEvent`, `RiskSignal`, `QuickNote`

### Explicit V1.1 deferrals (from approved decisions)

| Capability | Version | Data model status |
|---|---|---|
| Gantt / visual timeline chart | V1.1 | UI only — no data model change required |
| Calendar engine (working days, holidays) | V1.1 | `FactoryCalendar` entity reserved; not populated in V1 |
| Buyer / external party notifications | V1.1 | No data model change — uses existing ownership fields |
| Auto cascade rescheduling | V1.1 | Builds on existing date revision model |
| AI date recommendations | Future | No data model dependency |
| Multi-predecessor dependency graph | V1.1 | `TNADependency` entity reserved in V1 |
| Buyer TNA CSV import/export | V1.1 | Maps to existing TNA item fields |
| Style-level / Colorway-level TNAs | Future | `TNAItemScope` enum ready in V1 |
| Buyer-specific templates | Future | `TNATemplate.Buyer` nullable field ready in V1 |
| Partial shipment / multiple ex-factory milestones (gates) | V1.1 | TNA item model supports multiple Shipment-phase items without redesign |

---

## Locked: Section 2.2 — TNA Item Framework & Gate Library

#### Overview

Every row on the TNA is a **Milestone (Gate)** — a typed, weighted, owned planning item with dates, status, and phase assignment. This section defines:

- The **three-layer architecture** (Library → Template → Instance)
- Three TNA **phases** and five UI **display groups**
- Three milestone (gate) **types** (Standard, Approval, Material)
- The **default gate library** (35 milestones)
- **Order-type templates** and the full **property model**

V1 uses one TNA per order. Every TNA item carries `TNAItemScope = Order`. The data model includes `Style` and `Colorway` scope values for future use without database redesign.

#### Three-layer architecture

Milestone (gate) data is structured in three layers. **Structure and defaults flow down; state and dates live only on the instance.**

> **Library defines WHAT exists.**  
> **Template defines WHICH gates are used.**  
> **Instance defines WHAT actually happened.**

```
Gate Library (org master list)
       ↓
Template Item (per Order Type composition — versioned)
       ↓
TNA Item Instance (per order — source of truth for dates & status)
```

| Layer | Entity | Purpose | Mutability |
|---|---|---|---|
| **Library** | `TNAGateLibraryItem` | Master definition of each milestone (gate) — code, name, phase, display group, type, defaults | Org admin configures display names and defaults; **never physically deleted** — status: Active, Inactive, or Archived |
| **Template** | `TNATemplate` + `TNATemplateItem` | Which library items appear per Order Type — sequence, skipped-by-default, weight/lead-time overrides | **Versioned** — edits create new version; existing orders retain their creation version |
| **Instance** | `TNAItem` | Order-specific milestone (gate) — all dates, status, chase, material qty, approval state, notes | Planner edits daily; immutable UUID assigned at creation |

**Rule:** Original Planned Date, Current Planned Date, Expected Date, Actual Date, all status fields, Last Chased, and Notes exist **only on the instance**. Templates and library items never store order-specific state.

**Lineage:** Every instance retains FK to its `TNATemplateItem`, `TNATemplate` version, and `TNAGateLibraryItem` for traceability, reporting, and future ERP mapping.

#### Milestone Code immutability

Every gate library item has a **Milestone Code** — a short stable key (e.g. `BFI`, `EXF`). Codes are **immutable forever** once assigned:

- Display names, descriptions, weights, and lead times may change
- **Codes never change** — not on rename, not on archive, not on template version
- Custom library items require org-assigned unique codes at creation
- Codes are the primary key for bulk updates, reporting, ERP mapping, and cross-order queries

This guarantees that historical orders, timeline events, and future integrations remain valid regardless of display label changes.

#### Gate library lifecycle

Gate library items are **never physically deleted**. An item referenced by any template version or order instance must remain in the database permanently. Lifecycle states:

| Status | Meaning |
|---|---|
| **Active** | Available for new templates and order TNAs |
| **Inactive** | Hidden from new template composition; existing references unchanged |
| **Archived** | Retired from active use; preserved for historical orders and audit |

State transitions: Active → Inactive → Archived (one direction only). Archived items cannot return to Active — a new library item with a new code must be created instead.

#### Template versioning

Templates are **versioned**. When an org admin changes template composition (add/remove items, sequence, weight overrides, lead times), the system creates a **new template version** — it does not mutate the version existing orders depend on.

| Rule | Behavior |
|---|---|
| **Existing orders** | Continue using the `TNATemplateVersion` they were instantiated from — frozen at order creation |
| **New orders** | Always instantiate from the **latest published version** for that Order Type |
| **Version record** | `TNATemplateVersion` — version number, published at, published by, change summary |
| **Draft edits** | Admin edits create a draft version; publishing increments version and applies to new orders only |
| **Copy TNA** | Copies instance state from source order — not affected by template version changes on either order |

V1 ships version 1 of each of the five Order Type templates. First admin edit to a template creates version 2 for new orders; all prior orders remain on version 1.

#### TNA phases and display groups

V1 uses **three phases** for CP Progress breakdown and risk prioritization. Within the TNA panel, milestones (gates) are visually grouped by **display group** — matching how planners run production meetings.

```
Phase              Display groups (UI)
─────────────────────────────────────────
Pre-Production  →  Development · Materials
Production      →  Floor · Subcontract
Shipment        →  Shipment
```

| Phase | Planner question | Display group | What it contains |
|---|---|---|---|
| **Pre-Production** | "Can we start cutting?" | **Development** | PO, approvals, samples, lab test, PPM, BOM freeze |
| | | **Materials** | Bulk fabric/trim ordered and in-house |
| **Production** | "Where are we on the floor?" | **Floor** | Marker, pilot cut, cutting, sewing, finishing, inline QC, packing |
| | | **Subcontract** | Print/embroidery and wash/dye sent to and received from subcon |
| **Shipment** | "Can we ship on time?" | **Shipment** | Final inspection, shipping docs, freight, ex-factory |

- **Phase** — stored on library item; drives CP Progress phase breakdown (Section 2.3)
- **Display group** — stored on library item; drives TNA panel grouping and meeting walkthrough order within a phase
- Display groups are a **UI organization dimension**, not a separate planning phase
- Planners cannot change phase or display group on an existing instance in V1 — only when adding a custom milestone (gate)

#### Milestone (Gate) types

Each library item has exactly one **type**. Type determines available status values, editable fields, and completion rules. Types are stored in a **`TNAItemType` reference table** (V1: Standard, Approval, Material) — extensible in future versions without schema redesign. V1 does **not** add Subcontracting or Checklist types; subcon milestones (gates) use **Standard** type.

##### Standard

Production, commercial, subcon, and quality milestones (gates) that clear with a single completion action.

| Aspect | Behavior |
|---|---|
| **Use for** | PO Confirmed, PPM, cutting/sewing/packing, subcon sent/received, shipping docs, ex-factory, inline QC |
| **Status values** | Not Started → In Progress → Complete; also Skipped, N/A |
| **Completion** | Planner marks Complete + Actual Date |
| **Dates** | Original Planned, Current Planned, Expected (optional), Actual |
| **Revision** | Current Planned Date change requires **Revision Reason** (Section 2.3) |

##### Approval

Buyer or internal approval milestones (gates) with a submission and review cycle.

| Aspect | Behavior |
|---|---|
| **Use for** | Tech pack, lab dip, samples, fabric/trim approval, marker/consumption, pilot cut, lab test, final inspection |
| **Status values** | Not Started → Submitted → Under Review → Approved · **Approved with Comments** · **Rejected** · **Waived**; also Skipped, N/A |
| **Completion** | **Approved** or **Approved with Comments** (after planner acknowledgement) or **Waived** → Actual Date set |
| **Approved with Comments** | Buyer approves with conditions — planner reads comments, acknowledges, then milestone (gate) clears. Comments stored in Notes; acknowledgement logged in Production Timeline |
| **Waived** | Buyer explicitly waives the gate — distinct from Skipped (internal Not Required). Requires External owner = Buyer and **Waived reason** (required text). Terminal state |
| **Rejected** | Returns to Submitted on resubmission; approval round auto-increments |
| **Approval metadata** | Submission date (auto on Submitted); rejection reason (required on Rejected); approval round count; waived reason (required on Waived) |
| **Risk** | Rejected and overdue Under Review generate human-readable risk reasons immediately |

##### Material

Fabric and trim readiness milestones (gates) with order tracking, ETD/ETA, quantity, and partial receipt.

| Aspect | Behavior |
|---|---|
| **Use for** | Bulk Fabric Ordered/In-House, Bulk Trim Ordered/In-House |
| **Status values** | Not Started → Ordered → In Transit → Partially Received → Complete; also Skipped, N/A |
| **Completion** | Complete at Receipt % = 100; Partially Received when 0% < Receipt % < 100% |
| **Quantity** | **Qty Ordered** and **Qty Received** (numeric) + **UOM** (org-default: meters, yards, kg, pieces — override per instance) |
| **Receipt %** | Computed from qty when both entered; editable directly (updates Qty Received proportionally) |
| **Dates** | Original Planned, Current Planned, Expected (= ETA when in transit), Actual (full receipt date) |
| **Material tracking** | ETD, ETA, Ordered date (auto on Ordered), supplier reference (optional free text) |
| **Risk** | ETA after dependent production milestone (gate) Current Planned Date → human-readable risk |

#### Default gate library

FactoryFlow ships a **35-item default gate library**. Each item has a unique **Milestone Code** (immutable forever — see above). Organizations can rename display names, adjust weights/lead times, and add custom library items in org settings (Section 2.6).

**Legend:** Type = S (Standard), A (Approval), M (Material) · DG = Display Group · Critical = hard-gate risk if incomplete when downstream production due · Owner = default external owner (Internal if blank)

##### Pre-Production — Development

| Seq | Code | Milestone (Gate) | Cat. | Type | Critical | Wt | Owner | Lead (days) |
|---|---|---|---|---|---|---|---|---|
| 1 | POC | PO Confirmed | Commercial | S | No | 2 | — | 1 |
| 2 | PFS | Proto / Fit Sample Approved | Development | A | Yes | 5 | Buyer | 3 |
| 3 | TPA | Tech Pack Approved | Development | A | Yes | 5 | Buyer | 3 |
| 4 | LDA | Lab Dip Approved | Development | A | Yes | 5 | Buyer | 2 |
| 5 | SOA | Strike-off Approved | Development | A | No | 3 | Buyer | 2 |
| 6 | FBA | Fabric Approved | Development | A | Yes | 5 | Buyer | 1 |
| 7 | TRA | Trim Approved | Development | A | No | 3 | Buyer | 1 |
| 8 | SSA | Size Set Approved | Development | A | Yes | 4 | Buyer | 2 |
| 9 | PPA | PP Sample Approved | Development | A | Yes | 8 | Buyer | 3 |
| 10 | TOP | TOP Sample Approved | Development | A | No | 4 | Buyer | 2 |
| 11 | LTP | Lab Test Passed | Development | A | Yes | 5 | Testing Lab | 2 |
| 12 | PPM | PPM (Pre-Production Meeting) | Development | S | Yes | 5 | — | 1 |
| 13 | BOM | BOM / Trims Card Freeze | Material | S | Yes | 4 | — | 1 |

##### Pre-Production — Materials

| Seq | Code | Milestone (Gate) | Cat. | Type | Critical | Wt | Owner | Lead (days) |
|---|---|---|---|---|---|---|---|---|
| 14 | BFO | Bulk Fabric Ordered | Material | M | No | 2 | Fabric Mill | 0 |
| 15 | BFI | Bulk Fabric In-House | Material | M | Yes | 10 | Fabric Mill | 2 |
| 16 | BTO | Bulk Trim Ordered | Material | M | No | 2 | Trim Supplier | 0 |
| 17 | BTI | Bulk Trim In-House | Material | M | Yes | 6 | Trim Supplier | 1 |

##### Production — Floor

| Seq | Code | Milestone (Gate) | Cat. | Type | Critical | Wt | Owner | Lead (days) |
|---|---|---|---|---|---|---|---|---|
| 18 | MCA | Marker / Consumption Approved | Production | A | Yes | 4 | — | 1 |
| 19 | PCA | Pilot Cut / First Bulk Lay Approved | Production | A | Yes | 5 | — | 1 |
| 20 | CST | Cutting Start | Production | S | Yes | 3 | — | 0 |
| 21 | CCP | Cutting Complete | Production | S | Yes | 5 | — | 1 |
| 22 | SST | Sewing Start | Production | S | Yes | 3 | — | 0 |
| 23 | SCP | Sewing Complete | Production | S | Yes | 8 | — | 1 |
| 24 | SLA | Sewing Line Allocated | Production | S | No | 3 | — | 0 |
| 25 | FCP | Finishing Complete | Production | S | Yes | 5 | — | 1 |
| 26 | IQC | Inline QC | Quality | S | No | 3 | — | 0 |
| 27 | PCK | Packing Complete | Production | S | Yes | 4 | — | 1 |

##### Production — Subcontract

| Seq | Code | Milestone (Gate) | Cat. | Type | Critical | Wt | Owner | Lead (days) |
|---|---|---|---|---|---|---|---|---|
| 28 | PES | Print / Embroidery Sent to Subcon | Production | S | No | 3 | Subcontractor | 0 |
| 29 | PER | Print / Embroidery Received from Subcon | Production | S | Yes | 4 | Subcontractor | 1 |
| 30 | WGS | Washing / Garment Dye Sent to Subcon | Production | S | No | 3 | Subcontractor | 0 |
| 31 | WGR | Washing / Garment Dye Received from Subcon | Production | S | Yes | 5 | Subcontractor | 1 |

##### Shipment

| Seq | Code | Milestone (Gate) | Cat. | Type | Critical | Wt | Owner | Lead (days) |
|---|---|---|---|---|---|---|---|---|
| 32 | FIN | Final Inspection | Quality | A | Yes | 6 | Buyer | 1 |
| 33 | SDR | Shipping Docs Ready | Commercial | S | Yes | 4 | — | 1 |
| 34 | VFB | Vessel / Freight Booked | Commercial | S | No | 3 | — | 1 |
| 35 | EXF | Ex-Factory ✦ | Commercial | S | Yes | 10 | — | — |

✦ **EXF — Ex-Factory** is the anchor milestone (gate). Every order TNA must include exactly one Ex-Factory item. Backward Planning Assistant starts here.

**Library notes:**

- **PFS (Proto / Fit Sample)** — included in New Development and Sample templates; default Skipped on Repeat
- **Subcon pair (PES/PER, WGS/WGR)** — Standard type; included in all production templates; default N/A when print or wash not required
- **SLA (Sewing Line Allocated)** — optional capacity handoff to Module 5; default active on Repeat, included on New Development
- **SDR, VFB** — shipment prep gates; planners often chase internally before ex-factory
- Custom library items require org-assigned unique Milestone Code at creation (immutable forever — see above)

#### Order-type templates

V1 provides **one default template per Order Type**, each at **version 1**. Templates compose library items via versioned `TNATemplateItem` records. No buyer-specific template layer in V1 — `TNATemplate.Buyer` is null on all templates (field reserved).

| Order Type | Template intent | Active library codes (default) | Default Skipped / N/A |
|---|---|---|---|
| **New Development** | Full path | All 35 codes | Subcon items N/A unless print/wash required |
| **Repeat** | Material + floor + shipment | POC, PPM, BOM, BFO–BTI, MCA, PCA, CST–PCK, FIN, SDR, VFB, EXF + SLA | PFS, TPA–TOP, LTP (Skipped); subcon (N/A unless required) |
| **Repeat with Revision** | Repeat + selected dev resets | Repeat base + planner-selected from {PFS, TPA, LDA, SOA, FBA, TRA, SSA, PPA, TOP, LTP} | Non-selected dev codes Skipped; subcon N/A unless required |
| **Sample** | Development only | POC, PFS, TPA, LDA, SOA, FBA, TRA, SSA, PPA, TOP, LTP, PPM, BOM, FIN, EXF | BFO–PCK, PES–WGR, SDR, VFB (N/A) |
| **SMS** | Shortened development | POC, TPA, LDA, FBA, PPA, FIN, EXF | Remaining codes Skipped or N/A |

**Template application rule:** On order creation, system instantiates `TNAItem` records from the **latest published template version** for the Order Type. Each instance stores FK to `TNATemplateVersion` — preserving which template version the order was built from. Planner reviews list, confirms Skipped/N/A items, adds custom items if needed, then runs Backward Planning Assistant or copies from a prior order.

**Repeat with Revision — revision picker:** Planner selects which development codes from {PFS, TPA, LDA, SOA, FBA, TRA, SSA, PPA, TOP, LTP} require reset. Selected items → Not Started; unselected → Skipped (Not Required).

#### Property model — three-layer field placement

##### Layer 1: Gate Library Item (`TNAGateLibraryItem`)

Master definition — configured in org settings.

| Field | Description |
|---|---|
| **Milestone Code** | Unique short key (e.g. `BFI`) — **immutable forever**; never changes after creation |
| **Name** | Display name — org-editable at any time |
| **Description** | Optional helper text for planners |
| **Phase** | Pre-Production, Production, Shipment |
| **Display Group** | Development, Materials, Floor, Subcontract, Shipment |
| **Category** | Commercial, Development, Material, Production, Quality |
| **Type** | Standard, Approval, Material |
| **Default weight** | CP Progress contribution (1–10 scale) |
| **Default critical flag** | Hard-gate risk default |
| **Default owner type** | Internal or External |
| **Default external owner type** | Buyer, Fabric Mill, Trim Supplier, Testing Lab, Subcontractor |
| **Default hard gate predecessor** | Optional library item code |
| **Default lead time to next** | Days — Backward Planning Assistant default |
| **ERP milestone code** | Nullable — external system mapping key (empty in V1) |
| **Status** | Active, Inactive, or Archived — **never physically deleted** |

##### Layer 2: Template Item (`TNATemplateItem`)

Per Order Type composition — overrides library defaults. Bound to a specific `TNATemplateVersion`.

| Field | Description |
|---|---|
| **Template version reference** | FK to `TNATemplateVersion` |
| **Library item reference** | FK to `TNAGateLibraryItem` |
| **Sequence** | Sort order within template |
| **Default skipped** | Item starts as Skipped on order creation |
| **Default N/A** | Item starts as N/A on order creation |
| **Weight override** | Optional — overrides library default weight for this template version |
| **Critical override** | Optional |
| **Owner override** | Optional — internal user or external type |
| **Lead time override** | Optional — overrides library default lead time for Backward Planning Assistant |

**Weight override revision history:** Every change to a template item weight override is logged in `TNATemplateWeightRevision` — previous value, new value, changed by, changed at, template version. Supports audit when CP Progress weighting changes affect new orders.

**Lead time resolution order** (Backward Planning Assistant at initial setup):

1. Instance lead time override (if set on order — see Layer 3)
2. Template item lead time override
3. Library item default lead time to next

##### Layer 3: TNA Item Instance (`TNAItem`)

Order-specific state — planner's daily working data.

###### Identity (immutable)

| Field | Description |
|---|---|
| **UUID** | Immutable system-generated identifier — assigned at instance creation; primary key for future ERP and external system integration |
| **Template version reference** | FK to `TNATemplateVersion` — frozen at order creation |
| **Library item reference** | FK to `TNAGateLibraryItem` — lineage to master definition |
| **Template item reference** | FK to `TNATemplateItem` — lineage to specific template version item |

###### Structure (from template — mostly read-only on instance)

| Field | Editable | Source |
|---|---|---|
| Milestone Code, Name, Phase, Display Group, Category, Type | No | Library via template |
| Sequence | Yes (reorder) | Template |
| Is Critical, Weight | Yes | Template default; instance override |
| Hard Gate Predecessor | Yes | Template default; instance override |
| **Lead time to next** | Yes | Template override default; instance override for Backward Planning Assistant on this order |
| Scope | No (V1) | Always Order; Style/Colorway reserved |

###### Dates (all types)

| Field | Description |
|---|---|
| **Original Planned Date** | Baseline; set once; never auto-changed |
| **Current Planned Date** | Active target; manual revision only after setup |
| **Expected Date** | Best estimate for open items; required for Material In Transit/Partially Received |
| **Actual Date** | Set on completion |
| **Revision Reason** | Required when Current Planned Date changes (after initial setup). Org-configurable codes: Mill Delay, Buyer Delay, Capacity Constraint, Quality Issue, Freight Delay, Planner Adjustment, Other (+ text). Logged in `TNAItemDateRevision` and Production Timeline |

###### Ownership and chase (single owner — no secondary owner in V1)

| Field | Description |
|---|---|
| **Owner type** | Internal or External |
| **Internal owner** | Org user (required when Internal) + optional role label |
| **External owner type** | Buyer, Fabric Mill, Trim Supplier, Testing Lab, Subcontractor |
| **External party name** | Optional free text for chase reference |
| **Last Chased** | Date planner last followed up; manual update — supports Module 3 chase lists |
| **Notes** | Free text |

###### Standard type — instance fields

| Field | Description |
|---|---|
| **Status** | Not Started, In Progress, Complete, Skipped, N/A |
| **Skipped reason** | Required if Skipped: Not Required, Absorbed into Another Milestone, Other (+ text). Note: buyer-initiated skip of approval gates uses **Waived** (Approval type), not Skipped |

###### Approval type — instance fields

| Field | Description |
|---|---|
| **Approval status** | Not Started, Submitted, Under Review, Approved, Approved with Comments, Rejected, Waived, Skipped, N/A |
| **Submission date** | Auto on Submitted |
| **Rejection reason** | Required on Rejected |
| **Waived reason** | Required on Waived |
| **Comments acknowledgement** | Required before Approved with Comments clears; timestamp logged |
| **Approval round** | Auto-incremented on resubmission after Rejected |

###### Material type — instance fields

| Field | Description |
|---|---|
| **Material status** | Not Started, Ordered, In Transit, Partially Received, Complete, Skipped, N/A |
| **Qty Ordered** | Numeric — manual entry |
| **Qty Received** | Numeric — manual entry; drives Receipt % |
| **UOM** | Unit of measure — org default with per-instance override |
| **Receipt %** | 0–100; computed from qty or entered directly |
| **ETD** | Estimated departure from supplier |
| **ETA** | Estimated arrival — maps to Expected Date |
| **Ordered date** | Auto on Ordered |
| **Supplier reference** | Optional free text (mill PO, confirmation #) |

###### Nullable ERP / integration fields (reserved — empty in V1)

Present on instance for future SAP/ERP and module integration. **Not populated, not required, not shown in V1 UI** unless org enables integration (future).

| Field | Type | Future use |
|---|---|---|
| **External reference** | Nullable text | Generic ERP document ID |
| **Material document reference** | Nullable text | SAP MM material document — Material type only |
| **Inspection reference** | Nullable text | SAP QM inspection lot — Approval type (inspection gates) |

**Explicitly excluded from V1** (do not add fields): vendor master code, plant code, production order number, buyer requested date, factory committed date, sync status. Architecture remains extensible via nullable reference fields above and reserved entities in Section 2.1.

#### Configuration entities (org settings — summary)

Detailed admin UX in Section 2.6.

| Entity | Layer | Purpose |
|---|---|---|
| `TNAGateLibraryItem` | Library | Master gate definitions; status Active/Inactive/Archived |
| `TNATemplate` | Template | One per Order Type; nullable `Buyer` for future buyer templates |
| `TNATemplateVersion` | Template | Versioned snapshot — existing orders FK here; new orders use latest |
| `TNATemplateItem` | Template | Library item composition + overrides per version |
| `TNATemplateWeightRevision` | Template history | Weight override change log per template item |
| `TNAItemType` | Reference | Standard, Approval, Material — extensible registry |
| `TNAPhase` | Reference | Pre-Production, Production, Shipment |
| `TNADisplayGroup` | Reference | Development, Materials, Floor, Subcontract, Shipment |
| `TNARevisionReason` | Reference | Org-configurable date revision reason codes |
| `TNAItemDateRevision` | Instance history | Current Planned Date change log with reason |
| `TNAItem` | Instance | Immutable UUID; FK to template version + library item |

Organizations inherit sensible V1 defaults pre-loaded. Planners need no admin setup to start planning.

#### Custom milestones (gates) on an order

Planners may add items not in the template:

1. Select from gate library (unused items) or create fully custom with new code
2. Specify: code, name, phase, display group, category, type, sequence, critical flag, weight, owner
3. Set lead time to predecessor if running Backward Planning Assistant (instance-level override)
4. Custom items on one order do not modify the org template or library

Custom items carry `TNAItemScope = Order` in V1.

#### Architecture notes (future-ready, V1-simple)

| Future capability | V1 support |
|---|---|
| Style / Colorway scoped items | `TNAItemScope` enum + nullable Style/Colorway FK |
| Buyer-specific templates | `TNATemplate.Buyer` nullable FK |
| Template version history | `TNATemplateVersion` — V1 enabled; existing orders frozen on creation version |
| Multi-predecessor dependencies | `TNADependency` join table reserved; V1 uses single hard gate predecessor |
| Subcontracting / Checklist types | `TNAItemType` registry — add rows without schema change |
| ERP instance mapping | `TNAItem.uuid` immutable — external systems reference UUID, not display name or code alone |
| Module 4 material link | `materialDocumentReference` nullable field; Module 4 populates later |
| Module 5 capacity link | SLA milestone (gate) + future `productionLineId` FK (not in V1) |
| Module 6 shipment link | EXF completion event; SDR/VFB precede handoff |
| Vendor master / plant / production order | Not in V1 — add nullable FKs in integration release without breaking V1 instances |
| Secondary owner, role-without-user | Not in V1 — single internal user owner |

---

## Locked: Section 2.3 — Business Rules

#### Overview

Section 2.3 defines the **behavioral engine** of Module 2 — deterministic rules governing instance state changes, date lifecycle, CP Progress, risk generation, timeline audit, and Module 1 derived outputs.

**Engine principles (V1):**

1. **Instances are the sole runtime source of truth** — library and template supply defaults only
2. **One canonical completion predicate** — `isComplete` drives CP Progress, hard gates, and risk suppression consistently
3. **Deterministic evaluation** — same instance state always produces same CP Progress, risk signals, and KPIs
4. **All business rules are deterministic** — the same input data must always produce the same outputs regardless of user, session, or execution order
5. **Auditability** — append-only timeline; structured revision and risk records; denormalized KPI cache with timestamps and rule version
6. **ERP readiness** — instance UUID on all events and signals; integration idempotency deferred to Module integration specs (V1.1)

**Edit rules** and **risk rules** vary by order status (see Override rules).

#### Core engine concepts

##### Canonical state and `isComplete`

Each instance persists type-specific status fields (Standard `status`, Approval `approval_status`, Material `material_status`). The engine computes **`isComplete`** for all evaluation:

| Type | `isComplete` = true when |
|---|---|
| **Standard** | `status` = Complete |
| **Approval** | `approval_status` = Approved (acknowledgement complete if Approved with Comments), or Waived |
| **Material** | `material_status` = Complete |

**Terminal but not complete:** Skipped, N/A — excluded from CP Progress numerator and denominator; generate **no date-based risk signals**.

##### N/A predecessor rule (optional / subcon gates)

Hard gate evaluation for dependent D with predecessor P:

1. If P is **N/A** → predecessor **satisfied** (optional gate; no Blocked indicator)
2. Else if P is **Skipped** → predecessor **not satisfied**; if D is active (not Skipped/N/A), signal `GATE_PREDECESSOR_NOT_APPLICABLE` (Medium)
3. Else if P `isComplete` = true → predecessor **satisfied**
4. Else → predecessor **not satisfied**; **Blocked** indicator on D

Hard gate satisfaction uses **`isComplete` only** — not raw status strings.

##### TNA setup boundary

| Field | Behavior |
|---|---|
| `tnaInitialPlanningCompletedAt` | Null until planner completes initial planning |
| **Before set (planning mode)** | Current Planned Date changes do not require Revision Reason; EXF_AT_RISK suppressed |
| **After set** | All Current Planned Date changes require Revision Reason |

**Triggers:**

- Planner clicks **Confirm TNA Planning** after Backward Planning, copy TNA, or manual date entry; OR
- Org setting `autoCompleteTnaPlanningOnAllDatesSet` = true AND every applicable instance has Original Planned Date assigned (default: **false** — explicit confirm required)

**First date assignment:** Original Planned Date = Current Planned Date. Each assignment creates `TNAItemDateRevision` with reason code `Initial Setup` — including during bulk Backward Planning confirm.

##### Denormalized KPI cache (Order / TNA aggregate)

Updated transactionally on every instance save. All cached KPIs are written in a **single engine run** — one deterministic pass over instance state.

| Cached field | Purpose |
|---|---|
| `cpProgress` | Weighted CP Progress (null if denominator zero) |
| `cpProgressPhasePreProd` / `Production` / `Shipment` | Phase breakdown |
| `nextCriticalGateCode` / `nextCriticalGateName` | Next Critical Gate |
| `riskLevel` | None / Medium / High |
| `riskReasons` | JSON array of active signal summaries |
| `daysToExFactory` | From EXF instance |
| `lastTnaProgressAt` | Updated when any instance becomes `isComplete` |
| **`calculatedAt`** | Timestamp when **CP Progress**, **Risk Level**, and **Next Critical Gate** were last computed — always written together in the same engine run |
| **`businessRuleVersion`** | Version identifier of Section 2.3 rules used for this calculation (V1 locked value: `"2.3"`) — stored on every engine run for ERP audit and historical replay |

**Rule version behavior:**

- `businessRuleVersion` is set from the application’s locked business-rules constant on every engine execution
- When business rules change in a future release, the constant increments (e.g. `"2.3"` → `"2.4"`) — existing cached rows retain the version from their last calculation
- ERP exports and reporting include `businessRuleVersion` + `calculatedAt` alongside KPI values so downstream systems know **which rules produced which numbers**

Module 1 KPI cards read cache fields only — never recalculate client-side.

##### Optimistic concurrency

Each `TNAItem` has `version` (integer). Save requires matching version; mismatch returns conflict — planner refreshes and retries.

#### Four-date behavior

##### Field lifecycle

| Date | Set | Changed | Cleared | Never |
|---|---|---|---|---|
| **Original Planned Date** | First assignment | Never | Never | Auto-changed |
| **Current Planned Date** | First assignment | Planner revision (Reason required after setup complete) | Never | Auto-changed after setup |
| **Expected Date** | Planner / Material ETA | Planner update (no Reason) | **On `isComplete` = true** | — |
| **Actual Date** | `isComplete` true | Never | Reopen | Future date |

**Expected Date and Material ETA:** Single stored field `expectedDate`. Material ETA is a **display alias** — all writes update `expectedDate` only.

**Timezone:** Date comparisons use **org factory timezone** (org setting; default UTC). “Today” = current date in factory timezone.

##### Type-specific rules

| Type | Expected Date | Actual Date |
|---|---|---|
| **Standard** | Optional while open | Required on Complete; defaults to today (factory TZ) |
| **Approval** | Recommended while Submitted / Under Review / Rejected / pending ack | On Approved (+ ack) or Waived |
| **Material** | Required when In Transit or Partially Received | On Complete (100% receipt) |

##### Validation

| Rule | Behavior |
|---|---|
| Actual Date > today | Hard block |
| Current Planned revision post-setup | Revision Reason required |
| Current Planned after EXF Current Planned | Soft warning |
| Current Planned before sequence predecessor | Soft warning |
| EXF Current Planned revision post-setup | Revision Reason required |

##### Computed indicators (not stored)

| Indicator | Condition |
|---|---|
| **Overdue** | Current Planned not null AND today > Current Planned AND not `isComplete` AND not Skipped/N/A |
| **Late completion** | Actual > Original |
| **Early completion** | Actual < Original (display only) |
| **Forecast slip** | Expected > Current Planned while open |
| **Due today** | Current Planned = today OR Expected = today |

#### Date revision rules

| Context | Revision Reason | Audit |
|---|---|---|
| Initial assignment (planning mode) | No | `TNAItemDateRevision` reason = `Initial Setup` per instance |
| Bulk Backward Planning confirm | No | Per-instance Initial Setup rows + order `TNA_DATES_BULK_CONFIRMED` timeline event with JSON payload (all codes/dates) |
| Current Planned change (post-setup) | Yes | `TNAItemDateRevision` + timeline |
| Expected Date change | No | Timeline only |

**Revision Reason codes** (org-configurable): Mill Delay, Buyer Delay, Capacity Constraint, Quality Issue, Freight Delay, Subcontractor Delay, Planner Adjustment, Other (text required).

#### Copy TNA date rules

- Target **Original Planned** = source **Current Planned** (or Expected if Current null)
- Target **Current Planned** = same value
- Source Original is **never copied**
- Hard gate predecessor FKs **remapped by milestone code** on target order
- `tnaInitialPlanningCompletedAt` = null on target (default)

#### Slippage calculation

| Metric | Formula | When |
|---|---|---|
| Slippage vs original | Actual − Original (days) | Complete |
| Slippage vs current | Actual − Current Planned (days) | Complete |
| Forecast slip | Expected − Current Planned (days) | Open with Expected |
| Overdue days | Today − Current Planned (days) | Overdue only |

Order summary: max overdue days among critical applicable items.

#### Status transitions — Standard type

```
                    ┌──────── Skipped (reason required)
Not Started ──→ In Progress ──→ Complete
     │                │
     └──── N/A         └──── Actual Date required
```

| Transition | Allowed |
|---|---|
| Not Started → In Progress / Complete | Yes; Complete requires Actual Date |
| Any → Skipped | Reason required |
| Any → N/A | Yes |
| Terminal → active | **Reopen only** |

#### Status transitions — Approval type

```
Not Started ──→ Submitted ──→ Under Review ──→ Approved
                              │              ├──→ Approved with Comments ──→ (ack) ──→ complete
                              └──→ Rejected ──→ Submitted (round++)
Not Started / Submitted / Under Review ──→ Waived (Buyer owner; not from Rejected)
```

| Rule | Detail |
|---|---|
| Submitted → Approved | Allowed (skip Under Review); round unchanged |
| Approved with Comments | `isComplete` = false until acknowledgement (userId + timestamp stored) |
| Waived | Only from Not Started, Submitted, Under Review |
| Skipped / N/A | Same as Standard |

#### Status transitions — Material type

```
Not Started ──→ Ordered ──→ In Transit ──→ Partially Received ──→ Complete
                  └──────────── Skipped / N/A
```

| Rule | Detail |
|---|---|
| In Transit → Partially Received | 0% < Receipt % < 100%; expectedDate required |
| In Transit → Complete | Full receipt; Receipt % = 100 |
| **Backward transitions** | **Not allowed** except **Reopen** |

**Qty / Receipt % sync:**

- Both qty set: Receipt % = round(Qty Received / Qty Ordered × 100)
- Receipt % edited: Qty Received derived when Qty Ordered set
- Qty Received > Qty Ordered: soft warning; cap Receipt % at 100 unless planner confirms with note

#### Completion rules

Only `isComplete` = true instances contribute to CP Progress **numerator**.

Skipped / N/A: excluded from denominator entirely — not complete.

#### Reopen rules

Reopen is the **only** path from terminal state to active planning. Reopen reason required.

| Prior state | Reopen to | Fields reset |
|---|---|---|
| Complete (Standard) | In Progress | Actual Date; expectedDate |
| Approved / Waived | Submitted or Not Started | Actual Date; ack cleared; round preserved |
| Approved with Comments (unack) | Under Review | Ack cleared |
| Complete (Material) | In Transit or Ordered | Actual Date; Receipt % / Qty Received per target state |
| Skipped / N/A | Not Started | Skipped reason cleared |

All reopens: recalc cache + risk; timeline `MILESTONE_REOPENED`; increment `version`.

#### Hard gate rules

##### Primary / secondary (V1 limitation)

One `hardGatePredecessorId` per instance. **Primary** predecessor drives Blocked indicator and `HARD_GATE_BLOCK`. **Secondary** predecessors (library defaults) generate `SECONDARY_GATE_INCOMPLETE` (Medium) only.

| Code | Primary | Secondary (soft only) |
|---|---|---|
| CST | BFI | BTI |
| SCP | PER if not N/A, else WGR if not N/A | Other active subcon receive gate |
| EXF | FIN | PCK |

##### Override

Complete while Blocked allowed. Timeline: `HARD_GATE_OVERRIDE` — `"[Code]: completed — hard gate override (predecessor [pred code] incomplete)"`.

##### Circular dependency validation

On save of hard gate FK: reject if cycle in order instance graph.

##### Dependency resolver

Shared algorithm for `MATERIAL_ETA_CONFLICT`, `PARTIAL_RECEIPT`, hard gates:

```
dependents(instance M) =
  instances where hardGatePredecessorId = M.id
  OR library default mapping lists M.code as primary/secondary for instance.code
```

Evaluate dependents where not Skipped/N/A and not `isComplete`.

#### CP Progress calculation

##### Applicable set

Include all instances not Skipped/N/A. Exclude Skipped/N/A entirely.

##### Weight resolution (template-version-aware)

```
effective_weight =
  instance.weightOverride
  ?? templateItem(order.tnaTemplateVersionId).weightOverride
  ?? libraryItem.defaultWeight
```

Never use latest template version — always order's frozen `tnaTemplateVersionId`.

##### Formula

```
CP Progress = (Σ effective_weight × isComplete) / (Σ effective_weight) × 100
```

If Σ effective_weight = 0 → `cpProgress` = **null**; display "—".

##### Phase breakdown

Per phase, same applicable set filtered by library phase. Phase percentages are independent — not additive to overall CP Progress.

##### Next Critical Gate

First applicable item: `isCritical` = true, `isComplete` = false; sort Current Planned ascending (nulls last).

##### Recalculation scope

On instance save, recompute: changed instance; dependents where changed instance is hard gate predecessor; order KPI cache; risk engine for that order.

#### Human-readable risk generation

##### RiskSignal persistence

Each active signal stored:

| Field | Purpose |
|---|---|
| `signalId` | Catalog ID |
| `tnaItemUuid` | Nullable for order-level signals |
| `severity` | High / Medium |
| `reasonText` | Rendered string |
| `reasonParams` | JSON for ERP — `{code, days, predCode, ...}` |
| `activatedAt` / `deactivatedAt` | Lifecycle |

One active row per `(orderId, signalId, tnaItemUuid)`. Engine deactivate-then-activate each run.

##### Signal catalog (V1)

| Signal ID | Condition | Severity | Supersedes |
|---|---|---|---|
| `OVERDUE` | Overdue indicator | Medium | — |
| `CRITICAL_OVERDUE` | Overdue + isCritical | High | `OVERDUE` (same instance) |
| `EXPECTED_SLIP` | Expected > Current Planned | Medium | — |
| `HARD_GATE_BLOCK` | Primary hard gate not satisfied (rules above) + D Current Planned ≤ today + N | High | — |
| `SECONDARY_GATE_INCOMPLETE` | Secondary predecessor not satisfied | Medium | — |
| `GATE_PREDECESSOR_NOT_APPLICABLE` | Predecessor Skipped (not N/A) + dependent active | Medium | — |
| `MATERIAL_ETA_CONFLICT` | Material expectedDate > dependent D Current Planned | High | — |
| `APPROVAL_REJECTED` | Rejected | High | — |
| `APPROVAL_PENDING` | Submitted/Under Review + overdue | Medium | — |
| `APPROVAL_COMMENTS` | Approved with Comments + not ack | Medium | — |
| `EXF_AT_RISK` | Guarded (below) | High | — |
| `CP_STALL` | today − lastTnaProgressAt ≥ N calendar days | Medium | — |
| `PARTIAL_RECEIPT` | Partially Received + dependent D Current Planned ≤ today + N | Medium | — |

**Instance suppression:** Skipped and N/A generate no signals.

**EXF_AT_RISK** (guarded):

- `tnaInitialPlanningCompletedAt` set AND
- EXF Current Planned ≤ today + N (default 7) AND
- (`cpProgress` < threshold (default 80%) OR Production phase progress = 0%)

**CP_STALL:** Calendar days (not business days in V1). Suppressed when order On Hold.

##### Order Risk Level

| Level | Rule |
|---|---|
| **High** | Any High signal active |
| **Medium** | No High; any Medium signal |
| **None** | No active signals |

V1 removes **Low** level. Display all active `reasonText`, sorted High first, then overdue days descending.

##### Order status suppression

| Status | Effect |
|---|---|
| On Hold | Suppress CP_STALL only |
| Cancelled / Closed | Deactivate all signals; freeze edits |

#### Approval workflows — business rules

| Workflow | Rules |
|---|---|
| Submit | Not Started or Rejected → Submitted |
| Under Review | Submitted → Under Review |
| Approve | Submitted or Under Review → Approved |
| Approve with comments | → Approved with Comments; ack required |
| Reject | → Rejected; reason required |
| Resubmit | Rejected → Submitted; round++ |
| Waive | Not Started / Submitted / Under Review → Waived; Buyer owner; reason required |
| Skip | → Skipped; internal only |

#### Material workflows — business rules

| Workflow | Rules |
|---|---|
| Mark ordered | → Ordered; orderedDate = today |
| Mark in transit | → In Transit; expectedDate required |
| Update ETA | Updates expectedDate; timeline; may trigger MATERIAL_ETA_CONFLICT |
| Partial receipt | → Partially Received |
| Full receipt | → Complete; Receipt % = 100 |
| Chase | Last Chased = today; `CHASE_LOGGED` event |

#### Timeline logging rules

**Append-only:** TimelineEvent never updated or deleted; corrections via compensating events.

**One canonical event per user action** — specific event type wins over generic `STATUS_CHANGED`.

| Event type | Trigger |
|---|---|
| `TNA_CREATED` | Order instantiated from template version |
| `TNA_PLANNING_CONFIRMED` | `tnaInitialPlanningCompletedAt` set |
| `TNA_DATES_BULK_CONFIRMED` | Backward Planning bulk confirm (JSON all codes/dates) |
| `PLANNED_DATE_REVISED` | Current Planned change post-setup |
| `EXPECTED_DATE_UPDATED` | expectedDate change |
| `STATUS_CHANGED` | Only if no more specific type applies |
| `APPROVAL_SUBMITTED` / `REJECTED` / `WAIVED` / `COMMENTS_ACKNOWLEDGED` | Approval transitions |
| `MATERIAL_ETA_UPDATED` | expectedDate change on Material |
| `MATERIAL_PARTIAL_RECEIPT` | → Partially Received |
| `MATERIAL_QTY_CHANGED` | Qty Ordered / Received / UOM change |
| `MILESTONE_COMPLETE` | isComplete false → true |
| `MILESTONE_REOPENED` | Reopen |
| `SKIPPED` / `NA` | Terminal skip/N/A |
| `CHASE_LOGGED` | Last Chased updated |
| `HARD_GATE_OVERRIDE` | Complete while Blocked |
| `WEIGHT_OVERRIDE` / `CRITICAL_OVERRIDE` | Instance override |

Every event: `tnaItemUuid`, milestone code, actor userId, timestamp, payload JSON.

#### Override rules

| Action | Allowed | Audit |
|---|---|---|
| Instance weight / isCritical / hard gate / lead time | Yes | Timeline; reason recommended for weight/critical |
| Complete while hard-blocked | Yes | HARD_GATE_OVERRIDE |
| Reopen | Yes | Reopen reason required |
| Edit on Cancelled / Closed | No | Read-only |
| Edit on On Hold | Yes | CP_STALL suppressed |

#### Configuration points (org settings)

| Config | Default | Notes |
|---|---|---|
| Revision reason codes | Mill Delay, … | Other requires text |
| EXF at-risk days | 7 | EXF_AT_RISK |
| CP Progress threshold | 80% | EXF_AT_RISK |
| Stall days | 5 calendar days | CP_STALL |
| Hard gate lookahead | 3 days | HARD_GATE_BLOCK |
| Signal enable/disable | All enabled | Per signalId |
| Factory timezone | UTC | Date comparisons |
| Default UOM | Meters | Material |
| Skip reason codes | Not Required, Absorbed, Other | Other requires text |
| autoCompleteTnaPlanningOnAllDatesSet | false | Setup boundary |

Severity downgrade (High → Medium) **not allowed** in V1. Signals may be disabled entirely.

Template weight changes apply to **new template version only** — never retroactive (Section 2.2).

#### Module 1 derived outputs

| Field | Source |
|---|---|
| CP Progress | `cpProgress` cache + `calculatedAt` + `businessRuleVersion` |
| Phase breakdown | Phase cache fields + `calculatedAt` |
| Next Critical Gate | `nextCriticalGateCode` / `nextCriticalGateName` + `calculatedAt` |
| Days to Ex-Factory | EXF instance; "Shipped" if EXF complete |
| Risk Level | `riskLevel` cache + `calculatedAt` + `businessRuleVersion` |
| Risk reasons | Active RiskSignal.reasonText list |
| Summary status | Section 2.4 |

#### Domain events (internal — V1)

Emitted on save for future module subscription (no external messaging V1):

| Event | When |
|---|---|
| `TnaItemCompleted` | isComplete false → true |
| `TnaItemReopened` | Reopen |
| `OrderExFactoryCompleted` | EXF completes |
| `TnaPlanningCompleted` | `tnaInitialPlanningCompletedAt` set |
| `OrderRiskLevelChanged` | riskLevel cache changes |

Payload: orderId, tnaItemUuid, milestoneCode, timestamp.

#### Future architecture notes (V1.1+)

| Topic | V1 behavior | Future |
|---|---|---|
| Multi-predecessor hard gates | Primary FK + secondary soft signal | `TNADependency` graph |
| Auto cascade date revision | Manual | Cascade on revision |
| Business days / factory calendar | Calendar days only | `FactoryCalendar` |
| Bulk cross-order milestone update | Not in engine | Module 3 batch |
| Integration idempotency | UUID + event log | sourceSystem + sourceEventId |
| Material qty vs order BOM | Manual | Module 4 validation |
| Capacity conflict signal | Not generated | Module 5 |
| Configurable approval machines | Fixed per type | Type behavior schema |
| Risk rule builder | Fixed catalog | Org rules |
| ERP snapshot export job | KPI cache + RiskSignal | Scheduled export |
| Style/colorway scoped rules | Order-level | Scope filter |
| Low Risk Level | Removed | Informational signals |

---

## Locked: Section 2.4 — Planner Workflow

#### Overview

Section 2.4 defines **how production planners use the TNA** — the step-by-step workflows that turn Section 2.2 structure and Section 2.3 rules into daily practice. Workflows are order-centric (V1: one TNA per order) and align with the production meeting ritual defined in Section 2.1.

Every workflow ends with **Standard Engine Execution** (defined below) when instance or order state is mutated. Throughout this section, **Engine Execution** is shorthand for **Standard Engine Execution**.

#### Standard Engine Execution

Every workflow that mutates TNA instance state or order override state **must** end with this step. Invoked once per save transaction — one deterministic engine pass (Section 2.3).

| Step | Subsystem | Action |
|---|---|---|
| 1 | **Persistence** | Save instance/order changes; optimistic concurrency check (`TNAItem.version`); reject on conflict |
| 2 | **Business Rule Engine** | Compute `isComplete` on changed instances + hard gate dependents; resolve applicable set; calculate CP Progress, phase breakdown, Next Critical Gate, `daysToExFactory`, `lastTnaProgressAt`; write `calculatedAt`, `businessRuleVersion` = `"2.3"` |
| 3 | **Risk Engine** | Deactivate-then-activate `RiskSignal` rows; apply order-status suppression (On Hold, Cancelled, Closed); derive `riskLevel` + `riskReasons` |
| 4 | **Summary status** | Re-evaluate priority order; write derived summary status on order aggregate |
| 5 | **Timeline** | Append canonical event(s) for the user action — append-only; actor `userId` + payload JSON |
| 6 | **Domain events** | Emit where applicable (`TnaPlanningCompleted`, `OrderExFactoryCompleted`, `TnaItemReopened`, etc.) |
| 7 | **Module 1 cache** | Order aggregate KPI fields updated — Module 1 cards read cache only; no client-side recalculation |

**Skipped:** Workflow 5 (Weekly review) when no order is opened and saved — read-only portfolio scan only.

#### Workflow map

Operations are **phase-based and concurrent** — not a strict linear pipeline. Setup may overlap early development updates before Confirm TNA Planning; chase and material updates run outside meetings; delays interrupt any phase.

```
┌─────────────────────────────────────────────────────────────────────┐
│  SETUP PHASE (tnaInitialPlanningCompletedAt = null)                  │
│    Order Created → TNA Instantiation → TNA Setup (Paths A/B/C)       │
│    → Confirm TNA Planning                                            │
└───────────────────────────────┬─────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│  ACTIVE PHASE (concurrent)                                           │
│    Daily / ad-hoc Planner Update Loop (Workflow 4)                   │
│      ├─ Delay branch                                                 │
│      ├─ Chase branch                                                 │
│      ├─ Material branch                                              │
│      ├─ Approval branch                                              │
│      ├─ Hard gate override branch                                    │
│      ├─ SLA / capacity branch (Module 5 handoff)                     │
│      └─ Shipment-prep branch (Module 6 handoff)                      │
│    Weekly Review (Workflow 5)                                        │
│    Structure change / Ownership change (Workflows 8–9)               │
│    Order overrides: On Hold / Resume / Cancel / Close (Workflow 6)   │
│    Reopen (Workflow 7)                                               │
└───────────────────────────────┬─────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│  TERMINAL PHASE                                                      │
│    EXF Complete → OrderExFactoryCompleted → summary status Shipped   │
│    Order Closed (Module 1 manual override)                           │
│    Sample/SMS → Bulk: Close sample → new Repeat order (Workflow 10)  │
└─────────────────────────────────────────────────────────────────────┘
```

#### Dual progress model (Module 1 + TNA)

Module 1 **Overall Progress** and TNA **milestone (gate) completion** are separate data paths. Planners maintain both; the system does not auto-sync them in V1.

| Surface | What it measures | Planner updates when |
|---|---|---|
| **Module 1 Overall Progress** | Quantity-based production progress by stage (Cutting, Sewing, Finishing, Packing) | Floor qty moves — cutting started, sewing output logged |
| **TNA floor milestones (gates)** | Milestone (gate) plan adherence — MCA, PCA, CST, SLA, SCP, PCK, etc. | Milestone (gate) cleared per plan — approval granted, cut started, line allocated, packing done |

**Coordination rules (V1):**

- Completing a **TNA Standard gate** (e.g. CST) is a planner judgment that the milestone is cleared — independent of Overall Progress entry
- **Hard gates** (Section 2.3) still apply — CST blocked until BFI `isComplete`; engine enforces; planner may use hard gate override (Branch 4.7) if production starts with partial fabric
- **Approval milestones (gates)** (MCA, PCA, FIN) complete on approval workflow — not on qty
- **SLA** completes when sewing line is allocated (Branch 4.8) — Module 1 `AssignedProductionLine` remains null in V1; SLA milestone (gate) is the capacity handoff marker
- Daily meeting walks **TNA milestones (gates) first**; Overall Progress updated on Module 1 Order Command Center when qty data is available

#### Module ownership boundaries (V1)

| Module | V1 workflow ownership |
|---|---|
| **Module 1** | Order create; Overall Progress; Quick Notes; Documents; manual overrides (On Hold, Cancelled, Closed); KPI display |
| **Module 2 (this section)** | All TNA instance state — dates, statuses, material receipt, approvals, chase, ownership |
| **Module 3** | Future entry point for pre-meeting queue — V1 fallback defined in Workflow 4 |
| **Module 4** | **No separate material state in V1.** All fabric/trim gate state lives on TNA Material instances. When Module 4 is built, it reads/writes the same `TNAItem` records (or consumes domain events) — does not duplicate BFO/BFI/BTO/BTI status. V1: planner marks BFO/BTO **Ordered** manually on TNA |
| **Module 5** | **No separate capacity state in V1.** SLA gate on TNA is the handoff marker. When Module 5 is built, it reads SLA completion and CST/EXF dates — does not auto-reschedule. V1: planner marks SLA Complete when line allocated |
| **Module 6** | **No separate shipment state in V1.** FIN, SDR, VFB, PCK, EXF are TNA gates. `OrderExFactoryCompleted` fires on EXF Complete. When Module 6 is built, it consumes that event and Module 1 Shipping documents — does not duplicate gate status |

#### Workflow 1: Order creation and TNA instantiation

**Trigger:** Planner creates order in Module 1 — selects Order Type (New Development, Repeat, Repeat with Revision, Sample, SMS).

**System actions:**

1. Assign latest published `TNATemplateVersion` for Order Type
2. Instantiate `TNAItem` per template item — copy defaults: sequence, type, phase, display group, weight, critical flag, owner, hard gate predecessor (remapped to instance FKs by code)
3. Apply default Skipped / N/A flags per template
4. Set all instances to initial status (Standard: Not Started; Approval: Not Started; Material: Not Started)
5. Store `order.tnaTemplateVersionId`, `tnaInitialPlanningCompletedAt` = null
6. Log timeline `TNA_CREATED`
7. **Engine Execution** — initial cache: `cpProgress` = 0 or null, `riskLevel` = None

**Planner actions:** None required immediately — TNA exists but has no dates. Order summary status → **Planning**.

**Repeat with Revision — additional step before setup continues:**

- System presents **revision picker**: development codes {PFS, TPA, LDA, SOA, FBA, TRA, SSA, PPA, TOP, LTP}
- Planner selects which require reset → selected: Not Started; unselected: Skipped (Not Required)

→ Continue to Workflow 2.

#### Workflow 2: TNA setup

**Goal:** Confirm gate list, assign owners, assign dates, complete initial planning. Target time: **< 5 min Repeat** · **< 15 min New Development**.

**Setup sequence (all paths — order matters):**

1. **Confirm gate list** — review Skipped / N/A flags; activate subcon pairs (PES/PER, WGS/WGR) if print/wash required; confirm material gates tracked (BFO/BFI, BTO/BTI); optionally add custom library items
2. **Assign / confirm owners** — internal users on floor gates; external types on BFI, BFO, PPA, FIN, subcon, etc.
3. **Assign dates** — Path A, B, or C below
4. → Workflow 3 (Confirm TNA Planning)

Gate list and N/A confirmation **before** date assignment ensures Backward Planning lead-time chains skip inactive gates.

##### Path A — Backward Planning Assistant (recommended)

1. Planner enters **Ex-Factory date** (from buyer PO) on EXF instance
2. Planner launches Backward Planning Assistant
3. System proposes Current Planned Date per **active** instance using lead time chain (instance → template → library), working back from EXF — Skipped/N/A instances excluded
4. Planner reviews proposed dates — edits any row individually
5. Planner confirms all dates → system sets Original = Current per instance; creates `Initial Setup` revision rows; logs `TNA_DATES_BULK_CONFIRMED` with JSON payload
6. **Engine Execution**
7. → Workflow 3

##### Path B — Copy TNA from previous order

1. Planner selects source order (same Order Type recommended; cross-type allowed with planner review)
2. System copies: instance structure if missing, Current Planned Dates, Expected Dates, owners, Skipped/N/A states — **not** Actual Dates or Complete statuses (all reset to initial status)
3. **Copy rules (Section 2.3):** target Original = source Current; hard gate FKs remapped by code; `tnaInitialPlanningCompletedAt` = null
4. Log timeline `TNA_COPIED` with payload `{sourceOrderId, sourceTemplateVersionId}`
5. Planner adjusts dates and states for differences vs source order
6. **Engine Execution**
7. → Workflow 3

##### Path C — Manual date entry

1. Planner sets EXF date first
2. Planner enters Current Planned Dates row by row (or by display group)
3. Each first assignment sets Original = Current; `Initial Setup` revision logged per instance
4. **Engine Execution** (per save during manual entry)
5. → Workflow 3

##### Order-type setup branches

| Order Type | Setup path | Gate focus |
|---|---|---|
| **New Development** | Path A recommended | Full development group active; PPA and LTP on critical path; expect multiple approval rounds; floor/shipment dates may be confirmed later (post-setup revisions apply) |
| **Repeat** | Path A or B | Development gates Skipped; focus Materials + Floor + Shipment; fastest Confirm |
| **Repeat with Revision** | Path A or B after revision picker (Workflow 1) | Only selected dev gates active; otherwise same as Repeat |
| **Sample** | Path A or C | Development gates only; BFO–PCK N/A; EXF = sample delivery date |
| **SMS** | Path C common | Minimal gate set; fast Confirm |

#### Workflow 3: Confirm TNA Planning

**Trigger:** Planner clicks **Confirm TNA Planning** when satisfied with initial dates and gate list.

**Entry guardrails:**

| Check | Behavior |
|---|---|
| EXF Current Planned Date set | **Required** — Confirm blocked until EXF date assigned |
| All active (not Skipped/N/A) instances have Current Planned Date | **Soft warning** — Confirm allowed; planner acknowledges gaps |
| All `isCritical` active instances have owner assigned | **Soft warning** (default) — org setting `requireCriticalOwnersOnConfirm` can hard-block |
| `cpProgress` denominator = 0 (all Skipped/N/A) | **Soft warning** — Confirm allowed with acknowledgement |

**System actions:**

1. Set `tnaInitialPlanningCompletedAt` = now; record confirming userId
2. Log timeline `TNA_PLANNING_CONFIRMED` with actor userId
3. Emit domain event `TnaPlanningCompleted`
4. **Engine Execution**

5. Order summary status transitions from **Planning** to phase-derived status (outcome of Engine Execution step 4)

**After this point:** all Current Planned Date changes require Revision Reason (Section 2.3).

##### Confirm TNA Planning — reversal rule (V1)

| Rule | Detail |
|---|---|
| **Default** | Confirm is **irreversible** for standard planner roles — no "Unconfirm" button in V1 |
| **Who may revert** | **Org Admin** only (V1); Production Manager role equivalent when org configures it |
| **Revert action** | `Revert TNA Planning Confirm` — sets `tnaInitialPlanningCompletedAt` = null; logs `TNA_PLANNING_REVERTED` with reason + actor |
| **Preconditions** | Order not **Cancelled**, **Closed**, or **Shipped** (EXF `isComplete`); revert reason required (text) |
| **Completion guard (default)** | Revert **blocked** if any instance has `isComplete` = true — org setting `allowTnaPlanningRevertWithCompletions` = true overrides (default: **false**) |
| **Effects on re-enter planning mode** | EXF_AT_RISK suppressed again; Current Planned Date changes no longer require Revision Reason until next Confirm; Original Planned Dates **unchanged** — baseline preserved |
| **Audit** | `TNA_PLANNING_REVERTED` timeline event; domain event `TnaPlanningReverted`; Engine Execution runs |

Standard planners who need to revise dates after Confirm use **Current Planned Date revision with Revision Reason** — not revert.

#### Workflow 4: Planner update loop

**Context:** Parent workflow for all in-flight order updates — daily production meeting, ad-hoc updates between meetings, and typed branches below. Also referred to as the **daily planning cycle** in exception flows below. Each mutating save ends with **Standard Engine Execution**.

##### 4.1 Pre-meeting queue (V1)

Module 3 Dashboard is the future entry point. **V1 fallback:**

1. Open Module 1 order list sorted by **Risk Level** (High first)
2. Secondary sort: **Days to Ex-Factory** ascending
3. Include orders with: overdue critical gates, EXF within 7 days, or CP_STALL signal
4. Cap at portfolio capacity for meeting (planner discretion); defer remainder to ad-hoc updates
5. Open each order → in-meeting sequence (4.2)

##### 4.2 Daily production meeting sequence (per order)

1. **Read risk reasons aloud** from Module 1 KPI card (`calculatedAt` visible if data freshness questioned)
2. **Review Next Critical Gate** — focus discussion
3. **Walk display groups top to bottom:**
   - **Development** — approval statuses, rejections, submissions due
   - **Materials** — ETAs, partial receipts, chase mills
   - **Floor** — TNA gate status + Module 1 Overall Progress (see Dual progress model)
   - **Subcontract** — sent/received dates on PES/PER, WGS/WGR pairs
   - **Shipment** — FIN, SDR, VFB, PCK, EXF (see Shipment-prep branch)
4. **Sort within group:** overdue first → due today → blocked (hard gate) → remainder by Current Planned Date
5. **Apply typed branch** as needed (4.3–4.9) for each item updated
6. **Engine Execution**
7. Proceed to next order in queue (4.1) or end meeting

**Typical duration:** 2–5 min per active order; 30–60 min full meeting.

**Between meetings:** Same branches apply ad-hoc — chase, material receipt, approval updates do not require meeting context.

##### Production Meeting Output

Expected artifacts after each daily production meeting (per order touched + meeting-level):

**Per order saved:**

| Artifact | Location | Content |
|---|---|---|
| Updated TNA instances | TNA panel (Order Command Center) | Status, dates, qty, notes, Last Chased changes from branches 4.3–4.9 |
| Timeline events | Module 1 Production Timeline | Append-only audit — one canonical event per action (`PLANNED_DATE_REVISED`, `CHASE_LOGGED`, `MILESTONE_COMPLETE`, etc.) |
| KPI cache refresh | Order aggregate → Module 1 KPI cards | `cpProgress`, phase breakdown, `nextCriticalGateCode/Name`, `riskLevel`, `riskReasons`, `daysToExFactory`, `calculatedAt`, `businessRuleVersion` |
| RiskSignal lifecycle | Order aggregate | Prior signals deactivated; active signals reflect current state |
| Summary status | Module 1 order header | Re-derived phase status (Pre-Production, In Production, Shipment Prep, etc.) |
| Quick Notes (optional) | Module 1 | Escalations from EXF_AT_RISK, capacity conflicts, management visibility |
| Overall Progress (optional) | Module 1 | Qty updates if floor data discussed (Dual progress model) |
| Shipping documents (optional) | Module 1 Documents | Uploads when SDR/docs gates updated (branch 4.9) |

**Meeting-level (planner-maintained V1 — not system-generated):**

- Orders reviewed vs deferred from pre-meeting queue (4.1)
- External parties chased today (cross-reference `CHASE_LOGGED` events)
- Escalations requiring follow-up before next meeting (Quick Notes or offline tracker)
- Orders flagged for Weekly Review (Workflow 5) if systemic delay patterns observed

**Quality check before leaving each order:** Module 1 KPI card `calculatedAt` reflects save just performed; risk reasons readable aloud match active `RiskSignal` rows.

##### 4.3 Branch — Delay handling

**Trigger:** Milestone overdue, Expected Date slips past Current Planned, or risk signal fires.

1. Open affected instance — read risk reason text
2. Add **Notes** — root cause (mill delay, buyer rejection, capacity, quality)
3. Update **Expected Date** if new ETA known (no Revision Reason)
4. **Decision:** commitment unchanged → stop at Expected Date; commitment changed → revise **Current Planned Date** (Revision Reason required post-setup)
5. Optionally revise downstream Current Planned Dates manually (no auto cascade V1)
6. Set **Last Chased** if external owner
7. If EXF_AT_RISK: add Module 1 **Quick Note** (recommended for management visibility)
8. **Engine Execution** → return to Daily Planning Cycle (4.2 or ad-hoc)

##### 4.4 Branch — Chase external parties

**Trigger:** External-owned instance overdue or Expected Date approaching.

**Eligible external owner types:** Buyer, Fabric Mill, Trim Supplier, Testing Lab, Subcontractor.

1. Identify instances — filter TNA by external owner type or read risk reason text
2. Contact external party (outside FactoryFlow V1)
3. Update Expected Date / approval status / material status based on response
4. Set **Last Chased** = today → `CHASE_LOGGED` timeline event
5. **Engine Execution** → return to Daily Planning Cycle (4.2 or ad-hoc)

Chase updates **Last Chased** only — does not change owner (see Workflow 9 for ownership change).

##### 4.5 Branch — Material receipt update

**Trigger:** Fabric or trim status change — order placed, in transit, or received.

**V1 ownership:** All material gate state on TNA (Module 4 boundary above). Planner performs all transitions manually.

1. Open BFI or BTI instance (or BFO/BTO for Ordered / In Transit)
2. **Not Started → Ordered:** mark Ordered; `orderedDate` = today
3. **Ordered → In Transit:** enter ETD, `expectedDate` (ETA)
4. **In Transit → Partially Received:** enter Qty Received, Receipt %, Notes
5. **Partially Received → Complete:** Receipt % = 100; Actual Date
6. **Engine Execution** → return to Daily Planning Cycle (4.2 or ad-hoc)

##### 4.6 Branch — Approval status update

**Trigger:** Buyer or internal feedback on lab dip, PP sample, TOP, FRI, etc.

**Standard transition:**

1. Open approval instance
2. Transition per Section 2.3 (Submitted → Under Review → Approved / Rejected / Approved with Comments / Waived)
3. Enter rejection reason, waived reason, or acknowledgement as required
4. Update Expected Date while waiting
5. **Engine Execution** → return to Daily Planning Cycle (4.2 or ad-hoc)

**Rejection loop (multi-round):**

```
Rejected
  → Planner adds Notes (root cause)
  → Update Expected Date (revised buyer feedback ETA)
  → Decision: plan unchanged vs revise Current Planned Date (Revision Reason post-setup)
  → Resubmit (Rejected → Submitted; round++)
  → Repeat until Approved / Waived / Skipped (internal)
```

**Waived vs Skipped decision:**

| Situation | Action |
|---|---|
| Buyer explicitly waives gate | **Waived** — reason required; Buyer external owner |
| Internal decision gate not needed | **Skipped** — Skipped reason required |
| Absorbed into another milestone | **Skipped** — reason: Absorbed into Another Milestone |

##### 4.7 Branch — Hard gate override

**Trigger:** Planner must complete a milestone (gate) while primary hard gate predecessor is not `isComplete` (e.g. CST with partial BFI, EXF with FIN pending, FIN before PCK).

**Decision tree:**

1. Can predecessor complete soon without override? → Wait or chase (4.4) — do not override
2. Is risk acceptable with documented exception? → Override
3. Was predecessor marked Complete in error? → Reopen predecessor (Workflow 7) instead

**Override steps:**

1. Mark gate Complete + Actual Date while Blocked indicator shown
2. Enter override note (required)
3. **Engine Execution** — timeline `HARD_GATE_OVERRIDE` with predecessor code in payload
4. Return to Daily Planning Cycle (4.2 or ad-hoc) — downstream gates unblocked

##### 4.8 Branch — SLA / capacity (Module 5 handoff)

**Trigger:** Order approaching cutting/floor phase; capacity allocation decision needed.

1. Before or at CST: review **SLA (Sewing Line Allocated)** gate
2. When production line assigned (offline decision V1): mark SLA **Complete** + Actual Date
3. If capacity conflict blocks plan: revise affected Current Planned Dates with Revision Reason **Capacity Constraint**; optionally add Module 1 Quick Note
4. **Engine Execution** → return to Daily Planning Cycle (4.2 or ad-hoc)

Module 1 `AssignedProductionLine` remains null in V1 — SLA gate is the planner-recorded allocation marker.

##### 4.9 Branch — Shipment preparation (Module 6 handoff)

**Trigger:** Order enters Shipment Prep summary status; FIN / docs / freight gates become active.

**Sequence (planner-driven, no automation):**

1. **FIN (Final Inspection)** — approval branch (4.6); rejection loop applies
2. **SDR (Shipping Docs Ready)** — Standard gate; attach docs to Module 1 **Shipping** category when submitted
3. **VFB (Vessel / Freight Booked)** — Standard gate; chase forwarder via 4.4 if external
4. **PCK (Packing Complete)** — Standard gate; hard gate for EXF (secondary)
5. **EXF (Ex-Factory)** — Standard gate; Complete + Actual Date → emit `OrderExFactoryCompleted`; summary status → **Shipped**
6. **Engine Execution** → return to Daily Planning Cycle (4.2 or ad-hoc) unless EXF completed (terminal for active phase)

Do not mark EXF Complete while FIN incomplete unless hard gate override (Branch 4.7) with documented reason.

Future Module 6 consumes `OrderExFactoryCompleted` and Shipping documents — does not duplicate gate state in V1.

#### Exception flow — return to Daily Planning Cycle

Exception workflows interrupt the daily loop but **always return to Workflow 4** unless the order reaches a terminal override state (Cancelled, Closed, Shipped).

```
                    ┌──────────────────────────────────────┐
                    │   Workflow 4 — Daily Planning Cycle   │
                    │   (4.1 queue → 4.2 meeting → save)    │
                    └───────────────┬──────────────────────┘
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          │                         │                         │
          ▼                         ▼                         ▼
   Branch 4.3 Delay          Workflow 7 Reopen        Workflow 8 Structure
   Branch 4.7 Override       (undo terminal)          change (gate list)
   Workflow 9 Ownership
          │                         │                         │
          └─────────────────────────┼─────────────────────────┘
                                    │
                                    ▼
                         Standard Engine Execution
                                    │
                                    ▼
                    ┌──────────────────────────────────────┐
                    │   Return to Workflow 4                │
                    │   • Next order in meeting (4.2)       │
                    │   • Same order — continue walk        │
                    │   • Ad-hoc update outside meeting     │
                    └──────────────────────────────────────┘

Terminal exits (no return to Workflow 4):
  • Workflow 6 Cancel / Close → TNA frozen
  • Branch 4.9 EXF Complete → Shipped (active planning complete)
  • Workflow 10 sample Closed → new bulk order starts Workflows 1–3
```

| Exception | Entry trigger | After Engine Execution |
|---|---|---|
| Delay (4.3) | Overdue, slip, risk signal | Return to 4.2 — same or next order |
| Hard gate override (4.7) | Complete while Blocked | Return to 4.2 — downstream milestones (gates) now actionable |
| Reopen (7) | Terminal state error | Return to 4.2 — gate active again; may trigger Delay branch |
| Structure change (8) | Add gate, Skipped/N/A toggle, weight/critical | Return to 4.2 — CP Progress / Next Critical Gate may shift |
| Ownership change (9) | Reassign internal/external owner | Return to 4.2 — chase list attribution updated |
| On Hold (6) | Buyer pause, embargo | TNA still editable; return to 4.2 when planner resumes work |
| Resume (6) | Clear On Hold | Return to 4.2 — CP_STALL eligible again |

**Rule:** Exception flows do not bypass Standard Engine Execution. Every mutating save runs the full engine pass before returning to the daily cycle.

#### Workflow 5: Weekly review

**Context:** Complements daily meeting — cross-order lookahead; not a TNA edit session unless issues found.

**Cadence:** Weekly (typical: Monday before daily meeting).

**Steps:**

1. **Ex-factory lookahead** — Module 1 order list filtered to EXF Current Planned within 14 days; sort by risk then date
2. **Material ETA roll-up** — across active orders, list BFI/BTI instances with Expected Date this week; identify MATERIAL_ETA_CONFLICT risks
3. **Stall check** — orders with CP_STALL signal; confirm still active vs candidates for On Hold (Workflow 6)
4. **Capacity spot-check** — orders entering CST/SLA this week; verify SLA marked or plan revision scheduled (4.8)
5. **Action:** orders needing date revision → open order → Delay branch (4.3); orders needing chase → Chase branch (4.4); no bulk cross-order update in V1

**Output:** Meeting agenda priorities for the week; optional Module 1 Quick Notes on escalations. No new automation — planner drives all changes per order.

**Engine Execution:** Only when an order is opened and saved during step 5 actions — same as Workflow 4. Read-only scan (steps 1–4) triggers no engine run.

#### Workflow 6: Order lifecycle overrides

**Context:** Module 1 manual overrides — affect TNA editability and risk suppression (Section 2.3).

##### Place On Hold

**Trigger:** Buyer pause, material embargo, quality stop, capacity reprioritization.

1. Planner sets order **On Hold** in Module 1
2. Add **Quick Note** with hold reason (recommended)
3. TNA remains editable; CP_STALL suppressed; other risk signals continue
4. Log timeline `ORDER_ON_HOLD` with reason payload
5. **Engine Execution** — risk suppression applied; TNA edits remain available

##### Resume from On Hold

1. Planner clears On Hold in Module 1
2. Review TNA dates — revise Current Planned Dates if hold duration requires replan (Revision Reason post-setup)
3. Log timeline `ORDER_RESUMED`
4. **Engine Execution** → return to Daily Planning Cycle (4.2 or ad-hoc)

##### Cancel order

1. Planner sets order **Cancelled** in Module 1
2. Add Quick Note with cancel reason (recommended)
3. TNA frozen — no edits; all risk signals deactivated
4. Log timeline `ORDER_CANCELLED`
5. **Engine Execution** — summary status → **Cancelled**; no return to daily cycle

##### Close order

1. Planner sets order **Closed** in Module 1 manual override
2. Distinct from summary status **Complete** (all gates done) and **Shipped** (EXF done)
3. Used for: Sample/SMS completion, cancelled production after partial work, administrative close
4. TNA frozen; risk signals deactivated
5. Log timeline `ORDER_CLOSED`
6. **Engine Execution** — terminal; no return to daily cycle

#### Workflow 7: Reopen milestone

**Trigger:** Gate completed in error; buyer reopens approval; material receipt reversed; planner must undo terminal state.

**Reopen is the only path from terminal to active** (Section 2.3). Not the same as hard gate override.

| Prior state | Reopen to | Planner steps |
|---|---|---|
| Complete (Standard) | In Progress | Reopen reason → Actual Date cleared; expectedDate cleared |
| Approved / Waived | Submitted or Not Started | Reopen reason → Actual Date cleared; ack cleared; round preserved |
| Approved with Comments (unack) | Under Review | Ack cleared |
| Complete (Material) | In Transit or Ordered | Reopen reason → Actual Date cleared; Receipt % / Qty per target state |
| Skipped / N/A | Not Started | Skipped reason cleared |

**Steps:**

1. Open instance → select Reopen → enter **reopen reason** (required)
2. **Engine Execution** — timeline `MILESTONE_REOPENED`
3. If dates no longer valid: revise Current Planned Date (Revision Reason post-setup) → **Engine Execution** again
4. Return to Daily Planning Cycle (4.2 or ad-hoc)

#### Workflow 8: Structure change (mid-life TNA)

**Trigger:** Gate list must change after Confirm TNA Planning — add custom item, toggle Skipped/N/A, override weight or critical flag.

**Steps:**

1. **Add custom library item** — system creates instance from library; planner assigns sequence, owner, dates (first assignment = Initial Setup if planning mode; post-setup = Revision Reason on Current Planned)
2. **Skipped → Active** — clear Skipped; set Not Started; assign dates; may fire `GATE_PREDECESSOR_NOT_APPLICABLE` on dependents if upstream Skipped
3. **Active → N/A** — mark N/A; excluded from CP Progress; hard gate N/A predecessor rules apply
4. **Active → Skipped** — Skipped reason required
5. **Weight / isCritical override** — instance override; timeline `WEIGHT_OVERRIDE` / `CRITICAL_OVERRIDE`; reason recommended
6. **Engine Execution** → return to Daily Planning Cycle (4.2 or ad-hoc)

Structure changes do not reset `tnaInitialPlanningCompletedAt`.

#### Workflow 9: Ownership change

**Trigger:** Internal reassignment (planner leave, role change) or external party change (mill switch, buyer contact change).

**Distinct from Chase (4.4)** — updates who owns the gate, not when they were last contacted.

**Steps:**

1. Open instance → change owner:
   - **Internal:** assign factory user or role
   - **External:** change external owner type (Buyer, Fabric Mill, Trim Supplier, Testing Lab, Subcontractor)
2. Enter **ownership change reason** (required)
3. **Engine Execution** — timeline `OWNER_CHANGED` with payload `{previousOwner, newOwner, reason}`
4. **Last Chased** preserved — not cleared on ownership change
5. Return to Daily Planning Cycle (4.2 or ad-hoc)

Bulk ownership change across orders: not in V1 — per instance only.

#### Workflow 10: Sample / SMS → Bulk conversion

**Trigger:** Sample or SMS approved; buyer places bulk production order.

**This is not an in-place conversion** — bulk is a new order lifecycle.

1. Complete Sample/SMS development gates and EXF on sample order
2. Set sample order **Closed** in Module 1 (Workflow 6) — production gates remain N/A
3. Create new **Repeat** (or Repeat with Revision) order in Module 1
4. Run Workflow 2 **Path B — Copy TNA** from sample order — copy dates/owners as starting point; reset statuses; adjust for bulk PO (EXF, quantities, material gates active)
5. Confirm TNA Planning on new order (Workflow 3)
6. Continue Active phase on bulk order — **Engine Execution** on each setup/daily save per Workflows 2–4

#### Summary status (Module 1 derived)

Summary status is **derived from TNA state** — planner does not set directly except via order overrides (On Hold, Cancelled, Closed).

**Evaluation order (first match wins):**

| Priority | Condition | Summary status |
|---|---|---|
| 1 | Order Cancelled | **Cancelled** |
| 2 | Order Closed | **Closed** |
| 3 | Order On Hold | **On Hold** |
| 4 | EXF `isComplete` | **Shipped** |
| 5 | `tnaInitialPlanningCompletedAt` null | **Planning** |
| 6 | Any Shipment display group instance active (not Skipped/N/A) and not all complete | **Shipment Prep** |
| 7 | Any Floor or Subcontract instance active and not all complete | **In Production** |
| 8 | Any Development or Materials instance active and not all complete | **Pre-Production** |
| 9 | All applicable instances complete | **Complete** |

**Active** = not Skipped, not N/A, not `isComplete`.

Summary status recalculates on same engine run as KPI cache; stored on order aggregate with `calculatedAt`.

**Note:** **Complete** (priority 9) can occur before EXF if shipment gates are incorrectly marked done — planner should follow Shipment-prep sequence (4.9). **Shipped** requires EXF `isComplete`.

#### Workflow constraints (V1)

| Constraint | Rule |
|---|---|
| Bulk cross-order milestone update | Not in V1 — update per order |
| Auto cascade on delay | Manual only |
| Buyer notifications | Outside FactoryFlow — planner chases manually |
| Edit on Cancelled / Closed | Frozen |
| Bulk ownership change | Not in V1 — per instance (Workflow 9) |
| CSV import | V1.1 |

#### Workflow Trigger Matrix

Maps each workflow to engine subsystems and Module 1 side effects. **●** = always runs on mutating save; **○** = conditional; **—** = no run.

| Workflow | Business Rule Engine | Timeline | CP Progress | Risk Engine | Module 1 updates |
|---|---|---|---|---|---|
| **Workflow 1** Instantiation | ● `isComplete`, applicable set | ● `TNA_CREATED` | ● Initial (0 or null) | ● Initial (None) | ● Summary status → Planning; KPI cache initialized |
| **Workflow 2** Setup (paths A/B/C) | ● Dates, Next Critical Gate | ● `TNA_DATES_BULK_CONFIRMED`, `Initial Setup` revisions, `TNA_COPIED` | ● Recalc (dates only) | ○ Pre-confirm (EXF_AT_RISK suppressed) | ○ Summary status stays Planning until Confirm |
| **Workflow 3** Confirm TNA Planning | ● Full pass; EXF_AT_RISK eligible | ● `TNA_PLANNING_CONFIRMED` | ● Full recalc | ● Full regeneration | ● Summary status → phase-derived; KPI cards refresh |
| **Workflow 3 revert** (Org Admin) | ● EXF_AT_RISK suppressed again | ● `TNA_PLANNING_REVERTED` | ● Recalc | ● Regenerate without EXF_AT_RISK | ● Summary status → Planning |
| **Workflow 4** Daily loop + branches | ● Per touched instance + dependents | ● Per action (Section 2.3 catalog + Section 2.4 extensions) | ● Recalc | ● Deactivate-then-activate signals | ● KPI cache, summary status, optional Quick Notes / Overall Progress / Documents |
| **Workflow 5** Weekly review | — (read-only scan) | — | — | — | — unless order opened and saved in step 5 (then same as Workflow 4) |
| **Workflow 6** On Hold | ● Suppression rules | ● `ORDER_ON_HOLD` | — (no CP change) | ● CP_STALL suppressed | ● Summary status → On Hold; optional Quick Note |
| **Workflow 6** Resume | ● Full pass | ● `ORDER_RESUMED` | ● Recalc | ● CP_STALL re-enabled | ● Summary status → phase-derived |
| **Workflow 6** Cancel / Close | ● Freeze | ● `ORDER_CANCELLED` / `ORDER_CLOSED` | — | ● All signals deactivated | ● Summary status → Cancelled / Closed; optional Quick Note |
| **Workflow 7** Reopen | ● Terminal → active; dependents | ● `MILESTONE_REOPENED` | ● Recalc (numerator changes) | ● Regenerate | ● KPI cache, summary status |
| **Workflow 8** Structure change | ● Applicable set may change | ● `SKIPPED`, `NA`, `WEIGHT_OVERRIDE`, `CRITICAL_OVERRIDE` | ● Recalc (denominator/weight) | ● Regenerate | ● KPI cache, Next Critical Gate, summary status |
| **Workflow 9** Ownership change | — (no rule change) | ● `OWNER_CHANGED` | — | ● Attribution / overdue re-eval | — |
| **Workflow 10** Sample → Bulk | ● On new order saves (Workflows 1–3, then 4) | ● `ORDER_CLOSED` + new order events | ● New order from scratch | ● New order | ● Sample Closed; new order Planning → active |

**New timeline events (Section 2.4 extensions):** `TNA_COPIED`, `TNA_PLANNING_REVERTED`, `ORDER_ON_HOLD`, `ORDER_RESUMED`, `ORDER_CANCELLED`, `ORDER_CLOSED`, `OWNER_CHANGED` — append-only; actor `userId` + payload JSON on all.

---

## Locked: Section 2.5 — Planner UX

#### Purpose

Section 2.5 defines **how planners interact with the TNA inside the Order Command Center** (Module 1). It covers layout, editing patterns, visual hierarchy, and interaction design — not business rules (Sections 2.1–2.4) or org admin configuration (Section 2.6).

The TNA panel is the **primary working surface** during daily production meetings. UX must optimize for speed, readability at a glance, and keyboard-driven updates while a team watches a shared screen.

#### Design philosophy

| Principle | UX implication |
|---|---|
| **TNA-first** | The TNA panel is the largest editable region on the order page — not buried behind tabs |
| **Meeting-native** | Layout mirrors Workflow 4 walk order: risk → Next Critical Gate → display groups top to bottom |
| **Plain language** | Risk reasons, labels, and status text use Section 2.1 terminology — readable aloud without translation |
| **Never color alone** | Risk Level uses text reasons + icon/badge; overdue and blocked states always include a text label (Module 1 principle) |
| **Planner controls the plan** | System proposes (Backward Planning Assistant); planner confirms every change — no silent auto-save of bulk dates |
| **Cache is truth on display** | KPI cards and risk reasons read server cache (`calculatedAt` visible) — UI never recalculates CP Progress or Risk Level client-side |
| **Type-aware rows** | Standard, Approval, and Material milestones (gates) expose different collapsed and expanded fields |
| **Density with clarity** | Apparel planners manage 30–35 rows per order; default view is compact but scannable — detail on expand or focus |

#### Screen hierarchy — Order Command Center

Module 1 is a **single-page command center** (no tabs). TNA lives on the same scrollable order view as KPI cards, styles, progress, documents, notes, and timeline.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Order header — PO ref, buyer, style, summary status, Order Type         │
│                 manual overrides: On Hold · Cancel · Close (Workflow 6)  │
├─────────────────────────────────────────────────────────────────────────┤
│  Meeting queue bar — ← Previous Order · Next Order · Back to list        │
├─────────────────────────────────────────────────────────────────────────┤
│  KPI cards — Days to Ex-Factory · Overall Progress · CP Progress · Risk  │
│              (Risk: reasonText list — each links to TNA row)             │
├─────────────────────────────────────────────────────────────────────────┤
│  Next Critical Gate callout — code, name, Current Planned Date, owner    │
├─────────────────────────────────────────────────────────────────────────┤
│  TNA panel — sticky header (toolbar + primary actions)                   │
│    display groups · type-aware collapsed rows · expanded edit            │
├─────────────────────────────────────────────────────────────────────────┤
│  Overall Progress entry (Module 1 — qty by stage)                        │
├─────────────────────────────────────────────────────────────────────────┤
│  Quick Notes · Documents · Production Timeline                           │
└─────────────────────────────────────────────────────────────────────────┘
```

##### Sticky regions

| Region | Sticky behavior |
|---|---|
| Order header | Pins to top of page |
| Meeting queue bar | Pins below order header |
| KPI cards + Next Critical Gate | Pin below meeting queue bar when scrolling |
| **TNA panel header** | Pins below KPI region — **toolbar, filters, and primary actions always visible** while scrolling milestone (gate) rows |
| Display group headers | Sticky within TNA row scroll area (below TNA panel header) |

**Order states:**

| Order state | TNA panel behavior |
|---|---|
| **Planning** (`tnaInitialPlanningCompletedAt` null) | Setup mode banner; Confirm TNA Planning action prominent; Revision Reason not required on Current Planned edits |
| **Active** (post-Confirm) | Full daily editing; Revision Reason on Current Planned changes |
| **On Hold** | Editable; CP_STALL suppressed in risk display — banner shows On Hold |
| **Cancelled / Closed** | Read-only; muted styling; all inputs disabled |

#### Workflow entry points (UX map)

Maps locked Section 2.4 workflows to UI locations. No new actions beyond Section 2.3 allowed transitions.

| Workflow / action | UI entry point |
|---|---|
| **On Hold** (Workflow 6) | Order header → **More** (⋯) → **Place On Hold** |
| **Resume** (Workflow 6) | Order header → **More** → **Resume** (when On Hold) |
| **Cancel order** (Workflow 6) | Order header → **More** → **Cancel Order** — confirmation dialog |
| **Close order** (Workflow 6) | Order header → **More** → **Close Order** — confirmation dialog |
| **Reopen** (Workflow 7) | Row ⋯ menu · expanded row footer (terminal states only) |
| **Hard gate override** (Branch 4.7) | Expanded row footer when **Blocked** · row ⋯ menu when Blocked |
| **Ownership change** (Workflow 9) | Row ⋯ menu · inline Owner field edit → reason modal |
| **Structure change** (Workflow 8) | TNA panel header → **Add milestone (gate)**; row ⋯ → **Set Skipped / Set N/A / Clear Skipped**; expanded row → weight / critical overrides |
| **Chase** (Branch 4.4) | Collapsed row **Chase today** · keyboard `C` |
| **Revert TNA Planning Confirm** (Section 2.4, Org Admin) | TNA panel header → **More** → **Revert Planning Confirm** — permission-gated |

#### Meeting navigation (V1)

Minimal meeting queue for Workflow 4.1 — **not** a Module 3 dashboard.

| Element | Behavior |
|---|---|
| **Previous Order** | Navigate to prior order in current list sort (Risk Level → Days to Ex-Factory) |
| **Next Order** | Navigate to next order in same sort |
| **Back to list** | Return to Module 1 order list — **preserves list filters and sort** |
| **Queue context** | Show "Order 3 of 12" when list context available |
| **Unsaved guard** | Warn before navigation if unsaved TNA changes (see Unsaved changes UX) |

List sort and filter state stored in session when entering an order from the list.

#### TNA panel layout

##### Panel header (sticky)

| Element | Behavior |
|---|---|
| **Panel title** | "TNA" — org label preference in Section 2.6 |
| **Template version** | Read-only subtitle — Order Type + frozen template version (Section 2.2) |
| **Planning mode badge** | Visible until Confirm TNA Planning |
| **Primary actions** | **Backward Planning Assistant** · **Copy TNA** · **Confirm TNA Planning** · **Add milestone (gate)** |
| **Toolbar** | Filter · Sort · Search · Column chooser · Expand/Collapse all display groups |
| **Unsaved indicator** | Footer badge: "**N unsaved changes**" + **Save TNA** when dirty rows exist |

##### Row list structure

Milestone (gate) rows grouped by **display group** (Section 2.2):

```
▼ Development          (3 active · 1 overdue)
    POC  PO Confirmed           ...
    PPA  PP Sample Approved  R2 · Rejected   ...
▼ Materials              (2 active)
    BFO  Bulk Fabric Ordered    ─┐
    BFI  Bulk Fabric In-House  62% · ETA 12 Aug ─┘
▼ Floor                  (5 active · 1 blocked)
    [Overall Progress summary — see Dual progress] 
    SLA  Sewing Line Allocated  Capacity marker
    ...
▼ Subcontract            (0 active — collapsed when all N/A)
    PES  Print Sent            ─┐
    PER  Print Received        ─┘
▼ Shipment               (2 active)
    ...
```

- **Display group headers** — sticky below TNA panel header; active + overdue/blocked badges
- **Skipped / N/A rows** — collapsed by default ("4 skipped"); expandable; muted when shown
- **EXF row** — always visible; anchor icon; Current Planned Date emphasized
- **Critical milestones (gates)** — left accent border + bold Name (in addition to ✦ icon)
- **Material pairs (BFO/BFI, BTO/BTI)** — light vertical connector indent between ordered/in-house pair
- **Subcon pairs (PES/PER, WGS/WGR)** — same connector treatment when both active
- **SLA row** — subtle **Capacity** text badge (Module 5 handoff marker — Branch 4.8)

##### Dual progress placement

Module 1 **Overall Progress** remains the full qty entry section below the TNA panel (unchanged).

**Floor display group header** includes a lightweight **production progress summary** — read-only mirror of Module 1 Overall Progress KPI (Cutting · Sewing · Finishing · Packing percentages). Clicking the summary scrolls to the Overall Progress entry section. Planners update qty in Module 1; this strip supports floor discussion without leaving the Floor group.

No duplicate calculation — displays cached Module 1 values only.

##### Milestone (Gate) row — collapsed (type-aware)

Shared columns: **Code** · **Name** · **Owner** · **Status** · **Current Planned** · **Indicators** · **Actions** (expand · ⋯).

Type-specific collapsed fields (no expand required):

| Type | Additional collapsed fields |
|---|---|
| **Standard (external owner)** | **Last Chased** date or "Never" |
| **Standard (internal)** | — |
| **Material** | **Receipt %** · **Expected Date** (ETA) — always visible |
| **Approval** | **Round** (e.g. R2) · **Rejected** or **Comments pending** text badge when applicable |
| **Development group** | **Expected Date** shown when column space allows (Column chooser) |

**Expected Date column:** Visible by default for **Material** milestones (gates). Optional for **Development** via column chooser. Hidden for Floor / Subcontract / Shipment unless toggled on.

**Rejected approval:** Collapsed row uses distinct **Rejected** text badge + round count — not color alone.

**Indicators column:** Overdue · Due today · Blocked · Forecast slip · Secondary gate incomplete — text badges (Section 2.3 signals).

##### Row action menu (⋯)

Actions shown **only when permitted** by Section 2.3 state machine and order status. Disabled actions are hidden, not grayed.

| Menu item | When available | Opens |
|---|---|---|
| **Reopen** | Terminal state (Complete, Approved, Waived, Skipped, N/A, Material Complete) — not Cancelled/Closed order | Reopen dialog — reason required (Workflow 7) |
| **Hard Gate Override** | Row Blocked and planner attempts Complete, or explicitly from menu when Blocked | Override dialog — note required, predecessor shown (Branch 4.7) |
| **Set Skipped** | Active row — internal skip | Skipped reason picker (Workflow 8) |
| **Set N/A** | Active row | Confirmation — no reason (Workflow 8) |
| **Clear Skipped / N/A** | Skipped or N/A row | Returns to Not Started (Workflow 8) |
| **Ownership Change** | Active row — not Cancelled/Closed | Ownership change dialog — reason required (Workflow 9) |
| **View in Timeline** | Always (read-only) | Scroll Production Timeline to latest event for this `tnaItemUuid`; highlight event |

No other row menu items in V1.

##### Milestone (Gate) row — expanded

Expand on click, Enter, or focus. Reveals full type-specific fields (Section 2.2 property model):

| Type | Expanded fields |
|---|---|
| **Standard** | Original Planned · Actual Date · Notes · Last Chased · Chase today |
| **Approval** | Submission date · Rejection reason · Waived reason · Comments acknowledgement · Approval round · Notes |
| **Material** | Qty Ordered / Received · UOM · Receipt % · ETD · ETA · Ordered date · Supplier reference · Notes |

**Expanded row footer:** Save · Cancel · context actions mirroring ⋯ menu when applicable.

**SDR row (Shipment group):** Expanded footer includes **Attach shipping document** — opens Module 1 Documents (Shipping category) upload (Branch 4.9).

#### Risk visualization and navigation

| Surface | UX |
|---|---|
| **KPI Risk card** | Risk Level badge + bulleted `reasonText` list — sorted High first |
| **Risk deep-link** | Each reason is a **link** — click scrolls TNA to originating milestone (gate) row and applies brief focus highlight |
| **Quick Note shortcut** | KPI Risk card footer → **Add Quick Note** — opens Module 1 Quick Note composer (prefilled order context) |
| **calculatedAt** | KPI card — "Updated 2 min ago"; full timestamp on hover |
| **Next Critical Gate** | Callout with scroll-to-row on click; shows owner |
| **Row-level badges** | Overdue · Blocked · Forecast slip · Secondary gate incomplete — text labels |
| **On Hold** | CP_STALL suppressed in display; banner explains |

#### Unsaved changes UX

| Element | Behavior |
|---|---|
| **Dirty row indicator** | Subtle dot on row Code column when row has unsaved edits |
| **Unsaved counter** | TNA panel footer — "**N unsaved changes**" |
| **Save TNA** | Primary footer action — batch save all dirty rows (Workflow 4) |
| **Navigation warning** | Browser / in-app warn before: Previous Order · Next Order · Back to list · leaving order page — if dirty rows exist; options: Save · Discard · Stay |
| **Discard** | Reverts dirty rows to last saved state |

#### Column chooser

Toolbar toggle for optional collapsed columns — persisted per user:

| Column | Default |
|---|---|
| Expected Date (non-Material groups) | Off — on for Development if user enables |
| Original Planned | Off |
| Last Chased (all external rows) | On when external owner |
| Receipt % (Material) | On (always shown — not disableable) |

Does not add new data — toggles visibility only.

#### Planner workspace — setup flows

##### Backward Planning Assistant (modal)

| Step | UX |
|---|---|
| 1 | Confirm EXF date |
| 2 | Proposed dates table — active milestones (gates) only |
| 3 | Inline edit per row; validation per Section 2.3 |
| 4 | **Confirm all dates** saves; **Cancel** discards |

##### Copy TNA · Confirm TNA Planning · Revision picker

Unchanged from prior draft — see Workflow 2–3 (Section 2.4). Confirm guardrails surface as modal checklist.

#### Editing behavior

| Pattern | V1 behavior |
|---|---|
| **Save model** | Per-row or batch **Save TNA** — batch preferred in meetings |
| **Non-blocking save** | Row remains navigable while save in flight; inputs on saving row disabled; other rows editable |
| **KPI refresh** | KPI cards update when save completes and `calculatedAt` changes — no optimistic recalculation |
| **Concurrency** | Version conflict → row banner + **Refresh** |
| **Revision Reason** | Modal on Current Planned change post-Confirm |
| **Frozen order** | Cancelled / Closed — panel read-only |

#### Inline editing

Dates · status · owner · material qty · notes · Last Chased — per Section 2.5 prior spec. Owner edit triggers Ownership change flow when owner type changes.

#### Keyboard-first workflow

| Key | Action |
|---|---|
| `↓` / `↑` | Move focus between rows |
| `Enter` | Expand row / edit primary field |
| `Esc` | Collapse / cancel |
| `Tab` / `Shift+Tab` | Fields in expanded row |
| `Ctrl+S` / `⌘+S` | Save row or batch |
| `/` | Focus search |
| `1`–`5` | Jump to display group |
| `C` | Chase today (external row) |
| `[` / `]` | Previous / Next order (when meeting queue focused) |

#### Filters

| Filter | Scope |
|---|---|
| **Active only** | Hide Skipped / N/A |
| **Overdue** | Current Planned past today |
| **Due today** | Current Planned or Expected = today |
| **Due this week** | Current Planned or Expected within next 7 calendar days |
| **Needs chase** | External owner + overdue or forecast slip + Last Chased not today |
| **Blocked** | Hard gate not satisfied |
| **Critical only** | `isCritical` = true |
| **External owner type** | Buyer · Fabric Mill · Trim Supplier · Testing Lab · Subcontractor |
| **My items** | Internal owner = current user |
| **Incomplete** | not `isComplete` |

Active filters show chips; **Clear filters** one click. State persists per order session.

#### Sorting · Search · Display groups

Unchanged — meeting order default; search across Code, Name, Notes, party name, supplier reference. Display group color headers per prior spec.

#### Production meeting usability

| Need | UX solution |
|---|---|
| Shared screen | Compact rows; 14px minimum body; high contrast |
| Read aloud | Risk reasons verbatim; names not truncated |
| Fast complete | **Mark complete today** on Standard rows |
| Chase | **Chase today** + Last Chased in collapsed external rows |
| Multi-order | Meeting queue bar; KPI refresh on save |
| Risk → row | Deep-link from KPI card |

##### Post-save feedback

On successful **Save TNA**, show confirmation panel (toast + expandable detail):

| Message | Display |
|---|---|
| **Timeline updated** | "N timeline events recorded" — link scrolls to Production Timeline |
| **CP Progress recalculated** | Show new CP Progress % + phase breakdown |
| **Risk recalculated** | Show Risk Level + count of active reasons |
| **Last updated** | Show `calculatedAt` as friendly timestamp ("Updated just now") |

No engine internals exposed — planner-facing outcomes only (Section 2.4 Production Meeting Output).

#### Mobile and tablet (V1)

Desktop primary (1280px+). Tablet landscape supported. Phone / tablet portrait: **read-only** — banner "Use desktop to update TNA."

#### Accessibility (V1 baseline)

WCAG 2.1 AA · aria-labels on icon controls · `aria-live="polite"` on KPI region after save · keyboard full path · modal focus trap · factory timezone on date labels.

#### Performance expectations

| Operation | Target (P95) |
|---|---|
| Order page load | < 1.5 s |
| Single row save | < 800 ms |
| Batch save (≤ 10 rows) | < 1.5 s |
| Backward Planning propose | < 2 s |
| Filter / sort / search | < 100 ms |

Non-blocking save: planner may focus next row while prior save completes.

#### Empty states

| State | Message / action |
|---|---|
| **New order — TNA instantiating** | Skeleton rows → populated list; "Building TNA from template…" |
| **All Skipped / N/A** | Confirm guardrail warning — "No active milestones (gates)" |
| **No search results** | "No milestones match '[query]'" + Clear search |
| **Filtered to empty** | "No milestones match filters" + Clear filters |
| **Planning — no dates** | Banner + CTA Backward Planning Assistant |
| **Cancelled / Closed** | "This order is [status] — TNA is read-only" |

#### Validation behavior (UX layer)

Surfaces Section 2.3 rules — inline field messages; Revision Reason modal; Confirm guardrail checklist; Override / Reopen dialogs when Blocked or terminal.

#### Error handling

| Error | UX |
|---|---|
| Save failure | Toast + retry; row stays editable |
| Network offline | Banner; disable save |
| 403 permission | Inline message |
| 409 version conflict | Row banner + Refresh |
| Partial batch failure | Failed rows listed; successful rows committed |

#### Loading states

| State | Pattern |
|---|---|
| Initial load | KPI + TNA skeletons |
| Row save | Row spinner; other rows navigable (non-blocking) |
| Batch save | Footer progress "Saving 3 of 7…" |
| Backward Planning | Modal spinner |
| Post-save | KPI pulse until `calculatedAt` updates |
| Copy TNA | Panel overlay spinner |

#### UX principles (summary)

1. Mirror the meeting (Workflow 4)
2. Text before color
3. One workspace — TNA on the order page
4. Type-aware collapsed and expanded rows
5. Confirm before commit
6. Server truth — `calculatedAt` visible
7. Keyboard parity
8. Progressive disclosure
9. Unsaved changes never silent
10. Desktop-first

#### Future UX extensions (V1.1+)

| Extension | Notes |
|---|---|
| Presentation mode | Large-type shared-screen layout |
| Full Gantt / timeline chart | Alternative TNA visualization |
| Module 3 meeting dashboard | Replaces minimal prev/next queue |
| Cross-order bulk update | Workflow constraint lifted |
| Saved filter presets | Persistent named filters |
| Custom column layouts | Org/user layout templates |
| Mobile editing | Full edit on phone/tablet portrait |
| Calendar-aware date pickers | Factory holidays |
| Multi-user presence | Concurrent editor indicators |
| Timeline drawer | Inline audit without scrolling to page bottom |
| Since-last-session summary | Diff banner on order open |
| AI assistance | Deferred |
| Buyer CSV import | Populate TNA dates |
| Gantt drag reschedule | Revision Reason still required |

---

## Locked: Section 2.6 — Organization Configuration

#### Purpose

Section 2.6 defines **administrator configuration** for Module 2 — org settings that control templates, gate library, lead times, weights, reason codes, default behaviors, and permissions. It does **not** redefine planner workflows (Section 2.4) or planner UX (Section 2.5).

**Audience:** Org Admin (V1).

**Principle:** Organizations inherit FactoryFlow **V1 defaults** pre-loaded at tenant provisioning (35-item gate library, five Order Type templates, reason codes, thresholds). Planners can start planning without admin setup.

#### Configuration aggregate

**`OrganizationTnaSettings`** is the aggregate root for Module 2 org configuration. It holds risk/engine defaults, organization behaviors, and FK references to org-scoped child entities (gate library, templates, reason codes). All admin screens read/write through this aggregate.

| Child domain | Primary entities |
|---|---|
| Gate Library | `TNAGateLibraryItem` |
| Templates | `TNATemplate`, `TNATemplateVersion`, `TNATemplateItem`, `TNATemplateWeightRevision` |
| Reason codes | `TNARevisionReason`, Skipped reason codes |
| Audit | `OrgConfigAuditLog` |

#### Tenant isolation

All Module 2 configuration entities are **`organizationId`-scoped**. No org reads or writes another org's library, templates, or settings.

**Platform seed:** FactoryFlow ships a platform master gate library and five Order Type templates. On **tenant provisioning**, the platform seed is **cloned** into the new organization — each organization owns its configuration independently. Platform updates do not auto-modify existing orgs in V1.

**Future-ready (V1.1):** nullable `factoryId` on templates reserved for factory-level overrides — not enabled in V1 (see V1.1 deferrals).

#### Configuration access

| Area | Location | Permission (V1) |
|---|---|---|
| **Module 2 org settings** | FactoryFlow **Org Settings → Critical Path & TNA** | Org Admin |
| **Template publishing** | Same | Org Admin |
| **Gate library edits** | Same | Org Admin |
| **Risk / engine defaults** | Same | Org Admin |
| **Reason codes** | Same | Org Admin |

Planners and Production Managers **cannot** access configuration screens in V1 unless granted Org Admin.

#### System reference data (read-only V1)

The following reference tables are **system-managed** — org admin **cannot** edit rows in V1:

| Entity | Values |
|---|---|
| `TNAPhase` | Pre-Production, Production, Shipment |
| `TNADisplayGroup` | Development, Materials, Floor, Subcontract, Shipment |
| `TNAItemType` | Standard, Approval, Material |

Org admin selects phase, display group, and type **only when creating a custom library item** — not on system default codes.

#### Configuration domains

```
OrganizationTnaSettings (aggregate root)
├── Gate Library          → TNAGateLibraryItem
├── Order Type Templates  → TNATemplate / TNATemplateVersion / TNATemplateItem
├── Lead Times            → library + template item overrides
├── CP Progress Weights   → library + template item overrides
├── Reason Codes          → TNARevisionReason, Skipped reasons
├── Risk & Engine Defaults→ OrganizationTnaSettings fields
├── Organization Behaviors  → OrganizationTnaSettings fields
└── OrgConfigAuditLog       → all admin mutations
```

---

#### Runtime vs instantiation-frozen settings

Every admin setting is classified by **when** it takes effect. The engine (Section 2.3) and order instantiation (Section 2.4 Workflow 1) use this matrix.

| Classification | Meaning |
|---|---|
| **Runtime** | Effective on the **next Business Rule Engine execution** for any order (typically on next instance save). Existing in-flight orders are affected. |
| **Instantiation-Frozen** | Baked into order/template at **creation or publish** — does not retroactively change existing orders or published template versions. |
| **Display-only** | Affects labels and UI only — no engine recalculation. |

##### Configuration behavior matrix

| Setting / entity | Classification | Notes |
|---|---|---|
| **Published `TNATemplateVersion`** | Instantiation-Frozen | Frozen on `order.tnaTemplateVersionId` at order create |
| **Template item overrides** (weight, lead time, critical, owner, skipped/N/A defaults, predecessor) | Instantiation-Frozen | Snapshotted into published version |
| **Library defaults at template publish** | Instantiation-Frozen | Copied into published version snapshot — see Library default resolution |
| **New order template assignment** | Instantiation-Frozen | Latest published version for Order Type |
| `exfAtRiskDays` | Runtime | EXF_AT_RISK guard |
| `cpProgressThreshold` | Runtime | EXF_AT_RISK guard |
| `stallDays` | Runtime | CP_STALL |
| `hardGateLookaheadDays` | Runtime | HARD_GATE_BLOCK |
| **Signal enable/disable** (per `signalId`) | Runtime | Signal may disappear/appear on next engine run |
| `factoryTimezone` | Runtime | **Immediate effect on all date comparisons** — admin UI shows confirmation warning |
| `defaultMaterialUom` | Instantiation-Frozen | Default on new Material instances only |
| `requireCriticalOwnersOnConfirm` | Runtime | Workflow 3 guardrail on next Confirm attempt |
| `allowTnaPlanningRevertWithCompletions` | Runtime | Section 2.4 revert rule |
| `autoCompleteTnaPlanningOnAllDatesSet` | Runtime | Setup boundary |
| **Revision reason codes** (add/deactivate/reorder) | Runtime for picker; historical codes preserved on past revisions | Deactivated codes hidden from picker |
| **Skipped reason codes** | Same as revision codes | |
| **TNA panel label** | Display-only | Section 2.5 |
| **Library item display name / description** | Display-only on existing instances | Instance stores copied name at creation; optional refresh not in V1 |
| **ERP milestone code** (library item) | Display-only for engine | Editable on library item — integration mapping only |
| **Reason code label** | Display-only | Code immutable; label editable |
| **Inactive library item** | Instantiation-Frozen for existing refs | Hidden from new template drafts and picker |

**Note:** Runtime settings do not auto-trigger engine execution — they apply when the engine next runs (planner save, order override, etc.).

---

#### Gate library administration

Manages org-scoped `TNAGateLibraryItem` records (Section 2.2 Layer 1).

##### Default library

FactoryFlow ships **35 default milestones (gates)** with immutable Milestone Codes. Cloned per org at provisioning — all items start **Active**.

##### Library default resolution

| Rule | Behavior |
|---|---|
| **Published template versions** | Contain **frozen snapshots** of library defaults effective at publish time — weight, lead time, owner, critical, predecessor defaults copied or overridden explicitly on template items |
| **Library default changes** | **Never modify** already-published template versions |
| **Effect of library edit** | Applies to **future template drafts** only — unless template item has an explicit override (override wins over library) |
| **Existing order instances** | Unaffected by library default changes — instance fields already copied at instantiation |

##### Gate library lifecycle (aligned with Section 2.2)

| Status | Meaning |
|---|---|
| **Active** | Available for new template drafts and planner "Add milestone" picker |
| **Inactive** | Hidden from new template composition; may reactivate to **Active** |
| **Archived** | **Terminal** — cannot return to Active or Inactive |

**Archived rule:** To replace an archived gate, admin creates a **new library item with a new immutable Milestone Code** — never reactivates the archived row.

Archived items: hidden from new template drafts and picker; existing order instances and published template references unchanged.

##### Admin capabilities (V1)

| Action | Rule |
|---|---|
| **Rename display name** | Allowed — Milestone Code unchanged |
| **Edit description** | Allowed |
| **Edit ERP milestone code** | Allowed — nullable integration mapping key (Section 2.2); display/integration only |
| **Adjust default weight / lead time / owner / critical / predecessor** | Allowed — affects future template drafts only (see Library default resolution) |
| **Add custom library item** | Org-unique Milestone Code — immutable after creation |
| **Deactivate** | Active → Inactive |
| **Archive** | Inactive → Archived (one-way) |
| **Reactivate** | Inactive → Active only — **not** from Archived |

##### Hard-gate validation (library edits)

When admin edits **default hard gate predecessor** on a library item, the system runs the **same dependency validation as Section 2.3** (cycle detection in predecessor graph). **Reject save** if circular dependency detected.

##### Restrictions (Section 2.2)

- Milestone Code **never changes** after creation
- Library items **never physically deleted**
- Type fixed at creation — not editable in V1
- Phase and Display Group editable only at **custom item creation**

---

#### Order Type template administration

Manages `TNATemplate`, `TNATemplateVersion`, `TNATemplateItem` (Section 2.2 Layer 2).

##### V1 template model

One default template per Order Type (New Development, Repeat, Repeat with Revision, Sample, SMS). `TNATemplate.Buyer` is **null** in V1 — buyer layer deferred (V1.1).

##### Published template immutability

| Rule | Behavior |
|---|---|
| **Immutability** | Published `TNATemplateVersion` records are **immutable** after publish |
| **No edit** | Published versions cannot be edited |
| **No delete** | Published versions cannot be deleted |
| **Changes** | Admin must create a **new draft** from latest published, edit, and **publish a new version** |
| **Forward-only (V1)** | **No rollback or unpublish** — supersede by publishing a higher version number |

Existing orders remain on their creation version regardless of new publishes.

##### Template draft workflow (V1)

1. Admin opens latest **published** version → system creates editable **draft** (or resumes existing draft)
2. Admin edits composition — one active draft per template in V1
3. Admin runs **Publish** → validation (below) → publish impact summary → confirm
4. Draft becomes new published version; draft cleared

##### Publish validation

Publishing is **blocked** until all checks pass. Validation runs automatically before publish confirmation.

| # | Check | Error if failed |
|---|---|---|
| 1 | **Ex-Factory gate (EXF)** present in template | "EXF gate required" |
| 2 | **Sequence integrity** — unique sequence numbers, no gaps required but no duplicates | "Duplicate sequence" |
| 3 | **No archived library items** in composition | "Archived gate [code] cannot be added" |
| 4 | **Valid predecessor references** — every hard gate predecessor code exists in template composition | "Predecessor [code] not in template" |
| 5 | **No hard-gate cycles** — same algorithm as Section 2.3 circular dependency validation | "Circular hard-gate dependency" |
| 6 | **At least one active applicable gate** — not all items default Skipped/N/A | "Template has no active gates" |

##### Hard-gate validation (template publish)

Step 5 above uses the Section 2.3 dependency resolver and cycle rejection — identical rules to instance save, applied to the template composition graph before publish.

##### Publish impact summary

Before final publish confirmation, admin sees:

- New version number
- Order Type affected
- **"Applies to new orders only"**
- Count of orders on current published version (informational)
- Change summary (required text field)
- Validation pass indicator

##### Template composition fields

| Field per template item | Configurable on draft |
|---|---|
| Sequence | Yes |
| Default Skipped / N/A | Yes |
| Weight / Critical / Owner / Lead time / Hard gate predecessor overrides | Yes — weight changes logged in `TNATemplateWeightRevision` at publish |

On publish, template items snapshot effective defaults (library default unless overridden).

##### Template versioning summary

| Rule | Behavior |
|---|---|
| **Existing orders** | Frozen on `order.tnaTemplateVersionId` — never retroactive |
| **New orders** | Latest **published** version for Order Type |
| **Audit** | `publishedAt`, `publishedBy`, `changeSummary` on version record |

---

#### Lead times administration

Lead times drive **Backward Planning Assistant** at initial setup only (Section 2.1).

**Resolution at runtime (planner):** instance override → template item override (frozen on published version) → library default (frozen into published snapshot).

| Level | Admin UI | Classification |
|---|---|---|
| Library default lead time | Gate Library → item | Affects future drafts only |
| Template override | Template draft editor | Instantiation-Frozen at publish |

Lead times are **calendar days** in V1. Bulk lead-time editor → V1.1.

---

#### CP Progress weights administration

| Level | Configurable | Audit |
|---|---|---|
| Library default weight | Gate Library → item | `OrgConfigAuditLog` |
| Template weight override | Template draft editor | `TNATemplateWeightRevision` at publish |

Weight on existing orders: frozen via template version + instance overrides — never retroactive (Section 2.2).

---

#### Reason codes administration

##### Revision Reason codes (`TNARevisionReason`)

| Rule | Detail |
|---|---|
| **Code immutability** | Reason **code** immutable after creation |
| **Label** | Display label editable |
| **Add / deactivate / reorder** | Allowed — deactivated codes hidden from picker; historical revisions retain code |
| **Other** | Always available — requires free text (Section 2.3) |
| **Classification** | Runtime (picker); historical records preserved |

##### Skipped reason codes

Same immutability rules — code immutable, label editable, deactivate hides from picker.

##### Reopen · Ownership change reasons

Free text required in V1 — no code list. Optional coded lists → V1.1.

---

#### Risk and engine defaults (`OrganizationTnaSettings`)

Org Admin editable — all **Runtime** unless noted:

| Setting | V1 default | Purpose |
|---|---|---|
| `exfAtRiskDays` | 7 | EXF_AT_RISK |
| `cpProgressThreshold` | 80% | EXF_AT_RISK |
| `stallDays` | 5 calendar days | CP_STALL |
| `hardGateLookaheadDays` | 3 | HARD_GATE_BLOCK |
| `factoryTimezone` | UTC | Date comparisons — **confirmation warning on change** |
| `defaultMaterialUom` | Meters | Instantiation-Frozen — new Material instances |
| Signal enable/disable | All enabled | Per `signalId` — Runtime |
| `requireCriticalOwnersOnConfirm` | false | Workflow 3 guardrail |
| `allowTnaPlanningRevertWithCompletions` | false | Section 2.4 |
| `autoCompleteTnaPlanningOnAllDatesSet` | false | Setup boundary |

**`factoryTimezone` warning:** UI must warn admin that changing factory timezone **immediately affects** all date-based engine calculations (overdue, due today, EXF_AT_RISK, CP_STALL) on next engine run for all orders.

**Not configurable in V1:** severity downgrade; risk reason templates (fixed catalog — Section 2.3).

---

#### Organization behaviors

| Setting | V1 default | Classification |
|---|---|---|
| **TNA panel label** | TNA | Display-only |
| **Revert TNA Planning Confirm** | Org Admin only | Runtime permission |

---

#### Permissions summary (V1)

| Action | Org Admin | Production Manager | Planner |
|---|---|---|---|
| Edit gate library | ✓ | — | — |
| Publish template version | ✓ | — | — |
| Edit reason codes | ✓ | — | — |
| Edit risk / engine defaults | ✓ | — | — |
| Revert TNA Planning Confirm | ✓ | — | — |
| Edit TNA on order | — | ✓ | ✓ |
| Add custom milestone on order | — | ✓ | ✓ |

Production Manager config delegation → V1.1.

---

#### Configuration audit

##### OrgConfigAuditLog

All admin mutations write to **`OrgConfigAuditLog`**:

| Field | Purpose |
|---|---|
| `organizationId` | Tenant scope |
| `entityType` | e.g. `TNAGateLibraryItem`, `OrganizationTnaSettings`, `TNARevisionReason` |
| `entityId` | Target record |
| `fieldName` | Changed field |
| `beforeValue` | JSON — prior value |
| `afterValue` | JSON — new value |
| `actorUserId` | Admin who made change |
| `timestamp` | UTC |

Also logged: template publish (`TNATemplateVersion` record + change summary), `TNATemplateWeightRevision` on weight override at publish.

Runtime settings changes are auditable and affect engine on next run — they do not silently rewrite historical order timeline events.

---

#### V1.1 configuration deferrals

| Item | Notes |
|---|---|
| Factory-level overrides | `factoryId` on templates — reserved |
| Effective-dated configuration | Threshold changes effective from date X |
| Rollback / unpublish template version | Forward-only in V1 |
| Buyer template layer | `TNATemplate.Buyer` |
| Config version snapshots on order | e.g. `orgTnaConfigVersionId` at order create |
| Bulk lead-time editor | Per-item only in V1 |
| Platform-managed library updates | Push to tenants without clone model |
| Risk rule builder | Fixed catalog in V1 |
| Production Manager config delegation | Org Admin only in V1 |
| Gate library import/export | |
| Custom approval state machines | Section 2.3 |
| Role builder for field-level TNA permissions | |

---

#### Relationship to other sections

| Section | Relationship |
|---|---|
| **2.2** | Data model this section administers |
| **2.3** | Engine reads Runtime settings at execution; hard-gate validation shared at publish |
| **2.4** | Workflows consume published templates — not redefined here |
| **2.5** | Planner UX surfaces admin-configured labels and reason pickers |
| **Module 1** | Size scales and Overall Progress weights — separate org settings |

---
## Locked: Section 2.7 — Integration Points

#### Purpose

Section 2.7 defines **integration contracts** between Module 2 (Critical Path & TNA) and adjacent FactoryFlow modules and future ERP systems. It specifies boundaries, data ownership, domain events, synchronization principles, API ownership, security, and failure handling — not business rules (Sections 2.1–2.6).

**Architectural stance:** Module 2 is the **system of record for order-level TNA state**. Other modules **consume** derived outputs and events; they do not maintain parallel milestone state in V1.

**Payload authority:** Section 2.7 defines the **integration envelope and minimum payloads** for domain events. Locked Section 2.3 lists event types and transition triggers; this section supersedes 2.3 for integration payload structure only.

#### Integration architecture principles

| # | Principle |
|---|---|
| 1 | **Single source of truth per domain** — each data element has one owning module; consumers read or write through defined contracts only |
| 2 | **Order-scoped synchronous core** — TNA save + engine + Module 1 KPI cache update occur in **one transaction** per Section 2.4 Standard Engine Execution |
| 3 | **Events for cross-module async** — domain events notify other modules; V1 emits in-process after persistence, before KPI cache write (step 6); no external message bus in V1 |
| 4 | **No silent dual write** — a module must not persist duplicate milestone/material/capacity/shipment state in V1 |
| 5 | **UUID-first identifiers** — `TNAItem.uuid`, `orderId`, Milestone Code on all integration payloads for ERP readiness |
| 6 | **Deterministic derived data** — KPI cache and RiskSignal are outputs of Section 2.3 engine; consumers never recompute |
| 7 | **Fail closed** — if engine execution fails, KPI cache is not partially updated; save rolls back |
| 8 | **Emit on transition only** — domain events fire when state changes (false → true, level change, etc.); engine re-runs without transition do not re-emit |
| 9 | **Standard event envelope** — all domain events use the envelope defined below; `organizationId` required on every event |

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Module 1 — Order Command Center                  │
│  Order · OrderType · Overall Progress · Quick Notes · Documents          │
│  Timeline (audit store) · KPI cache (read) · manual overrides            │
└───────────────┬─────────────────────────────────────┬───────────────────┘
                │ sync (in-process)                   │ read
                ▼                                     ▼
┌───────────────────────────────┐     ┌─────────────────────────────────┐
│   Module 2 — Critical Path/TNA   │     │  Module 3 — Planner Dashboard  │
│   TNAItem (SSOT) · Engine        │────▶│  (read aggregate — V1.1)       │
│   Domain events                  │     └─────────────────────────────────┘
└───┬───────────┬───────────┬─────┘
    │ events    │ shared    │ events
    ▼           │ rows V1.1 ▼           ▼
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────────────────────────┐
│Module 4 │ │Module 5 │ │Module 6 │ │  Future ERP / SAP (V1.1+)            │
│Material │ │Capacity │ │Shipment │ │  Read/export · inbound idempotent    │
└─────────┘ └─────────┘ └─────────┘ └─────────────────────────────────────┘
```

---

#### Data ownership matrix

| Data domain | System of record | Physical store | Write authority | Consumers (read) |
|---|---|---|---|---|
| **Order header** (PO, buyer, style, Order Type) | Module 1 | Module 1 | Module 1 | Module 2, 3, 4, 5, 6, 7 |
| **Order manual overrides** (On Hold, Cancelled, Closed) | Module 1 | Module 1 | Module 1 | Module 2 engine (same transaction on override save) |
| **TNA instance state** (dates, statuses, qty, ownership, chase) | **Module 2** | Module 2 | **Module 2** (planner UI; future Module 4/5/ERP via Module 2 API) | Module 1 (display), 3, 4, 5, 6, ERP |
| **TNA templates & gate library** | Module 2 org config (Section 2.6) | Module 2 | Org Admin | Module 2 instantiation |
| **CP Progress, Next Critical Gate, Days to Ex-Factory** | Module 2 engine | Order KPI cache (Module 1 aggregate) | Module 2 engine (step 7) | Module 1, 3, 7 — **derived only; never write** |
| **Risk Level & RiskSignal** | Module 2 engine | `RiskSignal` table (Module 1 schema) | **Module 2 engine only** (step 3) | Module 1, 3, 7 — **derived only; never write** |
| **Summary status** (planning phase) | Module 2 engine | Order aggregate (Module 1) | Module 2 engine (step 4); **Module 1 override flags take precedence** (Cancelled / Closed / On Hold per Section 2.4 priority order) | Module 1, 3 — **derived; planner does not set phase status directly** |
| **Production Timeline events** | Module 1 (audit store) | Module 1 | **Module 2 engine** (TNA saves + override-correlated events); **Module 1** (Quick Notes only) | Module 1, 3, 7, ERP |
| **Overall Progress** (qty by stage) | Module 1 | Module 1 | Module 1 | Module 2 UX strip (read mirror only) |
| **Quick Notes** | Module 1 | Module 1 | Module 1 | Module 1 |
| **Order Documents** (Shipping) | Module 1 | Module 1 | Module 1 (planner) | Module 6 (V1.1) |
| **Material PO / procurement** | Module 4 (future) | Module 4 | Module 4 — **not TNA in V1** | Module 4 |
| **Line / capacity allocation** | Module 5 (future) | Module 5 | Module 5 — **SLA gate on TNA in V1** | Module 5 |
| **Shipment tracking post-EXF** | Module 6 (future) | Module 6 | Module 6 — **EXF on TNA in V1** | Module 6 |

**RiskSignal clarification:** Logical owner = Module 2 Risk Engine. Physical rows live in the Module 1 data store for Order Command Center display; **only Module 2 engine writes** `RiskSignal` rows during Standard Engine Execution. No other module inserts, updates, or deletes risk signals in V1.

**Summary status clarification:** Module 2 engine derives phase status (Planning, Pre-Production, In Production, Shipment Prep, Shipped, Complete). Module 1 manual overrides (On Hold, Cancelled, Closed) are evaluated **first** in the same engine run — override flags win over phase-derived status.

---

#### Dual progress integration boundary

Module 1 **Overall Progress** and TNA **milestone (gate) completion** are **separate integration paths** (Section 2.4). The system does **not** auto-sync them in V1.

| Surface | Owner | Integration rule |
|---|---|---|
| **TNA gate completion** (`TNAItem.isComplete`) | Module 2 | Drives CP Progress, Risk, summary status (phase), domain events |
| **Overall Progress** (qty by production stage) | Module 1 | Read-only mirror in TNA UX strip; **not an input to Module 2 engine** |
| **Coordination** | Planner judgment | Completing CST on TNA does not require Overall Progress entry; floor qty does not auto-complete TNA gates |

Modules 4, 5, and ERP must **not** infer floor production state from TNA gate completion or vice versa in V1.

---

#### Timeline ownership

| Event source | Writer | Examples |
|---|---|---|
| **TNA mutations** | Module 2 engine (append to Module 1 timeline store) | `PLANNED_DATE_REVISED`, `MILESTONE_COMPLETE`, `TNA_CREATED`, `TNA_PLANNING_CONFIRMED` |
| **Order lifecycle overrides** | Module 2 engine on **same transaction** as Module 1 override save | `ORDER_ON_HOLD`, `ORDER_RESUMED`, `ORDER_CANCELLED`, `ORDER_CLOSED` |
| **Quick Notes** | Module 1 | Planner free-text — not TNA engine |
| **Corrections** | Compensating append-only events (Section 2.3) | Never update or delete prior timeline rows |

Module 2 is the **authoritative writer** for all TNA- and override-correlated timeline events. Module 1 owns the timeline **store** and Quick Note entries.

---

#### API ownership

| API surface | Owner module | V1 scope |
|---|---|---|
| **Order CRUD** | Module 1 | Create, read, update order header; manual overrides; Overall Progress; Quick Notes; Documents |
| **Order read (KPI cache)** | Module 1 | Read denormalized KPI fields, summary status, active risk display |
| **TNA read/write** | Module 2 | All `TNAItem` mutations; Confirm / Revert planning; gate transitions |
| **TNA transition (future)** | Module 2 | Modules 4, 5, ERP call Module 2 APIs — **never direct DB write to `TNAItem`** |
| **Org TNA configuration** | Module 2 (Section 2.6) | Gate library, templates, runtime settings — org-scoped |
| **Cross-order aggregation (future)** | Module 3 (V1.1) | Read-only queries; bulk update orchestrates **N × Module 2 saves** — no parallel milestone state |
| **ERP inbound (future)** | Integration gateway → Module 2 | Service account scoped to `organizationId`; routes to Module 2 transition API |

**Write path rule:** Module 2 is the **sole write path** for `TNAItem` state in V1 and V1.1. All external modules integrate through Module 2 APIs.

---

#### Security and tenant isolation

| Rule | Detail |
|---|---|
| **Authentication** | All integration calls require authenticated session or service account |
| **Tenant scope** | `organizationId` derived from **auth token** — validated against resource; never trust client-supplied org id alone |
| **Order scope** | TNA operations require access to parent `orderId` within caller's organization |
| **Service accounts (V1.1)** | ERP / Module 4 / Module 5 use scoped roles (e.g. `tna:transition:material`, `tna:transition:sla`) — not planner UI permissions |
| **Engine bypass prohibited** | No direct SQL, admin API, or bulk import that skips Standard Engine Execution |
| **ERP audit** | Inbound changes append Timeline events with `sourceSystem`, `sourceEventId`, `actorServiceId` in payload (V1.1) |
| **Org isolation** | All queries filter by `organizationId` from auth context (Section 2.6) |
| **`erpMilestoneCode`** | Org-scoped after platform seed clone — mapping may differ per tenant |

---

#### Module 1 — Order Command Center

##### Integration boundary

Module 2 is **embedded** in the Order Command Center — same page, same order context. Integration is **in-process and synchronous** on every TNA save and every Module 1 override save that triggers engine execution.

##### Module 1 → Module 2 (inputs)

| Trigger | Contract | Module 2 action |
|---|---|---|
| **Order created** | `Order.id`, `OrderType`, `organizationId` | Workflow 1 — instantiate TNA from latest published template — **same transaction as order create**; failed instantiation rolls back order |
| **Order Type set at create** | Order Type enum | Selects `TNATemplateVersion` |
| **On Hold / Cancelled / Closed** | Order override flag | **Synchronous** Standard Engine Execution in same transaction as override save — suppression, timeline append, summary status, risk deactivation per Section 2.3 / Workflow 6 |
| **Resume / clear On Hold** | Override cleared | Same synchronous engine run — suppression cleared |

Module 1 **does not** pass Overall Progress into Module 2 engine in V1.

**Order create atomicity:** Order insert and TNA instantiation (Workflow 1) commit in **one transaction**. No orphan orders without TNA instances.

##### Module 2 → Module 1 (outputs)

| Output | Mechanism | Update timing |
|---|---|---|
| **KPI cache** on Order aggregate | Sync write in Standard Engine Execution **step 7** | Same transaction as TNA save — **after** domain events (step 6) |
| **RiskSignal** rows | Module 2 engine writes to Module 1 store (step 3) | Same transaction |
| **TimelineEvent** append | Module 2 engine writes to Module 1 timeline store (step 5) | Same transaction |
| **Summary status** | Module 2 engine writes derived field (step 4); override precedence applied | Same transaction |

Module 1 KPI cards and risk display are **read-only views** of Module 2 outputs — Section 2.5.

##### Workflow 10 — Sample / SMS → Bulk (cross-order)

| Step | Integration contract |
|---|---|
| Close sample order | Module 1 override → Module 2 engine (Workflow 6) |
| Create bulk order | Module 1 create → Module 2 Workflow 1 in same transaction |
| Copy TNA | Module 2 Path B — `sourceOrderId` recorded in timeline `TNA_COPIED` payload |
| Provenance | Bulk order's `TNATemplateVersion` and copied instances are independent; no shared mutable state between orders |

##### V1 vs V1.1

| Topic | V1 | V1.1 |
|---|---|---|
| Integration style | In-process sync | Optional event bus for downstream analytics |
| KPI cache | Denormalized on Order | + scheduled ERP export snapshot |
| Style/colorway scoped TNA | Order-level only | Module 1 hierarchy may scope future TNAs |

---

#### Module 3 — Planner Dashboard

##### Integration boundary

Module 3 is the **cross-order read aggregator** and future daily entry point. It **does not own** milestone state. **Module 3 product surface does not exist in V1.**

##### V1

| Capability | Contract |
|---|---|
| **Pre-meeting queue** | **Not Module 3** — Workflow 4.1 uses Module 1 order list sorted by cached `riskLevel`, `daysToExFactory` |
| **Read access** | Order KPI cache, active `RiskSignal`, summary status, EXF date via Module 1 APIs — **no TNA write** |
| **Chase lists** | Not available — requires cross-order `TNAItem` query (Section 2.1) |

Module 3 has **no write contract** with Module 2 in V1.

##### V1.1 (planned)

Cross-order views, chase lists, bulk update orchestration — see Section 2.8.

---

#### Module 4 — Material Planning

##### Integration boundary

Material **readiness** is tracked on TNA Material milestones (gates) (BFO, BFI, BTO, BTI). Material **procurement** is Module 4 scope — not Module 2.

##### V1

| Rule | Detail |
|---|---|
| **State ownership** | **Module 2 `TNAItem`** is SSOT for BFO/BFI/BTO/BTI status, dates, qty, Receipt % |
| **Module 4** | Not built in V1 — no write path |
| **Planner** | Updates material gates manually on TNA (Workflow 4.5) |
| **ERP fields** | `materialDocumentReference` on Material instances — nullable, empty in V1 |

##### V1.1 (planned)

Module 4 writes through **Module 2 material transition API** — no duplicate Material entity. See Section 2.8.

##### Milestone (gate) codes (integration reference)

| Code | Material gate | Module 4 concern |
|---|---|---|
| BFO | Bulk Fabric Ordered | PO placement tracking (future) |
| BFI | Bulk Fabric In-House | Receipt vs BOM |
| BTO | Bulk Trim Ordered | PO placement (future) |
| BTI | Bulk Trim In-House | Receipt vs BOM |

---

#### Module 5 — Capacity Planning

##### Integration boundary

Capacity **allocation** is Module 5 scope. TNA records **when** line is allocated via **SLA** milestone (gate) and provides **plan dates** for capacity views.

##### V1

| Rule | Detail |
|---|---|
| **State ownership** | **SLA `TNAItem`** on TNA is capacity handoff marker — planner marks Complete manually |
| **Module 5** | Not built — no runtime integration in V1 |
| **Plan dates** | CST, SLA, EXF Current Planned Dates on `TNAItem` for future load views |
| **Module 1** | `AssignedProductionLine` reserved null — not populated in V1 |
| **Risk** | `Capacity Constraint` is Revision Reason only — no `CAPACITY_CONFLICT` signal in V1 |

##### V1.1 (planned)

Module 5 sets SLA Complete via **Module 2 API**; may populate `AssignedProductionLine` through orchestration. See Section 2.8.

##### Key gate codes

| Code | Role |
|---|---|
| SLA | Sewing Line Allocated — capacity handoff |
| CST | Cutting Start — floor plan anchor |
| EXF | Ex-Factory — capacity horizon end |

---

#### Module 6 — Shipment & Ex-Factory Tracking

##### Integration boundary

Shipment **preparation gates** live on TNA through EXF. Post-ex-factory logistics is Module 6 scope.

##### V1

| Rule | Detail |
|---|---|
| **State ownership** | FIN, SDR, VFB, PCK, EXF are **TNA Standard/Approval gates** — Module 2 SSOT |
| **Terminal event** | `OrderExFactoryCompleted` emitted when EXF `isComplete` |
| **Documents** | Shipping docs in Module 1 `OrderAttachment` — linked from SDR workflow (Section 2.5) |
| **Module 6** | Not built — no shipment entity in V1 |

##### V1.1 (planned)

Module 6 consumes `OrderExFactoryCompleted` and reads pre-EXF gate state from Module 2. See Section 2.8.

##### Shipment gate sequence (integration reference)

FIN → SDR → VFB → PCK → EXF — state on TNA; Module 6 orchestrates **post-EXF** only.

---

#### Domain events

##### Standard event envelope (V1)

All domain events emitted by Module 2 use this envelope. V1 generates `eventId` for forward compatibility; durable log and external delivery → V1.1.

| Field | Required | Purpose |
|---|---|---|
| `eventId` | Yes | UUID — unique per emission; idempotency key for V1.1 consumers |
| `eventType` | Yes | e.g. `TnaItemCompleted` |
| `schemaVersion` | Yes | `"1.0"` — envelope version |
| `occurredAt` | Yes | ISO-8601 UTC |
| `organizationId` | Yes | Tenant boundary — **always present** |
| `correlationId` | Yes | Save transaction / request id |
| `aggregateType` | Yes | `Order` or `TNAItem` |
| `aggregateId` | Yes | `orderId` or `tnaItemUuid` |
| `aggregateVersion` | Yes | `TNAItem.version` or order version after save |
| `businessRuleVersion` | Yes | `"2.3"` — rules that produced engine outputs |
| `calculatedAt` | Yes | KPI/risk computation timestamp from this engine run |
| `payload` | Yes | Event-specific body (below) |

**V1 consumer rule:** Domain events emit at Standard Engine Execution **step 6**, **before** Module 1 KPI cache write (step 7). In-process handlers **must not read KPI cache on event** — use event envelope fields and save response body. External async consumers → V1.1.

**In-process handlers (V1):** Must not throw uncaught exceptions — they participate in the save transaction and would roll back the entire save.

##### Emission ordering (single save)

When multiple events emit in one transaction:

1. Item-level events (`TnaItemCompleted`, `TnaItemReopened`) — in gate sequence order where applicable
2. Planning events (`TnaPlanningCompleted`, `TnaPlanningReverted`)
3. `OrderRiskLevelChanged`
4. `OrderExFactoryCompleted` — last if EXF completes in same save

##### Produced by Module 2 (V1)

Emitted during Standard Engine Execution step 6 — in-process only.

| Event | When | Payload (minimum, inside `payload`) |
|---|---|---|
| `TnaItemCompleted` | `isComplete` false → true | `orderId`, `tnaItemUuid`, `milestoneCode`, `gateType`, `actualDate`, `tnaTemplateVersionId` |
| `TnaItemReopened` | Reopen (Workflow 7) | `orderId`, `tnaItemUuid`, `milestoneCode`, `reopenReason`, `previousActualDate`, `tnaTemplateVersionId` |
| `TnaPlanningCompleted` | Confirm TNA Planning | `orderId`, `tnaTemplateVersionId`, `confirmedByUserId`, `exfCurrentPlannedDate` |
| `TnaPlanningReverted` | Org Admin revert (Section 2.4) | `orderId`, `revertedByUserId`, `reason` |
| `OrderExFactoryCompleted` | EXF Complete | `orderId`, `tnaItemUuid`, `exfActualDate`, `summaryStatus` |
| `OrderRiskLevelChanged` | `riskLevel` cache changes | `orderId`, `previousLevel`, `newLevel`, `activeSignalIds[]`, `riskReasons[]` |

**Not domain events (same transaction side effects):** Timeline append (step 5), RiskSignal persistence (step 3), KPI cache write (step 7).

**V1 limitation — lifecycle events:** On Hold, Resume, Cancelled, Closed use Timeline events only — not domain events. See Section 2.8.

**V1 limitation — instantiation:** TNA creation logs Timeline `TNA_CREATED` only — no `TnaInstantiated` domain event in V1.

##### Consumed by Module 2 (V1)

| Source | Trigger | Module 2 action |
|---|---|---|
| **Module 1** | Order created (same transaction) | TNA instantiation (Workflow 1) + engine run |
| **Module 1** | On Hold / Cancelled / Closed (same transaction) | Standard Engine Execution — suppression, timeline, summary status, risk |
| **Module 1** | Resume from On Hold (same transaction) | Standard Engine Execution — suppression cleared |

`OrderCreated` is an **internal Module 1 hook** in V1 — not an external domain event.

##### Consumed by Module 2 (V1.1)

See Future Architecture Notes and Section 2.8.

---

#### Event flow and synchronization

##### Order create flow

```
Module 1: OrderCreated (internal hook, same transaction)
    → Module 2: instantiate TNA (Workflow 1)
    → Standard Engine Execution (steps 1–7)
    → Module 1: KPI cache initialized, Timeline TNA_CREATED
    → (no domain event — Timeline only)
```

##### Daily TNA save flow

Aligns with locked Section 2.4 Standard Engine Execution step order:

```
Planner: TNAItem save(s) — one transaction, all-or-nothing for the request
    → Step 1: Persist TNAItem (optimistic concurrency)
    → Step 2: Business Rule Engine (CP Progress, Next Critical Gate, daysToExFactory, calculatedAt, businessRuleVersion)
    → Step 3: Risk Engine (RiskSignal lifecycle)
    → Step 4: Summary status
    → Step 5: TimelineEvent append (Module 1 store)
    → Step 6: Domain events emit (in-process — handlers must not read KPI cache)
    → Step 7: Module 1 KPI cache write
    → Response: refreshed cache (calculatedAt) — read-your-writes
```

##### Cross-module rule (V1)

**No eventual consistency within an order save.** Module 1 must never display stale KPI cache after successful TNA save in the same request.

##### Cross-module rule (V1.1)

Module 3/4/5/6 may subscribe async to domain events from durable log. Consumers tolerate **at-least-once** delivery; dedupe by `eventId`.

---

#### Failure handling and consistency

| Scenario | Behavior |
|---|---|
| **Engine execution fails** | Full transaction rollback — no partial TNAItem, KPI cache, Timeline, or RiskSignal update |
| **Timeline write fails** | Roll back entire save — TNA state not committed without audit |
| **Optimistic concurrency conflict** | 409 to planner — no event emit; Module 1 cache unchanged |
| **Module 1 override during save** | Order row version check in same transaction where applicable |
| **Multi-item save (meeting batch)** | One transaction per save request — all-or-nothing |
| **Order create — instantiation fails** | Roll back order insert — no orphan order |
| **In-process handler throws (V1)** | Rolls back entire save — V1 has no external subscribers |
| **Downstream consumer failure (V1.1)** | Module 2 commit succeeds; failed consumer retries from event log — no rollback |
| **ERP inbound duplicate (V1.1)** | Reject duplicate `sourceSystem` + `sourceEventId`; idempotent apply by UUID + `expectedVersion` |

**Read-your-writes:** Planner UI reads KPI cache from successful save response — written at step 7.

**Emit on transition:** Re-saving unchanged state does not re-emit domain events.

---

#### Explicit V1 integration limitations

| Limitation | V1 behavior |
|---|---|
| External message bus / webhooks | None — in-process emit only |
| ERP inbound / outbound connectors | None — fields reserved |
| Module 3 product surface | Does not exist — Module 1 list fallback |
| Cross-order queries (chase lists) | Not available |
| Bulk cross-order milestone update | Per order only |
| Module 4 / 5 / 6 runtime integration | Not built — manual TNA gates |
| `AssignedProductionLine` | Null on Order |
| Capacity conflict risk signal | Not generated |
| Material BOM validation | Not available |
| Partial / multi EXF | Single EXF gate per order |
| Order lifecycle domain events | Timeline only — not domain events |
| `TnaInstantiated` domain event | Timeline `TNA_CREATED` only |
| Dual progress auto-sync | None — Overall Progress independent of TNA |
| Integration idempotency keys | `eventId` on outbound; no `sourceSystem` inbound until V1.1 |
| CSV import/export | V1.1 |
| Style / colorway scoped TNA | Order-level only |
| In-process async subscribers | Must not throw — participate in transaction |

Consolidated Module 2 deferrals → Section 2.8.

---

#### ERP field readiness (V1 — integration not enabled)

| Field / identifier | Location | Purpose |
|---|---|---|
| `TNAItem.uuid` | Instance | Primary external key for milestone |
| `Order.externalReference` | Order header | SAP sales / production order mapping (reserved, nullable) |
| `TNAGateLibraryItem.erpMilestoneCode` | Library (org-scoped) | SAP operation / milestone mapping |
| `externalReference` | TNAItem instance | Generic ERP document ID |
| `materialDocumentReference` | Material instance | SAP MM document |
| `inspectionReference` | Approval instance | SAP QM inspection lot |
| `businessRuleVersion` | Order cache | Which rule set produced KPIs |
| `calculatedAt` | Order cache | KPI freshness |
| Milestone Code | Instance / events | Stable semantic key (immutable) |
| `tnaTemplateVersionId` | Instance / events | Template version pinned at instantiation — export must use instance version, not latest published |

**SAP-aligned principles (V1 design; connectors V1.1):** UUID over display name; Milestone Code as semantic key; no engine bypass; audit parity via Timeline; org isolation on all connectors.

---

#### Explicit V1 vs V1.1 integration summary

| Integration | V1 | V1.1 |
|---|---|---|
| Module 1 KPI / Timeline / Risk | Sync in-process; steps 1–7 | + optional async fan-out from durable log |
| Module 3 dashboard | Module 1 list fallback; read cache only | Full cross-order views; chase lists |
| Module 4 material | TNA manual only | Write through Module 2 API; BOM validation |
| Module 5 capacity | SLA gate manual | Line allocation API; `AssignedProductionLine` |
| Module 6 shipment | EXF event; docs on Module 1 | Post-EXF tracking |
| Domain event bus | In-process emit + `eventId` | Durable log + async subscribers |
| ERP inbound / outbound | None | Idempotent API; scheduled export |
| Bulk cross-order update | None | Module 3 → Module 2 per order |
| Partial / multi EXF | Single EXF | Multiple EXF events |

---

#### Future architecture notes (V1.1+)

Deferred integration capabilities — full list also in Section 2.8:

| Topic | Planned behavior |
|---|---|
| **Durable event log / outbox** | Migrate from in-process emit; at-least-once delivery; consumer dedupe by `eventId` |
| **`sourceSystem` + `sourceEventId`** | Inbound ERP idempotency; reject duplicates |
| **`expectedVersion` on inbound API** | Optimistic concurrency for ERP updates to `TNAItem` |
| **Additional domain events** | `TnaInstantiated`, `OrderSummaryStatusChanged`, order lifecycle events, `RiskSignalsChanged` |
| **Module 3–7 integration** | Dashboard, material/capacity/shipment APIs, reporting read contract |
| **ERP export / inbound** | Scheduled KPI snapshot; GR/QM/PO inbound; `ErpIntegrationMapping`; reconciliation job |
| **Integration gateway** | Per-org ERP credentials; service accounts with scoped roles |
| **Event `sequenceNumber`, `causationId`** | Per-order ordering; event chains |
| **Performance indexes** | Cross-order chase query indexes |
| **PII minimization in ERP export** | Owner/chase fields excluded where possible |

---

#### Relationship to other sections

| Section | Relationship |
|---|---|
| **2.3** | Engine produces KPI, Risk, events — integration consumes outputs; 2.7 supersedes 2.3 for event envelope only |
| **2.4** | Workflows define when events fire; Standard Engine Execution step order is authoritative |
| **2.5** | Module 1 UX reads cache — display contract only |
| **2.6** | Org isolation + tenant provisioning — connector scope |
| **2.8** | Consolidated V1.1 deferrals — cross-reference |

---

## Locked: Section 2.8 — Out of Scope / V1.1 Roadmap

#### Purpose

Section 2.8 consolidates **everything explicitly out of V1 scope** for Module 2 (Critical Path & TNA) and maps deferred capabilities to **V1.1** or **Future** releases. It is the single reference for Module 2 boundary decisions — individual sections point here rather than repeating deferral lists.

**V1 boundary:** Module 2 delivers a planner-native TNA workspace embedded in the Order Command Center — template-driven instantiation, deterministic business rules engine, daily production meeting workflows, org configuration, and in-process integration contracts. V1 does **not** include external ERP connectors, cross-order dashboard, material/capacity/shipment modules, or automation beyond manual planner action.

#### V1 delivers (Module 2 complete)

| Capability | Section |
|---|---|
| TNA purpose, scope, terminology | 2.1 |
| Three-layer Library → Template → Instance model; 35-gate library; five Order Type templates | 2.2 |
| Deterministic business rules engine; CP Progress; risk catalog; timeline audit | 2.3 |
| Ten planner workflows including production meeting ritual | 2.4 |
| TNA panel UX within Order Command Center | 2.5 |
| Org configuration — gate library, templates, runtime settings, tenant isolation | 2.6 |
| Integration contracts — Module 1 sync; Modules 3–6 boundaries; event envelope; API ownership | 2.7 |

---

#### Consolidated deferrals — Planning & visualization

| Capability | Target | Data model | Source |
|---|---|---|---|
| Full Gantt / visual timeline chart | V1.1 | UI only — no schema change | 2.1 |
| Calendar engine (factory holidays, working days) | V1.1 | `FactoryCalendar` reserved | 2.1, 2.3 |
| Style-level / Colorway-level TNAs | Future | `TNAItemScope` enum ready | 2.1, 2.2 |
| Buyer-specific templates | Future | `TNATemplate.Buyer` nullable | 2.1, 2.6 |
| Partial shipment / multiple EXF gates | V1.1 | Multiple Shipment-phase items supported | 2.1, 2.2 |
| Presentation / read-only TNA mode | V1.1 | UX only | 2.5 |
| Timeline drawer (inline audit) | V1.1 | UX only | 2.5 |
| Keyboard-first power-user mode | V1.1 | UX only | 2.5 |

---

#### Consolidated deferrals — Engine & business rules

| Capability | Target | Data model | Source |
|---|---|---|---|
| Multi-predecessor dependency graph | V1.1 | `TNADependency` reserved | 2.1, 2.3 |
| Auto cascade date revision | V1.1 | Builds on date revision model | 2.1, 2.3 |
| Business days / factory calendar in engine | V1.1 | Calendar days only in V1 | 2.3 |
| Low Risk Level | Removed | Informational signals only in future | 2.3 |
| Configurable approval state machines | V1.1 | Fixed per type in V1 | 2.3, 2.6 |
| Risk rule builder (org-configurable catalog) | V1.1 | Fixed catalog in V1 | 2.3, 2.6 |
| Material qty vs order BOM validation | V1.1 | Module 4 integration | 2.3, 2.7 |
| Capacity conflict risk signal | V1.1 | Module 5 integration | 2.3, 2.7 |
| Dual progress auto-sync | Not planned V1 | Separate data paths by design | 2.4, 2.7 |

---

#### Consolidated deferrals — Workflow & operations

| Capability | Target | Data model | Source |
|---|---|---|---|
| Buyer / external party notifications | V1.1 | Uses existing ownership fields | 2.1, 2.4 |
| Bulk cross-order milestone update | V1.1 | Per-order saves via Module 2 API | 2.4, 2.7 |
| Bulk ownership change across orders | V1.1 | Per instance in V1 (Workflow 9) | 2.4 |
| Buyer CSV TNA import/export | V1.1 | Maps to existing TNA fields | 2.1, 2.4 |
| Module 1 CSV import | V1.1 | Module 1 scope | 2.1 |
| AI date recommendations / risk predictions | Future | No V1 dependency | 2.1 |
| Automatic scheduling from line capacity | Module 5 | No auto-reschedule in V1 | 2.1, 2.4 |
| Material procurement / PO issuance | Module 4 | Readiness on TNA only in V1 | 2.1, 2.4 |

---

#### Consolidated deferrals — Organization configuration

| Capability | Target | Notes | Source |
|---|---|---|---|
| Factory-level template overrides | V1.1 | `factoryId` on templates reserved | 2.6 |
| Effective-dated configuration | V1.1 | Threshold changes from date X | 2.6 |
| Rollback / unpublish template version | V1.1 | Forward-only publish in V1 | 2.6 |
| Config version snapshot on order | V1.1 | e.g. `orgTnaConfigVersionId` at create | 2.6 |
| Bulk lead-time editor | V1.1 | Per-item only in V1 | 2.6 |
| Platform-managed library push to tenants | V1.1 | Clone model in V1 | 2.6 |
| Production Manager config delegation | V1.1 | Org Admin only in V1 | 2.6 |
| Gate library import/export | V1.1 | | 2.6 |
| Role builder for field-level TNA permissions | V1.1 | | 2.6 |
| Coded reopen / ownership reason lists | V1.1 | Free text required in V1 | 2.6 |

---

#### Consolidated deferrals — Integration & cross-module

| Capability | Target | Notes | Source |
|---|---|---|---|
| Module 3 Planner Dashboard product surface | V1.1 | Module 1 list fallback in V1 | 2.5, 2.7 |
| Cross-order chase lists | V1.1 | Requires Module 3 query API | 2.1, 2.7 |
| Module 4 Material Planning runtime | V1.1 | Manual BFO/BFI/BTO/BTI on TNA in V1 | 2.4, 2.7 |
| Module 5 Capacity Planning runtime | V1.1 | Manual SLA gate in V1 | 2.4, 2.7 |
| Module 6 Shipment runtime | V1.1 | EXF on TNA; docs on Module 1 in V1 | 2.4, 2.7 |
| Module 7 Reporting integration | V1.1 | Read KPI cache + Timeline | 2.7 |
| External message bus / webhooks | V1.1 | In-process events in V1 | 2.7 |
| ERP inbound / outbound connectors | V1.1 | Fields reserved in V1 | 2.7 |
| `AssignedProductionLine` population | V1.1 | Null in V1 | 2.4, 2.7 |
| Order lifecycle domain events | V1.1 | Timeline only in V1 | 2.7 |
| `TnaInstantiated` domain event | V1.1 | `TNA_CREATED` timeline in V1 | 2.7 |
| Durable event log / outbox pattern | V1.1 | | 2.7 |
| ERP reconciliation job | V1.1 | | 2.7 |
| Vendor master / plant / production order FKs | Integration release | Nullable FKs reserved | 2.2 |
| Secondary owner / role-without-user | Future | Single internal user in V1 | 2.2 |

---

#### Data model readiness (no redesign required)

The following V1.1/Future capabilities are **designed into the V1 data model** — enabling them is configuration, workflow, or integration work, not schema migration:

| Reserved construct | Enables |
|---|---|
| `TNAItemScope` (Order \| Style \| Colorway) | Style/colorway-scoped milestones |
| `TNATemplate.Buyer` | Buyer-specific templates |
| `TNADependency` | Multi-predecessor graph |
| `FactoryCalendar` | Business-day engine |
| Multiple Shipment-phase `TNAItem` rows | Partial / multi EXF |
| `TNAItem.uuid` + `erpMilestoneCode` | ERP milestone mapping |
| `Order.externalReference` | SAP order header mapping |
| `AssignedProductionLine` | Module 5 line allocation |
| `materialDocumentReference`, `inspectionReference` | SAP MM / QM integration |
| `organizationId` on all entities | Multi-tenant isolation |

---

#### Relationship to other modules

| Module | V1 relationship to Module 2 | V1.1 unlock |
|---|---|---|
| **Module 1** | Embedded TNA; sync KPI/Timeline/Risk; manual overrides | Optional async fan-out |
| **Module 3** | Order list fallback for meeting queue | Dashboard; chase lists; bulk update orchestration |
| **Module 4** | Material gates on TNA — manual | Material receipt API; BOM validation |
| **Module 5** | SLA gate on TNA — manual | Line allocation; capacity conflict signals |
| **Module 6** | Shipment gates through EXF; docs on Module 1 | Post-EXF tracking |
| **Module 7** | — | Reporting read contract |
| **ERP / SAP** | Field readiness only | Connectors, export jobs, inbound idempotency |

---

#### Module 2 design complete

With Sections 2.1–2.8 locked, **Module 2 (Critical Path & TNA) design is complete for V1**. Implementation proceeds module-by-module; Modules 3–7 remain pending product design in subsequent PRD phases.

---
## Module 3: Planner Dashboard

> **Status:** Locked — Sections 3.1–3.8 complete  
> **Baseline:** Module 1 locked; Module 2 locked (Sections 2.1–2.8)

---

## Locked: Section 3.1 — Purpose & Scope

### Purpose

Module 3 is the **production planner's operational home page** — the first screen opened each morning and the anchor for the daily production planning ritual. It aggregates cross-order signals from Modules 1 and 2 into **actionable work queues**, not charts or analytics.

The Planner Dashboard answers eight operational questions every morning:

| Question | Primary surface |
|---|---|
| **What requires my attention today?** | Priority summary strip + Today's Focus widget + Morning Queue |
| **Which orders are at risk?** | At Risk Orders widget |
| **Which external parties must I chase?** | Chase List widget (by external owner type) |
| **Which materials are blocking production?** | Material Blockers widget |
| **Which approvals are overdue?** | Approvals Overdue widget |
| **Which orders ship this week?** | Shipping This Week widget |
| **Which orders need line allocation?** | SLA / Capacity Handoff widget |
| **What changed since yesterday?** | Since Yesterday widget |

**Architectural stance:** Module 3 is a **read aggregator, navigation hub, and bulk-chase orchestrator** (Module 2 chase API only). It does not own milestone state, KPI computation, or risk generation — those remain Module 2 (engine) and Module 1 (display cache) per locked Section 2.7.

### What this module is

- **Operational command surface** — counts, lists, and queues that drive planner action
- **Cross-order visibility** — queries spanning `TNAItem`, Order KPI cache, and `RiskSignal` that a single order page cannot provide
- **Production meeting entry point** — replaces Module 1 order list fallback (Workflow 4.1) with a purpose-built meeting queue
- **Deep-link launcher** — every row opens the Order Command Center at the relevant order and gate (Section 2.5 risk deep-link pattern)
- **Session-aware** — "since yesterday" and "since last visit" use planner session timestamps and snapshots, not batch analytics
- **Timezone-correct** — all date comparisons and "today" boundaries use `factoryTimezone` from `OrganizationTnaSettings` (Section 2.6)

### What this module is not

| Not this | Why |
|---|---|
| **Analytics / BI dashboard** | No trend charts, no historical KPI exploration, no executive roll-ups — Module 7 scope |
| **TNA editor** | All milestone mutations happen on the embedded TNA panel (Module 2) after navigation |
| **Risk engine** | Reads `RiskSignal` and Order KPI cache — never recomputes risk or CP Progress |
| **Material / capacity / shipment system** | Surfaces blockers from TNA gates until Modules 4–6 exist |
| **Notification platform** | V1.1 planners chase manually (Section 2.4); no outbound email/SMS from this module |

### Release boundary

Per locked Module 2 Sections 2.7 and 2.8:

| Release | Behavior |
|---|---|
| **V1** | Module 3 **does not ship**. Workflow 4.1 uses Module 1 order list sorted by `riskLevel` → `daysToExFactory` (Section 2.4). Minimal prev/next meeting navigation on the order page (Section 2.5). |
| **V1.1 (this module)** | Planner Dashboard becomes **default login landing** for planner role. Full widget set (8 widgets), saved views, meeting queue builder, cross-order read queries, and bulk chase orchestration. |
| **Future (Section 3.8)** | Extensions requiring Modules 4–6, mobile, or org-wide automation. |

### Relationship to locked modules

| Module | Relationship |
|---|---|
| **Module 1** | Reads Order header, KPI cache, summary status, Overall Progress mirror; navigates into Order Command Center for edits |
| **Module 2** | Reads `TNAItem` state, active `RiskSignal`; all writes route through Module 2 TNA save API after navigation |
| **Module 4–6** | Future widgets consume same TNA read model until dedicated modules ship (Section 3.8) |

### Primary users

| Role | Use |
|---|---|
| **Production Planner** | Daily home page; meeting queue; chase lists; ad-hoc portfolio scan |
| **Production Manager** | Same dashboard with broader portfolio filters; Weekly Review entry (Workflow 5) |
| **Org Admin** | Publish org-default saved views; no TNA editing from dashboard |

### Authorization

| Rule | Detail |
|---|---|
| **Tenant isolation** | All queries scoped by auth `organizationId` |
| **Factory-level access** | Planners and Production Managers see only orders assigned to factories in their user profile — same factory visibility rules as Module 1 order list |
| **Role access** | Planner and Production Manager roles; Org Admin for published views only |
| **Export** | Chase list export respects same factory + order visibility as user's portfolio |

---

## Locked: Section 3.2 — Dashboard Architecture

### Architectural principles

| # | Principle |
|---|---|
| 1 | **Read-only aggregation** — Module 3 queries; Module 2 computes; Module 1 caches |
| 2 | **Action over insight** — every widget row is clickable and opens an editable context |
| 3 | **No parallel state** — dashboard holds no copy of milestone completion, dates, or risk |
| 4 | **Tenant-scoped queries** — all reads filter by `organizationId` from auth token (Section 2.7) |
| 5 | **Factory-scoped visibility** — portfolio queries respect user's authorized factory list |
| 6 | **Stale-safe display** — show `calculatedAt` on order-level widget data; refresh on navigation return |
| 7 | **Timezone authority** — all "today," "yesterday," and calendar-day windows use `OrganizationTnaSettings.factoryTimezone` (Section 2.6) |
| 8 | **Event-informed refresh (V1.1)** — subscribe to Module 2 domain events for cache invalidation; tolerate brief staleness between saves |
| 9 | **Desktop-first** — optimized for 1440px+ planner workstation; responsive collapse, not mobile-first edit |

### Logical architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Module 3 — Planner Dashboard (UI)                     │
│  Widgets · Saved Views · Meeting Queue · Meeting Mode navigation         │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ read queries · deep-link navigation
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│              Module 3 Query API (read-only, org-scoped)                  │
│  GET /dashboard/bootstrap · Widget projections · Saved view execution    │
└───────┬─────────────────────────────┬───────────────────────────────────┘
        │                             │
        ▼                             ▼
┌───────────────────┐     ┌───────────────────────────────────────────────┐
│ Module 1 read     │     │ Module 2 read                                  │
│ Order · KPI cache │     │ TNAItem · RiskSignal (active) · TimelineEvent  │
│ Summary status    │     │ (cross-order joins on orderId + organizationId)│
└───────────────────┘     └───────────────────────────────────────────────┘
        ▲                             ▲
        │         writes only via     │
        └──────── Order Command Center ── Module 2 TNA save (after navigate)
```

### Page layout

Single-page dashboard — no tabs. Three vertical zones plus priority strip:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  HEADER — FactoryFlow · date (factory TZ) · org · search · saved views   │
├─────────────────────────────────────────────────────────────────────────┤
│  PRIORITY SUMMARY STRIP — critical overdue · blocked · due today · chase │
├─────────────────────────────────────────────────────────────────────────┤
│  MEETING BAR — queue status · Start Meeting · orders reviewed counter    │
├──────────────────────────────┬──────────────────────────────────────────┤
│  WIDGET GRID (2–3 columns) │  DETAIL PANEL (optional, collapsible)      │
│  Today's Focus               │  Expanded widget list when "View all"      │
│  At Risk Orders              │  or order preview strip                    │
│  Chase List                  │                                            │
│  Material Blockers           │                                            │
│  Approvals Overdue           │                                            │
│  Shipping This Week          │                                            │
│  SLA / Capacity Handoff      │                                            │
│  Since Yesterday             │                                            │
├──────────────────────────────┴──────────────────────────────────────────┤
│  FOOTER — last refreshed · calculatedAt range · link to Module 1 list   │
└─────────────────────────────────────────────────────────────────────────┘
```

**Priority summary strip:** Compact horizontal bar below header — live counts for **Critical overdue** · **Blocked (hard gate)** · **Due today** · **Needs chase** · **EXF ≤ 7 days**. Each count is clickable — opens the corresponding widget detail panel with filter pre-applied. Counts refresh with widget queries.

**Widget grid:** Fixed default layout for V1.1 — not user-resizable. Org Admin may set org default view; user reorder → Section 3.8.

**Detail panel:** Opens when planner clicks **View all** on a widget — full scrollable list with same filters as widget, sortable columns, multi-select for cross-order operations (Section 3.6).

### Date and timezone rules

All Module 3 date logic reads `OrganizationTnaSettings.factoryTimezone` (Section 2.6). No client-local timezone for portfolio queries.

| Concept | Rule |
|---|---|
| **Today** | Calendar date in `factoryTimezone` at query time |
| **Yesterday** | Prior calendar date in `factoryTimezone` |
| **Due this week / EXF window** | Calendar-day arithmetic in `factoryTimezone` |
| **Last Chased not today** | `Last Chased` date ≠ today in `factoryTimezone` (or null) |
| **Widget footer** | Show `calculatedAt` range across visible order rows — oldest to newest |

Admin changes to `factoryTimezone` take immediate effect on next query per Section 2.6 confirmation warning.

### Data access patterns

| Pattern | Source | Use |
|---|---|---|
| **Order-level scan** | Order KPI cache + summary status | At Risk Orders, Shipping This Week |
| **Gate-level scan** | `TNAItem` joined to Order | Today's Focus, Chase List, Material Blockers, Approvals, SLA |
| **Signal-level scan** | Active `RiskSignal` joined to Order | At Risk enrichment, Since Yesterday risk changes |
| **Audit scan** | `TimelineEvent` since timestamp | Since Yesterday activity feed |
| **Session delta** | Compare last-visit snapshot to current | "New since last session" badge on widgets |

**Index requirements (V1.1 implementation):** Cross-order queries need composite indexes aligned with Section 2.7 Future Architecture Notes — e.g. `(organizationId, isComplete, currentPlannedDate)`, `(organizationId, externalOwnerType, lastChased)`, `(organizationId, gateType, approvalStatus)`.

### Bootstrap endpoint

**`GET /dashboard/bootstrap`** — single initial-load call returning:

| Payload section | Content |
|---|---|
| **Session** | `DashboardSession` — meeting queue, last-visit timestamp, expanded widget state |
| **Saved views** | User recents + org defaults + active view |
| **Org settings** | `factoryTimezone`, `hardGateLookaheadDays`, `exfAtRiskDays`, `stallDays` (read-only projection from `OrganizationTnaSettings`) |
| **Widgets** | All 8 widget projections (top N rows each) + header counts + `calculatedAt` per widget |
| **Priority strip** | Aggregate counts for summary strip |
| **User context** | Authorized factory list, role, display preferences |

Subsequent refreshes may call individual `GET /dashboard/widgets/{type}` endpoints or re-bootstrap on manual refresh.

### Session snapshot behavior

`DashboardSession` maintains a **portfolio snapshot** on each dashboard visit exit (navigation to order, browser tab hide > 5 min, or explicit End Meeting):

| Snapshot field | Purpose |
|---|---|
| `snapshotAt` | Timestamp of last capture |
| `orderRiskLevels` | Map of `orderId` → `riskLevel` at snapshot time |
| `widgetCounts` | Map of widget type → row count at snapshot time |
| `activeSignalIds` | Set of active `RiskSignal` IDs at snapshot time |

**Since last visit:** On dashboard return, compare current query results to snapshot — rows with new/changed risk, new signals, or count deltas show **"New since last visit"** badge on widget headers. Since Yesterday widget toggle **since last visit** uses `snapshotAt` as lower bound instead of yesterday 00:00.

Snapshot is **session-scoped** — not persisted across browser sessions unless user preference "remember last snapshot" enabled (optional V1.1).

### Meeting queue model

The **meeting queue** is a **session-scoped ordered list of `orderId`** — not persisted as system of record.

| Property | Rule |
|---|---|
| **Population** | Auto-generated from active Saved View ("Morning Queue") or manual add/remove |
| **Inclusion (Morning Queue default)** | **Exact match to locked Workflow 4.1** — active orders only (exclude Cancelled, Closed) that meet **any one** of: **(A)** overdue critical gate, **(B)** EXF within 7 calendar days (`factoryTimezone`), **(C)** active `CP_STALL` signal. **`riskLevel` is NOT an inclusion criterion.** |
| **Sort default** | `riskLevel` desc → `daysToExFactory` asc (matches Workflow 4.1 secondary sort) |
| **Manual reorder** | Planner may drag-reorder queue rows before or during meeting — overrides sort for session |
| **Auto-remove** | Order removed from queue when EXF gate completes (`OrderExFactoryCompleted`) — even mid-meeting |
| **Persistence** | Session + optional "pin queue" to user preference for the day — not audit data |
| **Capacity** | Planner discretion; UI shows "12 in queue · 4 deferred" when filtered set exceeds practical meeting capacity |
| **Navigation** | Meeting Mode uses queue order — see V1.1 runtime extension below |

#### V1.1 runtime extension — `meetingQueue` query param

Locked Section 2.5 defines V1 meeting navigation using Module 1 list sort. Module 3 **does not modify locked Section 2.5 text**. Instead, V1.1 adds a runtime extension:

When Order Command Center URL includes `meetingQueue={sessionId}`:

| Behavior | Detail |
|---|---|
| **Prev/Next Order** | Walk Module 3 session queue order — **not** Module 1 list sort |
| **Queue context** | Show "Order N of M" from session queue |
| **Back to dashboard** | Return to Module 3; queue position preserved |
| **Without param** | Locked Section 2.5 V1 behavior unchanged — list sort prev/next |

Deep-link contract:

```
/orders/{orderId}?tnaItem={tnaItemUuid}&group={displayGroup}&meetingQueue={sessionId}
```

Order page reads query params → scrolls TNA → expands row → uses session queue for prev/next when `meetingQueue` present.

### Planning-phase order handling

Orders with `tnaInitialPlanningCompletedAt = null` (planning mode per Section 2.4) appear on the dashboard with distinct treatment:

| Surface | Planning-phase behavior |
|---|---|
| **Morning Queue** | **Excluded by default** — Workflow 4.1 targets in-flight production orders. Planner may manually add planning orders to queue |
| **Today's Focus** | Included if gate dates match — show **Planning** badge on row |
| **At Risk Orders** | Included if `riskLevel` ≥ Medium — EXF_AT_RISK suppressed per engine rules; show planning badge |
| **Chase List** | Included — external chase applies during setup |
| **Shipping / SLA widgets** | Excluded unless EXF date set and gate active |
| **Since Yesterday** | Included — timeline events from setup activity |
| **Saved view filter** | **Include planning orders** toggle — default off for Morning Queue; on for "My Active Orders" |

Planning orders opened from dashboard show TNA planning mode badge (Section 2.5) — no Confirm bypass from dashboard.

### Refresh strategy (V1.1)

| Trigger | Behavior |
|---|---|
| **Page load** | `GET /dashboard/bootstrap` — full widget + session load |
| **Return from order** | Refresh affected order rows + widgets that included that order; update session snapshot delta |
| **Domain event (in-process)** | Invalidate widget cache keys for `orderId` on `OrderRiskLevelChanged`, `TnaItemCompleted`, `OrderExFactoryCompleted` |
| **Manual refresh** | Header refresh control — re-runs bootstrap |
| **Polling** | Not in V1.1 — event-driven + navigation refresh sufficient |

### Keyboard navigation (V1.1)

Dashboard supports keyboard-first triage on desktop:

| Key | Action |
|---|---|
| `Tab` / `Shift+Tab` | Move focus between widgets, priority strip counts, meeting bar |
| `↑` / `↓` | Move focus between rows in focused widget |
| `Enter` | Open focused row → Order Command Center with deep-link |
| `V` | **View all** on focused widget → detail panel |
| `M` | **Start Meeting** (when meeting bar focused) |
| `R` | Manual refresh |
| `/` | Focus global search |
| `1`–`8` | Jump focus to widget 1–8 |
| `Esc` | Close detail panel / clear search |

Meeting queue in detail panel: `[` / `]` move selected order up/down in queue (manual reorder).

### Key entities (Module 3)

| Entity | Purpose |
|---|---|
| `DashboardSavedView` | Named filter + sort + widget visibility preset — user or org scope |
| `DashboardSession` | Ephemeral meeting queue, last-visit timestamp, snapshot, widgets expanded state |
| `DashboardWidgetConfig` | Org-level widget enable/order defaults (optional V1.1 — fixed layout acceptable) |

Module 3 entities are **configuration and session only** — no production planning state.

---

## Locked: Section 3.3 — Planner Widgets

All widgets follow a **consistent row contract**:

| Column | Content |
|---|---|
| **Order** | PO ref · buyer · style — link to Order Command Center |
| **Gate** | Milestone Code · Name — deep-link to row on TNA |
| **Signal** | Primary human-readable reason (from `RiskSignal.reasonText` or computed label) |
| **Date** | Relevant date (Current Planned, Expected, EXF, or Last Chased) |
| **Owner** | Internal user or external owner type + party name |
| **Action** | Contextual: **Open** · **Chase** (navigates to gate with Chase focus) |

Widgets show **top 5–10 rows** by default; **View all** opens detail panel. Each widget header displays live count, **`calculatedAt`** (newest order row in result set), and optional **"New since last visit"** badge. Empty state: plain-language message ("No approvals overdue — good standing").

---

### Widget 1 — Today's Focus

**Answers:** What requires my attention today?

**Query logic:**

| Include | Condition |
|---|---|
| Gate due today | `currentPlannedDate = today` OR `expectedDate = today` — not `isComplete`; not Skipped/N/A |
| Order active | Summary status not Cancelled / Closed |
| On Hold | Included with distinct badge — planner may skip in meeting |
| Planning phase | Included with **Planning** badge when `tnaInitialPlanningCompletedAt = null` |

All date comparisons use `factoryTimezone`.

**Sort priority (in order):**

1. Critical + overdue (`isCritical` = true AND Current Planned < today)
2. Blocked (hard gate not satisfied)
3. Critical + due today (`isCritical` = true AND Current Planned or Expected = today)
4. Overdue (non-critical, planned < today)
5. Due today (remaining)
6. By display group order (Development → Materials → Floor → Subcontract → Shipment)

**Row action:** Open order → TNA scrolled to gate, display group expanded.

---

### Widget 2 — At Risk Orders

**Answers:** Which orders are at risk?

**Query logic:**

| Include | Condition |
|---|---|
| Risk threshold | Order KPI cache `riskLevel` = High or Medium |
| Active | Not Cancelled / Closed |
| Suppression | On Hold shown separately with muted styling |

**Sort:** High before Medium → `daysToExFactory` asc → `cpProgress` asc.

**Row content:** PO ref · summary status · **all active `riskReasons[]`** (readable aloud — Section 2.5) · Next Critical Gate · EXF date · `calculatedAt`.

**Row action:** Open order → KPI card visible; risk deep-link to first contributing gate.

---

### Widget 3 — Chase List

**Answers:** Which external parties must I chase?

**Query logic** — **exact match to locked Section 2.5 "Needs chase" filter** (no +3 day horizon):

| Include | Condition |
|---|---|
| External owner | `ownerType = External` |
| At risk or overdue | Overdue indicator OR Expected Date slip (forecast slip) |
| Not chased today | **Last Chased** ≠ today in `factoryTimezone` (or null) |
| Incomplete | not `isComplete` |

**Grouping:** Sub-tabs or sections by **External owner type:** Buyer · Fabric Mill · Trim Supplier · Testing Lab · Subcontractor.

**Sort within group:** Most overdue first → Expected Date asc.

**Row action:** **Chase** → open order at gate with Last Chased field focused; planner completes Chase branch (Workflow 4.4) on TNA.

**Operational output:** Detail panel supports **Export chase list** — plain-text table for email to colleagues (not automated send).

---

### Widget 4 — Material Blockers

**Answers:** Which materials are blocking production?

**Query logic:**

| Include | Condition |
|---|---|
| Material gates | `gateType = Material` — BFO, BFI, BTO, BTI |
| Blocker signals | Active `MATERIAL_ETA_CONFLICT` OR `PARTIAL_RECEIPT` OR material gate is hard-gate predecessor blocking Floor/Subcontract dependent with `currentPlannedDate ≤ today + hardGateLookaheadDays` |
| Incomplete | Material status not Complete |

`hardGateLookaheadDays` read from `OrganizationTnaSettings` (Section 2.6; default 3).

**Sort:** High severity signals first → Expected Date asc → order EXF asc.

**Row content:** Material code · Receipt % · ETA · blocked dependent gate name (e.g. "Blocking CST") · order PO ref.

**Row action:** Open order → Material display group → affected BFI/BTI row expanded.

**Note:** Until Module 4 ships, all material state is on TNA (Section 2.7). Widget reads TNA only — no separate material entity.

---

### Widget 5 — Approvals Overdue

**Answers:** Which approvals are overdue?

**Query logic:**

| Include | Condition |
|---|---|
| Approval gates | `gateType = Approval` |
| Status | Submitted, Under Review, Rejected, Approved with Comments (unacknowledged) |
| Overdue | Current Planned past today (`factoryTimezone`) OR active `APPROVAL_PENDING` / `APPROVAL_REJECTED` / `APPROVAL_COMMENTS` signal |

**Sort:** Rejected first → Comments pending → overdue Under Review → by round desc.

**Row content:** Gate name · round · status badge (text, not color alone) · buyer/external owner · Current Planned · order PO ref.

**Row action:** Open order → Approval row expanded → rejection reason or comments visible.

---

### Widget 6 — Shipping This Week

**Answers:** Which orders ship this week?

**Query logic:**

| Include | Condition |
|---|---|
| EXF horizon | EXF gate `currentPlannedDate` within next 7 calendar days in `factoryTimezone` |
| Active | EXF not complete; order not Cancelled / Closed |

**Exclusion:** `EXF_AT_RISK` signal does **not** add orders to this widget — inclusion is date-based only.

**Sort:** EXF date asc → **`EXF_AT_RISK` sort boost** (orders with active signal rank higher among same-date peers) → `riskLevel` desc.

**Row content:** PO ref · EXF Current Planned · days remaining · shipment gate completion summary (FIN/SDR/VFB/PCK status chips) · CP Progress % · `calculatedAt`.

**Row action:** Open order → Shipment display group expanded → EXF visible.

---

### Widget 7 — SLA / Capacity Handoff

**Answers:** Which orders need sewing line allocation before floor work proceeds?

**Query logic:**

| Include | Condition |
|---|---|
| SLA gate | `milestoneCode = SLA` — not `isComplete`; not Skipped/N/A |
| Floor proximity | CST Current Planned within next 7 calendar days OR SLA Current Planned ≤ today (`factoryTimezone`) OR SLA overdue |
| Active | Order not Cancelled / Closed / On Hold; post-Confirm (`tnaInitialPlanningCompletedAt` set) |
| Blocker context | Optional: SLA blocked by hard gate predecessor — show blocked badge |

**Sort:** SLA overdue first → CST date asc → EXF date asc.

**Row content:** PO ref · SLA Current Planned · CST Current Planned · SLA status · **Capacity** badge (Section 2.5) · `calculatedAt`.

**Row action:** Open order → Floor display group → SLA row expanded; planner executes Branch 4.8 (Section 2.4).

**Note:** Module 1 `AssignedProductionLine` remains null in V1 — SLA gate completion is the planner-recorded allocation marker (Section 2.7 Module 5 handoff).

---

### Widget 8 — Since Yesterday

**Answers:** What changed since yesterday?

**Query logic:**

| Include | Condition |
|---|---|
| Timeline activity | `TimelineEvent.occurredAt ≥ yesterday 00:00 factoryTimezone` for portfolio |
| KPI changes | Order where `calculatedAt ≥ yesterday` AND (`riskLevel` changed OR `cpProgress` delta ≥ 5% OR summary status changed) |
| New completions | `TnaItemCompleted` events since yesterday (from event log or timeline `MILESTONE_COMPLETE`) |

**Presentation:** Chronological activity feed grouped by order — not a chart.

| Feed item type | Display |
|---|---|
| `PLANNED_DATE_REVISED` | "[Code]: planned date Mar 12 → Mar 19 (Mill Delay)" |
| `MILESTONE_COMPLETE` | "[Code] completed" |
| `CHASE_LOGGED` | "[Code]: chased [External owner type]" |
| `ORDER_ON_HOLD` / `ORDER_RESUMED` | Order-level lifecycle |
| Risk level change | "Risk: Medium → High — [primary reason]" |

**Filter:** Default since yesterday; toggle **since last visit** (session snapshot timestamp).

**Row action:** Open order → Timeline scrolled to event (Section 2.5 View in Timeline pattern).

---

### Widget interaction rules

| Rule | Detail |
|---|---|
| **No inline edit on dashboard** | Rows navigate — editing on TNA only |
| **Badge counts** | Widget header shows live count; updates on refresh |
| **calculatedAt** | Widget header shows newest `calculatedAt` among visible order rows |
| **Dismiss** | Planners cannot dismiss items — operational truth only |
| **Snooze** | Not in V1.1 — deferred (Section 3.8) |
| **Text before color** | All status and risk indicators use labels (Section 2.5) |

---

## Locked: Section 3.4 — Filters & Saved Views

### Global portfolio filters

Apply across all widgets and detail panel unless widget-specific override noted.

| Filter | Values | Source |
|---|---|---|
| **Order status** | Active (default) · On Hold · All non-terminal · Include Closed | Module 1 summary status + overrides |
| **Risk level** | Any · High · Medium · None | Order KPI cache — **sort and display only; not Morning Queue inclusion** |
| **Summary status** | Planning · Pre-Production · In Production · Shipment Prep · Shipped · … | Order aggregate |
| **Order Type** | New Development · Repeat · Repeat with Revision · Sample · SMS | Module 1 |
| **Buyer** | Org buyer list | Module 1 Order header |
| **Factory** | Org factory list (user-authorized subset) | Module 1 / org config |
| **EXF window** | Next 7 / 14 / 30 days | EXF gate dates in `factoryTimezone` |
| **Include planning orders** | Off (default for Morning Queue) · On | `tnaInitialPlanningCompletedAt` null |
| **My orders** | Internal owner = current user on any active gate | `TNAItem` owner |
| **Search** | PO ref · style · buyer · milestone code/name | Full-text on order + gate |

Filters persist in **session** and bind to **Saved Views** when saved.

### Saved Views

| Property | Detail |
|---|---|
| **Scope** | User-private (default) · Org-published (Org Admin) |
| **Contents** | Filter set · sort order · optional widget subset · meeting queue auto-populate flag |
| **System defaults (V1.1)** | **Morning Queue** · **EXF This Week** · **Fabric & Trim Chase** · **Approvals Waiting** · **SLA Pending** · **My Active Orders** |
| **Meeting integration** | View with `autoQueue = true` populates meeting queue on **Start Meeting** |

**Morning Queue (system default)** — **exact reproduction of locked Workflow 4.1**:

1. Active orders only (exclude Cancelled, Closed)
2. **Include if any one of:**
   - **(A)** Overdue critical gate — incomplete `isCritical` gate with Current Planned Date < today (`factoryTimezone`)
   - **(B)** EXF within 7 calendar days — EXF gate `currentPlannedDate` within next 7 days (`factoryTimezone`)
   - **(C)** Active `CP_STALL` signal on order
3. **Sort:** `riskLevel` desc → `daysToExFactory` asc — **`riskLevel` does not affect inclusion**
4. Planner may add/remove orders and drag-reorder before meeting

### Filter UX

| Element | Behavior |
|---|---|
| **Filter bar** | Sticky below priority strip; chip display for active filters |
| **Clear all** | One click — revert to Morning Queue default |
| **Saved view picker** | Dropdown with recents + org defaults + user saved |
| **Save as…** | Name required; optional "Set as my landing view" |
| **Share** | Org Admin publishes to org — read-only for other users |

---

## Locked: Section 3.5 — Daily Planning Workflow

Module 3 orchestrates the **daily planning cycle** (Section 2.4 Workflow 4) at portfolio level. It does not replace per-order TNA editing.

### Morning startup (before meeting)

```
Login (planner role)
    → Module 3 Planner Dashboard (default landing — V1.1)
    → Scan priority summary strip + eight widgets (operational triage — 5–10 min)
    → Review Since Yesterday for overnight surprises
    → Select Saved View: Morning Queue (or adjust filters)
    → Optional: prune/add orders · drag-reorder meeting queue
    → Start Meeting
```

### Production meeting (Meeting Mode)

Replaces Workflow 4.1 Module 1 list fallback.

```
Start Meeting
    → Meeting Mode chrome: "Order 1 of N" · timer optional · exit meeting
    → Open Order Command Center for queue[0] with meetingQueue={sessionId}
    → Execute Workflow 4.2 in-meeting sequence (locked Section 2.4)
    → Save TNA → Standard Engine Execution → return via Next Order
    → Repeat until queue complete or planner ends meeting
    → Auto-remove orders when EXF completes mid-meeting
    → End Meeting → summary screen (below)
```

**Meeting Mode navigation** — V1.1 runtime extension when `meetingQueue` query param present (Section 3.2):

| Element | Behavior |
|---|---|
| **Next Order / Previous Order** | Walk Module 3 session queue order — not Module 1 list sort |
| **Skip order** | Move to end of queue — mark "deferred" in session |
| **Remove from queue** | Drop from session queue — not order status change |
| **Jump to gate** | From dashboard widget mid-meeting — preserves queue position |
| **Unsaved guard** | Same as Section 2.5 — block navigation with dirty TNA |
| **Back to dashboard** | Exit Meeting Mode; queue state preserved in session |
| **Auto-remove** | Order dropped from queue on `OrderExFactoryCompleted` |

Locked Section 2.5 meeting navigation text remains unchanged for V1 and for order opens without `meetingQueue` param.

### End of meeting summary

System-generated from session activity — replaces planner-maintained meeting notes (Section 2.4 "Meeting-level V1") where data exists:

| Artifact | Source |
|---|---|
| Orders reviewed | Count of unique `orderId` opened during session |
| Orders deferred | Session skip list |
| Orders completed (EXF) | Auto-removed from queue on EXF complete |
| Timeline events recorded | Count per order from Production Timeline during session |
| Gates chased | `CHASE_LOGGED` events during session |
| Risk level changes | Orders where `OrderRiskLevelChanged` during session |

Planner may add **Meeting note** (free text, session-only V1.1 — not audit) for offline follow-ups.

### Between meetings (ad-hoc)

Planners return to Module 3 for:

- Chase List after external calls (Workflow 4.4)
- Material Blockers when mill updates ETA
- SLA / Capacity Handoff when line allocation decisions pending
- Since Yesterday when returning from lunch
- Ad-hoc order open — dashboard remains accessible via header logo

**Ad-hoc edits** follow same path: dashboard → open order → TNA branch → save — no dashboard write.

### Weekly Review entry (Workflow 5)

Production Manager opens **EXF This Week** or **At Risk Orders** saved view → scans cross-order lookahead → opens individual orders only when date revision or escalation needed (Section 2.4 Workflow 5). Module 3 is the **entry filter** for weekly review — not a separate module.

---

## Locked: Section 3.6 — Cross-order Operations

Cross-order operations **orchestrate per-order Module 2 saves** — no parallel milestone state (Section 2.7).

### V1.1 cross-order capabilities

| Operation | Mechanism | Scope |
|---|---|---|
| **Export chase list** | Generate plain-text / CSV from Chase List detail panel | Read-only export |
| **Bulk Last Chased = today** | Select rows in Chase List → confirm → bulk chase API (below) | External-owned gates only; max 50 per batch |
| **Add to meeting queue** | Multi-select orders from any widget | Session queue only |
| **Manual queue reorder** | Drag-reorder in meeting queue panel | Session only |
| **Open orders in sequence** | Meeting Mode | Navigation only |

### Bulk Chase API

Module 2 owns the chase mutation endpoint. Module 3 orchestrates N sequential calls for bulk operation.

**Endpoint:** `POST /orders/{orderId}/tna-items/{tnaItemUuid}/chase`

**Request payload:**

| Field | Type | Required | Detail |
|---|---|---|---|
| `lastChased` | date | Yes | Set to today in `factoryTimezone` |
| `optionalNote` | string | No | Appended to gate Notes if provided |
| `expectedVersion` | integer | Yes | Optimistic concurrency — `TNAItem.version` |

**Server behavior:**

1. Validate gate has external owner and is not complete
2. Set **Last Chased** = `lastChased`
3. Append optional note to gate Notes if provided
4. Run **Standard Engine Execution** (Section 2.4) — full engine pass in one transaction
5. Emit `CHASE_LOGGED` timeline event with actor **`userId`** from auth token
6. Return updated gate + order KPI cache fields including `calculatedAt`

**Bulk orchestration rules:**

| Rule | Detail |
|---|---|
| **Batch limit** | Maximum **50 gates** per bulk confirm dialog |
| **API ownership** | Module 2 TNA chase endpoint — one save per gate |
| **Transaction** | Each gate save is independent transaction — partial success reported |
| **Audit** | Each success emits `CHASE_LOGGED` with **`userId`** — auditable per gate |
| **Failure** | Failed rows listed with reason (version conflict, validation); successful rows committed |
| **No bulk complete** | Bulk milestone completion **not** in V1.1 — too high risk without per-gate review |
| **Engine** | No bypass — every call runs Standard Engine Execution |

### Explicitly not in V1.1

| Operation | Deferred to |
|---|---|
| Bulk Current Planned Date revision | Section 3.8 — requires Revision Reason per gate |
| Bulk milestone complete | Section 3.8 |
| Bulk ownership change | Section 3.8 |
| Cross-order TNA structure change | Not planned — per order only |
| Automated chase email to suppliers | Section 3.8 / buyer notifications |

### Cross-order read performance

| Constraint | V1.1 target |
|---|---|
| Bootstrap initial load | ≤ 2s for portfolio ≤ 200 active orders |
| Widget initial load | ≤ 2s for portfolio ≤ 200 active orders |
| Detail panel "View all" | Paginated — 50 rows per page |
| Bulk chase (50 gates) | ≤ 30s with progress indicator; partial results streamed |
| Export | Async for > 100 rows |

---

## Locked: Section 3.7 — Integration with Modules 1 & 2

Aligned with locked Section 2.7 — Module 3 integration contracts.

### Integration boundary

| Direction | Contract |
|---|---|
| **Module 3 → Module 1** | Read Order header, KPI cache, summary status, Overall Progress; navigate to Order Command Center |
| **Module 3 → Module 2** | Read `TNAItem`, active `RiskSignal`, `TimelineEvent`; navigate with deep-link; bulk chase via Module 2 chase API |
| **Module 3 → Module 2 write** | **No direct dashboard write** except orchestrated chase API calls (bulk chase); all other mutations via order page TNA |
| **Module 2 → Module 3** | Domain events for cache invalidation (in-process V1.1) |

### Data ownership (Module 3)

| Data | Owner | Module 3 role |
|---|---|---|
| Widget query results | Ephemeral cache | Compute on read; invalidate on events |
| Saved Views | Module 3 | User/org config |
| Meeting queue | Module 3 session | Not SSOT |
| Session snapshot | Module 3 session | Delta comparison only |
| All planning state | Module 2 | Read only |

### Domain events consumed (V1.1)

Per locked Section 2.7 — in-process subscribers:

| Event | Module 3 action |
|---|---|
| `OrderRiskLevelChanged` | Invalidate At Risk Orders widget + order row caches |
| `TnaItemCompleted` | Invalidate Today's Focus, Material Blockers, Shipping, SLA widgets |
| `OrderExFactoryCompleted` | Remove order from active portfolio widgets + **auto-remove from meeting queue** |
| `TnaPlanningCompleted` | Invalidate setup-phase filters; order eligible for Morning Queue |

Events **not** subscribed in V1.1: `TnaItemReopened`, `TnaPlanningReverted` — handled on navigation refresh (low volume).

### API ownership

| API | Owner | Module 3 usage |
|---|---|---|
| `GET /dashboard/bootstrap` | Module 3 | Initial load — session, widgets, org settings, priority strip |
| `GET /dashboard/widgets/{type}` | Module 3 | Individual widget refresh |
| `GET /dashboard/saved-views` | Module 3 | CRUD saved views |
| `GET /orders` (list + KPI cache) | Module 1 | Portfolio filters |
| `GET /orders/{id}/tna-items` | Module 2 | Gate-level queries |
| `POST /orders/{orderId}/tna-items/{tnaItemUuid}/chase` | Module 2 | Bulk chase orchestration |
| Order Command Center route | Module 1 | Deep-link target |

### Deep-link contract

Navigation from dashboard to order page:

```
/orders/{orderId}?tnaItem={tnaItemUuid}&group={displayGroup}&meetingQueue={sessionId}
```

Order page reads query params → scrolls TNA → expands row → uses session queue for prev/next when `meetingQueue` present. Without param, locked Section 2.5 V1 prev/next applies.

### Security

| Rule | Detail |
|---|---|
| **Tenant isolation** | All Module 3 queries scoped by auth `organizationId` |
| **Factory-level authorization** | Portfolio queries filter to user's authorized factories — consistent with Module 1 |
| **Role access** | Planner and Production Manager roles; Org Admin for published views only |
| **No bypass** | Dashboard cannot invoke engine without Module 2 Standard Engine Execution |
| **Export** | Chase list export respects same factory + order visibility as user's portfolio |
| **Bulk chase audit** | Every `CHASE_LOGGED` event records **`userId`** from authenticated session |

### V1 fallback (unchanged)

When Module 3 is not deployed (V1), locked Workflow 4.1 and Section 2.5 meeting navigation apply unchanged. Module 3 design does not alter locked V1 behavior. The `meetingQueue` runtime extension is a V1.1 additive behavior only.

---

## Locked: Section 3.8 — Future (V1.2+)

Extensions beyond **initial Module 3 V1.1 release** — not in first Planner Dashboard ship unless noted.

### Dashboard & UX

| Capability | Target | Dependency |
|---|---|---|
| User-customizable widget layout | V1.2 | Drag reorder; hide widgets |
| Snooze gate / order until date | V1.2 | Session overlay on query — not state change |
| Presentation mode | V1.2 | Large-type shared-screen layout (Section 2.5 deferral) |
| Mobile dashboard | V1.2 | Read-only portfolio scan; edit on order page |
| Since-last-session diff banner | V1.2 | Enhanced snapshot comparison on order open |
| Custom widget builder | Future | Org-defined query templates |

### Cross-order operations

| Capability | Target | Dependency |
|---|---|---|
| Bulk milestone update | V1.2 | Module 2 batch API; Revision Reason per gate (Section 2.8) |
| Bulk ownership change | V1.2 | Workflow 9 orchestration |
| Bulk Expected Date update | V1.2 | Material chase workflows |
| Saved filter sync across team | V1.2 | Shared org queue for multi-planner factories |

### Module integrations

| Capability | Target | Dependency |
|---|---|---|
| Material PO tracker widget | Module 4 | Module 4 read API — supplements Material Blockers |
| Line load / capacity widget | Module 5 | CST/SLA/EXF dates + allocation conflicts |
| Post-EXF shipment tracker widget | Module 6 | `OrderExFactoryCompleted` consumer |
| ERP inbound change feed | ERP connector | Since Yesterday includes ERP-sourced timeline events |
| Module 7 reporting link | Module 7 | "View report" — dashboard stays operational |

### Events & infrastructure

| Capability | Target | Notes |
|---|---|---|
| Durable event subscription | V1.2 | Async invalidation from Section 2.7 outbox |
| `OrderSummaryStatusChanged` subscription | V1.2 | Widget refresh on phase transition |
| `TnaInstantiated` subscription | V1.2 | New order appears in portfolio widgets |
| Order lifecycle domain events | V1.2 | On Hold / Cancelled feed in Since Yesterday |
| Webhook / Slack digest | Future | Morning summary — not V1.1 scope |

### Notifications & automation

| Capability | Target | Notes |
|---|---|---|
| Buyer / supplier chase reminders | Future | Section 2.1 deferral — planner manual in V1/V1.1 |
| Auto-generated meeting agenda PDF | Future | Export from meeting queue |
| AI prioritization suggestions | Future | Section 2.1 — not V1 |

### Explicit non-goals (remain out of scope)

- Executive KPI dashboards and trend analytics (Module 7)
- Gantt portfolio view (Section 2.8)
- Real-time multi-user presence on dashboard
- Replacement of ERP MRP or material planning systems

---

#### Relationship to locked sections

| Section | Relationship |
|---|---|
| **Module 1** | Order Command Center remains edit surface; dashboard is entry point |
| **2.4 Workflow 4.1** | Morning Queue saved view matches inclusion rules exactly; sort matches list fallback |
| **2.5** | Deep-links, text-before-color, keyboard patterns extended by Meeting Mode via `meetingQueue` runtime extension — locked text unchanged |
| **2.6** | `factoryTimezone`, `hardGateLookaheadDays`, and related org settings drive all date logic |
| **2.7** | Read/write integration contracts; event consumption; chase API ownership |
| **2.8** | Module 3 listed as V1.1 deliverable; this section extends beyond initial ship |

---
## Module 4: Material Planning & Procurement

> **Status:** Locked — Sections 4.1–4.8 complete  
> **Baseline:** Module 1 locked; Module 2 locked (Sections 2.1–2.8); Module 3 locked (Sections 3.1–3.8)

---

## Locked: Section 4.1 — Purpose & Scope

### Purpose

Module 4 is the **material planning and procurement workspace** for apparel production planners. It organizes **what must be bought**, **what has been ordered**, and **what has arrived** — across orders — while keeping **material readiness state** on Module 2 TNA Material gates (BFO, BFI, BTO, BTI) as the single source of truth for production blocking.

Module 4 answers five operational questions planners ask daily about materials:

| Question | Primary surface |
|---|---|
| **What does this order need?** | Order Material Plan — requirements lines derived from BOM freeze |
| **What is on order and with whom?** | Procurement tracker — PO lines by supplier |
| **What arrived and what is still short?** | Receipt workspace — PO-line qty vs requirement with TNA sync |
| **Which materials will block cutting this week?** | **Module 3 Material Blockers widget** (TNA signals) — Module 4 does not duplicate; see Section 4.4 boundary |
| **Does ordered qty match the BOM?** | Validation panel — qty variance before and after receipt |

**Architectural stance:** Module 4 owns **procurement artifacts and planning views** (requirements, PO lines, supplier references, BOM validation). It does **not** own milestone completion, risk generation, or CP Progress — those remain Module 2. All gate state changes route through the **Module 2 material transition API** (Section 2.7).

### What this module is

- **Material requirements workspace** — structured BOM/requirement lines per order, anchored to BOM gate freeze (Section 2.2)
- **Procurement tracker** — PO placement, ETD/ETA, and supplier contact context linked to BFO/BTO gates
- **Receipt orchestration** — batch-friendly receipt entry that writes BFI/BTI state via Module 2 API
- **Cross-order material portfolio** — open POs, mill/supplier workload, ETA conflict triage (read-heavy)
- **BOM validation layer** — compares requirement qty to TNA Qty Ordered / Qty Received (Section 2.8 deferral)
- **ERP-ready document linking** — authoritative SAP/MM document IDs on PO lines and receipt log; `materialDocumentReference` on TNA gate holds primary doc only (Section 4.2)

### What this module is not

| Not this | Why |
|---|---|
| **TNA editor replacement** | Material gate status, dates, Receipt %, and risk remain on embedded TNA (Module 2) — but qty/status fields become **read-only on TNA when Module 4 is active** for that order (Section 4.2) |
| **Inventory / WMS** | No warehouse bins, stock-on-hand, or allocation — out of V1 scope (MVP Principles) |
| **Full purchasing / accounting system** | No invoice matching, payment terms, or GL — PO tracking only |
| **Supplier CRM** | No vendor scorecards, contracts, or onboarding — external owner types from Module 2 only |
| **Risk engine** | Reads active `MATERIAL_ETA_CONFLICT` and `PARTIAL_RECEIPT` from Module 2 — never recomputes |
| **PLM / tech pack authoring** | BOM source may import from external systems; Module 4 does not author tech packs |

### Release boundary

Per locked Module 2 Sections 2.7 and 2.8:

| Release | Behavior |
|---|---|
| **V1** | Module 4 **does not ship**. Planner updates BFO/BFI/BTO/BTI manually on TNA (Workflow 4.5). Module 3 Material Blockers widget reads TNA only. `materialDocumentReference` remains null. |
| **V1.1 (this module)** | Material Planning & Procurement workspace ships. Requirements, PO lines, receipt orchestration, and BOM validation available. All gate writes through Module 2 material transition API. |
| **Future (Section 4.8)** | Style/colorway-scoped requirements, ERP inbound PO sync, automated mill notifications. |

### Relationship to locked modules

| Module | Relationship |
|---|---|
| **Module 1** | Reads Order header (PO ref, style, qty, factory); navigates to Order Command Center for order context; does not duplicate Order attachments |
| **Module 2** | **SSOT for material gate state** on BFO/BFI/BTO/BTI `TNAItem` records; Module 4 writes via material transition API only |
| **Module 3** | Material Blockers widget continues reading TNA until Module 4 ships; V1.1 adds optional Material PO tracker widget (Section 3.8) fed by Module 4 read API |

### Primary users

| Role | Use |
|---|---|
| **Production Planner** | Create requirements from BOM freeze; record PO placement; enter receipts; chase mills via linked TNA gates |
| **Production Manager** | Portfolio view of open material exposure; review qty variances before cutting |
| **Org Admin** | Configure `OrganizationMaterialSettings` — UOM list, tolerance, PO prefix (Section 4.3) |
| **Service account (ERP)** | V1.1 scoped role `tna:transition:material` — must include Module 4 reconciliation metadata (Section 4.6) |

### Authorization

| Rule | Detail |
|---|---|
| **Tenant isolation** | All queries scoped by auth `organizationId` |
| **Factory-level access** | Same factory visibility rules as Module 1 and Module 3 — planners see only orders in authorized factories |
| **Write path** | Material gate mutations require Module 2 save permissions; Module 4 UI invokes Module 2 API — no direct TNA table writes |
| **Service accounts** | ERP integration uses scoped roles — not planner UI permissions |

---

## Locked: Section 4.2 — Architecture & Ownership

### Ownership matrix

| Concern | Owner | Module 4 role |
|---|---|---|
| Material gate status (Ordered, In Transit, Partially Received, Complete) | **Module 2 `TNAItem`** | Write via material transition API only |
| Qty Ordered / Qty Received / Receipt % / UOM on gates | **Module 2 `TNAItem`** | Module 4 computes **aggregate** from PO lines; Module 2 persists |
| `expectedDate` (ETA) on **BFO/BTO** | **Module 2 `TNAItem`** | Set while Ordered / In Transit (Section 4.2 ETA state machine) |
| `expectedDate`, receipt qty on **BFI/BTI** | **Module 2 `TNAItem`** | Set on first partial / full receipt only |
| `orderedDate`, supplier reference on gate | **Module 2 `TNAItem`** | Module 4 pre-fills from primary PO line on sync |
| `materialDocumentReference` on gate | **Module 2 `TNAItem`** | **Primary / latest** SAP doc only — display convenience |
| SAP/MM document IDs (authoritative) | **Module 4 `MaterialPOLine` + `MaterialReceiptLog`** | One or more docs per PO line and receipt |
| PO-line qty ordered / qty received | **Module 4 `MaterialPOLine`** | SSOT for line-level procurement |
| Risk signals (`MATERIAL_ETA_CONFLICT`, `PARTIAL_RECEIPT`) | **Module 2 engine** | Module 4 reads; never creates or clears |
| CP Progress, hard gates, timeline events | **Module 2 engine** | Standard Engine Execution on every material save |
| Material requirement lines (BOM breakdown) | **Module 4** | Not duplicated on TNA |
| PO line records (placement tracking) | **Module 4** | Links to requirement + BFO/BTO gate UUID |
| Procurement receipt audit | **Module 4 `MaterialReceiptLog`** | Append-only; timeline remains Module 1 via Module 2 |
| Cross-order procurement queries | **Module 4 read API** | Portfolio aggregation |
| ERP reconciliation queue | **Module 4** | Surfaces TNA-only receipts without PO link |

**Core rule:** Module 4 never maintains a parallel copy of BFO/BFI/BTO/BTI **completion state**. PO-line receipt qty is Module 4 SSOT; gate Receipt % is an **aggregate mirror** computed and pushed to Module 2 on each receipt sync.

### Order-type applicability (Material gate activation)

Module 4 availability depends on linked TNA Material gate states — not order type alone. Locked templates (Section 2.2) define defaults:

| TNA Material gate state | Module 4 behavior |
|---|---|
| BFI and BTI **active** (not N/A, not Skipped) | **Full Module 4** — requirements, PO, receipt sync enabled |
| Material gates **Skipped** | Module 4 **disabled** for PO/receipt sync; warn if planner opens Material Plan |
| Material gates **N/A** (e.g. Sample order — BFO–BTI N/A) | Module 4 **disabled** — no requirements, PO, or receipt workflows; Material Plan action hidden on Order Command Center |
| Order **On Hold / Cancelled / Closed** | Module 4 **read-only** — inherits Module 2 edit freeze |

**Sample / SMS orders:** Bulk material gates are N/A by template — Module 4 does not ship workflows for these order types in V1.1.

### Dual-path coexistence (Module 4 active vs. manual TNA)

When an order has **≥1 `MaterialRequirement` or active `MaterialPOLine`**, Module 4 is **active** for that order:

| Surface | Behavior when Module 4 active |
|---|---|
| TNA Material row (BFO/BFI/BTO/BTI) | **Qty Ordered, Qty Received, Receipt %, material_status, expectedDate** — **read-only** on embedded TNA panel |
| TNA Material row — other fields | Notes, chase (Last Chased), ownership — **still editable** on TNA |
| Module 4 Receipt / PO workflows | **Required write path** for qty and status fields above |
| Orders without Module 4 adoption | Workflow 4.5 manual path unchanged — planner edits TNA directly |

**Break-glass override:** Production Manager may unlock TNA Material qty/status for one save with required reason → timeline `MODULE4_SYNC_BYPASS` → Module 4 shows **"Out of sync — reconcile"** banner until planner re-syncs from Material Plan or receipt workspace.

**Reconciliation on read:** Module 4 compares gate aggregate to sum of PO lines on every Material Plan load; mismatch surfaces reconciliation queue item (Section 4.6).

### ETA / status state machine (BFO/BTO vs. BFI/BTI)

Aligned with locked Workflow 4.5 and Section 2.3 Material transitions — **no ambiguous gate selection**:

| Phase | Authoritative gate | `material_status` | `expectedDate` (ETA) |
|---|---|---|---|
| PO not yet placed | BFO / BTO | Not Started | — |
| PO confirmed | BFO / BTO | Ordered | — (`orderedDate` = today) |
| Mill confirms shipment | BFO / BTO | In Transit | **ETA on BFO/BTO** |
| First physical receipt | BFI / BTI | Partially Received | BFI/BTI may inherit BFO/BTO ETA until revised |
| Full receipt | BFI / BTI | Complete | Actual Date set; Receipt % = 100 |

**ETA mirror rule (Module 4 sync — aligns with Module 3 Material Blockers and Section 2.3 `MATERIAL_ETA_CONFLICT`):** When BFO/BTO transitions to In Transit, Module 4 **also writes `expectedDate` on the paired BFI/BTI** while BFI/BTI remain **Not Started** (planning mirror only — no status change). Locked risk engine evaluates Material `expectedDate` on instances in the predecessor chain; Module 3 Widget 4 surfaces BFI/BTI ETAs (Section 3.3). Without mirror, in-transit ETA would be invisible to production-blocking views.

**Rule:** While fabric/trim is in transit, **authoritative ETA entry** is on BFO/BTO (M4.3). BFI/BTI receive mirrored `expectedDate` on sync. BFI/BTI status remains Not Started until first receipt. On first receipt, BFI/BTI status advances; mirror ETA may be revised.

### Logical architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│              Module 4 — Material Planning & Procurement (UI)               │
│  Order Material Plan · Procurement Tracker · Receipt Workspace           │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ read queries · orchestrated writes
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│           Module 4 Service Layer (requirements, PO lines, validation)    │
└───────┬─────────────────────────────┬───────────────────────────────────┘
        │                             │
        ▼                             ▼
┌───────────────────┐     ┌───────────────────────────────────────────────┐
│ Module 4 store    │     │ Module 2 material transition API               │
│ MaterialRequirement│     │ POST material saves → Standard Engine Execution│
│ MaterialPOLine    │     │ BFO/BFI/BTO/BTI TNAItem state                  │
│ MaterialReceiptLog│     │                                                 │
└───────────────────┘     └───────────────────────────────────────────────┘
        │                             │
        └─────────────┬───────────────┘
                      ▼
        ┌───────────────────────────────────────────────┐
        │ Module 1 read · Module 3 widget projections  │
        └───────────────────────────────────────────────┘
```

### Material gate pairing (integration reference)

Locked Module 2 gate library defines four Material gates. Module 4 maps procurement activity to pairs:

| Pair | Ordered gate | In-House gate | Module 4 procurement focus |
|---|---|---|---|
| **Fabric** | BFO — Bulk Fabric Ordered | BFI — Bulk Fabric In-House | Fabric PO → BFO; receipts → BFI |
| **Trim** | BTO — Bulk Trim Ordered | BTI — Bulk Trim In-House | Trim PO → BTO; receipts → BTI |

**BOM gate (Standard, code `BOM`)** — "BOM / Trims Card Freeze" — is a **planning prerequisite**, not a Module 4 entity. Module 4 requirements are created **after** BOM gate is Complete (soft enforcement — warning if not complete, not hard block in V1.1).

### Link model

Every Module 4 procurement artifact links to TNA via immutable keys:

| Module 4 entity | Required link | Optional link |
|---|---|---|
| `MaterialRequirement` | `orderId`, `materialCategory` (Fabric \| Trim \| Other) | `styleId`, `colorwayId` (reserved — Order scope in V1.1) |
| `MaterialPOLine` | `orderId`, `tnaItemUuid` (BFO or BTO), `materialRequirementId`, `qtyOrdered`, `uom` | `materialDocumentReference` (authoritative SAP PO doc) |
| `MaterialReceiptLog` | `materialPOLineId`, `tnaItemUuid` (BFI or BTI), `qtyReceived`, `receiptDate`, `userId` | `materialDocumentReference` (GRN doc), `correlationId` |
| Receipt batch item | `materialPOLineId`, `tnaItemUuid` (BFI or BTI) | Incremental qty for that PO line only |

**PO line → gate pairing:** `MaterialPOLine.tnaItemUuid` always references **BFO or BTO** (ordered gate). Receipts always target **BFI or BTI** (in-house gate) derived from category: Fabric → BFI, Trim → BTI.

### Receipt allocation rules (PO line vs. gate aggregate)

| Layer | SSOT | Rule |
|---|---|---|
| **PO line** | `MaterialPOLine.qtyReceived` | Incremented on each receipt action against that line |
| **Requirement** | Sum of linked PO line receipts | BOM validation compares to `qtyRequired` |
| **TNA gate (BFI/BTI)** | Module 2 after sync | `Qty Received` = **sum of active PO line `qtyReceived`** for that in-house pair |
| **Receipt %** | Module 2 after sync | Computed from gate `Qty Ordered` vs. aggregate `Qty Received` (Section 2.3) |
| **PO line status** | **Derived in Module 4** | `Open` / `Partially Received` / `Complete` / `Archived` from **own** qty only — not from gate status |

**Sync order on receipt:** (1) append `MaterialReceiptLog` → (2) update PO line `qtyReceived` → (3) compute gate aggregate → (4) call Module 2 material transition API for BFI/BTI.

### Architectural principles

| # | Principle |
|---|---|
| 1 | **TNA is readiness SSOT** — Module 4 orchestrates; Module 2 commits |
| 2 | **One engine run per gate mutation** — each BFO/BFI/BTO/BTI save = one Module 2 Standard Engine Execution; batch receipt orchestrates N atomic saves |
| 3 | **PO line owns line receipt qty** — gate Receipt % is aggregate mirror; PO line status derived independently |
| 4 | **Requirements ≠ gates** — BOM lines live in Module 4; readiness milestones live on TNA |
| 5 | **Validation is advisory** — qty variance warnings before PO and on receipt; never bypasses Module 2 engine rules |
| 6 | **Tenant-scoped** — all entities carry `organizationId` |
| 7 | **Factory-scoped visibility** — inherits Module 1 order factory assignment |
| 8 | **Single write path when active** — Module 4 active orders: qty/status on TNA Material rows edited only via Module 4 (or break-glass) |
| 9 | **Event-informed refresh (V1.1)** — subscribe to `TnaItemCompleted`, `OrderRiskLevelChanged`, timeline `MATERIAL_ETA_UPDATED` / `MATERIAL_QTY_CHANGED` for portfolio cache invalidation |

---

## Locked: Section 4.3 — Material Requirements Model

### Purpose

The **Material Requirements** model captures **what the order needs** — fabric types, trim items, quantities, and UOM — as structured lines planners maintain after BOM freeze. Requirements feed procurement PO lines and receipt validation; they do **not** replace TNA Material gates.

### OrganizationMaterialSettings

Org-level configuration for Module 4 — separate from `OrganizationTnaSettings` (Section 2.6). Configured by **Org Admin** only in V1.1.

| Field | Default | Purpose |
|---|---|---|
| `allowedUoms[]` | meters, yards, kg, pieces | Valid UOM list for requirements and PO lines |
| `qtyTolerancePercent` | 5 | Over-order warning threshold vs. `qtyRequired` |
| `poReferencePrefix` | null | Optional auto-prefix for PO reference sequencing |
| `requirementCategories[]` | Fabric, Trim, Other | Extensible category list |
| `module4Enabled` | true | Org-wide feature flag for V1.1 rollout |

**V1.1 scope:** No factory-level overrides — single org config (factory overrides → V1.2, consistent with Section 2.6 deferral).

### Entity: MaterialRequirement

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | UUID | Yes | Primary key |
| `organizationId` | UUID | Yes | Tenant boundary |
| `orderId` | UUID | Yes | FK to Module 1 Order |
| `materialCategory` | Enum | Yes | Fabric \| Trim \| Other |
| `itemDescription` | String | Yes | e.g. "Main body fabric — 100% cotton twill" |
| `itemCode` | String | No | Internal or buyer material code |
| `qtyRequired` | Decimal | Yes | From BOM / trims card |
| `uom` | String | Yes | Must match `OrganizationMaterialSettings.allowedUoms` |
| `linkedGateCode` | String | Yes | `BFI` or `BTI` — which In-House gate this requirement rolls up to |
| `linkedTnaItemUuid` | UUID | No | Set when TNA instantiated — BFI or BTI instance |
| `notes` | Text | No | Planner annotations |
| `sourceReference` | String | No | External BOM doc ID (ERP/PLM) |
| `createdAt` / `updatedAt` | Timestamp | Yes | Audit |
| `version` | Integer | Yes | Optimistic concurrency |

**V1.1 scope:** All requirements are **Order-scoped** (`TNAItemScope = Order`). `styleId` / `colorwayId` FKs reserved null — same pattern as locked Module 2 scope deferral.

**Precondition:** Order must pass order-type applicability check (Section 4.2) — Material gates not N/A.

### Entity: MaterialPOLine

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | UUID | Yes | Primary key |
| `organizationId` | UUID | Yes | Tenant boundary |
| `orderId` | UUID | Yes | FK to Module 1 Order |
| `materialRequirementId` | UUID | Yes | FK to requirement |
| `tnaItemUuid` | UUID | Yes | **BFO or BTO** instance — ordered gate |
| `poReference` | String | Yes | Org-sequenced or free text |
| `supplierName` | String | No | Line-level supplier — may differ from gate external owner |
| `qtyOrdered` | Decimal | Yes | PO line qty |
| `qtyReceived` | Decimal | Yes | Default 0 — **SSOT for line-level receipt** |
| `uom` | String | Yes | Must match requirement UOM for same in-house roll-up |
| `etd` | Date | No | Estimated ship date from mill |
| `expectedEta` | Date | No | Mirrors BFO/BTO `expectedDate` on sync |
| `materialDocumentReference` | String | No | **Authoritative** SAP MM PO document ID for this line |
| `status` | Enum | Derived | Open · Partially Received · Complete · Archived |
| `archivedAt` | Timestamp | No | Set on cancel / supersede |
| `createdAt` / `updatedAt` | Timestamp | Yes | Audit |
| `version` | Integer | Yes | Optimistic concurrency |

**PO line status derivation:**

| Condition | Status |
|---|---|
| `archivedAt` set | Archived |
| `qtyReceived` = 0 | Open |
| 0 < `qtyReceived` < `qtyOrdered` | Partially Received |
| `qtyReceived` ≥ `qtyOrdered` | Complete |

### Entity: MaterialReceiptLog

Append-only procurement audit — **required** for every receipt action in V1.1. Production audit remains on Module 1 Timeline via Module 2.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | UUID | Yes | Primary key |
| `organizationId` | UUID | Yes | Tenant boundary |
| `materialPOLineId` | UUID | Yes | FK to PO line |
| `tnaItemUuid` | UUID | Yes | BFI or BTI — gate updated |
| `qtyReceived` | Decimal | Yes | Increment applied in this action |
| `qtyReceivedCumulative` | Decimal | Yes | PO line total after action |
| `receiptDate` | Date | Yes | Physical receipt date |
| `materialDocumentReference` | String | No | SAP GRN / material document ID |
| `userId` | UUID | Yes | Actor — planner or service account |
| `sourceModule` | Enum | Yes | `module-4-ui` \| `erp-inbound` \| `break-glass-sync` |
| `correlationId` | UUID | Yes | Module 2 save transaction id |
| `notes` | Text | No | Lot / roll notes |
| `createdAt` | Timestamp | Yes | Immutable — no updates |

### Requirement lifecycle

```
BOM gate Complete (TNA)
    → Planner creates / imports MaterialRequirement lines
    → Planner creates MaterialPOLine(s) linked to BFO/BTO
    → PO placed → Module 4 triggers BFO/BTO "Mark ordered" via Module 2 API
    → Receipts update PO line qtyReceived → aggregate sync to BFI/BTI
    → MaterialReceiptLog append → BOM validation vs qtyRequired
```

### BOM import (V1.1)

| Source | Behavior |
|---|---|
| **Manual entry** | Planner adds lines in Order Material Plan UI |
| **Copy from previous order** | Duplicate requirements only (not PO lines) from prior order; warn if order types differ or target has Material gates N/A |
| **CSV import** | V1.1 — maps columns to requirement fields; does not auto-update TNA gates |
| **ERP inbound** | Future — idempotent by `sourceSystem` + `sourceReference` (Section 2.7 pattern) |

### Roll-up rules

| materialCategory | linkedGateCode | Rolls up to TNA gate |
|---|---|---|
| Fabric | BFI | Single BFI instance receives aggregate fabric receipts |
| Trim | BTI | Single BTI instance receives aggregate trim receipts |
| Other | BFI or BTI | Planner assigns at creation |

**V1.1 simplification:** One BFI and one BTI gate per order (locked template). Multiple requirement lines roll up to the same In-House gate.

**Gate qty sync rules:**

| Gate field | Computation |
|---|---|
| BFO/BTO `Qty Ordered` | Sum of **active** (non-archived) linked PO line `qtyOrdered` — pushed on PO confirm/amend |
| BFI/BTI `Qty Received` | Sum of active PO line `qtyReceived` — pushed on each receipt sync |
| BFI/BTI `Receipt %` | Module 2 engine from gate qty fields (Section 2.3) |
| BFO/BTO `materialDocumentReference` | **Primary doc only** — latest PO line doc or planner-selected primary; full doc list on PO lines |

**UOM constraint:** All PO lines rolling up to the same BFI or BTI must share **identical UOM**. Mixed UOM on one in-house gate → error at PO creation.

Planner break-glass override on TNA qty triggers reconciliation banner (Section 4.2) — not silent override.

### Validation rules (requirement layer)

| Rule | Severity | When |
|---|---|---|
| `qtyRequired` > 0 | Error | Save requirement |
| UOM matches org-allowed list | Error | Save requirement |
| BOM gate not Complete | Warning | First requirement create — "BOM not frozen" |
| Duplicate itemCode + category on same order | Warning | Save — planner may confirm |
| Sum of PO line qty > qtyRequired × (1 + tolerance) | Warning | PO line save — `OrganizationMaterialSettings.qtyTolerancePercent` |

Tolerance is org-configurable in `OrganizationMaterialSettings` — not a Module 2 business rule.

---

## Locked: Section 4.4 — Procurement Workflows

### Overview

Procurement workflows bridge **planning intent** (requirements) and **TNA readiness gates** (BFO/BTO ordered, BFI/BTI in-house). Every workflow that changes gate state ends in **Module 2 Standard Engine Execution**.

### Workflow M4.1 — Create material plan from BOM freeze

**Trigger:** BOM gate (`BOM`) marked Complete on TNA, and order passes applicability check (Section 4.2).

**Pre-check:** If BFI/BTI gates are N/A (Sample order) → **block** — Material Plan unavailable.

**Steps:**

1. Open **Order Material Plan** from Order Command Center (Module 1 action) or Module 4 portfolio filtered to order
2. If BOM not Complete → show warning banner; planner may proceed on Repeat/New Dev paths only
3. Add requirement lines — manual entry or copy from previous order (requirements only)
4. Confirm roll-up mapping (Fabric → BFI, Trim → BTI)
5. Save requirements — no TNA mutation; order becomes **Module 4 active** (Section 4.2 dual-path)

**Output:** `MaterialRequirement` rows persisted; linked TNA UUIDs resolved from order's TNA instance list.

### Workflow M4.2 — Place bulk fabric / trim order (PO)

**Trigger:** Requirements exist; planner ready to order from mill/supplier.

**Steps:**

1. Select requirement line(s) — same `materialCategory` and external owner type
2. Create **MaterialPOLine:**
   - PO reference (org-sequenced or free text)
   - Qty ordered, UOM (defaults from requirement)
   - Supplier name (free text — mirrors TNA supplier reference)
   - ETD (optional), expected ETA
   - Link to BFO or BTO `tnaItemUuid`
3. On PO confirm → Module 4 calls Module 2 material transition on **BFO/BTO**:
   - First PO on gate: Not Started → **Ordered**; `orderedDate` = today
   - Subsequent PO on same gate: gate already Ordered/In Transit — update `Qty Ordered` only (sum sync)
   - Set `materialDocumentReference` on gate to **primary** doc; authoritative doc on PO line
4. **Engine Execution** → timeline `MATERIAL_QTY_CHANGED` / status events as applicable
5. Return to Material Plan — PO line shows **derived** line status

**Multi-line PO:** Multiple `MaterialPOLine` rows may link to one BFO/BTO gate. Gate `Qty Ordered` = sum of active PO lines. All lines must share UOM (Section 4.3).

**Supplier vs. gate owner:** PO line `supplierName` may differ from TNA external owner (e.g. lining mill vs. body fabric gate owner). Chase List (Module 3) remains gate-scoped; Module 4 Open POs is supplier-scoped.

### Workflow M4.3 — Update PO / chase mill (ETA change)

**Trigger:** Mill confirms revised ETD/ETA; planner needs to update procurement record and TNA.

**Steps:**

1. Open PO line in Procurement Tracker
2. Update ETD / expected ETA / supplier notes on PO line
3. Module 4 calls Module 2 on **BFO/BTO** and **mirrors ETA to paired BFI/BTI** (Section 4.2 ETA state machine):
   - If gate status Ordered and first ETA set → BFO/BTO transition to **In Transit**
   - Update BFO/BTO `expectedDate` = PO line `expectedEta`
   - Mirror same `expectedDate` to BFI/BTI (status unchanged — Not Started until receipt)
4. **Engine Execution** — may activate `MATERIAL_ETA_CONFLICT` on BFI/BTI mirrored ETA vs. dependent Current Planned Date
5. Planner may set **Last Chased** via Module 2 chase API (Workflow 4.4) — Module 4 UI exposes same action on PO row

**Note:** Chase updates Last Chased only — same rule as locked Workflow 4.4.

### Workflow M4.4 — Cancel or amend PO line

**Trigger:** PO reduced, cancelled, or superseded.

| Situation | Module 4 action | TNA action |
|---|---|---|
| PO line cancelled; `qtyReceived` = 0 | Archive PO line | Recompute BFO/BTO `Qty Ordered` from remaining active lines; revert to **Not Started** if no active lines remain |
| PO qty reduced below `qtyReceived` | **Block** — error | No change — planner must adjust receipts first |
| PO qty reduced; `qtyReceived` = 0 | Update PO line `qtyOrdered` | Recompute gate `Qty Ordered` sum |
| PO cancelled after **partial receipt** | Archive PO line; retain ReceiptLog | **Do not auto-revert** BFO/BTO or BFI/BTI — gate reflects physical stock; planner uses Workflow 7 reopen if correction needed |
| PO superseded | Archive old line; create new line | Transfer open balance explicitly on new line; no implicit gate reset |
| Requirement `qtyRequired` reduced below sum of PO qty | Warning | Planner must amend or cancel PO lines manually |

**Receipt-aware rule:** Cancelling a PO line with `qtyReceived` > 0 archives the line but **does not** reduce BFI/BTI `Qty Received` — physical receipt already synced. Planner must record receipt reversal via break-glass + Workflow 7 or adjusting remaining PO lines.

All TNA mutations via Module 2 API — Module 4 archives PO lines in its own store only.

### Portfolio views and Module 3 boundary (P1-1)

Module 4 and Module 3 serve **distinct questions** — no overlapping query logic:

| Question | Owner | Surface |
|---|---|---|
| **Which materials block production / cutting?** | **Module 3** | Material Blockers widget — reads TNA `RiskSignal`, hard-gate blocking (Section 3.3 Widget 4) |
| **Which POs are open / overdue from mills?** | **Module 4** | Open POs portfolio — reads `MaterialPOLine` + BFO/BTO ETA |
| **Which orders have procurement exposure?** | **Module 4** | Open POs + optional Module 3 Material PO tracker (Section 3.8) |

Module 4 **does not** implement a production-blocking portfolio view. Receipt workspace and Open POs may **display** active TNA signals (read-only) for context — they do not recompute blocking logic.

### Portfolio: Open POs view

Cross-order read surface (Module 4 home):

| Column | Source |
|---|---|
| Order PO ref | Module 1 Order |
| Material category | Requirement |
| Supplier | PO line / TNA supplier reference |
| PO reference | MaterialPOLine |
| Qty ordered / received | **PO line** `qtyOrdered` / `qtyReceived` (not gate aggregate) |
| PO line status | Derived — Open / Partially Received / Complete |
| ETA | BFO/BTO TNA `expectedDate` (in-transit phase) |
| Gate status | BFO/BTO or BFI/BTI TNA `material_status` (context column) |
| Risk | Module 2 active signals (read-only context) |

**Sort default:** ETA ascending, then orders with `MATERIAL_ETA_CONFLICT` first (match Module 3 Material Blockers priority).

---

## Locked: Section 4.5 — Receipt & TNA Gate Synchronization

### Purpose

Receipt entry is the **primary write path** from Module 4 to Module 2. Planners record physical arrivals; Module 4 translates receipts into BFI/BTI gate transitions per locked Section 2.3 Material workflows and Workflow 4.5.

### Workflow M4.5 — Record material receipt

**Trigger:** Fabric or trim arrives at factory.

**Precondition:** Order Module 4 active; BFI/BTI gates not N/A.

**Steps:**

1. Open **Receipt Workspace** — filter by order, or scan PO reference
2. Select **MaterialPOLine** (required — no gate-only receipt in normal path)
3. Enter:
   - Qty received (**incremental** — added to PO line `qtyReceived`)
   - Receipt date
   - Optional lot / roll notes → stored on `MaterialReceiptLog`
   - Optional GRN document ID → `MaterialReceiptLog.materialDocumentReference`
4. Module 4 **append-only** `MaterialReceiptLog` entry
5. Update PO line `qtyReceived` (cumulative) and derived line status
6. Compute **gate aggregate:** sum active PO line `qtyReceived` → proposed BFI/BTI `Qty Received`; recompute Receipt % from gate `Qty Ordered` (Section 2.3)
7. Module 4 calls Module 2 material transition API on **BFI/BTI**:
   - First receipt on gate: BFI/BTI Not Started → **Partially Received** (or Complete if full in one delivery)
   - Partial: update Qty Received, Receipt %
   - Full: → **Complete**; Receipt % = 100; Actual Date = receipt date
8. **Engine Execution** — may clear `PARTIAL_RECEIPT`, update CP Progress, emit timeline events
9. Module 4 runs **BOM validation** — compare PO line cumulative received to linked `qtyRequired`

**Unplanned receipt (no PO line):** Planner may create **stub PO line** (qty ordered = receipt qty, marked "unplanned") in same flow — then proceed steps 4–9. Avoids gate-only writes that bypass procurement audit.

**Validation on confirm:**

| Check | Result |
|---|---|
| PO line incremental + cumulative > `qtyOrdered` | Soft warning — same as Section 2.3 (planner note to confirm) |
| Gate aggregate received > gate Qty Ordered | Soft warning on Module 2 save |
| Cumulative received < `qtyRequired` at PO line Complete | Warning — "Under-received vs BOM" — does not block save |
| Cumulative received > `qtyRequired` × (1 + tolerance) | Warning — over-receipt |

### Batch receipt (multi-order)

V1.1 supports batch receipt entry for planners receiving multiple POs same day:

- Max **20 orders** per batch (distinct from Module 3 bulk chase limit of 50 — different operation)
- Each order/item saves as **separate Module 2 transaction** — partial batch failure rolls back failed items only
- Each successful item: one `MaterialReceiptLog` + PO line update + one gate sync save
- Batch summary shows success/failure per row

### Sync direction summary

| Data element | Authoritative writer | Module 4 behavior |
|---|---|---|
| PO line `qtyReceived` | **Module 4** | Incremented on receipt; SSOT for line fulfillment |
| PO line status | **Module 4 (derived)** | From own qty — not from gate |
| Gate `material_status` | Module 2 | Module 4 requests transitions after aggregate compute |
| Gate Qty Ordered | Module 2 | Module 4 pushes sum of active PO line `qtyOrdered` |
| Gate Qty Received / Receipt % | Module 2 | Module 4 pushes sum of active PO line `qtyReceived`; engine computes Receipt % |
| BFO/BTO `expectedDate` (in transit) | Module 2 | Module 4 pushes from PO line ETA |
| BFI/BTI `expectedDate` | Module 2 | Set only during receipt phase if revised |
| `materialDocumentReference` on gate | Module 2 | **Primary doc only** — latest or planner-selected |
| SAP doc IDs (full list) | **Module 4** PO lines + ReceiptLog | Authoritative for ERP reconciliation |
| Requirement `qtyRequired` | Module 4 | Module 2 never writes |
| Procurement receipt audit | **Module 4 ReceiptLog** | Required append on every receipt |
| Production timeline audit | Module 1 via Module 2 | Unchanged — parallel audit paths |

### Hard gate awareness

BFI and BTI are **primary hard gate predecessors** for CST (Section 2.3). Module 4 receipt UI surfaces:

- Blocked dependent gates (e.g. CST) with Current Planned ≤ today + `hardGateLookaheadDays`
- Active `PARTIAL_RECEIPT` and `MATERIAL_ETA_CONFLICT` signals on linked order
- Link to Module 3 Material Blockers deep-link pattern (order → Materials group → BFI/BTI expanded)

Planner may still use hard gate override (Workflow 4.7) from TNA — Module 4 does not expose override; links to Order Command Center.

---

## Locked: Section 4.6 — Integration (Modules 1, 2, 3)

### Module 1 — Order Command Center

| Integration | Direction | Detail |
|---|---|---|
| Navigate to Material Plan | Module 1 → Module 4 | Action on order header when Module 4 enabled **and** Material gates not N/A |
| Order context read | Module 4 → Module 1 | PO ref, style, order qty, factory, summary status |
| BOM gate status | Module 4 → Module 2 (via read) | Checks `BOM` instance `isComplete` |
| Attachments | No write | GRN scans remain Module 1 `OrderAttachment` if org chooses — not required V1.1 |

Module 1 KPI cache and Risk Level are **read only** in Module 4 — display on order context panel.

### Module 2 — Critical Path & Milestones

| Integration | Direction | Detail |
|---|---|---|
| Material transition API | Module 4 → Module 2 | All BFO/BFI/BTO/BTI state changes |
| TNA read | Module 4 → Module 2 | Gate status, dates, qty, active signals |
| Standard Engine Execution | Module 2 | Every material save — Module 4 waits for response |
| Domain events | Module 2 → Module 4 | V1.1 async: `TnaItemCompleted`, material timeline events |
| Service account | ERP → Module 2 (+ Module 4 reconciliation) | Scoped `tna:transition:material` — see ERP reconciliation below |

**API contract (V1.1 — extends locked Section 2.7):**

Material saves use the same order-scoped TNA save endpoint as planner UI. Module 4 passes:

- `tnaItemUuid`, `material_status`, qty fields, dates
- Gate `materialDocumentReference` — primary doc only when syncing
- Request metadata: `sourceModule: "module-4"`, optional `materialPOLineId`, `materialReceiptLogId`
- Optimistic concurrency via `TNAItem.version` — 409 on conflict; Module 4 UI refresh + retry

Bulk chase remains Module 3 → Module 2 chase API — Module 4 does not duplicate.

#### ERP receipt reconciliation (P1-10)

When ERP service account writes Module 2 material transitions **without** Module 4 UI:

| Inbound path | Required behavior |
|---|---|
| ERP GRN / receipt post | Request metadata **must** include `materialDocumentReference` + `sourceSystem` + `sourceEventId` |
| Matching PO line exists | Module 4 reconciliation worker links receipt → updates PO line `qtyReceived` → appends ReceiptLog with `sourceModule: erp-inbound` |
| No matching PO line | Create **reconciliation queue item** — "TNA-only receipt — link or create stub PO line" |
| Duplicate `sourceEventId` | Reject idempotently (Section 2.7 pattern) |

**Reconciliation queue** (Module 4 home banner + admin view):

- Lists orders where gate `Qty Received` ≠ sum of PO line `qtyReceived`
- Lists ERP receipts without PO line link
- Planner actions: link to existing PO line, create stub PO line, or break-glass acknowledge with note

**Rule:** ERP must not leave gate and PO line diverged — either auto-link via doc reference or surface in queue within same V1.1 release.

### Module 3 — Planner Dashboard

| Integration | Direction | Detail |
|---|---|---|
| Material Blockers widget | Module 3 → Module 2 | Unchanged — reads TNA until Module 4 ships |
| Material PO tracker widget | Module 3 → Module 4 | V1.1 optional widget (Section 3.8) — `GET /material/po-lines` projection: open lines, overdue ETA, orderId, poReference |
| Deep links | Module 3 → Module 4 | PO row opens Receipt Workspace or Order Material Plan |
| Chase List | Module 3 → Module 2 | Fabric Mill / Trim Supplier rows unchanged — Module 4 enriches display only |

Module 4 portfolio views and Module 3 widgets **must not double-count**:

| Surface | Scope |
|---|---|
| **Module 3 Material Blockers** | Production blocking — TNA signals + hard gates (Section 3.3 Widget 4) |
| **Module 3 Material PO tracker** | Procurement exposure — open PO count, overdue ETAs (Section 3.8) |
| **Module 4 Open POs** | Same procurement scope as PO tracker — line-level detail |

Module 4 does **not** replicate Material Blockers blocking logic.

### Cross-module navigation map

```
Module 3 Material Blockers row
    → Order Command Center (TNA Materials group)

Module 3 Material PO tracker row (V1.1)
    → Module 4 Receipt Workspace or Order Material Plan

Module 4 Open POs row
    → Module 4 PO detail → chase (Module 2 API) or receipt

Module 1 order action "Material Plan"
    → Module 4 Order Material Plan
```

---

## Locked: Section 4.7 — Explicit V1 Limitations & Release Boundary

### V1 behavior (Module 4 not built)

Locked baseline — no change to shipped V1 product:

| Capability | V1 behavior | Reference |
|---|---|---|
| Material gate updates | Manual on TNA — Workflow 4.5 | Section 2.4 |
| Qty Ordered / Received | Planner enters on TNA Material row | Section 2.2 |
| BOM validation | Not available | Section 2.8 |
| materialDocumentReference | Null | Section 2.7 |
| Cross-order material views | Module 3 not shipped; no Module 4 | Section 2.8 |
| ERP material sync | None | Section 2.7 |

### V1.1 deliverables (this module)

| Deliverable | Included |
|---|---|
| MaterialRequirement entity + Order Material Plan UI | Yes |
| MaterialPOLine + Procurement Tracker | Yes |
| MaterialReceiptLog (required procurement audit) | Yes |
| OrganizationMaterialSettings | Yes |
| Receipt Workspace with PO-line allocation + Module 2 gate sync | Yes |
| BOM qty validation (advisory warnings) | Yes |
| Open POs portfolio view | Yes |
| ERP reconciliation queue | Yes |
| Dual-path TNA read-only when Module 4 active | Yes |
| Module 1 "Material Plan" navigation action | Yes (hidden when Material gates N/A) |
| Module 3 Material PO tracker widget | Yes — optional widget |
| ERP automated inbound PO/receipt sync | No — Future (Section 4.8) |
| Style/colorway-scoped requirements | No — Order scope only |
| Automated mill notifications | No — chase remains manual (Section 2.4) |

### What Module 4 does not unlock in V1.1

Per locked Section 2.8 — these remain deferred:

| Capability | Target | Notes |
|---|---|---|
| Business days / factory calendar in ETA logic | V1.1 engine | Module 4 displays calendar days |
| External message bus to mills | Future | Chase via planner action only |
| Inventory allocation | Out of scope | MVP Principles |
| Full PO issuance / accounting | Out of scope | MVP Principles |

### Data created by Module 4 (V1.1)

New tables — no migration of TNA state:

| Entity | Purpose |
|---|---|
| `MaterialRequirement` | BOM / requirement lines per order |
| `MaterialPOLine` | PO tracking; line-level qty SSOT |
| `MaterialReceiptLog` | **Required** append-only procurement receipt audit |
| `OrganizationMaterialSettings` | Org config — UOM, tolerance, PO prefix |
| `MaterialReconciliationQueueItem` | ERP / break-glass drift resolution |

Production audit remains Module 1 Timeline via Module 2 engine — parallel to ReceiptLog, not replaced.

---

## Locked: Section 4.8 — Future (V1.2+)

### Planned extensions

| Capability | Description | Dependency |
|---|---|---|
| **ERP inbound sync** | SAP MM PO and GRN idempotent apply via `sourceSystem` + `sourceEventId`; extends Section 4.6 reconciliation worker | Section 2.7 ERP fields |
| **PO header entity** | SAP EKKO-aligned header (vendor, incoterms) above PO lines | Module 4 procurement maturity |
| **Style / colorway requirements** | `TNAItemScope` enablement — requirements per style/colorway | Module 2 scope unlock |
| **Automated mill notifications** | Email/WhatsApp on PO placement or ETA slip | Notification platform (out of V1) |
| **Supplier master** | Normalized vendor records linked to external owner types | Org admin expansion |
| **Material substitution** | Alternate fabric approval linked to FBA gate | Approval workflow |
| **Multi-factory material transfer** | Inter-factory receipt routing | Multi-factory maturity |
| **AI consumption forecast** | Predict trim shortfall from historical orders | AI Copilot (deferred) |

### Relationship to locked sections

| Section | Relationship |
|---|---|
| **Module 1** | Order Command Center remains primary order home; Material Plan is adjunct workspace |
| **2.3** | Material workflows, qty sync, risk signals — Module 4 never redefines |
| **2.4 Workflow 4.5** | V1 manual path preserved for non-Module-4 orders; Module 4 active orders use Module 4 write path with TNA qty/status read-only |
| **2.7** | Material transition API, `materialDocumentReference`, service account roles |
| **2.8** | Module 4 runtime listed as V1.1; BOM validation deferral fulfilled by Section 4.3 |
| **3.3 Widget 4** | Material Blockers unchanged; PO tracker added per Section 3.8 |
| **3.8** | Material PO tracker widget dependency on Module 4 read API |

---

---
## Module 5: Capacity Planning & Line Allocation

> **Status:** Locked — Sections 5.1–5.8 complete  
> **Baseline:** Module 1 locked; Module 2 locked (Sections 2.1–2.8); Module 3 locked (Sections 3.1–3.8); Module 4 locked (Sections 4.1–4.8)

---

## Locked: Section 5.1 — Purpose & Scope

### Purpose

Module 5 is the **capacity planning and sewing line allocation workspace** for apparel production planners and production managers. It organizes **which orders run on which lines**, **when lines are loaded**, and **where capacity conflicts exist** — while keeping **SLA milestone (gate) state** and **plan dates** on Module 2 TNA as the single source of truth for milestone completion, risk, and CP Progress.

The module answers five operational questions planners ask before and during the floor phase:

| Question | Primary surface |
|---|---|
| **Which lines are available this week?** | Line Portfolio — capacity by factory and sewing line |
| **Which orders need line allocation?** | **Module 3 SLA / Capacity Handoff widget** (Widget 7) — Module 5 does not duplicate; see Section 5.4 |
| **Where is this order allocated?** | Order Allocation panel — line, date window, load units |
| **Which lines are overloaded?** | Load conflict view — advisory capacity warnings (Section 5.5) |
| **Did we record line allocation on the plan?** | SLA sync — Module 5 orchestrates SLA Complete + Module 1 `AssignedProductionLine` |

**Architectural stance:** Module 5 owns **line master data, allocation records, and load calculations** only. It does **not** own milestone completion logic, risk generation, or CP Progress — those remain Module 2. Every SLA transition executes through **Module 2 Standard Engine Execution**. `AssignedProductionLine` updates route through **Module 1 order API**.

### What this module is

- **Production line registry** — sewing lines per Module 1 `Factory` with daily capacity profiles
- **Line allocation workspace** — assign orders to lines with planned start/end and load units
- **Capacity planning engine** — deterministic load and utilization calculations (Section 5.5)
- **SLA orchestration** — marks SLA (Sewing Line Allocated) Complete on TNA when allocation confirmed
- **Assigned line population** — writes Module 1 `AssignedProductionLine` on confirm
- **Advisory conflict detection** — overload warnings for planner action (feeds future `CAPACITY_CONFLICT` signal per Section 2.8)
- **Plan context surfacing** — reads CST, SLA, EXF Current Planned Dates from TNA; date revisions use locked Revision Reason **Capacity Constraint** (Section 2.3)

### What this module is not

| Not this | Why |
|---|---|
| **Auto-scheduler / MRP engine** | No automatic downstream date cascade — locked Section 2.1 deferral; manual planner decisions always override suggestions |
| **TNA editor replacement** | SLA status and plan dates remain on embedded TNA (Module 2) — SLA completion read-only on TNA when Module 5 active (Section 5.2) |
| **Shop-floor MES / time tracking** | No real-time line output, operator tracking, or OEE — out of V1 scope |
| **Risk engine** | Reads Order KPI cache and active `RiskSignal` — never creates signal rows; `CAPACITY_CONFLICT` is Module 2 engine catalog scope (Section 2.8) |
| **Material planning** | Material blocking remains Module 2 + Module 4; Module 5 displays read-only blocker context |
| **Duplicate planning state** | No parallel SLA completion or plan date store — allocation records reference TNA by UUID |

### Release boundary

Per locked Module 2 Sections 2.7 and 2.8:

| Release | Behavior |
|---|---|
| **V1** | Module 5 **does not ship**. Planner marks SLA Complete manually on TNA (Workflow 4.8). Module 1 `AssignedProductionLine` remains null. **Capacity Constraint** is Revision Reason only — no capacity risk signal. |
| **V1.1 (this module)** | Capacity Planning & Line Allocation workspace ships. Line registry, allocation records, load views, SLA orchestration, `AssignedProductionLine` population, advisory overload warnings. |
| **Future (Section 5.8)** | `FactoryCalendar` working-day load math, SMV-based capacity, ERP PP/work-center sync, ranked line suggestions (not auto-apply). |

### Relationship to locked modules

| Module | Relationship |
|---|---|
| **Module 1** | Reads Order header, factory, order qty; writes `Order.assignedProductionLineId` on allocation confirm (Section 5.3) |
| **Module 2** | **SSOT for SLA gate state** and CST/SLA/EXF plan dates; Module 5 writes SLA Complete via TNA save API only |
| **Module 3** | Widget 7 (SLA / Capacity Handoff) reads TNA — unchanged; V1.1 optional Line Load widget (Section 3.8) via Module 5 read API |
| **Module 4** | Read-only material blocker and open PO context on allocation views — no material writes |

### Primary users

| Role | Use |
|---|---|
| **Production Planner** | Allocate orders to lines; review weekly load; execute Workflow 4.8 via Module 5 |
| **Production Manager** | Resolve overload conflicts; approve reallocation; portfolio capacity review |
| **Org Admin** | Configure lines, capacity profiles, `OrganizationCapacitySettings` (Section 5.3) |
| **Service account (ERP)** | V1.1 scoped role `tna:transition:sla` — must include Module 5 reconciliation metadata (Section 5.6) |

### Authorization

| Rule | Detail |
|---|---|
| **Tenant isolation** | All queries scoped by auth `organizationId` |
| **Factory-level access** | Same factory visibility rules as Modules 1, 3, and 4 |
| **Write path** | SLA mutations via Module 2 API; `Order.assignedProductionLineId` via Module 1 order PATCH — no direct TNA or Order table writes from Module 5 UI layer |
| **Service accounts** | ERP integration uses scoped roles — not planner UI permissions |

---

## Locked: Section 5.2 — Ownership & Single Source of Truth

### Ownership matrix

| Concern | Owner | Module 5 role |
|---|---|---|
| SLA gate `status`, `isComplete`, Actual Date | **Module 2 `TNAItem`** | Write via TNA save API on allocation confirm only |
| CST / SLA / EXF Original & Current Planned Dates | **Module 2 `TNAItem`** | Read for load horizon; planner revises on TNA with Revision Reason |
| `AssignedProductionLine` on Order | **Module 1 Order** | Module 5 sets `Order.assignedProductionLineId` FK on confirm; clears on deallocate |
| Production line master data | **Module 5 `ProductionLine`** | SSOT for line registry |
| Line daily capacity | **Module 5 `LineCapacityProfile`** | SSOT for planning capacity |
| Allocation records (order ↔ line ↔ dates) | **Module 5 `LineAllocation`** | SSOT for allocation intent |
| Load / utilization (derived) | **Module 5 engine** | Computed on read — not persisted on TNA or Order |
| Advisory overload warnings | **Module 5 engine** | Display only in V1.1 |
| `CAPACITY_CONFLICT` RiskSignal | **Module 2 engine** | Not generated in V1; V1.1+ catalog extension per Section 2.8 — Module 5 supplies inputs only |
| CP Progress, hard gates, timeline events | **Module 2 engine** | Standard Engine Execution on every SLA save |
| Allocation audit | **Module 5 `LineAllocationLog`** | Required append-only; production timeline via Module 2 |
| ERP reconciliation queue | **Module 5** | Surfaces SLA / assigned-line drift |

**Core rule:** Module 5 never maintains a parallel copy of SLA **completion state**. Allocation records reference SLA `TNAItem` by immutable `tnaItemUuid`. Gate `isComplete` on SLA is set only through Module 2 Standard Engine Execution.

### Order applicability

Module 5 availability depends on SLA gate state on TNA — aligned with locked order-type templates (Section 2.2):

| Condition | Module 5 behavior |
|---|---|
| SLA gate **active** (not N/A, not Skipped) | Full Module 5 — Draft/Confirm allocation, SLA sync |
| SLA gate **Skipped** or **N/A** (Sample, SMS floor path) | Module 5 **disabled** — Line Allocation action hidden |
| Order **On Hold / Cancelled / Closed** | Module 5 **read-only** — inherits Module 2 edit freeze |
| SLA gate **Complete** without Module 5 allocation | Reconciliation banner — break-glass or ERP path (Section 5.6) |

**Floor proximity (informational):** Module 3 Widget 7 uses CST within 7 calendar days OR SLA overdue — Module 5 does not replicate that filter for enablement; it applies only as UI default sort on Order Allocation queue.

### Dual-path coexistence (Module 5 active vs. manual TNA)

Module 5 distinguishes **draft planning** from **committed allocation** — Draft rows do **not** lock TNA.

| State | Condition | TNA SLA row | Module 1 assigned line |
|---|---|---|---|
| **Inactive** | No `LineAllocation` rows | Editable — Workflow 4.8 manual path | Module 5 does not write |
| **Drafting** | ≥1 **Draft** row; no Confirmed / ConfirmPending | **Editable** — planner may still use manual 4.8 or Module 5 Confirm | Unchanged |
| **Active (committed)** | ≥1 **Confirmed** or **ConfirmPending** row | **Read-only** — status / Actual Date via Module 5 Confirm only | **Written by Module 5 only** |

| Surface | Behavior when Module 5 **active (committed)** |
|---|---|
| TNA SLA row — `status`, Actual Date | **Read-only** on embedded TNA |
| TNA SLA row — Notes, chase (**Last Chased**), ownership | Still editable on TNA (Workflow 4.4, 9) |
| Orders without Confirmed allocation | Workflow 4.8 manual path unchanged |

**Coexistence with Module 4:** Module 4 and Module 5 dual-path rules apply **independently** — Material row fields (Module 4) and SLA row fields (Module 5) follow each module's active rules; no conflict.

**Break-glass override:** Production Manager may mark SLA Complete on TNA with required reason → timeline `MODULE5_SYNC_BYPASS` → Module 5 shows **"Out of sync — reconcile"** until allocation record matches or is archived.

**Reconciliation on read:** Module 5 compares SLA `isComplete`, `Order.assignedProductionLineId`, and Confirmed allocation on every Order Allocation panel load.

### SLA sync state machine

Aligned with locked Workflow 4.8 — Module 5 orchestrates; Module 2 commits:

| Step | Module 5 action | Module 2 / Module 1 action |
|---|---|---|
| Planner selects line + date window | Create `LineAllocation` (**Draft**) | No TNA change |
| Planner confirms allocation | **Confirm saga** (Section 5.5) — no SLA Complete until both Module 2 and Module 1 succeed | SLA → Complete + Actual Date; `Order.assignedProductionLineId` set |
| Planner cancels Draft | Archive Draft (Workflow M5.5) | No change |
| Planner deallocates | Archive Confirmed allocation | Reopen SLA via Workflow 7 if Complete; clear `assignedProductionLineId` |
| Overload detected | Advisory warning only | Planner revises CST/SLA on TNA with Revision Reason **Capacity Constraint** |

**Invariant:** There is **no success path** where SLA is Complete and `Order.assignedProductionLineId` is null after Confirm — except break-glass / ERP reconciliation queue.

### Link model

| Module 5 entity | Required link | Optional link |
|---|---|---|
| `ProductionLine` | `organizationId`, `factoryId`, `lineName` | `lineCode`, `externalReference` (SAP work center) |
| `LineCapacityProfile` | `productionLineId`, `dailyCapacityUnits`, `effectiveFrom` | `notes` |
| `LineAllocation` | `orderId`, `productionLineId`, `tnaItemUuid` (SLA), `plannedStartDate`, `plannedEndDate`, `allocatedUnits` | `notes` |
| `LineAllocationLog` | `lineAllocationId`, `action`, `userId`, `correlationId` | `payload` JSON |
| Load projection row | Derived | Not persisted |

### Logical architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│           Module 5 — Capacity Planning & Line Allocation (UI)            │
│  Line Portfolio · Order Allocation Panel · Load Preview · Reconcile Queue  │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ read queries · orchestrated writes
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│        Module 5 Service Layer (lines, allocations, capacity engine)       │
└───────┬─────────────────────────────┬───────────────────────────────────┘
        │                             │
        ▼                             ▼
┌───────────────────┐     ┌───────────────────────────────────────────────┐
│ Module 5 store    │     │ Module 2 TNA save API                          │
│ ProductionLine    │     │ SLA Complete / Reopen → Standard Engine Exec.  │
│ LineCapacityProfile│    │                                                 │
│ LineAllocation    │     │ Module 1 order API — AssignedProductionLine    │
│ LineAllocationLog │     │                                                 │
└───────────────────┘     └───────────────────────────────────────────────┘
        │                             │
        └─────────────┬───────────────┘
                      ▼
        ┌───────────────────────────────────────────────┐
        │ Module 1 read · Module 2 read · Module 3/4    │
        │ factoryTimezone · FactoryCalendar (readiness)   │
        └───────────────────────────────────────────────┘
```

### Architectural principles

| # | Principle |
|---|---|
| 1 | **TNA is SLA SSOT** — Module 5 orchestrates; Module 2 commits via Standard Engine Execution |
| 2 | **One engine run per SLA mutation** — each SLA save = one Module 2 transaction; batch operations orchestrate N atomic saves |
| 3 | **Allocation ≠ gate state** — line assignments live in Module 5; SLA records planner confirmation on the plan |
| 4 | **No auto-reschedule** — Module 5 surfaces conflicts; planner revises dates on TNA with Revision Reason |
| 5 | **Manual override wins** — planner may ignore overload warnings and Confirm; advisory only in V1.1 |
| 6 | **Timezone authority** — all date boundaries use `OrganizationTnaSettings.factoryTimezone` (Section 2.6) |
| 7 | **Working calendar readiness** — V1.1 uses calendar days; switches to `FactoryCalendar` working days when entity populated (Section 5.5) |
| 8 | **Factory-scoped** — lines belong to one factory; allocations must match order factory assignment |
| 9 | **Single write path when committed** — Confirmed / ConfirmPending orders: SLA completion only via Module 5 Confirm saga (or break-glass) |

---

## Locked: Section 5.3 — Data Model

### OrganizationCapacitySettings

Org-level configuration for Module 5 — separate from `OrganizationTnaSettings` (Section 2.6) and `OrganizationMaterialSettings` (Section 4.3). Configured by **Org Admin** in V1.1.

| Field | Default | Purpose |
|---|---|---|
| `defaultDailyCapacityUnits` | 500 | Default pieces/day for new lines |
| `loadHorizonDays` | 28 | Portfolio load view forward window |
| `overloadThresholdPercent` | 100 | Advisory warning when utilization exceeds threshold |
| `capacityUnitsLabel` | "pieces" | Display label for load units |
| `useWorkingCalendar` | false | When true **and** `FactoryCalendar` populated for factory → working-day denominator (Section 5.5) |
| `module5Enabled` | true | Org-wide feature flag for V1.1 rollout |

**V1.1 scope:** No factory-level settings override — single org config (factory overrides → future, consistent with Section 2.6 deferral).

**Timezone:** All date fields on Module 5 entities are **calendar dates in org `factoryTimezone`** — same convention as Module 3 portfolio queries (Section 3.2).

### Entity: ProductionLine

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | UUID | Yes | Primary key |
| `organizationId` | UUID | Yes | Tenant boundary |
| `factoryId` | UUID | Yes | FK to Module 1 `Factory` |
| `lineName` | String | Yes | Display name — e.g. "Line 12", "Module A" |
| `lineCode` | String | No | Short stable key — immutable after first ERP mapping |
| `status` | Enum | Yes | Active · Inactive · Maintenance |
| `externalReference` | String | No | SAP work center (CRHD/ARBPL) — ERP readiness |
| `createdAt` / `updatedAt` | Timestamp | Yes | Audit |
| `version` | Integer | Yes | Optimistic concurrency |

**Maintenance / Inactive status:** **Maintenance** or **Inactive** → block new Draft allocations and Confirm (`LINE_MAINTENANCE` / `LINE_INACTIVE` errors). Existing Confirmed allocations flagged for planner review.

**lineCode uniqueness:** Unique within `(organizationId, lineCode)` when set.

### Module 1 write contract — `assignedProductionLineId`

Module 5 populates the Order assigned-line field through **Module 1 order PATCH** — not a separate Module 5 entity.

| Field | Location | Type | Notes |
|---|---|---|---|
| `assignedProductionLineId` | **Module 1 Order** | UUID, nullable | FK → `ProductionLine.id` (Module 5) |
| Display name | Module 1 read | Resolved | Order Command Center joins `ProductionLine.lineName` on read — not denormalized on Order in V1.1 |

**On Confirm:** `assignedProductionLineId` = `LineAllocation.productionLineId`.  
**On deallocate:** `assignedProductionLineId` = null.  
**V1 (Module 5 not built):** field remains null per locked Module 1.

Optional audit extension (V1.1): `assignedAt`, `assignedByUserId`, `lineAllocationId` on Order — not required for MVP; correlation via `LineAllocationLog`.

### Entity: LineCapacityProfile

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | UUID | Yes | Primary key |
| `organizationId` | UUID | Yes | Tenant boundary |
| `productionLineId` | UUID | Yes | FK to ProductionLine |
| `dailyCapacityUnits` | Decimal | Yes | Planning capacity — pieces/day in V1.1 |
| `effectiveFrom` | Date | Yes | V1.1: one active profile per line (latest `effectiveFrom` wins) |
| `notes` | Text | No | Seasonal adjustment annotation |
| `createdAt` | Timestamp | Yes | Audit |

### Entity: LineAllocation

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | UUID | Yes | Primary key |
| `organizationId` | UUID | Yes | Tenant boundary |
| `orderId` | UUID | Yes | FK to Module 1 Order |
| `productionLineId` | UUID | Yes | FK to ProductionLine — must match order `factoryId` |
| `tnaItemUuid` | UUID | Yes | **SLA** instance — immutable link |
| `plannedStartDate` | Date | Yes | Sewing load start (`factoryTimezone` calendar date) |
| `plannedEndDate` | Date | Yes | Sewing load end (inclusive) |
| `allocatedUnits` | Decimal | Yes | Sewing load qty — defaults from order total qty |
| `status` | Enum | Yes | Draft · ConfirmPending · Confirmed · Archived |
| `confirmedAt` | Timestamp | No | Set on Confirm — triggers SLA sync |
| `confirmedByUserId` | UUID | No | Actor |
| `notes` | Text | No | Planner annotations |
| `createdAt` / `updatedAt` | Timestamp | Yes | Audit |
| `version` | Integer | Yes | Optimistic concurrency |

**V1.1 constraint:** Max one **Confirmed** allocation per order. Max one **Draft** or **ConfirmPending** at a time per order. Reallocate requires archive previous Confirmed row first.

**Load unit default:** Sum of all **`SizeBreakdown.quantity`** rows across the order (Module 1 hierarchy: Order → Style → Colorway → SizeBreakdown) — total order pieces unless planner overrides. If size breakdown not yet entered, default from order header total qty field when present; otherwise planner must enter manually.

### Entity: LineAllocationLog

Append-only allocation audit — **required** for every Confirm, Deallocate, Reallocate, and ERP sync action in V1.1. Production audit remains Module 1 Timeline via Module 2.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | UUID | Yes | Primary key |
| `organizationId` | UUID | Yes | Tenant boundary |
| `lineAllocationId` | UUID | Yes | FK |
| `orderId` | UUID | Yes | Denormalized for query |
| `action` | Enum | Yes | Confirm · ConfirmFailed · Reallocate · Deallocate · CancelDraft · BreakGlassSync · ErpInbound |
| `userId` | UUID | Yes | Actor — planner or service account |
| `sourceModule` | Enum | Yes | `module-5-ui` · `erp-inbound` · `break-glass-sync` |
| `correlationId` | UUID | Yes | Module 2 save transaction id when SLA synced |
| `payload` | JSON | No | `{ previousLineId, newLineId, dates, units, slaVersion }` |
| `createdAt` | Timestamp | Yes | Immutable — no updates |

**Transactional rule (P1-9):** `LineAllocationLog` rows commit **only after successful Confirm saga** (both Module 2 and Module 1 succeed). During orchestration, no log row is visible. On Confirm failure after SLA save, append **separate** `ConfirmFailed` log in a new transaction with `correlationId` and compensating reopen reference — never orphan `Confirm` logs for incomplete sagas.

### Entity: CapacityReconciliationQueueItem

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | UUID | Yes | Primary key |
| `organizationId` | UUID | Yes | Tenant boundary |
| `orderId` | UUID | Yes | FK |
| `reason` | Enum | Yes | SlaWithoutAllocation · AllocationWithoutSla · AssignedLineMismatch · ErpOrphan |
| `detectedAt` | Timestamp | Yes | When drift detected |
| `resolvedAt` | Timestamp | No | When planner or worker resolves |
| `resolution` | Text | No | Planner note |

### Data model notes

| Rule | Detail |
|---|---|
| No duplicate SLA state | `LineAllocation.status` tracks allocation intent — not SLA `isComplete` |
| Order assigned line | `Order.assignedProductionLineId` → `ProductionLine.id` — Module 1 owns field; Module 5 orchestrates write |
| ERP keys | `ProductionLine.externalReference` + `Order.externalReference` for PP mapping (Section 2.7) |
| Factory calendar scope | `FactoryCalendar` keyed by **`ProductionLine.factoryId`** when working-day mode active |
| Factory calendar readiness | `FactoryCalendar` entity reserved (Section 2.6) — not populated in V1; empty calendar ⇒ calendar-day mode |

---

## Locked: Section 5.4 — Planner Workflows (M5.1–M5.5)

### Overview

Planner workflows bridge **capacity intent** (line assignment) and **TNA SLA gate** (plan confirmation). Every workflow that completes SLA routes through **Module 2 Standard Engine Execution**. No workflow auto-revises Current Planned Dates.

### Module 3 boundary — SLA / Capacity Handoff (Widget 7)

| Question | Owner | Surface |
|---|---|---|
| **Which orders need line allocation before floor work?** | **Module 3** | Widget 7 — SLA + CST proximity (Section 3.3) |
| **Which lines have capacity this week?** | **Module 5** | Line Portfolio |
| **Where should I assign this order?** | **Module 5** | Order Allocation panel + load preview |

Module 5 **does not** replicate Widget 7 inclusion logic. Widget 7 row deep-links to Module 5 Order Allocation panel (V1.1).

### Workflow M5.1 — Review line load portfolio

**Trigger:** Production Manager weekly review (Workflow 5, Section 2.4) or planner preparing allocations.

**Steps:**

1. Open **Line Portfolio** — filter by authorized factory, week (dates in `factoryTimezone`)
2. View per-line daily utilization from capacity engine (Section 5.5)
3. Identify overload days — advisory badges only
4. Drill into line → Confirmed + Draft allocations with order PO refs
5. No TNA or Order mutation

**Output:** Planner identifies lines with headroom or conflict before M5.2.

### Workflow M5.2 — Allocate order to line

**Trigger:** Order on Module 3 Widget 7, or planner opens Line Allocation from Order Command Center.

**Preconditions:**

- SLA gate active (not N/A / Skipped)
- Order not On Hold / Cancelled / Closed
- `OrganizationCapacitySettings.module5Enabled` = true

**Steps:**

1. Open **Order Allocation** panel
2. Display read-only context:
   - CST, SLA, EXF Current Planned Dates (Module 2)
   - Active `RiskSignal` summaries (Module 2)
   - Material blocker chips (Module 2 / Module 3 pattern)
   - Open PO count (Module 4 read — optional)
3. Select **ProductionLine** (same `factoryId` as order)
4. Enter `plannedStartDate`, `plannedEndDate`, `allocatedUnits`
5. **Load preview** — engine computes impact on selected line (Section 5.5); warnings advisory
6. Save **Draft** — **no SLA lock**; TNA remains editable; planner may cancel Draft (M5.5)
7. On **Confirm allocation** — execute **Confirm saga** (Section 5.5):
   - Set allocation **ConfirmPending**
   - Module 2 TNA save: SLA → Complete; Actual Date = `plannedStartDate` if future else today in `factoryTimezone`
   - Module 1 order PATCH: `assignedProductionLineId` = `productionLineId`; include `order.version`
   - On **both success:** set **Confirmed**; append `LineAllocationLog` (Confirm) in same Module 5 DB transaction
   - On Module 1 failure after Module 2 success: **compensating reopen** SLA (Workflow 7); revert to Draft; `ConfirmFailed` log
8. Return to Order Command Center — SLA Complete; assigned line visible on order header

**Planner override:** Confirm allowed despite overload warning — planner decision is final in V1.1.

### Workflow M5.3 — Deallocate or reallocate

**Trigger:** Capacity reprioritization, order On Hold, line maintenance, or planning error.

| Situation | Module 5 action | Module 2 / Module 1 action |
|---|---|---|
| Deallocate — SLA Complete | Archive Confirmed allocation; Log Deallocate | Reopen SLA (Workflow 7); clear `assignedProductionLineId` |
| Reallocate — **line change only** (dates unchanged) | Archive old Confirmed; new Draft → Confirm saga | Update `assignedProductionLineId` via Confirm; **SLA stays Complete** — pass **existing Actual Date unchanged** (no reopen) |
| Reallocate — **date window change** | Archive Confirmed; create new Draft with revised dates | **Must Confirm saga again** — new Actual Date = new `plannedStartDate` (or today); SLA Complete throughout if reopen not required |
| Reallocate — **date change on Complete SLA** where Actual Date must change | Archive Confirmed; Reopen SLA (Workflow 7) first OR run Confirm saga with new Actual Date in same session | Follow locked reopen rules (Section 2.3) — **no silent Actual Date mutation** |
| Line → Maintenance / Inactive | Block new Drafts / Confirm | Flag existing Confirmed rows |
| Order → On Hold | Read-only | No new Confirm until Hold cleared |

**Reallocate rule:** Module 5 never silently updates SLA Actual Date. Line-only changes update `assignedProductionLineId` without SLA reopen. Date changes require new Confirm saga (which sets Actual Date explicitly) or Workflow 7 reopen first.

### Workflow M5.5 — Cancel Draft allocation

**Trigger:** Planner saved Draft but will not Confirm; wants to restore manual Workflow 4.8 path or start over.

**Steps:**

1. Open Order Allocation panel
2. Select **Cancel Draft**
3. Set allocation status **Archived** (reason: cancelled draft)
4. Append `LineAllocationLog` (action: CancelDraft) — commits immediately (no Module 2/1 calls)
5. If no other Confirmed / ConfirmPending rows remain → Module 5 **inactive** for order; TNA SLA editable again

**Output:** Planner may use manual 4.8 on TNA or create a new Draft.

### Workflow M5.4 — Capacity-driven plan revision

**Trigger:** Advisory overload or infeasible CST/SLA window — aligned with locked Workflow 4.8 branch.

**Steps:**

1. Module 5 surfaces conflict — **does not** auto-revise dates or reassign lines
2. Planner opens Order Command Center → embedded TNA
3. Revise CST and/or SLA **Current Planned Date** with Revision Reason **Capacity Constraint**
4. Optionally add Module 1 Quick Note
5. Return to Module 5 — adjust Draft allocation dates to match revised plan
6. Confirm allocation when aligned

**Rule:** Current Planned Date writes occur **only on TNA** (Module 2) — Module 5 never persists plan dates.

### Portfolio: Line Load view (Module 5 home)

| Column | Source |
|---|---|
| Line name / code | `ProductionLine` |
| Factory | Module 1 `Factory` |
| Peak utilization (horizon) | Capacity engine (Section 5.5) |
| Confirmed allocation count | `LineAllocation` |
| Overload day count | Advisory engine |
| Line status | Active / Maintenance |

**Sort default:** Peak utilization descending → line name asc.

---

## Locked: Section 5.5 — Capacity Planning & Allocation Engine

### Purpose

The capacity engine is Module 5's **deterministic read-side calculator** — it produces load, utilization, and advisory conflict output from allocation records and capacity profiles. It does **not** write TNA state, Order fields, or RiskSignal rows.

### Inputs

| Input | Source | Notes |
|---|---|---|
| Confirmed + Draft allocations | Module 5 store | Draft included in preview only; Confirmed in portfolio |
| `LineCapacityProfile` | Module 5 store | Active profile per line |
| `factoryTimezone` | `OrganizationTnaSettings` (Section 2.6) | All date boundary math |
| `FactoryCalendar` | Reserved (Section 2.6) | When populated + `useWorkingCalendar` true → working-day denominator |
| CST / SLA / EXF dates | Module 2 TNA read | Context for allocation panel — not engine inputs for load |
| `overloadThresholdPercent` | `OrganizationCapacitySettings` | Advisory threshold |

### Calendar and timezone rules

All engine date logic uses **`OrganizationTnaSettings.factoryTimezone`** — no client-local timezone (same rule as Module 3, Section 3.2).

| Mode | Denominator for load spread | When |
|---|---|---|
| **Calendar days (V1.1 default)** | Inclusive calendar days from `plannedStartDate` to `plannedEndDate` | `useWorkingCalendar` = false OR `FactoryCalendar` empty |
| **Working days (future-ready)** | Count of working days per `FactoryCalendar` for **`ProductionLine.factoryId`** | `useWorkingCalendar` = true AND calendar populated for line's factory |

**Working calendar load rule:** When working-day mode is active, **`dailyLoad(L, D) = 0`** on non-working days. Load is spread **only across working days** in `[plannedStartDate, plannedEndDate]`. Capacity applies on working days only; non-working days show zero capacity and zero load.

**Working calendar readiness:** `FactoryCalendar` entity is reserved in locked Section 2.6 — not populated in V1. Module 5 engine **must** implement both code paths: default calendar-day mode in V1.1; working-day mode activates without schema change when calendar data arrives (Section 5.8).

| Concept | Rule |
|---|---|
| **Today** | Calendar date in `factoryTimezone` at calculation time |
| **Horizon end** | Today + `loadHorizonDays` in `factoryTimezone` |
| **Week boundaries** | ISO week labels for display — calculations use raw dates |

### Load calculation (deterministic)

For each `ProductionLine` L and date D within horizon:

```
isWorkingDay(D, factoryId) =
  IF useWorkingCalendar AND FactoryCalendar populated for factoryId:
    FactoryCalendar.isWorkingDay(D)
  ELSE:
    true   // calendar-day mode — every day is a working day for load purposes

allocationDays(allocation) =
  count of days D in [plannedStartDate, plannedEndDate] where isWorkingDay(D, line.factoryId)

dailyLoad(L, D) =
  IF NOT isWorkingDay(D, L.factoryId):
    0
  ELSE:
    Σ allocation.allocatedUnits / allocationDays(allocation)
    FOR EACH allocation WHERE allocation.productionLineId = L
      AND allocation.status IN (Confirmed [, Draft in preview mode])
      AND plannedStartDate ≤ D ≤ plannedEndDate
      AND isWorkingDay(D, L.factoryId)

effectiveCapacity(L, D) =
  IF isWorkingDay(D, L.factoryId):
    activeCapacityProfile(L).dailyCapacityUnits
  ELSE:
    0

utilization(L, D) =
  IF effectiveCapacity(L, D) = 0: 0
  ELSE: dailyLoad(L, D) / effectiveCapacity(L, D) × 100
```

**Determinism:** Same allocation set + settings → same utilization on every run. No randomness, no ML.

### Advisory conflict rules (V1.1)

| Rule ID | Condition | Severity | Behavior |
|---|---|---|---|
| `LINE_OVERLOAD` | `utilization(L, D) > overloadThresholdPercent` | Advisory | Badge on Line Portfolio and Confirm dialog |
| `ALLOCATION_PAST_EXF` | `plannedEndDate` > EXF Current Planned Date | Advisory | Warning on Order Allocation panel |
| `ALLOCATION_BEFORE_CST` | `plannedStartDate` < CST Current Planned Date | Advisory | Warning — sewing before cutting plan |
| `FACTORY_MISMATCH` | `ProductionLine.factoryId` ≠ `Order.factoryId` | **Error** | Block Confirm |
| `LINE_MAINTENANCE` | Line status Maintenance | **Error** | Block new Draft/Confirm |
| `LINE_INACTIVE` | Line status Inactive | **Error** | Block new Draft/Confirm |

**V1.1:** Conflicts are **advisory except errors** — planner may Confirm despite warnings. Manual planner decision always overrides suggestions.

**Future:** `CAPACITY_CONFLICT` RiskSignal (Module 2 engine) may consume `LINE_OVERLOAD` outputs — Module 5 does not emit signals directly (Section 2.8).

### SLA sync orchestration (Confirm saga)

The engine does not perform SLA writes — **orchestration layer** executes on Confirm with **compensating transaction** on partial failure:

```
ConfirmAllocation(allocationId):
  1. Validate factory match, line status (not Maintenance/Inactive), allocation + order version
  2. Run advisory engine — collect warnings (non-blocking except errors)
  3. BEGIN Module 5 transaction
  4.   UPDATE LineAllocation SET status = ConfirmPending
  5. COMMIT Module 5 transaction
  6. IF SLA already Complete AND line-only reallocate (dates unchanged):
       PATCH Module 1 /orders/{orderId}  { assignedProductionLineId, order.version } only
       → skip Module 2 save — Actual Date unchanged (P1-2)
     ELSE:
       POST Module 2 .../tna-items/{slaUuid}  { status: Complete, actualDate, version }
       → actualDate = plannedStartDate if future else today in factoryTimezone
       → Standard Engine Execution (steps 1–7)
       PATCH Module 1 /orders/{orderId}  { assignedProductionLineId, order.version }
  7. IF Module 1 PATCH fails after Module 2 Complete save (non line-only path):
       POST Module 2 reopen SLA (Workflow 7) — compensating transaction
       UPDATE LineAllocation SET status = Draft
       Append LineAllocationLog (ConfirmFailed) — separate committed transaction
       RETURN error — SLA must not remain Complete without assignedProductionLineId
  8. IF Module 1 PATCH fails on line-only path:
       UPDATE LineAllocation SET status = Draft
       Append LineAllocationLog (ConfirmFailed)
       RETURN error — assignedProductionLineId not updated; SLA unchanged
  9. IF success:
       BEGIN Module 5 transaction
  10.    UPDATE LineAllocation SET status = Confirmed, confirmedAt, confirmedByUserId
  11.    Append LineAllocationLog (Confirm) — same transaction as step 10
  12. COMMIT Module 5 transaction
  13. RETURN refreshed allocation + Order (+ KPI cache when Module 2 ran)

Retry: 409 on Module 2 or Module 1 → refresh versions; user retries Confirm from Draft or ConfirmPending cleanup
```

**Invariant:** After successful Confirm, SLA `isComplete` = true **if and only if** `Order.assignedProductionLineId` is set to the same `productionLineId` on the Confirmed allocation.

**Reopen path (deallocate):** Workflow 7 on SLA via Module 2 → clear `assignedProductionLineId` via Module 1 PATCH → archive allocation → append Deallocate log (committed after both succeed; compensating forward if Module 1 clear fails).

### Preview vs. portfolio modes

| Mode | Allocations included | Use |
|---|---|---|
| **Portfolio** | Confirmed only | Line Portfolio, Module 3 Line Load widget |
| **Preview** | Confirmed + current Draft | Order Allocation Confirm dialog |

### Engine versioning

| Field | Value |
|---|---|
| `capacityEngineVersion` | `"5.5"` — stored in API response metadata for audit |
| Invalidation | On allocation CRUD, capacity profile change, or `FactoryCalendar` publish |

---

## Locked: Section 5.6 — Integration with Modules 1–4

### Module 1 — Order Command Center

| Integration | Direction | Detail |
|---|---|---|
| Navigate to Line Allocation | Module 1 → Module 5 | Header action when Module 5 enabled and SLA active |
| Order context read | Module 5 → Module 1 | PO ref, style, total qty, factory, summary status |
| Write assigned line | Module 5 → Module 1 | On Confirm saga; null on deallocate |
| KPI / Risk display | Module 5 → Module 1 read | Read-only on allocation panel |

**Module 1 order PATCH contract (V1.1 — extends locked Module 1):**

| Request field | Required | Notes |
|---|---|---|
| `assignedProductionLineId` | On Confirm / deallocate | UUID FK → `ProductionLine.id`; null on deallocate |
| `version` | Yes | Optimistic concurrency — 409 on conflict; refresh and retry saga |

Module 5 **never** PATCHes other Order fields. Display name resolved on read via join — not written to Order.

### Module 2 — Critical Path & Milestones

| Integration | Direction | Detail |
|---|---|---|
| SLA TNA save | Module 5 → Module 2 | Complete on Confirm; Reopen on deallocate |
| TNA read | Module 5 → Module 2 | SLA UUID, CST/SLA/EXF dates, active signals, hard-gate blocked state |
| Standard Engine Execution | Module 2 | Every SLA mutation — Module 5 waits for response |
| Domain events | Module 2 → Module 5 | V1.1 async: `TnaItemCompleted` (milestoneCode SLA), timeline events |
| Chase API | Module 5 → Module 2 | Not used for SLA — chase remains Workflow 4.4 on TNA |

**API contract (V1.1 — extends locked Section 2.7):**

SLA saves use the same order-scoped TNA save endpoint as planner UI:

| Request field | Required | Notes |
|---|---|---|
| `tnaItemUuid` | Yes | SLA instance |
| `status` | Yes | `Complete` on Confirm; reopen payload on deallocate |
| `actualDate` | On Complete | Calendar date in `factoryTimezone` |
| `version` | Yes | Optimistic concurrency — 409 on conflict |
| Metadata: `sourceModule` | Yes | `"module-5"` |
| Metadata: `lineAllocationId` | Yes | Audit link — log row appended after saga success |
| Metadata: `correlationId` | Yes | Pre-generated UUID linking Module 2 save, Module 1 PATCH, and post-commit `LineAllocationLog` |

**Read API (V1.1):**

| Endpoint | Consumer | Projection |
|---|---|---|
| `GET /capacity/bootstrap` | Module 5 UI | Lines, settings, horizon, factoryTimezone |
| `GET /capacity/lines` | Module 5 UI, Module 3 Line Load widget | Per-line peak utilization, overload count, allocation count |
| `GET /capacity/orders/{orderId}/allocation` | Order Allocation panel | Draft + Confirmed rows, SLA link status, reconcile flags |
| `GET /capacity/reconciliation` | Module 5 admin queue | Open `CapacityReconciliationQueueItem` rows |

#### ERP allocation reconciliation

When ERP service account writes SLA via Module 2 **without** Module 5 UI:

| Inbound path | Required behavior |
|---|---|
| ERP PP order release / line assignment | Metadata: `externalReference` (work center), `sourceSystem`, `sourceEventId` |
| Matching `ProductionLine` + order | Worker runs same **Confirm saga** as UI — Module 2 SLA Complete then Module 1 `assignedProductionLineId` PATCH; creates Confirmed `LineAllocation` + `LineAllocationLog` (`sourceModule: erp-inbound`) only after both succeed |
| SLA Complete without allocation | `CapacityReconciliationQueueItem` — reason: SlaWithoutAllocation |
| Allocation without SLA Complete | reason: AllocationWithoutSla |
| Duplicate `sourceEventId` | Reject idempotently (Section 2.7) |

**Rule:** `AssignedProductionLine`, Confirmed allocation, and SLA `isComplete` must not diverge — sync or queue within same transaction boundary where possible.

### Module 3 — Planner Dashboard

| Integration | Direction | Detail |
|---|---|---|
| SLA / Capacity Handoff (Widget 7) | Module 3 → Module 2 | **Unchanged** — TNA-based |
| Line Load widget | Module 3 → Module 5 | V1.1 optional (Section 3.8) — `GET /capacity/lines` |
| Deep links | Module 3 → Module 5 | Widget 7 row → Order Allocation panel |

Module 5 does **not** replicate Widget 7 query logic or Material Blockers logic.

### Module 4 — Material Planning & Procurement

| Integration | Direction | Detail |
|---|---|---|
| Material blocker context | Module 5 → Module 2 read | Display chips on allocation panel |
| Open PO summary | Module 5 → Module 4 read | Optional — material still in transit |
| Material writes | None | Module 5 never invokes Module 4 or material transition API |

### Cross-module navigation map

```
Module 3 Widget 7 row
    → Order Command Center (Floor → SLA expanded)
    → Module 5 Order Allocation panel

Module 5 Line Portfolio overload
    → Line detail → allocations → Order Command Center

Module 1 "Line Allocation" action
    → Module 5 Order Allocation panel
```

### Relationship to locked sections

| Section | Relationship |
|---|---|
| **2.4 Workflow 4.8** | V1 manual SLA for non-Module-5 orders; Module 5 Confirm for active orders |
| **2.6** | `factoryTimezone`, `FactoryCalendar` readiness |
| **2.7** | SLA save API, `tna:transition:sla`, `AssignedProductionLine`, ERP fields |
| **2.8** | Module 5 V1.1 runtime; `CAPACITY_CONFLICT` deferral |
| **3.3 Widget 7** | Unchanged — production allocation queue |
| **3.8** | Line Load widget dependency |
| **4.4** | Material blocking deferred to Module 3/2 — not Module 4 procurement scope |

---

## Locked: Section 5.7 — V1 Limitations & V1.1 Deliverables

### V1 behavior (Module 5 not built)

Locked baseline — no change to shipped V1 product:

| Capability | V1 behavior | Reference |
|---|---|---|
| SLA gate updates | Manual on TNA — Workflow 4.8 | Section 2.4 |
| `AssignedProductionLine` | Null on Order | Module 1, Section 2.7 |
| Line load / portfolio views | Not available | Section 2.8 |
| `CAPACITY_CONFLICT` risk signal | Not generated | Sections 2.3, 2.8 |
| Automatic scheduling from line capacity | None | Section 2.1 |
| Module 3 Line Load widget | Not available | Section 3.8 |

**P1-6 — `CAPACITY_CONFLICT` vs. Module 5 advisory (clarification):**

| Concept | Owner | V1.1 behavior |
|---|---|---|
| **`LINE_OVERLOAD`** (engine rule) | Module 5 | Advisory badge only — planner may Confirm anyway |
| **Revision Reason: Capacity Constraint** | Module 2 TNA | Planner-selected reason when revising CST/SLA dates on TNA (Workflow M5.4) — not a risk signal |
| **`CAPACITY_CONFLICT` RiskSignal** | Module 2 engine catalog | **Not generated in V1.1** — deferred per locked Section 2.8; future Module 2 engine entry may consume Module 5 overload outputs |

Module 5 **never** creates `RiskSignal` rows. Overload detection stays advisory until Module 2 adds `CAPACITY_CONFLICT` to the signal catalog.

### V1.1 deliverables (this module)

| Deliverable | Included |
|---|---|
| `ProductionLine` + `LineCapacityProfile` registry | Yes |
| `LineAllocation` + required `LineAllocationLog` | Yes — transactional Confirm log (P1-9) |
| `LineAllocation.status` incl. **ConfirmPending** | Yes — saga in-flight state |
| **Confirm saga** with compensating reopen | Yes — no SLA Complete without `assignedProductionLineId` |
| **Cancel Draft** workflow (M5.5) | Yes |
| `OrganizationCapacitySettings` | Yes |
| Capacity engine — calendar-day mode + working-calendar readiness | Yes |
| Line Portfolio + Order Allocation panel | Yes |
| SLA sync via Module 2 Standard Engine Execution | Yes |
| `AssignedProductionLine` population via Module 1 API | Yes |
| Advisory overload warnings (planner may override) | Yes |
| Dual-path TNA read-only SLA when Module 5 **committed** (Confirmed / ConfirmPending) | Yes — Draft does not lock TNA |
| ERP / break-glass reconciliation queue | Yes |
| Module 1 "Line Allocation" navigation action | Yes — hidden when SLA N/A |
| Module 3 Line Load widget | Yes — optional |
| `GET /capacity/bootstrap` + read API | Yes |
| `CAPACITY_CONFLICT` RiskSignal in Module 2 engine | No — Section 2.8 deferral |
| Working-day load denominator active | No — requires `FactoryCalendar` population |
| Auto-suggest / auto-apply line placement | No — planner selects line |
| Multi-line split allocation (one order, two lines) | No — one Confirmed allocation per order |

### What Module 5 does not unlock in V1.1

| Capability | Target | Notes |
|---|---|---|
| Business-day engine on TNA dates | V1.1 Module 2 | Module 5 capacity engine ready; TNA engine still calendar days |
| External message bus | Future | In-process / REST only |
| Cutting / finishing capacity | Future | Sewing lines only in V1.1 |
| Real-time shop-floor feedback | Out of scope | MVP Principles |

### Data created by Module 5 (V1.1)

| Entity | Purpose |
|---|---|
| `ProductionLine` | Sewing line registry per factory |
| `LineCapacityProfile` | Daily capacity per line |
| `LineAllocation` | Order ↔ line assignment intent |
| `LineAllocationLog` | Required append-only allocation audit |
| `OrganizationCapacitySettings` | Org config |
| `CapacityReconciliationQueueItem` | ERP / break-glass drift resolution |

Production timeline audit remains Module 1 via Module 2 — parallel to `LineAllocationLog`, not replaced.

---

## Locked: Section 5.8 — Future Architecture

### Planned extensions

| Capability | Description | Dependency |
|---|---|---|
| **`CAPACITY_CONFLICT` RiskSignal** | Module 2 engine catalog entry consuming Module 5 overload outputs | Section 2.8 |
| **`FactoryCalendar` active mode** | Working-day load denominator; holiday-aware allocation preview | Section 2.6 entity population |
| **SMV / efficiency-based capacity** | Capacity in standard minutes linked to style complexity | PLM / method study integration |
| **ERP PP / work center sync** | SAP CRHD / PP order inbound via `externalReference` | Section 2.7 ERP connector |
| **Multi-line split allocation** | One order across two lines with partial `allocatedUnits` | LineAllocation v2 model |
| **Cutting & finishing capacity** | Extend registry beyond sewing — CST/CCP and FIN stages | Module scope expansion |
| **Ranked line suggestions** | Engine ranks lines by headroom — planner confirms (not auto-apply) | AI deferred |
| **Effective-dated capacity profiles** | Multiple profiles per line with overlap rules | Org admin maturity |

### Explicit non-goals (remain out of scope)

- Automatic downstream date cascade from capacity changes
- Replacement of ERP PP-DS / finite scheduling systems
- Real-time machine-level capacity sensing
- OEE, downtime, or operator attendance tracking

### Relationship to locked modules (future)

| Module / Section | Future relationship |
|---|---|
| **Module 2** | May add `CAPACITY_CONFLICT` to signal catalog — fed by Module 5, not computed in Module 5 |
| **Module 3** | Line Load widget may add drill-down to conflict days |
| **Module 6** | EXF completion unaffected — capacity module pre-ex-factory only |
| **Module 7** | Reporting reads allocation + utilization snapshots |

---

---

## Module 6: Shipment & Ex-Factory Tracking

> **Status:** Locked — Sections 6.1–6.8 complete  
> **Baseline:** Module 1 locked; Module 2 locked (Sections 2.1–2.8); Module 3 locked (Sections 3.1–3.8); Module 4 locked (Sections 4.1–4.8); Module 5 locked (Sections 5.1–5.8)

---

## Locked: Section 6.1 — Purpose & Scope

### Purpose

Module 6 is the **post-ex-factory shipment and logistics tracking workspace** for apparel production planners, logistics coordinators, and production managers. It organizes **what happened after goods left the factory** — carrier references, in-transit status, port/customs milestones, and delivery confirmation — while keeping **shipment preparation gate state** (FIN, SDR, VFB, PCK, EXF) on Module 2 TNA as the single source of truth for pre-ex-factory planning.

The module answers five operational questions planners and logistics staff ask after EXF:

| Question | Primary surface |
|---|---|
| **Which orders have ex-factoryed and need logistics follow-up?** | Post-EXF Portfolio — orders with active `ShipmentRecord` |
| **Which orders ship this week (pre-EXF)?** | **Module 3 Shipping This Week widget** (Widget 6) — Module 6 does not duplicate; see Section 6.4 |
| **Where is this shipment now?** | Order Shipment panel — status, carrier, ETD/ETA, milestone log |
| **Are shipping documents complete before departure?** | **TNA Workflow 4.9 + Module 1 Shipping docs** (SDR path) — pre-EXF; Module 6 links docs post-EXF only |
| **Has the buyer confirmed delivery?** | Shipment status workflow — Delivered confirmation with Actual Delivery Date |

**Architectural stance:** Module 6 owns **post-EXF logistics records and tracking state** only. It does **not** own TNA gate completion, EXF plan dates, summary status derivation, or risk generation — those remain Module 2. Module 6 **activates on** `OrderExFactoryCompleted` (Section 2.7) and never writes FIN/SDR/VFB/PCK/EXF gate state in V1.1.

### What this module is

- **Post-EXF shipment registry** — one primary `ShipmentRecord` per order in V1.1 (partial/multi-shipment → Section 6.8)
- **Logistics status workspace** — planner-updated post-EXF milestones: departed, in transit, at port, delivered
- **Document context surfacing** — read-only view of Module 1 **Shipping** category attachments linked from SDR workflow (Section 2.4 Branch 4.9)
- **Event-driven activation** — **post-commit** handler on `OrderExFactoryCompleted` creates shipment record; never rolls back EXF save (Section 6.6)
- **Cross-order logistics portfolio** — in-transit exposure, overdue ETAs, exception triage
- **ERP-ready tracking references** — carrier AWB/BL, SAP delivery document IDs on shipment log

### What this module is not

| Not this | Why |
|---|---|
| **TNA editor replacement** | FIN → EXF gates remain on embedded TNA (Module 2) — Workflow 4.9 unchanged in V1.1 |
| **Freight booking / TMS** | No rate shopping, container load planning, or carrier API automation — manual planner entry in V1.1 |
| **Customs / compliance system** | No HS code validation or duty calculation — reference fields only |
| **WMS / inventory** | No warehouse stock or pick/pack execution — PCK gate on TNA records packing complete only |
| **Risk engine** | Reads Order KPI cache and active `RiskSignal` — never creates signal rows; post-EXF delay signals → future Section 6.8 |
| **Duplicate EXF state** | No parallel EXF completion store — EXF `isComplete` lives on `TNAItem` only |

### Release boundary

Per locked Module 2 Sections 2.7 and 2.8:

| Release | Behavior |
|---|---|
| **V1** | Module 6 **does not ship**. Planner completes FIN → EXF on TNA manually (Workflow 4.9 Branch). Shipping docs uploaded to Module 1. `OrderExFactoryCompleted` emits; no shipment entity. Summary status → **Shipped** on EXF Complete. |
| **V1.1 (this module)** | Post-EXF Shipment & Logistics workspace ships. Shipment records, status log, portfolio views, document links. EXF completion remains on TNA — Module 6 consumes event only. |
| **Future (Section 6.8)** | Partial/multi-EXF records, ERP TMS inbound, `SHIPMENT_DELAY` RiskSignal, buyer delivery portal. |

### Relationship to locked modules

| Module | Relationship |
|---|---|
| **Module 1** | Reads Order header, summary status, Shipping documents; does not duplicate attachments |
| **Module 2** | **SSOT for pre-EXF shipment gates** and EXF completion; Module 6 reads EXF Actual Date; consumes `OrderExFactoryCompleted` — no EXF writes |
| **Module 3** | Widget 6 (Shipping This Week) reads TNA pre-EXF — unchanged; V1.1 optional Post-EXF Tracker widget (Section 3.8) via Module 6 read API |
| **Module 4** | Read-only material context on shipment panel — no material writes |
| **Module 5** | Read-only assigned line and allocation dates — capacity module ends at ex-factory handoff |

### Primary users

| Role | Use |
|---|---|
| **Production Planner** | Confirm post-EXF shipment record; update status during buyer chase |
| **Logistics Coordinator** | Enter carrier, BL/AWB, port ETAs; mark delivered |
| **Production Manager** | Review in-transit portfolio; resolve overdue ETAs |
| **Org Admin** | Configure `OrganizationShipmentSettings` (Section 6.3) |
| **Service account (ERP)** | V1.1 scoped role `shipment:inbound` — idempotent via `sourceEventId` (Section 6.6) |

### Authorization

| Rule | Detail |
|---|---|
| **Tenant isolation** | All queries scoped by auth `organizationId`; ERP inbound validates `organizationId` on service account |
| **Factory-level access** | Same factory visibility rules as Modules 1, 3, 4, and 5 |
| **Write path** | Post-EXF shipment mutations via Module 6 API only — no direct TNA or Order table writes from Module 6 UI |
| **Service accounts** | ERP uses scoped role **`shipment:inbound`** — not planner UI permissions; cannot POST TNA |
| **Break-glass** | Production Manager only — one-save TNA unlock on FIN–EXF (Section 6.2) |

---

## Locked: Section 6.2 — Ownership & Single Source of Truth

### Ownership matrix

| Concern | Owner | Module 6 role |
|---|---|---|
| FIN / SDR / VFB / PCK / EXF gate state | **Module 2 `TNAItem`** | Read only — pre-EXF context on shipment panel |
| EXF Actual Date, Current Planned Date | **Module 2 `TNAItem`** | Read — seeds `ShipmentRecord.exfActualDate` on activation |
| Summary status **Shipped** | **Module 2 engine** | Set when EXF Complete — **unchanged** when Module 6 → Delivered (P1-2) |
| Logistics **Delivered** | **Module 6 `ShipmentRecord`** | Does not change summary status in V1.1 — optional read-only “Delivery confirmed” badge on Order header |
| `OrderExFactoryCompleted` event | **Module 2** | Module 6 consumer — creates shipment record |
| Shipping documents (BL, packing list, invoice) | **Module 1 `OrderAttachment`** | Read + optional link from Module 6 — SSOT remains Module 1 |
| Post-EXF logistics status | **Module 6 `ShipmentRecord`** | SSOT for in-transit / delivered tracking |
| Carrier, BL/AWB, port references | **Module 6 `ShipmentRecord`** | SSOT — not duplicated on TNA |
| Shipment audit log | **Module 6 `ShipmentStatusLog`** | Required append-only |
| CP Progress, hard gates, timeline events | **Module 2 engine** | Module 6 never triggers engine runs in V1.1 |
| ERP reconciliation queue | **Module 6** | Surfaces EXF-without-record / record-without-EXF drift |

**Core rule:** Module 6 never maintains a parallel copy of **EXF completion state** or pre-EXF gate status. Shipment records reference EXF via immutable `exfTnaItemUuid` and `orderId`. Logistics status advances only through Module 6 workflows after EXF is Complete.

### Order applicability

Module 6 availability depends on EXF gate state — aligned with locked order-type templates (Section 2.2):

| Condition | Module 6 behavior |
|---|---|
| EXF gate **Complete** | **Full Module 6** — logistics updates when Active `ShipmentRecord` exists; **Shipped-untracked banner** when EXF Complete but no Active record (Section 6.2) |
| EXF gate **active, not Complete** | Module 6 **inactive** — pre-EXF on TNA (Workflow 4.9); Module 3 Widget 6 only; **no Order Shipment panel** |
| EXF gate **Skipped** or **N/A** | Module 6 **inactive** until EXF gate exists and is Complete on that order |
| Order **On Hold** | Module 6 **read-only** — inherits Module 2 edit freeze |
| Order **Cancelled / Closed** | Module 6 **read-only**; Active `ShipmentRecord` → **Archived** (Workflow M6.5) |
| EXF **reopened** (Workflow 7) or **break-glass** EXF edit | Archive active `ShipmentRecord`; reconciliation queue (M6.4) |

**Pre-EXF proximity (informational):** Module 3 Widget 6 uses EXF within 7 calendar days — Module 6 does not replicate that filter; Widget 6 remains pre-EXF queue only.

### Dual-path coexistence (pre-EXF TNA vs. post-EXF Module 6)

Module 6 scope begins **after** EXF Complete — no Draft state that locks pre-EXF TNA (contrast Module 5 Draft pattern).

| Phase | Condition | TNA Shipment gates (FIN–EXF) | Module 6 |
|---|---|---|---|
| **Pre-EXF** | EXF not Complete | **Editable on TNA** — Workflow 4.9 | **Inactive** — no panel; prep via TNA + Widget 6 |
| **Shipped-untracked** | EXF Complete; no Active `ShipmentRecord` | **Read-only** — committed ex-factory handoff | **Banner:** “Create shipment record” + M6.2 manual/backfill |
| **Post-EXF (active)** | EXF Complete + Active `ShipmentRecord` | **Read-only** — status / Actual Dates | **Write path** for logistics status |
| **Post-EXF (archived)** | EXF reopened, Cancelled, Closed, or admin archive | Per Module 2 / Module 1 rules | Record **Archived** — read-only |

| Surface | Behavior when EXF **Complete** (tracked or untracked) |
|---|---|
| TNA FIN–EXF rows — `status`, Actual Date | **Read-only** on embedded TNA |
| TNA Shipment rows — Notes, chase, ownership | Still editable (Workflow 4.4, 9) |
| Module 6 Order Shipment panel | **Post-EXF only** — hidden until EXF Complete; full panel when record Active |
| Pre-EXF document prep | TNA SDR footer → Module 1 Shipping upload (Section 2.5) — not Module 6 |

**Shipped-untracked rule:** Summary status = **Shipped** and EXF Complete but no Active record → Order Command Center shows **required-action banner**; `ShipmentReconciliationQueueItem` (ExfWithoutRecord) until M6.2 or backfill resolves.

**Org rollout backfill:** When `module6Enabled` turns true, worker scans Shipped orders without Active records → queue ExfWithoutRecord; planner or auto-create (if `autoCreateOnExfComplete`) resolves.

**Coexistence with Modules 4 and 5:** Material and capacity dual-path rules apply **independently** — Module 6 does not alter Module 4 Material rows or Module 5 SLA rows.

**Break-glass override:** Production Manager may unlock FIN–EXF on TNA for **one save** with required reason → timeline **`MODULE6_SYNC_BYPASS`** → Module 6 shows **“Out of sync — reconcile”** until EXF state and `ShipmentRecord` realign or record is archived (M6.4).

**Reconciliation on read:** Module 6 compares EXF `isComplete`, `ShipmentRecord.status`, and event log on every Order Shipment panel load.

### EXF activation state machine

Aligned with locked Workflow 4.9 and Section 2.7 events — Module 6 reacts; Module 2 commits EXF:

| Step | Module 2 / Module 1 action | Module 6 action |
|---|---|---|
| Planner completes FIN → PCK → EXF on TNA | EXF → Complete; emit `OrderExFactoryCompleted`; summary status → Shipped | **Post-commit** handler creates `ShipmentRecord` (Pending Departure) — EXF save never rolled back on Module 6 failure |
| Handler failure / auto-create off | EXF remains Complete; Shipped | `ExfWithoutRecord` queue + Order banner; manual M6.2 |
| Planner updates logistics status | No TNA change | Update `ShipmentRecord`; append `ShipmentStatusLog` |
| Planner marks Delivered | No TNA change; summary status stays **Shipped** | Status → Delivered; `actualDeliveryDate`; optional “Delivery confirmed” badge |
| Planner reopens EXF (Workflow 7) | `TnaItemReopened` (EXF); EXF active; summary status recalculated | Archive `ShipmentRecord` (M6.4) |
| Break-glass EXF edit | `MODULE6_SYNC_BYPASS` timeline | Reconcile banner until realign |
| Order Cancelled / Closed | Module 1 override | Archive Active record (M6.5) |
| ERP inbound delivery | EXF must be Complete | Idempotent update via `shipment:inbound` |

**Invariant:** Module 6 **never** marks EXF Complete — EXF completion is exclusively Workflow 4.9 on TNA (Module 2 Standard Engine Execution).

### Link model

| Module 6 entity | Required link | Optional link |
|---|---|---|
| `ShipmentRecord` | `orderId`, `exfTnaItemUuid`, `exfActualDate`, `organizationId` | `carrierName`, `blOrAwbNumber`, `forwarderReference` |
| `ShipmentStatusLog` | `shipmentRecordId`, `action`, `userId`, `correlationId` | `payload` JSON |
| `ShipmentDocumentLink` | `shipmentRecordId`, `orderAttachmentId` (Module 1) | `documentType` label |
| Load / overdue projection | Derived | Not persisted |

### Logical architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│           Module 6 — Shipment & Ex-Factory Tracking (UI)                 │
│  Post-EXF Portfolio · Order Shipment Panel · Exception Queue             │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ read queries · shipment writes
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│        Module 6 Service Layer (records, status engine, post-commit handlers) │
└───────┬─────────────────────────────┬───────────────────────────────────┘
        │                             │
        ▼                             ▼
┌───────────────────┐     ┌───────────────────────────────────────────────┐
│ Module 6 store    │     │ Module 2 read · post-commit event subscription │
│ ShipmentRecord    │     │ OrderExFactoryCompleted · TnaItemReopened(EXF) │
│ ShipmentStatusLog │     │                                                 │
│ ShipmentDocLink   │     │ Module 1 read — Order · Shipping attachments   │
└───────────────────┘     └───────────────────────────────────────────────┘
        │                             │
        └─────────────┬───────────────┘
                      ▼
        ┌───────────────────────────────────────────────┐
        │ Module 3 widgets · Module 4/5 read context    │
        │ factoryTimezone · ERP inbound (V1.1)            │
        └───────────────────────────────────────────────┘
```

### Architectural principles

| # | Principle |
|---|---|
| 1 | **TNA is pre-EXF SSOT** — FIN through EXF on Module 2; Module 6 starts after EXF Complete |
| 2 | **Post-commit activation** — handler runs **after** Module 2 transaction commits; Module 6 failure never rolls back EXF (Section 2.7) |
| 3 | **Logistics ≠ gate state** — post-EXF carrier/status lives in Module 6; EXF records factory departure on the plan |
| 4 | **Documents stay on Module 1** — Module 6 links to `OrderAttachment`; does not store file bytes |
| 5 | **No EXF orchestration in V1.1** — unlike Module 5 → SLA, Module 6 does not Confirm EXF; planner uses TNA |
| 6 | **Timezone authority** — all date fields use `OrganizationTnaSettings.factoryTimezone` (Section 2.6) |
| 7 | **Manual override wins** — planner may ignore overdue advisory and update ETAs freely |
| 8 | **Factory-scoped** — shipment records inherit order factory visibility |
| 9 | **Read-only TNA when EXF Complete** — FIN–EXF terminal fields locked; break-glass or Workflow 7 reopen only |

---

## Locked: Section 6.3 — Data Model

### OrganizationShipmentSettings

Org-level configuration for Module 6 — separate from `OrganizationTnaSettings` (Section 2.6), `OrganizationMaterialSettings` (Section 4.3), and `OrganizationCapacitySettings` (Section 5.3). Configured by **Org Admin** in V1.1.

| Field | Default | Purpose |
|---|---|---|
| `defaultCarrierLabel` | "Forwarder" | Display label for carrier field |
| `inTransitHorizonDays` | 45 | Portfolio forward window for active shipments |
| `overdueEtaGraceDays` | 0 | Advisory overdue after ETA + grace |
| `autoCreateOnExfComplete` | true | Event handler creates `ShipmentRecord` on `OrderExFactoryCompleted` |
| `module6Enabled` | true | Org-wide feature flag for V1.1 rollout |

**V1.1 scope:** Single org config — no factory-level override (consistent with Section 5.3 deferral).

**Timezone:** All Module 6 date fields are **calendar dates in org `factoryTimezone`** — same convention as Modules 3 and 5.

### Entity: ShipmentRecord

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | UUID | Yes | Primary key |
| `organizationId` | UUID | Yes | Tenant boundary |
| `orderId` | UUID | Yes | FK to Module 1 Order |
| `exfTnaItemUuid` | UUID | Yes | **EXF** instance — immutable link |
| `exfActualDate` | Date | Yes | Copied from EXF Actual Date at activation |
| `activationEventId` | UUID | No | `OrderExFactoryCompleted.eventId` — idempotency key |
| `status` | Enum | Yes | PendingDeparture · InTransit · AtPort · Delivered · Exception · Archived |
| `carrierName` | String | No | Forwarder / carrier display |
| `blOrAwbNumber` | String | No | Bill of lading or air waybill — ERP readiness |
| `forwarderReference` | String | No | External booking ref |
| `estimatedDepartureDate` | Date | No | ETD — planner or ERP |
| `actualDepartureDate` | Date | No | Set when status → InTransit |
| `estimatedArrivalDate` | Date | No | ETA at port or buyer DC |
| `actualDeliveryDate` | Date | No | Set when status → Delivered |
| `externalReference` | String | No | SAP delivery / shipment doc ID |
| `notes` | Text | No | Planner annotations |
| `createdAt` / `updatedAt` | Timestamp | Yes | Audit |
| `version` | Integer | Yes | Optimistic concurrency |

**V1.1 constraint:** Max one **Active** shipment record per order (status not Archived). Partial/multi-shipment → Section 6.8.

**Activation default:** Post-commit on `OrderExFactoryCompleted` — `status = PendingDeparture`, `exfActualDate` from event payload.

**Idempotency:** Unique `(organizationId, orderId, activationEventId)` on create — duplicate `eventId` returns existing record.

### Shipment status transition matrix (P0-4)

Allowed transitions — API enforces; invalid transition → **Error**:

| From ↓ / To → | InTransit | AtPort | Delivered | Exception | Archived |
|---|---|---|---|---|---|
| **PendingDeparture** | ✅ | ❌ | ✅ (skip allowed — direct delivery) | ✅ | ✅ |
| **InTransit** | — | ✅ | ✅ | ✅ | ✅ |
| **AtPort** | ❌ | — | ✅ | ✅ | ✅ |
| **Delivered** | ❌ | ❌ | — | ❌ | ✅ (Production Manager correction only) |
| **Exception** | ✅ | ✅ | ✅ | — | ✅ |
| **Archived** | ❌ | ❌ | ❌ | ❌ | — (terminal) |

**Rules:**

- **Delivered** is terminal for normal workflow — no reopen to In Transit without Production Manager archive + new record (V1.1) or M6.2 after EXF re-complete
- **Archived** via EXF reopen, Cancel/Close (M6.5), break-glass realign, or admin correction
- Status changes append `ShipmentStatusLog` in **same Module 6 transaction** as record update

### Entity: ShipmentStatusLog

Append-only logistics audit — **required** for every status change, ERP sync, and archive action in V1.1. Production audit for EXF remains Module 1 Timeline via Module 2.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | UUID | Yes | Primary key |
| `organizationId` | UUID | Yes | Tenant boundary |
| `shipmentRecordId` | UUID | Yes | FK |
| `orderId` | UUID | Yes | Denormalized for query |
| `action` | Enum | Yes | Created · StatusChange · DateRevision · DocumentLinked · Archive · ErpInbound · ExfReopened · OrderLifecycleArchive · BreakGlassSync |
| `userId` | UUID | Yes | Actor — planner or service account |
| `sourceModule` | Enum | Yes | `module-6-ui` · `event-handler` · `erp-inbound` · `break-glass-sync` |
| `correlationId` | UUID | Yes | Request / event id |
| `payload` | JSON | No | `{ previousStatus, newStatus, dates, externalReference }` |
| `createdAt` | Timestamp | Yes | Immutable |

### Entity: ShipmentDocumentLink

Optional pointer from shipment record to Module 1 attachment — does not duplicate file storage.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | UUID | Yes | Primary key |
| `shipmentRecordId` | UUID | Yes | FK |
| `orderAttachmentId` | UUID | Yes | FK to Module 1 `OrderAttachment` (Shipping category) |
| `documentLabel` | String | No | e.g. "Bill of Lading", "Commercial Invoice" |
| `linkedAt` | Timestamp | Yes | When link created |
| `linkedByUserId` | UUID | Yes | Actor |

### Entity: ShipmentReconciliationQueueItem

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | UUID | Yes | Primary key |
| `organizationId` | UUID | Yes | Tenant boundary |
| `orderId` | UUID | Yes | FK |
| `reason` | Enum | Yes | ExfWithoutRecord · RecordWithoutExf · StatusDrift · ExfReopenedWithActiveShipment · OrderCancelledWithActiveShipment · OrderClosedWithActiveShipment · ErpOrphan |
| `detectedAt` | Timestamp | Yes | When drift detected |
| `resolvedAt` | Timestamp | No | When planner or worker resolves |
| `resolution` | Text | No | Planner note |

### Data model notes

| Rule | Detail |
|---|---|
| No duplicate EXF state | `ShipmentRecord.status` tracks post-EXF logistics — not EXF `isComplete` |
| Pre-EXF gate sequence | FIN → SDR → VFB → PCK → EXF per locked Section 2.7 — Module 6 read-only context |
| ERP keys | `ShipmentRecord.externalReference` + `Order.externalReference` for delivery doc mapping |
| Document SSOT | Files live in Module 1 — links are pointers only; link create validates **Shipping** category |
| Summary vs logistics | Summary **Shipped** = EXF Complete (Module 2); **Delivered** = Module 6 only — no summary status change in V1.1 |

---

## Locked: Section 6.4 — Planner Workflows (M6.1–M6.5)

### Overview

Planner workflows split **pre-EXF preparation** (TNA Workflow 4.9 — unchanged) from **post-EXF logistics** (Module 6). Module 6 workflows **never** invoke Module 2 Standard Engine Execution in V1.1.

### Module 3 boundary — Widget 6 vs. Post-EXF tracker (P1-7)

| Question | Owner | Surface | Inclusion logic |
|---|---|---|---|
| **Which orders ship this week (pre-EXF)?** | **Module 3** | Widget 6 | EXF not Complete; EXF `currentPlannedDate` within 7 days — Section 3.3 **unchanged** |
| **Which orders have ex-factoryed and are in transit?** | **Module 6** | Post-EXF Portfolio | EXF Complete + Active `ShipmentRecord` status ≠ Delivered, Archived |
| **Which post-EXF shipments need follow-up?** | **Module 3 → Module 6** | Post-EXF tracker widget (Section 3.8) | Same as Post-EXF Portfolio — `GET /shipments/portfolio` |
| **Where is this shipment in the logistics chain?** | **Module 6** | Order Shipment panel | EXF Complete + Active record |

Module 6 **does not** replicate Widget 6. Widget 6 deep-links → Order Command Center (Shipment group). Post-EXF tracker deep-links → Module 6 Order Shipment panel.

### Pre-EXF vs. post-EXF surfaces (P1-6)

| Phase | Order Command Center | Module 6 panel |
|---|---|---|
| **Pre-EXF** | TNA Shipment group + Module 1 Shipping docs — Workflow 4.9 | **Hidden** — no Module 6 panel |
| **EXF Complete, untracked** | Shipped-untracked banner + TNA FIN–EXF read-only | Prompt **Create shipment record** (M6.2) |
| **Post-EXF tracked** | Optional “Delivery confirmed” badge when Delivered | Full Order Shipment panel |

### Workflow M6.1 — Review post-EXF portfolio

**Trigger:** Logistics coordinator daily review or Production Manager weekly lookahead.

**Steps:**

1. Open **Post-EXF Portfolio** — filter by factory, status, ETA window (`factoryTimezone`)
2. View active shipments — Pending Departure, In Transit, At Port, Exception
3. Sort by overdue ETA, then EXF Actual Date
4. Drill into order → Order Shipment panel
5. No TNA mutation

**Output:** Coordinator identifies delayed or undocumented shipments before buyer escalation.

### Workflow M6.2 — Activate shipment record (EXF complete)

**Trigger:** Post-commit handler on `OrderExFactoryCompleted` **or** manual create on Shipped-untracked order.

**Preconditions:**

- EXF gate Complete on TNA
- Order not Cancelled / Closed
- `OrganizationShipmentSettings.module6Enabled` = true

**Post-commit activation (automatic when `autoCreateOnExfComplete` = true):**

```
OnOrderExFactoryCompleted(event):
  1. Module 2 transaction already COMMITTED — EXF, timeline, KPI, Shipped status persisted
  2. BEGIN Module 6 transaction (separate from Module 2)
  3.   Idempotency: IF record exists for (organizationId, orderId, event.eventId) → RETURN existing
  4.   INSERT ShipmentRecord — PendingDeparture; exfActualDate from payload
  5.   INSERT ShipmentStatusLog (Created, sourceModule: event-handler, correlationId: event.eventId)
  6. COMMIT Module 6 transaction
  7. ON failure: ROLLBACK Module 6 only → enqueue ExfWithoutRecord → Order Shipped-untracked banner
     → EXF save is NEVER rolled back
```

**Manual path:** Planner clicks **Create shipment record** on Shipped-untracked order → same fields → clears ExfWithoutRecord queue item.

**Org backfill:** On `module6Enabled` enablement, worker queues ExfWithoutRecord for all Shipped orders lacking Active records; optional auto-create per setting.

**Rule:** Creation does **not** write TNA — EXF already Complete.

### Workflow M6.3 — Update shipment status and dates

**Trigger:** Carrier confirmation, forwarder update, or delivery proof.

**Steps:**

1. Open **Order Shipment panel**
2. Display read-only context:
   - EXF Actual Date, pre-EXF gate summary (FIN/SDR/VFB/PCK chips from Module 2)
   - Linked Module 1 Shipping documents
   - Order summary status (Shipped)
3. Enter / revise carrier, BL/AWB, ETD, ETA
4. Advance **status** per transition matrix (Section 6.3) — e.g.:
   - Pending Departure → In Transit (set `actualDepartureDate` if empty)
   - In Transit → At Port → Delivered (set `actualDeliveryDate` — required)
   - Pending Departure → Delivered (direct — allowed)
   - Any → Exception (requires note)
5. Append `ShipmentStatusLog` (StatusChange) — **same transaction** as record update
6. Optional: link Module 1 Shipping attachment (`ShipmentDocumentLink`) — **Shipping category only**
7. When **Delivered:** summary status remains **Shipped**; optional read-only **“Delivery confirmed”** badge on Order header (Module 6 projection — not new summary status)

**Validation:**

| Rule ID | Condition | Severity |
|---|---|---|
| `DELIVERY_DATE_REQUIRED` | Status → Delivered without `actualDeliveryDate` | **Error** |
| `EXF_NOT_COMPLETE` | Create/update on order where EXF not Complete | **Error** |
| `INVALID_STATUS_TRANSITION` | Transition not in Section 6.3 matrix | **Error** |

| `ETA_BEFORE_EXF` | `estimatedDepartureDate` < `exfActualDate` | Advisory |

### Workflow M6.4 — EXF reopen and break-glass reconciliation

**Trigger (primary):** Module 2 emits **`TnaItemReopened`** with `milestoneCode = EXF` (Workflow 7). **Backup:** reconciliation job on read detects EXF `isComplete` = false with Active record.

**Also triggers on:** Production Manager break-glass EXF/FIN edit (`MODULE6_SYNC_BYPASS`) while Active record exists.

**Steps:**

1. Set shipment status **Archived**
2. Append `ShipmentStatusLog` (ExfReopened or BreakGlassSync)
3. Create `ShipmentReconciliationQueueItem` (ExfReopenedWithActiveShipment) until realign
4. Show **“Out of sync — reconcile”** banner on Order Shipment panel
5. On realign paths:
   - Planner re-completes EXF → new post-commit M6.2 on `OrderExFactoryCompleted`
   - Planner confirms archive only → queue resolved; manual M6.2 when ready

**Rule:** Module 6 never blocks Workflow 7 or break-glass on TNA — archive/reconcile is reactive.

### Workflow M6.5 — Order Cancelled / Closed with active shipment (P1-3)

**Trigger:** Module 1 order override → Cancelled or Closed (Module 2 engine in same transaction — Section 2.7).

**Post-commit steps** (after override transaction commits — same pattern as M6.2):

1. Detect Active `ShipmentRecord` on order
2. Set status **Archived**; append `ShipmentStatusLog` (OrderLifecycleArchive)
3. Create queue item (OrderCancelledWithActiveShipment or OrderClosedWithActiveShipment) if audit needed
4. Exclude from Post-EXF Portfolio default view — available under archived filter

**Rule:** Module 6 does not reverse EXF or summary Shipped — lifecycle override only archives logistics tracking.

### Pre-EXF reference — Workflow 4.9 (locked, not Module 6)

Shipment preparation remains on TNA per locked Section 2.4 Branch 4.9:

FIN → SDR (attach Module 1 Shipping docs) → VFB → PCK → EXF Complete.

Module 6 surfaces pre-EXF sequence as **read-only chips** on Order Shipment panel **after EXF Complete only** — does not orchestrate prep.

---

## Locked: Section 6.5 — Shipment Status Engine

### Purpose

The shipment status engine is Module 6's **deterministic read-side calculator** — overdue detection, portfolio projections, and advisory banners. It does **not** write TNA state, Order fields, or RiskSignal rows.

### Inputs

| Input | Source | Notes |
|---|---|---|
| Active `ShipmentRecord` rows | Module 6 store | Status, dates, carrier |
| `factoryTimezone` | `OrganizationTnaSettings` (Section 2.6) | Date boundary math |
| `overdueEtaGraceDays` | `OrganizationShipmentSettings` | Advisory threshold |
| `inTransitHorizonDays` | `OrganizationShipmentSettings` | Portfolio window |
| Pre-EXF gate projection | Module 2 TNA read | Context chips only — not engine inputs |

### Overdue and advisory rules (V1.1)

| Rule ID | Condition | Severity | Behavior |
|---|---|---|---|
| `SHIPMENT_ETA_OVERDUE` | Today > `estimatedArrivalDate` + grace AND status not Delivered | Advisory | Badge on portfolio and panel |
| `DEPARTURE_NOT_RECORDED` | Status PendingDeparture AND today > exfActualDate + N days (default 3) | Advisory | Prompt to record departure |
| `MISSING_BL_AWB` | In Transit AND `blOrAwbNumber` empty | Advisory | Document completeness hint |
| `EXF_NOT_COMPLETE` | Shipment write attempted without EXF Complete | **Error** | Block save |

**V1.1:** Advisories are **non-blocking** — planner decision is final. No `SHIPMENT_DELAY` RiskSignal in V1.1 (Section 6.8 / locked Section 2.8 deferral).

### Portfolio projections

```
isOverdue(record) =
  record.status NOT IN (Delivered, Archived)
  AND record.estimatedArrivalDate IS NOT NULL
  AND today(factoryTimezone) > record.estimatedArrivalDate + overdueEtaGraceDays

daysInTransit(record) =
  IF record.actualDepartureDate IS NOT NULL:
    inclusiveCalendarDays(record.actualDepartureDate, today)
  ELSE IF record.status != PendingDeparture:
    inclusiveCalendarDays(record.exfActualDate, today)
  ELSE: 0
```

**Determinism:** Same record set + settings → same advisory output on every run.

### Engine versioning

| Field | Value |
|---|---|
| `shipmentEngineVersion` | `"6.5"` — API response metadata |
| Invalidation | On shipment CRUD or settings change |

---

## Locked: Section 6.6 — Integration with Modules 1–5

### Module 1 — Order Command Center

| Integration | Direction | Detail |
|---|---|---|
| Shipment tracking action | Module 1 → Module 6 | Visible when EXF Complete and Module 6 enabled — **hidden pre-EXF** |
| Shipped-untracked banner | Module 6 → Module 1 | EXF Complete + no Active record — required-action CTA to M6.2 |
| Delivery confirmed badge | Module 6 → Module 1 read | Optional projection when status = Delivered — not summary status change |
| Order context read | Module 6 → Module 1 | PO ref, style, factory, summary status |
| Shipping documents | Module 6 → Module 1 read | List / link `OrderAttachment` (**Shipping** category) — upload remains Module 1 / TNA SDR |
| KPI / Risk display | Module 6 → Module 1 read | Read-only on shipment panel |
| Cancel / Close archive | Module 1 → Module 6 | M6.5 post-commit after order override transaction |

### Module 2 — Critical Path & Milestones

| Integration | Direction | Detail |
|---|---|---|
| Pre-EXF gate read | Module 6 → Module 2 | FIN, SDR, VFB, PCK, EXF status and dates |
| `OrderExFactoryCompleted` | Module 2 → Module 6 | **Post-commit** activation (M6.2) — never in Module 2 save transaction |
| `TnaItemReopened` (EXF) | Module 2 → Module 6 | **Primary** archive trigger (M6.4) |
| EXF reopen / break-glass | Module 2 → Module 6 | Archive + reconcile banner |
| TNA write | None | Module 6 **never** POSTs TNA saves in V1.1 |
| Standard Engine Execution | Not invoked | Post-EXF updates are Module 6-local |

**Section 2.7 alignment:** Locked in-process handlers participate in the Module 2 save transaction. Module 6 **must not** register an in-process handler that throws — all Module 6 activation runs **post-commit** (after step 7 KPI cache write completes). Handler failure enqueues `ExfWithoutRecord` only.

**Event subscriptions (V1.1 — post-commit):**

| Event | Handler action |
|---|---|
| `OrderExFactoryCompleted` | M6.2 create `ShipmentRecord` — idempotent on `eventId` |
| `TnaItemReopened` where `milestoneCode = EXF` | M6.4 archive Active record |

**Event handler contract:**

| Event field | Handler use |
|---|---|
| `eventId` | Idempotency key |
| `orderId` | Create `ShipmentRecord` |
| `payload.tnaItemUuid` | `exfTnaItemUuid` |
| `payload.exfActualDate` | `exfActualDate` |
| `organizationId` | Tenant scope |

**Read API (V1.1):**

| Endpoint | Consumer | Projection |
|---|---|---|
| `GET /shipments/bootstrap` | Module 6 UI | Settings, horizon, factoryTimezone |
| `GET /shipments/portfolio` | Module 6 UI, Module 3 Post-EXF widget | Active records (not Delivered/Archived), overdue counts |

**Post-EXF widget inclusion (P1-7 — Module 3 Section 3.8):** EXF Complete + Active `ShipmentRecord` with status ∈ {PendingDeparture, InTransit, AtPort, Exception}.
| `GET /shipments/orders/{orderId}` | Order Shipment panel | Record, logs, document links, pre-EXF chips |
| `GET /shipments/reconciliation` | Admin queue | Open queue items |

#### ERP shipment reconciliation

| Inbound path | Required behavior |
|---|---|
| ERP delivery confirmation inbound | Role: **`shipment:inbound`** | Metadata: `externalReference`, `sourceSystem`, `sourceEventId`; EXF must be Complete |
| Matching order + EXF Complete | Update `ShipmentRecord`; append `ShipmentStatusLog` (`erp-inbound`) |
| EXF Complete without record | `ExfWithoutRecord` queue + Shipped-untracked banner |
| Record without EXF Complete | `RecordWithoutExf` — archive or queue; **reject** inbound status advance |
| Duplicate `sourceEventId` | Idempotent reject (Section 2.7) |

### Module 3 — Planner Dashboard

| Integration | Direction | Detail |
|---|---|---|
| Shipping This Week (Widget 6) | Module 3 → Module 2 | **Unchanged** — pre-EXF EXF horizon |
| Post-EXF shipment tracker | Module 3 → Module 6 | V1.1 optional (Section 3.8) — `GET /shipments/portfolio` |
| Deep links | Module 3 → Module 6 / Module 1 | Pre-EXF → Order Command Center; Post-EXF → Shipment panel |

### Module 4 — Material Planning & Procurement

| Integration | Direction | Detail |
|---|---|---|
| Material context | Module 6 → Module 2 / Module 4 read | Optional chips — material cleared before ship |
| Material writes | None | Module 6 never invokes Module 4 |

### Module 5 — Capacity Planning & Line Allocation

| Integration | Direction | Detail |
|---|---|---|
| Assigned line context | Module 6 → Module 1 / Module 5 read | Line name on shipment panel — informational |
| Capacity writes | None | Module 5 ends at floor; Module 6 starts at EXF |

### Cross-module navigation map

```
Module 3 Widget 6 row (pre-EXF)
    → Order Command Center (Shipment group expanded → EXF)

OrderExFactoryCompleted (post-commit)
    → Module 6 M6.2 → Post-EXF Portfolio

TnaItemReopened (EXF, post-commit)
    → Module 6 M6.4 archive

Module 3 Post-EXF widget row
    → Module 6 Order Shipment panel

Module 1 "Shipment tracking" action (EXF Complete)
    → Module 6 Order Shipment panel
```

### Relationship to locked sections

| Section | Relationship |
|---|---|
| **2.4 Branch 4.9** | Pre-EXF shipment prep on TNA — Module 6 read-only context |
| **2.5 SDR footer** | Attach shipping document → Module 1; Module 6 links post-EXF |
| **2.6** | `factoryTimezone` |
| **2.7 Module 6 boundary** | Post-EXF only; `OrderExFactoryCompleted` consumer |
| **2.8** | Module 6 V1.1 runtime deferral fulfilled by this module |
| **3.3 Widget 6** | Unchanged — pre-EXF shipping queue |
| **3.8** | Post-EXF tracker widget dependency |
| **5.8** | Capacity pre-ex-factory — no overlap with Module 6 |

---

## Locked: Section 6.7 — V1 Limitations & V1.1 Deliverables

### V1 behavior (Module 6 not built)

Locked baseline — no change to shipped V1 product:

| Capability | V1 behavior | Reference |
|---|---|---|
| FIN → EXF gate updates | Manual on TNA — Workflow 4.9 | Section 2.4 |
| Post-EXF tracking | Not available | Section 2.8 |
| Shipping documents | Module 1 OrderAttachment | Module 1, Section 2.5 |
| `OrderExFactoryCompleted` | Emits on EXF Complete | Section 2.7 |
| Summary status Shipped | Module 2 engine on EXF | Section 2.4 |
| Module 3 Post-EXF widget | Not available | Section 3.8 |

### V1.1 deliverables (this module)

| Deliverable | Included |
|---|---|
| `ShipmentRecord` + required `ShipmentStatusLog` | Yes — same-transaction status logs |
| **Post-commit** activation on `OrderExFactoryCompleted` | Yes — never rolls back EXF (P0-1) |
| **`TnaItemReopened` (EXF)** post-commit handler | Yes — M6.4 primary trigger (P1-1) |
| **Status transition matrix** | Yes — Section 6.3 (P0-4) |
| **`MODULE6_SYNC_BYPASS`** break-glass + reconcile banner | Yes (P0-2) |
| **Shipped-untracked** banner + backfill + ExfWithoutRecord queue | Yes (P0-3) |
| **Delivered** logistics vs summary **Shipped** rule + optional badge | Yes (P1-2) |
| **M6.5** Cancel/Close archive workflow | Yes (P1-3) |
| Service role **`shipment:inbound`** | Yes (P1-4) |
| Pre-EXF panel hidden; post-EXF panel only | Yes (P1-6) |
| Post-EXF widget query contract | Yes (P1-7) |
| `ShipmentDocumentLink` (Shipping category validated) | Yes |
| `OrganizationShipmentSettings` | Yes |
| Post-EXF Portfolio + Order Shipment panel | Yes |
| Shipment status engine — overdue advisories | Yes |
| ERP / reconciliation queue | Yes |
| Module 1 "Shipment tracking" action | Yes — EXF Complete only |
| Module 3 Post-EXF tracker widget | Yes — optional |
| `GET /shipments/bootstrap` + read API | Yes |
| EXF orchestration via Module 6 | No — EXF remains TNA Workflow 4.9 |
| `SHIPMENT_DELAY` RiskSignal | No — Section 6.8 / 2.8 deferral |
| Partial / multi-shipment records | No — one Active record per order |
| Carrier API / automated tracking | No — manual entry |

### What Module 6 does not unlock in V1.1

| Capability | Target | Notes |
|---|---|---|
| Pre-EXF gate orchestration | Remains Module 2 TNA | Unlike Module 5 → SLA pattern |
| Buyer delivery portal | Future | Out of MVP scope |
| External message bus | Future | Post-commit subscription in V1.1; durable outbox → V1.2 |

### Data created by Module 6 (V1.1)

| Entity | Purpose |
|---|---|
| `ShipmentRecord` | Post-EXF logistics state per order |
| `ShipmentStatusLog` | Required append-only audit |
| `ShipmentDocumentLink` | Pointer to Module 1 Shipping attachments |
| `OrganizationShipmentSettings` | Org config |
| `ShipmentReconciliationQueueItem` | ERP / EXF reopen drift |

Production timeline audit for EXF completion remains Module 1 via Module 2 — parallel to `ShipmentStatusLog`, not replaced.

---

## Locked: Section 6.8 — Future Architecture

### Planned extensions

| Capability | Description | Dependency |
|---|---|---|
| **`SHIPMENT_DELAY` RiskSignal** | Module 2 catalog entry consuming Module 6 overdue outputs | Section 2.8 |
| **Partial / multi-shipment** | Multiple `ShipmentRecord` rows per order — colorway or split EXF | Section 2.2 multi-EXF readiness |
| **ERP TMS inbound** | Automated status from SAP LE / forwarding agent | Section 2.7 ERP connector |
| **Carrier tracking API** | Poll AWB/BL for status — planner confirm, not auto-write | Integration maturity |
| **Buyer delivery confirmation** | External portal or EDI — feeds Delivered status | Future module boundary |
| **Container / vessel registry** | Extend beyond single BL field | Logistics scope expansion |

### Explicit non-goals (remain out of scope)

- Replacement of freight forwarder TMS or customs brokerage systems
- Pre-EXF gate orchestration (FIN–EXF remain on TNA)
- Inventory or warehouse management post-EXF
- Automatic EXF date cascade from logistics delays

### Relationship to locked modules (future)

| Module / Section | Future relationship |
|---|---|
| **Module 2** | May add `SHIPMENT_DELAY` to signal catalog — fed by Module 6 |
| **Module 3** | Post-EXF widget drill-down to status log |
| **Module 7** | Reporting reads shipment snapshots and on-time delivery metrics |
| **ERP** | Bidirectional delivery status sync |

---

---

## Module 7: Reporting, Analytics & Administration

> **Status:** Locked — Sections 7.1–7.8 complete  
> **Baseline:** Module 1 locked; Module 2 locked (Sections 2.1–2.8); Module 3 locked (Sections 3.1–3.8); Module 4 locked (Sections 4.1–4.8); Module 5 locked (Sections 5.1–5.8); Module 6 locked (Sections 6.1–6.8)

---

## Locked: Section 7.1 — Purpose & Scope

### Purpose

Module 7 is the **reporting, analytics, and administration hub** for production leadership, operations managers, and org administrators. It provides **read-only analytical views**, **scheduled exports**, and a **unified administration entry point** across Modules 1–6 — without duplicating operational workflows (Module 3) or configuration SSOT (Module 2 Section 2.6, Modules 4–6 org settings).

The module answers five questions leadership and admin ask beyond the daily planner dashboard:

| Question | Primary surface |
|---|---|
| **How are we performing against ex-factory commitments?** | Ex-Factory Performance report — KPI cache + EXF Actual vs Planned |
| **Where is risk concentrated across the portfolio?** | Risk Exposure report — Order KPI cache `riskLevel` / `riskReasons[]`; `RiskSignal` detail export only |
| **How loaded are our lines and suppliers?** | Capacity & Material Exposure reports — Module 5 / Module 4 read APIs |
| **Are post-ex-factory deliveries on time?** | Shipment Performance report — Module 6 `ShipmentRecord` |
| **Where do I configure the workspace?** | **Administration hub** — links to locked org settings per module |

**Architectural stance:** Module 7 is **read-only analytics and admin navigation**. It **never** recomputes CP Progress, Risk Level, summary status, or gate completion — those remain Module 2 engine outputs on Order KPI cache (Section 2.7). Module 7 **never** mutates TNA, orders, materials, capacity, or shipment state.

### What this module is

- **Standard report catalog** — apparel-native reports over KPI cache, Timeline, and module read APIs
- **Ad-hoc analytical queries** — date-range, factory, buyer, order-type filters with export
- **Scheduled exports** — CSV / Excel and ERP KPI snapshot jobs (Section 2.8 deferral)
- **Administration hub** — single entry for Org Admin to reach Module 1 org settings, Module 2 TNA config (Section 2.6), and Modules 4–6 org settings — **not a duplicate config store**
- **Audit visibility** — who ran exports, when snapshots were generated
- **Deep-link bridge** — report drill-down opens Order Command Center or module panel (same pattern as Module 3)

### What this module is not

| Not this | Why |
|---|---|
| **Planner Dashboard (Module 3)** | Module 3 is operational queues for daily action — Module 7 is analytical roll-ups and trends |
| **TNA / gate configuration** | SSOT remains Section 2.6 — Module 7 links only |
| **Risk or CP engine** | Reads Order KPI cache for counts; `RiskSignal` for detail export only — never inserts or recalculates |
| **Full IAM / HR system** | User provisioning → future; V1.1 shows role visibility summary only |
| **External BI replacement** | Exports feed Excel/ERP; optional future warehouse connector (Section 7.8) |
| **Real-time operational monitoring** | Snapshots and batch queries — not live shop-floor dashboards |

### Release boundary

Per locked Module 2 Sections 2.7 and 2.8:

| Release | Behavior |
|---|---|
| **V1** | Module 7 **does not ship**. Planners use Module 1 order list + embedded TNA. Chase export from Module 3 deferral not available. No scheduled ERP export. Org Admin uses **Org Settings → Critical Path & TNA** directly (Section 2.6). |
| **V1.1 (this module)** | Reporting workspace, standard catalog, ad-hoc export, administration hub, ERP KPI snapshot job. |
| **Future (Section 7.8)** | Custom report builder, trend warehouse, buyer-facing portals, full user admin. |

### Relationship to locked modules

| Module | Relationship |
|---|---|
| **Module 1** | Primary read source — Order KPI cache, Timeline, Quick Notes count, documents metadata |
| **Module 2** | Reads TNA projections for gate-level reports; **never writes**; defers config to Section 2.6 |
| **Module 3** | Complementary — Module 3 operational; Module 7 link **“View report”** from dashboard (Section 3.8) |
| **Module 4** | Material exposure reports via Module 4 read API |
| **Module 5** | Line utilization reports via `GET /capacity/lines` |
| **Module 6** | Shipment performance via `GET /shipments/portfolio` |

### Primary users

| Role | Use |
|---|---|
| **Production Manager** | Weekly/monthly performance reports; factory comparisons |
| **Operations Director / GM** | Executive roll-ups — risk, EXF, delivery |
| **Org Admin** | Administration hub; export schedules; published report defaults |
| **Finance / ERP integration (service account)** | Scheduled KPI snapshot consumer — scoped read + export pickup |

### Authorization

| Rule | Detail |
|---|---|
| **Tenant isolation** | All queries scoped by auth `organizationId` |
| **Factory-level access** | Same visibility rules as Modules 1 and 3 — reports never leak cross-factory data |
| **Write path** | Module 7 writes **only** its own entities (`ReportRun`, `ExportJob`, `ExportArtifact`, settings) — no Order/TNA mutations |
| **Service accounts** | **`reporting:export`** — generate artifacts; **`reporting:pickup`** — list/download ERP artifacts only (Section 7.6) |
| **Administration hub** | Org Admin only — links to module settings screens owned by each module |

### Role matrix (P1-10)

| Action | Org Admin | Production Manager | Planner |
|---|---|---|---|
| Run ad-hoc report | ✅ | ✅ | ❌ |
| Export CSV / XLSX / JSON | ✅ | ✅ | ❌ |
| Schedule ERP KPI snapshot | ✅ | ❌ | ❌ |
| Edit `OrganizationReportingSettings` | ✅ | ❌ | ❌ |
| Hide report definitions | ✅ | ❌ | ❌ |
| Administration hub | ✅ | ❌ | ❌ |
| Download own report artifacts | ✅ | ✅ | ❌ |
| ERP artifact pickup (`reporting:pickup`) | Service account only | — | — |

---

## Locked: Section 7.2 — Ownership & Single Source of Truth

### Ownership matrix

| Concern | Owner | Module 7 role |
|---|---|---|
| Order KPI cache (CP Progress, Risk, Days to EXF, summary status) | **Module 2 engine → Module 1 cache** | Read only — display `calculatedAt` + `businessRuleVersion` on every report |
| `RiskSignal` rows | **Module 2 engine** | Read only — **detail export** joins; counts use KPI cache (P1-2) |
| `TNAItemDateRevision` | **Module 2** | SSOT for `GATE_SLIPPAGE` aggregates (P1-1) |
| `TimelineEvent` | **Module 1 store** | Read only — `PLANNER_ACTIVITY`; drill-down to Timeline, not revision SSOT |
| TNA gate-level fields | **Module 2 `TNAItem`** | Read via report queries — not SSOT copy |
| Material PO / receipt aggregates | **Module 4** | Read via Module 4 read API |
| Line utilization | **Module 5 engine** | Read via Module 5 read API |
| Shipment logistics status | **Module 6 `ShipmentRecord`** | Read via Module 6 read API |
| Report definitions & runs | **Module 7 `ReportDefinition` / `ReportRun`** | SSOT for catalog and execution audit |
| Export jobs & ERP snapshots | **Module 7 `ExportJob`** | SSOT for scheduled output artifacts |
| Org TNA configuration | **Module 2 Section 2.6** | **Link only** — not duplicated |
| Modules 4–6 org settings | **Respective modules** | **Link only** — administration hub navigation |

**Core rule:** Module 7 never maintains a **parallel KPI or gate state store**. Report rows are **projections** at query time or **immutable snapshots** at export time — always tagged with source `calculatedAt` and `businessRuleVersion` from underlying orders.

### Module 3 boundary — operational vs analytical

| Dimension | Module 3 (Planner Dashboard) | Module 7 (this module) |
|---|---|---|
| **Purpose** | What requires action **today** | How did we perform **over a period** |
| **Time horizon** | Today, this week, since yesterday | Custom date ranges, months, seasons |
| **Presentation** | Widget queues, counts, deep-links | Tables, charts, export files, executive summaries |
| **Refresh** | Live query on open | On-demand run + scheduled batch |
| **Mutation** | Navigates to edit surfaces | **Read-only** — no TNA saves |

Module 7 **does not** replicate Module 3 widget inclusion logic (Morning Queue, Widget 6, etc.).

### Administration hub scope

Module 7 Administration is a **navigation aggregate** — not a new configuration SSOT:

| Hub section | Target | Owner |
|---|---|---|
| **Orders & Styles** | Size scales, production stage weights, order defaults | Module 1 (Section 1 locked) |
| Critical Path & TNA | Org Settings → Section 2.6 screens | Module 2 |
| Material Planning | `OrganizationMaterialSettings` | Module 4 Section 4.3 |
| Capacity Planning | `OrganizationCapacitySettings` | Module 5 Section 5.3 |
| Shipment & Logistics | `OrganizationShipmentSettings` | Module 6 Section 6.3 |
| Reporting | `OrganizationReportingSettings` | Module 7 Section 7.3 |
| Users & roles (summary) | Read-only role assignment view | Future — V1.1 shows current user profile + role badge only |

**Rule:** Changing TNA templates, gate library, or engine defaults **always** occurs on Module 2 admin screens — never on Module 7 report screens.

### Architectural principles

| # | Principle |
|---|---|
| 1 | **Derived data is read-only** — KPI cache and RiskSignal are engine outputs; Module 7 displays, never recomputes |
| 2 | **Provenance on every row** — reports expose `calculatedAt`, `businessRuleVersion`, and report run timestamp |
| 3 | **Same visibility as source modules** — factory-scoped users see factory-scoped reports only |
| 4 | **No operational duplication** — leadership uses Module 7; planners use Module 3 for daily work |
| 5 | **Export ≠ source of truth** — ERP snapshots are point-in-time; live planning remains Modules 1–2 |
| 6 | **Timezone authority** — date-range filters use `OrganizationTnaSettings.factoryTimezone` |
| 7 | **PII minimization on all exports** — when `piiRedactionOnExport` = true, applies to CSV, XLSX, and ERP JSON (P1-3) |
| 8 | **Administration links, not forks** — one settings SSOT per module |

### Logical architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│        Module 7 — Reporting, Analytics & Administration (UI)             │
│  Report Catalog · Ad-hoc Builder · Export Center · Admin Hub             │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ read-only queries · export writes
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│           Module 7 Service Layer (report engine, export scheduler)       │
└───────┬──────────┬──────────┬──────────┬──────────┬────────────────────┘
        │          │          │          │          │
        ▼          ▼          ▼          ▼          ▼
   Module 1   Module 2   Module 4   Module 5   Module 6
   KPI cache  TNA read   read API   read API   read API
   Timeline
        │
        ▼
   Module 7 store — ReportRun · ExportJob · OrganizationReportingSettings
```

---

## Locked: Section 7.3 — Data Model

### OrganizationReportingSettings

Org-level Module 7 configuration — separate from `OrganizationTnaSettings` (Section 2.6) and Modules 4–6 settings.

| Field | Default | Purpose |
|---|---|---|
| `defaultExportFormat` | CSV | CSV · XLSX |
| `defaultDateRangeDays` | 30 | Ad-hoc report window |
| `erpExportEnabled` | false | Enable scheduled KPI snapshot job |
| `erpExportSchedule` | weekly | Cron expression — Org Admin |
| `piiRedactionOnExport` | true | Strip owner/chase PII on **all** export formats — CSV, XLSX, ERP JSON (P1-3) |
| `maxOrdersPerReportRun` | 5000 | Pagination cap — cursor for larger portfolios (P0-3) |
| `module7Enabled` | true | Org-wide feature flag |

### Entity: ReportDefinition

Catalog entry for a standard report — seeded at tenant provisioning; Org Admin may hide, not delete system reports in V1.1.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | UUID | Yes | Primary key |
| `organizationId` | UUID | Yes | Tenant — cloned from platform seed |
| `reportCode` | String | Yes | Stable key — e.g. `EXF_PERFORMANCE`, `RISK_EXPOSURE` |
| `reportName` | String | Yes | Display name |
| `category` | Enum | Yes | Performance · Risk · Materials · Capacity · Shipment · Activity |
| `description` | Text | No | Planner-native explanation |
| `sourceModules` | JSON | Yes | `[1,2]` etc. — provenance |
| `isHidden` | Boolean | Yes | Org Admin toggle |
| `createdAt` | Timestamp | Yes | Audit |

### Entity: ReportRun

Immutable record of each report execution — audit and re-download.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | UUID | Yes | Primary key |
| `organizationId` | UUID | Yes | Tenant boundary |
| `reportDefinitionId` | UUID | Yes | FK |
| `runByUserId` | UUID | Yes | Actor |
| `parameters` | JSON | Yes | `{ dateFrom, dateTo, factoryIds[], orderTypes[] }` |
| `rowCount` | Integer | Yes | Result size |
| `snapshotStorageKey` | String | No | Object store key for export file |
| `minCalculatedAt` / `maxCalculatedAt` | Timestamp | No | KPI freshness range in result set |
| `businessRuleVersion` | String | No | From underlying orders — dominant version in set |
| `startedAt` / `completedAt` | Timestamp | Yes | Execution window |
| `status` | Enum | Yes | Queued · Running · Complete · Failed |
| `reportRunStartedAt` | Timestamp | Yes | Point-in-time boundary for multi-source reads (P0-3) |

### Entity: ExportJob

Scheduled or manual ERP / file export batch.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | UUID | Yes | Primary key |
| `organizationId` | UUID | Yes | Tenant boundary |
| `jobType` | Enum | Yes | ErpKpiSnapshot · ManualExport · ScheduledReport |
| `schedule` | String | No | Cron when scheduled |
| `lastRunAt` | Timestamp | No | Last success |
| `nextRunAt` | Timestamp | No | Scheduler |
| `status` | Enum | Yes | Active · Paused · Failed |
| `createdByUserId` | UUID | Yes | Org Admin or service account |

### Entity: ExportArtifact

Output file from `ExportJob` or `ReportRun`.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | UUID | Yes | Primary key — also serves as **`sourceEventId`** for ERP idempotency |
| `organizationId` | UUID | Yes | Tenant boundary |
| `exportJobId` | UUID | No | FK when scheduled |
| `reportRunId` | UUID | No | FK when ad-hoc |
| `format` | Enum | Yes | CSV · XLSX · JSON |
| `storageKey` | String | Yes | Object store path |
| `sourceSystem` | String | Yes | `"factoryflow"` — ERP envelope (P0-4) |
| `sourceEventId` | UUID | Yes | = `ExportArtifact.id` — idempotent pickup (Section 2.8) |
| `recordCount` | Integer | Yes | Rows exported |
| `createdAt` | Timestamp | Yes | Immutable |
| `expiresAt` | Timestamp | No | Retention policy |

### Data model notes

| Rule | Detail |
|---|---|
| No KPI duplicate store | Snapshots are exports — not a second KPI cache |
| Template version on export | Include `tnaTemplateVersionId` per order row when gate-level detail exported (Section 2.8) |
| ERP readiness | JSON `exportSchemaVersion: "7.1"`; per-order `businessRuleVersion` + `calculatedAt`; `ErpIntegrationMapping` for plant keys (Section 2.8) |
| Report run consistency | Multi-source reads use single `reportRunStartedAt`; eventual consistency documented in footer if sources span time (P0-3) |

---

## Locked: Section 7.4 — User Workflows (R7.1–R7.4)

### Workflow R7.1 — Run ad-hoc report

**Trigger:** Production Manager weekly review or executive request.

**Steps:**

1. Open **Report Catalog** — filter by category
2. Select report (e.g. Ex-Factory Performance)
3. Set parameters — date range, factory, order type (`factoryTimezone` boundaries)
4. **Run** — `POST /reporting/runs` creates `ReportRun` with `status=Queued`; worker sets `reportRunStartedAt` and reads source APIs **sequentially** (P0-3) — **does not** invoke Module 2 engine
5. Poll `GET /reporting/runs/{id}` — preview when `status=Complete`; each row shows order PO ref, KPI fields, `calculatedAt`, run footer with `reportRunStartedAt`
6. Optional **Export** → CSV/XLSX → signed download URL on `ExportArtifact` (P1-6); **PII redacted** on all formats when configured (P1-3)
7. Drill-down row → Order Command Center (same deep-link pattern as Module 3)

**Rules:**

| Rule | Detail |
|---|---|
| Pagination | Max `maxOrdersPerReportRun` (default 5,000) per run — cursor for larger portfolios (P0-3) |
| Failed run | `status=Failed` — **no** partial `ExportArtifact` exposed |
| Consistency | Multi-source reads anchored to single `reportRunStartedAt`; footer warns if per-row `calculatedAt` spread exceeds threshold |

### Workflow R7.2 — Schedule ERP KPI snapshot

**Trigger:** Org Admin enables ERP integration (Section 2.8).

**Steps:**

1. Administration hub → **Reporting settings**
2. Enable `erpExportEnabled`; set schedule
3. Service account **`reporting:export`** runs job on cron
4. Job reads Order KPI cache per factory at job start — risk counts from KPI cache only; active **`RiskSignal`** joined for optional detail rows in export (P1-2) — **PII redacted** on all formats when configured (P1-3)
5. Writes `ExportArtifact` (JSON) with envelope: `exportSchemaVersion`, `sourceSystem`, `sourceEventId` (= artifact id), `generatedAt`, `factories[]` with `externalPlantReference` from **`ErpIntegrationMapping`** (P0-4)
6. ERP connector with role **`reporting:pickup`** lists artifacts via `GET /reporting/exports` and downloads via signed URL (P1-6) — idempotent on `sourceSystem` + `sourceEventId` (Section 2.8)

**Rule:** Snapshot reflects KPI cache at job start — not live recomputation. Per-order `businessRuleVersion` + `calculatedAt` on each order row — no ambiguous root-level rule version (P0-4).

### Workflow R7.3 — Administration hub navigation

**Trigger:** Org Admin configures workspace.

**Steps:**

1. Open **Administration hub**
2. Select module section — deep-link to owning settings screen:
   - **Orders & Styles** → Module 1 org settings (size scales, production stage weights) (P1-11)
   - Critical Path & TNA → Section 2.6 (Module 2)
   - Material → Section 4.3 settings
   - Capacity → Section 5.3 settings
   - Shipment → Section 6.3 settings
   - Reporting → Section 7.3 settings
3. Changes persist on **owner module** — Module 7 records navigation audit only

**Rule:** Module 7 hub does **not** PATCH Module 2 TNA settings inline.

### Workflow R7.4 — Module 3 “View report” handoff

**Trigger:** Production Manager on Planner Dashboard (Section 3.8).

**Steps:**

1. From Module 3 saved view or widget context, click **View report**
2. Module 7 opens with parameters pre-filled from dashboard context (P1-5)
3. User runs or exports — returns to Module 3 via breadcrumb

Module 7 **does not** embed Module 3 widgets — handoff only.

**Handoff parameter contract (P1-5):**

| Module 3 source | Pre-filled parameters | Target report |
|---|---|---|
| Widget 6 / Shipping This Week saved view | `reportCode=EXF_PERFORMANCE`, `dateFrom`, `dateTo`, `factoryIds[]` | Ex-Factory Performance |
| At Risk Orders widget / saved view | `reportCode=RISK_EXPOSURE`, `riskLevelMin=Medium`, `factoryIds[]` | Risk Exposure |
| Material Blockers / PO tracker context | `reportCode=MATERIAL_EXPOSURE`, `factoryIds[]` | Material Exposure |
| Line Load widget (Section 3.8) | `reportCode=LINE_UTILIZATION`, `factoryIds[]` | Line Utilization |
| Post-EXF tracker (Section 3.8) | `reportCode=SHIPMENT_PERFORMANCE`, `factoryIds[]` | Shipment Performance |

Module 7 **validates** handoff keys — rejects unknown `reportCode` or unsupported parameter combinations with user-visible error.

---

## Locked: Section 7.5 — Reporting & Analytics Engine

### Purpose

The reporting engine is Module 7's **read-side query orchestrator** — it composes projections from Module 1–6 APIs into report result sets. It does **not** run Business Rule Engine or Risk Engine.

### Report types (P0-2)

| Type | V1.1 behavior |
|---|---|
| **Portfolio KPI** | Reads Order KPI cache via `GET /orders` — date filter scopes **order inclusion** (e.g. EXF Actual in range) |
| **Event / history** | Reads append-only stores — `TNAItemDateRevision`, Timeline events — filtered by event date in range |
| **Current snapshot** | Reads module point-in-time read APIs — capacity lines, shipment portfolio — **not** historical trend series |

True week-over-week utilization or delivery SLA trends → Section 7.8 trend warehouse.

### Standard report catalog (V1.1)

| Report code | Type | Primary sources | Key metrics |
|---|---|---|---|
| `EXF_PERFORMANCE` | Portfolio KPI + gate read | `GET /orders` + `GET /reporting/exf-projections` | On-time EXF %, avg days slip — see metric definition below (P1-7) |
| `RISK_EXPOSURE` | Portfolio KPI | `GET /orders` (KPI cache) | Orders by `riskLevel`; top `riskReasons[]` — **`RiskSignal` detail export only** (P1-2) |
| `CP_PROGRESS_SUMMARY` | Portfolio KPI | `GET /orders` | CP Progress distribution by factory / order type |
| `GATE_SLIPPAGE` | Event / history | `GET /reporting/tna-revisions` (`TNAItemDateRevision` SSOT) (P1-1) | Revision count by Revision Reason code; Timeline for drill-down only |
| `MATERIAL_EXPOSURE` | Current snapshot | `GET /material/po-lines` | Open PO qty/value, overdue ETAs |
| `LINE_UTILIZATION` | Current snapshot | `GET /capacity/lines` | **Current** peak utilization by line — not historical weekly series (P0-2) |
| `SHIPMENT_PERFORMANCE` | Current snapshot | `GET /shipments/portfolio` | Active in-transit / overdue ETA counts — **not** historical delivery trend (P0-2) |
| `PLANNER_ACTIVITY` | Event / history | `GET /reporting/timeline-activity` | Saves, chases, completions by user/week |

### `EXF_PERFORMANCE` metric definition (P1-7)

| Metric | Definition |
|---|---|
| **On-time EXF %** | `EXF.actualDate ≤ EXF.currentPlannedDate` (calendar days in org `factoryTimezone`) |
| **Denominator** | Orders with EXF `isComplete=true` and `actualDate` ∈ `[dateFrom, dateTo]` |
| **Avg days slip** | Mean of `(actualDate − currentPlannedDate)` in days for denominator set; negative = early |
| **Numerator (on-time)** | Subset where slip ≤ 0 |
| **Defaults** | Exclude Cancelled / Closed; Sample orders included unless filter excludes order type |

Gate dates sourced from Module 2 read projection — Module 7 **never** recomputes EXF completion.

### `GATE_SLIPPAGE` data source (P1-1)

| Source | Role |
|---|---|
| **`TNAItemDateRevision`** | **SSOT** for aggregation — structured Revision Reason codes |
| **`TimelineEvent` (`PLANNED_DATE_REVISED`)** | Drill-down / audit only — not primary count source |
| **Initial Setup revisions** | Included in counts; filterable via parameter |

### `RISK_EXPOSURE` data source (P1-2)

| Use | Source |
|---|---|
| Portfolio counts, roll-ups, ERP snapshot rows | Order KPI cache — `riskLevel`, `riskReasons[]` |
| Detail export columns (signal id, catalog code, severity) | Active **`RiskSignal`** join — optional toggle |
| Risk rule evaluation | **Never** — Module 2 engine only |

### Query rules

| Rule | Detail |
|---|---|
| **No engine invocation** | Reports never POST TNA saves or trigger Standard Engine Execution |
| **Async execution** | `POST /reporting/runs` → worker; UI polls until Complete / Failed (P0-3) |
| **Pagination** | Max `maxOrdersPerReportRun` rows; cursor token for continuation |
| **Stale KPI visibility** | Show `calculatedAt` per row; flag rows where cache age > org threshold (default 24h) advisory |
| **Run consistency** | Single `reportRunStartedAt` for all sources; footer documents eventual consistency if source reads span time (P0-3) |
| **Deterministic filters** | Same parameters + same underlying data → same result set |
| **Factory scope** | Auto-apply user's authorized factories — no override in V1.1 |
| **Cancelled / Closed** | Include/exclude toggle — default exclude |
| **PII redaction** | When `piiRedactionOnExport` = true, applies to **CSV, XLSX, and ERP JSON** — omit owner names, chase notes, Quick Note text, revision "Other" free text (P1-3) |

### ERP KPI snapshot schema (minimum)

```json
{
  "exportSchemaVersion": "7.1",
  "sourceSystem": "factoryflow",
  "sourceEventId": "<exportArtifactId>",
  "organizationId": "...",
  "generatedAt": "ISO-8601",
  "factories": [{
    "factoryId": "...",
    "externalPlantReference": "...",
    "orders": [{
      "orderId": "...",
      "externalReference": "...",
      "summaryStatus": "...",
      "cpProgress": 0,
      "riskLevel": "...",
      "daysToExFactory": 0,
      "calculatedAt": "ISO-8601",
      "businessRuleVersion": "2.3",
      "tnaTemplateVersionId": "..."
    }]
  }]
}
```

**ERP mapping:** `externalPlantReference` resolved via **`ErpIntegrationMapping`** (Section 2.8). Per-order `businessRuleVersion` + `calculatedAt` required — no single root rule version (P0-4).

**PII:** When `piiRedactionOnExport` = true, omit owner names, chase notes, and Quick Note text on **all** export formats (P1-3).

**Idempotency:** ERP pickup deduplicates on `sourceSystem` + `sourceEventId` (= `ExportArtifact.id`) — aligned with Section 2.7 / 2.8 inbound pattern (P0-4).

**Note:** SAP goods issue / ex-factory posting aligns with TNA **EXF** gate (Module 2) — Module 6 **Delivered** status is logistics-only; do not assume duplicate ERP posting from shipment reports.

### Engine versioning

| Field | Value |
|---|---|
| `reportEngineVersion` | `"7.5"` — API metadata |
| Invalidation | N/A — live read at run time; export snapshots immutable once written |

---

## Locked: Section 7.6 — Integration with Modules 1–6

### Module 1 — Order Command Center

| Integration | Direction | Detail |
|---|---|---|
| KPI cache read | Module 7 → Module 1 | CP Progress, Risk, Days to EXF, summary status, `calculatedAt` |
| Timeline read | Module 7 → Module 1 | Activity reports — append-only events |
| Drill-down | Module 7 → Module 1 | Row → Order Command Center |
| Order mutation | None | Module 7 never PATCHes orders |

### Module 2 — Critical Path & Milestones

| Integration | Direction | Detail |
|---|---|---|
| Gate-level / revision reports | Module 7 → Module 2 read | `GET /reporting/tna-revisions`, `GET /reporting/exf-projections` — read-only, paginated (P0-1) |
| Engine / TNA write | None | No TNA saves from Module 7 |
| Org config | Link → Section 2.6 | Administration hub only |

### Module 3 — Planner Dashboard

| Integration | Direction | Detail |
|---|---|---|
| View report handoff | Module 3 → Module 7 | Pre-filled parameters per R7.4 contract (Section 3.8) (P1-5) |
| Widget duplication | None | Module 7 does not embed widgets |

### Module 4 — Material Planning

| Integration | Direction | Detail |
|---|---|---|
| Material Exposure report | Module 7 → Module 4 | `GET /material/po-lines` — same projection as Module 3 PO tracker (Section 4.6) |

### Module 5 — Capacity Planning

| Integration | Direction | Detail |
|---|---|---|
| Line Utilization report | Module 7 → Module 5 | `GET /capacity/lines` — current snapshot only (P0-2) |

### Module 6 — Shipment & Ex-Factory Tracking

| Integration | Direction | Detail |
|---|---|---|
| Shipment Performance report | Module 7 → Module 6 | `GET /shipments/portfolio` — active records snapshot (P0-2) |

### Cross-module read contract (P0-1)

Module 7 consumes **read-only** APIs — no parallel query paths. Endpoints owned by source modules; contract documented here for implementation alignment.

| Source | Endpoint | Report codes | Pagination / notes |
|---|---|---|---|
| **Module 1** | `GET /orders` | `EXF_PERFORMANCE`, `RISK_EXPOSURE`, `CP_PROGRESS_SUMMARY` | Factory-scoped; KPI cache fields; cursor — same contract as Module 3 Section 3.7 |
| **Module 1** | `GET /reporting/timeline-activity` | `PLANNER_ACTIVITY` | Cross-order Timeline read; date + factory filter; cursor |
| **Module 2** | `GET /reporting/tna-revisions` | `GATE_SLIPPAGE` | `TNAItemDateRevision` rows; reason code aggregates (P1-1) |
| **Module 2** | `GET /reporting/exf-projections` | `EXF_PERFORMANCE` | Batch EXF Actual / Current Planned / Original Planned per order |
| **Module 4** | `GET /material/po-lines` | `MATERIAL_EXPOSURE` | Open lines, overdue ETA — Section 4.6 / Module 3 widget contract |
| **Module 5** | `GET /capacity/lines` | `LINE_UTILIZATION` | Current horizon snapshot — Module 5.6 |
| **Module 6** | `GET /shipments/portfolio` | `SHIPMENT_PERFORMANCE` | Active records — Module 6.6 |

**Rule:** Module 7 never N× per-order TNA reads without pagination — batch endpoints required for gate-level portfolio reports.

### Module 7 read API (V1.1)

| Endpoint | Consumer | Projection |
|---|---|---|
| `GET /reporting/bootstrap` | Module 7 UI | Settings, catalog, timezone |
| `GET /reporting/definitions` | Module 7 UI | Report catalog |
| `POST /reporting/runs` | Module 7 UI | Enqueue report → `ReportRun` (`Queued`) (P0-3) |
| `GET /reporting/runs/{id}` | Module 7 UI | Status, preview rows, pagination cursor, download link when Complete |
| `GET /reporting/runs/{id}/download` | Authorized user | Time-limited signed URL for artifact (P1-6) |
| `GET /reporting/exports` | **`reporting:pickup`** service account | Scheduled ERP artifact list — org-scoped (P1-6) |
| `GET /reporting/exports/{id}/download` | **`reporting:pickup`** | Signed URL — read-only pickup; no KPI re-read (P1-6) |

### Export download security (P1-6)

| Rule | Detail |
|---|---|
| Signed URLs | Time-limited; scoped to `organizationId` + caller factory visibility |
| **`reporting:export`** | Generate artifacts; write `ExportArtifact` metadata |
| **`reporting:pickup`** | List + download ERP artifacts only — cannot enqueue runs or mutate settings |
| Failed runs | `ReportRun.status=Failed` — no download URL issued |
| Tenant isolation | `GET /reporting/exports` binds service account to single org |

### Relationship to locked sections

| Section | Relationship |
|---|---|
| **2.3** | Business rules version on export — engine outputs referenced, not rerun |
| **2.6** | TNA admin SSOT — hub link only |
| **2.7** | Reporting read contract; KPI cache consumer; ERP export deferral fulfilled |
| **2.8** | Module 7 V1.1 runtime; PII minimization; ERP snapshot |
| **3.8** | View report link dependency |
| **4.6–4.7** | Material read API for reports |
| **5.6** | Capacity read API for reports |
| **6.6** | Shipment read API for reports |

---

## Locked: Section 7.7 — V1 Limitations & V1.1 Deliverables

### V1 behavior (Module 7 not built)

| Capability | V1 behavior | Reference |
|---|---|---|
| Analytical reports | Not available | Section 2.8, Module 3.1 |
| ERP KPI snapshot | Not available | Section 2.8 |
| Administration hub | Direct Section 2.6 navigation only | Section 2.6 |
| Module 3 View report | Not available | Section 3.8 |

### V1.1 deliverables (this module)

| Deliverable | Included |
|---|---|
| Report Catalog (8 standard reports) | Yes — snapshot vs history types explicit (P0-2) |
| Async ad-hoc run + CSV/XLSX export | Yes — worker + pagination (P0-3) |
| `ReportRun` + `ExportArtifact` audit | Yes |
| Cross-module read contract table | Yes — Section 7.6 (P0-1) |
| `OrganizationReportingSettings` | Yes |
| Administration hub (links to Modules **1**, 2, 4, 5, 6 settings) | Yes (P1-11) |
| ERP KPI snapshot job + JSON schema | Yes — `sourceSystem` + `sourceEventId` envelope (P0-4) |
| Service roles **`reporting:export`** + **`reporting:pickup`** | Yes (P1-6) |
| Signed download URLs | Yes (P1-6) |
| Module 3 **View report** handoff parameter contract | Yes (P1-5) |
| Role matrix (Reporting vs Admin) | Yes (P1-10) |
| `GET /reporting/bootstrap` + read API | Yes |
| EXF / GATE_SLIPPAGE / RISK metric SSOT definitions | Yes (P1-1, P1-2, P1-7) |
| PII redaction on all export formats | Yes (P1-3) |
| Custom report builder | No — Section 7.8 |
| Trend warehouse / historical KPI store | No — live read + export snapshots only |
| Full user/role admin | No — profile summary only |
| Embedded charts in Module 3 | No — Module 7 owns charts |

### What Module 7 does not unlock in V1.1

| Capability | Target | Notes |
|---|---|---|
| Buyer portal / external dashboards | Future | Out of MVP |
| Real-time streaming analytics | Future | Batch/on-demand only |
| Gate library editing | Module 2 Section 2.6 | Hub link only |

---

## Locked: Section 7.8 — Future Architecture

### Planned extensions

| Capability | Description | Dependency |
|---|---|---|
| **Custom report builder** | Org-defined columns and filters | ReportDefinition v2 |
| **Trend warehouse** | Nightly KPI history snapshots for YoY charts | Data platform |
| **Full user & role admin** | Invite, role assign, factory scope | IAM service |
| **Buyer-facing status portal** | Read-only subset of shipment + EXF reports | Module 6 + auth |
| **Warehouse / BI connector** | Snowflake, BigQuery sync from ExportArtifact | Integration |
| **Presentation / board packs** | PDF board pack generation | Report engine v2 |

### Explicit non-goals (remain out of scope)

- Replacement of Tableau, Power BI, or SAP embedded analytics
- Operational planner queues (Module 3)
- TNA or gate configuration (Module 2 Section 2.6)
- Re-running Business Rule Engine for “what-if” reports

### Relationship to locked modules (future)

| Module | Future relationship |
|---|---|
| **Module 1** | Optional historical KPI snapshot table fed by export job |
| **Module 2** | Gate analytics may add revision trend joins |
| **Module 3** | Additional handoffs — capacity report from Line Load widget |
| **ERP** | Bidirectional — snapshot outbound + confirmation inbound |
