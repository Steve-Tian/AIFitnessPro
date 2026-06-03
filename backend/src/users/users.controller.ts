import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Put, UseGuards } from '@nestjs/common';
import { User } from '@prisma/client';
import { AchievementsService } from '../achievements/achievements.service';
import { CurrentUser } from '../dev-auth/current-user.decorator';
import { DevAuthGuard } from '../dev-auth/dev-auth.guard';
import { presentUser } from '../dev-auth/user-presenter';
import { UpsertProfileDto } from './profile.dto';
import { UsersService } from './users.service';

@Controller('v1/users')
@UseGuards(DevAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly achievements: AchievementsService,
  ) {}

  @Get('me')
  async getMe(@CurrentUser() user: User) {
    const currentUser = await this.usersService.getCurrentUser(user.id);
    return { user: presentUser(currentUser) };
  }

  @Get('me/stats')
  async getStats(@CurrentUser() user: User) {
    const stats = await this.achievements.computeStats(user.id);
    return { stats };
  }

  @Put('me/profile')
  async upsertProfile(@CurrentUser() user: User, @Body() dto: UpsertProfileDto) {
    const currentUser = await this.usersService.upsertProfile(user.id, dto);
    return { user: presentUser(currentUser) };
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAccount(@CurrentUser() user: User) {
    await this.usersService.deleteAccount(user.id);
  }
}
