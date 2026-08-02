import { createPortBackedRepository, masterDataLookups } from './master-data-port-access'
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

const validateLookup = validateBase

export const countryRepository = createPortBackedRepository(
  () => masterDataLookups().country,
  validateCountry,
)
export const currencyRepository = createPortBackedRepository(
  () => masterDataLookups().currency,
  validateCurrency,
)
export const customerRepository = createPortBackedRepository(
  () => masterDataLookups().customer,
  validateCustomer,
)
export const brandRepository = createPortBackedRepository(() => masterDataLookups().brand, validateBrand)
export const buyerRepository = createPortBackedRepository(() => masterDataLookups().buyer, validateBuyer)
export const merchandiserRepository = createPortBackedRepository(
  () => masterDataLookups().merchandiser,
  validateMerchandiser,
)
export const supplierRepository = createPortBackedRepository(
  () => masterDataLookups().supplier,
  validateSupplier,
)
export const warehouseRepository = createPortBackedRepository(
  () => masterDataLookups().warehouse,
  validateWarehouse,
)
export const workshopRepository = createPortBackedRepository(
  () => masterDataLookups().workshop,
  validateWorkshop,
)
export const seasonTypeRepository = createPortBackedRepository(
  () => masterDataLookups().seasonType,
  validateLookup,
)
export const seasonRepository = createPortBackedRepository(
  () => masterDataLookups().season,
  validateSeason,
)
export const collectionRepository = createPortBackedRepository(
  () => masterDataLookups().collection,
  validateCollection,
)
export const productGroupRepository = createPortBackedRepository(
  () => masterDataLookups().productGroup,
  validateProductGroup,
)
export const subProductGroupRepository = createPortBackedRepository(
  () => masterDataLookups().subProductGroup,
  validateSubProductGroup,
)
export const sizeSetRepository = createPortBackedRepository(
  () => masterDataLookups().sizeSet,
  validateSizeSet,
)
export const colorCardRepository = createPortBackedRepository(
  () => masterDataLookups().colorCard,
  validateColorCard,
)
export const fabricTypeRepository = createPortBackedRepository(
  () => masterDataLookups().fabricType,
  validateFabricType,
)
export const fabricCompositionRepository = createPortBackedRepository(
  () => masterDataLookups().fabricComposition,
  validateFabricComposition,
)
export const accessoryCategoryRepository = createPortBackedRepository(
  () => masterDataLookups().accessoryCategory,
  validateAccessoryCategory,
)
export const accessoryTypeRepository = createPortBackedRepository(
  () => masterDataLookups().accessoryType,
  validateAccessoryType,
)
export const operationRepository = createPortBackedRepository(
  () => masterDataLookups().operation,
  validateOperation,
)
export const productionLineRepository = createPortBackedRepository(
  () => masterDataLookups().productionLine,
  validateProductionLine,
)
export const machineTypeRepository = createPortBackedRepository(
  () => masterDataLookups().machineType,
  validateLookup,
)
export const machineRepository = createPortBackedRepository(
  () => masterDataLookups().machine,
  validateMachine,
)
export const qualityCodeRepository = createPortBackedRepository(
  () => masterDataLookups().qualityCode,
  validateLookup,
)
export const warehouseTypeRepository = createPortBackedRepository(
  () => masterDataLookups().warehouseType,
  validateLookup,
)
export const unitRepository = createPortBackedRepository(() => masterDataLookups().unit, validateLookup)
export const genderRepository = createPortBackedRepository(() => masterDataLookups().gender, validateLookup)
export const ageGroupRepository = createPortBackedRepository(
  () => masterDataLookups().ageGroup,
  validateLookup,
)
export const fitRepository = createPortBackedRepository(() => masterDataLookups().fit, validateLookup)
export const washTypeRepository = createPortBackedRepository(
  () => masterDataLookups().washType,
  validateLookup,
)
export const printTypeRepository = createPortBackedRepository(
  () => masterDataLookups().printType,
  validateLookup,
)
export const embroideryTypeRepository = createPortBackedRepository(
  () => masterDataLookups().embroideryType,
  validateLookup,
)
export const gtipCodeRepository = createPortBackedRepository(
  () => masterDataLookups().gtipCode,
  validateLookup,
)
export const employeeRepository = createPortBackedRepository(
  () => masterDataLookups().employee,
  validateEmployee,
)
export const transportCompanyRepository = createPortBackedRepository(
  () => masterDataLookups().transportCompany,
  validateTransportCompany,
)
export const forwarderRepository = createPortBackedRepository(
  () => masterDataLookups().forwarder,
  validateForwarder,
)
export const containerTypeRepository = createPortBackedRepository(
  () => masterDataLookups().containerType,
  validateContainerType,
)
export const incotermRepository = createPortBackedRepository(
  () => masterDataLookups().incoterm,
  validateIncoterm,
)
export const paymentTermRepository = createPortBackedRepository(
  () => masterDataLookups().paymentTerm,
  validatePaymentTerm,
)

/** @deprecated Doğrudan store kullanımı kaldırıldı — createRepository yalnızca test/backward compat için export edilir */
export { createRepository }

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
