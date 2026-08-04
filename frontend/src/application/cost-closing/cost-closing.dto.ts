import type {
  ApproveCostClosingInput,
  CostClosingTransitionInput,
  CreateCostClosingInput,
} from '@/domain/cost-closing/cost-closing.types'

export type CreateCostClosingCommand = CreateCostClosingInput & { actorUserId: string }

export type CostClosingTransitionCommand = CostClosingTransitionInput & { actorUserId: string }

export type ApproveCostClosingCommand = ApproveCostClosingInput & { actorUserId: string }
