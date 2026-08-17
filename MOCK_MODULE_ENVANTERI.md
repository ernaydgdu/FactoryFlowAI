# Mock Modül Envanter Raporu — FactoryFlowAI Frontend

**Tarih:** 2026-08-16
**Kapsam:** `frontend/src/domain/**/*-crud.service.ts` (19 dosya) + Execution Platform aile (9 dosya)
**Not:** Bu rapor salt okunur bir incelemedir. Hiçbir kod değiştirilmemiştir.

---

## 0. Mimari Özet (Her Modülü Anlamak İçin Ön Bilgi)

Frontend'de **iki tamamen ayrı "backend" kavramı** var:

1. **Gerçek backend** (`/backend`): NestJS + Prisma + PostgreSQL, gerçek `factoryflowai` veritabanına bağlı. Sadece **Sipariş (Orders)** modülünü besliyor — `Order`, `OrderColorSize`, `Material`, `ProductionEntry`, `QualityEntry`, `StockLot`, `StockMovement`, `User` tabloları. Frontend'de tek gerçek API client: `src/infrastructure/api/orders-api.repository.ts`.

2. **In-memory "Unit of Work" simülasyonu** (`src/domain/**`): `persistence-registry.ts` → `requireUnitOfWork()` üzerinden çalışan, DDD tarzı repository/port mimarisiyle inşa edilmiş ama **tamamen bellekte** tutulan sahte bir veritabanı. Sayfa yenilendiğinde ("Kepler ERP starting… Loading persistence runtime and seed data") tüm veri sıfırlanıyor. Bir PostgreSQL adaptör iskeleti var (`src/infrastructure/persistence/postgresql/`) ama açıkça bağlanmamış: `PostgresAdapterNotReadyError` — *"Sprint 7 skeleton only"*. Yani `PERSISTENCE_BACKEND=postgres` seçilse bile gerçek DB'ye hiçbir zaman bağlanmıyor.

Aşağıda incelenen **tüm** `*-crud.service.ts` modülleri bu ikinci (sahte) katmanda çalışıyor. Hiçbiri gerçek backend'e HTTP çağrısı yapmıyor (`fetch`/`axios` taraması sıfır sonuç verdi).

### Kritik mimari bulgu: Ortak sahte "Sales Order" hub'ı

`src/domain/sales-order/` altındaki mock "Sales Order" kavramı — gerçek backend `Order` modeliyle **hiçbir ilgisi yok** — şu 6 modül tarafından `querySalesOrderById` ile referans alınıyor: MRP, Packing List, Cost Closing, Shipment, Export Logistics, Commercial Documents. Yani bu modüller birbirinden bağımsız adacıklar değil; ortak ama yine sahte bir "sipariş" konseptini paylaşan, birbirine bağlı bir simülasyon zinciri oluşturuyorlar (Sales Order → Production Order → Stock/FG → Packing List → Shipment → Export/Commercial Docs → Cost Closing → Style Closing).

---

## 1. MRP (Material Requirements Planning)

**Dosya:** `src/domain/mrp/mrp-crud.service.ts`

| # | Soru | Yanıt |
|---|---|---|
| 1 | **Amaç / Ekranlar** | Açık siparişleri BOM'lardan geçirip net malzeme ihtiyacını hesaplar (stok/açık PO/açık üretimle netleme), satın alma ve üretim önerileri üretir. Tek ekran: `/planning/mrp` → `MrpPage` (`src/pages/planning/PlanningPages.tsx`). |
| 2 | **Veri modeli** | `MrpRun` (Draft→Calculated→Approved→Released→Archived), `MrpSnapshot` içinde: ürün konsolidasyonları, varyant talepleri, malzeme satırları (brüt/net ihtiyaç, stok, açık PO/üretim, emniyet stoğu, tedarik süresi), satın alma/üretim önerileri (tedarikçi/atölye bazlı gruplanmış), 7 tipte istisna kodu. |
| 3 | **Backend bağlantısı** | Tamamen in-memory (`requireUnitOfWork().mrpRuns`). Seed: `mrp-seed.bootstrap.ts`. Gerçek backend'de **MRP kavramı hiç yok** — Prisma şemasında karşılığı bulunmuyor. |
| 4 | **Sipariş ilişkisi** | Mock `SalesOrder` + Product Card/BOM üzerinden sipariş-malzeme patlatması yapıyor — ama bu, gerçek `Order` tablosuyla bağlantısız, tamamen sahte bir veri seti. Üretilen öneriler yine mock Production Order / Purchase Request'lere dönüşüyor (döngü tamamen simülasyon içinde kapanıyor). |
| 5 | **Boyut/karmaşıklık** | Domain: 1.336 satır (8 dosya) + seed 27 + application layer 514 + UI 453 ≈ **2.330 satır toplam**. Basit CRUD değil — çok boyutlu patlatma, emniyet stoğu/tedarik süresi hesaplama, istisna tespiti, tedarikçi/atölye gruplama, revizyon/snapshot geçmişi içeren gerçek bir hesaplama motoru. |
| 6 | **Efor tahmini** | **BÜYÜK.** Gerekçe: 6-8 yeni Prisma modeli lazım; hesaplama mantığının (~700 satır) sunucu tarafına taşınması gerekir; BOM/Product Card/Stock Card/Purchase Order/Production Order gibi **henüz gerçek backend'de var olmayan bağımlı modüllerin** önce inşa edilmesi şart. Siparişten çok daha büyük bir kapsam — 4-5 ek backend modülü + hesaplama motoru inşası gibi. |

---

## 2. Packing List (Paketleme)

**Dosya:** `src/domain/packaging/packing-list-crud.service.ts`

| # | Soru | Yanıt |
|---|---|---|
| 1 | **Amaç / Ekranlar** | Sevkiyat öncesi mamulleri fiziksel paketleme birimlerine (Koli/Palet) gruplar, GS1 barkod/SSCC atar, sipariş renk/beden matrisine göre doğrular, sevkiyata bağlar. 4 ekran: `/packaging/dashboard`, `/packaging/lists`, `/packaging/lists/:id`, `/packaging/station` (`PackagingPages.tsx`). |
| 2 | **Veri modeli** | `PackingList` (Draft→Validated→PendingApproval→Approved→Confirmed→Shipped/Cancelled), `PackageEntity` (Koli/Palet, SSCC-18, GS1-128, koli-palet iç içe yerleşim), `PackageLine` (renk/beden/miktar), `PackingListTotals` (paket/koli/palet sayısı, ağırlık, hacim). |
| 3 | **Backend bağlantısı** | Tamamen in-memory (`requireUnitOfWork().packingLists`). **Seed dosyası yok** — her açılışta boş başlıyor. Postgres implementasyonu tüm metodlarda `notReady()` fırlatıyor; dosya başlığında açıkça: *"No mock data — memory backend remains the production path."* Gerçek backend'e sıfır bağlantı. |
| 4 | **Sipariş ilişkisi** | Mock `SalesOrder.matrix` (renk×beden) ile paketlenen miktarları karşılaştırıyor — gerçek `Order`/`OrderColorSize` ile ilgisi yok. Ayrıca mock Production Order ve Stock Ledger'dan "mamulden otomatik koli oluşturma" özelliği var — tüm zincir sahte. `shipment-crud.service.ts` bu modülü `queryPackingListById` ile kullanıyor. |
| 5 | **Boyut/karmaşıklık** | Paketleme dosyaları toplamı **~2.260 satır** (crud 663, UI 482, types 200, application layer ~450, repository/postgres stub ~200). Orta-yüksek karmaşıklık: 7 durumlu onay iş akışı, optimistic concurrency, idempotency key, revizyon/soy takibi, GS1 SSCC-18 checksum üretimi, koli/palet iç içe yerleşim kuralları. |
| 6 | **Efor tahmini** | **ORTA-BÜYÜK.** Dar kapsamda (sadece PackingList+Package tabloları, temel CRUD, gerçek Order/OrderColorSize'a bağlanma): **Orta**. Mevcut tüm davranışı birebir kopyalamak isteniyorsa (onay akışı, revizyon, GS1 üretimi, koli yerleşimi, mamulden-otomatik-üretim — ki bu son özellik gerçek backend'de olmayan Production Order/Stock hareketi gerektiriyor): **Büyük**. |

---

## 3. Cost Closing (Maliyet Kapama)

**Dosya:** `src/domain/cost-closing/cost-closing-crud.service.ts`

| # | Soru | Yanıt |
|---|---|---|
| 1 | **Amaç / Ekranlar** | Bir siparişin üretim döngüsünü mali olarak kapatan modül (SAP CO tarzı dönem-sonu maliyet kapama). Durum makinesi: Open→Calculating→Reconciling→Approved→Closed (veya Reversed). Malzeme/işçilik/genel gider varyansı, envanter yeniden değerleme, mali mutabakat, 8 kapanış "gate"i (üretim tamam, sevkiyat tamam, muhasebe kaydı tamam, vb.). 5 ekran: dashboard, batch detay, varyans, mutabakat, geçmiş (`CostClosingPages.tsx`). |
| 2 | **Veri modeli** | `CostClosing` (batchNo, salesOrderId, productCardId, status, gates[], variances, inventoryRevaluation, financialReconciliation, closingResult, approvalStatus, anomalyScore). `CostVarianceBundle` (malzeme/işçilik/genel gider/üretim — planlanan/gerçekleşen/varyans). |
| 3 | **Backend bağlantısı** | Tamamen in-memory (`requireUnitOfWork().costClosings`). `cost-sheet-crud.service.ts` ile doğrudan bağlı değil — Product Card'ın gömülü `costSheet` alanı üzerinden dolaylı okuyor. Gerçek backend'de "cost" ile ilgili hiçbir şey yok. |
| 4 | **Sipariş ilişkisi** | Mock `SalesOrder`'a `salesOrderId` ile bağlı — ama yine gerçek `Order` değil, sahte in-memory sipariş grafiği. Varyans hesabı, mock Production Order'lardan `producedQty`/`plannedQty` çekiyor. |
| 5 | **Boyut/karmaşıklık** | Toplam **~2.359 satır** (crud 725, query 74, types 148, repository 130+10, application 296, UI 468, ilişkili cost-sheet 508). Ana karmaşıklık 7 farklı domainden (üretim, sevkiyat, stok, muhasebe, satın alma, vb.) salt-okunur veri toplamak — matematik kendisi basit (sabit oranlarla varyans + basit eşik tabanlı "anomali skoru"). |
| 6 | **Efor tahmini** | **ORTA-BÜYÜK.** Yeni bir Prisma domaini (CostClosing + alt yapılar) gerekiyor. Varyans/gate hesaplaması ~7 başka mock domaine bağımlı — bunların hiçbiri gerçek backend'de yok, bu yüzden bağımsız olarak bağlanamaz; en azından gerçek Production Order ve Shipment/Inventory modelleri önce lazım (ya da varyans motoru basitleştirilmeli). Frontend etkisi görece küçük (468 satır UI zaten hazır). |

---

## 4. Execution Platform (Saha/Atölye Yürütme — MES Benzeri Sistem)

**Ana dosya:** `src/domain/execution-platform/execution-platform-service.ts` + 8 kardeş servis + 5 destek dosyası (toplam 14 dosya)

| # | Soru | Yanıt |
|---|---|---|
| 1 | **Amaç / Ekranlar** | Tam bir **MES (Manufacturing Execution System)** tarzı atölye takip sistemi: kesimden paketlemeye kadar bundle (bohça), operasyon, iş oturumu, kalite kapısı, WIP (üretimdeki iş) ve olay zaman çizelgesi takibi. 11 ekran: `/execution-platform/*` (Dashboard, Bundle Board, Operation Board, Work Session Monitor, Daily Entry, WIP Monitor, Quality Gate Console, Timeline, Split Console, Production Calendar, Brain Console). Ayrıca `/shop-floor/*` ve kalite yönetimi de bu tipleri kullanıyor. |
| 2 | **Veri modeli** | `ExecutionContext`, `Bundle` (11 durumlu barkod takipli kesim parçası), `OperationExecution` (7 durumlu operasyon rollup'ı), `OperationWorkSession` (operatör/makine/vardiya), `WipPosition`/`WipTransfer` (gerçek zamanlı üretimdeki iş takibi), `QualityGateEvaluation` (disposition-tabanlı iş kuralları), `ExecutionTimelineEvent` (30+ olay tipi). 10 adımlı kanonik tekstil operasyon rotası (CUT→PATTERN→...→PACK). |
| 3 | **Backend bağlantısı** | Tamamen in-memory. Sıfır HTTP çağrısı. Seed dosyası yok — kullanıcı arayüzü kullandıkça prosedürel olarak üretiliyor. |
| 4 | **Sipariş ilişkisi** | Gerçek backend'in **`ProductionEntry`** modelinin (stage, quantity, date, lineNo — düz log tablosu, Orders → "Üretim" sekmesinde kullanılıyor) çok daha ayrıntılı bir **üst kümesi**: aynı kavramsal alanı (stage≈operationCode, quantity≈completedQty) bundle-seviyesi takip, operasyon durum makineleri, gerçek zamanlı WIP, kalite kapıları ve olay zaman çizelgesiyle genişletiyor. Ama tamamen sahte katmanda — gerçek `ProductionEntry` tablosuna hiç dokunmuyor. **İki bağımsız, birbirinden habersiz üretim-takip implementasyonu** yan yana duruyor. |
| 5 | **Boyut/karmaşıklık** | **4.080 satır** (14 dosya) — incelenen modüller arasında en büyüğü, tipik bir kardeş domain modülünün 3-4 katı. Birden fazla etkileşimli durum makinesi (Bundle 11 durum, OperationExecution 7 durum, WorkSession 5 durum, WIP 5 durum), disposition→iş kuralı tablosu, 10 adımlı rota, gerçek zamanlı WIP yoğunluk hesabı, bundle split/merge/rollback mantığı. |
| 6 | **Efor tahmini** | **BÜYÜK — diğer tüm modüllerden belirgin şekilde daha kapsamlı.** ~8-10 yeni Prisma modeli gerektirir (mevcut tek düz `ProductionEntry` tablosunun yerine kapsamlı bir şema yeniden tasarımı). Durum geçişleri, kalite kapısı etkileri, WIP rollup'ları gibi mantığın sunucu tarafına atomik/transaction-güvenli şekilde taşınması gerekir. 11 sayfa × 9 servis dosyası yeniden bağlanmalı. Bu, "var olan bir ekranı gerçek API'ye bağlamak"tan çok **"gerçek bir MES backend'i inşa etmek"** ölçeğinde bir iş. |

---

## 5. Shipment (Sevkiyat)

**Dosya:** `src/domain/shipment/shipment-crud.service.ts`

| # | Soru | Yanıt |
|---|---|---|
| 1 | **Amaç / Ekranlar** | İhracat/sevkiyat lojistiğini modelliyor: rezervasyon → konteyner yükleme → sevk → transit → teslim → kapama (deniz yolu ihracat iş akışı). 8 durumlu makine (Draft→Booked→Loaded→Dispatched→InTransit→Delivered→Closed, +Cancelled). 5 ekran: Dashboard, List, Detail, Station (yeni sevkiyat formu), Containers (konteyner panosu) — `ShippingPages.tsx`. |
| 2 | **Veri modeli** | `ShipmentRecord` (shipmentNo, salesOrderId, packingListIds[], status, statusLog[], bookingNo, containerNo/Type, sealNo, vesselName, voyageNo, POL/POD, etd/eta, loadLines[], totals). `ShipmentLoadLine` (paket bazlı: SSCC, miktar, ağırlık/hacim). |
| 3 | **Backend bağlantısı** | Tamamen in-memory (`requireUnitOfWork().shipments`). Sıfır HTTP çağrısı hiçbir dosyada. |
| 4 | **Sipariş ilişkisi** | `querySalesOrderById` ile mock `SalesOrder`'a bağlı — gerçek backend `Order` modeliyle hiçbir ilgisi yok. **Önemli bulgu:** Gerçek backend'deki `Order.shipmentDate` alanı (sevkiyat/termin riski dashboard hesaplamalarında kullanılıyor) bu mock Shipment modülüyle **tamamen bağlantısız** — sadece isim benzerliği var. Her mutasyon audit log + enterprise timeline + outbox event olmak üzere 3 yan etki sistemine yayılıyor (hepsi yine in-memory). Stok çıkışı için `stock-ledger-crud.service.ts`'e tek yazma yolu üzerinden bağlı ("Architecture Freeze" olarak işaretlenmiş). |
| 5 | **Boyut/karmaşıklık** | Çekirdek + doğrudan bağımlılıklar **1.103 satır** (crud 433, types 138, packing-list-query 96, sales-order-query 41, UI 395) + application layer 6 dosya (sayılmadı). Orta karmaşıklık: küçük ama gerçek iş kuralları içeren FSM, optimistic concurrency, 3 yan-etki sistemi. |
| 6 | **Efor tahmini** | **BÜYÜK.** Gerçek backend'de Shipment/PackingList/konteyner/booking kavramı hiç yok — sadece `Order.shipmentDate` skaler alanı var. İlişkisel modelin (Shipment→LoadLines→PackingList→Packages) sıfırdan tasarlanması gerekir. Packing List ve gerçek anlamda kullanılabilir bir Sales Order'ın önce gerçek olması ön koşul olarak belirtiliyor. Kapsamı daraltıp sadece durum+tarih takibini gerçek `Order`'a bağlamak "orta" seviyeye indirir, ama mevcut özellik setiyle (koli/konteyner/envanter entegrasyonu) birebir eşleşmek büyük bir iş. |

---

## 6. Diğer `*-crud.service.ts` Modülleri (Hafif Tarama)

Tüm modüller `requireUnitOfWork` üzerinden aynı in-memory mimariyi kullanıyor — gerçek backend'e bağlantı yok.

| Modül | Amaç | Satır | Tüketen sayfa/modül | Boyut etiketi |
|---|---|---|---|---|
| `bom-crud.service.ts` | BOM (Ürün Ağacı) yazma yolu — Product Card alt varlığı | 434 | `src/modules/bom-designer` | Orta |
| `commercial-documents-crud.service.ts` | İhracat Belge Seti + Ticari Fatura CRUD, Shipment/PackingList okur | 566 | `src/modules/commercial-documents` | Büyük |
| `cost-sheet-crud.service.ts` | Maliyet Föyü yazma yolu (planlanan maliyet, BOM değişince yeniden hesap) | 473 | `src/modules/cost-sheet-designer` | Orta |
| `export-logistics-crud.service.ts` | İhracat Sevkiyatı orkestrasyonu — booking, konteyner, gümrük, gecikme tahmini | 555 | `src/modules/export-logistics` | Büyük |
| `finance-integration-crud.service.ts` | Muhasebe entegrasyonu — olay→yevmiye kaydı, GL eşleme, dönem kapama | 662 | `src/modules/finance-integration` | Büyük |
| `stock-ledger-crud.service.ts` | Değişmez envanter hareket defteri (mal kabul, çıkış, sevkiyat, transfer, rezervasyon) | 415 | `src/modules/inventory`, `warehouse-management` | Orta |
| `master-data-crud.service.ts` | Genel ana veri (lookup) CRUD | 207 | `src/modules/master-data` | Küçük |
| `product-card-crud.service.ts` | Ürün Kartı — kök varlık, tam okuma/yazma | 547 | `src/modules/product-card` + BOM/cost-sheet/sales-order tarafından referans | Orta |
| `planning-crud.service.ts` | Üretim planlama — mevcut Üretim Emri'nin plan alanlarını günceller (yeni varlık açmıyor) | 98 | `src/modules/production-planning` | Çok küçük |
| `goods-receipt-crud.service.ts` | Mal Kabul — PO → Depo → Envanter zinciri | 170 | `src/modules/inventory` | Küçük |
| `purchase-order-crud.service.ts` | Satın Alma Siparişi yaşam döngüsü | 454 | `src/modules/purchasing` | Orta |
| `purchase-request-crud.service.ts` | Satın Alma Talebi (MRP önerisinden de oluşturulabiliyor) | 170 | `src/modules/purchasing` | Küçük |
| `rfq-crud.service.ts` | Teklif Talebi + Tedarikçi Teklifi CRUD | 279 | `src/modules/purchasing` | Küçük |
| `sales-order-crud.service.ts` | **Mock "Sales Order" hub'ı** — 6 başka modül tarafından referans alınıyor (bkz. Bölüm 0) | 394 | `src/modules/orders` (mock taraf) | Orta |
| `style-closing-crud.service.ts` | Tekstil "stil kapama" — neredeyse tüm diğer domainleri salt-okunur kullanan checklist/skor modülü | 705 | `src/modules/style-closing` | Büyük |

---

## Genel Değerlendirme

**Toplam mock kod hacmi:** İncelenen 19 `*-crud.service.ts` dosyası + Execution Platform ailesi (9 ek dosya) + tip/query/application/UI dosyaları dahil **tahmini 20.000+ satır** — bu, gerçek backend'in tamamından (Orders modülü + destek servisleri) kat kat büyük bir kod tabanı.

**Ortak yapı:** Her modül aynı iskeleti tekrarlıyor — `requireUnitOfWork()` ile repository erişimi, optimistic concurrency (`expectedVersion`), idempotency key, audit log, enterprise timeline, outbox scheduler. Bu, kod kalitesi açısından tutarlı ve iyi tasarlanmış, ama **hiçbiri kalıcı veri tutmuyor.**

**"Gerçek yapmak" için iki farklı yol var:**
1. Her mock modülü gerçek backend'e (NestJS+Prisma) bağlamak — Orders modülünün yapıldığı gibi. Bu raporun efor tahminleri bu yolu varsayıyor.
2. Mevcut in-memory mimarinin zaten yarım bırakılmış PostgreSQL adaptörünü tamamlamak (`postgres-unit-of-work-factory.ts` — "Sprint 7 skeleton"). Bu, iş mantığını taşımadan sadece kalıcılık katmanını gerçek DB'ye bağlar; kapsam olarak daha dar ama mevcut mock veri modelini (Order/Material yerine SalesOrder/BOM/vb.) olduğu gibi kalıcı hale getirir — gerçek backend'deki mevcut `Order`/`Material` şemasıyla **birleştirme gerektirmez**, paralel bir sistem olarak kalır.

**Bağımlılık sıralaması (gerçek backend'e taşıma önceliği açısından):**
Sales Order (hub) → Product Card/BOM/Cost Sheet → Stock Ledger/Purchasing → MRP → Packing List → Shipment/Export Logistics/Commercial Docs → Cost Closing/Style Closing/Finance Integration. Execution Platform bağımsız ama en büyük tekil iştir.

**Boyut sıralaması (küçükten büyüğe, efor tahmini):**
Küçük: `planning-crud`, `goods-receipt-crud`, `purchase-request-crud`, `rfq-crud`, `master-data-crud`
Orta: `bom-crud`, `cost-sheet-crud`, `stock-ledger-crud`, `product-card-crud`, `purchase-order-crud`, `sales-order-crud`, Packing List, Cost Closing
Büyük: `commercial-documents-crud`, `export-logistics-crud`, `finance-integration-crud`, `style-closing-crud`, MRP, Shipment
Çok Büyük: **Execution Platform** (diğerlerinin 3-4 katı, ayrı MES-inşası ölçeğinde)
