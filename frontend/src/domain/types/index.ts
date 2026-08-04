/** ERP domain — tekstil üretim süreçleri veri modeli */

export type Gender = 'Erkek' | 'Kadın' | 'Unisex' | 'Çocuk' | 'Bebek'
export type AgeGroup = 'Yetişkin' | 'Genç' | 'Çocuk' | 'Bebek' | 'Tüm Yaş'

export type ProductColor = {
  id: string
  colorCardId: string
  name: string
  internalCode: string
  customerCode: string
  pantone: string
  colorGroup: string
  active: boolean
}

export type SizeSet = {
  id: string
  code: string
  name: string
  productType: string
  sizes: string[]
}

/** Renk × Beden → adet */
export type ColorSizeMatrix = Record<string, Record<string, number>>

export type MatrixTotals = {
  byColor: Record<string, number>
  bySize: Record<string, number>
  grandTotal: number
}

export type StockCardCategory =
  | 'Kumaş'
  | 'Tela'
  | 'Düğme'
  | 'Etiket'
  | 'Dokuma Etiket'
  | 'Fermuar'
  | 'İplik'
  | 'Poşet'
  | 'Karton'
  | 'Askı'
  | 'Koli'

export type StockCard = {
  id: string
  code: string
  name: string
  category: StockCardCategory
  unit: string
  warehouseCode: string
  warehouseName: string
  lot?: string
  supplier: string
  leadTimeDays: number
  minOrderQty: number
  availableQty: number
  attributes: Record<string, string | number>
}

export type BomLine = {
  id: string
  stockCardId: string
  consumption: number
  wastePercent: number
  actualConsumption: number
  alternativeStockCardId?: string
  notes?: string
}

export type ProductCard = {
  id: string
  productCode: string
  customerModelNo: string
  internalModelNo: string
  productName: string
  brand: string
  customer: string
  buyer: string
  merchandiser: string
  season: string
  collection: string
  productGroup: string
  subGroup: string
  gender: Gender
  ageGroup: AgeGroup
  fit: string
  pattern: string
  fabricType: string
  composition: string
  weight: string
  wash: string
  print: string
  embroidery: string
  description: string
  sizeSetId: string
  colors: ProductColor[]
  bom: BomLine[]
  status: import('./textile-erp').ProductCardRevision['status']
}

export type MrpLine = {
  id: string
  stockCardId: string
  category: string
  code: string
  materialName: string
  warehouse: string
  unit: string
  consumptionPerUnit: number
  wastePercent: number
  orderQty: number
  grossRequired: number
  netRequired: number
  supplier: string
  leadTimeDays: number
  status: 'Hesaplandı' | 'Rezerve' | 'Sipariş Verildi' | 'Karşılandı'
}

export type MaterialRequirementPlan = {
  orderId: string
  orderNo: string
  orderQty: number
  lines: MrpLine[]
  generatedAt: string
}

export type ProductionOrderLink = {
  workOrderNo: string
  plannedQty: number
  producedQty: number
  wasteQty: number
  reworkQty: number
  secondQualityQty: number
  progress: number
  bomReserved: boolean
  status: 'Planlandı' | 'Devam Ediyor' | 'Tamamlandı'
}

/** Bölünmüş üretim emri — tek sipariş → çok atölye */
export type ProductionOrderSplit = {
  id: string
  workOrderNo: string
  parentOrderId: string
  parentOrderNo: string
  workshopCode: string
  workshopName: string
  splitIndex: number
  splitOfTotal: number
  plannedQty: number
  producedQty: number
  wasteQty: number
  reworkQty: number
  progress: number
  bomReserved: boolean
  status: 'Planlandı' | 'Devam Ediyor' | 'Tamamlandı'
}

/** AQL fail sonrası rework üretim emri */
export type ReworkProductionOrder = {
  id: string
  workOrderNo: string
  parentOrderId: string
  parentOrderNo: string
  sourceInspectionId: string
  sourceInspectionNo: string
  repairQty: number
  reworkDays: number
  reworkCost: number
  capacityImpactUnits: number
  terminImpactDays: number
  status: 'Planlandı' | 'Devam Ediyor' | 'Tamamlandı'
}

export type ConsumptionLine = {
  stockCardId: string
  materialName: string
  unit: string
  consumptionPerUnit: number
  producedQty: number
  totalConsumed: number
  warehouse: string
  remainingInWorkshop: number
}

export type SalesOrderGeneral = {
  customer: string
  brand: string
  buyer: string
  merchandiser: string
  season: string
  collection: string
  poNo: string
  poDate: string
  orderDate: string
  exf: string
  deliveryTerm: string
  paymentTerm: string
  factory: string
  currency: string
  notes: string
}

export type SalesOrderLifecycleStatus =
  | 'Draft'
  | 'Under Review'
  | 'Approved'
  | 'Active'
  | 'Cancelled'
  | 'Closed'
  | 'Archived'

export type SalesOrderRevision = {
  revisionNo: number
  status: SalesOrderLifecycleStatus
  changedAt: string
  changedById: string
  changeNote: string
}

export type SalesOrder = {
  id: string
  orderNo: string
  general: SalesOrderGeneral
  productCardId: string
  sizeSetId: string
  matrix: ColorSizeMatrix
  matrixTotals: MatrixTotals
  unitPrice: number
  lineDeliveryDate?: string
  mrp: MaterialRequirementPlan
  production: ProductionOrderLink
  /** Sipariş 3+ atölyeye bölündüğünde child UE listesi */
  productionSplits?: ProductionOrderSplit[]
  isSplit?: boolean
  consumptions: ConsumptionLine[]
  productionStatus: 'Beklemede' | 'Üretimde' | 'Tamamlandı' | 'Sevk Edildi'
  fabricStatus: 'Hazır' | 'Kısmi' | 'Eksik' | 'Bekliyor'
  accessoryStatus: 'Hazır' | 'Kısmi' | 'Eksik' | 'Bekliyor'
  planner: string
  terminRisk: boolean
  exfDate: string
  progress: number
  status: SalesOrderLifecycleStatus
  currentRevision: SalesOrderRevision
  revisionHistory: SalesOrderRevision[]
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

export type Warehouse = {
  id: string
  code: string
  name: string
  type: WarehouseType
  location: string
}
