# Legacy Store Elimination Report — Sprint 6A

**Generated:** 2026-08-02

---

## Eliminated Module-Level Stores

### repositories.ts
- ~~`createRepository(COUNTRIES, ...)`~~ × 37 — replaced with port-backed facades
- ~~Direct imports from `mock-data.ts`~~ — removed
- ~~Direct imports from `textile-master-seed.ts`~~ — removed

### Enterprise Services
- ~~`changeStore[]`~~ in `enterprise/audit-service.ts`
- ~~`changeCounter`~~ — moved to adapter
- ~~`approvalStore[]`~~ in `enterprise/approval-service.ts`
- ~~`approvalCounter`~~ — moved to adapter
- ~~`brainChangeFeed[]`~~ in `enterprise/brain-change-feed.ts`

### Enterprise Seed Direct Access (domain services)
- ~~`MASTER_DATA_ATTRIBUTE_DEFINITIONS`~~ import in attribute-service
- ~~`FABRIC_TYPE_ATTRIBUTE_VALUES`~~ mutable push in attribute-service
- ~~`MASTER_DATA_VALIDATION_RULES`~~ in validation-rule-service
- ~~`MASTER_DATA_DEPENDENCIES`~~ in dependency-service
- ~~`MASTER_DATA_DEFAULT_PROFILES`~~ in default-resolver-service
- ~~`PRODUCT_TEMPLATES`~~ in template-service
- ~~`ENTERPRISE_*_GROUPS`~~ direct in hierarchy-service

---

## Centralized Storage

| Data | Location | Access |
|------|----------|--------|
| 37 lookup entities | `MasterDataLookupRegistryInMemory` | via `masterDataLookups` port |
| Enterprise config | `MasterDataEnterpriseConfigInMemory` | via `masterDataEnterpriseConfig` port |
| Change records | `MasterDataChangeStreamInMemoryRepository` | via `masterDataChanges` port |
| Approval requests | `MasterDataApprovalInMemoryRepository` | via `masterDataApprovals` port |
| Brain events | `MasterDataBrainChangeStreamInMemoryRepository` | via `masterDataBrainChanges` port |

Seed loading: `infrastructure/persistence/in-memory/master-data-seed.bootstrap.ts`

---

## Dual Access Path Check

| Check | Result |
|-------|--------|
| Domain services import `infrastructure/` | ❌ None |
| Services read seed array AND port | ❌ None |
| Module-level mutable stores in master-data/ | ❌ None |
| `createRepository(array)` in production path | ❌ None |

---

## Intentionally Retained

| Item | Location | Justification |
|------|----------|---------------|
| Seed constant files | `mock-data.ts`, `textile-master-seed.ts`, `enterprise-seed.ts` | Data definitions; loaded by infra bootstrap only |
| `createRepository()` factory | `repository.ts` | Exported for tests; not used in production path |
| Repository read cache | `createPortBackedRepository` closure | Performance; invalidates on mutation |

---

## Verification Command

```bash
rg "(Store\s*=|createRepository\([A-Z_]|from ['\"]\./enterprise-seed)" frontend/src/domain/master-data/
# Expected: 0 matches
```

Result: **0 matches** ✅
