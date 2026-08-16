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
  UpdateMaterialStatusDto,
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
  async updateMaterialStatus(
    @Param('id', ParseIntPipe) id: number,
    @Param('materialId', ParseIntPipe) materialId: number,
    @Body() body: UpdateMaterialStatusDto,
  ) {
    return this.ordersService.updateMaterialStatus(id, materialId, body);
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
}
