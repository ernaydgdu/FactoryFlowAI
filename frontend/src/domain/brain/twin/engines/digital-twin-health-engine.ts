/**
 * Digital Twin Health Engine — Factory Twin kalite ölçümü.
 */
import type { FactoryGraph, DigitalTwinHealthReport, TwinHealthFlag } from '../types'

export function assessDigitalTwinHealth(factoryGraph: FactoryGraph): DigitalTwinHealthReport {
  const flags: TwinHealthFlag[] = []

  const requiredTypes = [
    { type: 'MACHINE' as const, code: 'MISSING_MACHINE' as const, label: 'Makine' },
    { type: 'OPERATION' as const, code: 'MISSING_OPERATION' as const, label: 'Operasyon' },
    { type: 'PRODUCTION_LINE' as const, code: 'MISSING_LINE' as const, label: 'Hat' },
    { type: 'BOM' as const, code: 'MISSING_BOM' as const, label: 'BOM' },
    { type: 'TIMELINE_EVENT' as const, code: 'MISSING_TIMELINE' as const, label: 'Timeline' },
    { type: 'WORKSHOP' as const, code: 'MISSING_CAPACITY' as const, label: 'Kapasite' },
    { type: 'WAREHOUSE' as const, code: 'MISSING_WAREHOUSE' as const, label: 'Depo' },
    { type: 'MATERIAL' as const, code: 'MISSING_CONSUMPTION' as const, label: 'Sarfiyat' },
  ]

  for (const req of requiredTypes) {
    const nodes = factoryGraph.nodes.filter((n) => n.type === req.type)
    if (nodes.length === 0) {
      flags.push({
        code: req.code,
        severity: req.type === 'BOM' || req.type === 'TIMELINE_EVENT' ? 'CRITICAL' : 'WARNING',
        message: `Eksik ${req.label}`,
        nodeType: req.type,
      })
    }
    const missingQuality = nodes.filter((n) => n.dataQuality === 'MISSING')
    if (missingQuality.length > 0) {
      flags.push({
        code: req.code,
        severity: 'WARNING',
        message: `${missingQuality.length} ${req.label} node verisi eksik`,
        nodeType: req.type,
      })
    }
  }

  if (factoryGraph.nodes.length === 0) {
    flags.push({
      code: 'INCOMPLETE_GRAPH',
      severity: 'CRITICAL',
      message: 'Factory Graph boş',
    })
  }

  const completeNodes = factoryGraph.nodes.filter((n) => n.dataQuality === 'COMPLETE').length
  const dataCompletenessScore =
    factoryGraph.nodes.length > 0
      ? Math.round((completeNodes / factoryGraph.nodes.length) * 100)
      : 0

  const expectedMinEdges = factoryGraph.nodeCount * 0.5
  const graphConnectivityScore =
    factoryGraph.edgeCount >= expectedMinEdges
      ? 90
      : Math.round((factoryGraph.edgeCount / Math.max(expectedMinEdges, 1)) * 100)

  const criticalCount = flags.filter((f) => f.severity === 'CRITICAL').length
  const twinHealthScore = Math.max(
    0,
    Math.round((dataCompletenessScore + graphConnectivityScore) / 2 - criticalCount * 10),
  )

  return {
    twinHealthScore,
    dataCompletenessScore,
    graphConnectivityScore,
    flags,
    generatedAt: new Date().toISOString(),
  }
}
