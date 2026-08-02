# Technical Debt Report — Sprint 2

**Generated:** 2026-08-02

---

## Sprint 2 İçi Borç (Düşük)

| ID | Borç | Öncelik | Not |
|----|------|---------|-----|
| TD-POL-01 | In-memory lifecycle store | Orta | Production'da persistence layer gerekir |
| TD-POL-02 | Doküman / Yorum sekmeleri placeholder | Düşük | Platform document service entegrasyonu bekliyor |
| TD-POL-03 | Günlük giriş operatörü sabit (`operator-01`) | Düşük | Auth context'ten alınmalı |
| TD-POL-04 | Create sayfasında `navigate` sonrası cache invalidation | Düşük | React Query zaten invalidate ediyor — yeterli |
| TD-POL-05 | Legacy `/production/orders` ile çift UE listesi | Orta | Migration sonrası legacy route deprecate |

---

## Sprint Dışı Miras Borç (Değişmedi)

| ID | Borç | Etki |
|----|------|------|
| TD-LEG-01 | ~20 legacy sayfa doğrudan domain import | Application Layer %74 |
| TD-LEG-02 | `OrderDetailPage` domain coupling | Sipariş detay refactor |
| TD-LEG-03 | Production Planning vs Lifecycle günlük giriş ayrımı | İki `/daily-entry` route — farklı modüller |

---

## Bilinçli Kabul (Sprint Kararı)

| Karar | Gerekçe |
|-------|---------|
| Yeni domain modülü (`production-order/`) | Lifecycle orchestration mevcut engine'leri değiştirmeden gerekli |
| Seed from SALES_ORDERS | Demo verisi ile uyumlu başlangıç |
| Snapshot immutable | Sprint gereksinimi — sipariş değişse bile korunur |

---

## Önerilen Sonraki Adımlar

1. Lifecycle store → repository / API persistence
2. Legacy production pages → Application Layer migration
3. Doküman & yorum platform entegrasyonu
4. Auth-aware actor (`changedBy`) tüm geçişlerde

---

## Borç Skoru

| Kategori | Sprint 2 Sonrası |
|----------|------------------|
| Sprint modül borcu | **Düşük** |
| Genel ERP borcu | **Orta** (önceki sprint'ten) |
| Engine / mimari borcu | **Yok** |
