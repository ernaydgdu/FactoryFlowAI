-- CreateTable
CREATE TABLE "ApprovalStage" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "stageType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApprovalStage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ApprovalStage_orderId_stageType_key" ON "ApprovalStage"("orderId", "stageType");

-- AddForeignKey
ALTER TABLE "ApprovalStage" ADD CONSTRAINT "ApprovalStage_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

