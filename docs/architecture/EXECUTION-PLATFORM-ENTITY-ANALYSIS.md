# Execution Platform — Entity Analysis (Sprint 3 Domain Core)

**Generated:** 2026-08-02  
**Authority:** Kod öncesi zorunlu analiz  
**Bundle referans:** PBS (Progressive Bundle System), Scan ERP/CMT standard, Infor M3 PMS070, SAP Fashion confirmation, Lectra/Gerber cut-to-bundle handoff

---

## Bundle Industry Synthesis (Kopyalama Değil)

| Kaynak | Prensipler sentezlenen |
|--------|------------------------|
| **Infor M3 / System21** | Bundle ticket types, WIP location stock, order progress by bundle |
| **SAP Fashion** | Operation confirmation, variant (color/size), subcontract step |
| **Lectra/Gerber** | Cut batch → numbered bundles → sewing handoff |
| **CMT/PBS endüstri** | STYLE-LOT-COLOR-SIZE-SEQ-COMPONENT; component marriage; scan start/stop |
| **Kepler standard** | `KPL-BUNDLE-V1` barcode; component codes FRT/BK/SLV/CLR; assemblyGroupId |

---

## Entity 1: ExecutionContext

| Soru | Cevap |
|------|-------|
| Fiziksel nesne | Bir UE'nin shop floor'daki **yürütme oturumu** — "bu emir fabrikada nasıl işleniyor" |
| Yaşam döngüsü | NotStarted → Active → Paused → Completed |
| Kim oluşturur | Planlama / UE Released sonrası sistem (initialize) |
| Kim günceller | Operasyon olayları (start/complete), split, gate |
| Kim okur | Brain, Twin, Planlama, Fabrika Müdürü |
| BR | BR-05 (entry context), BR-11 (split child context) |
| Brain | WIP yoğunluğu, termin projeksiyonu için root key |
| Twin | Senaryo scope entity (hat durdu, split) |

---

## Entity 2: OperationExecution

| Soru | Cevap |
|------|-------|
| Fiziksel nesne | Routing'deki **tek operasyon adımının fabrika gerçekleşmesi** (Kesim, Dikim, QC…) |
| Yaşam döngüsü | Pending → Ready → Waiting → InProgress → Paused → Completed \| Blocked |
| Kim oluşturur | initializeExecutionPlatform (route snapshot'tan) |
| Kim günceller | Hat Şefi (start/pause), Operatör girişi (complete qty), Quality (block) |
| Kim okur | Brain (darboğaz), Twin (operasyon gecikme) |
| BR | BR-05/06/07 (daily entry complete), BR-13 (rework block) |
| Brain | Operasyon verimi, gecikme nedeni, hat darboğazı |
| Twin | OPERATION_DELAY, MACHINE_BREAKDOWN parametreleri |

---

## Entity 3: Bundle

| Soru | Cevap |
|------|-------|
| Fiziksel nesne | Kesimhane çıkışı **numaralı kumaş/parça demeti** (10–30 adet tipik) |
| Yaşam döngüsü | Created → Labeled → Issued → InTransit → AtOperation → OnHold → Completed → Scrapped |
| Kim oluşturur | Kesimhane (NUMBER sonrası) — domain: createBundlesFromMatrix |
| Kim günceller | Hat operatörü (scan/move), Kalite (hold), Depo (issue) |
| Kim okur | Brain (bekleme süresi), Twin (bundle wait) |
| BR | BR-07 (workshop remaining on consumption path) |
| Brain | Bundle bekleme, cut-to-sew oranı |
| Twin | BUNDLE_WAIT senaryosu |

**10-yıl dayanıklılık:** componentCode (FRT/BK/SLV), assemblyGroupId (marriage), formatVersion, metadata bag.

---

## Entity 4: BundleTicket

| Soru | Cevap |
|------|-------|
| Fiziksel nesne | Bundle'a yapıştırılan **QR/termal etiket** (kimlik belgesi) |
| Yaşam döngüsü | Draft → Printed → Void (reprint) |
| Kim oluşturur | Kesimhane / etiket yazıcı |
| Kim günceller | Reprint → yeni ticketVersion |
| Kim okur | Operatör scan, Brain audit |
| BR | Yok (identity document) |
| Brain | Traceability evidence |
| Twin | N/A |

---

## Entity 5: WipPosition

| Soru | Cevap |
|------|-------|
| Fiziksel nesne | Belirli operasyonda/kuyrukta bekleyen **iş miktarı** (adet veya bundle) |
| Yaşam döngüsü | Materialized snapshot — Queued \| InProcess \| WaitingQC \| Blocked |
| Kim oluşturur | Sistem (transfer/scan event sonrası rebuild) |
| Kim günceller | WIP engine query (event-driven rebuild) |
| Kim okur | Brain READ ONLY, Planlama |
| BR | Yok (derived state) |
| Brain | WIP yoğunluğu, hat yükü |
| Twin | WIP buildup simülasyonu |

---

## Entity 6: WipTransfer

| Soru | Cevap |
|------|-------|
| Fiziksel nesne | Bundle/adet **operasyonlar arası fiziksel hareket** kaydı |
| Yaşam döngüsü | Immutable event (Forward \| Rework \| Scrap) |
| Kim oluşturur | Operatör scan / Hat Şefi transfer |
| Kim günceller | Kimse (append-only) |
| Kim okur | Brain, Timeline, Audit |
| BR | BR-05 downstream |
| Brain | Flow velocity, bekleme analizi |
| Twin | Transfer delay impact |

---

## Entity 7: OperationDailyEntry

| Soru | Cevap |
|------|-------|
| Fiziksel nesne | Vardiya sonu **operasyon gerçekleşme kaydı** (tally sheet dijital hali) |
| Yaşam döngüsü | Draft → Posted (immutable) |
| Kim oluşturur | Operatör / Hat Şefi |
| Kim günceller | Post sonrası değişmez |
| Kim okur | Maliyet, Brain, Planlama |
| BR | BR-05 + BR-06 + BR-07 (posted时) |
| Brain | Fire anomalisi, verim trendi |
| Twin | QUALITY_WASTE_SPIKE input |

---

## Entity 8: QualityGateEvaluation

| Soru | Cevap |
|------|-------|
| Fiziksel nesne | Inline/Midline/Final **geçiş izni kararı** |
| Yaşam döngüsü | Pending → Pass \| Fail \| Waived |
| Kim oluşturur | Kalite müdürü / inspection sistemi |
| Kim günceller | Re-inspection → yeni evaluation |
| Kim okur | OperationExecution (block/unblock), Brain |
| BR | BR-13 (Fail → rework) |
| Brain | Kalite risk, rework yoğunluğu |
| Twin | QUALITY_REJECT senaryosu |

---

## Entity 9: ExecutionTimelineEvent

| Soru | Cevap |
|------|-------|
| Fiziksel nesne | Shop floor **olay günlüğü** (status değil, gerçek olay) |
| Yaşam döngüsü | Append-only |
| Kim oluşturur | Tüm execution servisleri (platform delegate) |
| BR | Yok (audit) |
| Brain | Timeline evidence |
| Twin | Root cause input |

---

## Entity 10: SplitExecutionRecord

| Soru | Cevap |
|------|-------|
| Fiziksel nesne | Parent UE → child UE **bölünmüş yürütme** |
| Yaşam döngüsü | Planned → BR11Applied → Active → Completed |
| Kim oluşturur | Planlama (split kararı) |
| BR | BR-11-PRODUCTION-SPLIT |
| Brain | Split önerisi, kapasite |
| Twin | Split reallocasyon |

---

## Textile Execution Route (Canonical)

```
CUT → PATTERN → NUMBER → [Bundle Create] → SEW → OVERLOCK → HEM
  → [Inline Gate] → WASH → [Midline Gate] → IRON → [Final Gate] → PACK → FG
```

Quality gates block **next operation** until Pass.
