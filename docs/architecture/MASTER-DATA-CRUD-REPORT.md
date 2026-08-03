# Phase 1 Module 3 — Master Data CRUD Report

**Date:** 2026-08-03  
**Status:** COMPLETE  
**Build:** PASS

---

## Scope Delivered

| Entity | List | Create | Update | Deactivate | Reactivate | Route |
|--------|------|--------|--------|------------|------------|-------|
| Customer | ✅ | ✅ | ✅ | ✅ | ✅ | `/master-data/customers` |
| Supplier | ✅ | ✅ | ✅ | ✅ | ✅ | `/master-data/suppliers` |
| Warehouse | ✅ | ✅ | ✅ | ✅ | ✅ | `/master-data/warehouses` |
| Production Line | ✅ | ✅ | ✅ | ✅ | ✅ | `/master-data/production-lines` |
| Workshop | ✅ | ✅ | ✅ | ✅ | ✅ | `/master-data/workshops` |
| Brand | ✅ | ✅ | ✅ | ✅ | ✅ | `/master-data/brands` |
| Season | ✅ | ✅ | ✅ | ✅ | ✅ | `/master-data/seasons` |
| Collection | ✅ | ✅ | ✅ | ✅ | ✅ | `/master-data/collections` |
| Color Card | ✅ | ✅ | ✅ | ✅ | ✅ | `/master-data/color-cards` |
| Size Set | ✅ | ✅ | ✅ | ✅ | ✅ | `/master-data/size-sets` |

Hub: `/master-data`

---

## Architecture Flow

```
UI (MasterDataListPage)
  → useMasterData* hooks (React Query)
    → masterDataApplicationService
      → executeCreate/Update/Deactivate/Reactivate (runCommandInTransaction)
        → persist*MasterDataEntity (domain)
          → IMasterDataLookupRepository.save (UoW port)
          → appendMasterDataChangeRecord (audit)
          → scheduleMasterDataBrainChange (outbox)
          → invalidateMasterDataRepositoryCache
```

---

## Cross-Cutting Concerns

| Concern | Implementation |
|---------|----------------|
| Code uniqueness | `assertCodeUnique()` on create/update |
| Optimistic version | `expectedVersion` + `assertVersion()` |
| Audit | Platform audit log + MD change stream |
| Transaction | `runCommandInTransaction` |
| Outbox | `scheduleMasterDataBrainChange` → brain handler |
| Soft delete | Pasif Yap (`isActive: false`) — hard delete yok |

---

## Key Files

- Domain: `frontend/src/domain/master-data/master-data-crud.service.ts`
- Registry: `frontend/src/domain/master-data/master-data-crud.registry.ts`
- Application: `frontend/src/application/master-data/`
- UI: `frontend/src/modules/master-data/pages/`

---

## Navigation

- Footer: **Master Data** → `/master-data`
- IAM: `/master-data/*` → `platform.settings` permission
