import { Module } from '@nestjs/common';
import { DevAuthGuard } from './dev-auth/dev-auth.guard';
import { DevUsersController } from './dev-auth/dev-users.controller';
import { DevUsersService } from './dev-auth/dev-users.service';
import { HealthController } from './health/health.controller';
import { HealthService } from './health/health.service';
import { PlansModule } from './plans/plans.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersController } from './users/users.controller';
import { UsersService } from './users/users.service';

@Module({
  imports: [PrismaModule, PlansModule],
  controllers: [HealthController, DevUsersController, UsersController],
  providers: [HealthService, DevUsersService, DevAuthGuard, UsersService],
})
export class AppModule {}
