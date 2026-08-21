import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateStockLotDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsString()
  @IsNotEmpty()
  materialName!: string;

  @IsString()
  @IsNotEmpty()
  materialType!: string;

  @IsString()
  @IsNotEmpty()
  supplierName!: string;

  @IsOptional()
  @IsString()
  lotNo?: string;

  @IsNumber()
  @Min(0)
  receivedQty!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPrice?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsDateString()
  receivedDate?: string;

  @IsOptional()
  @IsInt()
  orderId?: number;

  @IsOptional()
  @IsInt()
  warehouseId?: number;
}

export class ConsumeStockLotDto {
  @IsNumber()
  @Min(0)
  quantity!: number;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsInt()
  orderId?: number;
}

export class TransferStockDto {
  @IsInt()
  fromLotId!: number;

  @IsInt()
  toWarehouseId!: number;

  @IsNumber()
  @Min(0)
  quantity!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
