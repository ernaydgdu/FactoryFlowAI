/**
 * Quality domain enterprise relations
 */
import { QUALITY_DEFECT_CODES, QUALITY_INSPECTION_PLANS } from '../enterprise-seed'
import type { EntityRelation, QualityDomainRelations } from '../types'

function rel(fromId: string, toType: EntityRelation['toType'], toId: string, kind: EntityRelation['kind'], label: string): EntityRelation {
  return { id: `rel-qc-${fromId}-${toType}-${toId}`, fromType: 'QUALITY_PLAN', fromId, toType, toId, kind, label }
}

export function buildQualityRelations(planId: string): QualityDomainRelations | undefined {
  const plan = QUALITY_INSPECTION_PLANS.find((p) => p.id === planId)
  if (!plan) return undefined

  const relations: EntityRelation[] = [
    rel(planId, 'INSPECTION', `${planId}-point-inline`, 'HAS', 'Inspection Point'),
    rel(planId, 'INSPECTION', `${planId}-point-final`, 'HAS', 'Inspection Point'),
    rel(planId, 'INSPECTION', `${planId}-aql`, 'USES', 'AQL'),
  ]

  for (const dc of QUALITY_DEFECT_CODES) {
    relations.push(rel(planId, 'INSPECTION', dc.id, 'REFERENCES', dc.name))
  }

  relations.push(rel(planId, 'INSPECTION', `${planId}-repair`, 'REFERENCES', 'Repair Codes'))
  relations.push(rel(planId, 'INSPECTION', `${planId}-reject`, 'REFERENCES', 'Reject Codes'))
  relations.push(rel(planId, 'INSPECTION', `${planId}-capa`, 'TRIGGERS', 'CAPA'))
  relations.push(rel(planId, 'INSPECTION', `${planId}-history`, 'REFERENCES', 'History'))

  return {
    rootType: 'QUALITY_PLAN',
    rootId: planId,
    rootCode: plan.code,
    rootLabel: plan.name,
    relations,
    maxDepth: 2,
    inspectionPlanId: planId,
    defectCodeIds: QUALITY_DEFECT_CODES.map((d) => d.id),
  }
}

export function buildAllQualityRelations(): QualityDomainRelations[] {
  return QUALITY_INSPECTION_PLANS.map((p) => buildQualityRelations(p.id)).filter((b): b is QualityDomainRelations => !!b)
}
