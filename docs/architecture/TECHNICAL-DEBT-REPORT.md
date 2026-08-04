# TECHNICAL-DEBT-REPORT.md — Roadmap follow-ups

## Packaging — CLOSED

| Item | Status |
|------|--------|
| Packaging & Packing List (P5 M4 + hardening) | **PRODUCTION READY (In-Memory Runtime)** |
| Do not reopen Packaging | Unless production defect |

## Roadmap technical debt (not Packaging defects)

| ID | Item | Target phase | Notes |
|----|------|--------------|-------|
| TD-PG-01 | PostgreSQL cutover for aggregates (incl. packingLists, shipments) | Sprint 7 — Persistence | Adapters exist / stub; live SQL + UoW factory wiring |
| TD-PRINT-01 | Print infrastructure (binary PDF + ZPL/label printers) | Print platform | Packing list / package label payloads already exist |
| TD-EDI-01 | ASN / EDI 856 (buyer ASN) | Commercial / EDI | Depends on Shipment + Packing List SSOT |
| TD-DOC-01 | Commercial Documents (Invoice, B/L, COO) | Phase 6 Export Docs | **Closed in-module** — see COMMERCIAL-DOCUMENTS-REPORT; PDF/EDI remain open |
| TD-DOC-PDF | Binary PDF commercial templates | Print platform | Linked to TD-PRINT-01 |

## Barcode / Mobile (prior)

| Item | Status |
|------|--------|
| GS1 binary Code128 glyph renderer | Open (low) — AI string sufficient |
| Service worker offline shell | Open (low) |

**Gate:** Packaging write paths are production-grade on in-memory runtime; roadmap items tracked above.
