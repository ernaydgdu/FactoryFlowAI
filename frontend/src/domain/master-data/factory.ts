import type {
  AccessoryCategory,
  AccessoryType,
  AgeGroup,
  BaseMasterEntity,
  Brand,
  Buyer,
  Collection,
  ColorCard,
  ContainerType,
  Country,
  Currency,
  Customer,
  CustomerGroup,
  EmbroideryType,
  Employee,
  FabricCategory,
  FabricComposition,
  FabricType,
  Fit,
  Department,
  Forwarder,
  Gender,
  GtipCode,
  Incoterm,
  Machine,
  MachineGroup,
  MachineType,
  MasterEntityStatus,
  Merchandiser,
  Operation,
  PaymentTerm,
  PrintType,
  ProductGroup,
  ProductionLine,
  QualityCode,
  Season,
  SeasonType,
  SizeSet,
  SubProductGroup,
  Supplier,
  SupplierGroup,
  TextileLookup,
  TransportCompany,
  Unit,
  ValidationResult,
  Warehouse,
  WarehouseTypeMaster,
  WashType,
  Workshop,
} from './types'
import {
  mergeValidation,
  validateBase,
  validateEmail,
  validateNonEmptyArray,
  validatePositiveNumber,
  validateRequiredId,
  validationFail,
  validationOk,
} from './validation'

import { localizationKey, masterDataId } from './enterprise/id'

const TS = '2026-01-01T00:00:00.000Z'
const SYSTEM_USER = 'system@kepler.local'

export type EnterpriseBaseInput = Partial<BaseMasterEntity> & {
  entityNamespace?: string
}

function base(
  id: string,
  code: string,
  name: string,
  extras?: EnterpriseBaseInput,
): BaseMasterEntity {
  const isActive = extras?.isActive ?? (extras?.status !== 'Inactive')
  const status: MasterEntityStatus = isActive ? 'Active' : 'Inactive'
  const entityNamespace = extras?.entityNamespace ?? 'master'
  const resolvedId = extras?.id ?? id ?? masterDataId(entityNamespace, code)

  return {
    id: resolvedId,
    code,
    name,
    description: extras?.description,
    shortDescription: extras?.shortDescription ?? extras?.description?.slice(0, 80),
    externalCode: extras?.externalCode ?? code,
    barcode: extras?.barcode,
    status,
    isActive,
    isSystem: extras?.isSystem ?? false,
    sortOrder: extras?.sortOrder ?? 0,
    version: extras?.version ?? 1,
    effectiveFrom: extras?.effectiveFrom ?? TS,
    effectiveTo: extras?.effectiveTo,
    createdAt: extras?.createdAt ?? TS,
    createdBy: extras?.createdBy ?? SYSTEM_USER,
    updatedAt: extras?.updatedAt ?? TS,
    updatedBy: extras?.updatedBy ?? SYSTEM_USER,
    deletedAt: extras?.deletedAt,
    deletedBy: extras?.deletedBy,
    localizationKey: extras?.localizationKey ?? localizationKey(entityNamespace, code),
    localization: extras?.localization,
  }
}

function withLocalization(
  name: string,
  description: string | undefined,
  enName?: string,
): BaseMasterEntity['localization'] {
  if (!enName && !description) return undefined
  return {
    tr: { name, description },
    en: enName ? { name: enName, description } : undefined,
  }
}

export function createTextileLookup(
  prefix: string,
  input: Partial<TextileLookup> & Pick<TextileLookup, 'code' | 'name'>,
): TextileLookup {
  const id = input.id ?? `${prefix}-${input.code.toLowerCase().replace(/_/g, '-')}`
  return {
    ...base(id, input.code, input.name, {
      status: input.status,
      description: input.description ?? input.name,
      version: input.version,
      localization: input.localization ?? withLocalization(input.name, input.description, undefined),
    }),
  }
}

export function createCountry(input: Partial<Country> & Pick<Country, 'code' | 'name' | 'iso2' | 'iso3'>): Country {
  return {
    ...base(input.id ?? `cnt-${input.code}`, input.code, input.name, { status: input.status, description: input.description }),
    iso2: input.iso2,
    iso3: input.iso3,
  }
}

export function createCurrency(input: Partial<Currency> & Pick<Currency, 'code' | 'name' | 'symbol' | 'isoCode'>): Currency {
  return { ...base(input.id ?? `cur-${input.code}`, input.code, input.name, { status: input.status, description: input.description }), symbol: input.symbol, isoCode: input.isoCode }
}

export function createCustomer(input: Partial<Customer> & Pick<Customer, 'code' | 'name' | 'countryId' | 'currencyId' | 'city'>): Customer {
  return {
    ...base(input.id ?? `cus-${input.code}`, input.code, input.name, { status: input.status, description: input.description }),
    countryId: input.countryId,
    currencyId: input.currencyId,
    city: input.city,
    taxNo: input.taxNo,
  }
}

export function createBrand(input: Partial<Brand> & Pick<Brand, 'code' | 'name' | 'customerId'>): Brand {
  return { ...base(input.id ?? `brd-${input.code}`, input.code, input.name, { status: input.status, description: input.description }), customerId: input.customerId }
}

export function createBuyer(input: Partial<Buyer> & Pick<Buyer, 'code' | 'name' | 'customerId' | 'email'>): Buyer {
  return { ...base(input.id ?? `buy-${input.code}`, input.code, input.name, { status: input.status, description: input.description }), customerId: input.customerId, email: input.email, phone: input.phone }
}

export function createMerchandiser(input: Partial<Merchandiser> & Pick<Merchandiser, 'code' | 'name' | 'customerId' | 'email'>): Merchandiser {
  return { ...base(input.id ?? `mer-${input.code}`, input.code, input.name, { status: input.status, description: input.description }), customerId: input.customerId, email: input.email }
}

export function createSupplier(input: Partial<Supplier> & Pick<Supplier, 'code' | 'name' | 'countryId' | 'leadTimeDays' | 'currencyId'> & { category?: Supplier['category']; categoryCode?: string }): Supplier {
  const categoryCode = input.categoryCode ?? input.category ?? 'FABRIC'
  return {
    ...base(input.id ?? `sup-${input.code}`, input.code, input.name, { status: input.status, description: input.description, entityNamespace: 'supplier' }),
    countryId: input.countryId,
    supplierGroupId: input.supplierGroupId,
    categoryCode,
    category: input.category,
    leadTimeDays: input.leadTimeDays,
    currencyId: input.currencyId,
  }
}

export function createWarehouse(input: Partial<Warehouse> & Pick<Warehouse, 'code' | 'name' | 'location' | 'countryId'> & { type?: Warehouse['type']; warehouseTypeId?: string }): Warehouse {
  const warehouseTypeId = input.warehouseTypeId ?? mapLegacyWarehouseType(input.type)
  return {
    ...base(input.id ?? `wh-${input.code}`, input.code, input.name, { status: input.status, description: input.description, entityNamespace: 'warehouse' }),
    warehouseTypeId,
    type: input.type,
    location: input.location,
    countryId: input.countryId,
    parentId: input.parentId,
    hierarchyGroup: input.hierarchyGroup,
  }
}

function mapLegacyWarehouseType(type?: Warehouse['type']): string {
  const map: Record<string, string> = {
    Hammadde: 'wht-raw_mat',
    Kumaş: 'wht-fabric',
    Aksesuar: 'wht-accessory',
    Kesimhane: 'wht-cutting',
    Fason: 'wht-workshop',
    Yıkama: 'wht-washing',
    Mamül: 'wht-fg',
    İade: 'wht-return',
    Fire: 'wht-scrap',
    Numune: 'wht-sample',
    Kalite: 'wht-fg',
    'Ütü Paket': 'wht-fg',
    Hurda: 'wht-scrap',
  }
  return type ? map[type] ?? 'wht-raw_mat' : 'wht-raw_mat'
}

export function createWorkshop(input: Partial<Workshop> & Pick<Workshop, 'code' | 'name' | 'warehouseId' | 'location' | 'monthlyCapacity'>): Workshop {
  return {
    ...base(input.id ?? `wsh-${input.code}`, input.code, input.name, { status: input.status, description: input.description }),
    warehouseId: input.warehouseId,
    location: input.location,
    monthlyCapacity: input.monthlyCapacity,
    currentLoad: input.currentLoad ?? 0,
  }
}

export function createSeason(
  input: Partial<Season> & Pick<Season, 'code' | 'name' | 'year' | 'period' | 'seasonTypeId'>,
): Season {
  return {
    ...base(input.id ?? `ssn-${input.code}`, input.code, input.name, { status: input.status, description: input.description }),
    year: input.year,
    period: input.period,
    seasonTypeId: input.seasonTypeId,
  }
}

export function createCollection(input: Partial<Collection> & Pick<Collection, 'code' | 'name' | 'seasonId' | 'brandId'>): Collection {
  return { ...base(input.id ?? `col-${input.code}`, input.code, input.name, { status: input.status, description: input.description }), seasonId: input.seasonId, brandId: input.brandId }
}

export function createProductGroup(input: Partial<ProductGroup> & Pick<ProductGroup, 'code' | 'name'>): ProductGroup {
  return {
    ...base(input.id ?? `pg-${input.code}`, input.code, input.name, {
      status: input.status,
      description: input.description,
      entityNamespace: 'productGroup',
    }),
    parentId: input.parentId,
  }
}

export function createSubProductGroup(input: Partial<SubProductGroup> & Pick<SubProductGroup, 'code' | 'name' | 'productGroupId'>): SubProductGroup {
  return { ...base(input.id ?? `spg-${input.code}`, input.code, input.name, { status: input.status, description: input.description }), productGroupId: input.productGroupId }
}

export function createSizeSet(input: Partial<SizeSet> & Pick<SizeSet, 'code' | 'name' | 'productType' | 'sizes'>): SizeSet {
  return { ...base(input.id ?? `ss-${input.code.toLowerCase()}`, input.code, input.name, { status: input.status, description: input.description }), productType: input.productType, sizes: input.sizes }
}

export function createColorCard(input: Partial<ColorCard> & Pick<ColorCard, 'code' | 'name' | 'pantone' | 'colorGroup' | 'hex' | 'rgb' | 'internalColorCode'>): ColorCard {
  return {
    ...base(input.id ?? `clr-${input.code}`, input.code, input.name, { status: input.status, description: input.description }),
    pantone: input.pantone,
    colorGroup: input.colorGroup,
    hex: input.hex,
    rgb: input.rgb,
    internalColorCode: input.internalColorCode,
    customerColorCode: input.customerColorCode ?? input.customerCode,
    customerCode: input.customerColorCode ?? input.customerCode,
    description: input.description,
  }
}

export function createFabricType(input: Partial<FabricType> & Pick<FabricType, 'code' | 'name'>): FabricType {
  return {
    ...base(input.id ?? `ft-${input.code}`, input.code, input.name, { status: input.status, description: input.description, entityNamespace: 'fabricType' }),
    parentId: input.parentId,
    fabricCategoryId: input.fabricCategoryId,
  }
}

export function createFabricComposition(input: Partial<FabricComposition> & Pick<FabricComposition, 'code' | 'name' | 'fiberContent'>): FabricComposition {
  return { ...base(input.id ?? `fc-${input.code}`, input.code, input.name, { status: input.status, description: input.description }), fiberContent: input.fiberContent }
}

export function createAccessoryCategory(input: Partial<AccessoryCategory> & Pick<AccessoryCategory, 'code' | 'name'>): AccessoryCategory {
  return {
    ...base(input.id ?? `ac-${input.code}`, input.code, input.name, { status: input.status, description: input.description, entityNamespace: 'accessoryCategory' }),
    parentId: input.parentId,
  }
}

export function createAccessoryType(input: Partial<AccessoryType> & Pick<AccessoryType, 'code' | 'name' | 'categoryId'>): AccessoryType {
  return { ...base(input.id ?? `at-${input.code}`, input.code, input.name, { status: input.status, description: input.description }), categoryId: input.categoryId }
}

export function createOperation(input: Partial<Operation> & Pick<Operation, 'code' | 'name' | 'department' | 'sequence' | 'standardMinutes'>): Operation {
  return {
    ...base(input.id ?? `op-${input.code}`, input.code, input.name, { status: input.status, description: input.description, entityNamespace: 'operation' }),
    parentId: input.parentId,
    departmentId: input.departmentId,
    department: input.department,
    sequence: input.sequence,
    standardMinutes: input.standardMinutes,
  }
}

export function createProductionLine(input: Partial<ProductionLine> & Pick<ProductionLine, 'code' | 'name' | 'workshopId' | 'capacityPerDay'>): ProductionLine {
  return { ...base(input.id ?? `pl-${input.code}`, input.code, input.name, { status: input.status, description: input.description }), workshopId: input.workshopId, capacityPerDay: input.capacityPerDay }
}

export function createMachine(
  input: Partial<Machine> & Pick<Machine, 'code' | 'name' | 'productionLineId' | 'machineTypeId' | 'machineType'>,
): Machine {
  return {
    ...base(input.id ?? `mc-${input.code}`, input.code, input.name, { status: input.status, description: input.description }),
    productionLineId: input.productionLineId,
    machineTypeId: input.machineTypeId,
    machineType: input.machineType,
  }
}

export function createGender(input: Partial<Gender> & Pick<Gender, 'code' | 'name'>): Gender {
  return createTextileLookup('gen', input)
}

export function createAgeGroup(input: Partial<AgeGroup> & Pick<AgeGroup, 'code' | 'name'>): AgeGroup {
  return createTextileLookup('age', input)
}

export function createFit(input: Partial<Fit> & Pick<Fit, 'code' | 'name'>): Fit {
  return createTextileLookup('fit', input)
}

export function createWashType(input: Partial<WashType> & Pick<WashType, 'code' | 'name'>): WashType {
  return createTextileLookup('wash', input)
}

export function createPrintType(input: Partial<PrintType> & Pick<PrintType, 'code' | 'name'>): PrintType {
  return createTextileLookup('prt', input)
}

export function createEmbroideryType(input: Partial<EmbroideryType> & Pick<EmbroideryType, 'code' | 'name'>): EmbroideryType {
  return createTextileLookup('emb', input)
}

export function createSeasonType(input: Partial<SeasonType> & Pick<SeasonType, 'code' | 'name'>): SeasonType {
  return createTextileLookup('sst', input)
}

export function createMachineType(input: Partial<MachineType> & Pick<MachineType, 'code' | 'name'>): MachineType {
  return createTextileLookup('mct', input)
}

export function createQualityCode(
  input: Partial<QualityCode> & Pick<QualityCode, 'code' | 'name'> & { severityCode?: string; severity?: QualityCode['severity'] },
): QualityCode {
  const severityCode = input.severityCode ?? input.severity ?? 'Process'
  return { ...createTextileLookup('qc', input), severityCode, severity: input.severity }
}

export function createWarehouseTypeMaster(
  input: Partial<WarehouseTypeMaster> & Pick<WarehouseTypeMaster, 'code' | 'name' | 'legacyType'>,
): WarehouseTypeMaster {
  return { ...createTextileLookup('wht', input), legacyType: input.legacyType }
}

export function createUnit(input: Partial<Unit> & Pick<Unit, 'code' | 'name' | 'symbol'>): Unit {
  return { ...createTextileLookup('unt', input), symbol: input.symbol }
}

export function createGtipCode(
  input: Partial<GtipCode> & Pick<GtipCode, 'code' | 'name' | 'hsCode' | 'description'>,
): GtipCode {
  return {
    ...base(input.id ?? `gtip-${input.code}`, input.code, input.name, {
      status: input.status,
      description: input.description,
    }),
    hsCode: input.hsCode,
    description: input.description,
  }
}

export function createEmployee(input: Partial<Employee> & Pick<Employee, 'code' | 'name' | 'role' | 'department' | 'email'>): Employee {
  return { ...base(input.id ?? `emp-${input.code}`, input.code, input.name, { status: input.status, description: input.description }), role: input.role, department: input.department, email: input.email, workshopId: input.workshopId }
}

export function createTransportCompany(input: Partial<TransportCompany> & Pick<TransportCompany, 'code' | 'name' | 'serviceType'>): TransportCompany {
  return { ...base(input.id ?? `tc-${input.code}`, input.code, input.name, { status: input.status, description: input.description }), serviceType: input.serviceType }
}

export function createForwarder(input: Partial<Forwarder> & Pick<Forwarder, 'code' | 'name' | 'transportCompanyId' | 'contactEmail'>): Forwarder {
  return { ...base(input.id ?? `fwd-${input.code}`, input.code, input.name, { status: input.status, description: input.description }), transportCompanyId: input.transportCompanyId, contactEmail: input.contactEmail }
}

export function createContainerType(input: Partial<ContainerType> & Pick<ContainerType, 'code' | 'name' | 'teu' | 'maxWeightKg'>): ContainerType {
  return { ...base(input.id ?? `ct-${input.code}`, input.code, input.name, { status: input.status, description: input.description }), teu: input.teu, maxWeightKg: input.maxWeightKg }
}

export function createIncoterm(input: Partial<Incoterm> & Pick<Incoterm, 'code' | 'name' | 'description'>): Incoterm {
  return { ...base(input.id ?? `inc-${input.code}`, input.code, input.name, { status: input.status, description: input.description }), description: input.description }
}

export function createPaymentTerm(input: Partial<PaymentTerm> & Pick<PaymentTerm, 'code' | 'name' | 'days' | 'description'>): PaymentTerm {
  return { ...base(input.id ?? `pt-${input.code}`, input.code, input.name, { status: input.status, description: input.description }), days: input.days, description: input.description }
}

export function createCustomerGroup(input: Partial<CustomerGroup> & Pick<CustomerGroup, 'code' | 'name'>): CustomerGroup {
  return { ...base(input.id ?? `cg-${input.code}`, input.code, input.name, { status: input.status, description: input.description, entityNamespace: 'customerGroup', sortOrder: input.sortOrder }), parentId: input.parentId }
}

export function createSupplierGroup(input: Partial<SupplierGroup> & Pick<SupplierGroup, 'code' | 'name'>): SupplierGroup {
  return { ...base(input.id ?? `sg-${input.code}`, input.code, input.name, { status: input.status, description: input.description, entityNamespace: 'supplierGroup', sortOrder: input.sortOrder }), parentId: input.parentId }
}

export function createDepartment(input: Partial<Department> & Pick<Department, 'code' | 'name'>): Department {
  return { ...base(input.id ?? `dept-${input.code}`, input.code, input.name, { status: input.status, description: input.description, entityNamespace: 'department', sortOrder: input.sortOrder }), parentId: input.parentId }
}

export function createMachineGroup(input: Partial<MachineGroup> & Pick<MachineGroup, 'code' | 'name'>): MachineGroup {
  return { ...base(input.id ?? `mg-${input.code}`, input.code, input.name, { status: input.status, description: input.description, entityNamespace: 'machineGroup', sortOrder: input.sortOrder }), parentId: input.parentId, workshopId: input.workshopId }
}

export function createFabricCategory(input: Partial<FabricCategory> & Pick<FabricCategory, 'code' | 'name'>): FabricCategory {
  return { ...base(input.id ?? `fcat-${input.code}`, input.code, input.name, { status: input.status, description: input.description, entityNamespace: 'fabricCategory', sortOrder: input.sortOrder }), parentId: input.parentId }
}

// --- Entity-specific validators ---

export function validateCustomer(entity: Partial<Customer>): ValidationResult {
  return mergeValidation(
    validateBase(entity),
    validateRequiredId(entity.countryId, 'Ülke') ? validationFail([validateRequiredId(entity.countryId, 'Ülke')!]) : validationOk(),
    validateRequiredId(entity.currencyId, 'Para birimi') ? validationFail([validateRequiredId(entity.currencyId, 'Para birimi')!]) : validationOk(),
  )
}

export function validateBrand(entity: Partial<Brand>): ValidationResult {
  const err = validateRequiredId(entity.customerId, 'Müşteri')
  return mergeValidation(validateBase(entity), err ? validationFail([err]) : validationOk())
}

export function validateBuyer(entity: Partial<Buyer>): ValidationResult {
  const errs = [validateRequiredId(entity.customerId, 'Müşteri'), validateEmail(entity.email)].filter(Boolean) as string[]
  return mergeValidation(validateBase(entity), errs.length ? validationFail(errs) : validationOk())
}

export function validateMerchandiser(entity: Partial<Merchandiser>): ValidationResult {
  const errs = [validateRequiredId(entity.customerId, 'Müşteri'), validateEmail(entity.email)].filter(Boolean) as string[]
  return mergeValidation(validateBase(entity), errs.length ? validationFail(errs) : validationOk())
}

export function validateSupplier(entity: Partial<Supplier>): ValidationResult {
  const errs = [
    validateRequiredId(entity.countryId, 'Ülke'),
    validatePositiveNumber(entity.leadTimeDays, 'Lead time'),
  ].filter(Boolean) as string[]
  return mergeValidation(validateBase(entity), errs.length ? validationFail(errs) : validationOk())
}

export function validateWarehouse(entity: Partial<Warehouse>): ValidationResult {
  const err = validateRequiredId(entity.countryId, 'Ülke')
  return mergeValidation(validateBase(entity), err ? validationFail([err]) : validationOk())
}

export function validateWorkshop(entity: Partial<Workshop>): ValidationResult {
  const errs = [
    validateRequiredId(entity.warehouseId, 'Depo'),
    validatePositiveNumber(entity.monthlyCapacity, 'Aylık kapasite'),
  ].filter(Boolean) as string[]
  return mergeValidation(validateBase(entity), errs.length ? validationFail(errs) : validationOk())
}

export function validateSizeSet(entity: Partial<SizeSet>): ValidationResult {
  const err = validateNonEmptyArray(entity.sizes, 'Beden listesi')
  return mergeValidation(validateBase(entity), err ? validationFail([err]) : validationOk())
}

export function validateColorCard(entity: Partial<ColorCard>): ValidationResult {
  const errs: string[] = []
  if (!entity.pantone?.trim()) errs.push('Pantone zorunludur')
  if (!entity.colorGroup?.trim()) errs.push('Renk grubu zorunludur')
  return mergeValidation(validateBase(entity), errs.length ? validationFail(errs) : validationOk())
}

export function validateOperation(entity: Partial<Operation>): ValidationResult {
  const err = validatePositiveNumber(entity.standardMinutes, 'Standart süre')
  return mergeValidation(validateBase(entity), err ? validationFail([err]) : validationOk())
}

export function validatePaymentTerm(entity: Partial<PaymentTerm>): ValidationResult {
  const err = validatePositiveNumber(entity.days, 'Vade günü')
  return mergeValidation(validateBase(entity), err ? validationFail([err]) : validationOk())
}

export function validateContainerType(entity: Partial<ContainerType>): ValidationResult {
  const err = validatePositiveNumber(entity.teu, 'TEU')
  return mergeValidation(validateBase(entity), err ? validationFail([err]) : validationOk())
}

export function validateIncoterm(entity: Partial<Incoterm>): ValidationResult {
  return validateBase(entity)
}

export function validateCollection(entity: Partial<Collection>): ValidationResult {
  const errs = [validateRequiredId(entity.seasonId, 'Sezon'), validateRequiredId(entity.brandId, 'Marka')].filter(Boolean) as string[]
  return mergeValidation(validateBase(entity), errs.length ? validationFail(errs) : validationOk())
}

export function validateSubProductGroup(entity: Partial<SubProductGroup>): ValidationResult {
  const err = validateRequiredId(entity.productGroupId, 'Ürün grubu')
  return mergeValidation(validateBase(entity), err ? validationFail([err]) : validationOk())
}

export function validateAccessoryType(entity: Partial<AccessoryType>): ValidationResult {
  const err = validateRequiredId(entity.categoryId, 'Aksesuar kategorisi')
  return mergeValidation(validateBase(entity), err ? validationFail([err]) : validationOk())
}

export function validateProductionLine(entity: Partial<ProductionLine>): ValidationResult {
  const err = validateRequiredId(entity.workshopId, 'Atölye')
  return mergeValidation(validateBase(entity), err ? validationFail([err]) : validationOk())
}

export function validateMachine(entity: Partial<Machine>): ValidationResult {
  const errs = [
    validateRequiredId(entity.productionLineId, 'Üretim hattı'),
    validateRequiredId(entity.machineTypeId, 'Makine tipi'),
  ].filter(Boolean) as string[]
  return mergeValidation(validateBase(entity), errs.length ? validationFail(errs) : validationOk())
}

export function validateEmployee(entity: Partial<Employee>): ValidationResult {
  const err = validateEmail(entity.email)
  return mergeValidation(validateBase(entity), err ? validationFail([err]) : validationOk())
}

export function validateForwarder(entity: Partial<Forwarder>): ValidationResult {
  const err = validateRequiredId(entity.transportCompanyId, 'Taşıyıcı')
  return mergeValidation(validateBase(entity), err ? validationFail([err]) : validationOk())
}

export function validateCountry(entity: Partial<Country>): ValidationResult {
  return validateBase(entity)
}

export function validateCurrency(entity: Partial<Currency>): ValidationResult {
  return validateBase(entity)
}

export function validateSeason(entity: Partial<Season>): ValidationResult {
  const err = validateRequiredId(entity.seasonTypeId, 'Sezon tipi')
  return mergeValidation(validateBase(entity), err ? validationFail([err]) : validationOk())
}

export function validateProductGroup(entity: Partial<ProductGroup>): ValidationResult {
  return validateBase(entity)
}

export function validateFabricType(entity: Partial<FabricType>): ValidationResult {
  return validateBase(entity)
}

export function validateFabricComposition(entity: Partial<FabricComposition>): ValidationResult {
  return validateBase(entity)
}

export function validateAccessoryCategory(entity: Partial<AccessoryCategory>): ValidationResult {
  return validateBase(entity)
}

export function validateTransportCompany(entity: Partial<TransportCompany>): ValidationResult {
  return validateBase(entity)
}
