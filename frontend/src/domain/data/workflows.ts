import { SALES_ORDERS } from './orders'
import { lazyArray, lazyObject } from './lazy-cache'
import {
  colorCardRepository,
  containerTypeRepository,
  countryRepository,
  employeeRepository,
  forwarderRepository,
  getAccessoryWarehouseCode,
  getFabricWarehouseCode,
  getWarehouseName,
  productionLineRepository,
  warehouseRepository,
  workshopRepository,
} from '../master-data'
import { generatePurchaseRequisitions } from '../services/purchasing-flow'
import { calculateOrderCost } from '../services/cost-calculator'
import type {
  Carton,
  ContainerPlan,
  CuttingOrder,
  ErpNotification,
  FabricRoll,
  MerchandisingRecord,
  OperationalDashboard,
  PastalPlan,
  PurchaseOrder,
  PurchaseRequisition,
  QualityInspection,
  SampleType,
  SewingLineRecord,
  WashingLot,
} from '../types/workflows'

const SAMPLE_TYPES: SampleType[] = [
  'Kumaş Onayı',
  'Lab Dip',
  'Fit Sample',
  'PPS',
  'Size Set',
  'TOP Sample',
  'Shipment Sample',
]

const SAMPLE_STATUSES = [
  'Bekliyor',
  'Gönderildi',
  'Onay Bekliyor',
  'Onaylandı',
  'Reddedildi',
] as const

function pick<T>(arr: readonly T[] | T[], i: number): T {
  return arr[i % arr.length]
}

export const MERCHANDISING_RECORDS = lazyArray((): MerchandisingRecord[] => SALES_ORDERS.map(
  (o, i) => {
    const approved = i % 3
    const samples = SAMPLE_TYPES.map((type, si) => ({
      id: `smp-${o.id}-${si}`,
      type,
      status: pick(SAMPLE_STATUSES, i + si) as (typeof SAMPLE_STATUSES)[number],
      sentDate: si <= approved ? '2026-02-10' : undefined,
      approvedDate: si < approved ? '2026-02-20' : undefined,
      version: 1 + (si % 2),
      notes: si === approved ? 'Revize gerekli' : undefined,
    }))
    const approvedCount = samples.filter((s) => s.status === 'Onaylandı').length
    return {
      id: `mer-${o.id}`,
      orderId: o.id,
      orderNo: o.orderNo,
      buyer: o.general.buyer,
      merchandiser: o.general.merchandiser,
      collection: 'Core',
      deliveryWindow: `${o.general.exf} ± 7 gün`,
      paymentTerm: o.general.paymentTerm,
      incoterm: o.general.deliveryTerm,
      country: pick(countryRepository.getActive().map((c) => c.iso2), i),
      currency: o.general.currency,
      fob: 12.5 + (i % 5),
      cm: 4.2,
      samples,
      readinessPercent: Math.round((approvedCount / SAMPLE_TYPES.length) * 100),
      status:
        approvedCount >= 6
          ? 'Üretime Hazır'
          : approvedCount >= 3
            ? 'Onaylı'
            : approvedCount >= 1
              ? 'Sample'
              : 'Hazırlık',
    }
  },
))

export const PURCHASE_REQUISITIONS = lazyArray((): PurchaseRequisition[] => SALES_ORDERS.flatMap(
  (o) => generatePurchaseRequisitions(o.mrp),
))

export const PURCHASE_ORDERS = lazyArray((): PurchaseOrder[] => PURCHASE_REQUISITIONS.slice(
  0,
  60,
).map((pr, i) => {
  const lineTotal = pr.quantity * (3.5 + (i % 4))
  const delivered = i % 3 === 0 ? pr.quantity : Math.floor(pr.quantity * 0.6)
  return {
    id: `po-${i + 1}`,
    poNo: `PO-2026-${String(5000 + i).padStart(4, '0')}`,
    prId: pr.id,
    orderId: pr.orderId,
    orderNo: pr.orderNo,
    supplier: pr.suggestedSupplier,
    termin: pr.requiredDate,
    deliveryWarehouse: pr.category === 'Kumaş'
      ? getWarehouseName(getFabricWarehouseCode())
      : getWarehouseName(getAccessoryWarehouseCode()),
    currency: 'USD',
    lines: [
      {
        id: `pol-${i}`,
        materialCode: pr.materialCode,
        materialName: pr.materialName,
        quantity: pr.quantity,
        unit: pr.unit,
        unitPrice: 3.5 + (i % 4),
        vatRate: 20,
        lot: pr.category === 'Kumaş' ? `LOT-${2400 + i}` : undefined,
        deliveredQty: delivered,
        remainingQty: pr.quantity - delivered,
      },
    ],
    status:
      delivered >= pr.quantity
        ? 'Tamamlandı'
        : i % 5 === 0
          ? 'Gecikmiş'
          : delivered > 0
            ? 'Kısmi Teslim'
            : 'Açık',
    totalAmount: Math.round(lineTotal * 100) / 100,
  }
}))

export const FABRIC_ROLLS = lazyArray((): FabricRoll[] => Array.from({ length: 48 }, (_, i) => ({
  id: String(i + 1),
  receiptNo: `KR-${String(2000 + (i % 10)).padStart(4, '0')}`,
  lot: `LOT-D-${2400 + (i % 15)}`,
  rollNo: `TOP-${String(8800 + i).padStart(5, '0')}`,
  fabricCode: 'KMS-0142',
  fabricName: '12 oz Indigo Denim',
  meters: 80 + (i % 8) * 15,
  kg: 42 + (i % 6) * 8,
  width: 145 + (i % 3) * 5,
  weight: 340 + (i % 4) * 10,
  color: pick(colorCardRepository.getActive().map((c) => c.name), i),
  batch: `P-${120 + (i % 20)}`,
  dyeLot: `DL-${500 + (i % 12)}`,
  quality: pick(['1. Kalite', '1. Kalite', '2. Kalite'] as const, i),
  warehouse: getWarehouseName(getFabricWarehouseCode()),
  rack: `R-${String((i % 12) + 1).padStart(2, '0')}`,
  pallet: `PLT-${String((i % 8) + 1).padStart(3, '0')}`,
  reservedForOrder: i % 4 === 0 ? pick(SALES_ORDERS, i).orderNo : undefined,
  status: pick(['Serbest', 'Rezerve', 'Kesimde', 'Tüketildi'] as const, i),
  receivedDate: new Date(2026, 1, 10 + (i % 20)).toLocaleDateString('tr-TR'),
})))

export const PASTAL_PLANS = lazyArray((): PastalPlan[] => SALES_ORDERS.slice(0, 30).map(
  (o, i) => ({
    id: `pastal-${o.id}`,
    orderId: o.id,
    orderNo: o.orderNo,
    pastalNo: `PST-${String(100 + i).padStart(4, '0')}`,
    markerNo: `MRK-${String(200 + i).padStart(4, '0')}`,
    fabricWidth: 145 + (i % 3) * 5,
    plyCount: 20 + (i % 4) * 5,
    pastalLength: 8 + (i % 3),
    yieldPercent: 82 + (i % 8),
    wastePercent: 3 + (i % 3),
    fabricConsumption: Math.round(o.matrixTotals.grandTotal * 1.58 * 100) / 100,
    plannedPieces: o.matrixTotals.grandTotal,
    status: pick(['Taslak', 'Onaylı', 'Kesimde', 'Tamamlandı'] as const, i),
  }),
))

export const CUTTING_ORDERS = lazyArray((): CuttingOrder[] => PASTAL_PLANS.filter(
  (p) => p.status !== 'Taslak',
).map((p, i) => {
  const planned = p.plannedPieces
  const cut = Math.floor(planned * (0.85 + (i % 4) * 0.04))
  const waste = planned - cut
  return {
    id: `cut-${p.id}`,
    cuttingNo: `KES-${String(300 + i).padStart(4, '0')}`,
    orderId: p.orderId,
    orderNo: p.orderNo,
    pastalId: p.id,
    pastalNo: p.pastalNo,
    plannedQty: planned,
    cutQty: cut,
    wasteQty: waste,
    wastePercent: Math.round((waste / planned) * 1000) / 10,
    cuttingDate: '2026-03-05',
    warehouse: getWarehouseName(warehouseRepository.find((w) => w.type === 'Kesimhane')[0]?.code ?? 'KES-01'),
    status: cut >= planned ? 'Tamamlandı' : i % 3 === 0 ? 'Kesimde' : 'Planlandı',
  }
}))

export const SEWING_LINE_RECORDS = lazyArray((): SewingLineRecord[] => Array.from(
  { length: 40 },
  (_, i) => {
    const order = pick(SALES_ORDERS, i)
    const planned = 400 + (i % 6) * 80
    const produced = Math.floor(planned * (0.8 + (i % 5) * 0.04))
    const line = pick(productionLineRepository.getActive(), i)
    const operator = pick(employeeRepository.find((e) => e.role === 'Operatör'), i)
    return {
      id: String(i + 1),
      lineCode: line.code,
      lineName: line.name,
      orderId: order.id,
      orderNo: order.orderNo,
      operator: operator.name,
      shift: pick(['Sabah', 'Öğle', 'Gece'], i),
      plannedQty: planned,
      producedQty: produced,
      hourlyRate: 45 + (i % 10),
      efficiency: 82 + (i % 12),
      downtimeMin: i % 4 === 0 ? 25 + (i % 3) * 10 : 0,
      wasteQty: 3 + (i % 5),
      reworkQty: i % 3 === 0 ? 5 : 0,
      date: '2026-03-06',
      status: i % 5 === 0 ? 'Duruş' : produced >= planned ? 'Tamamlandı' : 'Devam Ediyor',
    }
  },
))

export const WASHING_LOTS = lazyArray((): WashingLot[] => SALES_ORDERS.slice(0, 25).map(
  (o, i) => ({
    id: `wash-${o.id}`,
    lotNo: `YKM-${String(100 + i).padStart(4, '0')}`,
    orderId: o.id,
    orderNo: o.orderNo,
    color: pick(colorCardRepository.getActive().map((c) => c.name), i),
    quantity: Math.floor(o.matrixTotals.grandTotal * 0.4),
    washType: pick(['Stone Wash', 'Enzyme', 'Garment Dye', 'Softener'], i),
    sentDate: '2026-03-01',
    expectedReturn: '2026-03-08',
    actualReturn: i % 3 === 0 ? '2026-03-07' : undefined,
    status: pick([
      'Gönderildi',
      'Bekliyor',
      'Yıkamada',
      'Geldi',
      'Kalite Bekliyor',
      'Tamamlandı',
    ] as const, i),
    facility: `${workshopRepository.getByCode('FSN-B')?.name ?? ''} — ${warehouseRepository.find((w) => w.type === 'Yıkama')[0]?.location ?? ''}`,
  }),
))

export const QUALITY_INSPECTIONS = lazyArray((): QualityInspection[] => Array.from(
  { length: 36 },
  (_, i) => {
    const order = pick(SALES_ORDERS, i)
    const module = pick(['Inline', 'Midline', 'Final'] as const, i)
    const inspected = 200 + (i % 5) * 100
    const reject = 2 + (i % 4)
    const repair = i % 3 === 0 ? 4 : 0
    const isAqlFail = reject >= 5 || i % 7 === 0
    const failRepairQty = isAqlFail ? Math.max(repair, 20 + (i % 5) * 8) : repair
    const second = i % 4 === 0 ? 3 : 0
    return {
      id: String(i + 1),
      inspectionNo: `QC-${module.slice(0, 3).toUpperCase()}-${String(1000 + i).padStart(4, '0')}`,
      module,
      orderId: order.id,
      orderNo: order.orderNo,
      inspectedQty: inspected,
      passedQty: inspected - reject - second,
      rejectQty: reject,
      repairQty: failRepairQty,
      secondQualityQty: second,
      aqlLevel: '2.5',
      aqlResult: isAqlFail ? 'Fail' : 'Pass',
      defects: [
        { code: 'D001', name: 'Dikiş hatası', quantity: reject },
        { code: 'D002', name: 'Leke', quantity: i % 2 },
        { code: 'D003', name: 'Ölçü sapması', quantity: i % 3 },
      ].filter((d) => d.quantity > 0),
      inspector: pick(['QC-Ayşe', 'QC-Mehmet', 'QC-Zeynep'], i),
      date: '2026-03-06',
      status: 'Tamamlandı',
    }
  },
))

export const CARTONS = lazyArray((): Carton[] => SALES_ORDERS.slice(0, 20).flatMap((o, oi) =>
  Array.from({ length: 3 + (oi % 4) }, (_, ci) => {
    const lines = [
      { color: 'BLACK', size: 'M', quantity: 12 },
      { color: 'BLACK', size: 'L', quantity: 12 },
      { color: 'WHITE', size: 'M', quantity: 12 },
    ]
    return {
      id: `ctn-${o.id}-${ci}`,
      cartonNo: `KOL-${o.orderNo.slice(-4)}-${String(ci + 1).padStart(3, '0')}`,
      orderId: o.id,
      orderNo: o.orderNo,
      lines,
      totalQty: lines.reduce((s, l) => s + l.quantity, 0),
      weight: 14.5 + ci * 0.2,
      status: pick(['Açık', 'Kapandı', 'Sevk Edildi'] as const, oi + ci),
    }
  }),
))

export const CONTAINER_PLANS = lazyArray((): ContainerPlan[] => Array.from({ length: 12 }, (_, i) => {
  const orders = SALES_ORDERS.slice(i * 3, i * 3 + 3)
  return {
    id: String(i + 1),
    containerNo: `MSCU${String(7234560 + i).padStart(7, '0')}`,
    bookingNo: `BKG-${8800 + i}`,
    containerType: pick(containerTypeRepository.getActive().map((c) => c.code), i) as '20FT' | '40FT' | '40HC',
    etd: '2026-03-15',
    eta: '2026-04-02',
    forwarder: pick(forwarderRepository.getActive().map((f) => f.name), i),
    sealNo: `SL-${90000 + i}`,
    orderIds: orders.map((o) => o.id),
    orderNos: orders.map((o) => o.orderNo),
    totalCartons: 24 + i * 4,
    totalQty: orders.reduce((s, o) => s + o.matrixTotals.grandTotal, 0),
    status: pick(['Planlandı', 'Yüklendi', 'Yolda', 'Varış'] as const, i),
  }
}))

export const ORDER_COSTS = lazyArray(() => SALES_ORDERS.slice(0, 20).map((o) =>
  calculateOrderCost(o),
))

export const ERP_NOTIFICATIONS: ErpNotification[] = [
  {
    id: 'n1',
    type: 'termin',
    severity: 'critical',
    title: 'EXF 5 gün kaldı',
    message: 'SIP-2026-0105 — Mango TR, kumaş henüz kesimde değil',
    orderNo: 'SIP-2026-0105',
    link: '/orders/5',
    createdAt: '2026-03-06T08:00:00',
    read: false,
  },
  {
    id: 'n2',
    type: 'purchase',
    severity: 'warning',
    title: 'PO gecikti',
    message: 'PO-2026-5012 — Arvind Mills, termin 3 gün geçti',
    link: '/purchasing/orders',
    createdAt: '2026-03-06T07:30:00',
    read: false,
  },
  {
    id: 'n3',
    type: 'stock',
    severity: 'warning',
    title: 'Stok kritik seviyede',
    message: 'KMS-0142 Indigo Denim — serbest stok 820m (min: 1200m)',
    link: '/fabric/stock',
    createdAt: '2026-03-06T07:00:00',
    read: false,
  },
  {
    id: 'n4',
    type: 'quality',
    severity: 'critical',
    title: 'Kalite reddetti',
    message: 'QC-FIN-1012 — SIP-2026-0118 Final Inspection Fail (AQL 2.5)',
    orderNo: 'SIP-2026-0118',
    link: '/quality/final',
    createdAt: '2026-03-05T16:00:00',
    read: true,
  },
  {
    id: 'n5',
    type: 'production',
    severity: 'warning',
    title: 'Üretim durdu',
    message: 'BUR-D02 — Makine arızası, 35 dk duruş',
    link: '/production/sewing',
    createdAt: '2026-03-06T09:15:00',
    read: false,
  },
  {
    id: 'n6',
    type: 'sample',
    severity: 'info',
    title: 'Lab Dip onay bekliyor',
    message: 'SIP-2026-0120 — LC Waikiki Lab Dip v2 onay bekliyor',
    orderNo: 'SIP-2026-0120',
    link: '/merchandising',
    createdAt: '2026-03-05T14:00:00',
    read: true,
  },
]

export const OPERATIONAL_DASHBOARD = lazyObject((): OperationalDashboard => ({
  todayCutting: CUTTING_ORDERS.filter((c) => c.status !== 'Tamamlandı')
    .slice(0, 5)
    .map((c) => ({
      orderNo: c.orderNo,
      style: `Pastal ${c.pastalNo}`,
      qty: c.plannedQty - c.cutQty,
    })),
  todaySewing: SEWING_LINE_RECORDS.filter((s) => s.status === 'Devam Ediyor')
    .slice(0, 5)
    .map((s) => ({
      orderNo: s.orderNo,
      line: s.lineCode,
      qty: s.plannedQty - s.producedQty,
    })),
  todayShipping: SALES_ORDERS.filter((o) => o.terminRisk)
    .slice(0, 5)
    .map((o) => ({
      orderNo: o.orderNo,
      customer: o.general.customer,
      exf: o.exfDate,
    })),
  criticalFabrics: [
    { code: 'KMS-0142', name: 'Indigo Denim', daysLeft: 2 },
    { code: 'KMS-0098', name: 'French Terry', daysLeft: 4 },
    { code: 'KMS-0201', name: 'Chino Twill', daysLeft: 5 },
  ],
  criticalAccessories: [
    { code: 'AKS-0201', name: 'YKK Zipper 5mm', qty: 850 },
    { code: 'AKS-0088', name: 'Thread 120', qty: 42 },
  ],
  delayedPurchases: PURCHASE_ORDERS.filter((p) => p.status === 'Gecikmiş')
    .slice(0, 5)
    .map((p) => ({
      poNo: p.poNo,
      supplier: p.supplier,
      daysLate: 3 + Math.floor(Math.random() * 5),
    })),
  terminRisk: SALES_ORDERS.filter((o) => o.terminRisk)
    .slice(0, 6)
    .map((o) => ({
      orderNo: o.orderNo,
      daysLeft: 3,
      blocker: o.fabricStatus === 'Eksik' ? 'Kumaş eksik' : 'Üretim gecikmesi',
    })),
  busyLines: SEWING_LINE_RECORDS.slice(0, 5).map((s) => ({
    line: s.lineCode,
    load: Math.round((s.producedQty / s.plannedQty) * 100),
    efficiency: s.efficiency,
  })),
  capacityUsage: [
    { department: 'Kesimhane', used: 85, total: 100 },
    { department: 'Dikim', used: 92, total: 100 },
    { department: 'Yıkama', used: 68, total: 100 },
    { department: 'Paket', used: 78, total: 100 },
  ],
  productionCalendar: [
    { date: '04 Mar', cutting: 3, sewing: 8, shipping: 2 },
    { date: '05 Mar', cutting: 4, sewing: 9, shipping: 1 },
    { date: '06 Mar', cutting: 5, sewing: 10, shipping: 3 },
    { date: '07 Mar', cutting: 4, sewing: 11, shipping: 4 },
    { date: '08 Mar', cutting: 6, sewing: 9, shipping: 5 },
  ],
}))

export function getMerchandisingByOrderId(orderId: string) {
  return MERCHANDISING_RECORDS.find((m) => m.orderId === orderId)
}

export function getCartonsByOrderId(orderId: string) {
  return CARTONS.filter((c) => c.orderId === orderId)
}

export function getCostByOrderId(orderId: string) {
  return ORDER_COSTS.find((c) => c.orderId === orderId)
}
