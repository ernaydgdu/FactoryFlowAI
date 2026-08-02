import { BRAIN_DISCLAIMERS, FORBIDDEN_OPERATIONS } from '../constants'
import { isOperationAllowed } from '../data/brain-config'
import type { BrainContext, BrainForbiddenOperation, BrainSecurityVerdict } from '../types'
import type { SecurityLayerContract } from '../contracts'

export const securityLayer: SecurityLayerContract = {
  authorize(context: BrainContext): BrainSecurityVerdict {
    const violations: BrainForbiddenOperation[] = []

    if (!isOperationAllowed(context.companyId, context.operationMode)) {
      violations.push('WRITE')
    }

    if (context.tenantId !== context.companyId) {
      violations.push('CROSS_TENANT')
    }

    return {
      allowed: violations.length === 0,
      operationMode: context.operationMode,
      violations,
      tenantScoped: context.tenantId === context.companyId,
      offlineCapable: true,
    }
  },

  assertReadOnly(operation: string): void {
    const forbidden = FORBIDDEN_OPERATIONS.some((f) =>
      operation.toUpperCase().includes(f.replace('_', '')),
    )
    if (forbidden) {
      throw new Error(`BRAIN_SECURITY_VIOLATION: ${operation} is forbidden. ${BRAIN_DISCLAIMERS.NO_LEDGER_WRITE}`)
    }
  },
}

export function enforceBrainReadOnly(): void {
  FORBIDDEN_OPERATIONS.forEach((op) => {
    securityLayer.assertReadOnly(op)
  })
}
