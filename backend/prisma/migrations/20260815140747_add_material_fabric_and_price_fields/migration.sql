-- AlterTable
ALTER TABLE "Material" ADD COLUMN     "currency" TEXT DEFAULT 'USD',
ADD COLUMN     "fabricWeight" DOUBLE PRECISION,
ADD COLUMN     "fabricWidth" DOUBLE PRECISION,
ADD COLUMN     "unitPrice" DOUBLE PRECISION;
