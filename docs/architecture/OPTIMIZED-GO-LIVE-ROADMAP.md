# Kepler ERP — Optimized Go-Live Roadmap

**Date:** 2026-08-03  
**Status:** Architecture Freeze — roadmap optimization only · **No code**  
**Audience:** Product, engineering, textile operations  
**Basis:** [ARCHITECTURE-FREEZE-AUDIT.md](./ARCHITECTURE-FREEZE-AUDIT.md)

---

## Design Principles (Applied)

| # | Prensip | Uygulama |
|---|---------|----------|
| 1 | Gerçek tekstil yaşam döngüsü | Sample → PC → SO → MRP → UE → Floor → QC → Pack → Ship → Invoice → Close |
| 2 | Merchandising erken ama PC sonrası | Phase 2 — sample/onay süreci gelişen PC'ye bağlanır |
| 3 | Product Card = teknik SSOT | Phase 2 — SO yalnızca seçer (Phase 3) |
| 4 | SO kart oluşturmaz | Phase 3 kuralı; OrderCreate = picker + matrix |
| 5 | Pack/Ship/Close üretimden sonra | Phase 6–7 |
| 6 | Finance sonda değil | Phase 7 — shipment/CI sonrası, archive öncesi |
| 7 | Func Stab + PostgreSQL doğru yer | Func Stab: Phase 5 (üretim) + Phase 7 (kapanış); PG: Phase 5 |
| 8 | Her fazda Go Live sorusu | Aşağıda |

---

## Lifecycle Map

```
[Phase 1 Platform]
       ↓
[Phase 2 Merch + Product Card SSOT + BOM + Cost]
       ↓
[Phase 3 Sales + MRP + Purchasing]
       ↓
[Phase 4 Production Order + Planning + Inventory]
       ↓
[Phase 5 Shop Floor + Quality + PG + Func Stab ①]
       ↓  ← 🟢 Production Go-Live
[Phase 6 Packing + Shipment + Export Docs]
       ↓  ← 🟢 Export Go-Live
[Phase 7 Finance + Cost/Style Close + Func Stab ②]
       ↓  ← 🟢 Full Financial Go-Live
[Phase 8 Enterprise Maturity]
```

---

## Phase 1 — Platform & Master Data Foundation

### Amaç
Fabrikanın referans verisini güvenle yönetebileceği **platform tabanı**. Henüz sipariş/üretim yok.

### Teslimatlar
- User & Role Management (RBAC, factory scope)
- API katmanı (auth, tenant, domain command exposure başlangıç)
- Master Data CRUD: Customer, Supplier, Warehouse, Color Card, Size Set, lookups
- Audit log (MD + platform)
- Administration iskelet (org/factory config)
- Notification altyapısı (in-app; email opsiyonel)

### Go Live?
**NO**

*Gerekçe:* Katalog ve operasyon modülü yok. Yalnızca IT/admin pilot.

---

## Phase 2 — Merchandising & Technical Catalog (SSOT)

### Amaç
Tekstil firmasının **başlangıç süreci**: sample → onay → teknik tanım. Product Card yaşam döngüsünün merkezi.

### Teslimatlar
- **Product Card:** create, edit, revision, approval (Taslak → Onaylı)
- **BOM:** PC-bound edit, approval workflow UI
- **Cost Sheet:** planned cost (FOB/CM/kırılım) — PC/SO referans
- **Merchandising:** sample stage tracking, buyer/season/collection, PC (Taslak) link
- P02 Product Card repository write path
- Product Card list/detail Application layer (mutation + invalidation)

### Kurallar
- Product Card = teknik SSOT
- Merchandising kart **oluşturmaz** — gelişen/onaylanan PC'yi takip eder
- Onaylı PC olmadan Phase 3'e SO açılmaz (business gate)

### Go Live?
**NO**

*Gerekçe:* Sipariş ve üretim yok. **Merchandising + PLM-lite ekip iç pilot yapabilir** (sample + kart tanımı).

---

## Phase 3 — Order Entry & Material Planning

### Amaç
Onaylı Product Card ile **satış siparişi** almak ve malzeme ihtiyacını hesaplamak.

### Teslimatlar
- **Sales Order:** persist, P01 port, PC **picker** (create PC yok)
- Renk/beden matrisi, EXF, termin alanları
- **MRP:** gross/net requirement, BOM explosion
- **Purchasing:** PR → PO issue, open PO tracking
- **Supplier** admin (Phase 1 MD üzerine operasyonel bağ)
- SO → MRP → PR orchestration (command path)

### Kurallar
- SO yalnızca mevcut Onaylı (veya explicit waiver) PC seçer
- OrderCreatePage: ürün kartı tab = görüntüleme/validasyon, not create

### Go Live?
**NO**

*Gerekçe:* Üretim emri ve stok hareketi yok — sipariş **commit edilebilir** ama fabrika çalıştırılamaz. **Satış + planlama ofisi sınırlı pilot** (üretime release yok).

---

## Phase 4 — Production Release & Inventory

### Amaç
Siparişi fabrikaya **üretim emrine** dönüştürmek; malzeme rezervasyonu ve depo temeli.

### Teslimatlar
- **Production Order:** SO → UE create, snapshot, lifecycle states
- **Production Planning:** takvim, kapasite, hat/atölye planı (mevcut modül hardening)
- **Inventory / Stock Ledger:** reservation, issue, consumption posting
- **Warehouse:** RM inbound/issue, mamul depo tanımı
- Planning ↔ UE entegrasyonu
- Open PO / material availability check before UE release

### Go Live?
**NO**

*Gerekçe:* Shop floor execution ve kalite kapıları production-grade değil. **Planlama ofisi UE release pilot** yapabilir; hat girişi güvenilir değil.

---

## Phase 5 — Shop Floor Production Go-Live

### Amaç
**İlk gerçek Go-Live:** kesim-dikim-yıkama-kalite hattında canlı üretim takibi.

### Teslimatlar
- **Shop Floor Execution:** mock elimination, bundle/WIP/work session production path
- **Quality:** inline/midline/final persist, AQL, NCR temeli
- **Barcode:** bundle/carton scan (minimum)
- **Mobile:** shop floor PWA (scan + qty entry)
- **Functional Stabilization ①:** order → UE → floor E2E, form validation, navigation, console clean
- **PostgreSQL Implementation ①:** catalog (P01/P02) + execution hot path + MD lookups cutover
- Dashboard (operational — floor KPI)

### Go Live?
**YES** — **Production Go-Live (CMT / fason, ihracat dokümanı olmadan)**

*Kapsam:* Sipariş alınır → malzeme planlanır → UE release → hat takibi → QC.  
*Dışarıda:* Packing list, shipment, fatura, style close.  
*Persona:* Planlama ofisi + shop floor + depo (RM).

---

## Phase 6 — Export Logistics & Documentation

### Amaç
Üretim tamamlandıktan sonra **ihracat operasyonu** — Tier-1 CMT için ikinci Go-Live.

### Teslimatlar
- **Packing List:** create, carton, net/gross, CBM, color/size, mixed/partial
- **Packaging** operasyon UI (istasyon)
- **Shipment Management:** booking, container, ETD/ETA, POL/POD, load plan (PRD M6)
- **Warehouse:** FG receipt, shipment reservation, dispatch confirm
- **Export Documents:** COO, inspection certificate
- **Commercial Documents:** Commercial Invoice, Packing List doc, B/L, ASN temeli
- Shipment ↔ PL ↔ carton FK chain

### Go Live?
**YES** — **Export Operations Go-Live**

*Kapsam:* Phase 5 + paketleme + konteyner + sevkiyat + ticari doküman çıktı.  
*Dışarıda:* GL, maliyet kapanışı, style close, muhasebe entegrasyonu.  
*Persona:* + export/lojistik + dokümantasyon.

---

## Phase 7 — Financial Close & Style Closing

### Amaç
**Mali ve operasyonel kapanış** — finance erken sonda değil; export sonrası hemen.

### Teslimatlar
- **Finance Integration:** AR (commercial invoice), GL export, payment term, DN/CN temeli
- **Cost Closing:** planned vs actual, variance, cost lock
- **Style Closing:** checklist engine (15 gate), open PO/UE/QC/WH/finance blockers
- **Closing Dashboard:** 9 dimension + CLOSE STYLE / CLOSE SO
- **Archive:** read-only enforcement
- **Functional Stabilization ②:** export + closing E2E, QA, kabul testleri
- Lessons Learned (Brain batch on close — minimum termin/fire/cost)

### Go Live?
**YES** — **Full ERP Go-Live (financial close)**

*Kapsam:* Phase 6 + fatura + maliyet/style kapanışı + arşiv.  
*Persona:* + finance + merchandising yönetimi (kapanış onayı).

---

## Phase 8 — Enterprise Maturity & Differentiation

### Amaç
Tier-1 olgunluk ve rekabet farkı — Go-Live sonrası derinleşme.

### Teslimatlar
- Reporting engine (Module 7 PRD)
- Integration (EDI, buyer portal, accounting API)
- Workflow Engine (kalan tipler: CostSheet, ProductionRoute)
- Merchandising derinlik (TNA PRD entegrasyonu)
- Production Planning APS / TNA sync
- Brain + Digital Twin production calibration
- AI Assistant (copilot on live data)
- PostgreSQL Implementation ②:** audit streams, outbox scale, partition
- CRM, Maintenance, RFID, IoT (P2)

### Go Live?
**YES** *(Phase 7 zaten live; Phase 8 = continuous improvement)*

*Gerekçe:* Yeni Go-Live değil — live sistemde kapasite ve olgunluk artışı.

---

## Cross-Cutting Placement Summary

| Konu | Faz | Neden |
|------|-----|-------|
| Merchandising | 2 | Sample → PC gate; SO öncesi |
| Product Card SSOT | 2 | Tüm zincirin referansı |
| Sales (picker) | 3 | Onaylı PC sonrası |
| MRP / Purchasing | 3–4 | UE öncesi malzeme |
| Production / Floor | 4–5 | İlk Go-Live |
| Func Stabilization ① | 5 | Production slice |
| PostgreSQL ① | 5 | İlk canlı veri |
| Packing / Shipment | 6 | Üretim sonrası |
| Finance | 7 | CI/shipment sonrası; archive öncesi |
| Style/Cost Close | 7 | Finance ile birlikte |
| Func Stabilization ② | 7 | Export + close slice |
| PostgreSQL ② | 8 | Scale & compliance |

---

## Go-Live Milestone Özet

| Milestone | Faz | Fabrika ne yapabilir? |
|-----------|-----|------------------------|
| Admin pilot | 1 | MD yönetimi |
| Catalog pilot | 2 | Sample + ürün kartı tanımı |
| Office pilot | 3 | Sipariş girişi (üretimsiz) |
| Planning pilot | 4 | UE release (hatsız) |
| **Production Go-Live** | **5** | **Tam üretim takibi (ihracatsız)** |
| **Export Go-Live** | **6** | **+ Paketleme & sevkiyat** |
| **Financial Go-Live** | **7** | **+ Fatura & kapanış** |
| Enterprise | 8 | Raporlama, entegrasyon, AI |

---

## Ben Olsaydım

**Ben olsaydım Kepler ERP'yi önce platform ve master data ile başlatır, merchandising ile birlikte Product Card SSOT'yu oturtur, onaylı kart üzerinden satış ve MRP'yi açar, üretim emri ve stokla fabrikayı bağlar, beşinci fazda shop floor + PostgreSQL ile ilk production go-live yapar, altıncı fazda packing ve shipment ile ihracatı, yedinci fazda finance ve style closing ile mali kapanışı tamamlar, sekizinci fazda raporlama ve entegrasyonla olgunlaştırırdım.**

---

*Architecture Freeze: yeni modül eklenmez — yalnızca bu sıradaki teslimatlar tamamlanır.*
