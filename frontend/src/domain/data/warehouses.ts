import type { Warehouse } from '../types'

export const WAREHOUSES: Warehouse[] = [
  { id: 'wh-1', code: 'KMS-01', name: 'Kumaş Deposu', type: 'Hammadde', location: 'Bursa' },
  { id: 'wh-2', code: 'AKS-01', name: 'Aksesuar Deposu', type: 'Hammadde', location: 'Bursa' },
  { id: 'wh-3', code: 'MAM-01', name: 'Mamül Deposu', type: 'Mamül', location: 'İstanbul' },
]

export function getWarehouseByCode(code: string): Warehouse | undefined {
  return WAREHOUSES.find((w) => w.code === code)
}

export function getWarehouseName(code: string): string {
  return getWarehouseByCode(code)?.name ?? code
}

export function getWarehouseById(id: string): Warehouse | undefined {
  return WAREHOUSES.find((w) => w.id === id)
}
