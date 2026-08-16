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
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  CurrentUser,
  type JwtPayloadUser,
} from '../auth/decorators/current-user.decorator';
import type {
  CreateMaterialDto,
  CreateOrderColorSizeDto,
  CreateOrderDto,
  CreateProductionEntryDto,
  CreateQualityEntryDto,
  UpdateApprovalStageDto,
  UpdateMaterialDto,
  UpdateOrderDto,
} from './dto/order.dto';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

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

  @Get(':id')
  async getOrder(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.getOrderById(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'MANAGER', 'PLANNER')
  async updateOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateOrderDto,
  ) {
    return this.ordersService.updateOrder(id, body);
  }

  @Delete(':id')
  @Roles('ADMIN', 'MANAGER')
  async deleteOrder(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.deleteOrder(id);
  }

  @Get(':id/ai-suggestion')
  async getAiSuggestion(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.getAiSuggestion(id);
  }

  @Get(':id/materials')
  async getMaterials(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.getMaterials(id);
  }

  @Post(':id/materials')
  @Roles('ADMIN', 'MANAGER', 'PLANNER')
  async addMaterial(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CreateMaterialDto,
  ) {
    return this.ordersService.addMaterial(id, body);
  }

  @Patch(':id/materials/:materialId')
  @Roles('ADMIN', 'MANAGER', 'PLANNER', 'SHOP_FLOOR_OPERATOR')
  async updateMaterial(
    @Param('id', ParseIntPipe) id: number,
    @Param('materialId', ParseIntPipe) materialId: number,
    @Body() body: UpdateMaterialDto,
  ) {
    return this.ordersService.updateMaterial(id, materialId, body);
  }

  @Delete(':id/materials/:materialId')
  @Roles('ADMIN', 'MANAGER', 'PLANNER')
  async deleteMaterial(
    @Param('id', ParseIntPipe) id: number,
    @Param('materialId', ParseIntPipe) materialId: number,
  ) {
    return this.ordersService.deleteMaterial(id, materialId);
  }

  @Get(':id/production')
  async getProductionEntries(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.getProductionEntries(id);
  }

  @Post(':id/production')
  @Roles('ADMIN', 'MANAGER', 'PLANNER', 'SHOP_FLOOR_OPERATOR')
  async addProductionEntry(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CreateProductionEntryDto,
  ) {
    return this.ordersService.addProductionEntry(id, body);
  }

  @Delete(':id/production/:entryId')
  @Roles('ADMIN', 'MANAGER', 'PLANNER')
  async deleteProductionEntry(
    @Param('id', ParseIntPipe) id: number,
    @Param('entryId', ParseIntPipe) entryId: number,
  ) {
    return this.ordersService.deleteProductionEntry(id, entryId);
  }

  @Get(':id/quality')
  async getQualityEntries(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.getQualityEntries(id);
  }

  @Post(':id/quality')
  @Roles('ADMIN', 'MANAGER', 'PLANNER', 'SHOP_FLOOR_OPERATOR')
  async addQualityEntry(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CreateQualityEntryDto,
  ) {
    return this.ordersService.addQualityEntry(id, body);
  }

  @Delete(':id/quality/:entryId')
  @Roles('ADMIN', 'MANAGER', 'PLANNER')
  async deleteQualityEntry(
    @Param('id', ParseIntPipe) id: number,
    @Param('entryId', ParseIntPipe) entryId: number,
  ) {
    return this.ordersService.deleteQualityEntry(id, entryId);
  }

  @Get(':id/color-sizes')
  async getColorSizes(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.getColorSizes(id);
  }

  @Post(':id/color-sizes')
  @Roles('ADMIN', 'MANAGER', 'PLANNER')
  async upsertColorSize(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CreateOrderColorSizeDto,
  ) {
    return this.ordersService.upsertColorSize(id, body);
  }

  @Delete(':id/color-sizes/:colorSizeId')
  @Roles('ADMIN', 'MANAGER', 'PLANNER')
  async deleteColorSize(
    @Param('id', ParseIntPipe) id: number,
    @Param('colorSizeId', ParseIntPipe) colorSizeId: number,
  ) {
    return this.ordersService.deleteColorSize(id, colorSizeId);
  }

  @Get(':id/approval-stages')
  async getApprovalStages(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.getApprovalStages(id);
  }

  @Patch(':id/approval-stages/:stageId')
  @Roles('ADMIN', 'MANAGER', 'PLANNER')
  async updateApprovalStage(
    @Param('id', ParseIntPipe) id: number,
    @Param('stageId', ParseIntPipe) stageId: number,
    @Body() body: UpdateApprovalStageDto,
  ) {
    return this.ordersService.updateApprovalStage(id, stageId, body);
  }
}
