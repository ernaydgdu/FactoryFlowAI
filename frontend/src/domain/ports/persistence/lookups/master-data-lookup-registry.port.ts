/**
 * Master Data lookup registry — 37 referans entity port koleksiyonu.
 */
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

import type { IMasterDataLookupRepository } from './master-data-lookup.repository'

export interface IMasterDataLookupRegistryPort {
  country: IMasterDataLookupRepository<Country>
  currency: IMasterDataLookupRepository<Currency>
  customer: IMasterDataLookupRepository<Customer>
  brand: IMasterDataLookupRepository<Brand>
  buyer: IMasterDataLookupRepository<Buyer>
  merchandiser: IMasterDataLookupRepository<Merchandiser>
  supplier: IMasterDataLookupRepository<Supplier>
  warehouse: IMasterDataLookupRepository<Warehouse>
  workshop: IMasterDataLookupRepository<Workshop>
  seasonType: IMasterDataLookupRepository<TextileLookup>
  season: IMasterDataLookupRepository<Season>
  collection: IMasterDataLookupRepository<Collection>
  productGroup: IMasterDataLookupRepository<ProductGroup>
  subProductGroup: IMasterDataLookupRepository<SubProductGroup>
  sizeSet: IMasterDataLookupRepository<SizeSet>
  colorCard: IMasterDataLookupRepository<ColorCard>
  fabricType: IMasterDataLookupRepository<FabricType>
  fabricComposition: IMasterDataLookupRepository<FabricComposition>
  accessoryCategory: IMasterDataLookupRepository<AccessoryCategory>
  accessoryType: IMasterDataLookupRepository<AccessoryType>
  operation: IMasterDataLookupRepository<Operation>
  productionLine: IMasterDataLookupRepository<ProductionLine>
  machineType: IMasterDataLookupRepository<MachineType>
  machine: IMasterDataLookupRepository<Machine>
  qualityCode: IMasterDataLookupRepository<QualityCode>
  warehouseType: IMasterDataLookupRepository<WarehouseTypeMaster>
  unit: IMasterDataLookupRepository<Unit>
  gender: IMasterDataLookupRepository<Gender>
  ageGroup: IMasterDataLookupRepository<AgeGroup>
  fit: IMasterDataLookupRepository<Fit>
  washType: IMasterDataLookupRepository<WashType>
  printType: IMasterDataLookupRepository<PrintType>
  embroideryType: IMasterDataLookupRepository<EmbroideryType>
  gtipCode: IMasterDataLookupRepository<GtipCode>
  employee: IMasterDataLookupRepository<Employee>
  transportCompany: IMasterDataLookupRepository<TransportCompany>
  forwarder: IMasterDataLookupRepository<Forwarder>
  containerType: IMasterDataLookupRepository<ContainerType>
  incoterm: IMasterDataLookupRepository<Incoterm>
  paymentTerm: IMasterDataLookupRepository<PaymentTerm>
}

export type MasterDataLookupRegistryKey = keyof IMasterDataLookupRegistryPort
