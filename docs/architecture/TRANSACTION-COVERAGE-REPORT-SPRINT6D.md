# Transaction Coverage Report — Sprint 6D

**Sprint:** 6D — PostgreSQL Readiness Closure (PARTIAL items)  
**Generated:** 2026-08-02  
**Validation:** `npm run validate:persistence` — static + runtime **PASS**

---

## Executive Summary

| Area | Sprint 6C | Sprint 6D |
|------|-----------|-----------|
| Execution Platform commands | ✅ TX | ✅ TX |
| Production Order Lifecycle | ✅ TX | ✅ TX |
| Master Data enterprise commands | ❌ | ✅ TX |
| Platform BOM commands | ❌ | ✅ TX |
| Singleton repo snapshot | ❌ store only | ✅ full persistence snapshot |

---

## 1. Master Data Commands

All enterprise write paths use `runDomainCommandInTransaction()` (domain) and `runCommandInTransaction()` (application):

| Command | Domain | Application mapper |
|---------|--------|-------------------|
| `submitMasterDataForApproval` | `approval-service.ts` | `master-data-command.mapper.ts` |
| `approveMasterDataChange` | `approval-service.ts` | `master-data-command.mapper.ts` |
| `recordMasterDataCreate` | `audit-service.ts` | `master-data-command.mapper.ts` |
| `recordMasterDataUpdate` | `audit-service.ts` | `master-data-command.mapper.ts` |
| `setAttributeValue` | `attribute-service.ts` | `master-data-command.mapper.ts` |

**Port registration:** `registerCommandTransactionRunner(runInTransaction)` in `bootstrap.ts`.

---

## 2. Platform BOM Commands

| Command | Domain | Application mapper |
|---------|--------|-------------------|
| `platformSubmitBomApproval` | `platform-orchestrator.ts` | `platform-bom-command.mapper.ts` |
| `platformApproveBomStep` | `platform-orchestrator.ts` | `platform-bom-command.mapper.ts` |
| `platformActivateRevision` | `platform-orchestrator.ts` | `platform-bom-command.mapper.ts` |
| `platformCreateRevision` | `platform-orchestrator.ts` | `platform-bom-command.mapper.ts` |

---

## 3. Existing TX Coverage (unchanged)

| Path | Wrapper |
|------|---------|
| Execution commands | `runWithExecutionPermission` → `runCommandInTransaction` |
| Lifecycle create/transition/daily | `production-order-lifecycle.mapper.ts` |
| Dev demo init | `execution-demo.mapper.ts` |

---

## 4. Snapshot Scope

`persistence-snapshot.ts` captures on root `begin()`:

- `InMemoryStoreRegistry` (OLTP + streams)
- `masterDataLookupRegistryInMemory` (37 entities)
- `masterDataEnterpriseConfigInMemory`
- `masterDataApprovalInMemory`, change/brain streams
- `brainDecisionMemoryInMemory`, `productionCalendarInMemory`
- Platform collections: comments, tags, attachments, watchers, notifications, aiMemory, humanFeedback, enterpriseTimeline

---

## 5. Gaps

1. **Nested TX:** `approveMasterDataChangeInternal` → `recordMasterDataCreate` double-wraps TX (depth counter safe; cosmetic debt).
2. **MD lookup CRUD:** Read-only via `MasterDataRepository`; write path is enterprise approval/audit only — seed/bootstrap excluded by design.
3. **Query paths:** No TX (constitution-compliant).

---

## 6. Verdict

**Master Data + BOM command TX coverage: COMPLETE** for Sprint 6D scope.
