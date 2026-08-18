import type {
  RequestContext,
  PlatformCommandResultBody,
} from '../platform.types';

export type CommandHandler = (
  ctx: RequestContext,
  payload: Record<string, unknown> | undefined,
) => Promise<PlatformCommandResultBody> | PlatformCommandResultBody;

function ok(commandKey: string, data: unknown): PlatformCommandResultBody {
  return {
    commandKey,
    success: true,
    data,
    executedAt: new Date().toISOString(),
  };
}

function fail(commandKey: string, error: string): PlatformCommandResultBody {
  return {
    commandKey,
    success: false,
    error,
    executedAt: new Date().toISOString(),
  };
}

export class PlatformCommandRegistry {
  private readonly handlers = new Map<string, CommandHandler>();

  register(commandKey: string, handler: CommandHandler): void {
    this.handlers.set(commandKey, handler);
  }

  list(): string[] {
    return [...this.handlers.keys()].sort();
  }

  async execute(
    commandKey: string,
    ctx: RequestContext,
    payload?: Record<string, unknown>,
  ): Promise<PlatformCommandResultBody> {
    const handler = this.handlers.get(commandKey);
    if (!handler) {
      return fail(commandKey, `Bilinmeyen komut: ${commandKey}`);
    }
    try {
      return await handler(ctx, payload);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Komut yürütme hatası';
      return fail(commandKey, message);
    }
  }
}

export const platformCommandRegistry = new PlatformCommandRegistry();

platformCommandRegistry.register('platform.ping', () =>
  ok('platform.ping', {
    message: 'pong',
    runtime: 'remote',
    persistence: 'postgres',
  }),
);

platformCommandRegistry.register('platform.getContext', (ctx) =>
  ok('platform.getContext', {
    tenantId: ctx.tenantId,
    factoryId: ctx.factoryId,
    userId: String(ctx.userId),
    userEmail: ctx.email,
    role: ctx.role,
  }),
);
