# Architecture Freeze Audit — Kepler ERP

**Date:** 2026-08-03  
**Mode:** Independent ERP consultant review · **No code · No new modules · No roadmap features**  
**Question:** *Bugün Kepler ERP bir tekstil firmasına satılsaydı hangi modüller eksik olduğu için satış yapılamazdı?*

---

## Consultant Verdict (Executive)

Kepler ERP bugün **satılamaz** — çünkü **operasyonel demo + güçlü mimari iskelet** var, **ticari olarak canlı ERP değil**.

Satışı engelleyen katmanlar:

1. **Gerçek işlem yolu yok** — Sipariş, stok, satın alma, sevkiyat çoğunlukla mock/static seed.
2. **Katalog yazılamıyor** — Product Card create/edit/approval yok; SO kart oluşturamaz ama seçemez de (canlı kart yok).
3. **Finans & export dokümanları yok** — Fatura, B/L, packing list, maliyet kapanışı olmadan fason ihracat firması ERP saymaz.
4. **Platform güvenliği yetersiz** — RBAC, multi-tenant, audit coverage enterprise satın alma kapısını geçemez.
5. **Backend/API üretim hazır değil** — Domain frontend'de; NestJS yalnızca auth stub.

**Satılabilir olan:** Teknik due diligence, mimari lisans, Execution Platform POC, Brain/Twin demo.

**Satılamayan olan:** Tier-1 / Tier-2 tekstil üretim + ihracat ERP olarak go-live.

---

## Module Readiness Matrix

| Modül | Status | Sale blocker? | Priority |
|-------|--------|---------------|----------|
| Master Data | PARTIAL | Yes | P0 |
| Merchandising | PARTIAL | No | P1 |
| Product Card | PARTIAL | **Yes** | P0 |
| BOM | PARTIAL | Yes | P0 |
| Cost Sheet | PARTIAL | Yes | P0 |
| Sales | PARTIAL | **Yes** | P0 |
| CRM | MISSING | No | P2 |
| MRP | PARTIAL | Yes | P0 |
| Purchasing | PARTIAL | Yes | P1 |
| Supplier | PARTIAL | Yes | P1 |
| Inventory | PARTIAL | **Yes** | P0 |
| Warehouse | PARTIAL | **Yes** | P0 |
| Production Planning | PARTIAL | No | P1 |
| Production Order | PARTIAL | **Yes** | P0 |
| Shop Floor Execution | PARTIAL | No | P1 |
| Quality | PARTIAL | Yes | P1 |
| Maintenance | MISSING | No | P2 |
| Packaging | PARTIAL | Yes | P1 |
| Packing List | MISSING | **Yes** | P0 |
| Shipment | PARTIAL | **Yes** | P0 |
| Export Documents | MISSING | **Yes** | P0 |
| Commercial Documents | MISSING | **Yes** | P0 |
| Finance Integration | MISSING | **Yes** | P0 |
| Cost Closing | MISSING | **Yes** | P0 |
| Style Closing | MISSING | **Yes** | P0 |
| Archive | MISSING | Yes | P1 |
| Brain | PARTIAL | No | P2 |
| Digital Twin | PARTIAL | No | P2 |
| Dashboard | PARTIAL | No | P1 |
| Reporting | PARTIAL | Yes | P1 |
| Administration | PARTIAL | Yes | P1 |
| User & Role Management | PARTIAL | **Yes** | P0 |
| Workflow Engine | PARTIAL | Yes | P1 |
| Notification | PARTIAL | No | P1 |
| Audit | PARTIAL | Yes | P1 |
| Versioning | PARTIAL | Yes | P1 |
| API | PARTIAL | **Yes** | P0 |
| Integration | MISSING | Yes | P1 |
| Mobile | MISSING | Yes | P1 |
| Barcode | MISSING | Yes | P1 |
| RFID | MISSING | No | P2 |
| IoT | MISSING | No | P2 |
| AI Assistant | PARTIAL | No | P2 |

**Summary:** READY **0** · PARTIAL **32** · MISSING **12**

---

## Module Detail

### Master Data — PARTIAL · P0

**Mevcut:** 40+ lookup entity, enterprise approval/audit/attribute, port-backed InMemory adapters, TX-wrapped commands.  
**Eksik:** CRUD UI, tenant-scoped admin, import/export production path, Customer/Supplier/Warehouse write screens.  
**Satış:** Master data yazılamadan sipariş/üretim referansları kurulamaz.

---

### Merchandising — PARTIAL · P1

**Mevcut:** Sample stage demo UI, merchandising list/detail.  
**Eksik:** Sample approval workflow, buyer portal, TNA entegrasyonu (PRD locked, UI mock).  
**Satış:** Blocker değil; büyük markalı CMT'te P1 beklenti.

---

### Product Card — PARTIAL · P0

**Mevcut:** Referans read UI (8 tab), textile domain model, P02 port skeleton.  
**Eksik:** Create, edit, revision, approval, repository write, list mutation.  
**Satış:** Teknik SSOT olmadan ERP satılamaz.

---

### BOM — PARTIAL · P0

**Mevcut:** `bom-service`, BomDesigner page, platform BOM approval commands.  
**Eksik:** PC'ye bağlı editable BOM, consumption posting, approval UI end-to-end.  
**Satış:** MRP ve maliyet BOM olmadan çalışmaz.

---

### Cost Sheet — PARTIAL · P0

**Mevcut:** `textile-costing-service`, cost breakdown demo, Brain feed.  
**Eksik:** Standard/planned cost lock, actual rollup, approval, SO/PC bağlı cost sheet entity.  
**Satış:** Fason fiyatlandırma (FOB/CM) canlı hesaplanamaz.

---

### Sales — PARTIAL · P0

**Mevcut:** Order list/detail/create UI, matrix form, stage badges.  
**Eksik:** Persisted create/update, port migration (P01), list-command invalidation, SO→PO orchestration.  
**Satış:** Sipariş alınamaz = ERP satılamaz.

---

### CRM — MISSING · P2

**Mevcut:** Customer master data only.  
**Eksik:** Lead, opportunity, activity, buyer CRM.  
**Satış:** Tekstil CMT'te genelde blocker değil.

---

### MRP — PARTIAL · P0

**Mevcut:** MRP page, requirement calc from BOM×qty.  
**Eksik:** Netting, reservation, PR generation command, lead time explosion.  
**Satış:** Malzeme planlama güvenilir değil.

---

### Purchasing — PARTIAL · P1

**Mevcut:** PR/PO demo pages, purchase-chain trace domain.  
**Eksik:** PO issue, receipt, GRN, supplier confirmation, open PO close checks.  
**Satış:** P1 — üretim öncesi blocker; export close için P0 open PO check.

---

### Supplier — PARTIAL · P1

**Mevcut:** Supplier MD lookup, seed.  
**Eksik:** Supplier CRUD, scorecard, approval, PO linkage admin.  
**Satış:** P1.

---

### Inventory — PARTIAL · P0

**Mevcut:** Stock ledger domain rules (BR-01..14), fabric/accessory stock demo.  
**Eksik:** Mutable ledger on ports, reservation, consumption posting, lot trace production path.  
**Satış:** Stok yoksa ERP değil.

---

### Warehouse — PARTIAL · P0

**Mevcut:** Hierarchy service, inbound/outbound/count UI.  
**Eksik:** FG receipt, dispatch, shipment reservation, scan confirm.  
**Satış:** Depo hareketi olmadan go-live olmaz.

---

### Production Planning — PARTIAL · P1

**Mevcut:** Calendar, capacity, line/workshop planning, schedule, daily entry.  
**Eksik:** Finite scheduling, TNA sync (PRD), material constraint.  
**Satış:** Planlama ofisi POC olarak satılabilir; tam APS değil — P1.

---

### Production Order — PARTIAL · P0

**Mevcut:** Lifecycle module, create-from-sales page, snapshot, TX commands.  
**Eksik:** End-to-end from live SO, material reservation, status close integration.  
**Satış:** Üretim emri olmadan fabrika ERP satılamaz.

---

### Shop Floor Execution — PARTIAL · P1

**Mevcut:** Execution Platform (bundle, WIP, work session, quality gate, brain console) — **en olgun modül**.  
**Eksik:** RF/barcode, real-time sync, machine integration, production-hardened mobile.  
**Satış:** POC/demo satışı mümkün; enterprise shop floor için P1 tamamlama.

---

### Quality — PARTIAL · P1

**Mevcut:** Inline/midline/final demo, AQL fields, execution quality gate.  
**Eksik:** NCR, CAPA link, final close gate, claim bridge.  
**Satış:** P1 — inline QC olmadan risk; tam QMS değil.

---

### Maintenance — MISSING · P2

**Mevcut:** Machine master data lookup only.  
**Eksik:** PM schedule, breakdown, spare parts.  
**Satış:** Blocker değil (çoğu tekstil ERP'de ayrı modül).

---

### Packaging — PARTIAL · P1

**Mevcut:** Carton card demo UI.  
**Eksik:** Pack station workflow, label print.  
**Satış:** P1.

---

### Packing List — MISSING · P0

**Mevcut:** Carton type in workflows seed.  
**Eksik:** PL document, weights, CBM, barcode, approval, shipment link.  
**Satış:** İhracat CMT için zorunlu.

---

### Shipment — PARTIAL · P0

**Mevcut:** Container plan demo, shipping mock table, ShipmentCompleted event.  
**Eksik:** ShipmentRecord (PRD M6), B/L link, partial/multi ship, close.  
**Satış:** EXF sonrası lojistik olmadan satılamaz.

---

### Export Documents — MISSING · P0

**Mevcut:** —  
**Eksik:** COO, inspection cert, export bundle, customs.  
**Satış:** İhracat firması için blocker.

---

### Commercial Documents — MISSING · P0

**Mevcut:** Invoice relation stub.  
**Eksik:** Proforma, commercial invoice, ASN, PDF issue.  
**Satış:** Gelir tanıma yok = ERP satılamaz.

---

### Finance Integration — MISSING · P0

**Mevcut:** Payment term/incoterm MD, cost calc demo.  
**Eksik:** GL, AR, AP, bank, tax, period close, DN/CN.  
**Satış:** **#1 enterprise blocker** — CFO imzası olmaz.

---

### Cost Closing — MISSING · P0

**Mevcut:** Order cost formula.  
**Eksik:** Plan vs actual, variance, lock, approval.  
**Satış:** Margin raporu güvenilmez.

---

### Style Closing — MISSING · P0

**Mevcut:** ProductCard `Kapalı` type, stage badges.  
**Eksik:** Checklist engine, blockers, close command, read-only.  
**Satış:** Sipariş/style açık kalır; muhasebe kapanmaz.

---

### Archive — MISSING · P1

**Mevcut:** Archived status in PRD/DB spec, Obsolete revision.  
**Eksik:** Archive job, read-only enforcement, retention.  
**Satış:** P1 — compliance satışında gerekir.

---

### Brain — PARTIAL · P2

**Mevcut:** Knowledge engine, recommendation, decision memory, twin hooks.  
**Eksik:** Close-triggered lessons learned, production ML ops.  
**Satış:** Differentiator; blocker değil.

---

### Digital Twin — PARTIAL · P2

**Mevcut:** Factory graph, bottleneck, simulation disclaimer.  
**Eksik:** Live sync, calibrated models.  
**Satış:** Blocker değil.

---

### Dashboard — PARTIAL · P1

**Mevcut:** Operational dashboard (cutting, sewing, shipping KPI).  
**Eksik:** Role-based dashboards, closing dashboard, drill-down to live data.  
**Satış:** P1.

---

### Reporting — PARTIAL · P1

**Mevcut:** Reports page mock, Module 7 PRD locked.  
**Eksik:** Report engine, scheduled export, KPI cache reads.  
**Satış:** P1 — yönetim raporu beklentisi.

---

### Administration — PARTIAL · P1

**Mevcut:** Settings page mock.  
**Eksik:** Org/factory/tenant config, feature flags admin, MD governance UI.  
**Satış:** P1.

---

### User & Role Management — PARTIAL · P0

**Mevcut:** JWT login (NestJS), single `USER` role, execution permission guard (shop floor roles).  
**Eksik:** RBAC matrix, factory scope, SSO, user admin UI, PRD Platform Addendum IAM.  
**Satış:** Enterprise security review fail.

---

### Workflow Engine — PARTIAL · P1

**Mevcut:** Approval workflow port, BOM/MD approval commands, versioning.  
**Eksik:** ProductCard/CostSheet/PO workflows wired, designer UI.  
**Satış:** P1.

---

### Notification — PARTIAL · P1

**Mevcut:** Outbox→watcher notifications, ERP notification demo.  
**Eksik:** Email/push, user preferences, escalation.  
**Satış:** P1.

---

### Audit — PARTIAL · P1

**Mevcut:** Audit log stream, MD/platform audit services.  
**Eksik:** Full entity coverage, compliance export, immutable PG partition.  
**Satış:** P1 — SOX/ISO talebinde P0'ya yükselir.

---

### Versioning — PARTIAL · P1

**Mevcut:** Entity revision port, activate/obsolete.  
**Eksik:** PC/BOM/CostSheet revision UI, effective dating on production.  
**Satış:** P1.

---

### API — PARTIAL · P0

**Mevcut:** API spec draft (docs), axios client, auth endpoints.  
**Eksik:** REST/GraphQL production surface, domain commands exposed, versioning, rate limit.  
**Satış:** Integrasyon ve multi-client olmadan satılamaz.

---

### Integration — MISSING · P1

**Mevcut:** ERP envelope in PRD (sourceSystem/sourceEventId).  
**Eksik:** EDI, buyer portal, accounting export, webhook.  
**Satış:** P1 — büyük buyer zorunlu kılar.

---

### Mobile — MISSING · P1

**Mevcut:** Responsive web only.  
**Eksik:** Shop floor mobile app, offline.  
**Satış:** P1 — hat operatörü use case.

---

### Barcode — MISSING · P1

**Mevcut:** —  
**Eksik:** Bundle/carton scan, GS1.  
**Satış:** P1 — modern fabrika beklentisi.

---

### RFID — MISSING · P2

**Mevcut:** —  
**Eksik:** Tag read, WIP tracking.  
**Satış:** Blocker değil.

---

### IoT — MISSING · P2

**Mevcut:** —  
**Eksik:** Machine data ingest.  
**Satış:** Blocker değil.

---

### AI Assistant — PARTIAL · P2

**Mevcut:** KeplerAi page mock, Brain backend.  
**Eksik:** Copilot on live data, guarded actions.  
**Satış:** Blocker değil.

---

## P0 Blocker Consolidation (Satış yapılamaz)

| # | Modül | Neden |
|---|-------|-------|
| 1 | Product Card | Katalog SSOT yok |
| 2 | Sales | Sipariş persist edilemiyor |
| 3 | BOM | Canlı reçete yok |
| 4 | MRP | Malzeme planı güvenilir değil |
| 5 | Inventory | Ledger production değil |
| 6 | Warehouse | FG/dispatch yok |
| 7 | Production Order | SO→UE tam zincir yok |
| 8 | Master Data | Write/admin yok |
| 9 | Cost Sheet | Canlı maliyet yok |
| 10 | Packing List | İhracat dokümanı yok |
| 11 | Shipment | Lojistik modülü yok |
| 12 | Export Documents | Gümrük/ihracat yok |
| 13 | Commercial Documents | Fatura yok |
| 14 | Finance Integration | Muhasebe yok |
| 15 | Cost Closing | Maliyet kapanışı yok |
| 16 | Style Closing | Operasyonel kapanış yok |
| 17 | User & Role Management | Enterprise IAM yok |
| 18 | API | Production backend yok |

**18 modül P0** — bunların herhangi biri procurement'da red sebebi.

---

## Architecture Strengths (Satış pitch — dürüst)

| Alan | Değerlendirme |
|------|---------------|
| Domain architecture | Güçlü — constitution, ports, TX/outbox |
| Textile domain depth | Güçlü — color, size, BOM, termin |
| Execution Platform | En satılabilir parça (POC) |
| PRD Modules 1–7 | Locked design SSOT |
| Brain / Twin | Farklılaştırıcı (henüz P2) |
| PostgreSQL readiness | Skeleton tamam (Sprint 7) |

---

## Architecture Freeze Statement

| Kural | Durum |
|-------|-------|
| Yeni modül ekleme | **Donduruldu** |
| Roadmap dışı özellik | **Yasak** |
| Domain model değişikliği | **Yasak** |
| Business rule değişikliği | **Yasak** |
| Mevcut modül tamamlama | **İzinli (öncelik sırasına göre)** |

---

## Post-Architecture Development Order

Mimari freeze sonrası önerilen **geliştirme sırası** (sprint değil — bağımlılık zinciri):

### Phase 1 — Platform & Catalog Foundation
1. User & Role Management (RBAC, factory scope)
2. API layer (domain commands → REST, auth, tenant)
3. Master Data CRUD (Customer, Supplier, Warehouse, Color, Size Set)
4. Product Card (create, edit, revision, approval, P02 write)
5. BOM (PC-bound edit, approval UI)
6. Cost Sheet (planned cost on PC/SO)

### Phase 2 — Order-to-Production Core
7. Sales Order (persist, P01 port, picker for PC)
8. MRP (netting, PR generation)
9. Inventory / Stock Ledger (reservation, consumption)
10. Purchasing (PO issue, receipt)
11. Production Order (SO→UE, material reservation)
12. Warehouse (RM issue, FG receipt foundation)

### Phase 3 — Shop Floor Hardening
13. Shop Floor Execution (close mock gaps, permission production)
14. Quality (inspection persist, NCR foundation)
15. Barcode (bundle/carton scan)
16. Mobile (shop floor web/PWA minimum)

### Phase 4 — Export & Logistics
17. Packing List (document + carton management)
18. Packaging operations (station workflow)
19. Shipment Management (PRD Module 6 entity)
20. Warehouse dispatch (reservation, load, confirm)
21. Export Documents (COO, inspection)
22. Commercial Documents (invoice, B/L, ASN)

### Phase 5 — Financial Close
23. Finance Integration (AR minimum, GL export)
24. Cost Closing (actual, variance, lock)
25. Style Closing (checklist engine)
26. Archive (read-only enforcement)
27. Closing Dashboard

### Phase 6 — Stabilization & Persistence
28. Functional Stabilization (mock elimination, E2E, QA)
29. PostgreSQL Implementation (catalog → execution → cutover)
30. Integration (EDI/accounting webhook)

### Phase 7 — Intelligence & Maturity
31. Merchandising (sample workflow)
32. Production Planning (TNA/APS depth)
33. Reporting (Module 7 engine)
34. Administration (org config)
35. Workflow Engine (remaining types)
36. Notification (email/escalation)
37. Audit & Versioning (full coverage)
38. Dashboard (role-based + closing)
39. Brain (lessons learned on close)
40. Digital Twin (live calibration)
41. AI Assistant (copilot on live data)

### Phase 8 — Optional / Tier-1+
42. CRM
43. Maintenance
44. RFID
45. IoT

---

## Final Answer

**Bugün satış yapılamaz** çünkü Kepler'de **18 P0 modül** eksik veya mock — özellikle **Sales, Product Card, Inventory, Finance, Commercial/Export Documents, Shipment/Packing List, Style/Cost Closing, IAM ve API** olmadan tekstil firması günlük operasyonu ve mali kapanışı yürütemez.

**Satılabilir değer today:** Execution Platform mimari POC + textile domain blueprint.

---

*Related closing analysis: [FINAL-GAP-ANALYSIS.md](./FINAL-GAP-ANALYSIS.md)*
