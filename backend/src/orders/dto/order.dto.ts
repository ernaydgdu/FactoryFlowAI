import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  orderNo!: string;

  @IsString()
  @IsNotEmpty()
  buyerName!: string;

  @IsString()
  @IsNotEmpty()
  productName!: string;

  @IsNumber()
  @Min(1)
  totalQuantity!: number;

  @IsDateString()
  shipmentDate!: string;

  @IsOptional()
  @IsString()
  status?: string;
}

export class UpdateOrderDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  orderNo?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  buyerName?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  productName?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  totalQuantity?: number;

  @IsOptional()
  @IsDateString()
  shipmentDate?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

export class CreateMaterialDto {
  @IsString()
  @IsNotEmpty()
  materialName!: string;

  @IsString()
  @IsNotEmpty()
  materialType!: string;

  @IsString()
  @IsNotEmpty()
  supplierName!: string;

  @IsNumber()
  @Min(0)
  orderedQuantity!: number;

  @IsOptional()
  @IsDateString()
  orderedDate?: string;

  @IsOptional()
  @IsDateString()
  expectedArrival?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fabricWidth?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fabricWeight?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPrice?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateMaterialDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  materialName?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  supplierName?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  orderedQuantity?: number;

  @IsOptional()
  @IsDateString()
  expectedArrival?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fabricWidth?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fabricWeight?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPrice?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  arrivedQuantity?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class FulfillFromStockDto {
  @IsNumber()
  @Min(0)
  quantity!: number;
}

export class CreateProductionEntryDto {
  @IsString()
  @IsNotEmpty()
  stage!: string;

  @IsNumber()
  @Min(0)
  quantity!: number;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  lineNo?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateQualityEntryDto {
  @IsNumber()
  @Min(0)
  checkedQty!: number;

  @IsNumber()
  @Min(0)
  firstQuality!: number;

  @IsNumber()
  @Min(0)
  secondQuality!: number;

  @IsNumber()
  @Min(0)
  rejected!: number;

  @IsOptional()
  @IsString()
  defectType?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateOrderColorSizeDto {
  @IsString()
  @IsNotEmpty()
  color!: string;

  @IsString()
  @IsNotEmpty()
  size!: string;

  @IsNumber()
  @Min(0)
  quantity!: number;
}

export class CloseOrderDto {
  @IsOptional()
  @IsBoolean()
  force?: boolean;
}

export class UpdateApprovalStageDto {
  @IsOptional()
  @IsIn(['PENDING', 'APPROVED', 'REJECTED'])
  status?: string;

  @IsOptional()
  @IsString()
  approvedBy?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
