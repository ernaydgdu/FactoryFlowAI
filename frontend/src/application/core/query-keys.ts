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
  mrp: {
    all: ['mrp'] as const,
    list: () => [...applicationQueryKeys.mrp.all, 'list'] as const,
    kpis: () => [...applicationQueryKeys.mrp.all, 'kpis'] as const,
  },
} as const
