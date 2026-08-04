/**
 * PostgreSQL cutover readiness — catalog of ports vs adapter status.
 * Does not activate PG at runtime; memory mode remains default.
 */
import type { IUnitOfWork } from '@/domain/ports/persistence/unit-of-work.port'

export type PostgresAdapterStatus = 'ready' | 'skeleton' | 'stub' | 'missing'

export type PostgresPortReadiness = {
  port: keyof IUnitOfWork | string
  status: PostgresAdapterStatus
  notes: string
}

/** Explicit inventory for cutover planning (Architecture Freeze: no new ports). */
export const POSTGRES_PORT_READINESS: PostgresPortReadiness[] = [
  { port: 'salesOrders', status: 'missing', notes: 'In-memory only; interface complete on IUnitOfWork' },
  { port: 'productCards', status: 'missing', notes: 'In-memory only' },
  { port: 'productionOrders', status: 'missing', notes: 'In-memory only' },
  { port: 'stockLedgers', status: 'missing', notes: 'In-memory only' },
  { port: 'purchaseOrders', status: 'missing', notes: 'In-memory only' },
  { port: 'goodsReceipts', status: 'missing', notes: 'In-memory only' },
  { port: 'packingLists', status: 'skeleton', notes: 'packing-list.postgres.repository.ts present' },
  { port: 'shipments', status: 'missing', notes: 'In-memory only' },
  { port: 'exportDocumentSets', status: 'missing', notes: 'In-memory only' },
  { port: 'exportShipments', status: 'missing', notes: 'In-memory only' },
  { port: 'accountingIntegrations', status: 'missing', notes: 'In-memory only' },
  { port: 'costClosings', status: 'missing', notes: 'In-memory only' },
  { port: 'styleClosings', status: 'missing', notes: 'In-memory only' },
  { port: 'mrpRuns', status: 'missing', notes: 'In-memory only' },
  { port: 'outbox', status: 'skeleton', notes: 'postgres-outbox.repository.ts' },
  { port: 'masterDataLookups', status: 'stub', notes: 'Throws PostgresAdapterNotReadyError' },
  { port: 'auditLog', status: 'stub', notes: 'postgres-audit-log-stream.stub' },
  {
    port: 'collections',
    status: 'stub',
    notes: 'postgres-collection-repository.stub',
  },
]

export type PostgresCutoverReport = {
  defaultBackend: 'memory'
  memoryModeSafe: true
  factoryGuarded: true
  ports: PostgresPortReadiness[]
  readyCount: number
  skeletonCount: number
  stubCount: number
  missingCount: number
  cutoverBlocked: boolean
  summary: string
}

export function getPostgresCutoverReport(): PostgresCutoverReport {
  const ports = POSTGRES_PORT_READINESS
  const readyCount = ports.filter((p) => p.status === 'ready').length
  const skeletonCount = ports.filter((p) => p.status === 'skeleton').length
  const stubCount = ports.filter((p) => p.status === 'stub').length
  const missingCount = ports.filter((p) => p.status === 'missing').length
  const cutoverBlocked = stubCount + missingCount > 0
  return {
    defaultBackend: 'memory',
    memoryModeSafe: true,
    factoryGuarded: true,
    ports,
    readyCount,
    skeletonCount,
    stubCount,
    missingCount,
    cutoverBlocked,
    summary: cutoverBlocked
      ? `Cutover blocked: ${missingCount} missing, ${stubCount} stub, ${skeletonCount} skeleton adapters`
      : 'All ports ready for cutover',
  }
}
