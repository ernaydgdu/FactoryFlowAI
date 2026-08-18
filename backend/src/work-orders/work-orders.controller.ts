import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { WorkOrdersService } from './work-orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  CurrentUser,
  type JwtPayloadUser,
} from '../auth/decorators/current-user.decorator';
import {
  CreateWorkOrderDto,
  UpdateWorkOrderDto,
} from '../orders/dto/work-order.dto';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class WorkOrdersController {
  constructor(private workOrdersService: WorkOrdersService) {}

  private scopeFor(user: JwtPayloadUser): string | undefined {
    return user.role === 'ADMIN' ? undefined : user.tenantId;
  }

  @Get('orders/:orderId/work-orders')
  async getWorkOrders(
    @CurrentUser() user: JwtPayloadUser,
    @Param('orderId', ParseIntPipe) orderId: number,
  ) {
    return this.workOrdersService.getWorkOrders(orderId, this.scopeFor(user));
  }

  @Post('orders/:orderId/work-orders')
  @Roles('ADMIN', 'MANAGER', 'PLANNER')
  async createWorkOrder(
    @CurrentUser() user: JwtPayloadUser,
    @Param('orderId', ParseIntPipe) orderId: number,
    @Body() body: CreateWorkOrderDto,
  ) {
    return this.workOrdersService.createWorkOrder(
      orderId,
      body,
      user.tenantId,
      user.email,
    );
  }

  @Get('work-orders/:id')
  async getWorkOrderDetail(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.workOrdersService.getWorkOrderDetail(id, this.scopeFor(user));
  }

  @Patch('work-orders/:id')
  @Roles('ADMIN', 'MANAGER', 'PLANNER')
  async updateWorkOrder(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateWorkOrderDto,
  ) {
    return this.workOrdersService.updateWorkOrder(
      id,
      body,
      this.scopeFor(user),
    );
  }

  @Delete('work-orders/:id')
  @Roles('ADMIN', 'MANAGER')
  async deleteWorkOrder(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.workOrdersService.deleteWorkOrder(id, this.scopeFor(user));
  }

  @Get('work-orders/:id/export')
  async exportWorkOrder(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseIntPipe) id: number,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { csv, workOrderNo } = await this.workOrdersService.exportWorkOrderCsv(
      id,
      this.scopeFor(user),
    );

    const today = new Date().toISOString().slice(0, 10);
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="isemri-${workOrderNo}-${today}.csv"`,
    });
    return csv;
  }
}
