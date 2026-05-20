export type TrainingDayType = 'push' | 'pull' | 'legs' | 'full_body';
export type DayType = TrainingDayType | 'rest';

export interface PlanDayBlueprint {
  dayIndex: number;
  dayType: DayType;
  scheduledDate: string;
}

const CYCLES: Record<3 | 4 | 5, TrainingDayType[]> = {
  3: ['push', 'pull', 'legs'],
  4: ['push', 'pull', 'legs', 'full_body'],
  5: ['push', 'pull', 'legs', 'push', 'pull'],
};

export function buildPlanBlueprint(daysPerWeek: 3 | 4 | 5, startDate: Date): PlanDayBlueprint[] {
  const trainingCycle = CYCLES[daysPerWeek];
  const result: PlanDayBlueprint[] = [];
  let cycleIndex = 0;

  for (let dayIndex = 0; dayIndex < 28; dayIndex++) {
    const posInWeek = dayIndex % 7;
    const date = new Date(startDate);
    date.setDate(date.getDate() + dayIndex);
    const scheduledDate = date.toISOString().split('T')[0];

    if (posInWeek < daysPerWeek) {
      result.push({
        dayIndex,
        dayType: trainingCycle[cycleIndex % trainingCycle.length],
        scheduledDate,
      });
      cycleIndex++;
    } else {
      result.push({ dayIndex, dayType: 'rest', scheduledDate });
    }
  }

  return result;
}

export const EXERCISE_SLUGS_BY_DAY_TYPE: Record<TrainingDayType, string[]> = {
  push: ['bench_press', 'shoulder_press', 'push_up', 'tricep_extension'],
  pull: ['pull_up', 'dumbbell_row', 'bicep_curl'],
  legs: ['squat', 'deadlift', 'lunge'],
  full_body: ['push_up', 'pull_up', 'squat'],
};

export const TARGETS_BY_EXPERIENCE: Record<string, { sets: number; reps: number; restSeconds: number }> = {
  beginner: { sets: 3, reps: 10, restSeconds: 90 },
  intermediate: { sets: 4, reps: 8, restSeconds: 90 },
  advanced: { sets: 5, reps: 5, restSeconds: 120 },
};
