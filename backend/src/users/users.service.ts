import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import type { CreateUserDto, UpdateUserDto } from '../auth/dto/auth.dto';

const USER_SELECT = {
  id: true,
  email: true,
  fullName: true,
  role: true,
  tenantId: true,
  factoryId: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getUsers(factoryId?: string) {
    return this.prisma.user.findMany({
      where: factoryId ? { factoryId, isActive: true } : { isActive: true },
      select: USER_SELECT,
      orderBy: { fullName: 'asc' },
    });
  }

  async createUser(data: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    try {
      return await this.prisma.user.create({
        data: {
          email: data.email.trim().toLowerCase(),
          password: hashedPassword,
          fullName: data.fullName.trim(),
          role: (data.role as never) ?? 'VIEWER',
          factoryId: data.factoryId ?? 'factory-ist-001',
        },
        select: USER_SELECT,
      });
    } catch {
      throw new ConflictException('Bu e-posta adresi zaten kayıtlı.');
    }
  }

  async updateUser(id: number, data: UpdateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    const updateData: Record<string, unknown> = {};
    if (data.fullName) updateData.fullName = data.fullName.trim();
    if (data.role) updateData.role = data.role;
    if (data.factoryId) updateData.factoryId = data.factoryId;
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      select: USER_SELECT,
    });
  }
}
