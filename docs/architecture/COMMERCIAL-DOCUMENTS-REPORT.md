# COMMERCIAL-DOCUMENTS-REPORT.md — Phase 6 Module 2

**Updated:** 2026-08-04

## Status

**Implemented (In-Memory Runtime)** — Commercial Invoice + Export Document Set domain replaces stub/gap report.

---

## Architecture Decision Record (ADR)

**Decision:** `ExportDocumentSet` is the **persistence aggregate root**; `CommercialInvoice` is the **logical commercial AR** nested inside the set.

**Why:** Single transactional write path for invoice + COO + Inspection + B/L ref + Export Declaration + revisions/approvals; avoids duplicate repositories and split consistency. Meets Freeze: reuse Shipment/PackingList **queries** only; inventory writes untouched.

**PostgreSQL-ready:** `IExportDocumentSetRepository` + counters (`nextDocumentSetCounter`, `nextInvoiceCounter`); cutover tracked as `TD-PG-01`.

---

## Delivered

| Capability | Implementation |
|------------|----------------|
| Commercial Invoice | Nested entity; lines from PL matrix; amounts |
| Packing List Reference | Embedded snapshot from PackingList |
| COO / Inspection / B/L / Export Decl | Embedded entities; numbers stamped on Issue |
| Attachments / Revision / Approval | Embedded collections; revisions immutable |
| Lifecycle | Draft → UnderReview → Approved → Issued → Archived |
| TX / Audit / Timeline / Outbox / Idempotency | All mutations |
| IAM | `shipping.write` in command guard; actor from `useAuth` |
| Brain read model | `queryCommercialDocumentsBrainReadModel` |
| Twin | `EXPORT_DOCUMENT_SET` nodes |
| AI validation surface | Deterministic checks (no LLM mutate) |
| UI | Invoices, Sets, Detail (approval+revision), Issue Wizard |

## Business rules enforced

1. Create only from Shipment status Booked+ (Approved logistics)
2. Packing List must exist on shipment
3. Invoice qty = Packing List totals
4. Weight/CBM reconcile with Shipment totals
5. Only Approved → Issued; Issued read-only (Archive only)
6. Revisions preserve immutable `snapshotJson` history

---

## Technical Debt

| ID | Item | Notes |
|----|------|-------|
| TD-PG-01 | Postgres cutover | Shared with Sprint 7 |
| TD-PRINT-01 | Binary PDF templates | Payload/read models only |
| TD-EDI-01 | ASN/EDI submit | Placeholder doc link only |
| TD-DOC-PROFORMA | Proforma Invoice | Out of this module |

## Performance Review

- Dashboard/list: single cursor page (bounded by `PERSISTENCE_CURSOR_MAX_LIMIT`)
- Create: O(1) counters; PL/Shipment by id (no full scan)
- RQ invalidation scoped to `commercialDocuments.*` keys
- Twin: max 5 doc sets per order

## Security Review

- Write path: `assertCommercialDocumentsWritePermission` → `shipping.write`
- Route: `shipping.read`
- Actor from IAM session (no hardcoded pilot-user)
- Tenant via `DEFAULT_TENANT_ID` / UoW (multi-tenant ready metadata)

## AI Readiness Review

- Brain read model exposed
- Twin `EXPORT_DOCUMENT_SET` nodes linked Order→Docs←Shipment
- Outbox SO change events on transitions
- AI validation surface: deterministic `checks[]` (Brain may advise; domain decides)

## Tier-1 GAP Review (SAP/Oracle/Infor/D365)

| Capability | Status |
|------------|--------|
| Commercial Invoice lifecycle | ✅ |
| Export document bundle | ✅ |
| Qty/weight SSOT from PL/Shipment | ✅ |
| Revision / approval / issue lock | ✅ |
| Binary PDF / e-signature | ❌ roadmap print |
| EDI ASN submit | ❌ `TD-EDI-01` |
| Proforma / multi-currency FX engine | ❌ partial (currency field) |
| Customs filing integration | ❌ declaration stub only |

---

## Gates

`validate:commercial-documents` in build pipeline.

**Freeze:** Packaging & Shipment modules not rewritten.
