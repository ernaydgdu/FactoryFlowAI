# ARCHITECTURE-INTEGRITY-REPORT.md — Phase 5 Module 3 (Barcode & Mobile)

| Check | Result |
|-------|--------|
| New persistence port / aggregate | **None** — offline queue is client localStorage; mutations use existing GR / ledger / declaration ports |
| Shop Floor / Quality aggregate schemas | **Unchanged** — declaration called via existing `persistProductionDeclaration` |
| Duplicate repositories | **None** |
| Layer direction | domain workflow → domain persist; application wraps `runCommandInTransaction` |
| Idempotency | GR `idempotencyKey`; ledger `referenceNo`; production `reasonCode=IDEM:…` |
| Audit + Timeline + Outbox | Inherited from `persistPostGoodsReceipt` / `saveLedgerMovement` / declaration event path |
| Bootstrap / seed | **Unchanged** |

**Drift verdict:** No constitutional drift. Barcode & Mobile is an additive scan/workflow façade over frozen write paths.
