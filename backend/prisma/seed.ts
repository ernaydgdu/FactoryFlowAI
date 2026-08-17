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
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
