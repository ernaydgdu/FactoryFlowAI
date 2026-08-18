import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
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

  @IsOptional()
  @IsInt()
  @Min(1)
  unitsPerCarton?: number | null;
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

const FASON_OPERATION_TYPES = ['DIKIM', 'YIKAMA', 'NAKIS', 'BASKI', 'DIGER'] as const;

export class CreateFasonShipmentDto {
  @IsString()
  @IsNotEmpty()
  subcontractorName!: string;

  @IsIn(FASON_OPERATION_TYPES)
  operationType!: string;

  @IsInt()
  @Min(1)
  sentQuantity!: number;

  @IsOptional()
  @IsDateString()
  expectedReturnDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  unitCost?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateFasonShipmentDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  subcontractorName?: string;

  @IsOptional()
  @IsIn(FASON_OPERATION_TYPES)
  operationType?: string;

  @IsOptional()
  @IsDateString()
  expectedReturnDate?: string;

  @IsOptional()
  @IsDateString()
  receivedDate?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  receivedQuantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  unitCost?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

const BOM_MATERIAL_TYPES = ['KUMAS', 'AKSESUAR'] as const;
const BOM_UNITS = ['METRE', 'ADET', 'GRAM', 'KG'] as const;

export class CreateOrderBOMItemDto {
  @IsString()
  @IsNotEmpty()
  materialName!: string;

  @IsIn(BOM_MATERIAL_TYPES)
  materialType!: string;

  @IsNumber()
  @Min(0)
  unitConsumption!: number;

  @IsIn(BOM_UNITS)
  unit!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  wastagePercent?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateOrderBOMItemDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  materialName?: string;

  @IsOptional()
  @IsIn(BOM_MATERIAL_TYPES)
  materialType?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  unitConsumption?: number;

  @IsOptional()
  @IsIn(BOM_UNITS)
  unit?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  wastagePercent?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
