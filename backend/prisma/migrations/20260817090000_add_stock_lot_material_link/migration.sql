-- AlterTable
ALTER TABLE "StockLot" ADD COLUMN "materialId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "StockLot_materialId_key" ON "StockLot"("materialId");

-- AddForeignKey
ALTER TABLE "StockLot" ADD CONSTRAINT "StockLot_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE SET NULL ON UPDATE CASCADE;
