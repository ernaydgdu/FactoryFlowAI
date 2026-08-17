import type { StockCard, StockCardCategory } from '../types'

function sc(
  id: string,
  code: string,
  name: string,
  category: StockCardCategory,
  unit: string,
  warehouseName: string,
  supplier: string,
  leadTime: number,
  minOrder: number,
  qty: number,
  attrs: Record<string, string | number> = {},
): StockCard {
  return {
    id,
    code,
    name,
    category,
    unit,
    warehouseCode: warehouseName,
    warehouseName,
    supplier,
    leadTimeDays: leadTime,
    minOrderQty: minOrder,
    availableQty: qty,
    attributes: attrs,
  }
}

export const STOCK_CARDS: StockCard[] = [
  sc('sc-1', 'KMS-0142', '12 oz Indigo Denim', 'Kumaş', 'metre', 'Kumaş Deposu', 'Arvind Mills', 21, 500, 4200, { unitPrice: 8.5 }),
  sc('sc-2', 'KMS-0098', 'French Terry Fleece', 'Kumaş', 'metre', 'Kumaş Deposu', 'Bossa', 14, 300, 6800, { unitPrice: 6.2 }),
  sc('sc-3', 'KMS-0201', 'Stretch Chino Twill', 'Kumaş', 'metre', 'Kumaş Deposu', 'Isko', 18, 400, 3100, { unitPrice: 7.1 }),
  sc('sc-4', 'KMS-0034', 'Poplin Woven White', 'Kumaş', 'metre', 'Kumaş Deposu', 'Bossa', 14, 200, 5200, { unitPrice: 5.4 }),
  sc('sc-6', 'TLA-0012', 'Fusible Interlining 80gsm', 'Tela', 'metre', 'Kumaş Deposu', 'Sanko', 10, 100, 1500, { unitPrice: 2.1 }),
  sc('sc-8', 'DGM-0012', 'Metal Shank Button 17mm', 'Düğme', 'adet', 'Aksesuar Deposu', 'YKK', 14, 5000, 45000, { unitPrice: 0.08 }),
  sc('sc-10', 'ETK-0034', 'Woven Main Label SS26', 'Etiket', 'adet', 'Aksesuar Deposu', 'LabelPro', 21, 1000, 28000, { unitPrice: 0.12 }),
  sc('sc-11', 'ETK-0041', 'Care Label Multi-lang', 'Etiket', 'adet', 'Aksesuar Deposu', 'LabelPro', 21, 1000, 35000, { unitPrice: 0.05 }),
  sc('sc-13', 'DKM-0011', 'Woven Brand Label', 'Dokuma Etiket', 'adet', 'Aksesuar Deposu', 'LabelPro', 21, 500, 18000, { unitPrice: 0.15 }),
  sc('sc-14', 'AKS-0201', 'YKK Metal Zipper 5mm 60cm', 'Fermuar', 'adet', 'Aksesuar Deposu', 'YKK', 14, 500, 8500, { unitPrice: 1.85 }),
  sc('sc-16', 'AKS-0088', 'Polyester Core Spun Thread 120', 'İplik', 'cone', 'Aksesuar Deposu', 'Coats', 7, 50, 420, { unitPrice: 3.2 }),
  sc('sc-18', 'AMB-0001', 'Polybag 30x40', 'Poşet', 'adet', 'Aksesuar Deposu', 'Sanko', 7, 5000, 95000, { unitPrice: 0.06 }),
  sc('sc-21', 'AMB-0004', 'Master Carton 48 adet', 'Koli', 'adet', 'Aksesuar Deposu', 'Sanko', 7, 100, 2800, { unitPrice: 0.45 }),
]

export function getStockCardById(id: string): StockCard | undefined {
  return STOCK_CARDS.find((s) => s.id === id)
}

export function getStockCardsByCategory(category?: StockCardCategory): StockCard[] {
  if (!category) return STOCK_CARDS
  return STOCK_CARDS.filter((s) => s.category === category)
}

export type { StockCardCategory }
