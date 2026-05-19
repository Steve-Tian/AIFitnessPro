import { Module } from '@nestjs/common';
import { DevUsersController } from './dev-auth/dev-users.controller';
import { DevUsersService } from './dev-auth/dev-users.service';
import { HealthController } from './health/health.controller';
import { HealthService } from './health/health.service';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [HealthController, DevUsersController],
  providers: [HealthService, DevUsersService],
})
export class AppModule {}
