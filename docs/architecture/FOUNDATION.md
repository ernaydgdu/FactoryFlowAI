# Kepler ERP Architecture Bible

## Volume 1 — Foundation

### Chapter 1 — Constitutional Architecture

> **Status:** Locked — v1  
> **Authority:** This document overrides all code, UI, AI, and integration decisions.  
> **Path:** `docs/architecture/FOUNDATION.md`  
> **Related:** `docs/KEPLER-ERP-FOUNDATION-PRINCIPLES.md` (14 enforceable principles)

---

## Kepler ERP Nedir?

Kepler ERP;

- tekstil ve konfeksiyon sektörü için geliştirilen,
- enterprise seviyesinde,
- modern,
- ölçeklenebilir,
- AI destekli,
- çok kiracılı,
- offline-first,
- API-first,
- domain-driven,
- platform mimarisine sahip

profesyonel bir ERP sistemidir.

**Kepler ERP genel ERP değildir.** Tekstil sektörünün gerçek operasyonlarına göre geliştirilir.

---

## Hedef

Bir siparişin;

müşteriden gelmesinden → üretime → sevkiyata → faturaya

kadar geçen **bütün hayatını** yönetmek.

---

## Kepler ERP Felsefesi

Kepler ERP ekranlardan oluşan bir program **değildir**.

Kepler ERP, **iş süreçlerini yöneten bir platformdur**.

---

## Temel Mimari

```
UI
 ↓
Application Layer
 ↓
Platform Layer
 ↓
Domain Layer
 ↓
Infrastructure
 ↓
Database
```

### Mevcut frontend eşlemesi (Phase 1 — mock domain)

| Katman | Konum |
|---|---|
| **UI** | `frontend/src/pages/`, `frontend/src/modules/*/pages/` |
| **Application** | `frontend/src/modules/*/hooks/` — yalnızca orchestration, kural yok |
| **Platform** | `frontend/src/domain/platform/` — audit, events, KPI, timeline, AI memory |
| **Domain** | `frontend/src/domain/` — rules, planning, ledger, master data |
| **Infrastructure** | (gelecek) API client, persistence, sync |
| **Database** | (gelecek) PostgreSQL / tenant-scoped stores |

---

## En Önemli Kural

**Business Logic** hiçbir zaman:

- React içinde yazılmayacaktır
- Controller içinde yazılmayacaktır
- Component içinde yazılmayacaktır

Business Logic **yalnızca Domain katmanında** olacaktır.

```
UI  →  Domain Service  →  sonuç
UI  ✗  business if/else
```

**Domain servisleri:**

| Servis | Path |
|---|---|
| Business Rule Engine | `domain/services/business-rule-engine.ts` |
| Stock Ledger | `domain/services/stock-ledger.ts` |
| Planning Engine | `domain/services/planning-engine.ts` |
| Master Data | `domain/master-data/` |
| Platform (events, audit, KPI) | `domain/platform/` |

---

## UI Yalnızca Domain Servislerini Çağırır

ERP'nin tek doğruluk kaynağı **Domain**'dir.

- Bütün ekranlar değişebilir
- Tema değişebilir
- Mobil / web değişebilir
- **Domain aynı kalacaktır**

---

## Domain — Kepler ERP'nin Beyni

```
domain/
├── master-data/          ← SSOT referans veri
├── services/
│   ├── business-rule-engine.ts
│   ├── stock-ledger.ts
│   ├── planning-engine.ts
│   └── planning/
├── platform/             ← audit, events, KPI, timeline, AI memory
├── types/
└── data/                 ← mock operational data (geçici — API'ye taşınacak)
```

---

## Temel Prensipler

| Prensip | Anlam |
|---|---|
| **Offline First** | İnternet kesilse ERP çalışır |
| **API First** | Domain sözleşmesi = API sözleşmesi |
| **Domain First** | Önce domain, sonra ekran |
| **Security First** | Tenant izolasyonu, audit trail |
| **Performance First** | Hesaplamalar domain'de, UI hafif |
| **Event Driven** | Servisler Event Bus ile haberleşir |
| **Multi Tenant** | Kiracı verisi asla karışmaz |
| **Scalable** | Modüler, bağımsız servisler |
| **Modular** | Her modül bağımsız geliştirilebilir |
| **Explainable AI** | AI yalnızca domain kaynaklarından cevap verir |

---

## Geliştirme Sırası

Kepler ERP **ekran odaklı geliştirilmeyecektir**.

| Sıra | Ne |
|---|---|
| 1 | Önce **Domain** |
| 2 | Önce **veri modeli** |
| 3 | Önce **iş kuralı** |
| 4 | Önce **süreç** |
| 5 | Sonra ekran / buton / tasarım |

---

## Kod Kalitesi Kuralları

- Her modül bağımsız geliştirilebilir olmalıdır
- Her servis test edilebilir olmalıdır
- Kod okunabilir olmalıdır
- Tekrarlayan kod yazılmayacaktır
- **Magic number** kullanılmayacaktır
- **Hardcoded string** kullanılmayacaktır

---

## Master Data — Tek Doğruluk Kaynağı

Tüm referans veriler `domain/master-data/` üzerinden gelir.

```typescript
import { masterData, getWarehouseName } from '@/domain'

masterData.customer.getByCode('LCW')
masterData.operation.getActive()
getWarehouseName('KMS-01')
```

UI dropdown'ları: `domain/master-data/ui-options.ts`

**Yasak:** `'LC Waikiki'`, `'Kumaş Deposu'`, `'FOB'` gibi string'ler component içinde.

---

## Stock Ledger — Tek Stok Gerceği

Stok **hiçbir zaman** manuel değiştirilmeyecektir.

Her stok değişimi `recordMovement()` üzerinden gerçekleşecektir.

```
RECEIPT → TRANSFER → RESERVATION → CONSUMPTION → PRODUCTION_OUTPUT → SHIPMENT
```

---

## Bağımsiz Domain Servisleri

Bu servisler **birbirinden bağımsızdır** — iç yapıyı bilmezler:

| Servis | Sorumluluk |
|---|---|
| Business Rule Engine | İş kuralı yürütme, state değişimi |
| Planning Engine | Termin, risk, kapasite, MRP hesaplama (read-only) |
| Stock Ledger | Stok hareketleri |
| Master Data | Referans veri SSOT |
| Platform / Event Bus | Olay, audit, timeline, KPI |

```
Servis A  ──publish──▶  Event Bus  ──subscribe──▶  Servis B
Servis A  ✗  doğrudan Servis B.internalState
```

---

## Platform — Event Driven

Tüm anlamlı işlemler domain event üretir:

`OrderCreated` · `BomApproved` · `PurchaseCreated` · `StockReceived` · `ProductionStarted` · `ProductionFinished` · `ShipmentCompleted`

Event Bus: `domain/platform/services/event-bus.ts`

---

## AI — Kepler Brain Kuralları

- AI **karar vermez** — öneri sunar
- AI **tenant izolasyonlu** çalışır
- AI **offline-capable** olmalıdır
- Dış LLM (ChatGPT, Claude, Gemini) **zorunlu değildir**
- AI cevapları yalnızca domain kaynaklarından üretilir
- **Başka şirket örneği verilemez** ("Koton şöyle yapıyor" — yasak)

---

## Operasyon Önceliği

Kod yazarken amaç güzel görünmek **değildir**.

Amaç **gerçek tekstil operasyonlarını doğru modellemektir**.

---

## Enforcement Checklist

Her PR / kod değişikliğinde:

- [ ] Business logic Domain'de mi?
- [ ] Stok doğrudan güncellenmiyor mu?
- [ ] Hardcoded string yok mu? (Master Data kullanıldı mı?)
- [ ] Planning Engine operational state yazmıyor mu?
- [ ] Event publish edildi mi? (state değişimlerinde)
- [ ] Audit log oluşturuldu mu? (kritik değişimlerde)
- [ ] UI yalnızca domain servisi çağırıyor mu?

---

## Doküman Hiyerarşisi

```
docs/architecture/FOUNDATION.md          ← BU DOSYA (Anayasa)
docs/KEPLER-ERP-FOUNDATION-PRINCIPLES.md ← 14 prensip detayı
docs/PRD-MVP.md
docs/Platform-Architecture-Addendum.md
docs/API-Specification.md
Kod
```

**Çelişki durumunda FOUNDATION.md kazanır.**

---

## Revision History

| Version | Date | Change |
|---|---|---|
| v1 | 2026-08-02 | Volume 1, Chapter 1 — Initial constitutional lock |
