# Repository Coverage Report — Sprint 6A

**Generated:** 2026-08-02

---

## Master Data Port Coverage

| Category | Ports | InMemory Adapter | UoW Wired | Domain Uses Port |
|----------|-------|------------------|-----------|------------------|
| Lookup registry (37 entities) | ✅ | ✅ | ✅ | ✅ |
| Enterprise config | ✅ | ✅ | ✅ | ✅ |
| Master data changes | ✅ | ✅ | ✅ | ✅ |
| Master data approvals | ✅ | ✅ | ✅ | ✅ |
| Master data brain feed | ✅ | ✅ | ✅ | ✅ |
| Warehouse aggregate (P17) | ✅ (Sprint 5b) | ✅ delegate | ✅ | via lookup |
| Workshop aggregate | ✅ | ✅ delegate | ✅ | via lookup |
| ProductionLine aggregate | ✅ | ✅ delegate | ✅ | via lookup |
| Customer aggregate | ✅ | ✅ delegate | ✅ | via lookup |

**Coverage: 6/6 new ports + 4/4 aggregate delegates = 100%**

---

## Lookup Entity Registry (37/37)

| Key | Port Slot | Seeded |
|-----|-----------|--------|
| country | ✅ | ✅ |
| currency | ✅ | ✅ |
| customer | ✅ | ✅ |
| brand | ✅ | ✅ |
| buyer | ✅ | ✅ |
| merchandiser | ✅ | ✅ |
| supplier | ✅ | ✅ |
| warehouse | ✅ | ✅ |
| workshop | ✅ | ✅ |
| seasonType | ✅ | ✅ |
| season | ✅ | ✅ |
| collection | ✅ | ✅ |
| productGroup | ✅ | ✅ |
| subProductGroup | ✅ | ✅ |
| sizeSet | ✅ | ✅ |
| colorCard | ✅ | ✅ |
| fabricType | ✅ | ✅ |
| fabricComposition | ✅ | ✅ |
| accessoryCategory | ✅ | ✅ |
| accessoryType | ✅ | ✅ |
| operation | ✅ | ✅ |
| productionLine | ✅ | ✅ |
| machineType | ✅ | ✅ |
| machine | ✅ | ✅ |
| qualityCode | ✅ | ✅ |
| warehouseType | ✅ | ✅ |
| unit | ✅ | ✅ |
| gender | ✅ | ✅ |
| ageGroup | ✅ | ✅ |
| fit | ✅ | ✅ |
| washType | ✅ | ✅ |
| printType | ✅ | ✅ |
| embroideryType | ✅ | ✅ |
| gtipCode | ✅ | ✅ |
| employee | ✅ | ✅ |
| transportCompany | ✅ | ✅ |
| forwarder | ✅ | ✅ |
| containerType | ✅ | ✅ |
| incoterm | ✅ | ✅ |
| paymentTerm | ✅ | ✅ |

---

## IUnitOfWork Additions (Sprint 6A)

```typescript
masterDataLookups: IMasterDataLookupRegistryPort
masterDataEnterpriseConfig: IMasterDataEnterpriseConfigPort
masterDataChanges: IMasterDataChangeStreamRepository
masterDataApprovals: IMasterDataApprovalRepository
masterDataBrainChanges: IMasterDataBrainChangeStreamRepository
```

Total UoW properties: 31 (Sprint 5c) + 5 (Sprint 6A) = **36**
