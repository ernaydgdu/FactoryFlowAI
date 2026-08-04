import type { BaseMasterEntity, MasterDataEntityType, ValidationResult } from './types'
import {
  createBrand,
  createCollection,
  createColorCard,
  createCustomer,
  createProductionLine,
  createSeason,
  createSizeSet,
  createSupplier,
  createWarehouse,
  createWorkshop,
  validateBrand,
  validateCollection,
  validateColorCard,
  validateCustomer,
  validateProductionLine,
  validateSeason,
  validateSizeSet,
  validateSupplier,
  validateWarehouse,
  validateWorkshop,
} from './factory'
import type { IMasterDataLookupRegistryPort } from '@/domain/ports/persistence/lookups/master-data-lookup-registry.port'

export const MASTER_DATA_CRUD_ENTITY_KEYS = [
  'customer',
  'supplier',
  'warehouse',
  'productionLine',
  'workshop',
  'brand',
  'season',
  'collection',
  'colorCard',
  'sizeSet',
] as const

export type MasterDataCrudEntityKey = (typeof MASTER_DATA_CRUD_ENTITY_KEYS)[number]

type LookupKey = keyof IMasterDataLookupRegistryPort

export type MasterDataCrudEntityConfig = {
  entityType: MasterDataEntityType
  lookupKey: LookupKey
  label: string
  pluralLabel: string
  route: string
  create: (input: Record<string, unknown>) => BaseMasterEntity
  validate: (entity: Partial<BaseMasterEntity>) => ValidationResult
}

export const MASTER_DATA_CRUD_REGISTRY: Record<MasterDataCrudEntityKey, MasterDataCrudEntityConfig> = {
  customer: {
    entityType: 'customer',
    lookupKey: 'customer',
    label: 'Müşteri',
    pluralLabel: 'Müşteriler',
    route: '/master-data/customers',
    create: (input) => createCustomer(input as Parameters<typeof createCustomer>[0]),
    validate: validateCustomer,
  },
  supplier: {
    entityType: 'supplier',
    lookupKey: 'supplier',
    label: 'Tedarikçi',
    pluralLabel: 'Tedarikçiler',
    route: '/master-data/suppliers',
    create: (input) => createSupplier(input as Parameters<typeof createSupplier>[0]),
    validate: validateSupplier,
  },
  warehouse: {
    entityType: 'warehouse',
    lookupKey: 'warehouse',
    label: 'Depo',
    pluralLabel: 'Depolar',
    route: '/master-data/warehouses',
    create: (input) => createWarehouse(input as Parameters<typeof createWarehouse>[0]),
    validate: validateWarehouse,
  },
  productionLine: {
    entityType: 'productionLine',
    lookupKey: 'productionLine',
    label: 'Üretim Hattı',
    pluralLabel: 'Üretim Hatları',
    route: '/master-data/production-lines',
    create: (input) => createProductionLine(input as Parameters<typeof createProductionLine>[0]),
    validate: validateProductionLine,
  },
  workshop: {
    entityType: 'workshop',
    lookupKey: 'workshop',
    label: 'Atölye',
    pluralLabel: 'Atölyeler',
    route: '/master-data/workshops',
    create: (input) => createWorkshop(input as Parameters<typeof createWorkshop>[0]),
    validate: validateWorkshop,
  },
  brand: {
    entityType: 'brand',
    lookupKey: 'brand',
    label: 'Marka',
    pluralLabel: 'Markalar',
    route: '/master-data/brands',
    create: (input) => createBrand(input as Parameters<typeof createBrand>[0]),
    validate: validateBrand,
  },
  season: {
    entityType: 'season',
    lookupKey: 'season',
    label: 'Sezon',
    pluralLabel: 'Sezonlar',
    route: '/master-data/seasons',
    create: (input) => createSeason(input as Parameters<typeof createSeason>[0]),
    validate: validateSeason,
  },
  collection: {
    entityType: 'collection',
    lookupKey: 'collection',
    label: 'Koleksiyon',
    pluralLabel: 'Koleksiyonlar',
    route: '/master-data/collections',
    create: (input) => createCollection(input as Parameters<typeof createCollection>[0]),
    validate: validateCollection,
  },
  colorCard: {
    entityType: 'colorCard',
    lookupKey: 'colorCard',
    label: 'Renk Kartı',
    pluralLabel: 'Renk Kartları',
    route: '/master-data/color-cards',
    create: (input) => createColorCard(input as Parameters<typeof createColorCard>[0]),
    validate: validateColorCard,
  },
  sizeSet: {
    entityType: 'sizeSet',
    lookupKey: 'sizeSet',
    label: 'Beden Seti',
    pluralLabel: 'Beden Setleri',
    route: '/master-data/size-sets',
    create: (input) => createSizeSet(input as Parameters<typeof createSizeSet>[0]),
    validate: validateSizeSet,
  },
}
