export class CreateStockLotDto {
  materialName!: string;
  materialType!: string;
  supplierName!: string;
  lotNo?: string;
  receivedQty!: number;
  unitPrice?: number;
  currency?: string;
  receivedDate?: string;
  orderId?: number;
}

export class ConsumeStockLotDto {
  quantity!: number;
  reason?: string;
  orderId?: number;
}
