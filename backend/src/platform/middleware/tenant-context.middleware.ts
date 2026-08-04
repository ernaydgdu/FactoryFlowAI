import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';

import type { RequestContext } from '../platform.types';
import { DEFAULT_TENANT_ID } from '../platform.types';

type JwtClaims = {
  sub: number;
  email: string;
  role: string;
  factoryId?: string;
  tenantId?: string;
};

type RequestWithContext = Request & { requestContext?: RequestContext };

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(private readonly jwtService: JwtService) {}

  use(req: RequestWithContext, _res: Response, next: NextFunction): void {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return next();
    }

    const token = header.slice('Bearer '.length);
    try {
      const payload = this.jwtService.verify<JwtClaims>(token);
      req.requestContext = {
        tenantId: payload.tenantId ?? DEFAULT_TENANT_ID,
        factoryId: payload.factoryId ?? 'factory-ist-001',
        userId: payload.sub,
        email: payload.email,
        role: payload.role,
      };
    } catch {
      throw new UnauthorizedException('Invalid token');
    }

    next();
  }
}
