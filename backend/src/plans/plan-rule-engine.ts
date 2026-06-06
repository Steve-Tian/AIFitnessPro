export type TrainingDayType = 'push' | 'pull' | 'legs' | 'full_body';
export type DayType = TrainingDayType | 'rest';

export interface PlanDayBlueprint {
  dayIndex: number;
  dayType: DayType;
  scheduledDate: string;
  occurrenceIndex: number; // how many times this dayType has appeared before (0-based), used for rotation
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
  const occurrenceCounts: Record<string, number> = {};

  for (let dayIndex = 0; dayIndex < 28; dayIndex++) {
    const posInWeek = dayIndex % 7;
    const date = new Date(startDate);
    date.setDate(date.getDate() + dayIndex);
    const scheduledDate = date.toISOString().split('T')[0];

    if (posInWeek < daysPerWeek) {
      const dayType = trainingCycle[cycleIndex % trainingCycle.length];
      const occurrenceIndex = occurrenceCounts[dayType] ?? 0;
      occurrenceCounts[dayType] = occurrenceIndex + 1;
      result.push({ dayIndex, dayType, scheduledDate, occurrenceIndex });
      cycleIndex++;
    } else {
      result.push({ dayIndex, dayType: 'rest', scheduledDate, occurrenceIndex: 0 });
    }
  }

  return result;
}

// Each slot is an ordered pool of slugs. The exercise chosen = pool[occurrenceIndex % pool.length].
// Slots within a day cover different muscle targets to guarantee structural completeness.
type ExerciseSlot = { pool: string[] };

const DAY_STRUCTURE: Record<TrainingDayType, ExerciseSlot[]> = {
  push: [
    // Chest compound (rotates: flat → incline → dumbbell → decline)
    { pool: ['bench_press', 'incline_bench_press', 'dumbbell_press', 'decline_bench_press'] },
    // Chest isolation
    { pool: ['dumbbell_fly', 'cable_crossover', 'incline_dumbbell_fly', 'flat_bench_cable_fly'] },
    // Shoulder compound (rotates: 5 variations)
    { pool: ['overhead_press', 'shoulder_press', 'dumbbell_shoulder_press', 'arnold_press', 'seated_dumbbell_shoulder_press'] },
    // Shoulder isolation
    { pool: ['lateral_raise', 'cable_lateral_raise', 'front_raise'] },
    // Tricep (rotates: 5 variations targeting long/medial/lateral heads)
    { pool: ['skull_crusher', 'tricep_pushdown', 'overhead_cable_tricep', 'barbell_overhead_tricep', 'tricep_extension'] },
  ],

  pull: [
    // Vertical pull / lat width (rotates: 5 grip variations)
    { pool: ['pull_up', 'lat_pulldown', 'chin_up', 'close_grip_lat_pulldown', 'underhand_lat_pulldown'] },
    // Horizontal pull / back thickness (rotates: 5 variations)
    { pool: ['barbell_row', 'dumbbell_row', 'seated_cable_row', 'chest_supported_row', 'incline_dumbbell_row'] },
    // Rear delt (rotates: 5 variations)
    { pool: ['face_pull', 'reverse_fly', 'barbell_rear_delt_row', 'cable_rear_delt_fly', 'ytw_raise'] },
    // Bicep compound
    { pool: ['barbell_curl', 'bicep_curl', 'hammer_curl', 'cross_body_hammer_curl'] },
    // Bicep isolation (different stretch position each time)
    { pool: ['concentration_curl', 'preacher_curl', 'incline_dumbbell_curl', 'spider_curl', 'zottman_curl'] },
  ],

  legs: [
    // Quad compound (rotates: 5 bilateral lower-body pushes)
    { pool: ['squat', 'goblet_squat', 'leg_press', 'front_squat', 'barbell_hack_squat'] },
    // Hip hinge (rotates: 4 posterior chain patterns)
    { pool: ['romanian_deadlift', 'deadlift', 'sumo_deadlift', 'good_morning'] },
    // Quad accessory / unilateral (rotates: 6 knee-dominant variations)
    { pool: ['leg_extension', 'lunge', 'lunges', 'walking_lunge', 'step_up', 'dumbbell_rear_lunge'] },
    // Glute isolation
    { pool: ['hip_thrust', 'glute_bridge', 'single_leg_glute_bridge', 'cable_glute_kickback', 'glute_kickback'] },
    // Calf (rotates: 4 plantarflexion angles)
    { pool: ['standing_calf_raise', 'calf_raise', 'seated_calf_raise', 'donkey_calf_raise'] },
  ],

  full_body: [
    // Lower push
    { pool: ['bodyweight_squat', 'goblet_squat', 'jump_squat', 'box_jump'] },
    // Hip hinge / posterior
    { pool: ['deadlift', 'romanian_deadlift', 'kettlebell_swing'] },
    // Upper push
    { pool: ['push_up', 'pike_push_up', 'diamond_push_up'] },
    // Upper pull
    { pool: ['pull_up', 'inverted_row', 'dumbbell_row'] },
    // Core / conditioning
    { pool: ['plank', 'dead_bug', 'mountain_climber', 'farmer_walk', 'burpee'] },
  ],
};

/**
 * Returns the ordered list of exercise slugs for a given day type and occurrence index.
 * Intersects with available slugs so equipment restrictions are respected.
 * Falls back to the next pool item when the chosen slug isn't available.
 */
export function selectExerciseSlugsForDay(
  dayType: TrainingDayType,
  occurrenceIndex: number,
  availableSlugs: Set<string>,
): string[] {
  const slots = DAY_STRUCTURE[dayType];
  const result: string[] = [];

  for (const slot of slots) {
    // Try the rotation-selected index first, then walk the pool for any available exercise
    const start = occurrenceIndex % slot.pool.length;
    let chosen: string | null = null;
    for (let offset = 0; offset < slot.pool.length; offset++) {
      const candidate = slot.pool[(start + offset) % slot.pool.length];
      if (availableSlugs.has(candidate)) {
        chosen = candidate;
        break;
      }
    }
    if (chosen) result.push(chosen);
  }

  return result;
}

// Flat export kept for backward compatibility with existing tests
export const EXERCISE_SLUGS_BY_DAY_TYPE: Record<TrainingDayType, string[]> = {
  push:       [...new Set(DAY_STRUCTURE.push.flatMap(s => s.pool))],
  pull:       [...new Set(DAY_STRUCTURE.pull.flatMap(s => s.pool))],
  legs:       [...new Set(DAY_STRUCTURE.legs.flatMap(s => s.pool))],
  full_body:  [...new Set(DAY_STRUCTURE.full_body.flatMap(s => s.pool))],
};

// 休息时间按训练强度科学设定：
// 新手 12次×轻重量 → 60s（心肺恢复快，重点是学动作）
// 进阶 8次×中重量 → 90s（肌肥大区间标准组间休息）
// 高阶 5次×大重量 → 150s（力量区间需要充分神经恢复）
export const TARGETS_BY_EXPERIENCE: Record<string, { sets: number; reps: number; restSeconds: number }> = {
  beginner:     { sets: 3, reps: 12, restSeconds: 60 },
  intermediate: { sets: 4, reps: 8,  restSeconds: 90 },
  advanced:     { sets: 5, reps: 5,  restSeconds: 150 },
};
