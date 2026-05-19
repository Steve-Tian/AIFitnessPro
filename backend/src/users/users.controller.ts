import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { User } from '@prisma/client';
import { CurrentUser } from '../dev-auth/current-user.decorator';
import { DevAuthGuard } from '../dev-auth/dev-auth.guard';
import { presentUser } from '../dev-auth/user-presenter';
import { UpsertProfileDto } from './profile.dto';
import { UsersService } from './users.service';

@Controller('v1/users')
@UseGuards(DevAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@CurrentUser() user: User) {
    const currentUser = await this.usersService.getCurrentUser(user.id);
    return { user: presentUser(currentUser) };
  }

  @Put('me/profile')
  async upsertProfile(@CurrentUser() user: User, @Body() dto: UpsertProfileDto) {
    const currentUser = await this.usersService.upsertProfile(user.id, dto);
    return { user: presentUser(currentUser) };
  }
}
