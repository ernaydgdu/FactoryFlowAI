/** Tekstil ERP iş akışı tipleri — Merchandising → Üretim → Sevkiyat */

export type SampleType =
  | 'Kumaş Onayı'
  | 'Lab Dip'
  | 'Fit Sample'
  | 'PPS'
  | 'Size Set'
  | 'TOP Sample'
  | 'Shipment Sample'

export type SampleStatus =
  | 'Bekliyor'
  | 'Gönderildi'
  | 'Onay Bekliyor'
  | 'Onaylandı'
  | 'Reddedildi'
  | 'Revize'

export type SampleStage = {
  id: string
  type: SampleType
  status: SampleStatus
  sentDate?: string
  approvedDate?: string
  version: number
  notes?: string
}

export type MerchandisingRecord = {
  id: string
  orderId: string
  orderNo: string
  buyer: string
  merchandiser: string
  collection: string
  deliveryWindow: string
  paymentTerm: string
  incoterm: string
  country: string
  currency: string
  fob: number
  cm: number
  samples: SampleStage[]
  readinessPercent: number
  status: 'Hazırlık' | 'Sample' | 'Onaylı' | 'Üretime Hazır'
}

export type PurchaseRequisition = {
  id: string
  prNo: string
  orderId: string
  orderNo: string
  mrpLineId: string
  materialCode: string
  materialName: string
  category: string
  quantity: number
  unit: string
  requiredDate: string
  suggestedSupplier: string
  status: 'Açık' | 'PO Oluşturuldu' | 'İptal'
  createdAt: string
}

export type PurchaseOrderLine = {
  id: string
  materialCode: string
  materialName: string
  quantity: number
  unit: string
  unitPrice: number
  vatRate: number
  lot?: string
  deliveredQty: number
  remainingQty: number
}

export type PurchaseOrder = {
  id: string
  poNo: string
  prId: string
  orderId: string
  orderNo: string
  supplier: string
  termin: string
  deliveryWarehouse: string
  currency: string
  lines: PurchaseOrderLine[]
  status: 'Açık' | 'Kısmi Teslim' | 'Tamamlandı' | 'Gecikmiş'
  totalAmount: number
}

export type FabricRoll = {
  id: string
  receiptNo: string
  lot: string
  rollNo: string
  fabricCode: string
  fabricName: string
  meters: number
  kg: number
  width: number
  weight: number
  color: string
  batch: string
  dyeLot: string
  quality: '1. Kalite' | '2. Kalite' | 'Red'
  warehouse: string
  rack: string
  pallet: string
  reservedForOrder?: string
  status: 'Serbest' | 'Rezerve' | 'Kesimde' | 'Tüketildi'
  receivedDate: string
}

export type PastalPlan = {
  id: string
  orderId: string
  orderNo: string
  pastalNo: string
  markerNo: string
  fabricWidth: number
  plyCount: number
  pastalLength: number
  yieldPercent: number
  wastePercent: number
  fabricConsumption: number
  plannedPieces: number
  status: 'Taslak' | 'Onaylı' | 'Kesimde' | 'Tamamlandı'
}

export type CuttingOrder = {
  id: string
  cuttingNo: string
  orderId: string
  orderNo: string
  pastalId: string
  pastalNo: string
  plannedQty: number
  cutQty: number
  wasteQty: number
  wastePercent: number
  cuttingDate: string
  warehouse: string
  status: 'Planlandı' | 'Kesimde' | 'Tamamlandı'
}

export type SewingLineRecord = {
  id: string
  lineCode: string
  lineName: string
  orderId: string
  orderNo: string
  operator: string
  shift: string
  plannedQty: number
  producedQty: number
  hourlyRate: number
  efficiency: number
  downtimeMin: number
  wasteQty: number
  reworkQty: number
  date: string
  status: 'Devam Ediyor' | 'Tamamlandı' | 'Duruş'
}

export type WashingLot = {
  id: string
  lotNo: string
  orderId: string
  orderNo: string
  color: string
  quantity: number
  washType: string
  sentDate: string
  expectedReturn?: string
  actualReturn?: string
  status: 'Gönderildi' | 'Bekliyor' | 'Yıkamada' | 'Geldi' | 'Kalite Bekliyor' | 'Tamamlandı'
  facility: string
}

export type QualityModule = 'Inline' | 'Midline' | 'Final'

export type DefectRecord = {
  code: string
  name: string
  quantity: number
}

export type QualityInspection = {
  id: string
  inspectionNo: string
  module: QualityModule
  orderId: string
  orderNo: string
  inspectedQty: number
  passedQty: number
  rejectQty: number
  repairQty: number
  secondQualityQty: number
  aqlLevel: string
  aqlResult: 'Pass' | 'Fail' | 'Pending'
  defects: DefectRecord[]
  inspector: string
  date: string
  status: 'Devam Ediyor' | 'Tamamlandı'
}

export type CartonLine = {
  color: string
  size: string
  quantity: number
}

export type Carton = {
  id: string
  cartonNo: string
  orderId: string
  orderNo: string
  lines: CartonLine[]
  totalQty: number
  weight: number
  status: 'Açık' | 'Kapandı' | 'Sevk Edildi'
}

export type ContainerPlan = {
  id: string
  containerNo: string
  bookingNo: string
  containerType: '20FT' | '40FT' | '40HC'
  etd: string
  eta: string
  forwarder: string
  sealNo: string
  orderIds: string[]
  orderNos: string[]
  totalCartons: number
  totalQty: number
  status: 'Planlandı' | 'Yüklendi' | 'Yolda' | 'Varış'
}

export type OrderCostBreakdown = {
  orderId: string
  orderNo: string
  fabric: number
  accessory: number
  labor: number
  embroidery: number
  print: number
  washing: number
  waste: number
  logistics: number
  overhead: number
  cm: number
  fob: number
  totalCost: number
  sellingPrice: number
  profit: number
  profitMargin: number
}

export type ErpNotification = {
  id: string
  type: 'termin' | 'stock' | 'purchase' | 'quality' | 'production' | 'sample'
  severity: 'critical' | 'warning' | 'info'
  title: string
  message: string
  orderNo?: string
  link?: string
  createdAt: string
  read: boolean
}

export type OperationalDashboard = {
  todayCutting: { orderNo: string; style: string; qty: number }[]
  todaySewing: { orderNo: string; line: string; qty: number }[]
  todayShipping: { orderNo: string; customer: string; exf: string }[]
  criticalFabrics: { code: string; name: string; daysLeft: number }[]
  criticalAccessories: { code: string; name: string; qty: number }[]
  delayedPurchases: { poNo: string; supplier: string; daysLate: number }[]
  terminRisk: { orderNo: string; daysLeft: number; blocker: string }[]
  busyLines: { line: string; load: number; efficiency: number }[]
  capacityUsage: { department: string; used: number; total: number }[]
  productionCalendar: { date: string; cutting: number; sewing: number; shipping: number }[]
}
