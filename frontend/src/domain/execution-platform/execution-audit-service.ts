/**
 * Execution Audit — Platform Audit servisi entegrasyonu
 * Tüm kritik execution işlemleri audit trail üretir.
 */
import { logCreate, logUpdate, logApprove } from '../platform/services/audit-service'
import type { AuditLogEntry } from '../platform/types'

export type ExecutionAuditContext = {
  actor: string
  productionOrderNo: string
  executionContextId?: string
  bundleId?: string
  operationCode?: string
  lineId?: string
  machineId?: string
  shiftCode?: string
  ip?: string
  machine?: string
}

function buildAuditPayload(ctx: ExecutionAuditContext): Record<string, unknown> {
  return {
    productionOrderNo: ctx.productionOrderNo,
    executionContextId: ctx.executionContextId ?? null,
    bundleId: ctx.bundleId ?? null,
    operationCode: ctx.operationCode ?? null,
    lineId: ctx.lineId ?? null,
    machineId: ctx.machineId ?? null,
    shiftCode: ctx.shiftCode ?? null,
  }
}

function toPlatformContext(ctx: ExecutionAuditContext) {
  return {
    changedBy: ctx.actor,
    ip: ctx.ip ?? '0.0.0.0',
    machine: ctx.machine ?? ctx.machineId ?? 'execution-domain',
    description: [
      ctx.productionOrderNo,
      ctx.operationCode,
      ctx.bundleId,
      ctx.lineId,
      ctx.shiftCode,
    ]
      .filter(Boolean)
      .join(' / '),
  }
}

export function logExecutionCreate(
  entityType: string,
  entityId: string,
  ctx: ExecutionAuditContext,
  value: Record<string, unknown>,
): AuditLogEntry {
  return logCreate(entityType, entityId, toPlatformContext(ctx), {
    ...buildAuditPayload(ctx),
    ...value,
  })
}

export function logExecutionUpdate(
  entityType: string,
  entityId: string,
  ctx: ExecutionAuditContext,
  oldValue: Record<string, unknown>,
  newValue: Record<string, unknown>,
): AuditLogEntry {
  return logUpdate(entityType, entityId, toPlatformContext(ctx), oldValue, {
    ...buildAuditPayload(ctx),
    ...newValue,
  })
}

export function logExecutionApprove(
  entityType: string,
  entityId: string,
  ctx: ExecutionAuditContext,
  value: Record<string, unknown>,
): AuditLogEntry {
  return logApprove(entityType, entityId, toPlatformContext(ctx), {
    ...buildAuditPayload(ctx),
    ...value,
  })
}
