import type {
  AccountingSourceEventType,
  CloseFinancialPeriodInput,
  EnqueueOperationalEventsInput,
  PostBatchInput,
  ReverseBatchInput,
  UpsertGlMappingInput,
} from '@/domain/finance-integration/finance-integration.types'

export type EnqueueOperationalEventsCommand = EnqueueOperationalEventsInput & {
  actorUserId: string
}

export type PostBatchCommand = PostBatchInput & { actorUserId: string }

export type ReverseBatchCommand = ReverseBatchInput & { actorUserId: string }

export type UpsertGlMappingCommand = UpsertGlMappingInput & { actorUserId: string }

export type CloseFinancialPeriodCommand = CloseFinancialPeriodInput & {
  actorUserId: string
}

export type { AccountingSourceEventType }
