import type { BomLine } from '@/modules/core/utils/bom-calculator'

export type OrderColor = {
  id: string
  code: string
  pantone: string
  description: string
  active: boolean
}

export type OrderOperation = {
  id: string
  code: string
  name: string
  sequence: number
  workshop: string
  plannedDays: number
  active: boolean
}

export type OrderDocument = {
  id: string
  name: string
  type: string
  uploadedAt: string
  size: string
}

export type OrderMilestone = {
  id: string
  name: string
  date: string
  responsible: string
  status: 'Planlandı' | 'Onaylandı' | 'Gecikti'
}

export type OrderCreateForm = {
  general: {
    customer: string
    brand: string
    buyer: string
    merchandiser: string
    poNo: string
    poDate: string
    orderDate: string
    exf: string
    deliveryTerm: string
    paymentTerm: string
    factory: string
    manufacturer: string
    season: string
    collection: string
    currency: string
    notes: string
  }
  product: {
    productCode: string
    modelCode: string
    modelName: string
    productGroup: string
    subGroup: string
    productType: string
    fit: string
    fabricType: string
    wash: string
    print: string
    embroidery: string
    pattern: string
    weight: string
    composition: string
  }
  colors: OrderColor[]
  sizes: string[]
  matrix: Record<string, Record<string, number>>
  bom: BomLine[]
  operations: OrderOperation[]
  milestones: OrderMilestone[]
  documents: OrderDocument[]
}

export type MatrixTotals = {
  byColor: Record<string, number>
  bySize: Record<string, number>
  grandTotal: number
}
