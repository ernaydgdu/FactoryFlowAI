import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ProductionLinesService } from './production-lines.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  CurrentUser,
  type JwtPayloadUser,
} from '../auth/decorators/current-user.decorator';
import { CreateProductionLineDto } from './dto/production-line.dto';

@Controller('production-lines')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductionLinesController {
  constructor(private productionLinesService: ProductionLinesService) {}

  @Get()
  async getLines(
    @CurrentUser() user: JwtPayloadUser,
    @Query('tenantId') tenantId?: string,
  ) {
    const scope = user.role === 'ADMIN' ? tenantId : user.tenantId;
    return this.productionLinesService.getLines(scope);
  }

  @Post()
  @Roles('ADMIN', 'MANAGER')
  async createLine(
    @CurrentUser() user: JwtPayloadUser,
    @Body() body: CreateProductionLineDto,
  ) {
    return this.productionLinesService.createLine(body, user.tenantId);
  }

  @Get('status')
  async getLineStatus(
    @CurrentUser() user: JwtPayloadUser,
    @Query('tenantId') tenantId?: string,
  ) {
    const scope = user.role === 'ADMIN' ? tenantId : user.tenantId;
    return this.productionLinesService.getLineStatus(scope);
  }
}
