import { Controller, Get, UseGuards } from '@nestjs/common';
import { User } from '@prisma/client';
import { CurrentUser } from '../dev-auth/current-user.decorator';
import { DevAuthGuard } from '../dev-auth/dev-auth.guard';
import { AchievementsService } from './achievements.service';

@Controller('v1/achievements')
@UseGuards(DevAuthGuard)
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  @Get()
  async list(@CurrentUser() user: User) {
    const achievements = await this.achievementsService.listForUser(user.id);
    return { achievements };
  }
}
