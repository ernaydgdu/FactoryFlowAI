# Execution Platform — Technical Debt Report (Application Layer)

**Tarih:** 2026-08-02

---

## P0 — Yok

Application Layer sprint kapsamında bloklayıcı borç yok.

---

## P1 — Kısa Vadeli

| # | Borç | Etki | Öneri |
|---|------|------|-------|
| TD-A1 | `queryFullState` root facade'de domain'e doğrudan delegasyon | UI sprint'te mapper'a taşınmalı | Application mapper wrapper |
| TD-A2 | Dashboard brain summary doğrudan `execution-brain-query` | Brain modülü üzerinden tek giriş | `executionBrainApplicationService.query.getSummary()` |
| TD-A3 | Permission role UI'dan string geliyor | Auth entegrasyonu sonrası session context | Application actor context provider |

---

## P2 — Orta Vadeli

| # | Borç | Etki |
|---|------|------|
| TD-A4 | In-memory domain store | Persistence adapter gerekli |
| TD-A5 | Mutation invalidation geniş scope | `['execution-platform']` full invalidate — performans |
| TD-A6 | ViewModel birleşik ekran DTO'ları yok | UI sprint'te screen-specific VM |

---

## P3 — Düşük

| # | Borç |
|---|------|
| TD-A7 | Presentation mapper status label i18n hardcoded TR |
| TD-A8 | Query key namespace merkezi registry yok |

---

## Borç Skoru

**Application Layer Technical Debt:** LOW (12/100)
