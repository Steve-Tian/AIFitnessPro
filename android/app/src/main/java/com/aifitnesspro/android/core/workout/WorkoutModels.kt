package com.aifitnesspro.android.core.workout

import com.aifitnesspro.android.core.api.ApiPlanDay
import com.aifitnesspro.android.core.api.ApiPlanExercise
import kotlinx.serialization.Serializable

enum class WorkoutStatus {
    NOT_STARTED,
    IN_PROGRESS,
    RESTING,
    PAUSED,
    COMPLETED,
    ABANDONED;

    fun isActive(): Boolean = this == IN_PROGRESS || this == RESTING || this == PAUSED
}

@Serializable
data class WorkoutExercisePlan(
    val exerciseId: String,
    val nameCn: String,
    val targetSets: Int,
    val targetReps: Int,
    val targetRestSeconds: Int,
    val recommendedWeightKg: Double? = null
)

data class CompletedSetRecord(
    val exerciseId: String,
    val exerciseNameCn: String,
    val setIndex: Int,
    val targetReps: Int,
    val actualReps: Int,
    val weightKg: Double?,
    val completedAtEpochMs: Long
)

data class WorkoutSessionSnapshot(
    val sessionId: String,
    val planId: String,
    val planDayIndex: Int,
    val dayType: String,
    val scheduledDate: String?,
    val status: WorkoutStatus,
    val exercises: List<WorkoutExercisePlan>,
    val exerciseIndex: Int,
    val setIndex: Int,
    val restSecondsRemaining: Int?,
    val weightInput: String,
    val repsInput: String,
    val startedAtEpochMs: Long?,
    val completedAtEpochMs: Long?
) {
    val currentExercise: WorkoutExercisePlan?
        get() = exercises.getOrNull(exerciseIndex)

    val totalSets: Int
        get() = exercises.sumOf { it.targetSets }

    val completedSetCount: Int
        get() {
            var count = 0
            exercises.forEachIndexed { index, exercise ->
                when {
                    index < exerciseIndex -> count += exercise.targetSets
                    index == exerciseIndex -> count += (setIndex - 1).coerceAtLeast(0)
                }
            }
            return count
        }
}

fun ApiPlanExercise.toWorkoutExercisePlan() = WorkoutExercisePlan(
    exerciseId = exerciseId,
    nameCn = nameCn,
    targetSets = targetSets,
    targetReps = targetReps,
    targetRestSeconds = targetRestSeconds,
    recommendedWeightKg = recommendedWeightKg
)

fun ApiPlanDay.toWorkoutExercises(): List<WorkoutExercisePlan> =
    exercises.map { it.toWorkoutExercisePlan() }
