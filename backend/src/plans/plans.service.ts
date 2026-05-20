import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Exercise, PlanDay, PlanExercise, TrainingPlan } from '@prisma/client';
import {
  buildPlanBlueprint,
  EXERCISE_SLUGS_BY_DAY_TYPE,
  TARGETS_BY_EXPERIENCE,
  TrainingDayType,
} from './plan-rule-engine';
import { ClaudeNotesService } from './claude-notes.service';
import { PrismaService } from '../prisma/prisma.service';

type PlanWithDays = TrainingPlan & {
  days: (PlanDay & {
    exercises: (PlanExercise & { exercise: Exercise })[];
  })[];
};

@Injectable()
export class PlansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly claudeNotes: ClaudeNotesService,
  ) {}

  async generate(userId: string): Promise<PlanWithDays> {
    const profile = await this.prisma.userProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw new BadRequestException({ code: 'VALIDATION_ERROR', message: '请先完成个人信息填写' });
    }

    await this.prisma.trainingPlan.updateMany({
      where: { userId, status: 'active' },
      data: { status: 'archived' },
    });

    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 27);

    const blueprint = buildPlanBlueprint(profile.daysPerWeek as 3 | 4 | 5, startDate);
    const targets = TARGETS_BY_EXPERIENCE[profile.experience] ?? TARGETS_BY_EXPERIENCE['beginner'];

    const allExercises = await this.prisma.exercise.findMany({
      where: { status: 'published', equipment: { hasSome: profile.equipment } },
    });

    const exercisesByDayType: Record<string, typeof allExercises> = {};
    for (const [dayType, slugs] of Object.entries(EXERCISE_SLUGS_BY_DAY_TYPE)) {
      exercisesByDayType[dayType] = allExercises
        .filter(e => slugs.includes(e.slug))
        .slice(0, 3);
    }

    const plan = await this.prisma.trainingPlan.create({
      data: { userId, status: 'active', source: 'rule_engine', startDate, endDate },
    });

    const createdDays: PlanWithDays['days'] = [];

    for (const dayBlueprint of blueprint) {
      const exForDay =
        dayBlueprint.dayType !== 'rest'
          ? (exercisesByDayType[dayBlueprint.dayType] ?? [])
          : [];

      const day = await this.prisma.planDay.create({
        data: {
          trainingPlanId: plan.id,
          dayIndex: dayBlueprint.dayIndex,
          dayType: dayBlueprint.dayType,
          scheduledDate: new Date(dayBlueprint.scheduledDate),
          exercises: {
            create: exForDay.map((ex, i) => ({
              exerciseId: ex.id,
              sortOrder: i,
              targetSets: targets.sets,
              targetReps: targets.reps,
              targetRestSeconds: targets.restSeconds,
            })),
          },
        },
        include: { exercises: { include: { exercise: true } } },
      });

      createdDays.push(day);
    }

    this.claudeNotes.appendDayNotes(
      createdDays
        .filter(d => d.dayType !== 'rest')
        .map(d => ({
          id: d.id,
          dayType: d.dayType,
          exercises: d.exercises.map(e => e.exercise.nameCn),
        })),
    );

    return { ...plan, days: createdDays };
  }

  async getActive(userId: string): Promise<PlanWithDays> {
    const plan = await this.prisma.trainingPlan.findFirst({
      where: { userId, status: 'active' },
      include: {
        days: {
          include: { exercises: { include: { exercise: true }, orderBy: { sortOrder: 'asc' } } },
          orderBy: { dayIndex: 'asc' },
        },
      },
    });

    if (!plan) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: '没有激活的训练计划' });
    }

    return plan;
  }
}
