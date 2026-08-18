-- AlterTable
ALTER TABLE "FasonShipment" ADD COLUMN     "workOrderId" INTEGER;

-- AlterTable
ALTER TABLE "ProductionEntry" ADD COLUMN     "workOrderId" INTEGER;

-- CreateTable
CREATE TABLE "WorkOrder" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "workOrderNo" TEXT NOT NULL,
    "producerType" TEXT NOT NULL,
    "productionLineId" INTEGER,
    "subcontractorName" TEXT,
    "plannedQuantity" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3),
    "targetDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'TASLAK',
    "laborRatePerDay" DOUBLE PRECISION,
    "estimatedDays" DOUBLE PRECISION,
    "notes" TEXT,
    "createdBy" TEXT,
    "tenantId" TEXT NOT NULL DEFAULT 'kepler-default',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkOrder_workOrderNo_key" ON "WorkOrder"("workOrderNo");

-- CreateIndex
CREATE INDEX "WorkOrder_orderId_idx" ON "WorkOrder"("orderId");

-- CreateIndex
CREATE INDEX "WorkOrder_productionLineId_idx" ON "WorkOrder"("productionLineId");

-- CreateIndex
CREATE INDEX "WorkOrder_tenantId_idx" ON "WorkOrder"("tenantId");

-- CreateIndex
CREATE INDEX "FasonShipment_workOrderId_idx" ON "FasonShipment"("workOrderId");

-- CreateIndex
CREATE INDEX "ProductionEntry_workOrderId_idx" ON "ProductionEntry"("workOrderId");

-- AddForeignKey
ALTER TABLE "ProductionEntry" ADD CONSTRAINT "ProductionEntry_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FasonShipment" ADD CONSTRAINT "FasonShipment_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_productionLineId_fkey" FOREIGN KEY ("productionLineId") REFERENCES "ProductionLine"("id") ON DELETE SET NULL ON UPDATE CASCADE;
