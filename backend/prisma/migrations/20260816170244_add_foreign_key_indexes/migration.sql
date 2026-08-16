-- CreateIndex
CREATE INDEX "ApprovalStage_orderId_idx" ON "ApprovalStage"("orderId");

-- CreateIndex
CREATE INDEX "Material_orderId_idx" ON "Material"("orderId");

-- CreateIndex
CREATE INDEX "Order_tenantId_idx" ON "Order"("tenantId");

-- CreateIndex
CREATE INDEX "OrderColorSize_orderId_idx" ON "OrderColorSize"("orderId");

-- CreateIndex
CREATE INDEX "ProductionEntry_orderId_idx" ON "ProductionEntry"("orderId");

-- CreateIndex
CREATE INDEX "QualityEntry_orderId_idx" ON "QualityEntry"("orderId");

-- CreateIndex
CREATE INDEX "StockLot_orderId_idx" ON "StockLot"("orderId");

-- CreateIndex
CREATE INDEX "StockMovement_stockLotId_idx" ON "StockMovement"("stockLotId");

-- CreateIndex
CREATE INDEX "StockMovement_orderId_idx" ON "StockMovement"("orderId");

