import { Exercise, PlanDay, PlanExercise, TrainingPlan } from '@prisma/client';

type PlanWithDays = TrainingPlan & {
  days: (PlanDay & {
    exercises: (PlanExercise & { exercise: Exercise })[];
  })[];
};

export function presentPlan(plan: PlanWithDays) {
  return {
    id: plan.id,
    status: plan.status,
    startDate: plan.startDate?.toISOString().split('T')[0] ?? null,
    days: plan.days.map(day => ({
      dayIndex: day.dayIndex,
      dayType: day.dayType,
      scheduledDate: day.scheduledDate?.toISOString().split('T')[0] ?? null,
      dayNote: day.dayNote ?? null,
      exercises: day.exercises
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(pe => ({
          exerciseId: pe.exerciseId,
          nameCn: pe.exercise.nameCn,
          targetSets: pe.targetSets,
          targetReps: pe.targetReps,
          targetRestSeconds: pe.targetRestSeconds,
          recommendedWeightKg: pe.recommendedWeightKg ? Number(pe.recommendedWeightKg) : null,
          previewMediaUrl: pe.exercise.previewMediaUrl ?? null,
        })),
    })),
  };
}
