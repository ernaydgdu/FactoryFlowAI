-- CreateTable
CREATE TABLE "OrderColorSize" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "color" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderColorSize_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrderColorSize_orderId_color_size_key" ON "OrderColorSize"("orderId", "color", "size");

-- AddForeignKey
ALTER TABLE "OrderColorSize" ADD CONSTRAINT "OrderColorSize_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

