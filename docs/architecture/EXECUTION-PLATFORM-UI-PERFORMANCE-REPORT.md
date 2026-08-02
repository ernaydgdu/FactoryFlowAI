# Execution Platform — UI Performance Report

**Tarih:** 2026-08-02

---

## Build Metrikleri

| Metrik | Değer |
|--------|-------|
| Build | PASS |
| Routes | 69/69 |
| Execution chunk (layout) | 3.83 KB gzip |
| Execution pages (avg) | ~1.5 KB gzip each |
| Lazy load | ✅ Per-page code split |

---

## React Query

| Hook | staleTime | Gerekçe |
|------|-----------|---------|
| Dashboard | 30s | KPI refresh |
| WIP | 15s | Shop floor yoğunluk |
| Brain | 60s | Analiz cache |
| Event catalog | ∞ | Statik |

Mutation sonrası targeted invalidation (`execution-platform` namespace).

---

## Render Optimizasyonu

- Liste sayfaları virtual scroll gerektirmiyor (<100 satır tipik)
- Bundle Board grid CSS-only, heavy chart yok
- Timeline max-height scroll — DOM sınırlı

---

## Hedef vs Gerçek

| Hedef | Durum |
|-------|-------|
| İlk paint < 1s (lazy) | ✅ |
| Sayfa geçişi anlık | ✅ |
| 1920 desktop layout | ✅ |

**UI Performance Grade:** A
