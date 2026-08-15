-- CreateTable
CREATE TABLE "Order" (
    "id" SERIAL NOT NULL,
    "orderNo" TEXT NOT NULL,
    "buyerName" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "totalQuantity" INTEGER NOT NULL,
    "shipmentDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANNING',
    "tenantId" TEXT NOT NULL DEFAULT 'kepler-default',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Material" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "materialName" TEXT NOT NULL,
    "materialType" TEXT NOT NULL,
    "supplierName" TEXT NOT NULL,
    "orderedQuantity" DOUBLE PRECISION NOT NULL,
    "orderedDate" TIMESTAMP(3),
    "expectedArrival" TIMESTAMP(3),
    "arrivedQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNo_key" ON "Order"("orderNo");

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
