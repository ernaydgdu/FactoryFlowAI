import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { ShipmentsService } from './shipments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  CurrentUser,
  type JwtPayloadUser,
} from '../auth/decorators/current-user.decorator';
import { CreateShipmentDto } from './dto/shipment.dto';

@Controller('shipments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ShipmentsController {
  constructor(private shipmentsService: ShipmentsService) {}

  private scopeFor(user: JwtPayloadUser): string | undefined {
    return user.role === 'ADMIN' ? undefined : user.tenantId;
  }

  @Get()
  async getShipments(
    @CurrentUser() user: JwtPayloadUser,
    @Query('tenantId') tenantId?: string,
  ) {
    const scope = user.role === 'ADMIN' ? tenantId : user.tenantId;
    return this.shipmentsService.getShipments(scope);
  }

  @Get(':id')
  async getShipmentDetail(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.shipmentsService.getShipmentDetail(id, this.scopeFor(user));
  }

  @Post()
  @Roles('ADMIN', 'MANAGER', 'PLANNER')
  async createShipment(
    @CurrentUser() user: JwtPayloadUser,
    @Body() body: CreateShipmentDto,
  ) {
    return this.shipmentsService.createShipment(
      body,
      user.tenantId,
      user.email,
    );
  }

  @Get(':id/export')
  async exportShipment(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseIntPipe) id: number,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { csv, shipmentNo } = await this.shipmentsService.exportShipmentCsv(
      id,
      this.scopeFor(user),
    );

    const today = new Date().toISOString().slice(0, 10);
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="sevkiyat-${shipmentNo}-${today}.csv"`,
    });
    return csv;
  }

  @Delete(':id')
  @Roles('ADMIN', 'MANAGER')
  async deleteShipment(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.shipmentsService.deleteShipment(id, this.scopeFor(user));
  }
}
