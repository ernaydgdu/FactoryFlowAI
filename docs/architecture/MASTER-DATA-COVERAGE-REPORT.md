# Kepler ERP — Master Data Coverage Report

**Generated:** 2026-08-02T13:41:51.814Z
**Total Entities:** 308
**Active Entities:** 308
**Repositories:** 40
**Textile Master Data Complete:** ✅ YES

| Entity | Label | Total | Active | Versioned | Localized | Sample Codes |
|--------|-------|-------|--------|-----------|-----------|--------------|
| country | Ülke | 7 | 7 | 7 | 0 | TR, ES, IN, CN, BD |
| currency | Para Birimi | 5 | 5 | 5 | 0 | USD, EUR, TRY, GBP, CNY |
| customer | Müşteri | 8 | 8 | 8 | 0 | LCW, DEF, KOT, MAV, PEN |
| brand | Marka | 8 | 8 | 8 | 0 | LCW, DEF, KOT, MAV, PEN |
| buyer | Buyer | 5 | 5 | 5 | 0 | BUY-SM, BUY-JK, BUY-AO, BUY-MC, BUY-EL |
| merchandiser | Merchandiser | 4 | 4 | 4 | 0 | MER-ZA, MER-CD, MER-ES, MER-PT |
| supplier | Tedarikçi | 7 | 7 | 7 | 0 | ARVIND, BOSSA, ISKO, YKK, LABELPRO |
| warehouse | Depo | 18 | 18 | 18 | 0 | GRP-HMD, HMD-01, GRP-KMS, KMS-01, GRP-AKS |
| workshop | Atölye | 3 | 3 | 3 | 0 | FSN-A, FSN-B, FSN-C |
| seasonType | Sezon Tipi | 6 | 6 | 6 | 6 | SS, AW, HOLIDAY, BASIC, NOS |
| season | Sezon | 5 | 5 | 5 | 0 | SS26, AW26, CORE, RES26, NOS |
| collection | Koleksiyon | 4 | 4 | 4 | 0 | CORE, PREMIUM, BASICS, DENIM |
| productGroup | Ürün Grubu | 26 | 26 | 26 | 0 | TSHIRT, POLO, SWEATSHIRT, HOODIE, PANTOLON |
| subProductGroup | Alt Ürün Grubu | 6 | 6 | 6 | 0 | BASIC, FASHION, PREMIUM, CORE, DENIM |
| sizeSet | Beden Seti | 7 | 7 | 7 | 0 | SS-TSHIRT, SS-POLO, SS-PANT, SS-JEAN, SS-BABY |
| colorCard | Renk Kartı | 8 | 8 | 8 | 0 | INDIGO, BLACK, WHITE, STONE, NAVY |
| fabricType | Kumaş Tipi | 20 | 20 | 20 | 0 | SINGLE_JERSEY, INTERLOCK, RIB, PIQUE, FLEECE |
| fabricComposition | Kompozisyon | 9 | 9 | 9 | 0 | C100, C95E5, C97E3, P100, P65C35 |
| accessoryCategory | Aksesuar Tipi | 17 | 17 | 17 | 0 | ZIPPER, BUTTON, SNAP, INTERLIN, LABEL |
| accessoryType | Aksesuar Alt Tipi | 8 | 8 | 8 | 0 | YKK-5MM, SHANK-BTN, MAIN-LBL, CARE-LBL, CORE-120 |
| operation | Operasyon | 12 | 12 | 12 | 0 | CUT, PATTERN, NUMBER, SEW, OVERLOCK |
| productionLine | Üretim Hattı | 6 | 6 | 6 | 0 | LINE-1, LINE-2, LINE-3, LINE-4, LINE-5 |
| machineType | Makine Tipi | 10 | 10 | 10 | 10 | FLAT, OVERLOCK, HEM, BUTTONHOLE, BUTTON |
| machine | Makine | 5 | 5 | 5 | 0 | OVL-1, FLAT-1, OVL-2, BTN-2, IRN-3 |
| qualityCode | Kalite Kodu | 7 | 7 | 7 | 7 | MAJOR, MINOR, CRITICAL, AQL, REPAIR |
| warehouseType | Depo Tipi | 11 | 11 | 11 | 11 | RAW_MAT, FABRIC, ACCESSORY, CUTTING, WORKSHOP |
| unit | Birim | 9 | 9 | 9 | 9 | PCS, METER, KG, ROLL, BUNDLE |
| gender | Gender | 5 | 5 | 5 | 5 | M, F, U, C, B |
| ageGroup | Age Group | 5 | 5 | 5 | 5 | ADULT, TEEN, CHILD, BABY, ALL |
| fit | Fit | 4 | 4 | 4 | 4 | SLIM, REGULAR, RELAX, OVERSIZE |
| washType | Yıkama Tipi | 6 | 6 | 6 | 6 | GARMENT, STONE, ENZYME, ACID, SILICONE |
| printType | Baskı Tipi | 9 | 9 | 9 | 9 | SCREEN, DIGITAL, TRANSFER, REFLECTIVE, EMBOSS |
| embroideryType | Nakış | 5 | 5 | 5 | 5 | FLAT, 3D, CHENILLE, PATCH, NONE |
| gtipCode | GTIP | 5 | 5 | 5 | 0 | 610910, 620342, 620462, 620192, 611030 |
| employee | Çalışan | 5 | 5 | 5 | 0 | EMP-AK, EMP-MT, EMP-ES, EMP-PL, EMP-QC |
| transportCompany | Taşıyıcı | 5 | 5 | 5 | 0 | MAERSK, MSC, CMA, ARKAS, DHL |
| forwarder | Forwarder | 3 | 3 | 3 | 0 | FWD-MAE, FWD-ARK, FWD-DHL |
| containerType | Konteyner Tipi | 3 | 3 | 3 | 0 | 20FT, 40FT, 40HC |
| incoterm | Incoterm | 6 | 6 | 6 | 0 | EXW, FCA, FOB, CIF, DAP |
| paymentTerm | Ödeme Şekli | 6 | 6 | 6 | 0 | CASH, NET30, NET60, NET90, LC |

---

## Kurallar Uyumu

| Kural | Durum |
|-------|-------|
| Kod + açıklama | ✅ Tüm entity'lerde |
| Active / Passive | ✅ status alanı |
| Version | ✅ version: 1 |
| Localization | ✅ tr/en lookup entity'lerde |
| UI hardcoded string yok | ✅ ui-options repository'den |
| Brain Knowledge Graph | ✅ master-data-adapter genişletildi |
| Product Card / BOM servis değişmedi | ✅ textile-lookups backward compat |
| Build | ✅ PASS |
| Validation | ✅ 6 PASS, 0 GAP |
