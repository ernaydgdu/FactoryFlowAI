import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { LoginDto, RegisterDto } from './dto/auth.dto';

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
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(data: RegisterDto) {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    try {
      return await this.prisma.user.create({
        data: {
          email: data.email.trim().toLowerCase(),
          password: hashedPassword,
          fullName: data.fullName.trim(),
          role: 'VIEWER',
          factoryId: data.factoryId ?? 'factory-ist-001',
        },
        select: USER_SELECT,
      });
    } catch {
      throw new ConflictException('Bu e-posta adresi zaten kayıtlı.');
    }
  }

  async login(data: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: data.email.trim().toLowerCase(),
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Email veya şifre hatalı');
    }

    const passwordMatch = await bcrypt.compare(data.password, user.password);

    if (!passwordMatch) {
      throw new UnauthorizedException('Email veya şifre hatalı');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      factoryId: user.factoryId,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: String(user.id),
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        tenantId: user.tenantId,
        factoryId: user.factoryId,
      },
    };
  }

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: USER_SELECT,
    });

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    return {
      id: String(user.id),
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      tenantId: user.tenantId,
      factoryId: user.factoryId,
    };
  }
}
