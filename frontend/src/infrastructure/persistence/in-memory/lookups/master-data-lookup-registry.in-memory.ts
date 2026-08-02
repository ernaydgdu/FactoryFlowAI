import type {
  AccessoryCategory,
  AccessoryType,
  AgeGroup,
  Brand,
  Buyer,
  Collection,
  ColorCard,
  ContainerType,
  Country,
  Currency,
  Customer,
  Employee,
  EmbroideryType,
  FabricComposition,
  FabricType,
  Fit,
  Forwarder,
  Gender,
  GtipCode,
  Incoterm,
  Machine,
  MachineType,
  Merchandiser,
  Operation,
  PaymentTerm,
  PrintType,
  ProductGroup,
  ProductionLine,
  QualityCode,
  Season,
  SizeSet,
  SubProductGroup,
  Supplier,
  TextileLookup,
  TransportCompany,
  Unit,
  Warehouse,
  WarehouseTypeMaster,
  WashType,
  Workshop,
} from '@/domain/master-data/types'
import type { BaseMasterEntity } from '@/domain/master-data/types'
import type { IMasterDataLookupRegistryPort } from '@/domain/ports/persistence/lookups/master-data-lookup-registry.port'

import { MasterDataLookupInMemoryRepository } from './master-data-lookup.in-memory.repository'

export class MasterDataLookupRegistryInMemory implements IMasterDataLookupRegistryPort {
  country = new MasterDataLookupInMemoryRepository<Country>()
  currency = new MasterDataLookupInMemoryRepository<Currency>()
  customer = new MasterDataLookupInMemoryRepository<Customer>()
  brand = new MasterDataLookupInMemoryRepository<Brand>()
  buyer = new MasterDataLookupInMemoryRepository<Buyer>()
  merchandiser = new MasterDataLookupInMemoryRepository<Merchandiser>()
  supplier = new MasterDataLookupInMemoryRepository<Supplier>()
  warehouse = new MasterDataLookupInMemoryRepository<Warehouse>()
  workshop = new MasterDataLookupInMemoryRepository<Workshop>()
  seasonType = new MasterDataLookupInMemoryRepository<TextileLookup>()
  season = new MasterDataLookupInMemoryRepository<Season>()
  collection = new MasterDataLookupInMemoryRepository<Collection>()
  productGroup = new MasterDataLookupInMemoryRepository<ProductGroup>()
  subProductGroup = new MasterDataLookupInMemoryRepository<SubProductGroup>()
  sizeSet = new MasterDataLookupInMemoryRepository<SizeSet>()
  colorCard = new MasterDataLookupInMemoryRepository<ColorCard>()
  fabricType = new MasterDataLookupInMemoryRepository<FabricType>()
  fabricComposition = new MasterDataLookupInMemoryRepository<FabricComposition>()
  accessoryCategory = new MasterDataLookupInMemoryRepository<AccessoryCategory>()
  accessoryType = new MasterDataLookupInMemoryRepository<AccessoryType>()
  operation = new MasterDataLookupInMemoryRepository<Operation>()
  productionLine = new MasterDataLookupInMemoryRepository<ProductionLine>()
  machineType = new MasterDataLookupInMemoryRepository<MachineType>()
  machine = new MasterDataLookupInMemoryRepository<Machine>()
  qualityCode = new MasterDataLookupInMemoryRepository<QualityCode>()
  warehouseType = new MasterDataLookupInMemoryRepository<WarehouseTypeMaster>()
  unit = new MasterDataLookupInMemoryRepository<Unit>()
  gender = new MasterDataLookupInMemoryRepository<Gender>()
  ageGroup = new MasterDataLookupInMemoryRepository<AgeGroup>()
  fit = new MasterDataLookupInMemoryRepository<Fit>()
  washType = new MasterDataLookupInMemoryRepository<WashType>()
  printType = new MasterDataLookupInMemoryRepository<PrintType>()
  embroideryType = new MasterDataLookupInMemoryRepository<EmbroideryType>()
  gtipCode = new MasterDataLookupInMemoryRepository<GtipCode>()
  employee = new MasterDataLookupInMemoryRepository<Employee>()
  transportCompany = new MasterDataLookupInMemoryRepository<TransportCompany>()
  forwarder = new MasterDataLookupInMemoryRepository<Forwarder>()
  containerType = new MasterDataLookupInMemoryRepository<ContainerType>()
  incoterm = new MasterDataLookupInMemoryRepository<Incoterm>()
  paymentTerm = new MasterDataLookupInMemoryRepository<PaymentTerm>()

  private lookupKeys(): (keyof IMasterDataLookupRegistryPort)[] {
    return [
      'country', 'currency', 'customer', 'brand', 'buyer', 'merchandiser', 'supplier',
      'warehouse', 'workshop', 'seasonType', 'season', 'collection', 'productGroup',
      'subProductGroup', 'sizeSet', 'colorCard', 'fabricType', 'fabricComposition',
      'accessoryCategory', 'accessoryType', 'operation', 'productionLine', 'machineType',
      'machine', 'qualityCode', 'warehouseType', 'unit', 'gender', 'ageGroup', 'fit',
      'washType', 'printType', 'embroideryType', 'gtipCode', 'employee', 'transportCompany',
      'forwarder', 'containerType', 'incoterm', 'paymentTerm',
    ]
  }

  captureSnapshot(): Record<string, unknown[]> {
    const snap: Record<string, unknown[]> = {}
    for (const key of this.lookupKeys()) {
      const repo = this[key] as MasterDataLookupInMemoryRepository<BaseMasterEntity>
      snap[key] = repo.captureSnapshot()
    }
    return snap
  }

  restoreSnapshot(state: Record<string, unknown[]>): void {
    for (const key of this.lookupKeys()) {
      const repo = this[key] as MasterDataLookupInMemoryRepository<BaseMasterEntity>
      repo.restoreSnapshot(state[key] as BaseMasterEntity[])
    }
  }
}

export const masterDataLookupRegistryInMemory = new MasterDataLookupRegistryInMemory()
