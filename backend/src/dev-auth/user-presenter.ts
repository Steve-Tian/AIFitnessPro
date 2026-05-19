import { User, UserProfile, UserSettings } from '@prisma/client';

type UserWithRelations = User & {
  profile?: UserProfile | null;
  settings?: UserSettings | null;
};

export function presentUser(user: UserWithRelations) {
  return {
    id: user.id,
    deviceLabel: user.deviceLabel,
    onboardingCompleted: user.onboardingCompleted,
    createdAt: user.createdAt.toISOString(),
    ...(user.profile !== undefined
      ? {
          profile: user.profile
            ? {
                gender: user.profile.gender,
                age: user.profile.age,
                heightCm: user.profile.heightCm,
                weightKg: Number(user.profile.weightKg),
                goal: user.profile.goal,
                experience: user.profile.experience,
                daysPerWeek: user.profile.daysPerWeek,
                equipment: user.profile.equipment,
                persona: user.profile.persona,
              }
            : null,
        }
      : {}),
    ...(user.settings
      ? {
          settings: {
            locale: user.settings.locale,
            unit: user.settings.unit,
          },
        }
      : {}),
  };
}
