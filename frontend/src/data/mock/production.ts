export type ProductionOrder = {
  id: string
  workOrderNo: string
  orderNo: string
  style: string
  quantity: number
  produced: number
  factory: string
  startDate: string
  exfDate: string
  progress: number
  bomReserved: boolean
  status: 'Planlandı' | 'Devam Ediyor' | 'Tamamlandı'
}

export type ProductionEntry = {
  id: string
  workOrderNo: string
  date: string
  operation: string
  workshop: string
  plannedQty: number
  producedQty: number
  fabricConsumed: number
  fabricUnit: string
  threadConsumed: number
  status: 'Onaylandı' | 'Bekliyor'
}

export type ProductionWaste = {
  id: string
  workOrderNo: string
  operation: string
  date: string
  wasteQty: number
  reworkQty: number
  secondQualityQty: number
  reason: string
  recordedBy: string
}

export type ProductionLine = {
  id: string
  lineCode: string
  name: string
  factory: string
  workOrderNo: string
  style: string
  capacity: number
  planned: number
  efficiency: number
  status: 'Aktif' | 'Bakım' | 'Boş'
}

export type ProductionOperation = {
  id: string
  workOrderNo: string
  operation: string
  line: string
  operator: string
  target: number
  completed: number
  waste: number
  rework: number
  secondQuality: number
  status: 'Devam Ediyor' | 'Tamamlandı' | 'Gecikmiş'
}

const STYLES = [
  'SS26 Denim Jacket',
  'AW26 Fleece Hoodie',
  'SS26 Chino Pant',
  'SS26 Polo Basic',
  'SS26 Woven Shirt',
]

const OPS = ['Kesim', 'Dikim', 'Ütü', 'Paket', 'Kalite']

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length]
}

export const productionOrders: ProductionOrder[] = Array.from({ length: 45 }, (_, i) => {
  const qty = 2400 + (i % 10) * 800
  const produced = Math.floor(qty * (0.1 + (i % 9) * 0.1))
  return {
    id: String(i + 1),
    workOrderNo: `UE-2026-${String(100 + i).padStart(4, '0')}`,
    orderNo: `SIP-2026-${String(100 + i).padStart(4, '0')}`,
    style: pick(STYLES, i),
    quantity: qty,
    produced,
    factory: pick(['İstanbul', 'Bursa', 'İzmir'], i),
    startDate: new Date(2026, 1, 5 + (i % 20)).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
    exfDate: new Date(2026, 2, 5 + (i % 25)).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
    progress: Math.round((produced / qty) * 100),
    bomReserved: i % 4 !== 0,
    status: produced >= qty ? 'Tamamlandı' : produced > 0 ? 'Devam Ediyor' : 'Planlandı',
  }
})

export const productionEntries: ProductionEntry[] = Array.from({ length: 48 }, (_, i) => {
  const planned = 400 + (i % 6) * 100
  const produced = Math.floor(planned * (0.85 + (i % 4) * 0.04))
  return {
    id: String(i + 1),
    workOrderNo: `UE-2026-${String(100 + (i % 45)).padStart(4, '0')}`,
    date: new Date(2026, 2, 1 + (i % 28)).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
    operation: pick(OPS, i),
    workshop: pick(['Kesimhane', 'Atölye A', 'Atölye B', 'Ütü Paket'], i),
    plannedQty: planned,
    producedQty: produced,
    fabricConsumed: Math.round(produced * 1.55 * 100) / 100,
    fabricUnit: 'm',
    threadConsumed: Math.round(produced * 0.18 * 100) / 100,
    status: i % 5 === 0 ? 'Bekliyor' : 'Onaylandı',
  }
})

export const productionWaste: ProductionWaste[] = Array.from({ length: 40 }, (_, i) => ({
  id: String(i + 1),
  workOrderNo: `UE-2026-${String(100 + (i % 45)).padStart(4, '0')}`,
  operation: pick(OPS, i),
  date: new Date(2026, 2, 1 + (i % 28)).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }),
  wasteQty: 5 + (i % 8) * 3,
  reworkQty: i % 3 === 0 ? 10 + (i % 5) * 2 : 0,
  secondQualityQty: i % 4 === 0 ? 8 + (i % 4) * 2 : 0,
  reason: pick(['Kumaş hatası', 'Dikim hatası', 'Ölçü sapması', 'Leke', 'Renk farkı'], i),
  recordedBy: pick(['Ayşe K.', 'Mehmet T.', 'Elif S.', 'Can D.'], i),
}))

export const productionLines: ProductionLine[] = Array.from({ length: 24 }, (_, i) => ({
  id: String(i + 1),
  lineCode: `${pick(['IST', 'BUR', 'IZM'], i)}-${pick(['D', 'K', 'P'], i)}${String((i % 4) + 1).padStart(2, '0')}`,
  name: `${pick(['Dikim', 'Kesim', 'Paket'], i)} Hattı ${(i % 4) + 1}`,
  factory: pick(['İstanbul', 'Bursa', 'İzmir'], i),
  workOrderNo: i % 5 === 0 ? '—' : `UE-2026-${String(100 + i).padStart(4, '0')}`,
  style: i % 5 === 0 ? '—' : pick(STYLES, i),
  capacity: 400 + (i % 6) * 80,
  planned: i % 5 === 0 ? 0 : 400 + (i % 6) * 80,
  efficiency: i % 5 === 0 ? 0 : 85 + (i % 10),
  status: i % 7 === 0 ? 'Bakım' : i % 5 === 0 ? 'Boş' : 'Aktif',
}))

export const productionOperations: ProductionOperation[] = Array.from({ length: 48 }, (_, i) => {
  const target = 400 + (i % 6) * 100
  const completed = Math.floor(target * (0.7 + (i % 5) * 0.06))
  return {
    id: String(i + 1),
    workOrderNo: `UE-2026-${String(100 + (i % 45)).padStart(4, '0')}`,
    operation: `${pick(OPS, i)} — ${pick(['Panel', 'Gövde', 'Kol', 'Finish'], i)}`,
    line: `${pick(['IST', 'BUR'], i)}-${pick(['D01', 'D02', 'K01'], i)}`,
    operator: pick(['Ayşe K.', 'Mehmet T.', 'Elif S.', 'Can D.', 'Selin A.'], i),
    target,
    completed,
    waste: 3 + (i % 6),
    rework: i % 3 === 0 ? 5 + (i % 4) : 0,
    secondQuality: i % 4 === 0 ? 4 + (i % 3) : 0,
    status: completed >= target ? 'Tamamlandı' : i % 9 === 0 ? 'Gecikmiş' : 'Devam Ediyor',
  }
})

export const productionKpis = [
  { label: 'Açık Üretim Emri', value: String(productionOrders.filter((o) => o.status !== 'Tamamlandı').length), hint: 'Aktif UE' },
  { label: 'Günlük Üretim', value: '18.450', hint: 'Adet' },
  { label: 'BOM Rezerve', value: String(productionOrders.filter((o) => o.bomReserved).length), hint: 'Malzeme ayrılmış' },
  { label: 'Fire / Rework', value: String(productionWaste.length), hint: 'Bu ay kayıt' },
]
