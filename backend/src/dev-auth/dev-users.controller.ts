import { Body, Controller, Post } from '@nestjs/common';
import { CreateDevUserDto } from './dev-users.dto';
import { DevUsersService } from './dev-users.service';
import { presentUser } from './user-presenter';

@Controller('v1/dev/users')
export class DevUsersController {
  constructor(private readonly devUsersService: DevUsersService) {}

  @Post()
  async create(@Body() dto: CreateDevUserDto) {
    const user = await this.devUsersService.createOrGet(dto);
    return { user: presentUser(user) };
  }
}
