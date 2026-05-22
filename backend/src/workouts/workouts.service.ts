import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { WorkoutStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SyncWorkoutRequestDto } from './workouts.dto';

@Injectable()
export class WorkoutsService {
  constructor(private readonly prisma: PrismaService) {}

  async syncSession(userId: string, dto: SyncWorkoutRequestDto) {
    const plan = await this.prisma.trainingPlan.findFirst({
      where: { id: dto.session.trainingPlanId, userId },
    });
    if (!plan) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: '训练计划不存在' });
    }

    const planDay = await this.prisma.planDay.findUnique({
      where: {
        trainingPlanId_dayIndex: {
          trainingPlanId: dto.session.trainingPlanId,
          dayIndex: dto.session.planDayIndex,
        },
      },
    });
    if (!planDay) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: '计划训练日不存在' });
    }

    const existing = await this.prisma.workoutSession.findUnique({
      where: { id: dto.session.id },
    });
    if (existing && existing.userId !== userId) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: '无权同步该训练记录' });
    }

    const exerciseIds = [...new Set(dto.sets.map(set => set.exerciseId))];
    const exercises = await this.prisma.exercise.findMany({
      where: { id: { in: exerciseIds }, status: 'published' },
    });
    if (exercises.length !== exerciseIds.length) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: '包含无效动作' });
    }

    const session = await this.prisma.$transaction(async tx => {
      const upserted = await tx.workoutSession.upsert({
        where: { id: dto.session.id },
        create: {
          id: dto.session.id,
          userId,
          trainingPlanId: dto.session.trainingPlanId,
          planDayId: planDay.id,
          status: dto.session.status as WorkoutStatus,
          startedAt: dto.session.startedAt ? new Date(dto.session.startedAt) : null,
          completedAt: dto.session.completedAt ? new Date(dto.session.completedAt) : null,
          durationSeconds: dto.session.durationSeconds ?? null,
        },
        update: {
          trainingPlanId: dto.session.trainingPlanId,
          planDayId: planDay.id,
          status: dto.session.status as WorkoutStatus,
          startedAt: dto.session.startedAt ? new Date(dto.session.startedAt) : null,
          completedAt: dto.session.completedAt ? new Date(dto.session.completedAt) : null,
          durationSeconds: dto.session.durationSeconds ?? null,
        },
      });

      for (const set of dto.sets) {
        await tx.workoutSet.upsert({
          where: {
            workoutSessionId_exerciseId_setIndex: {
              workoutSessionId: upserted.id,
              exerciseId: set.exerciseId,
              setIndex: set.setIndex,
            },
          },
          create: {
            id: set.id,
            workoutSessionId: upserted.id,
            exerciseId: set.exerciseId,
            setIndex: set.setIndex,
            targetReps: set.targetReps ?? null,
            actualReps: set.actualReps,
            weightKg: set.weightKg ?? null,
            completedAt: set.completedAt ? new Date(set.completedAt) : null,
          },
          update: {
            targetReps: set.targetReps ?? null,
            actualReps: set.actualReps,
            weightKg: set.weightKg ?? null,
            completedAt: set.completedAt ? new Date(set.completedAt) : null,
          },
        });
      }

      return tx.workoutSession.findUniqueOrThrow({
        where: { id: upserted.id },
        include: {
          sets: {
            include: { exercise: true },
            orderBy: { setIndex: 'asc' },
          },
        },
      });
    });

    return session;
  }
}
