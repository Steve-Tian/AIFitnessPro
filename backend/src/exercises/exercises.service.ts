import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ListExercisesQueryDto } from './exercises.dto';
import { presentExerciseDetail, presentExerciseSummary } from './exercise-presenter';

@Injectable()
export class ExercisesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListExercisesQueryDto) {
    const where: Record<string, unknown> = { status: 'published' };

    if (query.category) {
      where.category = query.category;
    }
    if (query.difficulty) {
      where.difficulty = query.difficulty;
    }
    if (query.equipment) {
      where.equipment = { has: query.equipment };
    }
    if (query.q) {
      where.OR = [
        { nameCn: { contains: query.q, mode: 'insensitive' } },
        { aliases: { has: query.q } },
        { slug: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    const exercises = await this.prisma.exercise.findMany({
      where,
      include: {
        media: { orderBy: { sortOrder: 'asc' } },
      },
      orderBy: [{ category: 'asc' }, { nameCn: 'asc' }],
    });

    return exercises.map(presentExerciseSummary);
  }

  async getBySlug(slug: string) {
    const exercise = await this.prisma.exercise.findFirst({
      where: { slug, status: 'published' },
      include: {
        media: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!exercise) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: '动作不存在' });
    }
    return presentExerciseDetail(exercise);
  }
}
