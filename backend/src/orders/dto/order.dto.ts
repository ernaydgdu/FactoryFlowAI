export class CreateOrderDto {
  orderNo!: string;
  buyerName!: string;
  productName!: string;
  totalQuantity!: number;
  shipmentDate!: string;
  status?: string;
}

export class UpdateOrderDto {
  orderNo?: string;
  buyerName?: string;
  productName?: string;
  totalQuantity?: number;
  shipmentDate?: string;
  status?: string;
}

export class CreateMaterialDto {
  materialName!: string;
  materialType!: string;
  supplierName!: string;
  orderedQuantity!: number;
  orderedDate?: string;
  expectedArrival?: string;
  status?: string;
  fabricWidth?: number;
  fabricWeight?: number;
  unitPrice?: number;
  currency?: string;
  notes?: string;
}

export class UpdateMaterialDto {
  materialName?: string;
  supplierName?: string;
  orderedQuantity?: number;
  expectedArrival?: string;
  fabricWidth?: number;
  fabricWeight?: number;
  unitPrice?: number;
  currency?: string;
  status?: string;
  arrivedQuantity?: number;
  notes?: string;
}

export class CreateProductionEntryDto {
  stage!: string;
  quantity!: number;
  date?: string;
  lineNo?: string;
  notes?: string;
}

export class CreateQualityEntryDto {
  checkedQty!: number;
  firstQuality!: number;
  secondQuality!: number;
  rejected!: number;
  defectType?: string;
  date?: string;
  notes?: string;
}

export class CreateOrderColorSizeDto {
  color!: string;
  size!: string;
  quantity!: number;
}

export class UpdateApprovalStageDto {
  status?: string;
  approvedBy?: string;
  notes?: string;
}
