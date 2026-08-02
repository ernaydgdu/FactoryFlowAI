# Sprint Metrics Report — Sprint 6A

**Generated:** 2026-08-02  
**Scope:** Kepler ERP / FactoryFlowAI frontend + domain

---

## Metrik Özeti

| Metrik | Sprint 6A (Güncel) | Sprint 5c (Önceki) | Δ |
|--------|-------------------|-------------------|---|
| Toplam TypeScript dosya sayısı | **530** | ~498 | +32 |
| Toplam Domain Service sayısı | **55** | 55 | 0 |
| Toplam Repository Port sayısı | **37** | 31 | +6 |
| Toplam Application Service sayısı | **23** | 23 | 0 |
| Toplam React Route sayısı | **70** | 70 | 0 |
| Toplam Business Rule sayısı | **14** | 14 | 0 |
| Toplam Brain Adapter sayısı | **17** | 17 | 0 |
| Toplam Master Data Entity sayısı | **37** | 37 | 0 |
| Toplam Test / Validation senaryosu | **10** | 10 | 0 |

*TypeScript dosya sayısı: `frontend/` altında `node_modules` ve `dist` hariç `.ts` / `.tsx` dosyaları.*

---

## Metrik Detayları

### TypeScript Dosyaları — 530
- `frontend/src/`: 529 kaynak dosya
- Sprint 6A delta: +32 dosya (6 port, 7 InMemory adapter, seed bootstrap, port-access bridge, raporlar)

### Domain Services — 55
`*-service.ts` pattern, `frontend/src/domain/` altında:
- Platform: 9
- Master Data + Enterprise: 12
- Execution Platform: 10
- Production Order: 1
- Textile / Stock / Planning: 14
- Localization: 7
- Enterprise relations: 2

### Repository Ports — 37
Sprint 5b/5c: 31 port → Sprint 6A: +6 yeni port:
1. `IMasterDataLookupRepository<T>` (base)
2. `IMasterDataLookupRegistryPort` (37 entity)
3. `IMasterDataEnterpriseConfigPort`
4. `IMasterDataApprovalRepository`
5. `IMasterDataChangeStreamRepository`
6. `IMasterDataBrainChangeStreamRepository`

### Application Services — 23
`*application-service.ts` pattern, `frontend/src/application/` altında — değişiklik yok.

### React Routes — 70
`scripts/validate-routes.mjs` → **70 PASS / 0 FAIL**

### Business Rules — 14
`BUSINESS_RULES` kataloğu (`business-rule-engine.ts`): BR-01 … BR-14

### Brain Adapters — 17
`BRAIN_KNOWLEDGE_ADAPTERS` registry (`brain/adapters/index.ts`)

### Master Data Entities — 37
`ALL_MASTER_DATA_REPOSITORIES` registry keys

### Test / Validation Senaryoları — 10
`runAllTextileValidations()` → `validateScenario1()` … `validateScenario10()`

---

## Technical Debt Trend

### Sprint 5c → Sprint 6A Karşılaştırması

| Kategori | Sprint 5c | Sprint 6A | Trend |
|----------|-----------|---------|-------|
| Açık borç kalemi sayısı | 6 | 6 | → (aynı sayı, farklı kompozisyon) |
| P1 (kritik) borç | 1 (`calendarStore`) | 0 | ↓ İyileşti |
| P2 borç | 2 | 2 | → |
| P3 borç | 3 | 4 | ↑ Hafif artış |
| Master Data persistence gap | ❌ Açık | ✅ Kapalı | ↓ |
| Empty stub adapters (MD) | ❌ 7 slot | ✅ Wired | ↓ |
| Module-level MD stores | ❌ 40+ | ✅ 0 | ↓ |
| PostgreSQL hazırlığı (MD) | ❌ NO | ✅ NO domain change | ↓ |

### Sprint 6A'da Kapatılan Borç
- 37 lookup repo → port-backed
- 7 master-data UoW empty stub → gerçek adapter
- 3 enterprise runtime store → stream/aggregate port
- Enterprise seed direct import → config port

### Sprint 6A'da Eklenen Borç (düşük öncelik)
- `createRepository()` hâlâ export (P2)
- Port-backed cache invalidation hook eksik (P2)
- Seed dosyaları domain klasöründe (P3)
- stockCard / fabricCard / accessoryCard empty stub (P3)

### Net Değerlendirme
**Borç seviyesi düştü.** P1 kalem kalktı, mimari borç (Master Data persistence) kapandı. Yeni kalemler düşük öncelikli ve bilinçli trade-off.

---

## Bu sprint teknik borcu artırdı mı?

## **NO**
