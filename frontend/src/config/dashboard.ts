export type StatCard = {
  label: string
  value: string
  change: string
  trend: 'up' | 'down' | 'neutral'
}

export type DailyProductionPoint = {
  day: string
  planned: number
  actual: number
}

export type OrderRow = {
  id: string
  orderNo: string
  customer: string
  style: string
  quantity: number
  exfDate: string
  status: 'Planlama' | 'Kesim' | 'Dikim' | 'Yıkama' | 'Sevkiyat'
  progress: number
}

export type ProductionLine = {
  id: string
  name: string
  factory: string
  orderNo: string
  style: string
  target: number
  produced: number
  efficiency: number
  status: 'Aktif' | 'Bakım' | 'Boş'
}

export type CriticalStockItem = {
  id: string
  materialCode: string
  name: string
  unit: string
  onHand: number
  minLevel: number
  supplier: string
  eta: string
}

export type DeadlineRiskOrder = {
  id: string
  orderNo: string
  customer: string
  style: string
  exfDate: string
  daysLeft: number
  riskLevel: 'Yüksek' | 'Orta' | 'Düşük'
  blocker: string
}

export const dashboardStats: StatCard[] = [
  {
    label: 'Aktif Siparişler',
    value: '142',
    change: '18 yeni sipariş bu hafta',
    trend: 'up',
  },
  {
    label: 'Günlük Üretim',
    value: '18.450',
    change: 'Hedefin %96,5\'i tamamlandı',
    trend: 'up',
  },
  {
    label: 'Hat Verimliliği',
    value: '%87,3',
    change: 'Dün +2,1 puan',
    trend: 'up',
  },
  {
    label: 'Kritik Stok',
    value: '12',
    change: '3 kalem termin riski oluşturuyor',
    trend: 'down',
  },
  {
    label: 'Termin Riski',
    value: '8',
    change: '2 sipariş EXF ≤ 7 gün',
    trend: 'down',
  },
]

export const dailyProductionKpis: DailyProductionPoint[] = [
  { day: 'Pzt', planned: 17200, actual: 16850 },
  { day: 'Sal', planned: 17800, actual: 17620 },
  { day: 'Çar', planned: 18100, actual: 17940 },
  { day: 'Per', planned: 18500, actual: 18210 },
  { day: 'Cum', planned: 19000, actual: 18450 },
  { day: 'Cmt', planned: 12000, actual: 11880 },
  { day: 'Paz', planned: 0, actual: 0 },
]

export const activeOrders: OrderRow[] = [
  {
    id: '1',
    orderNo: 'SIP-2026-0142',
    customer: 'Mango TR',
    style: 'SS26 Denim Jacket',
    quantity: 4200,
    exfDate: '12 Mar 2026',
    status: 'Dikim',
    progress: 62,
  },
  {
    id: '2',
    orderNo: 'SIP-2026-0138',
    customer: 'LC Waikiki',
    style: 'AW26 Fleece Hoodie',
    quantity: 8600,
    exfDate: '08 Mar 2026',
    status: 'Kesim',
    progress: 38,
  },
  {
    id: '3',
    orderNo: 'SIP-2026-0135',
    customer: 'Koton',
    style: 'SS26 Chino Pant',
    quantity: 12000,
    exfDate: '15 Mar 2026',
    status: 'Yıkama',
    progress: 78,
  },
  {
    id: '4',
    orderNo: 'SIP-2026-0129',
    customer: 'DeFacto',
    style: 'SS26 Polo Basic',
    quantity: 6400,
    exfDate: '05 Mar 2026',
    status: 'Sevkiyat',
    progress: 94,
  },
  {
    id: '5',
    orderNo: 'SIP-2026-0124',
    customer: 'Zara Home TR',
    style: 'SS26 Woven Shirt',
    quantity: 3100,
    exfDate: '20 Mar 2026',
    status: 'Planlama',
    progress: 12,
  },
]

export const productionLines: ProductionLine[] = [
  {
    id: '1',
    name: 'Hat 01 — Dikim',
    factory: 'İstanbul Fabrika',
    orderNo: 'SIP-2026-0142',
    style: 'SS26 Denim Jacket',
    target: 520,
    produced: 487,
    efficiency: 93.7,
    status: 'Aktif',
  },
  {
    id: '2',
    name: 'Hat 02 — Dikim',
    factory: 'İstanbul Fabrika',
    orderNo: 'SIP-2026-0138',
    style: 'AW26 Fleece Hoodie',
    target: 680,
    produced: 612,
    efficiency: 90.0,
    status: 'Aktif',
  },
  {
    id: '3',
    name: 'Hat 03 — Kesim',
    factory: 'Bursa Fabrika',
    orderNo: 'SIP-2026-0135',
    style: 'SS26 Chino Pant',
    target: 900,
    produced: 845,
    efficiency: 93.9,
    status: 'Aktif',
  },
  {
    id: '4',
    name: 'Hat 04 — Finishing',
    factory: 'Bursa Fabrika',
    orderNo: 'SIP-2026-0129',
    style: 'SS26 Polo Basic',
    target: 450,
    produced: 441,
    efficiency: 98.0,
    status: 'Aktif',
  },
  {
    id: '5',
    name: 'Hat 05 — Dikim',
    factory: 'İzmir Fabrika',
    orderNo: '—',
    style: '—',
    target: 0,
    produced: 0,
    efficiency: 0,
    status: 'Bakım',
  },
]

export const criticalStockItems: CriticalStockItem[] = [
  {
    id: '1',
    materialCode: 'KMS-0142',
    name: '12 oz Indigo Denim',
    unit: 'm',
    onHand: 820,
    minLevel: 1500,
    supplier: 'Arvind Mills',
    eta: '04 Mar 2026',
  },
  {
    id: '2',
    materialCode: 'IPL-0088',
    name: 'Polyester Core Spun Thread',
    unit: 'cone',
    onHand: 340,
    minLevel: 600,
    supplier: 'Coats Türkiye',
    eta: '03 Mar 2026',
  },
  {
    id: '3',
    materialCode: 'AKS-0201',
    name: 'YKK Metal Zipper 5mm',
    unit: 'adet',
    onHand: 2100,
    minLevel: 4000,
    supplier: 'YKK Türkiye',
    eta: '06 Mar 2026',
  },
  {
    id: '4',
    materialCode: 'ETK-0034',
    name: 'Woven Main Label SS26',
    unit: 'adet',
    onHand: 980,
    minLevel: 2000,
    supplier: 'Label Pro',
    eta: '05 Mar 2026',
  },
]

export const deadlineRiskOrders: DeadlineRiskOrder[] = [
  {
    id: '1',
    orderNo: 'SIP-2026-0129',
    customer: 'DeFacto',
    style: 'SS26 Polo Basic',
    exfDate: '05 Mar 2026',
    daysLeft: 3,
    riskLevel: 'Yüksek',
    blocker: 'Finishing kapasitesi dar',
  },
  {
    id: '2',
    orderNo: 'SIP-2026-0138',
    customer: 'LC Waikiki',
    style: 'AW26 Fleece Hoodie',
    exfDate: '08 Mar 2026',
    daysLeft: 6,
    riskLevel: 'Yüksek',
    blocker: 'Kumaş teslimatı gecikti',
  },
  {
    id: '3',
    orderNo: 'SIP-2026-0142',
    customer: 'Mango TR',
    style: 'SS26 Denim Jacket',
    exfDate: '12 Mar 2026',
    daysLeft: 10,
    riskLevel: 'Orta',
    blocker: 'Dikim hattı %93 verim',
  },
  {
    id: '4',
    orderNo: 'SIP-2026-0118',
    customer: 'H&M TR',
    style: 'SS26 Cargo Short',
    exfDate: '14 Mar 2026',
    daysLeft: 12,
    riskLevel: 'Orta',
    blocker: 'Yıkama onayı bekleniyor',
  },
  {
    id: '5',
    orderNo: 'SIP-2026-0106',
    customer: 'Pull&Bear',
    style: 'SS26 Knit Tee',
    exfDate: '18 Mar 2026',
    daysLeft: 16,
    riskLevel: 'Düşük',
    blocker: 'Plan dahilinde',
  },
]

export const quickActions = [
  'Toplantı kuyruğunu aç',
  'Kritik stok PO oluştur',
  'Termin riski raporu',
  'Günlük üretim özeti',
]
