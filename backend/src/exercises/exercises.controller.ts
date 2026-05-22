import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { DevAuthGuard } from '../dev-auth/dev-auth.guard';
import { ListExercisesQueryDto } from './exercises.dto';
import { ExercisesService } from './exercises.service';

@Controller('v1/exercises')
@UseGuards(DevAuthGuard)
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  @Get()
  async list(@Query() query: ListExercisesQueryDto) {
    const exercises = await this.exercisesService.list(query);
    return { exercises };
  }

  @Get(':slug')
  async getBySlug(@Param('slug') slug: string) {
    const exercise = await this.exercisesService.getBySlug(slug);
    return { exercise };
  }
}
