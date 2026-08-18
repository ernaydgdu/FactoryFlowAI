import { Injectable, OnModuleInit } from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import { platformCommandRegistry } from './command.registry';

@Injectable()
export class PlatformCommandBootstrap implements OnModuleInit {
  constructor(private readonly usersService: UsersService) {}

  onModuleInit(): void {
    platformCommandRegistry.register('iam.listUsers', async (ctx, payload) => {
      const factoryId =
        typeof payload?.factoryId === 'string'
          ? payload.factoryId
          : ctx.factoryId;
      const users = await this.usersService.getUsers(
        ctx.role === 'ADMIN' ? factoryId : ctx.factoryId,
      );
      return {
        commandKey: 'iam.listUsers',
        success: true,
        data: { users, count: users.length },
        executedAt: new Date().toISOString(),
      };
    });
  }
}
