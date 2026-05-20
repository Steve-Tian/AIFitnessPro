import {
  buildPlanBlueprint,
  EXERCISE_SLUGS_BY_DAY_TYPE,
  TARGETS_BY_EXPERIENCE,
} from './plan-rule-engine';

describe('buildPlanBlueprint', () => {
  const startDate = new Date('2026-05-20');

  it('always returns exactly 28 days', () => {
    expect(buildPlanBlueprint(3, startDate)).toHaveLength(28);
    expect(buildPlanBlueprint(4, startDate)).toHaveLength(28);
    expect(buildPlanBlueprint(5, startDate)).toHaveLength(28);
  });

  it('assigns 3 training days per week for daysPerWeek=3', () => {
    const days = buildPlanBlueprint(3, startDate);
    const week1 = days.filter(d => d.dayIndex < 7);
    expect(week1.filter(d => d.dayType !== 'rest')).toHaveLength(3);
    expect(week1.filter(d => d.dayType === 'rest')).toHaveLength(4);
  });

  it('assigns 4 training days per week for daysPerWeek=4', () => {
    const days = buildPlanBlueprint(4, startDate);
    const week1 = days.filter(d => d.dayIndex < 7);
    expect(week1.filter(d => d.dayType !== 'rest')).toHaveLength(4);
    expect(week1.filter(d => d.dayType === 'rest')).toHaveLength(3);
  });

  it('assigns 5 training days per week for daysPerWeek=5', () => {
    const days = buildPlanBlueprint(5, startDate);
    const week1 = days.filter(d => d.dayIndex < 7);
    expect(week1.filter(d => d.dayType !== 'rest')).toHaveLength(5);
    expect(week1.filter(d => d.dayType === 'rest')).toHaveLength(2);
  });

  it('cycles push/pull/legs for daysPerWeek=3', () => {
    const days = buildPlanBlueprint(3, startDate);
    const training = days.filter(d => d.dayType !== 'rest');
    expect(training[0].dayType).toBe('push');
    expect(training[1].dayType).toBe('pull');
    expect(training[2].dayType).toBe('legs');
    expect(training[3].dayType).toBe('push');
    expect(training[11].dayType).toBe('legs');
  });

  it('cycles push/pull/legs/full_body for daysPerWeek=4', () => {
    const days = buildPlanBlueprint(4, startDate);
    const training = days.filter(d => d.dayType !== 'rest');
    expect(training[0].dayType).toBe('push');
    expect(training[1].dayType).toBe('pull');
    expect(training[2].dayType).toBe('legs');
    expect(training[3].dayType).toBe('full_body');
    expect(training[4].dayType).toBe('push');
  });

  it('cycles push/pull/legs/push/pull for daysPerWeek=5', () => {
    const days = buildPlanBlueprint(5, startDate);
    const training = days.filter(d => d.dayType !== 'rest');
    expect(training[0].dayType).toBe('push');
    expect(training[1].dayType).toBe('pull');
    expect(training[2].dayType).toBe('legs');
    expect(training[3].dayType).toBe('push');
    expect(training[4].dayType).toBe('pull');
    expect(training[5].dayType).toBe('push');
  });

  it('sets scheduledDate in YYYY-MM-DD format from startDate', () => {
    const days = buildPlanBlueprint(3, new Date('2026-05-20'));
    expect(days[0].scheduledDate).toBe('2026-05-20');
    expect(days[1].scheduledDate).toBe('2026-05-21');
    expect(days[27].scheduledDate).toBe('2026-06-16');
  });

  it('assigns dayIndex 0 through 27 in order', () => {
    const days = buildPlanBlueprint(3, startDate);
    days.forEach((d, i) => expect(d.dayIndex).toBe(i));
  });
});

describe('EXERCISE_SLUGS_BY_DAY_TYPE', () => {
  it('has entries for push, pull, legs, full_body', () => {
    expect(EXERCISE_SLUGS_BY_DAY_TYPE.push.length).toBeGreaterThan(0);
    expect(EXERCISE_SLUGS_BY_DAY_TYPE.pull.length).toBeGreaterThan(0);
    expect(EXERCISE_SLUGS_BY_DAY_TYPE.legs.length).toBeGreaterThan(0);
    expect(EXERCISE_SLUGS_BY_DAY_TYPE.full_body.length).toBeGreaterThan(0);
  });
});

describe('TARGETS_BY_EXPERIENCE', () => {
  it('has entries for beginner, intermediate, advanced', () => {
    expect(TARGETS_BY_EXPERIENCE.beginner.sets).toBe(3);
    expect(TARGETS_BY_EXPERIENCE.intermediate.sets).toBe(4);
    expect(TARGETS_BY_EXPERIENCE.advanced.sets).toBe(5);
  });
});
