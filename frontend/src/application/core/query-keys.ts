export const applicationQueryKeys = {
  productCard: {
    all: ['product-card'] as const,
    list: () => [...applicationQueryKeys.productCard.all, 'list'] as const,
    detail: (id: string) => [...applicationQueryKeys.productCard.all, 'detail', id] as const,
    kpis: () => [...applicationQueryKeys.productCard.all, 'kpis'] as const,
  },
  salesOrder: {
    all: ['sales-order'] as const,
    list: () => [...applicationQueryKeys.salesOrder.all, 'list'] as const,
    detail: (id: string) => [...applicationQueryKeys.salesOrder.all, 'detail', id] as const,
    kpis: () => [...applicationQueryKeys.salesOrder.all, 'kpis'] as const,
  },
  fabricCard: {
    all: ['fabric-card'] as const,
    list: () => [...applicationQueryKeys.fabricCard.all, 'list'] as const,
    kpis: () => [...applicationQueryKeys.fabricCard.all, 'kpis'] as const,
    stock: () => [...applicationQueryKeys.fabricCard.all, 'stock'] as const,
    movements: () => [...applicationQueryKeys.fabricCard.all, 'movements'] as const,
  },
  accessoryCard: {
    all: ['accessory-card'] as const,
    list: () => [...applicationQueryKeys.accessoryCard.all, 'list'] as const,
    kpis: () => [...applicationQueryKeys.accessoryCard.all, 'kpis'] as const,
    stock: () => [...applicationQueryKeys.accessoryCard.all, 'stock'] as const,
  },
  warehouse: {
    all: ['warehouse'] as const,
    hierarchy: () => [...applicationQueryKeys.warehouse.all, 'hierarchy'] as const,
    inbound: () => [...applicationQueryKeys.warehouse.all, 'inbound'] as const,
    outbound: () => [...applicationQueryKeys.warehouse.all, 'outbound'] as const,
    count: () => [...applicationQueryKeys.warehouse.all, 'count'] as const,
  },
  inventory: {
    all: ['inventory'] as const,
    dashboard: () => [...applicationQueryKeys.inventory.all, 'dashboard'] as const,
    kpis: () => [...applicationQueryKeys.inventory.all, 'kpis'] as const,
    balances: () => [...applicationQueryKeys.inventory.all, 'balances'] as const,
    movements: () => [...applicationQueryKeys.inventory.all, 'movements'] as const,
    inbound: () => [...applicationQueryKeys.inventory.all, 'inbound'] as const,
    outbound: () => [...applicationQueryKeys.inventory.all, 'outbound'] as const,
    transfers: () => [...applicationQueryKeys.inventory.all, 'transfers'] as const,
    reservations: () => [...applicationQueryKeys.inventory.all, 'reservations'] as const,
    cycleCounts: () => [...applicationQueryKeys.inventory.all, 'cycle-counts'] as const,
    warehouses: () => [...applicationQueryKeys.inventory.all, 'warehouses'] as const,
    goodsReceipts: () => [...applicationQueryKeys.inventory.all, 'goods-receipts'] as const,
  },
  warehouseManagement: {
    all: ['warehouse-management'] as const,
    summaryList: () => [...applicationQueryKeys.warehouseManagement.all, 'summary-list'] as const,
    detail: (code: string) => [...applicationQueryKeys.warehouseManagement.all, 'detail', code] as const,
    finishedGoodsWarehouses: () =>
      [...applicationQueryKeys.warehouseManagement.all, 'fg-warehouses'] as const,
  },
  barcodeMobile: {
    all: ['barcode-mobile'] as const,
    dashboard: () => [...applicationQueryKeys.barcodeMobile.all, 'dashboard'] as const,
    offlineQueue: () => [...applicationQueryKeys.barcodeMobile.all, 'offline-queue'] as const,
  },
  packaging: {
    all: ['packaging'] as const,
    dashboard: () => [...applicationQueryKeys.packaging.all, 'dashboard'] as const,
    lists: () => [...applicationQueryKeys.packaging.all, 'lists'] as const,
    detail: (id: string) => [...applicationQueryKeys.packaging.all, 'detail', id] as const,
    brain: (salesOrderId?: string) =>
      [...applicationQueryKeys.packaging.all, 'brain', salesOrderId ?? 'all'] as const,
    pdf: (id: string) => [...applicationQueryKeys.packaging.all, 'pdf', id] as const,
  },
  shipment: {
    all: ['shipment'] as const,
    dashboard: () => [...applicationQueryKeys.shipment.all, 'dashboard'] as const,
    lists: () => [...applicationQueryKeys.shipment.all, 'lists'] as const,
    detail: (id: string) => [...applicationQueryKeys.shipment.all, 'detail', id] as const,
  },
  commercialDocuments: {
    all: ['commercial-documents'] as const,
    dashboard: () => [...applicationQueryKeys.commercialDocuments.all, 'dashboard'] as const,
    invoices: () => [...applicationQueryKeys.commercialDocuments.all, 'invoices'] as const,
    sets: () => [...applicationQueryKeys.commercialDocuments.all, 'sets'] as const,
    detail: (id: string) => [...applicationQueryKeys.commercialDocuments.all, 'detail', id] as const,
    brain: () => [...applicationQueryKeys.commercialDocuments.all, 'brain'] as const,
    aiValidation: (id: string) =>
      [...applicationQueryKeys.commercialDocuments.all, 'ai-validation', id] as const,
  },
  exportLogistics: {
    all: ['export-logistics'] as const,
    dashboard: () => [...applicationQueryKeys.exportLogistics.all, 'dashboard'] as const,
    lists: () => [...applicationQueryKeys.exportLogistics.all, 'lists'] as const,
    detail: (id: string) => [...applicationQueryKeys.exportLogistics.all, 'detail', id] as const,
    brain: () => [...applicationQueryKeys.exportLogistics.all, 'brain'] as const,
  },
  financeIntegration: {
    all: ['finance-integration'] as const,
    dashboard: () => [...applicationQueryKeys.financeIntegration.all, 'dashboard'] as const,
    batches: () => [...applicationQueryKeys.financeIntegration.all, 'batches'] as const,
    detail: (id: string) => [...applicationQueryKeys.financeIntegration.all, 'detail', id] as const,
    queue: () => [...applicationQueryKeys.financeIntegration.all, 'queue'] as const,
    failed: () => [...applicationQueryKeys.financeIntegration.all, 'failed'] as const,
    results: () => [...applicationQueryKeys.financeIntegration.all, 'results'] as const,
    mappings: () => [...applicationQueryKeys.financeIntegration.all, 'mappings'] as const,
    periods: () => [...applicationQueryKeys.financeIntegration.all, 'periods'] as const,
    brain: () => [...applicationQueryKeys.financeIntegration.all, 'brain'] as const,
  },
  costClosing: {
    all: ['cost-closing'] as const,
    dashboard: () => [...applicationQueryKeys.costClosing.all, 'dashboard'] as const,
    lists: () => [...applicationQueryKeys.costClosing.all, 'lists'] as const,
    detail: (id: string) => [...applicationQueryKeys.costClosing.all, 'detail', id] as const,
    history: () => [...applicationQueryKeys.costClosing.all, 'history'] as const,
    brain: () => [...applicationQueryKeys.costClosing.all, 'brain'] as const,
  },
  quality: {
    all: ['quality-management'] as const,
    dashboard: () => [...applicationQueryKeys.quality.all, 'dashboard'] as const,
    inspections: () => [...applicationQueryKeys.quality.all, 'inspections'] as const,
    reworkQueue: () => [...applicationQueryKeys.quality.all, 'rework-queue'] as const,
    holdQueue: () => [...applicationQueryKeys.quality.all, 'hold-queue'] as const,
    plan: () => [...applicationQueryKeys.quality.all, 'plan'] as const,
    ncrDetail: (id: string) => [...applicationQueryKeys.quality.all, 'ncr', id] as const,
    timeline: (po: string) => [...applicationQueryKeys.quality.all, 'timeline', po] as const,
  },
  shopFloor: {
    all: ['shop-floor'] as const,
    contexts: () => [...applicationQueryKeys.shopFloor.all, 'contexts'] as const,
    operations: (po: string) => [...applicationQueryKeys.shopFloor.all, 'operations', po] as const,
    sessions: (po: string) => [...applicationQueryKeys.shopFloor.all, 'sessions', po] as const,
    machines: () => [...applicationQueryKeys.shopFloor.all, 'machines'] as const,
    labor: () => [...applicationQueryKeys.shopFloor.all, 'labor'] as const,
    progress: () => [...applicationQueryKeys.shopFloor.all, 'progress'] as const,
    workstation: (machineId: string) =>
      [...applicationQueryKeys.shopFloor.all, 'workstation', machineId] as const,
    options: () => [...applicationQueryKeys.shopFloor.all, 'options'] as const,
    bundles: (po: string) => [...applicationQueryKeys.shopFloor.all, 'bundles', po] as const,
    timeline: (po: string) => [...applicationQueryKeys.shopFloor.all, 'timeline', po] as const,
  },
  productionPlanning: {
    all: ['production-planning-scheduling'] as const,
    scheduleBoard: (mode: string) =>
      [...applicationQueryKeys.productionPlanning.all, 'schedule-board', mode] as const,
    capacityView: (mode: string) =>
      [...applicationQueryKeys.productionPlanning.all, 'capacity-view', mode] as const,
    lineLoad: (mode: string) =>
      [...applicationQueryKeys.productionPlanning.all, 'line-load', mode] as const,
  },
  productionOrder: {
    all: ['production-order'] as const,
    list: () => [...applicationQueryKeys.productionOrder.all, 'list'] as const,
    lines: () => [...applicationQueryKeys.productionOrder.all, 'lines'] as const,
    operations: () => [...applicationQueryKeys.productionOrder.all, 'operations'] as const,
  },
  bomDesigner: {
    all: ['bom-designer'] as const,
    byProduct: (productId: string) => [...applicationQueryKeys.bomDesigner.all, productId] as const,
  },
  costSheetDesigner: {
    all: ['cost-sheet-designer'] as const,
    byProduct: (productId: string) => [...applicationQueryKeys.costSheetDesigner.all, productId] as const,
  },
  mrp: {
    all: ['mrp'] as const,
    dashboard: () => [...applicationQueryKeys.mrp.all, 'dashboard'] as const,
    list: () => [...applicationQueryKeys.mrp.all, 'list'] as const,
    kpis: () => [...applicationQueryKeys.mrp.all, 'kpis'] as const,
    shortages: () => [...applicationQueryKeys.mrp.all, 'shortages'] as const,
  },
  purchasing: {
    all: ['purchasing'] as const,
    dashboard: () => [...applicationQueryKeys.purchasing.all, 'dashboard'] as const,
    kpis: () => [...applicationQueryKeys.purchasing.all, 'kpis'] as const,
    purchaseRequests: () => [...applicationQueryKeys.purchasing.all, 'purchase-requests'] as const,
    purchaseOrders: () => [...applicationQueryKeys.purchasing.all, 'purchase-orders'] as const,
    purchaseOrderDetail: (id: string) =>
      [...applicationQueryKeys.purchasing.all, 'purchase-order', id] as const,
    rfqs: () => [...applicationQueryKeys.purchasing.all, 'rfqs'] as const,
    quotationCompare: (rfqId: string) =>
      [...applicationQueryKeys.purchasing.all, 'quotation-compare', rfqId] as const,
  },
  iam: {
    all: ['iam'] as const,
    list: (factoryId?: string) =>
      [...applicationQueryKeys.iam.all, 'list', factoryId ?? 'all'] as const,
    detail: (id: string) => [...applicationQueryKeys.iam.all, 'detail', id] as const,
  },
  platform: {
    all: ['platform'] as const,
    health: () => [...applicationQueryKeys.platform.all, 'health'] as const,
    context: () => [...applicationQueryKeys.platform.all, 'context'] as const,
    commands: () => [...applicationQueryKeys.platform.all, 'commands'] as const,
  },
  masterData: {
    all: ['master-data'] as const,
    list: (entityKey: string) => [...applicationQueryKeys.masterData.all, 'list', entityKey] as const,
    detail: (entityKey: string, id: string) =>
      [...applicationQueryKeys.masterData.all, 'detail', entityKey, id] as const,
    references: (refKey: string) =>
      [...applicationQueryKeys.masterData.all, 'references', refKey] as const,
  },
} as const
