/**
 * UI Options — Master Data'dan türetilmiş dropdown/select listeleri.
 * UI katmanı bu modülü kullanır; hardcoded string yasaktır.
 */
import {
  accessoryCategoryRepository,
  ageGroupRepository,
  brandRepository,
  buyerRepository,
  collectionRepository,
  colorCardRepository,
  currencyRepository,
  customerRepository,
  embroideryTypeRepository,
  fabricTypeRepository,
  fitRepository,
  genderRepository,
  incotermRepository,
  merchandiserRepository,
  operationRepository,
  paymentTermRepository,
  printTypeRepository,
  productGroupRepository,
  seasonRepository,
  seasonTypeRepository,
  sizeSetRepository,
  subProductGroupRepository,
  unitRepository,
  washTypeRepository,
  workshopRepository,
} from './repositories'

function names<T extends { name: string }>(items: T[]): string[] {
  return items.map((i) => i.name)
}

function codes<T extends { code: string }>(items: T[]): string[] {
  return items.map((i) => i.code)
}

export const CUSTOMERS = names(customerRepository.getActive())
export const BRANDS = names(brandRepository.getActive())
export const BUYERS = names(buyerRepository.getActive())
export const MERCHANDISERS = names(merchandiserRepository.getActive())
export const SEASONS = names(seasonRepository.getActive())
export const SEASON_TYPES = names(seasonTypeRepository.getActive())
export const COLLECTIONS = names(collectionRepository.getActive())
export const CURRENCIES = codes(currencyRepository.getActive())
export const DELIVERY_TERMS = codes(incotermRepository.getActive())
export const PAYMENT_TERMS = names(paymentTermRepository.getActive())
export const PRODUCT_GROUPS = names(productGroupRepository.getActive())
export const PRODUCT_SUBGROUPS = names(subProductGroupRepository.getActive())
export const FABRIC_TYPES = names(fabricTypeRepository.getActive())
export const UNITS = names(unitRepository.getActive())
export const GENDERS = names(genderRepository.getActive())
export const AGE_GROUPS = names(ageGroupRepository.getActive())
export const FITS = names(fitRepository.getActive())
export const WASH_TYPES = names(washTypeRepository.getActive())
export const PRINT_TYPES = names(printTypeRepository.getActive())
export const EMBROIDERY_TYPES = names(embroideryTypeRepository.getActive())
export const PRODUCT_TYPES = [
  ...new Set(sizeSetRepository.getActive().map((s) => s.productType)),
]
export const FACTORIES = names(workshopRepository.getActive().map((w) => ({ name: w.location })))
export const MANUFACTURERS = ['Kepler Tekstil A.Ş.'] as const

export const OPERATIONS = operationRepository.getActive().map((op) => ({
  code: op.code,
  name: op.name,
  sequence: op.sequence,
  department: op.department,
}))

export const SIZE_PRESETS = {
  letter: sizeSetRepository.getByCode('SS-TSHIRT')?.sizes ?? ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  numeric: sizeSetRepository.getByCode('SS-PANT')?.sizes ?? ['28', '29', '30', '31', '32'],
  baby: sizeSetRepository.getByCode('SS-BABY')?.sizes ?? ['0-3 Ay', '3-6 Ay', '6-9 Ay'],
} as const

export const ALL_SIZE_OPTIONS = [
  ...SIZE_PRESETS.letter,
  ...SIZE_PRESETS.numeric,
  ...SIZE_PRESETS.baby,
] as const

export const ACCESSORY_CATEGORIES = names(accessoryCategoryRepository.getActive())

/** Form varsayılanları — master data kodlarından */
export function getDefaultIncotermCode(): string {
  return incotermRepository.getByCode('FOB')?.code ?? incotermRepository.getActive()[0]?.code ?? ''
}

export function getDefaultPaymentTermName(): string {
  return paymentTermRepository.getByCode('NET60')?.name ?? paymentTermRepository.getActive()[0]?.name ?? ''
}

export function getDefaultCurrencyCode(): string {
  return currencyRepository.getByCode('USD')?.code ?? currencyRepository.getActive()[0]?.code ?? ''
}

export function getDefaultSeasonName(): string {
  return seasonRepository.getByCode('SS26')?.name ?? seasonRepository.getActive()[0]?.name ?? ''
}

export function getDefaultCollectionName(): string {
  return collectionRepository.getByCode('CORE')?.name ?? collectionRepository.getActive()[0]?.name ?? ''
}

export function getDefaultWorkshopName(): string {
  return workshopRepository.getActive()[0]?.name ?? ''
}

export function getWorkshopNameByDepartment(department: string): string {
  const wh = workshopRepository.find((w) => w.location.includes(department))[0]
  return wh?.name ?? workshopRepository.getActive()[0]?.name ?? ''
}

export function getWarehouseNameByOperationCode(opCode: string): string {
  const op = operationRepository.getByCode(opCode)
  if (!op) return getDefaultWorkshopName()
  if (op.department === 'Kesimhane') return 'Kesimhane'
  if (op.department === 'Dikim') return getDefaultWorkshopName()
  if (op.department === 'Ütü Paket') return 'Ütü Paket'
  if (op.department === 'Kalite') return 'Kalite'
  return op.department
}

export function getDefaultProductGroupName(): string {
  return productGroupRepository.getActive()[0]?.name ?? ''
}

export function getDefaultSubGroupName(): string {
  return subProductGroupRepository.getActive()[0]?.name ?? ''
}

export function getDefaultProductType(): string {
  return sizeSetRepository.getActive()[0]?.productType ?? ''
}

export function getDefaultColorCardOptions(count = 2) {
  return colorCardRepository.getActive().slice(0, count).map((c) => ({
    code: c.code,
    pantone: c.pantone,
    description: c.name,
  }))
}
