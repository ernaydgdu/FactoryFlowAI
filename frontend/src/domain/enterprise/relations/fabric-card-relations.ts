/**
 * Fabric Card enterprise relations
 */
import { getAllFabricCards } from '../../services/textile/fabric-management-service'
import { STOCK_CARDS } from '../../data/stock-cards'
import { supplierRepository } from '../../master-data'
import type { EntityRelation, FabricCardRelations } from '../types'

function rel(fromId: string, toType: EntityRelation['toType'], toId: string, kind: EntityRelation['kind'], label: string): EntityRelation {
  return { id: `rel-fc-${fromId}-${toType}-${toId}`, fromType: 'FABRIC_CARD', fromId, toType, toId, kind, label }
}

export function buildFabricCardRelations(fabricId: string): FabricCardRelations | undefined {
  const fabric = getAllFabricCards().find((f) => f.id === fabricId || f.stockCardId === fabricId)
  if (!fabric) return undefined

  const stock = STOCK_CARDS.find((s) => s.id === fabric.stockCardId)
  const supplier =
    supplierRepository.getActive().find((s) => s.name === stock?.supplier) ??
    supplierRepository.getByCode('BOSSA')
  const relations: EntityRelation[] = []

  if (supplier) relations.push(rel(fabric.id, 'SUPPLIER', supplier.id, 'SUPPLIES', 'Supplier'))
  relations.push(rel(fabric.id, 'COMPOSITION', fabric.compositionId ?? 'fc-c100', 'HAS', 'Composition'))
  relations.push(rel(fabric.id, 'FABRIC_CARD', fabric.id, 'REFERENCES', 'Construction'))
  relations.push(rel(fabric.id, 'STOCK_LOT', `lot-${fabric.stockCardId}`, 'STORED_IN', 'Stock Lot'))
  relations.push(rel(fabric.id, 'PURCHASE_ORDER', `po-${fabric.stockCardId}`, 'DERIVED_FROM', 'Purchase Order'))
  relations.push(rel(fabric.id, 'COST_SHEET', `cost-fabric-${fabric.id}`, 'REFERENCES', 'Cost History'))
  relations.push(rel(fabric.id, 'INSPECTION', `insp-${fabric.id}`, 'INSPECTS', 'Inspection Standard'))
  relations.push(rel(fabric.id, 'COLOR_CARD', 'clr-approved-fabric', 'APPROVES', 'Approved Colors'))

  return {
    rootType: 'FABRIC_CARD',
    rootId: fabric.id,
    rootCode: fabric.code,
    rootLabel: fabric.name,
    relations,
    maxDepth: 3,
    supplierId: supplier?.id ?? 'sup-bos',
    compositionId: fabric.compositionId ?? 'fc-c100',
    stockLotIds: [`lot-${fabric.stockCardId}`],
  }
}

export function buildAllFabricCardRelations(): FabricCardRelations[] {
  return getAllFabricCards().map((f) => buildFabricCardRelations(f.id)).filter((b): b is FabricCardRelations => !!b)
}
