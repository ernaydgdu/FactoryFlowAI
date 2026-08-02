/**
 * Textile Factory Validation — mevcut domain mimarisini 10 gerçek senaryoda doğrular.
 * Yeni engine/framework YOK — yalnızca mevcut servisleri orchestrate eder.
 */
import { SALES_ORDERS } from '../data/orders'
import { getProductById, PRODUCT_CARDS } from '../data/products'
import { STOCK_CARDS } from '../data/stock-cards'
import { DEMO_EXPECTED, DEMO_SCENARIO_SUMMARY, getDemoWorkshopRemaining, DEMO_STOCK_LEDGER } from '../data/stock-ledger-demo'
import {
  BUSINESS_RULES,
  ruleOrderCreatedMRPAndPR,
  ruleProductionOrderReservation,
  rulePurchaseOrderReceipt,
  executeFullProductionScenario,
} from '../services/business-rule-engine'
import { createEmptyLedger, getBalance } from '../services/stock-ledger'
import { runPlanningEngineForOrder } from '../services/planning-engine'
import { calculateTerminPlan } from '../services/planning/termin-engine'
import { assessOrderRisk } from '../services/planning/risk-engine'
import { calculateDetailedCost, calculateProfit } from '../services/planning/cost-engine'
import { getWorkshopCapacitySnapshots } from '../services/planning/capacity-engine'
import { runBrainAnalysis, runBrainRecommendation } from '../brain/services/brain-kernel'
import { runDigitalTwinIntelligence } from '../brain/twin/engines/twin-orchestrator'
import { knowledgeLayer } from '../brain/services/knowledge-layer'
import { createBrainContext } from '../brain/services/brain-kernel'
import { analyzeMaterialDelayImpact } from '../brain/twin/engines/impact-engine'
import { buildDependencyGraph } from '../brain/twin/engines/dependency-engine'
import { detectBottlenecks } from '../brain/twin/engines/bottleneck-engine'
import { buildRootCauseTree } from '../brain/twin/engines/root-cause-engine'
import { generatePredictions } from '../brain/twin/engines/prediction-engine'
import { createTwinScenario, runTwinScenario } from '../brain/twin/engines/scenario-engine'
import { buildFactoryGraph } from '../brain/twin/engines/factory-graph-engine'
import { KEPLER_BRAIN_COMPANY_ID } from '../brain/constants'
import { calcActualConsumption } from '../services/calculations'
import {
  executeAccessoryDelayScenario,
  getAccessoryDelayBrainRecommendations,
} from '../services/accessory-delay-service'
import {
  calculateReworkImpact,
  executeQualityReworkScenario,
  getFailedInspections,
  getQualityReworkBrainRecommendations,
} from '../services/quality-rework-service'
import {
  analyzeLeftoverFabric,
  executeLeftoverReuseScenario,
  getLeftoverBrainRecommendations,
} from '../services/leftover-fabric-service'
import {
  executeSplitProductionScenario,
  getSplitBrainRecommendations,
  planSplitCapacity,
  validateSplitIntegrity,
} from '../services/production-split-service'
import { getOrderTimeline } from '../platform/services/timeline-service'

export type ValidationGap = {
  category: 'DOMAIN' | 'BUSINESS_RULE' | 'MASTER_DATA' | 'PLANNING' | 'UI' | 'AI'
  item: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
}

export type ScenarioValidationResult = {
  scenarioId: number
  title: string
  status: 'PASS' | 'PARTIAL' | 'GAP'
  domainServicesUsed: string[]
  businessRulesTriggered: string[]
  planningOutput: Record<string, unknown>
  stockLedgerSummary?: Record<string, unknown>
  brainAnalysis?: Record<string, unknown>
  twinAnalysis?: Record<string, unknown>
  recommendations: string[]
  gaps: ValidationGap[]
  steps: string[]
}

function brainCtx(sessionId: string, orderId?: string) {
  return createBrainContext({
    userId: 'user-planner-001',
    companyId: KEPLER_BRAIN_COMPANY_ID,
    sessionId,
    operationMode: 'ANALYZE',
    scope: { orderId, focusArea: orderId ? 'TERMIN' : 'GENERAL' },
  })
}

/** SENARYO 1 — LC Waikiki 1000 gömlek, 1550m sipariş, 1450m teslim */
function validateScenario1(): ScenarioValidationResult {
  const steps: string[] = []
  const gaps: ValidationGap[] = []
  const ledger = createEmptyLedger()
  const qty = 1000
  const consumption = 1.55
  const requiredMeters = qty * consumption
  const orderedMeters = 1550
  const receivedMeters = 1450
  const shortfall = orderedMeters - receivedMeters

  const bom = [{ id: 'bom-1', stockCardId: 'sc-1', consumption, wastePercent: 3, actualConsumption: calcActualConsumption(consumption, 3) }]
  const br01 = ruleOrderCreatedMRPAndPR(
    { id: 's1-order', orderNo: 'SIP-LCW-1000', matrixTotals: { byColor: {}, bySize: {}, grandTotal: qty }, productCardId: '1' },
    bom,
    ledger,
  )
  steps.push(`BR-01 MRP: ${requiredMeters}m kumaş gerekli (${qty} × ${consumption})`)
  steps.push(`MRP netRequired: ${br01.payload?.mrp.lines[0]?.netRequired ?? '—'}m`)

  rulePurchaseOrderReceipt(
    { poId: 'po-lcw', poNo: 'PO-LCW-FAB', stockCardId: 'sc-1', quantity: receivedMeters, warehouseCode: 'KMS-01', createdBy: 'buyer' },
    ledger,
  )
  steps.push(`BR-02 RECEIPT: ${receivedMeters}m teslim (eksik ${shortfall}m)`)

  const reserveAttempt = ruleProductionOrderReservation(
    {
      productionOrderId: 'prod-lcw',
      productionOrderNo: 'UE-LCW',
      orderId: 's1-order',
      orderNo: 'SIP-LCW-1000',
      lines: [{ stockCardId: 'sc-1', quantity: orderedMeters, warehouseCode: 'KMS-01' }],
      createdBy: 'planner',
    },
    ledger,
  )
  steps.push(`BR-03 Rezervasyon ${orderedMeters}m: ${reserveAttempt.success ? 'OK' : 'FAIL — ' + reserveAttempt.errors?.join(', ')}`)

  const balance = getBalance(ledger, 'sc-1', 'KMS-01')
  steps.push(`Depo bakiye: onHand=${balance?.onHand}, available=${balance?.available}`)

  const ctx = brainCtx('val-s1', '1')
  const snapshot = knowledgeLayer.assembleSnapshot(ctx)
  const planning = runPlanningEngineForOrder(SALES_ORDERS[0])
  const twin = runDigitalTwinIntelligence(ctx, snapshot)
  const impact = analyzeMaterialDelayImpact('sc-1', 4)

  if (!reserveAttempt.success) {
    gaps.push({ category: 'BUSINESS_RULE', item: 'BR-03-AUTO-SHORTFALL: Eksik teslimat otomatik backorder/alert kuralı yok', severity: 'HIGH' })
  }
  gaps.push({ category: 'DOMAIN', item: 'Partial PO receipt workflow (1450/1550) dedicated domain type yok', severity: 'MEDIUM' })
  if (impact.affectedOrders.length === 0) {
    gaps.push({ category: 'AI', item: 'Impact Engine sc-1 ile LOT eşleştirmesi zayıf', severity: 'MEDIUM' })
  }

  return {
    scenarioId: 1,
    title: 'LC Waikiki 1000 Gömlek — Eksik Kumaş Teslimatı (1450/1550m)',
    status: reserveAttempt.success ? 'PARTIAL' : 'PASS',
    domainServicesUsed: ['Business Rule Engine', 'Stock Ledger', 'Planning Engine', 'Knowledge Layer', 'Brain Kernel', 'Digital Twin', 'Impact Engine'],
    businessRulesTriggered: ['BR-01-ORDER-MRP-PR', 'BR-02-PO-RECEIPT', 'BR-03-PRODUCTION-RESERVE'],
    planningOutput: { riskLevel: planning.risk.level, riskScore: planning.risk.score, terminSlack: planning.termin.totalSlackDays },
    stockLedgerSummary: { receivedMeters, requiredMeters, shortfall, onHand: balance?.onHand, reservationFailed: !reserveAttempt.success },
    brainAnalysis: { insightCount: runBrainAnalysis({ userId: 'user-planner-001', sessionId: 'val-s1b', orderId: '1' }).analysis?.insights.length },
    twinAnalysis: { bottlenecks: twin.bottlenecks.length, twinHealth: twin.twinHealth.twinHealthScore },
    recommendations: runBrainRecommendation({ userId: 'user-planner-001', sessionId: 'val-s1c', orderId: '1' }).recommendations?.map((r) => r.title) ?? [],
    gaps,
    steps,
  }
}

/** SENARYO 2 — YKK fermuar 4 gün gecikme */
function validateScenario2(): ScenarioValidationResult {
  const steps: string[] = []
  const gaps: ValidationGap[] = []
  const zipperCardId = 'sc-14'
  const delayDays = 4

  const scenario = executeAccessoryDelayScenario(zipperCardId, delayDays)
  const affectedOrders = scenario.impacts

  steps.push(`YKK fermuar (${zipperCardId}) kullanan sipariş: ${affectedOrders.length} adet`)
  affectedOrders.slice(0, 5).forEach((impact) => {
    steps.push(
      `${impact.orderNo}: slack ${impact.originalSlack} → ${impact.adjustedSlack} gün, risk ${impact.originalRisk.level} → ${impact.adjustedRisk.level}`,
    )
  })

  steps.push(`Dependency graph: ${scenario.deps.edges.length} shared-material edge`)
  steps.push(`BR-14 Accessory Delay: ${scenario.ruleResult.success ? 'OK' : 'FAIL'}`)
  steps.push(`Twin impact: ${scenario.twinImpact.affectedOrders.length} sipariş`)

  const brainRecs = getAccessoryDelayBrainRecommendations(zipperCardId, delayDays, affectedOrders)

  if (affectedOrders.length === 0) {
    gaps.push({ category: 'MASTER_DATA', item: 'BOM\'larda sc-14 (YKK) bağlantısı yok', severity: 'HIGH' })
  }
  if (!scenario.ruleResult.success) {
    gaps.push({ category: 'BUSINESS_RULE', item: 'BR-14-ACCESSORY-DELAY çalışmadı', severity: 'HIGH' })
  }
  const hasTerminShift = affectedOrders.some((i) => i.adjustedSlack < i.originalSlack)
  if (!hasTerminShift) {
    gaps.push({ category: 'PLANNING', item: 'Accessory delay termin recalc çalışmadı', severity: 'HIGH' })
  }

  const status: ScenarioValidationResult['status'] =
    gaps.filter((g) => g.severity === 'HIGH').length === 0 ? 'PASS' : 'PARTIAL'

  return {
    scenarioId: 2,
    title: 'YKK Fermuar 4 Gün Gecikme',
    status,
    domainServicesUsed: [
      'Accessory Delay Service',
      'Business Rule Engine BR-14',
      'Termin Engine',
      'Risk Engine',
      'Dependency Engine',
      'Impact Engine',
      'Brain',
    ],
    businessRulesTriggered: scenario.ruleResult.success ? ['BR-14-ACCESSORY-DELAY'] : [],
    planningOutput: {
      affectedOrderCount: affectedOrders.length,
      delayDays,
      avgRiskBefore: affectedOrders.length
        ? Math.round(affectedOrders.reduce((s, i) => s + i.originalRisk.score, 0) / affectedOrders.length)
        : 0,
      avgRiskAfter: affectedOrders.length
        ? Math.round(affectedOrders.reduce((s, i) => s + i.adjustedRisk.score, 0) / affectedOrders.length)
        : 0,
    },
    brainAnalysis: { recommendations: brainRecs },
    twinAnalysis: {
      sharedResources: scenario.deps.sharedResources.length,
      impactedOrders: scenario.twinImpact.affectedOrders.length,
    },
    recommendations: brainRecs,
    gaps,
    steps,
  }
}

/** SENARYO 3 — 1000 plan, 900 üretim, 60 fire, 40 eksik */
function validateScenario3(): ScenarioValidationResult {
  const steps: string[] = []
  const gaps: ValidationGap[] = []
  const scenario = executeFullProductionScenario(createEmptyLedger())

  steps.push(`Plan: ${DEMO_EXPECTED.plannedQty}, Üretim: ${DEMO_EXPECTED.producedQty}, Fire: ${DEMO_EXPECTED.wasteQty}, Eksik: ${DEMO_EXPECTED.missingQty}`)
  steps.push(`Tüketim: ${DEMO_EXPECTED.producedQty} × ${DEMO_EXPECTED.consumptionPerUnit} = ${DEMO_EXPECTED.consumedMeters}m`)
  steps.push(`Transfer: ${DEMO_EXPECTED.transferredMeters}m, Fason kalan: ${scenario.scenarioSummary.remainingInWorkshop}m (beklenen ${DEMO_EXPECTED.remainingInWorkshop}m)`)
  steps.push(`Toplam hareket: ${scenario.scenarioSummary.totalMovements}`)

  scenario.results.forEach((r) => {
    if (r.success) steps.push(`✓ ${r.ruleId}: ${r.movements.length} hareket`)
  })

  const brain = runBrainAnalysis({ userId: 'user-planner-001', sessionId: 'val-s3', orderId: '1' })
  const rootCause = brain.twinIntelligence?.rootCause

  if (scenario.scenarioSummary.remainingInWorkshop !== DEMO_EXPECTED.remainingInWorkshop) {
    gaps.push({ category: 'DOMAIN', item: 'Fason kalan hesap sapması', severity: 'HIGH' })
  }
  gaps.push({ category: 'AI', item: 'Brain fire/eksik nedeni otomatik root cause (fire vs eksik) ayrıştırması zayıf', severity: 'MEDIUM' })

  return {
    scenarioId: 3,
    title: '1000 Plan / 900 Üretim / 60 Fire / 40 Eksik',
    status: scenario.scenarioSummary.remainingInWorkshop === DEMO_EXPECTED.remainingInWorkshop ? 'PASS' : 'PARTIAL',
    domainServicesUsed: ['Business Rule Engine BR-01..BR-10', 'Stock Ledger', 'Brain', 'Digital Twin Root Cause'],
    businessRulesTriggered: scenario.results.filter((r) => r.success).map((r) => r.ruleId),
    planningOutput: { demoSummary: DEMO_SCENARIO_SUMMARY },
    stockLedgerSummary: {
      consumedMeters: scenario.scenarioSummary.consumedMeters,
      remainingInWorkshop: scenario.scenarioSummary.remainingInWorkshop,
      movementTypes: [...new Set(scenario.ledger.movements.map((m) => m.type))],
    },
    brainAnalysis: { reasoningNotes: brain.analysis?.reasoningNotes.slice(0, 3), rootCauseNodes: rootCause?.nodes.length },
    recommendations: brain.recommendations?.map((r) => r.title) ?? [],
    gaps,
    steps,
  }
}

/** SENARYO 4 — Buyer EXF 5 gün öne çekti */
function validateScenario4(): ScenarioValidationResult {
  const steps: string[] = []
  const gaps: ValidationGap[] = []
  const order = SALES_ORDERS.find((o) => o.terminRisk) ?? SALES_ORDERS[0]
  const originalExf = order.general.exf
  const exfDate = new Date(originalExf.includes('T') ? originalExf : `${originalExf}T12:00:00`)
  exfDate.setDate(exfDate.getDate() - 5)
  const newExf = exfDate.toISOString().slice(0, 10)

  const originalPlan = calculateTerminPlan(order)
  const acceleratedOrder = { ...order, general: { ...order.general, exf: newExf } }
  const newPlan = calculateTerminPlan(acceleratedOrder)
  const originalRisk = assessOrderRisk(order, originalPlan, getWorkshopCapacitySnapshots())
  const newRisk = assessOrderRisk(acceleratedOrder, newPlan, getWorkshopCapacitySnapshots())

  steps.push(`${order.orderNo}: EXF ${originalExf} → ${newExf} (-5 gün)`)
  steps.push(`Slack: ${originalPlan.totalSlackDays} → ${newPlan.totalSlackDays} gün`)
  steps.push(`Risk: ${originalRisk.level} (${originalRisk.score}) → ${newRisk.level} (${newRisk.score})`)
  steps.push(`Darboğaz: ${newPlan.bottleneckStage ?? '—'}`)

  gaps.push({ category: 'PLANNING', item: 'EXF değişikliği otomatik MRP/kapasite yeniden planlama trigger yok', severity: 'HIGH' })
  gaps.push({ category: 'DOMAIN', item: 'Buyer EXF amendment domain event (EXF_CHANGED) tanımlı değil', severity: 'MEDIUM' })

  const brain = runBrainAnalysis({ userId: 'user-planner-001', sessionId: 'val-s4', orderId: order.id, focusArea: 'TERMIN' })

  return {
    scenarioId: 4,
    title: 'Buyer EXF 5 Gün Öne Çekildi',
    status: newPlan.riskLevel !== originalPlan.riskLevel ? 'PASS' : 'PARTIAL',
    domainServicesUsed: ['Termin Engine', 'Risk Engine', 'Planning Engine', 'Brain'],
    businessRulesTriggered: [],
    planningOutput: { originalSlack: originalPlan.totalSlackDays, newSlack: newPlan.totalSlackDays, originalRisk: originalRisk.score, newRisk: newRisk.score, bottleneck: newPlan.bottleneckStage },
    brainAnalysis: { insights: brain.analysis?.insights.map((i) => i.title) },
    recommendations: brain.recommendations?.map((r) => r.title) ?? [],
    gaps,
    steps,
  }
}

/** SENARYO 5 — Atölye B 2 gün kapalı */
function validateScenario5(): ScenarioValidationResult {
  const steps: string[] = []
  const gaps: ValidationGap[] = []
  const ctx = brainCtx('val-s5')
  const snapshot = knowledgeLayer.assembleSnapshot(ctx)
  const factoryGraph = buildFactoryGraph(ctx, snapshot)
  const scenario = createTwinScenario('WORKSHOP_CLOSED', { workshopCode: 'FSN-B', days: 2 })
  const result = runTwinScenario(scenario, factoryGraph)

  steps.push(`Senaryo: ${scenario.name}`)
  result.outcomes.forEach((o) => steps.push(`${o.metric}: ${o.baseValue} → ${o.projectedValue}`))
  steps.push(`Etkilenen sipariş: ${result.impactedOrderIds.length}`)
  result.risks.forEach((r) => steps.push(`Risk: ${r}`))

  gaps.push({ category: 'PLANNING', item: 'Atölye kapalı → otomatik sipariş redistribution algoritması yok', severity: 'HIGH' })
  gaps.push({ category: 'AI', item: 'Digital Twin senaryo sonucu somut atölye atama önerisi üretmiyor', severity: 'MEDIUM' })

  return {
    scenarioId: 5,
    title: 'Atölye B 2 Gün Kapalı — Sipariş Yeniden Dağıtım',
    status: 'PARTIAL',
    domainServicesUsed: ['Digital Twin Scenario Engine', 'Factory Graph', 'Alternative Engine (via Brain)'],
    businessRulesTriggered: [],
    planningOutput: {},
    twinAnalysis: { scenarioOutcomes: result.outcomes, impactedOrders: result.impactedOrderIds.length },
    recommendations: result.assumptions,
    gaps,
    steps,
  }
}

/** SENARYO 6 — Makine arızası */
function validateScenario6(): ScenarioValidationResult {
  const steps: string[] = []
  const gaps: ValidationGap[] = []
  const ctx = brainCtx('val-s6')
  const snapshot = knowledgeLayer.assembleSnapshot(ctx)
  const factoryGraph = buildFactoryGraph(ctx, snapshot)
  const bottlenecks = detectBottlenecks(factoryGraph)
  const machineBn = bottlenecks.find((b) => b.category === 'MACHINE_FAILURE')
  const predictions = generatePredictions(factoryGraph)
  const rootCause = buildRootCauseTree('SIP-2026-0138', bottlenecks)

  steps.push(`Bottleneck sayısı: ${bottlenecks.length}`)
  if (machineBn) steps.push(`Makine darboğaz: ${machineBn.title}`)
  steps.push(`Prediction sayısı: ${predictions.length}`)
  if (rootCause) steps.push(`Root cause chain: ${rootCause.nodes.length} node, ${rootCause.totalDelayDays} gün`)

  gaps.push({ category: 'MASTER_DATA', item: 'Makine arıza durumu (Machine.status=Down) master data alanı yok', severity: 'HIGH' })
  gaps.push({ category: 'DOMAIN', item: 'Machine downtime event → capacity recalc otomatik bağlantı yok', severity: 'HIGH' })

  return {
    scenarioId: 6,
    title: 'Makine Arızası — Hat Kapasitesi Düştü',
    status: machineBn ? 'PARTIAL' : 'GAP',
    domainServicesUsed: ['Bottleneck Engine', 'Root Cause Engine', 'Prediction Engine', 'Factory Graph'],
    businessRulesTriggered: [],
    planningOutput: { capacityPredictions: predictions.filter((p) => p.metric === 'capacityUtilization').length },
    twinAnalysis: { primaryBottleneck: bottlenecks[0]?.title, rootCauseDepth: rootCause?.nodes.length },
    recommendations: bottlenecks.slice(0, 3).map((b) => `${b.title}: ${b.description}`),
    gaps,
    steps,
  }
}

/** SENARYO 7 — AQL Fail */
function validateScenario7(): ScenarioValidationResult {
  const steps: string[] = []
  const gaps: ValidationGap[] = []
  const failedInspections = getFailedInspections()
  const primaryFail = failedInspections[0]

  steps.push(`AQL Fail inspection: ${failedInspections.length} adet`)
  failedInspections.slice(0, 3).forEach((q) => {
    steps.push(`${q.inspectionNo}: ${q.orderNo} AQL ${q.aqlLevel} = ${q.aqlResult}, repair=${q.repairQty}`)
  })

  if (!primaryFail) {
    gaps.push({ category: 'MASTER_DATA', item: 'Demo AQL Fail inspection kaydı yok', severity: 'HIGH' })
    return {
      scenarioId: 7,
      title: 'Kalite Kontrol AQL Fail — Tekrar Üretim',
      status: 'GAP',
      domainServicesUsed: ['Quality Inspections'],
      businessRulesTriggered: [],
      planningOutput: { failedInspections: 0 },
      recommendations: [],
      gaps,
      steps,
    }
  }

  const impact = calculateReworkImpact(primaryFail)!
  const reworkScenario = executeQualityReworkScenario(primaryFail)
  const brainRecs = getQualityReworkBrainRecommendations(impact)

  steps.push(`Rework UE: ${impact.reworkOrder.workOrderNo} — ${impact.reworkOrder.repairQty} adet`)
  steps.push(`Termin: slack ${impact.originalTermin.totalSlackDays} → ${impact.adjustedTermin.totalSlackDays} gün (-${impact.reworkOrder.reworkDays})`)
  steps.push(`Maliyet: $${impact.costBreakdown.total} (işçilik + kumaş)`)
  steps.push(`Risk: ${impact.originalRiskScore} → ${impact.adjustedRiskScore}`)
  steps.push(`BR-13 Quality Rework: ${reworkScenario.result?.success ? 'OK' : 'FAIL'}`)

  if (!reworkScenario.result?.success) {
    gaps.push({ category: 'BUSINESS_RULE', item: 'BR-13-QUALITY-REWORK çalışmadı', severity: 'HIGH' })
  }
  if (impact.adjustedTermin.totalSlackDays >= impact.originalTermin.totalSlackDays) {
    gaps.push({ category: 'PLANNING', item: 'Rework termin impact hesaplanmadı', severity: 'HIGH' })
  }
  if (!impact.reworkCapacity.fullyAllocated && impact.reworkOrder.repairQty > 100) {
    gaps.push({ category: 'PLANNING', item: 'Rework kapasite atanamadı', severity: 'MEDIUM' })
  }

  const status: ScenarioValidationResult['status'] =
    gaps.filter((g) => g.severity === 'HIGH').length === 0 ? 'PASS' : 'PARTIAL'

  return {
    scenarioId: 7,
    title: 'Kalite Kontrol AQL Fail — Tekrar Üretim',
    status,
    domainServicesUsed: [
      'Quality Rework Service',
      'Business Rule Engine BR-13',
      'Termin Engine',
      'Risk Engine',
      'Capacity Engine',
      'Cost Engine',
    ],
    businessRulesTriggered: reworkScenario.result?.success
      ? ['BR-02-PO-RECEIPT', 'BR-13-QUALITY-REWORK']
      : [],
    planningOutput: {
      failedInspections: failedInspections.length,
      reworkDays: impact.reworkOrder.reworkDays,
      reworkCost: impact.costBreakdown.total,
      terminSlackBefore: impact.originalTermin.totalSlackDays,
      terminSlackAfter: impact.adjustedTermin.totalSlackDays,
      riskBefore: impact.originalRiskScore,
      riskAfter: impact.adjustedRiskScore,
    },
    stockLedgerSummary: {
      reworkMovements: reworkScenario.result?.movements.length ?? 0,
      repairQty: impact.reworkOrder.repairQty,
    },
    brainAnalysis: { recommendations: brainRecs },
    recommendations: brainRecs,
    gaps,
    steps,
  }
}

/** SENARYO 8 — Pamuk fiyatı %15 arttı */
function validateScenario8(): ScenarioValidationResult {
  const steps: string[] = []
  const gaps: ValidationGap[] = []
  const order = SALES_ORDERS[0]
  const baseCost = calculateDetailedCost(order)
  const baseProfit = calculateProfit(order)
  const cottonIncrease = 0.15
  const newFabricCost = Math.round(baseCost.fabric * (1 + cottonIncrease))
  const newTotalCost = baseCost.totalCost - baseCost.fabric + newFabricCost
  const newFob = newTotalCost + baseCost.cm
  const newProfit = baseCost.sellingPrice - newFob
  const newMargin = Math.round((newProfit / baseCost.sellingPrice) * 1000) / 10

  steps.push(`${order.orderNo}: Kumaş maliyeti $${baseCost.fabric} → $${newFabricCost} (+15%)`)
  steps.push(`FOB: $${baseCost.fob} → $${newFob}`)
  steps.push(`CM: $${baseCost.cm} (değişmedi)`)
  steps.push(`Karlılık: %${baseProfit.profitMargin} → %${newMargin}`)

  gaps.push({ category: 'PLANNING', item: 'Cost Engine raw material price index entegrasyonu yok', severity: 'HIGH' })
  gaps.push({ category: 'DOMAIN', item: 'Commodity price shock domain event tanımlı değil', severity: 'MEDIUM' })

  const brain = runBrainRecommendation({ userId: 'user-ceo-001', sessionId: 'val-s8', focusArea: 'GENERAL' })

  return {
    scenarioId: 8,
    title: 'Pamuk Fiyatı %15 Arttı',
    status: 'PARTIAL',
    domainServicesUsed: ['Cost Engine', 'Brain Recommendation', 'Alternative Engine'],
    businessRulesTriggered: [],
    planningOutput: { baseFob: baseCost.fob, newFob, baseMargin: baseProfit.profitMargin, newMargin, cm: baseCost.cm },
    recommendations: brain.recommendations?.map((r) => r.title) ?? ['Maliyet revizyonu', 'FOB müzakere', 'Alternatif kumaş'],
    gaps,
    steps,
  }
}

/** SENARYO 9 — Fason depoda 150m kumaş kaldı */
function validateScenario9(): ScenarioValidationResult {
  const steps: string[] = []
  const gaps: ValidationGap[] = []
  const remaining = getDemoWorkshopRemaining()
  const expectedRemaining = DEMO_EXPECTED.remainingInWorkshop
  const sourceWarehouse = 'FSN-A'

  steps.push(`Fason depo kalan: ${remaining}m (senaryo: ~150m, demo: ${expectedRemaining}m)`)

  const analysis = analyzeLeftoverFabric(remaining, 'sc-1', sourceWarehouse)
  steps.push(`Leftover aday sipariş: ${analysis.candidateCount}`)
  if (analysis.bestTarget) {
    steps.push(`En iyi hedef: ${analysis.bestTarget.orderNo} — ${analysis.bestTarget.recommendation}`)
  }
  steps.push(`Havuz iade seçeneği: ${analysis.poolReturnOption.recommendation}`)

  const ledgerCopy = structuredClone(DEMO_STOCK_LEDGER)
  const reuseScenario = executeLeftoverReuseScenario(ledgerCopy, remaining, 'sc-1', sourceWarehouse)
  steps.push(`BR-12 Leftover Reuse: ${reuseScenario.result.success ? 'OK' : 'FAIL'}`)

  const validOrderIds = analysis.allocations
    .filter((a) => a.viability !== 'POOL_RETURN' && a.orderId !== 'pool')
    .slice(0, 5)
    .map((a) => a.orderId)
  const deps = buildDependencyGraph(validOrderIds.length > 0 ? validOrderIds : undefined)
  steps.push(`Dependency graph edges: ${deps.edges.length}`)

  const brainRecs = getLeftoverBrainRecommendations(analysis)
  steps.push(`Brain önerileri: ${brainRecs.length}`)

  if (analysis.allocations.filter((a) => a.viability !== 'POOL_RETURN').length === 0) {
    gaps.push({ category: 'DOMAIN', item: 'Leftover allocation adayı bulunamadı', severity: 'HIGH' })
  }
  if (!reuseScenario.result.success) {
    gaps.push({ category: 'BUSINESS_RULE', item: 'BR-12-LEFTOVER-REUSE çalışmadı', severity: 'HIGH' })
  }
  if (!analysis.bestTarget && !analysis.poolReturnOption) {
    gaps.push({ category: 'PLANNING', item: 'Leftover allocation planı üretilemedi', severity: 'HIGH' })
  }

  const status: ScenarioValidationResult['status'] =
    gaps.filter((g) => g.severity === 'HIGH').length === 0 ? 'PASS' : 'PARTIAL'

  return {
    scenarioId: 9,
    title: 'Fason Depoda 150m Kumaş — Başka Siparişte Kullanım',
    status,
    domainServicesUsed: [
      'Leftover Fabric Service',
      'Stock Ledger',
      'Business Rule Engine BR-12',
      'Dependency Engine',
      'Brain',
    ],
    businessRulesTriggered: reuseScenario.result.success ? ['BR-07-WORKSHOP-REMAINING', 'BR-12-LEFTOVER-REUSE'] : ['BR-07-WORKSHOP-REMAINING'],
    planningOutput: {
      remainingMeters: remaining,
      candidateCount: analysis.candidateCount,
      bestTarget: analysis.bestTarget?.orderNo,
      coveragePercent: analysis.bestTarget?.coveragePercent,
    },
    stockLedgerSummary: {
      remainingMeters: remaining,
      transferredMeters: reuseScenario.target.allocatedMeters,
      targetOrder: reuseScenario.target.orderNo,
    },
    brainAnalysis: { recommendations: brainRecs },
    twinAnalysis: { dependencyEdges: deps.edges.length, sharedResources: deps.sharedResources.length },
    recommendations: brainRecs,
    gaps,
    steps,
  }
}

/** SENARYO 10 — Sipariş 3 atölyeye bölündü */
function validateScenario10(): ScenarioValidationResult {
  const steps: string[] = []
  const gaps: ValidationGap[] = []
  const order = SALES_ORDERS[0]
  const product = getProductById(order.productCardId)!
  const splitIntegrity = validateSplitIntegrity(order)
  const splitPlan = planSplitCapacity(order)

  steps.push(`Split model: ${order.isSplit ? 'OK' : 'YOK'}, child UE: ${order.productionSplits?.length ?? 0}`)
  order.productionSplits?.forEach((s) => {
    steps.push(`  ${s.workshopCode}: ${s.plannedQty} adet — ${s.workOrderNo}`)
  })
  steps.push(`Kapasite dağılımı: fullyAllocated=${splitPlan.fullyAllocated}, splitCount=${splitPlan.splitCount}`)

  const splitScenario = executeSplitProductionScenario(order, product.bom)
  steps.push(`BR-11 Split: ${splitScenario.success ? 'OK' : 'FAIL'} (${splitScenario.results[2]?.movements.length ?? 0} hareket)`)

  const ctx = brainCtx('val-s10', order.id)
  const snapshot = knowledgeLayer.assembleSnapshot(ctx)
  const twin = runDigitalTwinIntelligence(ctx, snapshot)
  const planning = runPlanningEngineForOrder(order)
  const timelineEvents = getOrderTimeline(order.id).filter((e) => e.eventType === 'ProductionSplit')

  const splitProdNodes = twin.factoryGraph.nodes.filter(
    (n) => n.type === 'PRODUCTION_ORDER' && n.attributes.splitIndex,
  )
  const splitEdges = twin.factoryGraph.edges.filter((e) => e.relationship === 'SPLIT_FROM')

  steps.push(`Twin split nodes: ${splitProdNodes.length}, SPLIT_FROM edges: ${splitEdges.length}`)
  steps.push(`Timeline ProductionSplit events: ${timelineEvents.length}`)
  steps.push(`Brain önerileri: ${getSplitBrainRecommendations(order).length}`)

  if (!splitIntegrity.valid) {
    splitIntegrity.errors.forEach((e) => gaps.push({ category: 'DOMAIN', item: e, severity: 'HIGH' }))
  }
  if (!splitPlan.fullyAllocated || splitPlan.splitCount !== 3) {
    gaps.push({ category: 'PLANNING', item: 'Multi-workshop split planning eksik', severity: 'HIGH' })
  }
  if (!splitScenario.success) {
    gaps.push({ category: 'BUSINESS_RULE', item: 'BR-11-PRODUCTION-SPLIT çalışmadı', severity: 'HIGH' })
  }
  if (splitProdNodes.length < 3) {
    gaps.push({ category: 'AI', item: 'Digital Twin split-order graph yetersiz', severity: 'HIGH' })
  }
  if (timelineEvents.length < 3) {
    gaps.push({ category: 'DOMAIN', item: 'Split timeline events eksik', severity: 'MEDIUM' })
  }

  const status: ScenarioValidationResult['status'] =
    gaps.filter((g) => g.severity === 'HIGH').length === 0 ? 'PASS' : gaps.length === 0 ? 'PASS' : 'PARTIAL'

  return {
    scenarioId: 10,
    title: 'Sipariş 3 Atölyeye Bölündü',
    status,
    domainServicesUsed: [
      'Production Split Service',
      'Business Rule Engine BR-11',
      'Planning Engine',
      'Stock Ledger',
      'Digital Twin',
      'Timeline',
      'Brain Knowledge',
    ],
    businessRulesTriggered: splitScenario.success ? ['BR-01-ORDER-MRP-PR', 'BR-02-PO-RECEIPT', 'BR-11-PRODUCTION-SPLIT'] : [],
    planningOutput: {
      splitCapacity: splitPlan,
      fullyAllocated: planning.splitCapacity?.fullyAllocated,
      workshops: order.productionSplits?.map((s) => s.workshopCode),
    },
    stockLedgerSummary: {
      splitMovements: splitScenario.results[2]?.movements.length ?? 0,
      workshops: order.productionSplits?.map((s) => ({ code: s.workshopCode, qty: s.plannedQty })),
    },
    twinAnalysis: {
      splitNodes: splitProdNodes.length,
      splitEdges: splitEdges.length,
      nodeCount: twin.factoryGraph.nodeCount,
    },
    brainAnalysis: { recommendations: getSplitBrainRecommendations(order) },
    recommendations: getSplitBrainRecommendations(order),
    gaps,
    steps,
  }
}

export function runAllTextileValidations(): ScenarioValidationResult[] {
  return [
    validateScenario1(),
    validateScenario2(),
    validateScenario3(),
    validateScenario4(),
    validateScenario5(),
    validateScenario6(),
    validateScenario7(),
    validateScenario8(),
    validateScenario9(),
    validateScenario10(),
  ]
}

export function summarizeValidation(results: ScenarioValidationResult[]) {
  const pass = results.filter((r) => r.status === 'PASS').length
  const partial = results.filter((r) => r.status === 'PARTIAL').length
  const gap = results.filter((r) => r.status === 'GAP').length
  const allGaps = results.flatMap((r) => r.gaps)
  const gapsByCategory = allGaps.reduce(
    (acc, g) => {
      acc[g.category] = (acc[g.category] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )
  return {
    totalScenarios: results.length,
    pass,
    partial,
    gap,
    totalGaps: allGaps.length,
    gapsByCategory,
    businessRuleCount: BUSINESS_RULES.length,
    productCount: PRODUCT_CARDS.length,
    stockCardCount: STOCK_CARDS.length,
  }
}

export const TEXTILE_VALIDATION_RESULTS = runAllTextileValidations()
export const TEXTILE_VALIDATION_SUMMARY = summarizeValidation(TEXTILE_VALIDATION_RESULTS)

assertValidationIntegrity()

function assertValidationIntegrity(): void {
  if (TEXTILE_VALIDATION_RESULTS.length !== 10) {
    throw new Error('VALIDATION: 10 senaryo tamamlanmalı')
  }
}
