import type { PlatformCommandRequest, PlatformCommandResult } from '@/domain/platform/tenant/types'

export type PlatformCommandHandler = (
  payload: Record<string, unknown> | undefined,
) => PlatformCommandResult | Promise<PlatformCommandResult>

export interface IPlatformCommandGateway {
  execute<T = unknown>(request: PlatformCommandRequest): Promise<PlatformCommandResult<T>>
  listCommands(): Promise<string[]>
}
