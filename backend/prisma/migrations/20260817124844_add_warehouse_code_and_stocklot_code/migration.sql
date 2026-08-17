-- AlterTable: Warehouse.code (nullable first so we can backfill existing rows)
ALTER TABLE "Warehouse" ADD COLUMN "code" TEXT;

UPDATE "Warehouse" SET "code" = 'KMS-01' WHERE "name" = 'Kumaş Deposu';
UPDATE "Warehouse" SET "code" = 'AKS-01' WHERE "name" = 'Aksesuar Deposu';
UPDATE "Warehouse" SET "code" = 'URN-01' WHERE "name" = 'Ürün Deposu';
UPDATE "Warehouse" SET "code" = 'LN1-HM' WHERE "name" = 'LINE-1 Hammadde Deposu';
UPDATE "Warehouse" SET "code" = 'LN2-HM' WHERE "name" = 'LINE-2 Hammadde Deposu';
UPDATE "Warehouse" SET "code" = 'LN3-HM' WHERE "name" = 'LINE-3 Hammadde Deposu';
UPDATE "Warehouse" SET "code" = 'LN4-HM' WHERE "name" = 'LINE-4 Hammadde Deposu';
UPDATE "Warehouse" SET "code" = 'LN5-HM' WHERE "name" = 'LINE-5 Hammadde Deposu';
-- Beklenmedik/gelecekte eklenen depo satırları için yedek kod (NOT NULL ihlalini önler)
UPDATE "Warehouse" SET "code" = 'WH-' || id WHERE "code" IS NULL;

ALTER TABLE "Warehouse" ALTER COLUMN "code" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Warehouse_code_key" ON "Warehouse"("code");

-- AlterTable: StockLot.code (opsiyonel, kullanıcının kendi girdiği malzeme kodu)
ALTER TABLE "StockLot" ADD COLUMN "code" TEXT;
