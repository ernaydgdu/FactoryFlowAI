import { PrismaClient } from '../generated/prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SEED_USERS = [
  {
    email: 'admin@kepler-erp.com',
    password: 'Kepler2026!',
    fullName: 'Sistem Yöneticisi',
    role: 'ADMIN' as const,
  },
  {
    email: 'manager@kepler-erp.com',
    password: 'Kepler2026!',
    fullName: 'Fabrika Müdürü',
    role: 'MANAGER' as const,
  },
  {
    email: 'planner@kepler-erp.com',
    password: 'Kepler2026!',
    fullName: 'Planlama Uzmanı',
    role: 'PLANNER' as const,
  },
  {
    email: 'operator@kepler-erp.com',
    password: 'Kepler2026!',
    fullName: 'Atölye Operatörü',
    role: 'SHOP_FLOOR_OPERATOR' as const,
  },
  {
    email: 'viewer@kepler-erp.com',
    password: 'Kepler2026!',
    fullName: 'Rapor İzleyici',
    role: 'VIEWER' as const,
  },
];

const SEED_PRODUCTION_LINES = [
  { name: 'LINE-1', capacity: 500 },
  { name: 'LINE-2', capacity: 500 },
  { name: 'LINE-3', capacity: 500 },
  { name: 'LINE-4', capacity: 500 },
  { name: 'LINE-5', capacity: 500 },
];

async function main() {
  for (const seed of SEED_USERS) {
    const hashedPassword = await bcrypt.hash(seed.password, 10);
    await prisma.user.upsert({
      where: { email: seed.email },
      update: {
        fullName: seed.fullName,
        role: seed.role,
        password: hashedPassword,
        tenantId: 'kepler-default',
        factoryId: 'factory-ist-001',
        isActive: true,
      },
      create: {
        email: seed.email,
        password: hashedPassword,
        fullName: seed.fullName,
        role: seed.role,
        tenantId: 'kepler-default',
        factoryId: 'factory-ist-001',
      },
    });
  }
  console.log(`Seeded ${SEED_USERS.length} users.`);

  for (const line of SEED_PRODUCTION_LINES) {
    await prisma.productionLine.upsert({
      where: { name: line.name },
      update: { capacity: line.capacity, tenantId: 'kepler-default' },
      create: {
        name: line.name,
        capacity: line.capacity,
        tenantId: 'kepler-default',
      },
    });
  }
  console.log(`Seeded ${SEED_PRODUCTION_LINES.length} production lines.`);

  const SEED_WAREHOUSES = [
    { name: 'Kumaş Deposu', type: 'KUMAS', code: 'KMS-01' },
    { name: 'Aksesuar Deposu', type: 'AKSESUAR', code: 'AKS-01' },
    { name: 'Ürün Deposu', type: 'URUN', code: 'URN-01' },
  ];

  for (const wh of SEED_WAREHOUSES) {
    await prisma.warehouse.upsert({
      where: { name: wh.name },
      update: { type: wh.type, code: wh.code, tenantId: 'kepler-default' },
      create: {
        name: wh.name,
        type: wh.type,
        code: wh.code,
        tenantId: 'kepler-default',
      },
    });
  }

  const productionLines = await prisma.productionLine.findMany({
    where: { name: { in: SEED_PRODUCTION_LINES.map((l) => l.name) } },
  });
  for (const line of productionLines) {
    const name = `${line.name} Hammadde Deposu`;
    const lineNumber = line.name.replace(/\D/g, '');
    const code = `LN${lineNumber}-HM`;
    await prisma.warehouse.upsert({
      where: { name },
      update: {
        type: 'ATOLYE_HAMMADDE',
        lineId: line.id,
        code,
        tenantId: 'kepler-default',
      },
      create: {
        name,
        type: 'ATOLYE_HAMMADDE',
        lineId: line.id,
        code,
        tenantId: 'kepler-default',
      },
    });
  }
  console.log(
    `Seeded ${SEED_WAREHOUSES.length + productionLines.length} warehouses.`,
  );

  const kumasDepo = await prisma.warehouse.findUnique({
    where: { name: 'Kumaş Deposu' },
  });
  const aksesuarDepo = await prisma.warehouse.findUnique({
    where: { name: 'Aksesuar Deposu' },
  });
  const unassignedLots = await prisma.stockLot.findMany({
    where: { warehouseId: null },
  });
  for (const lot of unassignedLots) {
    const materialType = lot.materialType.toLocaleUpperCase('tr-TR');
    const warehouseId =
      materialType === 'KUMAŞ'
        ? kumasDepo?.id
        : materialType === 'AKSESUAR'
          ? aksesuarDepo?.id
          : undefined;
    if (warehouseId) {
      await prisma.stockLot.update({
        where: { id: lot.id },
        data: { warehouseId },
      });
    }
  }
  console.log(`Assigned warehouse to existing stock lots where applicable.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
