import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDevUserDto } from './dev-users.dto';

@Injectable()
export class DevUsersService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrGet(dto: CreateDevUserDto) {
    const deviceLabel = dto.deviceLabel.trim();
    const externalId = dto.externalId?.trim() || undefined;

    if (externalId) {
      const existing = await this.prisma.user.findUnique({
        where: { devExternalId: externalId },
        include: { settings: true },
      });
      if (existing) return existing;
    }

    return this.prisma.user.create({
      data: {
        deviceLabel,
        devExternalId: externalId,
        settings: {
          create: {
            locale: 'zh-CN',
            unit: 'metric',
          },
        },
      },
      include: { settings: true },
    });
  }
}
