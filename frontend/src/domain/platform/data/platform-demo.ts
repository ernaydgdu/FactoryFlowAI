import { PRODUCT_CARDS } from '../../data/products'
import { SALES_ORDERS } from '../../data/orders'
import { PURCHASE_ORDERS } from '../../data/workflows'
import { employeeRepository } from '../../master-data'
import { logCreate, logUpdate } from '../services/audit-service'
import { recordFromDomainEvent } from '../services/ai-memory-service'
import { approveStep, submitForApproval } from '../services/approval-service'
import { addAttachment } from '../services/attachment-service'
import { addComment } from '../services/comment-service'
import { getDashboardKpis } from '../services/kpi-engine'
import { publishEvent } from '../services/event-bus'
import { wirePlatformServices } from '../services/platform-orchestrator'
import { applyTag } from '../services/tag-service'
import { generateStandardOrderTimeline } from '../services/timeline-service'
import { activateRevision, createRevision, getAllRevisions } from '../services/versioning-service'
import { notifyWatchers, watchEntity } from '../services/watcher-service'

function seedVersioning(): void {
  const product = PRODUCT_CARDS[0]

  const rev1 = createRevision({
    entityType: 'ProductCard',
    entityKey: product.id,
    version: '1.0',
    reasonOfChange: 'İlk onaylı versiyon',
    createdBy: 'Zeynep Arslan',
    status: 'Obsolete',
    payload: { productCode: product.productCode, productName: product.productName },
  })
  rev1.revision.effectiveTo = '2026-01-15'
  rev1.revision.approvedBy = 'Planlama Müdürü'
  rev1.revision.approvedDate = '2025-12-01T00:00:00.000Z'

  const rev2 = createRevision({
    entityType: 'ProductCard',
    entityKey: product.id,
    version: '2.0',
    reasonOfChange: 'BOM güncellendi — kumaş tüketimi revize',
    createdBy: 'Zeynep Arslan',
    status: 'Draft',
    payload: { productCode: product.productCode, productName: product.productName, bomLines: product.bom.length },
  })
  activateRevision({ recordId: rev2.id, approvedBy: 'Üretim Müdürü', effectiveFrom: '2026-01-16' })

  createRevision({
    entityType: 'BOM',
    entityKey: `bom-${product.id}`,
    version: '1.0',
    reasonOfChange: 'İlk BOM',
    createdBy: 'Planlama',
    status: 'Obsolete',
    payload: { lines: 8 },
  })

  const bomRev2 = createRevision({
    entityType: 'BOM',
    entityKey: `bom-${product.id}`,
    version: '2.0',
    reasonOfChange: 'Fit sample sonrası tüketim düzeltmesi',
    createdBy: 'Planlama',
    status: 'Draft',
    payload: { lines: 8, consumptionPerUnit: 1.55 },
  })
  activateRevision({ recordId: bomRev2.id, approvedBy: 'Satın Alma', effectiveFrom: '2026-02-01' })

  createRevision({
    entityType: 'OperationRoute',
    entityKey: `route-${product.id}`,
    version: '1.0',
    reasonOfChange: 'Standart operasyon rotası',
    createdBy: 'Planlama',
    status: 'Active',
    payload: { operations: ['CUT', 'SEW', 'WASH', 'PACK'] },
  })

  createRevision({
    entityType: 'CostSheet',
    entityKey: `cost-${product.id}`,
    version: '1.0',
    reasonOfChange: 'İlk maliyet hesabı',
    createdBy: 'Maliyet',
    status: 'Active',
    payload: { fob: 12.5, cm: 4.2 },
  })

  createRevision({
    entityType: 'SizeSet',
    entityKey: 'ss-tshirt',
    version: '1.0',
    reasonOfChange: 'Standard beden seti',
    createdBy: 'Master Data',
    status: 'Active',
    payload: { sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
  })

  createRevision({
    entityType: 'ColorCard',
    entityKey: 'clr-indigo',
    version: '1.0',
    reasonOfChange: 'Lab dip onaylı renk',
    createdBy: 'Merchandising',
    status: 'Active',
    payload: { pantone: '19-4029 TCX' },
  })

  createRevision({
    entityType: 'ProductionRoute',
    entityKey: `pr-${product.id}`,
    version: '1.0',
    reasonOfChange: 'Üretim rotası tanımı',
    createdBy: 'Üretim',
    status: 'Active',
    payload: { workshop: 'FSN-A', lines: 2 },
  })
}

function seedPlatformDemo(): void {
  wirePlatformServices()
  seedVersioning()

  const planner = employeeRepository.find((e) => e.role === 'Planlayıcı')[0]!
  const auditCtx = { changedBy: planner.name, ip: '10.0.1.42', machine: 'KEPLER-PLT-01' }
  const order = SALES_ORDERS[0]
  const product = PRODUCT_CARDS[0]

  logCreate('SalesOrder', order.id, auditCtx, { orderNo: order.orderNo })
  logUpdate('SalesOrder', order.id, auditCtx, { status: 'Beklemede' }, { status: 'Üretimde' })

  applyTag({ entityType: 'SalesOrder', entityId: order.id, tag: 'VIP', appliedBy: planner.name })
  applyTag({ entityType: 'SalesOrder', entityId: order.id, tag: 'Riskli', appliedBy: planner.name })

  addComment({
    entityType: 'SalesOrder',
    entityId: order.id,
    entityNo: order.orderNo,
    author: planner.name,
    authorRole: 'Planlayıcı',
    body: 'Kumaş gecikecek.',
  })
  addComment({
    entityType: 'SalesOrder',
    entityId: order.id,
    entityNo: order.orderNo,
    author: 'Sarah Mitchell',
    authorRole: 'Buyer',
    body: 'Buyer onayı bekleniyor.',
  })

  addComment({
    entityType: 'PurchaseOrder',
    entityId: PURCHASE_ORDERS[0]?.id ?? 'po-1',
    entityNo: PURCHASE_ORDERS[0]?.poNo ?? 'PO-2026-5000',
    author: 'Satın Alma',
    authorRole: 'Satın Alma Uzmanı',
    body: 'Tedarikçi termin 3 gün gecikme bildirdi.',
  })

  watchEntity({
    entityType: 'SalesOrder',
    entityId: order.id,
    entityNo: order.orderNo,
    userId: 'emp-planner',
    userName: planner.name,
  })

  for (const fileType of ['Teknik Föy', 'Ölçü Tablosu', 'Kalıp PDF', 'Resim', 'Müşteri PO', 'Test Raporu'] as const) {
    addAttachment({
      entityType: 'ProductCard',
      entityId: product.id,
      fileName: `${fileType.replace(/\s/g, '_')}_${product.productCode}.pdf`,
      fileType,
      mimeType: 'application/pdf',
      sizeKb: 120 + fileType.length * 50,
      uploadedBy: planner.name,
    })
  }

  generateStandardOrderTimeline(order.id, order.orderNo, planner.name, {
    OrderOpened: `Sipariş ${order.orderNo} açıldı — ${order.general.customer}`,
    BomCreated: 'BOM v2.0 onaylandı',
    MrpGenerated: 'MRP otomatik oluşturuldu',
    PurchaseCreated: 'Satın alma talepleri oluşturuldu',
    StockReceived: 'Kumaş depoya giriş yapıldı',
    ProductionStarted: 'Kesim emri verildi',
  })

  const bomWorkflow = submitForApproval({
    workflowType: 'BOM',
    entityType: 'BOM',
    entityId: `bom-${product.id}`,
    entityKey: product.id,
    submittedBy: planner.name,
  })
  approveStep(bomWorkflow.id, 'Planlama Müdürü', 'BOM tüketimleri doğrulandı')
  approveStep(bomWorkflow.id, 'Satın Alma', 'Malzeme terminleri uygun')

  const events = [
    publishEvent({
      type: 'OrderCreated',
      aggregateType: 'SalesOrder',
      aggregateId: order.id,
      aggregateNo: order.orderNo,
      payload: { customer: order.general.customer, qty: order.matrixTotals.grandTotal, description: 'Sipariş oluşturuldu' },
      causedBy: planner.name,
      correlationId: order.id,
    }),
    publishEvent({
      type: 'BomApproved',
      aggregateType: 'BOM',
      aggregateId: `bom-${product.id}`,
      payload: { version: '2.0', description: 'BOM onaylandı' },
      causedBy: 'Planlama Müdürü',
      correlationId: order.id,
    }),
    publishEvent({
      type: 'PurchaseCreated',
      aggregateType: 'PurchaseOrder',
      aggregateId: PURCHASE_ORDERS[0]?.id ?? 'po-1',
      aggregateNo: PURCHASE_ORDERS[0]?.poNo ?? 'PO-2026-5000',
      payload: { supplier: PURCHASE_ORDERS[0]?.supplier, description: 'PO oluşturuldu' },
      causedBy: 'Satın Alma',
      correlationId: order.id,
    }),
    publishEvent({
      type: 'StockReceived',
      aggregateType: 'StockMovement',
      aggregateId: 'mov-demo-1',
      payload: { qty: 5000, material: 'KMS-0142', description: 'Kumaş girişi' },
      causedBy: 'Depo',
      correlationId: order.id,
    }),
    publishEvent({
      type: 'ProductionStarted',
      aggregateType: 'ProductionOrder',
      aggregateId: order.production.workOrderNo,
      aggregateNo: order.orderNo,
      payload: { description: 'Üretim emri başlatıldı' },
      causedBy: 'Üretim Müdürü',
      correlationId: order.id,
    }),
  ]

  for (const evt of events) {
    recordFromDomainEvent(evt)
  }

  notifyWatchers('SalesOrder', order.id, order.orderNo, 'Sipariş durumu güncellendi — Üretimde')
}

seedPlatformDemo()

export const PLATFORM_DEMO_KPIS = getDashboardKpis()

export const PLATFORM_DEMO_SUMMARY = {
  revisionCount: getAllRevisions().length,
  activeRevisions: getAllRevisions().filter((r) => r.revision.status === 'Active').length,
  kpiActiveOrders: PLATFORM_DEMO_KPIS.snapshot.activeOrders,
  eventsPublished: 5,
} as const
