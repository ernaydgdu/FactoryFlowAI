import type {
  ApproveStyleClosingInput,
  CreateStyleClosingInput,
  StyleClosingTransitionInput,
} from '@/domain/style-closing/style-closing.types'

export type CreateStyleClosingCommand = CreateStyleClosingInput & { actorUserId: string }

export type StyleClosingTransitionCommand = StyleClosingTransitionInput & { actorUserId: string }

export type ApproveStyleClosingCommand = ApproveStyleClosingInput & { actorUserId: string }
