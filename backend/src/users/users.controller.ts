import { Controller, Get, UseGuards } from '@nestjs/common';
import { User } from '@prisma/client';
import { CurrentUser } from '../dev-auth/current-user.decorator';
import { DevAuthGuard } from '../dev-auth/dev-auth.guard';
import { presentUser } from '../dev-auth/user-presenter';
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
}
