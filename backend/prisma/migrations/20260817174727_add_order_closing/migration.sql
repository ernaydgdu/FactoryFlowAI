-- AlterTable
ALTER TABLE "Order" ADD COLUMN "closedAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "closedBy" TEXT;
