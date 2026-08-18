import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { UsersModule } from '../users/users.module';
import { PlatformController } from './platform.controller';
import { PlatformCommandsController } from './commands/platform-commands.controller';
import { PlatformCommandBootstrap } from './commands/platform-command.bootstrap';
import { TenantContextMiddleware } from './middleware/tenant-context.middleware';

@Module({
  imports: [
    UsersModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET')!,
      }),
    }),
  ],
  controllers: [PlatformController, PlatformCommandsController],
  providers: [TenantContextMiddleware, PlatformCommandBootstrap],
})
export class PlatformModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(TenantContextMiddleware)
      .forRoutes(
        { path: 'platform/context', method: RequestMethod.GET },
        { path: 'platform/commands', method: RequestMethod.ALL },
        { path: 'users', method: RequestMethod.ALL },
      );
  }
}
