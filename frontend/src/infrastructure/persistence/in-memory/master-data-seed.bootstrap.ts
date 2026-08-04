/**
 * Master Data seed bootstrap — infrastructure katmanında lookup registry doldurma.
 * Domain servisleri seed array'lere erişmez.
 */
import { DEFAULT_TENANT_ID, requireUnitOfWork } from '@/domain/ports/persistence/persistence-registry'
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
} from '@/domain/master-data/mock-data'
import {
  ENTERPRISE_CUSTOMER_GROUPS,
  ENTERPRISE_DEPARTMENTS,
  ENTERPRISE_FABRIC_CATEGORIES,
  ENTERPRISE_MACHINE_GROUPS,
  ENTERPRISE_SUPPLIER_GROUPS,
  COMPANY_ATTRIBUTE_VALUES,
  FABRIC_TYPE_ATTRIBUTE_VALUES,
  MASTER_DATA_ATTRIBUTE_DEFINITIONS,
  MASTER_DATA_DEFAULT_PROFILES,
  MASTER_DATA_DEPENDENCIES,
  MASTER_DATA_VALIDATION_RULES,
  PRODUCT_TEMPLATES,
} from '@/domain/master-data/enterprise/enterprise-seed'
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
} from '@/domain/master-data/textile-master-seed'

let seeded = false

export function ensureMasterDataLookupsSeeded(): void {
  if (seeded) return

  const uow = requireUnitOfWork()
  const lookups = uow.masterDataLookups
  const tenantId = DEFAULT_TENANT_ID

  if (lookups.country.getAll(tenantId).length > 0) {
    seeded = true
    return
  }

  lookups.country.seedFromLegacy(tenantId, COUNTRIES)
  lookups.currency.seedFromLegacy(tenantId, CURRENCIES)
  lookups.customer.seedFromLegacy(tenantId, CUSTOMERS)
  lookups.brand.seedFromLegacy(tenantId, BRANDS)
  lookups.buyer.seedFromLegacy(tenantId, BUYERS)
  lookups.merchandiser.seedFromLegacy(tenantId, MERCHANDISERS)
  lookups.supplier.seedFromLegacy(tenantId, SUPPLIERS)
  lookups.warehouse.seedFromLegacy(tenantId, WAREHOUSES)
  lookups.workshop.seedFromLegacy(tenantId, WORKSHOPS)
  lookups.seasonType.seedFromLegacy(tenantId, TEXTILE_SEASON_TYPES)
  lookups.season.seedFromLegacy(tenantId, SEASONS)
  lookups.collection.seedFromLegacy(tenantId, COLLECTIONS)
  lookups.productGroup.seedFromLegacy(tenantId, PRODUCT_GROUPS)
  lookups.subProductGroup.seedFromLegacy(tenantId, SUB_PRODUCT_GROUPS)
  lookups.sizeSet.seedFromLegacy(tenantId, SIZE_SETS)
  lookups.colorCard.seedFromLegacy(tenantId, COLOR_CARDS)
  lookups.fabricType.seedFromLegacy(tenantId, FABRIC_TYPES)
  lookups.fabricComposition.seedFromLegacy(tenantId, FABRIC_COMPOSITIONS)
  lookups.accessoryCategory.seedFromLegacy(tenantId, ACCESSORY_CATEGORIES)
  lookups.accessoryType.seedFromLegacy(tenantId, ACCESSORY_TYPES)
  lookups.operation.seedFromLegacy(tenantId, OPERATIONS)
  lookups.productionLine.seedFromLegacy(tenantId, PRODUCTION_LINES)
  lookups.machineType.seedFromLegacy(tenantId, TEXTILE_MACHINE_TYPES)
  lookups.machine.seedFromLegacy(tenantId, MACHINES)
  lookups.qualityCode.seedFromLegacy(tenantId, TEXTILE_QUALITY_CODES)
  lookups.warehouseType.seedFromLegacy(tenantId, TEXTILE_WAREHOUSE_TYPES)
  lookups.unit.seedFromLegacy(tenantId, TEXTILE_UNITS)
  lookups.gender.seedFromLegacy(tenantId, TEXTILE_GENDERS)
  lookups.ageGroup.seedFromLegacy(tenantId, TEXTILE_AGE_GROUPS)
  lookups.fit.seedFromLegacy(tenantId, TEXTILE_FITS)
  lookups.washType.seedFromLegacy(tenantId, TEXTILE_WASH_TYPES)
  lookups.printType.seedFromLegacy(tenantId, TEXTILE_PRINT_TYPES)
  lookups.embroideryType.seedFromLegacy(tenantId, TEXTILE_EMBROIDERY_TYPES)
  lookups.gtipCode.seedFromLegacy(tenantId, TEXTILE_GTIP_CODES)
  lookups.employee.seedFromLegacy(tenantId, EMPLOYEES)
  lookups.transportCompany.seedFromLegacy(tenantId, TRANSPORT_COMPANIES)
  lookups.forwarder.seedFromLegacy(tenantId, FORWARDERS)
  lookups.containerType.seedFromLegacy(tenantId, CONTAINER_TYPES)
  lookups.incoterm.seedFromLegacy(tenantId, INCOTERMS)
  lookups.paymentTerm.seedFromLegacy(tenantId, PAYMENT_TERMS)

  uow.masterDataEnterpriseConfig.seedFromLegacy({
    attributeDefinitions: MASTER_DATA_ATTRIBUTE_DEFINITIONS,
    attributeValues: [...FABRIC_TYPE_ATTRIBUTE_VALUES, ...COMPANY_ATTRIBUTE_VALUES],
    validationRules: MASTER_DATA_VALIDATION_RULES,
    dependencies: MASTER_DATA_DEPENDENCIES,
    defaultProfiles: MASTER_DATA_DEFAULT_PROFILES,
    productTemplates: PRODUCT_TEMPLATES,
    hierarchyEntities: {
      fabricCategory: ENTERPRISE_FABRIC_CATEGORIES,
      customerGroup: ENTERPRISE_CUSTOMER_GROUPS,
      supplierGroup: ENTERPRISE_SUPPLIER_GROUPS,
      department: ENTERPRISE_DEPARTMENTS,
      machineGroup: ENTERPRISE_MACHINE_GROUPS,
    },
  })

  seeded = true
}

export function resetMasterDataSeedForTests(): void {
  seeded = false
}
