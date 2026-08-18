-- CreateTable
CREATE TABLE "FasonShipment" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "subcontractorName" TEXT NOT NULL,
    "operationType" TEXT NOT NULL,
    "sentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentQuantity" INTEGER NOT NULL,
    "expectedReturnDate" TIMESTAMP(3),
    "receivedDate" TIMESTAMP(3),
    "receivedQuantity" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'GONDERILDI',
    "unitCost" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "notes" TEXT,
    "tenantId" TEXT NOT NULL DEFAULT 'kepler-default',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FasonShipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderBOMItem" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "materialName" TEXT NOT NULL,
    "materialType" TEXT NOT NULL,
    "unitConsumption" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "wastagePercent" DOUBLE PRECISION NOT NULL DEFAULT 3,
    "notes" TEXT,
    "tenantId" TEXT NOT NULL DEFAULT 'kepler-default',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderBOMItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FasonShipment_orderId_idx" ON "FasonShipment"("orderId");

-- CreateIndex
CREATE INDEX "FasonShipment_tenantId_idx" ON "FasonShipment"("tenantId");

-- CreateIndex
CREATE INDEX "OrderBOMItem_orderId_idx" ON "OrderBOMItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderBOMItem_tenantId_idx" ON "OrderBOMItem"("tenantId");

-- AddForeignKey
ALTER TABLE "FasonShipment" ADD CONSTRAINT "FasonShipment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderBOMItem" ADD CONSTRAINT "OrderBOMItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
