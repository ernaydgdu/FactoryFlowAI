import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { RequestContext } from './platform.types';

type RequestWithContext = Request & { requestContext?: RequestContext };

@Controller('platform')
export class PlatformController {
  @Get('health')
  health() {
    return {
      status: 'ok',
      runtime: 'remote',
      persistence: 'postgres',
      apiReachable: true,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('context')
  @UseGuards(JwtAuthGuard)
  getContext(@Req() req: RequestWithContext) {
    const ctx = req.requestContext;
    return {
      tenantId: ctx?.tenantId ?? 'kepler-default',
      factoryId: ctx?.factoryId ?? 'factory-ist-001',
      userId: ctx ? String(ctx.userId) : null,
      userEmail: ctx?.email ?? null,
      role: ctx?.role ?? null,
    };
  }
}
