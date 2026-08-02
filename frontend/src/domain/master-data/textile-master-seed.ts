/**
 * Textile Master Data Seed — profesyonel tekstil ERP referans verileri.
 * Kod + açıklama, Active/Passive, version, localization desteği.
 */
import {
  createAccessoryCategory,
  createAccessoryType,
  createAgeGroup,
  createEmbroideryType,
  createFabricComposition,
  createFabricType,
  createFit,
  createGender,
  createGtipCode,
  createIncoterm,
  createMachineType,
  createOperation,
  createPaymentTerm,
  createPrintType,
  createProductGroup,
  createProductionLine,
  createQualityCode,
  createSeasonType,
  createSubProductGroup,
  createUnit,
  createWarehouseTypeMaster,
  createWashType,
} from './factory'

type SeedItem = {
  code: string
  name: string
  description?: string
  enName?: string
}

// ─── Ürün Grupları ────────────────────────────────────────────────

const PRODUCT_GROUP_ITEMS: SeedItem[] = [
  { code: 'TSHIRT', name: 'T-Shirt', enName: 'T-Shirt' },
  { code: 'POLO', name: 'Polo', enName: 'Polo' },
  { code: 'SWEATSHIRT', name: 'Sweatshirt', enName: 'Sweatshirt' },
  { code: 'HOODIE', name: 'Hoodie', enName: 'Hoodie' },
  { code: 'PANTOLON', name: 'Pantolon', enName: 'Trousers' },
  { code: 'JEAN', name: 'Jean', enName: 'Jeans' },
  { code: 'SHORT', name: 'Şort', enName: 'Shorts' },
  { code: 'ESOFMAN', name: 'Eşofman', enName: 'Tracksuit' },
  { code: 'GOMLEK', name: 'Gömlek', enName: 'Shirt' },
  { code: 'CEKET', name: 'Ceket', enName: 'Jacket' },
  { code: 'MONT', name: 'Mont', enName: 'Coat' },
  { code: 'YELEK', name: 'Yelek', enName: 'Vest' },
  { code: 'ELBISE', name: 'Elbise', enName: 'Dress' },
  { code: 'ETEK', name: 'Etek', enName: 'Skirt' },
  { code: 'BLUZ', name: 'Bluz', enName: 'Blouse' },
  { code: 'TAYT', name: 'Tayt', enName: 'Leggings' },
  { code: 'PIJAMA', name: 'Pijama', enName: 'Pajamas' },
  { code: 'IC_GIYIM', name: 'İç Giyim', enName: 'Underwear' },
  { code: 'CORAP', name: 'Çorap', enName: 'Socks' },
  { code: 'SAPKA', name: 'Şapka', enName: 'Cap' },
  { code: 'CANTA', name: 'Çanta', enName: 'Bag' },
  { code: 'AKSESUAR', name: 'Aksesuar', enName: 'Accessory' },
  { code: 'AYAKKABI', name: 'Ayakkabı', enName: 'Footwear' },
  { code: 'BEBEK', name: 'Bebek', enName: 'Baby' },
  { code: 'COCUK', name: 'Çocuk', enName: 'Kids' },
  { code: 'DIGER', name: 'Diğer', enName: 'Other' },
]

export const TEXTILE_PRODUCT_GROUPS = PRODUCT_GROUP_ITEMS.map((item) =>
  createProductGroup({
    id: `pg-${item.code.toLowerCase()}`,
    code: item.code,
    name: item.name,
    description: item.description ?? item.name,
    localization: {
      tr: { name: item.name, description: item.description ?? item.name },
      en: { name: item.enName ?? item.name, description: item.description ?? item.name },
    },
  }),
)

export const TEXTILE_SUB_PRODUCT_GROUPS = [
  createSubProductGroup({ id: 'spg-basic', code: 'BASIC', name: 'Basic', productGroupId: 'pg-tshirt', description: 'Temel model' }),
  createSubProductGroup({ id: 'spg-fashion', code: 'FASHION', name: 'Fashion', productGroupId: 'pg-polo', description: 'Moda model' }),
  createSubProductGroup({ id: 'spg-premium', code: 'PREMIUM', name: 'Premium', productGroupId: 'pg-hoodie', description: 'Premium segment' }),
  createSubProductGroup({ id: 'spg-core', code: 'CORE', name: 'Core', productGroupId: 'pg-sweatshirt', description: 'Core koleksiyon' }),
  createSubProductGroup({ id: 'spg-denim', code: 'DENIM', name: 'Denim', productGroupId: 'pg-jean', description: 'Denim segment' }),
  createSubProductGroup({ id: 'spg-knit', code: 'KNIT', name: 'Knitwear', productGroupId: 'pg-sweatshirt', description: 'Örme segment' }),
]

// ─── Kumaş Tipleri ────────────────────────────────────────────────

export const TEXTILE_FABRIC_TYPES = [
  { code: 'SINGLE_JERSEY', name: 'Single Jersey', enName: 'Single Jersey' },
  { code: 'INTERLOCK', name: 'Interlock', enName: 'Interlock' },
  { code: 'RIB', name: 'Rib', enName: 'Rib' },
  { code: 'PIQUE', name: 'Pique', enName: 'Pique' },
  { code: 'FLEECE', name: 'Fleece', enName: 'Fleece' },
  { code: 'FRENCH_TERRY', name: 'French Terry', enName: 'French Terry' },
  { code: 'POPLIN', name: 'Poplin', enName: 'Poplin' },
  { code: 'OXFORD', name: 'Oxford', enName: 'Oxford' },
  { code: 'GABARDIN', name: 'Gabardin', enName: 'Gabardine' },
  { code: 'DENIM', name: 'Denim', enName: 'Denim' },
  { code: 'TWILL', name: 'Twill', enName: 'Twill' },
  { code: 'CANVAS', name: 'Canvas', enName: 'Canvas' },
  { code: 'SATEN', name: 'Saten', enName: 'Satin' },
  { code: 'VISCON', name: 'Viscon', enName: 'Viscose' },
  { code: 'LINEN', name: 'Linen', enName: 'Linen' },
  { code: 'MUSLIN', name: 'Muslin', enName: 'Muslin' },
  { code: 'POLAR', name: 'Polar', enName: 'Polar Fleece' },
  { code: 'SOFTSHELL', name: 'Softshell', enName: 'Softshell' },
  { code: 'MESH', name: 'Mesh', enName: 'Mesh' },
  { code: 'DIGER', name: 'Diğer', enName: 'Other' },
].map((item) =>
  createFabricType({
    id: `ft-${item.code.toLowerCase()}`,
    code: item.code,
    name: item.name,
    description: item.name,
    localization: {
      tr: { name: item.name },
      en: { name: item.enName ?? item.name },
    },
  }),
)

// ─── Kompozisyon ──────────────────────────────────────────────────

export const TEXTILE_FABRIC_COMPOSITIONS = [
  { code: 'C100', name: '100 Cotton', fiber: '100% Pamuk' },
  { code: 'C95E5', name: '95 Cotton 5 Elastane', fiber: '95% Pamuk 5% Elastan' },
  { code: 'C97E3', name: '97 Cotton 3 Elastane', fiber: '97% Pamuk 3% Elastan' },
  { code: 'P100', name: '100 Polyester', fiber: '100% Polyester' },
  { code: 'P65C35', name: '65 Polyester 35 Cotton', fiber: '65% Polyester 35% Pamuk' },
  { code: 'V100', name: '100 Viscose', fiber: '100% Viskon' },
  { code: 'L100', name: '100 Linen', fiber: '100% Keten' },
  { code: 'M100', name: '100 Modal', fiber: '100% Modal' },
  { code: 'MIX', name: 'Karışımlar', fiber: 'Özel karışım' },
].map((item) =>
  createFabricComposition({
    id: `fc-${item.code.toLowerCase()}`,
    code: item.code,
    name: item.name,
    fiberContent: item.fiber,
    description: item.fiber,
  }),
)

// ─── Yıkama / Baskı / Nakış ───────────────────────────────────────

export const TEXTILE_WASH_TYPES = [
  { code: 'GARMENT', name: 'Garment Wash', enName: 'Garment Wash' },
  { code: 'STONE', name: 'Stone Wash', enName: 'Stone Wash' },
  { code: 'ENZYME', name: 'Enzyme Wash', enName: 'Enzyme Wash' },
  { code: 'ACID', name: 'Acid Wash', enName: 'Acid Wash' },
  { code: 'SILICONE', name: 'Silicone Wash', enName: 'Silicone Wash' },
  { code: 'NO_WASH', name: 'No Wash', enName: 'No Wash' },
].map((item) => createWashType({ id: `wash-${item.code.toLowerCase()}`, code: item.code, name: item.name, description: item.enName }))

export const TEXTILE_PRINT_TYPES = [
  { code: 'SCREEN', name: 'Screen Print', enName: 'Screen Print' },
  { code: 'DIGITAL', name: 'Digital Print', enName: 'Digital Print' },
  { code: 'TRANSFER', name: 'Transfer', enName: 'Transfer' },
  { code: 'REFLECTIVE', name: 'Reflective', enName: 'Reflective' },
  { code: 'EMBOSS', name: 'Emboss', enName: 'Emboss' },
  { code: 'FOIL', name: 'Foil', enName: 'Foil' },
  { code: 'HD', name: 'High Density', enName: 'High Density' },
  { code: 'PUFF', name: 'Puff', enName: 'Puff' },
  { code: 'NONE', name: 'None', enName: 'None' },
].map((item) => createPrintType({ id: `prt-${item.code.toLowerCase()}`, code: item.code, name: item.name, description: item.enName }))

export const TEXTILE_EMBROIDERY_TYPES = [
  { code: 'FLAT', name: 'Flat', enName: 'Flat' },
  { code: '3D', name: '3D', enName: '3D' },
  { code: 'CHENILLE', name: 'Chenille', enName: 'Chenille' },
  { code: 'PATCH', name: 'Patch', enName: 'Patch' },
  { code: 'NONE', name: 'None', enName: 'None' },
].map((item) => createEmbroideryType({ id: `emb-${item.code.toLowerCase()}`, code: item.code, name: item.name, description: item.enName }))

// ─── Gender / Age / Fit ───────────────────────────────────────────

export const TEXTILE_GENDERS = [
  { code: 'M', name: 'Erkek', enName: 'Male' },
  { code: 'F', name: 'Kadın', enName: 'Female' },
  { code: 'U', name: 'Unisex', enName: 'Unisex' },
  { code: 'C', name: 'Çocuk', enName: 'Child' },
  { code: 'B', name: 'Bebek', enName: 'Baby' },
].map((item) => createGender({ id: `gen-${item.code.toLowerCase()}`, code: item.code, name: item.name, description: item.enName }))

export const TEXTILE_AGE_GROUPS = [
  { code: 'ADULT', name: 'Yetişkin', enName: 'Adult' },
  { code: 'TEEN', name: 'Genç', enName: 'Teen' },
  { code: 'CHILD', name: 'Çocuk', enName: 'Child' },
  { code: 'BABY', name: 'Bebek', enName: 'Baby' },
  { code: 'ALL', name: 'Tüm Yaş', enName: 'All Ages' },
].map((item) => createAgeGroup({ id: `age-${item.code.toLowerCase()}`, code: item.code, name: item.name, description: item.enName }))

export const TEXTILE_FITS = [
  { code: 'SLIM', name: 'Slim', enName: 'Slim' },
  { code: 'REGULAR', name: 'Regular', enName: 'Regular' },
  { code: 'RELAX', name: 'Relax', enName: 'Relaxed' },
  { code: 'OVERSIZE', name: 'Oversize', enName: 'Oversize' },
].map((item) => createFit({ id: `fit-${item.code.toLowerCase()}`, code: item.code, name: item.name, description: item.enName }))

// ─── GTIP ─────────────────────────────────────────────────────────

export const TEXTILE_GTIP_CODES = [
  { code: '610910', name: 'T-shirt cotton', hsCode: '6109.10', description: 'Pamuklu tişört' },
  { code: '620342', name: 'Men trousers cotton', hsCode: '6203.42', description: 'Erkek pamuklu pantolon' },
  { code: '620462', name: 'Women trousers cotton', hsCode: '6204.62', description: 'Kadın pamuklu pantolon' },
  { code: '620192', name: 'Coats padded', hsCode: '6201.92', description: 'Mont/kaban' },
  { code: '611030', name: 'Jersey pullover', hsCode: '6110.30', description: 'Sweatshirt/hoodie' },
].map((item) =>
  createGtipCode({
    id: `gtip-${item.code}`,
    code: item.code,
    name: item.name,
    hsCode: item.hsCode,
    description: item.description,
  }),
)

// ─── Operasyonlar ─────────────────────────────────────────────────

export const TEXTILE_OPERATIONS = [
  { code: 'CUT', name: 'Kesim', dept: 'Kesimhane', seq: 10, min: 0.5 },
  { code: 'PATTERN', name: 'Pastal', dept: 'Kesimhane', seq: 15, min: 1 },
  { code: 'NUMBER', name: 'Numaralama', dept: 'Kesimhane', seq: 18, min: 0.3 },
  { code: 'SEW', name: 'Dikim', dept: 'Dikim', seq: 20, min: 18 },
  { code: 'OVERLOCK', name: 'Overlok', dept: 'Dikim', seq: 25, min: 2 },
  { code: 'HEM', name: 'Reçme', dept: 'Dikim', seq: 28, min: 1.5 },
  { code: 'IRON', name: 'Ütü', dept: 'Ütü Paket', seq: 40, min: 3 },
  { code: 'WASH', name: 'Yıkama', dept: 'Yıkama', seq: 30, min: 0 },
  { code: 'QC', name: 'Kalite', dept: 'Kalite', seq: 60, min: 1.5 },
  { code: 'PACK', name: 'Paketleme', dept: 'Ütü Paket', seq: 50, min: 2 },
  { code: 'METAL', name: 'Metal Dedektör', dept: 'Kalite', seq: 65, min: 0.2 },
  { code: 'SHIP', name: 'Sevkiyat', dept: 'Lojistik', seq: 70, min: 0.5 },
].map((item) =>
  createOperation({
    id: `op-${item.code.toLowerCase()}`,
    code: item.code,
    name: item.name,
    department: item.dept,
    sequence: item.seq,
    standardMinutes: item.min,
    description: item.name,
  }),
)

// ─── Üretim Hatları ───────────────────────────────────────────────

export const TEXTILE_PRODUCTION_LINES = [1, 2, 3, 4, 5, 6].map((n) =>
  createProductionLine({
    id: `pl-${n}`,
    code: `LINE-${n}`,
    name: `Hat ${n}`,
    workshopId: 'wsh-a',
    capacityPerDay: 400 + n * 10,
    description: `Üretim hattı ${n}`,
    localization: { tr: { name: `Hat ${n}` }, en: { name: `Line ${n}` } },
  }),
)

// ─── Makine Tipleri ───────────────────────────────────────────────

export const TEXTILE_MACHINE_TYPES = [
  { code: 'FLAT', name: 'Düz Makine', enName: 'Flat Machine' },
  { code: 'OVERLOCK', name: 'Overlok', enName: 'Overlock' },
  { code: 'HEM', name: 'Reçme', enName: 'Hemming' },
  { code: 'BUTTONHOLE', name: 'İlik', enName: 'Buttonhole' },
  { code: 'BUTTON', name: 'Düğme', enName: 'Button Attach' },
  { code: 'BARTACK', name: 'Bartek', enName: 'Bartack' },
  { code: 'AUTO', name: 'Otomat', enName: 'Automatic' },
  { code: 'CUT', name: 'Kesim', enName: 'Cutting' },
  { code: 'PRESS', name: 'Pres', enName: 'Press' },
  { code: 'IRON', name: 'Ütü', enName: 'Iron' },
].map((item) =>
  createMachineType({
    id: `mct-${item.code.toLowerCase()}`,
    code: item.code,
    name: item.name,
    description: item.enName,
    localization: { tr: { name: item.name }, en: { name: item.enName } },
  }),
)

// ─── Kalite Kodları ───────────────────────────────────────────────

export const TEXTILE_QUALITY_CODES = [
  { code: 'MAJOR', name: 'Major', severityCode: 'Major', severity: 'Major' as const },
  { code: 'MINOR', name: 'Minor', severityCode: 'Minor', severity: 'Minor' as const },
  { code: 'CRITICAL', name: 'Critical', severityCode: 'Critical', severity: 'Critical' as const },
  { code: 'AQL', name: 'AQL', severityCode: 'Process', severity: 'Process' as const },
  { code: 'REPAIR', name: 'Repair', severityCode: 'Process', severity: 'Process' as const },
  { code: 'REJECT', name: 'Reject', severityCode: 'Critical', severity: 'Critical' as const },
  { code: 'SECOND', name: 'Second Quality', severityCode: 'Minor', severity: 'Minor' as const },
].map((item) =>
  createQualityCode({
    id: `qc-${item.code.toLowerCase()}`,
    code: item.code,
    name: item.name,
    severityCode: item.severityCode,
    severity: item.severity,
    description: item.name,
  }),
)

// ─── Depo Tipleri ─────────────────────────────────────────────────

export const TEXTILE_WAREHOUSE_TYPES = [
  { code: 'RAW_MAT', name: 'Raw Material', legacy: 'Hammadde' as const },
  { code: 'FABRIC', name: 'Fabric', legacy: 'Kumaş' as const },
  { code: 'ACCESSORY', name: 'Accessory', legacy: 'Aksesuar' as const },
  { code: 'CUTTING', name: 'Cutting', legacy: 'Kesimhane' as const },
  { code: 'WORKSHOP', name: 'Workshop', legacy: 'Fason' as const },
  { code: 'WASHING', name: 'Washing', legacy: 'Yıkama' as const },
  { code: 'FG', name: 'Finished Goods', legacy: 'Mamül' as const },
  { code: 'RETURN', name: 'Return', legacy: 'İade' as const },
  { code: 'SCRAP', name: 'Scrap', legacy: 'Fire' as const },
  { code: 'SAMPLE', name: 'Sample', legacy: 'Numune' as const },
  { code: 'TRANSIT', name: 'Transit', legacy: 'Hammadde' as const },
].map((item) =>
  createWarehouseTypeMaster({
    id: `wht-${item.code.toLowerCase()}`,
    code: item.code,
    name: item.name,
    legacyType: item.legacy,
    description: item.name,
  }),
)

// ─── Aksesuar Tipleri (kategori) ──────────────────────────────────

export const TEXTILE_ACCESSORY_CATEGORIES = [
  { code: 'ZIPPER', name: 'Fermuar' },
  { code: 'BUTTON', name: 'Düğme' },
  { code: 'SNAP', name: 'Çıtçıt' },
  { code: 'INTERLIN', name: 'Tela' },
  { code: 'LABEL', name: 'Etiket' },
  { code: 'WOVEN_LBL', name: 'Dokuma Etiket' },
  { code: 'CARTON_LBL', name: 'Karton Etiket' },
  { code: 'HANGTAG', name: 'Hangtag' },
  { code: 'THREAD', name: 'İplik' },
  { code: 'ELASTIC', name: 'Lastik' },
  { code: 'CORD', name: 'Kordon' },
  { code: 'STOPPER', name: 'Stopper' },
  { code: 'POLYBAG', name: 'Polybag' },
  { code: 'CARTON', name: 'Koli' },
  { code: 'STICKER', name: 'Sticker' },
  { code: 'BARCODE', name: 'Barkod' },
  { code: 'HANGER', name: 'Askı' },
].map((item) =>
  createAccessoryCategory({
    id: `ac-${item.code.toLowerCase()}`,
    code: item.code,
    name: item.name,
    description: item.name,
  }),
)

export const TEXTILE_ACCESSORY_TYPES = [
  createAccessoryType({ id: 'at-ykk5', code: 'YKK-5MM', name: 'YKK Metal Zipper 5mm', categoryId: 'ac-zipper', description: 'Metal fermuar' }),
  createAccessoryType({ id: 'at-shank', code: 'SHANK-BTN', name: 'Metal Shank Button', categoryId: 'ac-button', description: 'Metal düğme' }),
  createAccessoryType({ id: 'at-main', code: 'MAIN-LBL', name: 'Woven Main Label', categoryId: 'ac-woven_lbl', description: 'Ana dokuma etiket' }),
  createAccessoryType({ id: 'at-care', code: 'CARE-LBL', name: 'Care Label', categoryId: 'ac-label', description: 'Yıkama talimatı' }),
  createAccessoryType({ id: 'at-core', code: 'CORE-120', name: 'Core Spun Thread 120', categoryId: 'ac-thread', description: 'İplik 120 Ne' }),
  createAccessoryType({ id: 'at-poly', code: 'POLYBAG', name: 'Polybag 30x40', categoryId: 'ac-polybag', description: 'Polybag ambalaj' }),
  createAccessoryType({ id: 'at-hang', code: 'HANGTAG', name: 'Standard Hangtag', categoryId: 'ac-hangtag', description: 'Askı kartı' }),
  createAccessoryType({ id: 'at-snap', code: 'SNAP-12', name: 'Snap 12mm', categoryId: 'ac-snap', description: 'Çıtçıt 12mm' }),
]

// ─── Birimler ─────────────────────────────────────────────────────

export const TEXTILE_UNITS = [
  { code: 'PCS', name: 'Adet', symbol: 'ad' },
  { code: 'METER', name: 'Metre', symbol: 'm' },
  { code: 'KG', name: 'Kilogram', symbol: 'kg' },
  { code: 'ROLL', name: 'Top', symbol: 'top' },
  { code: 'BUNDLE', name: 'Rulo', symbol: 'rulo' },
  { code: 'PACK', name: 'Paket', symbol: 'pkt' },
  { code: 'CARTON', name: 'Koli', symbol: 'koli' },
  { code: 'PAIR', name: 'Çift', symbol: 'çift' },
  { code: 'SET', name: 'Set', symbol: 'set' },
].map((item) =>
  createUnit({
    id: `unt-${item.code.toLowerCase()}`,
    code: item.code,
    name: item.name,
    symbol: item.symbol,
    description: item.name,
  }),
)

// ─── Para Birimleri (ek) ──────────────────────────────────────────

export const TEXTILE_EXTRA_CURRENCIES = [
  { id: 'cur-cny', code: 'CNY', name: 'Çin Yuanı', symbol: '¥', isoCode: 'CNY' },
]

// ─── Incoterms ────────────────────────────────────────────────────

export const TEXTILE_INCOTERMS = [
  { code: 'EXW', name: 'EXW', description: 'Ex Works — fabrika çıkışı' },
  { code: 'FCA', name: 'FCA', description: 'Free Carrier — taşıyıcıya teslim' },
  { code: 'FOB', name: 'FOB', description: 'Free On Board — yükleme limanında teslim' },
  { code: 'CIF', name: 'CIF', description: 'Cost Insurance Freight — varış limanına kadar' },
  { code: 'DAP', name: 'DAP', description: 'Delivered At Place — varış yerinde teslim' },
  { code: 'DDP', name: 'DDP', description: 'Delivered Duty Paid — gümrük dahil teslim' },
].map((item) =>
  createIncoterm({
    id: `inc-${item.code.toLowerCase()}`,
    code: item.code,
    name: item.name,
    description: item.description,
  }),
)

// ─── Ödeme Şekilleri ──────────────────────────────────────────────

export const TEXTILE_PAYMENT_TERMS = [
  { code: 'CASH', name: 'Cash', days: 0, description: 'Peşin ödeme' },
  { code: 'NET30', name: '30 Days', days: 30, description: 'Fatura tarihinden 30 gün' },
  { code: 'NET60', name: '60 Days', days: 60, description: 'Fatura tarihinden 60 gün' },
  { code: 'NET90', name: '90 Days', days: 90, description: 'Fatura tarihinden 90 gün' },
  { code: 'LC', name: 'Letter Of Credit', days: 0, description: 'Akreditif (L/C)' },
  { code: 'OPEN', name: 'Open Account', days: 45, description: 'Açık hesap' },
].map((item) =>
  createPaymentTerm({
    id: `pt-${item.code.toLowerCase()}`,
    code: item.code,
    name: item.name,
    days: item.days,
    description: item.description,
  }),
)

// ─── Sezon Tipleri ────────────────────────────────────────────────

export const TEXTILE_SEASON_TYPES = [
  { code: 'SS', name: 'Spring Summer', enName: 'Spring Summer' },
  { code: 'AW', name: 'Autumn Winter', enName: 'Autumn Winter' },
  { code: 'HOLIDAY', name: 'Holiday', enName: 'Holiday' },
  { code: 'BASIC', name: 'Basic', enName: 'Basic' },
  { code: 'NOS', name: 'NOS', enName: 'Never Out Of Stock' },
  { code: 'CARRY', name: 'Carry Over', enName: 'Carry Over' },
].map((item) =>
  createSeasonType({
    id: `sst-${item.code.toLowerCase()}`,
    code: item.code,
    name: item.name,
    description: item.enName,
    localization: { tr: { name: item.name }, en: { name: item.enName } },
  }),
)
