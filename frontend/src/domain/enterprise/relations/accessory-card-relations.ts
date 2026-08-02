/**
 * Accessory Card enterprise relations — kategori bazlı + history
 */
import { getAllAccessoryCards } from '../../services/textile/accessory-management-service'
import { supplierRepository } from '../../master-data'
import type { EntityRelation, EntityRelationBundle } from '../types'

function rel(fromId: string, toType: EntityRelation['toType'], toId: string, kind: EntityRelation['kind'], label: string): EntityRelation {
  return { id: `rel-ac-${fromId}-${toType}-${toId}`, fromType: 'ACCESSORY_CARD', fromId, toType, toId, kind, label }
}

export function buildAccessoryCardRelations(accessoryId: string): EntityRelationBundle | undefined {
  const acc = getAllAccessoryCards().find((a) => a.id === accessoryId)
  if (!acc) return undefined

  const supplier = supplierRepository.getByCode('YKK')
  const relations: EntityRelation[] = [
    rel(acc.id, 'SUPPLIER', supplier?.id ?? 'sup-ykk', 'SUPPLIES', 'Primary Supplier'),
    rel(acc.id, 'SUPPLIER', 'sup-alt-001', 'REFERENCES', 'Alternative Supplier'),
    rel(acc.id, 'ACCESSORY_CARD', `${acc.id}-alt-mat`, 'REFERENCES', 'Alternative Material'),
    rel(acc.id, 'BRAND', 'brd-lcw', 'APPROVES', 'Approved Brand'),
    rel(acc.id, 'INSPECTION', `qc-hist-${acc.id}`, 'INSPECTS', 'Quality History'),
    rel(acc.id, 'COST_SHEET', `price-hist-${acc.id}`, 'REFERENCES', 'Price History'),
    rel(acc.id, 'COST_SHEET', `lead-hist-${acc.id}`, 'REFERENCES', 'Lead Time History'),
  ]

  return {
    rootType: 'ACCESSORY_CARD',
    rootId: acc.id,
    rootCode: acc.code,
    rootLabel: acc.name,
    relations,
    maxDepth: 2,
  }
}

export function buildAllAccessoryCardRelations(): EntityRelationBundle[] {
  return getAllAccessoryCards().slice(0, 8).map((a) => buildAccessoryCardRelations(a.id)).filter((b): b is EntityRelationBundle => !!b)
}
