import { Exercise, ExerciseMedia } from '@prisma/client';

type ExerciseWithMedia = Exercise & { media: ExerciseMedia[] };

export function presentExerciseMedia(media: ExerciseMedia) {
  return {
    id: media.id,
    mediaType: media.mediaType,
    url: media.url,
    source: media.source,
    license: media.license,
    sortOrder: media.sortOrder,
  };
}

export function presentExerciseSummary(exercise: ExerciseWithMedia) {
  const primaryMedia = exercise.media[0] ?? null;
  return {
    slug: exercise.slug,
    nameCn: exercise.nameCn,
    aliases: exercise.aliases,
    category: exercise.category,
    primaryMuscles: exercise.primaryMuscles,
    equipment: exercise.equipment,
    difficulty: exercise.difficulty,
    previewMediaUrl: primaryMedia?.url ?? null,
    previewMediaType: primaryMedia?.mediaType ?? null,
  };
}

export function presentExerciseDetail(exercise: ExerciseWithMedia) {
  return {
    ...presentExerciseSummary(exercise),
    instructions: exercise.instructions,
    commonMistakes: exercise.commonMistakes,
    safetyNotes: exercise.safetyNotes,
    media: exercise.media.map(presentExerciseMedia),
  };
}
