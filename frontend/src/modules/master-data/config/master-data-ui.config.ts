import type { MasterDataCrudEntityKey } from '@/domain/master-data/master-data-crud.registry'

export type MasterDataFieldType =
  | 'text'
  | 'number'
  | 'select'
  | 'sizes'
  | 'period'

export type MasterDataFormField = {
  key: string
  label: string
  type: MasterDataFieldType
  required?: boolean
  referenceKey?: MasterDataCrudEntityKey | 'country' | 'currency' | 'seasonType'
  placeholder?: string
}

export type MasterDataUiConfig = {
  entityKey: MasterDataCrudEntityKey
  createDefaults: Record<string, unknown>
  formFields: MasterDataFormField[]
  listColumns: { key: string; label: string }[]
}

const DEFAULT_COUNTRY = 'cnt-tr'
const DEFAULT_CURRENCY = 'cur-usd'
const DEFAULT_SEASON_TYPE = 'sst-ss'

export const MASTER_DATA_UI_CONFIG: Record<MasterDataCrudEntityKey, MasterDataUiConfig> = {
  customer: {
    entityKey: 'customer',
    createDefaults: { countryId: DEFAULT_COUNTRY, currencyId: DEFAULT_CURRENCY, city: 'İstanbul' },
    formFields: [
      { key: 'code', label: 'Kod', type: 'text', required: true },
      { key: 'name', label: 'Ad', type: 'text', required: true },
      { key: 'city', label: 'Şehir', type: 'text', required: true },
      { key: 'countryId', label: 'Ülke', type: 'select', referenceKey: 'country', required: true },
      { key: 'currencyId', label: 'Para Birimi', type: 'select', referenceKey: 'currency', required: true },
      { key: 'taxNo', label: 'Vergi No', type: 'text' },
    ],
    listColumns: [
      { key: 'code', label: 'Kod' },
      { key: 'name', label: 'Ad' },
      { key: 'city', label: 'Şehir' },
    ],
  },
  supplier: {
    entityKey: 'supplier',
    createDefaults: {
      countryId: DEFAULT_COUNTRY,
      currencyId: DEFAULT_CURRENCY,
      leadTimeDays: 14,
      categoryCode: 'FABRIC',
    },
    formFields: [
      { key: 'code', label: 'Kod', type: 'text', required: true },
      { key: 'name', label: 'Ad', type: 'text', required: true },
      { key: 'countryId', label: 'Ülke', type: 'select', referenceKey: 'country', required: true },
      { key: 'currencyId', label: 'Para Birimi', type: 'select', referenceKey: 'currency', required: true },
      { key: 'leadTimeDays', label: 'Lead Time (gün)', type: 'number', required: true },
      { key: 'categoryCode', label: 'Kategori Kodu', type: 'text', required: true },
    ],
    listColumns: [
      { key: 'code', label: 'Kod' },
      { key: 'name', label: 'Ad' },
      { key: 'leadTimeDays', label: 'Lead Time' },
    ],
  },
  warehouse: {
    entityKey: 'warehouse',
    createDefaults: { countryId: DEFAULT_COUNTRY, location: 'İstanbul', warehouseTypeId: 'wht-fabric' },
    formFields: [
      { key: 'code', label: 'Kod', type: 'text', required: true },
      { key: 'name', label: 'Ad', type: 'text', required: true },
      { key: 'location', label: 'Konum', type: 'text', required: true },
      { key: 'countryId', label: 'Ülke', type: 'select', referenceKey: 'country', required: true },
      { key: 'warehouseTypeId', label: 'Depo Tipi ID', type: 'text', required: true },
    ],
    listColumns: [
      { key: 'code', label: 'Kod' },
      { key: 'name', label: 'Ad' },
      { key: 'location', label: 'Konum' },
    ],
  },
  workshop: {
    entityKey: 'workshop',
    createDefaults: { warehouseId: 'wh-fsn-a', location: 'İstanbul', monthlyCapacity: 50000, currentLoad: 0 },
    formFields: [
      { key: 'code', label: 'Kod', type: 'text', required: true },
      { key: 'name', label: 'Ad', type: 'text', required: true },
      { key: 'warehouseId', label: 'Depo', type: 'select', referenceKey: 'warehouse', required: true },
      { key: 'location', label: 'Konum', type: 'text', required: true },
      { key: 'monthlyCapacity', label: 'Aylık Kapasite', type: 'number', required: true },
    ],
    listColumns: [
      { key: 'code', label: 'Kod' },
      { key: 'name', label: 'Ad' },
      { key: 'monthlyCapacity', label: 'Kapasite' },
    ],
  },
  productionLine: {
    entityKey: 'productionLine',
    createDefaults: { workshopId: 'wsh-a', capacityPerDay: 1200 },
    formFields: [
      { key: 'code', label: 'Kod', type: 'text', required: true },
      { key: 'name', label: 'Ad', type: 'text', required: true },
      { key: 'workshopId', label: 'Atölye', type: 'select', referenceKey: 'workshop', required: true },
      { key: 'capacityPerDay', label: 'Günlük Kapasite', type: 'number', required: true },
    ],
    listColumns: [
      { key: 'code', label: 'Kod' },
      { key: 'name', label: 'Ad' },
      { key: 'capacityPerDay', label: 'Kapasite/Gün' },
    ],
  },
  brand: {
    entityKey: 'brand',
    createDefaults: { customerId: 'cus-lcw' },
    formFields: [
      { key: 'code', label: 'Kod', type: 'text', required: true },
      { key: 'name', label: 'Ad', type: 'text', required: true },
      { key: 'customerId', label: 'Müşteri', type: 'select', referenceKey: 'customer', required: true },
    ],
    listColumns: [
      { key: 'code', label: 'Kod' },
      { key: 'name', label: 'Ad' },
    ],
  },
  season: {
    entityKey: 'season',
    createDefaults: { year: 2026, period: 'SS', seasonTypeId: DEFAULT_SEASON_TYPE },
    formFields: [
      { key: 'code', label: 'Kod', type: 'text', required: true },
      { key: 'name', label: 'Ad', type: 'text', required: true },
      { key: 'year', label: 'Yıl', type: 'number', required: true },
      { key: 'period', label: 'Dönem', type: 'period', required: true },
      { key: 'seasonTypeId', label: 'Sezon Tipi', type: 'select', referenceKey: 'seasonType', required: true },
    ],
    listColumns: [
      { key: 'code', label: 'Kod' },
      { key: 'name', label: 'Ad' },
      { key: 'year', label: 'Yıl' },
      { key: 'period', label: 'Dönem' },
    ],
  },
  collection: {
    entityKey: 'collection',
    createDefaults: { seasonId: 'ssn-ss26', brandId: 'brd-lcw' },
    formFields: [
      { key: 'code', label: 'Kod', type: 'text', required: true },
      { key: 'name', label: 'Ad', type: 'text', required: true },
      { key: 'seasonId', label: 'Sezon', type: 'select', referenceKey: 'season', required: true },
      { key: 'brandId', label: 'Marka', type: 'select', referenceKey: 'brand', required: true },
    ],
    listColumns: [
      { key: 'code', label: 'Kod' },
      { key: 'name', label: 'Ad' },
    ],
  },
  colorCard: {
    entityKey: 'colorCard',
    createDefaults: {
      pantone: '19-4052',
      colorGroup: 'Mavi',
      hex: '#0F4C81',
      rgb: { r: 15, g: 76, b: 129 },
      internalColorCode: 'INT-001',
    },
    formFields: [
      { key: 'code', label: 'Kod', type: 'text', required: true },
      { key: 'name', label: 'Ad', type: 'text', required: true },
      { key: 'pantone', label: 'Pantone', type: 'text', required: true },
      { key: 'colorGroup', label: 'Renk Grubu', type: 'text', required: true },
      { key: 'hex', label: 'HEX', type: 'text', required: true },
      { key: 'internalColorCode', label: 'İç Renk Kodu', type: 'text', required: true },
      { key: 'customerColorCode', label: 'Müşteri Renk Kodu', type: 'text' },
    ],
    listColumns: [
      { key: 'code', label: 'Kod' },
      { key: 'name', label: 'Ad' },
      { key: 'pantone', label: 'Pantone' },
      { key: 'hex', label: 'HEX' },
    ],
  },
  sizeSet: {
    entityKey: 'sizeSet',
    createDefaults: { productType: 'Giyim', sizes: ['XS', 'S', 'M', 'L', 'XL'] },
    formFields: [
      { key: 'code', label: 'Kod', type: 'text', required: true },
      { key: 'name', label: 'Ad', type: 'text', required: true },
      { key: 'productType', label: 'Ürün Tipi', type: 'text', required: true },
      { key: 'sizes', label: 'Bedenler (virgülle)', type: 'sizes', required: true },
    ],
    listColumns: [
      { key: 'code', label: 'Kod' },
      { key: 'name', label: 'Ad' },
      { key: 'productType', label: 'Ürün Tipi' },
    ],
  },
}

export function resolveMasterDataEntityKeyFromPath(pathSegment: string): MasterDataCrudEntityKey | null {
  const entry = Object.values(MASTER_DATA_UI_CONFIG).find((cfg) => cfg.entityKey && pathSegment.includes(cfg.entityKey))
  if (entry) return entry.entityKey

  const map: Record<string, MasterDataCrudEntityKey> = {
    customers: 'customer',
    suppliers: 'supplier',
    warehouses: 'warehouse',
    'production-lines': 'productionLine',
    workshops: 'workshop',
    brands: 'brand',
    seasons: 'season',
    collections: 'collection',
    'color-cards': 'colorCard',
    'size-sets': 'sizeSet',
  }
  return map[pathSegment] ?? null
}
