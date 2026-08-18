import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { platformCommandRegistry } from './command.registry';
import type {
  PlatformCommandRequestBody,
  PlatformCommandResultBody,
  RequestContext,
} from '../platform.types';

type RequestWithContext = Request & { requestContext?: RequestContext };

@Controller('platform/commands')
export class PlatformCommandsController {
  @Get()
  @UseGuards(JwtAuthGuard)
  listCommands(): { commands: string[] } {
    return { commands: platformCommandRegistry.list() };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async execute(
    @Req() req: RequestWithContext,
    @Body() body: PlatformCommandRequestBody,
  ): Promise<PlatformCommandResultBody> {
    const ctx = req.requestContext;
    if (!ctx) {
      return {
        commandKey: body.commandKey,
        success: false,
        error: 'Request context missing',
        executedAt: new Date().toISOString(),
      };
    }
    return platformCommandRegistry.execute(body.commandKey, ctx, body.payload);
  }
}
