/**
 * Constraint Engine — capacity / material / machine / quality / shipment / financial.
 * Read-only industrial checks. No ERP mutation.
 */
import type {
  ConstraintCheckResult,
  FactContext,
  FormulaRunResult,
  RuleEvaluationResult,
  RuleVerdict,
} from './types'

function worst(a: RuleVerdict, b: RuleVerdict): RuleVerdict {
  const rank: Record<RuleVerdict, number> = { PASS: 0, WARNING: 1, CRITICAL: 2, BLOCKED: 3 }
  return rank[a] >= rank[b] ? a : b
}

export function evaluateConstraints(input: {
  context: FactContext
  rules: RuleEvaluationResult[]
  formulae: FormulaRunResult[]
}): ConstraintCheckResult[] {
  const { context: ctx, rules, formulae } = input
  const out: ConstraintCheckResult[] = []

  const mrpNet = formulae.find((f) => f.formulaCode === 'MRP_NET_REQUIREMENT')
  const materialVerdict: RuleVerdict =
    Number(ctx.netShortage) > 0 ? (Number(ctx.netShortage) > Number(ctx.stock) * 0.5 ? 'CRITICAL' : 'WARNING') : 'PASS'
  out.push({
    id: 'cst-material',
    domain: 'Material',
    verdict: materialVerdict,
    title: 'Material availability',
    detail:
      materialVerdict === 'PASS'
        ? 'No aggregated MRP shortage detected.'
        : `Net shortage ${String(ctx.netShortage)} across ${String(ctx.lowStockLines)} MRP lines.`,
    evidence: [
      `gross=${String(ctx.gross)}`,
      `stock=${String(ctx.stock)}`,
      `openPO=${String(ctx.openPO)}`,
      `openProduction=${String(ctx.openProductionQty)}`,
      mrpNet?.ok ? `formula MRP_NET=${mrpNet.value}` : 'MRP_NET not computed',
    ],
    affectedModules: ['mrp', 'inventory', 'purchasing', 'warehouse'],
    relatedRuleIds: rules.filter((r) => r.ruleCode.includes('FIFO') || r.matched).map((r) => r.ruleId),
    relatedFormulaIds: mrpNet ? [mrpNet.formulaId] : ['f-mrp-net'],
  })

  const util = Number(ctx.maxUtilization) || 0
  const capacityVerdict: RuleVerdict =
    util >= 100 ? 'CRITICAL' : util >= 95 || Boolean(ctx.capacityOverloaded) ? 'WARNING' : 'PASS'
  out.push({
    id: 'cst-capacity',
    domain: 'Capacity',
    verdict: Boolean(ctx.hasLateOrder) && util >= 90 ? worst(capacityVerdict, 'WARNING') : capacityVerdict,
    title: 'Work center capacity',
    detail: `Max utilization ${util}% · min free capacity ${String(ctx.minFreeCapacity)} · termin risk orders ${String(ctx.terminRiskCount ?? 0)}.`,
    evidence: [
      `maxUtilization=${util}`,
      `minFreeCapacity=${String(ctx.minFreeCapacity)}`,
      `lateOrderCount=${String(ctx.lateOrderCount ?? 0)}`,
    ],
    affectedModules: ['production-planning', 'production-order', 'sales-order'],
    relatedRuleIds: [],
    relatedFormulaIds: [],
  })

  const maint = rules.find((r) => r.ruleCode === 'MAINTENANCE_EXPIRED_BLOCK')
  out.push({
    id: 'cst-machine',
    domain: 'Machine',
    verdict: maint?.matched ? maint.verdict : 'PASS',
    title: 'Machine maintenance gate',
    detail: maint?.matched
      ? maint.message
      : 'No expired-maintenance block signal in fact context.',
    evidence: maint?.evidence ?? [`maintenanceExpired=${String(ctx.maintenanceExpired)}`],
    affectedModules: ['production-order', 'shop-floor'],
    relatedRuleIds: maint ? [maint.ruleId] : ['br-maint'],
    relatedFormulaIds: [],
  })

  const insp = rules.find((r) => r.ruleCode === 'INSPECTION_FAIL_BLOCK_SHIP')
  const qualityVerdict: RuleVerdict =
    Number(ctx.qualityHoldCount) > 0 ? 'BLOCKED' : insp?.matched ? insp.verdict : 'PASS'
  out.push({
    id: 'cst-quality',
    domain: 'Quality',
    verdict: qualityVerdict,
    title: 'Quality hold / inspection',
    detail:
      qualityVerdict === 'PASS'
        ? 'No open quality holds blocking flow.'
        : `${String(ctx.qualityHoldCount)} open hold(s) — shipment path constrained.`,
    evidence: [
      `qualityHoldCount=${String(ctx.qualityHoldCount ?? 0)}`,
      `inspectionFailed=${String(ctx.inspectionFailed)}`,
    ],
    affectedModules: ['quality', 'shipment', 'packaging'],
    relatedRuleIds: insp ? [insp.ruleId] : ['br-insp-fail'],
    relatedFormulaIds: [],
  })

  out.push({
    id: 'cst-shipment',
    domain: 'Shipment',
    verdict: qualityVerdict === 'BLOCKED' ? 'BLOCKED' : 'PASS',
    title: 'Shipment continuation',
    detail:
      qualityVerdict === 'BLOCKED'
        ? 'Shipment cannot continue while inspection holds are open.'
        : `Shipments tracked: ${String(ctx.shipmentCount ?? 0)} (in transit ${String(ctx.shipmentInTransit ?? 0)}).`,
    evidence: [
      `shipmentCount=${String(ctx.shipmentCount ?? 0)}`,
      `inspectionFailed=${String(ctx.inspectionFailed)}`,
    ],
    affectedModules: ['shipment', 'quality', 'export-logistics'],
    relatedRuleIds: insp ? [insp.ruleId] : ['br-insp-fail'],
    relatedFormulaIds: [],
  })

  const failed = Number(ctx.financeFailed) || 0
  const anomaly = Number(ctx.financeAnomaly) || 0
  const financialVerdict: RuleVerdict =
    failed > 0 ? 'CRITICAL' : anomaly >= 70 ? 'WARNING' : 'PASS'
  out.push({
    id: 'cst-financial',
    domain: 'Financial',
    verdict: financialVerdict,
    title: 'Finance posting health',
    detail:
      financialVerdict === 'PASS'
        ? 'No failed postings; anomaly score within tolerance.'
        : `Failed postings=${failed}, avg anomaly=${anomaly}.`,
    evidence: [
      `financeFailed=${failed}`,
      `financeQueued=${String(ctx.financeQueued ?? 0)}`,
      `financeAnomaly=${anomaly}`,
    ],
    affectedModules: ['finance-integration', 'cost-closing', 'style-closing'],
    relatedRuleIds: [],
    relatedFormulaIds: [],
  })

  return out
}
