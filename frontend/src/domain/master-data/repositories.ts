import { createRepository } from './repository'
import {
  validateAccessoryCategory,
  validateAccessoryType,
  validateBrand,
  validateBuyer,
  validateCollection,
  validateColorCard,
  validateContainerType,
  validateCountry,
  validateCurrency,
  validateCustomer,
  validateEmployee,
  validateFabricComposition,
  validateFabricType,
  validateForwarder,
  validateIncoterm,
  validateMachine,
  validateMerchandiser,
  validateOperation,
  validatePaymentTerm,
  validateProductGroup,
  validateProductionLine,
  validateSeason,
  validateSizeSet,
  validateSubProductGroup,
  validateSupplier,
  validateTransportCompany,
  validateWarehouse,
  validateWorkshop,
} from './factory'
import { validateBase } from './validation'
import {
  ACCESSORY_CATEGORIES,
  ACCESSORY_TYPES,
  BRANDS,
  BUYERS,
  COLLECTIONS,
  COLOR_CARDS,
  CONTAINER_TYPES,
  COUNTRIES,
  CURRENCIES,
  CUSTOMERS,
  EMPLOYEES,
  FABRIC_COMPOSITIONS,
  FABRIC_TYPES,
  FORWARDERS,
  INCOTERMS,
  MACHINES,
  MERCHANDISERS,
  OPERATIONS,
  PAYMENT_TERMS,
  PRODUCT_GROUPS,
  PRODUCTION_LINES,
  SEASONS,
  SIZE_SETS,
  SUB_PRODUCT_GROUPS,
  SUPPLIERS,
  TRANSPORT_COMPANIES,
  WAREHOUSES,
  WORKSHOPS,
} from './mock-data'
import {
  TEXTILE_AGE_GROUPS,
  TEXTILE_EMBROIDERY_TYPES,
  TEXTILE_FITS,
  TEXTILE_GENDERS,
  TEXTILE_GTIP_CODES,
  TEXTILE_MACHINE_TYPES,
  TEXTILE_PRINT_TYPES,
  TEXTILE_QUALITY_CODES,
  TEXTILE_SEASON_TYPES,
  TEXTILE_UNITS,
  TEXTILE_WAREHOUSE_TYPES,
  TEXTILE_WASH_TYPES,
} from './textile-master-seed'

const validateLookup = validateBase

const SEASON_TYPES = TEXTILE_SEASON_TYPES
const MACHINE_TYPES = TEXTILE_MACHINE_TYPES
const QUALITY_CODES = TEXTILE_QUALITY_CODES
const WAREHOUSE_TYPES = TEXTILE_WAREHOUSE_TYPES
const UNITS = TEXTILE_UNITS
const GENDERS = TEXTILE_GENDERS
const AGE_GROUPS = TEXTILE_AGE_GROUPS
const FITS = TEXTILE_FITS
const WASH_TYPES = TEXTILE_WASH_TYPES
const PRINT_TYPES = TEXTILE_PRINT_TYPES
const EMBROIDERY_TYPES = TEXTILE_EMBROIDERY_TYPES
const GTIP_CODES = TEXTILE_GTIP_CODES

export const countryRepository = createRepository(COUNTRIES, validateCountry)
export const currencyRepository = createRepository(CURRENCIES, validateCurrency)
export const customerRepository = createRepository(CUSTOMERS, validateCustomer)
export const brandRepository = createRepository(BRANDS, validateBrand)
export const buyerRepository = createRepository(BUYERS, validateBuyer)
export const merchandiserRepository = createRepository(MERCHANDISERS, validateMerchandiser)
export const supplierRepository = createRepository(SUPPLIERS, validateSupplier)
export const warehouseRepository = createRepository(WAREHOUSES, validateWarehouse)
export const workshopRepository = createRepository(WORKSHOPS, validateWorkshop)
export const seasonTypeRepository = createRepository(SEASON_TYPES, validateLookup)
export const seasonRepository = createRepository(SEASONS, validateSeason)
export const collectionRepository = createRepository(COLLECTIONS, validateCollection)
export const productGroupRepository = createRepository(PRODUCT_GROUPS, validateProductGroup)
export const subProductGroupRepository = createRepository(SUB_PRODUCT_GROUPS, validateSubProductGroup)
export const sizeSetRepository = createRepository(SIZE_SETS, validateSizeSet)
export const colorCardRepository = createRepository(COLOR_CARDS, validateColorCard)
export const fabricTypeRepository = createRepository(FABRIC_TYPES, validateFabricType)
export const fabricCompositionRepository = createRepository(
  FABRIC_COMPOSITIONS,
  validateFabricComposition,
)
export const accessoryCategoryRepository = createRepository(
  ACCESSORY_CATEGORIES,
  validateAccessoryCategory,
)
export const accessoryTypeRepository = createRepository(ACCESSORY_TYPES, validateAccessoryType)
export const operationRepository = createRepository(OPERATIONS, validateOperation)
export const productionLineRepository = createRepository(PRODUCTION_LINES, validateProductionLine)
export const machineTypeRepository = createRepository(MACHINE_TYPES, validateLookup)
export const machineRepository = createRepository(MACHINES, validateMachine)
export const qualityCodeRepository = createRepository(QUALITY_CODES, validateLookup)
export const warehouseTypeRepository = createRepository(WAREHOUSE_TYPES, validateLookup)
export const unitRepository = createRepository(UNITS, validateLookup)
export const genderRepository = createRepository(GENDERS, validateLookup)
export const ageGroupRepository = createRepository(AGE_GROUPS, validateLookup)
export const fitRepository = createRepository(FITS, validateLookup)
export const washTypeRepository = createRepository(WASH_TYPES, validateLookup)
export const printTypeRepository = createRepository(PRINT_TYPES, validateLookup)
export const embroideryTypeRepository = createRepository(EMBROIDERY_TYPES, validateLookup)
export const gtipCodeRepository = createRepository(GTIP_CODES, validateLookup)
export const employeeRepository = createRepository(EMPLOYEES, validateEmployee)
export const transportCompanyRepository = createRepository(
  TRANSPORT_COMPANIES,
  validateTransportCompany,
)
export const forwarderRepository = createRepository(FORWARDERS, validateForwarder)
export const containerTypeRepository = createRepository(CONTAINER_TYPES, validateContainerType)
export const incotermRepository = createRepository(INCOTERMS, validateIncoterm)
export const paymentTermRepository = createRepository(PAYMENT_TERMS, validatePaymentTerm)

/** Tüm master data repository kayıtları — Brain & coverage için */
export const ALL_MASTER_DATA_REPOSITORIES = {
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
