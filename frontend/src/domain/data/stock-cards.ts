import type { StockCard, StockCardCategory } from '../types'
import {
  getAccessoryWarehouseCode,
  getFabricWarehouseCode,
  getWarehouseName,
  supplierRepository,
} from '../master-data'
import { lazyArray } from './lazy-cache'

function sc(
  id: string,
  code: string,
  name: string,
  category: StockCardCategory,
  unit: string,
  warehouseCode: string,
  supplierCode: string,
  leadTime: number,
  minOrder: number,
  qty: number,
  attrs: Record<string, string | number> = {},
): StockCard {
  const supplier = supplierRepository.getByCode(supplierCode)
  return {
    id,
    code,
    name,
    category,
    unit,
    warehouseCode,
    warehouseName: getWarehouseName(warehouseCode),
    supplier: supplier?.name ?? supplierCode,
    leadTimeDays: supplier?.leadTimeDays ?? leadTime,
    minOrderQty: minOrder,
    availableQty: qty,
    attributes: attrs,
  }
}

export const STOCK_CARDS = lazyArray((): StockCard[] => {
  const fabricWh = getFabricWarehouseCode()
  const accessoryWh = getAccessoryWarehouseCode()
  return [
  sc('sc-1', 'KMS-0142', '12 oz Indigo Denim', 'Kumaş', 'metre', fabricWh, 'ARVIND', 21, 500, 4200),
  sc('sc-2', 'KMS-0098', 'French Terry Fleece', 'Kumaş', 'metre', fabricWh, 'BOSSA', 14, 300, 6800),
  sc('sc-3', 'KMS-0201', 'Stretch Chino Twill', 'Kumaş', 'metre', fabricWh, 'ISKO', 18, 400, 3100),
  sc('sc-4', 'KMS-0034', 'Poplin Woven White', 'Kumaş', 'metre', fabricWh, 'BOSSA', 14, 200, 5200),
  sc('sc-6', 'TLA-0012', 'Fusible Interlining 80gsm', 'Tela', 'metre', fabricWh, 'SANKO', 10, 100, 1500),
  sc('sc-8', 'DGM-0012', 'Metal Shank Button 17mm', 'Düğme', 'adet', accessoryWh, 'YKK', 14, 5000, 45000, { diameter: 17, holes: 'Shank', material: 'Metal' }),
  sc('sc-10', 'ETK-0034', 'Woven Main Label SS26', 'Etiket', 'adet', accessoryWh, 'LABELPRO', 21, 1000, 28000, { labelType: 'Main', language: 'Multi' }),
  sc('sc-11', 'ETK-0041', 'Care Label Multi-lang', 'Etiket', 'adet', accessoryWh, 'LABELPRO', 21, 1000, 35000),
  sc('sc-13', 'DKM-0011', 'Woven Brand Label', 'Dokuma Etiket', 'adet', accessoryWh, 'LABELPRO', 21, 500, 18000),
  sc('sc-14', 'AKS-0201', 'YKK Metal Zipper 5mm 60cm', 'Fermuar', 'adet', accessoryWh, 'YKK', 14, 500, 8500, { length: 60, direction: 'Sol', teethType: 'Metal', brand: 'YKK' }),
  sc('sc-16', 'AKS-0088', 'Polyester Core Spun Thread 120', 'İplik', 'cone', accessoryWh, 'COATS', 7, 50, 420, { number: 120, coneWeight: 5000 }),
  sc('sc-18', 'AMB-0001', 'Polybag 30x40', 'Poşet', 'adet', accessoryWh, 'SANKO', 7, 5000, 95000),
  sc('sc-21', 'AMB-0004', 'Master Carton 48 adet', 'Koli', 'adet', accessoryWh, 'SANKO', 7, 100, 2800, { width: 60, height: 40, depth: 30, packQty: 48 }),
  ]
})

export function getStockCardById(id: string): StockCard | undefined {
  return STOCK_CARDS.find((s) => s.id === id)
}

export function getStockCardsByCategory(category?: StockCardCategory): StockCard[] {
  if (!category) return STOCK_CARDS
  return STOCK_CARDS.filter((s) => s.category === category)
}

export type { StockCardCategory }
