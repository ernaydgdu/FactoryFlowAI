import type { IPlatformCommandGateway } from '@/domain/ports/platform/platform-command.port'
import type { PlatformCommandRequest, PlatformCommandResult } from '@/domain/platform/tenant/types'
import { isRemoteApiRuntime } from '@/infrastructure/api/api-runtime.config'
import {
  listRemoteCommands,
  postPlatformCommand,
} from '@/infrastructure/api/platform-api.client'
import {
  getLocalCommandHandler,
  listLocalCommandKeys,
} from '@/infrastructure/platform/commands/local-command.registry'

export class LocalPlatformCommandGateway implements IPlatformCommandGateway {
  async execute<T = unknown>(request: PlatformCommandRequest): Promise<PlatformCommandResult<T>> {
    const handler = getLocalCommandHandler(request.commandKey)
    if (!handler) {
      return {
        commandKey: request.commandKey,
        success: false,
        error: `Bilinmeyen komut: ${request.commandKey}`,
        executedAt: new Date().toISOString(),
      }
    }
    return handler(request.payload) as PlatformCommandResult<T>
  }

  listCommands(): Promise<string[]> {
    return Promise.resolve(listLocalCommandKeys())
  }
}

export class RemotePlatformCommandGateway implements IPlatformCommandGateway {
  async execute<T = unknown>(request: PlatformCommandRequest): Promise<PlatformCommandResult<T>> {
    return postPlatformCommand<T>(request)
  }

  async listCommands(): Promise<string[]> {
    return listRemoteCommands()
  }
}

let gateway: IPlatformCommandGateway | null = null

export function resolvePlatformCommandGateway(): IPlatformCommandGateway {
  if (!gateway) {
    gateway = isRemoteApiRuntime()
      ? new RemotePlatformCommandGateway()
      : new LocalPlatformCommandGateway()
  }
  return gateway
}

export function resetPlatformCommandGatewayForTests(): void {
  gateway = null
}
