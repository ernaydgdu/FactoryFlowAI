import {
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

const PRODUCER_TYPES = ['INTERNAL', 'FASON'] as const;
const WORK_ORDER_STATUSES = [
  'TASLAK',
  'GONDERILDI',
  'DEVAM_EDIYOR',
  'TAMAMLANDI',
] as const;

export class CreateWorkOrderDto {
  @IsIn(PRODUCER_TYPES)
  producerType!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  productionLineId?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  subcontractorName?: string;

  @IsInt()
  @Min(1)
  plannedQuantity!: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  targetDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  laborRatePerDay?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedDays?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateWorkOrderDto {
  @IsOptional()
  @IsIn(PRODUCER_TYPES)
  producerType?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  productionLineId?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  subcontractorName?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  plannedQuantity?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  targetDate?: string;

  @IsOptional()
  @IsIn(WORK_ORDER_STATUSES)
  status?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  laborRatePerDay?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedDays?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
