import type { StockCard, StockCardCategory } from '../types'
import {
  getAccessoryWarehouseCode,
  getFabricWarehouseCode,
  getWarehouseName,
  supplierRepository,
} from '../master-data'
import { queryAllStockCards, queryStockCardById } from '../stock-card/stock-card-query.service'

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

/** Seed generator — yalnızca bootstrap tarafından kullanılır */
export function generateSeedStockCards(): StockCard[] {
  const fabricWh = getFabricWarehouseCode()
  const accessoryWh = getAccessoryWarehouseCode()
  return [
    sc('sc-1', 'KMS-0142', '12 oz Indigo Denim', 'Kumaş', 'metre', fabricWh, 'ARVIND', 21, 500, 4200, {
      unitPrice: 8.5,
      minStock: 800,
      maxStock: 6000,
      reorderPoint: 1200,
      supplierLeadDays: 18,
      productionLeadDays: 0,
      transitLeadDays: 5,
      lot1No: 'LOT-IND-0426-A',
      lot1Qty: 2100,
      lot2No: 'LOT-IND-0426-B',
      lot2Qty: 2100,
    }),
    sc('sc-2', 'KMS-0098', 'French Terry Fleece', 'Kumaş', 'metre', fabricWh, 'BOSSA', 14, 300, 6800, {
      unitPrice: 6.2,
      minStock: 600,
      maxStock: 8000,
      reorderPoint: 900,
      supplierLeadDays: 12,
      transitLeadDays: 4,
      lot1No: 'LOT-FTR-0318',
      lot1Qty: 3400,
      lot2No: 'LOT-FTR-0522',
      lot2Qty: 3400,
    }),
    sc('sc-3', 'KMS-0201', 'Stretch Chino Twill', 'Kumaş', 'metre', fabricWh, 'ISKO', 18, 400, 3100, {
      unitPrice: 7.1,
      minStock: 500,
      maxStock: 5000,
      reorderPoint: 800,
      supplierLeadDays: 16,
      transitLeadDays: 5,
      lot1No: 'LOT-CHN-0110',
      lot1Qty: 3100,
    }),
    sc('sc-4', 'KMS-0034', 'Poplin Woven White', 'Kumaş', 'metre', fabricWh, 'BOSSA', 14, 200, 5200, {
      unitPrice: 5.4,
      minStock: 400,
      maxStock: 6000,
      reorderPoint: 700,
      supplierLeadDays: 12,
      transitLeadDays: 4,
      lot1No: 'LOT-POP-0201-A',
      lot1Qty: 2600,
      lot2No: 'LOT-POP-0201-B',
      lot2Qty: 2600,
    }),
    sc('sc-6', 'TLA-0012', 'Fusible Interlining 80gsm', 'Tela', 'metre', fabricWh, 'SANKO', 10, 100, 1500, { unitPrice: 2.1 }),
    sc('sc-8', 'DGM-0012', 'Metal Shank Button 17mm', 'Düğme', 'adet', accessoryWh, 'YKK', 14, 5000, 45000, {
      diameter: 17,
      holes: 'Shank',
      material: 'Metal',
      unitPrice: 0.08,
      minStock: 5000,
      maxStock: 80000,
      reorderPoint: 10000,
      supplierLeadDays: 14,
      productionLeadDays: 3,
      transitLeadDays: 2,
    }),
    sc('sc-10', 'ETK-0034', 'Woven Main Label SS26', 'Etiket', 'adet', accessoryWh, 'LABELPRO', 21, 1000, 28000, { labelType: 'Main', language: 'Multi', unitPrice: 0.12 }),
    sc('sc-11', 'ETK-0041', 'Care Label Multi-lang', 'Etiket', 'adet', accessoryWh, 'LABELPRO', 21, 1000, 35000, { unitPrice: 0.05 }),
    sc('sc-13', 'DKM-0011', 'Woven Brand Label', 'Dokuma Etiket', 'adet', accessoryWh, 'LABELPRO', 21, 500, 18000, { unitPrice: 0.15 }),
    sc('sc-14', 'AKS-0201', 'YKK Metal Zipper 5mm 60cm', 'Fermuar', 'adet', accessoryWh, 'YKK', 14, 500, 8500, { length: 60, direction: 'Sol', teethType: 'Metal', brand: 'YKK', unitPrice: 1.85 }),
    sc('sc-16', 'AKS-0088', 'Polyester Core Spun Thread 120', 'İplik', 'cone', accessoryWh, 'COATS', 7, 50, 420, { number: 120, coneWeight: 5000, unitPrice: 3.2 }),
    sc('sc-18', 'AMB-0001', 'Polybag 30x40', 'Poşet', 'adet', accessoryWh, 'SANKO', 7, 5000, 95000, { unitPrice: 0.06 }),
    sc('sc-21', 'AMB-0004', 'Master Carton 48 adet', 'Koli', 'adet', accessoryWh, 'SANKO', 7, 100, 2800, { width: 60, height: 40, depth: 30, packQty: 48, unitPrice: 0.45 }),
  ]
}

function asArrayProxy<T>(getter: () => T[]): T[] {
  return new Proxy([] as T[], {
    get(_target, prop) {
      const arr = getter()
      const value = Reflect.get(arr, prop, arr)
      return typeof value === 'function' ? value.bind(arr) : value
    },
  })
}

/** @deprecated Runtime için queryAllStockCards kullanın */
export const STOCK_CARDS = asArrayProxy(() => queryAllStockCards())

export function getStockCardById(id: string): StockCard | undefined {
  return queryStockCardById(id) ?? undefined
}

export function getStockCardsByCategory(category?: StockCardCategory): StockCard[] {
  const all = queryAllStockCards()
  if (!category) return all
  return all.filter((s) => s.category === category)
}

export type { StockCardCategory }
