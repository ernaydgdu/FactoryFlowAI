-- CreateTable
CREATE TABLE "QualityEntry" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "checkedQty" INTEGER NOT NULL,
    "firstQuality" INTEGER NOT NULL,
    "secondQuality" INTEGER NOT NULL,
    "rejected" INTEGER NOT NULL,
    "defectType" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QualityEntry_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "QualityEntry" ADD CONSTRAINT "QualityEntry_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
