-- CreateTable
CREATE TABLE "ProductionLine" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 0,
    "tenantId" TEXT NOT NULL DEFAULT 'kepler-default',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductionLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductionLine_name_key" ON "ProductionLine"("name");

-- CreateIndex
CREATE INDEX "ProductionLine_tenantId_idx" ON "ProductionLine"("tenantId");
