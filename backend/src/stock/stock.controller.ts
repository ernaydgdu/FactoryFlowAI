import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { StockService } from './stock.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ConsumeStockLotDto, CreateStockLotDto } from './dto/stock.dto';

@Controller('stock')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StockController {
  constructor(private stockService: StockService) {}

  @Get('lots')
  async getLots(@Query('materialType') materialType?: string) {
    return this.stockService.getLots(materialType);
  }

  @Post('lots')
  @Roles('ADMIN', 'MANAGER', 'PLANNER')
  async createLot(@Body() body: CreateStockLotDto) {
    return this.stockService.createLot(body);
  }

  @Post('lots/:id/consume')
  @Roles('ADMIN', 'MANAGER', 'PLANNER', 'SHOP_FLOOR_OPERATOR')
  async consumeLot(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ConsumeStockLotDto,
  ) {
    return this.stockService.consumeLot(id, body);
  }

  @Get('lots/:id/movements')
  async getMovements(@Param('id', ParseIntPipe) id: number) {
    return this.stockService.getMovements(id);
  }

  @Get('fifo-suggestion')
  async getFifoSuggestion(
    @Query('materialName') materialName?: string,
    @Query('neededQty') neededQtyRaw?: string,
  ) {
    const neededQty = parseFloat(neededQtyRaw ?? '');
    if (!materialName || Number.isNaN(neededQty) || neededQty <= 0) {
      throw new BadRequestException(
        "materialName ve geçerli (0'dan büyük) bir neededQty parametresi gereklidir.",
      );
    }

    return this.stockService.getFifoSuggestion(materialName, neededQty);
  }
}
