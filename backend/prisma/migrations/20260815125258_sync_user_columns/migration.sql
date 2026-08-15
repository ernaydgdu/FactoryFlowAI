-- AddColumn (safe defaults, no data loss)
ALTER TABLE "User" ADD COLUMN     "tenantId" TEXT NOT NULL DEFAULT 'kepler-default';
ALTER TABLE "User" ADD COLUMN     "factoryId" TEXT NOT NULL DEFAULT 'factory-ist-001';
ALTER TABLE "User" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- Normalize legacy role values that don't map to the UserRole enum
UPDATE "User" SET "role" = 'VIEWER' WHERE "role" = 'USER';

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'PLANNER', 'SHOP_FLOOR_OPERATOR', 'VIEWER');

-- Convert role column to enum in place (no drop, no data loss)
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole" USING "role"::"UserRole";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'ADMIN';
