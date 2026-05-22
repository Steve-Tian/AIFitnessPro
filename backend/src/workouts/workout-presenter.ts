import { WorkoutSession, WorkoutSet, Exercise } from '@prisma/client';

type SessionWithSets = WorkoutSession & {
  sets: (WorkoutSet & { exercise: Exercise })[];
};

export function presentWorkoutSession(session: SessionWithSets) {
  return {
    id: session.id,
    trainingPlanId: session.trainingPlanId,
    planDayId: session.planDayId,
    status: session.status,
    startedAt: session.startedAt?.toISOString() ?? null,
    completedAt: session.completedAt?.toISOString() ?? null,
    durationSeconds: session.durationSeconds,
    sets: session.sets
      .sort((a, b) => a.setIndex - b.setIndex)
      .map(set => ({
        id: set.id,
        exerciseId: set.exerciseId,
        nameCn: set.exercise.nameCn,
        setIndex: set.setIndex,
        targetReps: set.targetReps,
        actualReps: set.actualReps,
        weightKg: set.weightKg ? Number(set.weightKg) : null,
        completedAt: set.completedAt?.toISOString() ?? null,
      })),
  };
}
