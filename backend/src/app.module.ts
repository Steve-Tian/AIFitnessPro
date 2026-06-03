import { Module } from '@nestjs/common';
import { AchievementsModule } from './achievements/achievements.module';
import { DevAuthGuard } from './dev-auth/dev-auth.guard';
import { DevUsersController } from './dev-auth/dev-users.controller';
import { DevUsersService } from './dev-auth/dev-users.service';
import { ExercisesModule } from './exercises/exercises.module';
import { HealthController } from './health/health.controller';
import { HealthService } from './health/health.service';
import { PlansModule } from './plans/plans.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersController } from './users/users.controller';
import { UsersService } from './users/users.service';
import { WorkoutsModule } from './workouts/workouts.module';

@Module({
  imports: [PrismaModule, PlansModule, WorkoutsModule, ExercisesModule, AchievementsModule],
  controllers: [HealthController, DevUsersController, UsersController],
  providers: [HealthService, DevUsersService, DevAuthGuard, UsersService],
})
export class AppModule {}
