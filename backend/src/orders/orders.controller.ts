import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  CurrentUser,
  type JwtPayloadUser,
} from '../auth/decorators/current-user.decorator';
import {
  CloseOrderDto,
  CreateMaterialDto,
  CreateOrderColorSizeDto,
  CreateOrderDto,
  CreateProductionEntryDto,
  CreateQualityEntryDto,
  FulfillFromStockDto,
  UpdateApprovalStageDto,
  UpdateMaterialDto,
  UpdateOrderDto,
} from './dto/order.dto';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  // ADMIN görür tüm tenant'ları (scope=undefined); diğer roller sadece kendi tenant'ına
  // sahip kayıtlara erişebilir. Alt-kaynak (materials/production/quality/...) uç noktaları
  // bu scope'u orders.service.ts'e ileterek her sorguda tenant filtresi uygular.
  private scopeFor(user: JwtPayloadUser): string | undefined {
    return user.role === 'ADMIN' ? undefined : user.tenantId;
  }

  @Get()
  async getOrders(
    @CurrentUser() user: JwtPayloadUser,
    @Query('tenantId') tenantId?: string,
  ) {
    const scope = user.role === 'ADMIN' ? tenantId : user.tenantId;
    return this.ordersService.getOrders(scope);
  }

  @Post()
  @Roles('ADMIN', 'MANAGER', 'PLANNER')
  async createOrder(
    @CurrentUser() user: JwtPayloadUser,
    @Body() body: CreateOrderDto,
  ) {
    return this.ordersService.createOrder(body, user.tenantId);
  }

  @Get('export')
  async exportOrders(
    @CurrentUser() user: JwtPayloadUser,
    @Query('tenantId') tenantId: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    const scope = user.role === 'ADMIN' ? tenantId : user.tenantId;
    const csv = await this.ordersService.exportOrdersCsv(scope);

    const today = new Date().toISOString().slice(0, 10);
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="siparis-raporu-${today}.csv"`,
    });
    return csv;
  }

  @Get(':id')
  async getOrder(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.ordersService.getOrderById(id, this.scopeFor(user));
  }

  @Patch(':id')
  @Roles('ADMIN', 'MANAGER', 'PLANNER')
  async updateOrder(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateOrderDto,
  ) {
    return this.ordersService.updateOrder(id, body, this.scopeFor(user));
  }

  @Delete(':id')
  @Roles('ADMIN', 'MANAGER')
  async deleteOrder(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.ordersService.deleteOrder(id, this.scopeFor(user));
  }

  @Get(':id/ai-suggestion')
  async getAiSuggestion(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.ordersService.getAiSuggestion(id, this.scopeFor(user));
  }

  @Get(':id/forecast')
  async getForecast(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.ordersService.getCompletionForecast(id, this.scopeFor(user));
  }

  @Get(':id/materials')
  async getMaterials(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.ordersService.getMaterials(id, this.scopeFor(user));
  }

  @Post(':id/materials')
  @Roles('ADMIN', 'MANAGER', 'PLANNER')
  async addMaterial(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CreateMaterialDto,
  ) {
    return this.ordersService.addMaterial(id, body, this.scopeFor(user));
  }

  @Patch(':id/materials/:materialId')
  @Roles('ADMIN', 'MANAGER', 'PLANNER', 'SHOP_FLOOR_OPERATOR')
  async updateMaterial(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseIntPipe) id: number,
    @Param('materialId', ParseIntPipe) materialId: number,
    @Body() body: UpdateMaterialDto,
  ) {
    return this.ordersService.updateMaterial(
      id,
      materialId,
      body,
      this.scopeFor(user),
    );
  }

  @Get(':id/materials/:materialId/stock-availability')
  async getMaterialStockAvailability(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseIntPipe) id: number,
    @Param('materialId', ParseIntPipe) materialId: number,
  ) {
    return this.ordersService.getMaterialStockAvailability(
      id,
      materialId,
      this.scopeFor(user),
    );
  }

  @Post(':id/materials/:materialId/fulfill-from-stock')
  @Roles('ADMIN', 'MANAGER', 'PLANNER')
  async fulfillMaterialFromStock(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseIntPipe) id: number,
    @Param('materialId', ParseIntPipe) materialId: number,
    @Body() body: FulfillFromStockDto,
  ) {
    return this.ordersService.fulfillMaterialFromStock(
      id,
      materialId,
      body.quantity,
      this.scopeFor(user),
    );
  }

  @Delete(':id/materials/:materialId')
  @Roles('ADMIN', 'MANAGER', 'PLANNER')
  async deleteMaterial(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseIntPipe) id: number,
    @Param('materialId', ParseIntPipe) materialId: number,
  ) {
    return this.ordersService.deleteMaterial(
      id,
      materialId,
      this.scopeFor(user),
    );
  }

  @Get(':id/production')
  async getProductionEntries(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.ordersService.getProductionEntries(id, this.scopeFor(user));
  }

  @Post(':id/production')
  @Roles('ADMIN', 'MANAGER', 'PLANNER', 'SHOP_FLOOR_OPERATOR')
  async addProductionEntry(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CreateProductionEntryDto,
  ) {
    return this.ordersService.addProductionEntry(id, body, this.scopeFor(user));
  }

  @Delete(':id/production/:entryId')
  @Roles('ADMIN', 'MANAGER', 'PLANNER')
  async deleteProductionEntry(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseIntPipe) id: number,
    @Param('entryId', ParseIntPipe) entryId: number,
  ) {
    return this.ordersService.deleteProductionEntry(
      id,
      entryId,
      this.scopeFor(user),
    );
  }

  @Get(':id/quality')
  async getQualityEntries(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.ordersService.getQualityEntries(id, this.scopeFor(user));
  }

  @Post(':id/quality')
  @Roles('ADMIN', 'MANAGER', 'PLANNER', 'SHOP_FLOOR_OPERATOR')
  async addQualityEntry(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CreateQualityEntryDto,
  ) {
    return this.ordersService.addQualityEntry(id, body, this.scopeFor(user));
  }

  @Delete(':id/quality/:entryId')
  @Roles('ADMIN', 'MANAGER', 'PLANNER')
  async deleteQualityEntry(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseIntPipe) id: number,
    @Param('entryId', ParseIntPipe) entryId: number,
  ) {
    return this.ordersService.deleteQualityEntry(
      id,
      entryId,
      this.scopeFor(user),
    );
  }

  @Get(':id/color-sizes')
  async getColorSizes(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.ordersService.getColorSizes(id, this.scopeFor(user));
  }

  @Post(':id/color-sizes')
  @Roles('ADMIN', 'MANAGER', 'PLANNER')
  async upsertColorSize(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CreateOrderColorSizeDto,
  ) {
    return this.ordersService.upsertColorSize(id, body, this.scopeFor(user));
  }

  @Delete(':id/color-sizes/:colorSizeId')
  @Roles('ADMIN', 'MANAGER', 'PLANNER')
  async deleteColorSize(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseIntPipe) id: number,
    @Param('colorSizeId', ParseIntPipe) colorSizeId: number,
  ) {
    return this.ordersService.deleteColorSize(
      id,
      colorSizeId,
      this.scopeFor(user),
    );
  }

  @Get(':id/approval-stages')
  async getApprovalStages(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.ordersService.getApprovalStages(id, this.scopeFor(user));
  }

  @Patch(':id/approval-stages/:stageId')
  @Roles('ADMIN', 'MANAGER', 'PLANNER')
  async updateApprovalStage(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseIntPipe) id: number,
    @Param('stageId', ParseIntPipe) stageId: number,
    @Body() body: UpdateApprovalStageDto,
  ) {
    return this.ordersService.updateApprovalStage(
      id,
      stageId,
      body,
      this.scopeFor(user),
    );
  }

  @Get(':id/closing-summary')
  async getClosingSummary(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.ordersService.getClosingSummary(id, this.scopeFor(user));
  }

  @Post(':id/close')
  @Roles('ADMIN', 'MANAGER', 'PLANNER')
  async closeOrder(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CloseOrderDto,
  ) {
    return this.ordersService.closeOrder(
      id,
      body,
      user.email,
      this.scopeFor(user),
    );
  }

  @Post(':id/reopen')
  @Roles('ADMIN', 'MANAGER')
  async reopenOrder(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.ordersService.reopenOrder(id, this.scopeFor(user));
  }

  @Get(':id/packing-list')
  async getPackingList(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.ordersService.getPackingList(id, this.scopeFor(user));
  }

  @Get(':id/packing-list/export')
  async exportPackingList(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseIntPipe) id: number,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { csv, orderNo } = await this.ordersService.exportPackingListCsv(
      id,
      this.scopeFor(user),
    );

    const today = new Date().toISOString().slice(0, 10);
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="cekilistesi-${orderNo}-${today}.csv"`,
    });
    return csv;
  }
}
