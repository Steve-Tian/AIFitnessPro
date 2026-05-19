import { Injectable } from '@nestjs/common';
import { Experience, Gender, Goal, Persona } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertProfileDto } from './profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getCurrentUser(userId: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        profile: true,
        settings: true,
      },
    });
  }

  async upsertProfile(userId: string, dto: UpsertProfileDto) {
    await this.prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        gender: dto.gender as Gender,
        age: dto.age,
        heightCm: dto.heightCm,
        weightKg: dto.weightKg,
        goal: dto.goal as Goal,
        experience: dto.experience as Experience,
        daysPerWeek: dto.daysPerWeek,
        equipment: dto.equipment,
        persona: dto.persona as Persona,
      },
      update: {
        gender: dto.gender as Gender,
        age: dto.age,
        heightCm: dto.heightCm,
        weightKg: dto.weightKg,
        goal: dto.goal as Goal,
        experience: dto.experience as Experience,
        daysPerWeek: dto.daysPerWeek,
        equipment: dto.equipment,
        persona: dto.persona as Persona,
      },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { onboardingCompleted: true },
    });

    return this.getCurrentUser(userId);
  }
}
