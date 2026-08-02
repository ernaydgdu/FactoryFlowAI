/**
 * UI Options — Master Data'dan türetilmiş dropdown/select listeleri.
 * UI katmanı bu modülü kullanır; hardcoded string yasaktır.
 */
import {
  accessoryCategoryRepository,
  ageGroupRepository,
  brandRepository,
  customerRepository,
  buyerRepository,
  collectionRepository,
  currencyRepository,
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

function lazyArray<T>(compute: () => T[]): T[] {
  let cache: T[] | undefined
  return new Proxy([] as T[], {
    get(_target, prop) {
      if (cache === undefined) cache = compute()
      const value = Reflect.get(cache, prop, cache)
      return typeof value === 'function' ? value.bind(cache) : value
    },
  })
}

function lazyObject<T extends object>(compute: () => T): T {
  let cache: T | undefined
  return new Proxy({} as T, {
    get(_target, prop) {
      if (cache === undefined) cache = compute()
      return Reflect.get(cache, prop, cache)
    },
  })
}

export const CUSTOMERS = lazyArray(() => names(customerRepository.getActive()))
export const BRANDS = lazyArray(() => names(brandRepository.getActive()))
export const BUYERS = lazyArray(() => names(buyerRepository.getActive()))
export const MERCHANDISERS = lazyArray(() => names(merchandiserRepository.getActive()))
export const SEASONS = lazyArray(() => names(seasonRepository.getActive()))
export const SEASON_TYPES = lazyArray(() => names(seasonTypeRepository.getActive()))
export const COLLECTIONS = lazyArray(() => names(collectionRepository.getActive()))
export const CURRENCIES = lazyArray(() => codes(currencyRepository.getActive()))
export const DELIVERY_TERMS = lazyArray(() => codes(incotermRepository.getActive()))
export const PAYMENT_TERMS = lazyArray(() => names(paymentTermRepository.getActive()))
export const PRODUCT_GROUPS = lazyArray(() => names(productGroupRepository.getActive()))
export const PRODUCT_SUBGROUPS = lazyArray(() => names(subProductGroupRepository.getActive()))
export const FABRIC_TYPES = lazyArray(() => names(fabricTypeRepository.getActive()))
export const UNITS = lazyArray(() => names(unitRepository.getActive()))
export const GENDERS = lazyArray(() => names(genderRepository.getActive()))
export const AGE_GROUPS = lazyArray(() => names(ageGroupRepository.getActive()))
export const FITS = lazyArray(() => names(fitRepository.getActive()))
export const WASH_TYPES = lazyArray(() => names(washTypeRepository.getActive()))
export const PRINT_TYPES = lazyArray(() => names(printTypeRepository.getActive()))
export const EMBROIDERY_TYPES = lazyArray(() => names(embroideryTypeRepository.getActive()))
export const PRODUCT_TYPES = lazyArray(() => [
  ...new Set(sizeSetRepository.getActive().map((s) => s.productType)),
])
export const FACTORIES = lazyArray(() =>
  names(workshopRepository.getActive().map((w) => ({ name: w.location }))),
)
export const MANUFACTURERS = ['Kepler Tekstil A.Ş.'] as const

export const OPERATIONS = lazyArray(() =>
  operationRepository.getActive().map((op) => ({
    code: op.code,
    name: op.name,
    sequence: op.sequence,
    department: op.department,
  })),
)

export const SIZE_PRESETS = lazyObject(() => ({
  letter: sizeSetRepository.getByCode('SS-TSHIRT')?.sizes ?? ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  numeric: sizeSetRepository.getByCode('SS-PANT')?.sizes ?? ['28', '29', '30', '31', '32'],
  baby: sizeSetRepository.getByCode('SS-BABY')?.sizes ?? ['0-3 Ay', '3-6 Ay', '6-9 Ay'],
}))

export const ALL_SIZE_OPTIONS = lazyArray(() => [
  ...SIZE_PRESETS.letter,
  ...SIZE_PRESETS.numeric,
  ...SIZE_PRESETS.baby,
])

export const ACCESSORY_CATEGORIES = lazyArray(() => names(accessoryCategoryRepository.getActive()))
