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
