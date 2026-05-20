import { Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { User } from '@prisma/client';
import { CurrentUser } from '../dev-auth/current-user.decorator';
import { DevAuthGuard } from '../dev-auth/dev-auth.guard';
import { presentPlan } from './plan-presenter';
import { PlansService } from './plans.service';

@Controller('v1/plans')
@UseGuards(DevAuthGuard)
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  async generate(@CurrentUser() user: User) {
    const plan = await this.plansService.generate(user.id);
    return { plan: presentPlan(plan) };
  }

  @Get('active')
  async getActive(@CurrentUser() user: User) {
    const plan = await this.plansService.getActive(user.id);
    return { plan: presentPlan(plan) };
  }
}
