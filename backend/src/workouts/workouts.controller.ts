import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { User } from '@prisma/client';
import { CurrentUser } from '../dev-auth/current-user.decorator';
import { DevAuthGuard } from '../dev-auth/dev-auth.guard';
import { presentWorkoutSession } from './workout-presenter';
import { SyncWorkoutRequestDto } from './workouts.dto';
import { WorkoutsService } from './workouts.service';

@Controller('v1/workouts')
@UseGuards(DevAuthGuard)
export class WorkoutsController {
  constructor(private readonly workoutsService: WorkoutsService) {}

  @Post('sessions/sync')
  @HttpCode(HttpStatus.OK)
  async syncSession(@CurrentUser() user: User, @Body() body: SyncWorkoutRequestDto) {
    const session = await this.workoutsService.syncSession(user.id, body);
    return { session: presentWorkoutSession(session) };
  }
}
