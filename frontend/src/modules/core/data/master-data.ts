/** Sipariş formu için statik seçenek listeleri (dropdown/select). */

export const CUSTOMERS = ['Mango TR', 'LC Waikiki', 'H&M', 'Zara', 'Defacto'] as const
export const BRANDS = ['Mango', 'LCW', 'H&M', 'Zara', 'Defacto'] as const
export const BUYERS = ['Ahmet Yılmaz', 'Elif Kaya', 'Mert Demir'] as const
export const MERCHANDISERS = ['Zeynep Arslan', 'Can Öztürk', 'Selin Aydın'] as const
export const SEASONS = ['SS26', 'FW26', 'SS25', 'FW25'] as const
export const COLLECTIONS = ['Core', 'Basic', 'Premium'] as const
export const CURRENCIES = ['USD', 'EUR', 'TRY'] as const
export const DELIVERY_TERMS = ['FOB', 'CIF', 'EXW', 'DDP'] as const
export const PAYMENT_TERMS = ['NET30', 'NET60', 'NET90', 'LC'] as const
export const PRODUCT_GROUPS = ['Üst Giyim', 'Alt Giyim', 'Dış Giyim'] as const
export const PRODUCT_SUBGROUPS = ['T-Shirt', 'Gömlek', 'Pantolon', 'Ceket'] as const
export const PRODUCT_TYPES = ['Örme', 'Dokuma'] as const
export const FABRIC_TYPES = ['Pamuklu', 'Polyester', 'Denim', 'Örme'] as const
export const FITS = ['Slim', 'Regular', 'Oversize'] as const
export const WASH_TYPES = ['Stone Wash', 'Enzyme', 'Garment Dye', 'Softener'] as const
export const PRINT_TYPES = ['Baskı Yok', 'Serigrafi', 'Dijital Baskı'] as const
export const EMBROIDERY_TYPES = ['Nakış Yok', 'Düz Nakış', 'Lazer Nakış'] as const
export const ACCESSORY_CATEGORIES = ['Fermuar', 'Düğme', 'Etiket', 'İplik', 'Poşet'] as const
export const FACTORIES = ['Bursa Fabrika', 'İstanbul Fabrika'] as const
export const MANUFACTURERS = ['Kepler Tekstil A.Ş.'] as const
export const OPERATIONS: { code: string; name: string; sequence: number; department: string }[] = [
  { code: 'CUT', name: 'Kesim', sequence: 1, department: 'Kesimhane' },
  { code: 'SEW', name: 'Dikim', sequence: 2, department: 'Dikim' },
  { code: 'IRON', name: 'Ütü', sequence: 3, department: 'Ütü Paket' },
  { code: 'PACK', name: 'Paketleme', sequence: 4, department: 'Ütü Paket' },
  { code: 'QC', name: 'Kalite Kontrol', sequence: 5, department: 'Kalite' },
]

export const SIZE_PRESETS = {
  letter: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  numeric: ['28', '29', '30', '31', '32'],
  // Genel konfeksiyon (EU) numaralandırması — pantolon bel bedeni olan
  // `numeric`ten farklı, gömlek/elbise gibi ürünlerde kullanılan aralık.
  eu: ['36', '38', '40', '42', '44', '46'],
  baby: ['0-3 Ay', '3-6 Ay', '6-9 Ay'],
}

export const ALL_SIZE_OPTIONS = [
  ...SIZE_PRESETS.letter,
  ...SIZE_PRESETS.numeric,
  ...SIZE_PRESETS.eu,
  ...SIZE_PRESETS.baby,
]

export function getDefaultCollectionName(): string {
  return COLLECTIONS[0]
}

export function getDefaultColorCardOptions(count = 2) {
  return [
    { code: 'BLACK', pantone: '19-0303 TPX', description: 'Siyah' },
    { code: 'WHITE', pantone: '11-0601 TPX', description: 'Beyaz' },
  ].slice(0, count)
}

export function getDefaultCurrencyCode(): string {
  return 'USD'
}

export function getDefaultIncotermCode(): string {
  return 'FOB'
}

export function getDefaultPaymentTermName(): string {
  return 'NET60'
}

export function getDefaultProductGroupName(): string {
  return PRODUCT_GROUPS[0]
}

export function getDefaultProductType(): string {
  return PRODUCT_TYPES[0]
}

export function getDefaultSeasonName(): string {
  return SEASONS[0]
}

export function getDefaultSubGroupName(): string {
  return PRODUCT_SUBGROUPS[0]
}

export function getDefaultWorkshopName(): string {
  return FACTORIES[0]
}

export function getWarehouseNameByOperationCode(opCode: string): string {
  const op = OPERATIONS.find((o) => o.code === opCode)
  return op?.department ?? getDefaultWorkshopName()
}
