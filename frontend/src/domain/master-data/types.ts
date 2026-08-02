/** Master Data — Kepler ERP ortak referans veri modeli */

export type MasterEntityStatus = 'Active' | 'Inactive'

export type MasterEntityLocalization = {
  tr?: { name: string; description?: string; shortDescription?: string }
  en?: { name: string; description?: string; shortDescription?: string }
}

/** Enterprise code system — tüm master entity'lerin ortak tabanı */
export type BaseMasterEntity = {
  /** UUID — seed/factory tarafından atanır */
  id: string
  code: string
  name: string
  description?: string
  shortDescription?: string
  externalCode?: string
  barcode?: string
  /** @deprecated isActive kullanın */
  status: MasterEntityStatus
  isActive: boolean
  isSystem: boolean
  sortOrder: number
  version: number
  effectiveFrom: string
  effectiveTo?: string
  createdAt: string
  createdBy: string
  updatedAt: string
  updatedBy: string
  deletedAt?: string
  deletedBy?: string
  localizationKey?: string
  localization?: MasterEntityLocalization
}

/** Tekstil lookup entity'leri — Gender, Wash, Print vb. */
export type TextileLookup = BaseMasterEntity

export type HierarchicalMasterFields = {
  parentId?: string
}

export type CustomerGroup = BaseMasterEntity & HierarchicalMasterFields
export type SupplierGroup = BaseMasterEntity & HierarchicalMasterFields
export type Department = BaseMasterEntity & HierarchicalMasterFields
export type MachineGroup = BaseMasterEntity & HierarchicalMasterFields & {
  workshopId?: string
}
export type FabricCategory = BaseMasterEntity & HierarchicalMasterFields

export type ValidationResult = {
  valid: boolean
  errors: string[]
}

export type Customer = BaseMasterEntity & {
  countryId: string
  currencyId: string
  customerGroupId?: string
  taxNo?: string
  city: string
}

export type Brand = BaseMasterEntity & {
  customerId: string
}

export type Buyer = BaseMasterEntity & {
  customerId: string
  email: string
  phone?: string
}

export type Merchandiser = BaseMasterEntity & {
  customerId: string
  email: string
}

export type Supplier = BaseMasterEntity & {
  countryId: string
  supplierGroupId?: string
  categoryCode: string
  leadTimeDays: number
  currencyId: string
  /** @deprecated categoryCode kullanın */
  category?: 'Kumaş' | 'Aksesuar' | 'Her İkisi' | 'Lojistik'
}

export type WarehouseType =
  | 'Hammadde'
  | 'Kumaş'
  | 'Aksesuar'
  | 'Kesimhane'
  | 'Fason'
  | 'Yıkama'
  | 'Kalite'
  | 'Ütü Paket'
  | 'Mamül'
  | 'Fire'
  | 'Hurda'
  | 'Numune'
  | 'İade'

export type Warehouse = BaseMasterEntity & HierarchicalMasterFields & {
  warehouseTypeId: string
  location: string
  countryId: string
  hierarchyGroup?: string
  /** @deprecated warehouseTypeId kullanın */
  type?: WarehouseType
}

export type Workshop = BaseMasterEntity & {
  warehouseId: string
  location: string
  monthlyCapacity: number
  currentLoad: number
}

export type Country = BaseMasterEntity & HierarchicalMasterFields & {
  iso2: string
  iso3: string
}

export type Currency = BaseMasterEntity & {
  symbol: string
  isoCode: string
}

export type SeasonType = TextileLookup

export type Season = BaseMasterEntity & {
  year: number
  period: 'SS' | 'AW' | 'RESORT' | 'CORE'
  seasonTypeId: string
}

export type Collection = BaseMasterEntity & {
  seasonId: string
  brandId: string
}

export type ProductGroup = BaseMasterEntity & HierarchicalMasterFields

export type SubProductGroup = BaseMasterEntity & {
  productGroupId: string
}

export type SizeSet = BaseMasterEntity & {
  productType: string
  sizes: string[]
}

export type ColorCard = BaseMasterEntity & {
  pantone: string
  colorGroup: string
  hex: string
  rgb: { r: number; g: number; b: number }
  customerColorCode?: string
  internalColorCode: string
  description?: string
  /** @deprecated use customerColorCode */
  customerCode?: string
}

export type FabricType = BaseMasterEntity & HierarchicalMasterFields & {
  fabricCategoryId?: string
}

export type FabricComposition = BaseMasterEntity & {
  fiberContent: string
}

export type AccessoryCategory = BaseMasterEntity & HierarchicalMasterFields

export type AccessoryType = BaseMasterEntity & {
  categoryId: string
}

export type Operation = BaseMasterEntity & HierarchicalMasterFields & {
  departmentId?: string
  department: string
  sequence: number
  standardMinutes: number
}

export type ProductionLine = BaseMasterEntity & {
  workshopId: string
  capacityPerDay: number
}

export type MachineType = TextileLookup

export type Machine = BaseMasterEntity & {
  productionLineId: string
  machineTypeId: string
  machineGroupId?: string
  /** Resolved machine type name — backward compat */
  machineType: string
}

export type QualityCode = TextileLookup & {
  severityCode: string
  /** @deprecated severityCode kullanın */
  severity?: 'Major' | 'Minor' | 'Critical' | 'Process' | 'None'
}

export type WarehouseTypeMaster = TextileLookup & {
  legacyType: WarehouseType
}

export type Unit = TextileLookup & {
  symbol: string
}

export type Gender = TextileLookup
export type AgeGroup = TextileLookup
export type Fit = TextileLookup
export type WashType = TextileLookup
export type PrintType = TextileLookup
export type EmbroideryType = TextileLookup

export type GtipCode = BaseMasterEntity & {
  hsCode: string
  description: string
}

export type Employee = BaseMasterEntity & {
  role: string
  department: string
  workshopId?: string
  email: string
}

export type TransportCompany = BaseMasterEntity & {
  serviceType: 'Kara' | 'Deniz' | 'Hava' | 'Multimodal'
}

export type Forwarder = BaseMasterEntity & {
  transportCompanyId: string
  contactEmail: string
}

export type ContainerType = BaseMasterEntity & {
  teu: number
  maxWeightKg: number
}

export type Incoterm = BaseMasterEntity & {
  description: string
}

export type PaymentTerm = BaseMasterEntity & {
  days: number
  description: string
}

export type MasterDataEntityType =
  | 'customer'
  | 'customerGroup'
  | 'brand'
  | 'buyer'
  | 'merchandiser'
  | 'supplier'
  | 'supplierGroup'
  | 'workshop'
  | 'warehouse'
  | 'department'
  | 'country'
  | 'currency'
  | 'seasonType'
  | 'season'
  | 'collection'
  | 'productGroup'
  | 'subProductGroup'
  | 'sizeSet'
  | 'colorCard'
  | 'fabricCategory'
  | 'fabricType'
  | 'fabricComposition'
  | 'accessoryCategory'
  | 'accessoryType'
  | 'operation'
  | 'productionLine'
  | 'machineGroup'
  | 'machineType'
  | 'machine'
  | 'qualityCode'
  | 'warehouseType'
  | 'unit'
  | 'gender'
  | 'ageGroup'
  | 'fit'
  | 'washType'
  | 'printType'
  | 'embroideryType'
  | 'gtipCode'
  | 'employee'
  | 'transportCompany'
  | 'forwarder'
  | 'containerType'
  | 'incoterm'
  | 'paymentTerm'
  | 'productTemplate'
  | 'defaultProfile'
