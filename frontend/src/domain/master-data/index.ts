export {
  countryRepository,
  currencyRepository,
  customerRepository,
  brandRepository,
  buyerRepository,
  merchandiserRepository,
  supplierRepository,
  warehouseRepository,
  workshopRepository,
  seasonTypeRepository,
  seasonRepository,
  collectionRepository,
  productGroupRepository,
  subProductGroupRepository,
  sizeSetRepository,
  colorCardRepository,
  fabricTypeRepository,
  fabricCompositionRepository,
  accessoryCategoryRepository,
  accessoryTypeRepository,
  operationRepository,
  productionLineRepository,
  machineTypeRepository,
  machineRepository,
  qualityCodeRepository,
  warehouseTypeRepository,
  unitRepository,
  genderRepository,
  ageGroupRepository,
  fitRepository,
  washTypeRepository,
  printTypeRepository,
  embroideryTypeRepository,
  gtipCodeRepository,
  employeeRepository,
  transportCompanyRepository,
  forwarderRepository,
  containerTypeRepository,
  incotermRepository,
  paymentTermRepository,
  ALL_MASTER_DATA_REPOSITORIES,
} from './repositories'

import {
  accessoryCategoryRepository,
  accessoryTypeRepository,
  ageGroupRepository,
  brandRepository,
  buyerRepository,
  collectionRepository,
  colorCardRepository,
  containerTypeRepository,
  countryRepository,
  currencyRepository,
  customerRepository,
  employeeRepository,
  embroideryTypeRepository,
  fabricCompositionRepository,
  fabricTypeRepository,
  fitRepository,
  forwarderRepository,
  genderRepository,
  gtipCodeRepository,
  incotermRepository,
  machineRepository,
  machineTypeRepository,
  merchandiserRepository,
  operationRepository,
  paymentTermRepository,
  printTypeRepository,
  productGroupRepository,
  productionLineRepository,
  qualityCodeRepository,
  seasonRepository,
  seasonTypeRepository,
  sizeSetRepository,
  subProductGroupRepository,
  supplierRepository,
  transportCompanyRepository,
  unitRepository,
  warehouseRepository,
  warehouseTypeRepository,
  washTypeRepository,
  workshopRepository,
} from './repositories'

/** Tüm master data repository'lerine tek noktadan erişim */
export const masterData = {
  country: countryRepository,
  currency: currencyRepository,
  customer: customerRepository,
  brand: brandRepository,
  buyer: buyerRepository,
  merchandiser: merchandiserRepository,
  supplier: supplierRepository,
  warehouse: warehouseRepository,
  workshop: workshopRepository,
  seasonType: seasonTypeRepository,
  season: seasonRepository,
  collection: collectionRepository,
  productGroup: productGroupRepository,
  subProductGroup: subProductGroupRepository,
  sizeSet: sizeSetRepository,
  colorCard: colorCardRepository,
  fabricType: fabricTypeRepository,
  fabricComposition: fabricCompositionRepository,
  accessoryCategory: accessoryCategoryRepository,
  accessoryType: accessoryTypeRepository,
  operation: operationRepository,
  productionLine: productionLineRepository,
  machineType: machineTypeRepository,
  machine: machineRepository,
  qualityCode: qualityCodeRepository,
  warehouseType: warehouseTypeRepository,
  unit: unitRepository,
  gender: genderRepository,
  ageGroup: ageGroupRepository,
  fit: fitRepository,
  washType: washTypeRepository,
  printType: printTypeRepository,
  embroideryType: embroideryTypeRepository,
  gtipCode: gtipCodeRepository,
  employee: employeeRepository,
  transportCompany: transportCompanyRepository,
  forwarder: forwarderRepository,
  containerType: containerTypeRepository,
  incoterm: incotermRepository,
  paymentTerm: paymentTermRepository,
} as const

export {
  generateMasterDataCoverageReport,
  formatCoverageReportMarkdown,
  type MasterDataCoverageReport,
  type MasterDataEntityCoverage,
} from './master-data-coverage'

export * from './enterprise'

// --- Convenience resolvers ---

export function getWarehouseName(code: string): string {
  return warehouseRepository.getByCode(code)?.name ?? code
}

export function getWarehouseByCode(code: string) {
  return warehouseRepository.getByCode(code)
}

export function getWorkshopByCode(code: string) {
  return workshopRepository.getByCode(code)
}

export function getSizeSetById(id: string) {
  return sizeSetRepository.getById(id)
}

export function getSizeSetSizes(id: string): string[] {
  return sizeSetRepository.getById(id)?.sizes ?? []
}

export function getColorCardById(id: string) {
  return colorCardRepository.getById(id)
}

export function getSupplierById(id: string) {
  return supplierRepository.getById(id)
}

export function getCustomerById(id: string) {
  return customerRepository.getById(id)
}

export function getBrandById(id: string) {
  return brandRepository.getById(id)
}

export function getIncotermByCode(code: string) {
  return incotermRepository.getByCode(code)
}

export function getPaymentTermByCode(code: string) {
  return paymentTermRepository.getByCode(code)
}

export function getOperationByCode(code: string) {
  return operationRepository.getByCode(code)
}

export function getWorkshopCapacitiesFromMasterData() {
  return workshopRepository.getActive().map((w) => ({
    code: w.code,
    name: w.name,
    monthlyCapacity: w.monthlyCapacity,
    currentLoad: w.currentLoad,
  }))
}

export function getColorCardsForProduct(count: number, seed: number) {
  const active = colorCardRepository.getActive()
  return active.slice(0, count).map((c, i) => ({
    colorCardId: c.id,
    id: `clr-${seed}-${i}`,
    name: c.name,
    internalCode: c.internalColorCode,
    customerCode: c.customerColorCode ?? c.customerCode ?? '',
    pantone: c.pantone,
    colorGroup: c.colorGroup,
    active: true,
  }))
}

export function getFabricWarehouseCode(): string {
  return warehouseRepository.find((w) => w.type === 'Kumaş' || w.warehouseTypeId === 'wht-fabric')[0]?.code ?? 'KMS-01'
}

export function getAccessoryWarehouseCode(): string {
  return warehouseRepository.find((w) => w.type === 'Aksesuar')[0]?.code ?? 'AKS-01'
}

export function getFinishedGoodsWarehouseCode(): string {
  return warehouseRepository.find((w) => w.type === 'Mamül')[0]?.code ?? 'MML-01'
}

export function getDefaultWorkshopCode(): string {
  return workshopRepository.getActive()[0]?.code ?? 'FSN-A'
}

export {
  CUSTOMERS,
  BRANDS,
  BUYERS,
  MERCHANDISERS,
  SEASONS,
  COLLECTIONS,
  CURRENCIES,
  DELIVERY_TERMS,
  PAYMENT_TERMS,
  PRODUCT_GROUPS,
  OPERATIONS,
  SIZE_PRESETS,
  getDefaultIncotermCode,
  getDefaultPaymentTermName,
  getDefaultCurrencyCode,
  getDefaultSeasonName,
  getDefaultCollectionName,
  getDefaultWorkshopName,
  getWarehouseNameByOperationCode,
  getDefaultColorCardOptions,
} from './ui-options'
