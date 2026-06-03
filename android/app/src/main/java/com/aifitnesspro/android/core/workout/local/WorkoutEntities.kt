package com.aifitnesspro.android.core.workout.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "workout_sessions")
data class WorkoutSessionEntity(
    @PrimaryKey val id: String,
    val planId: String,
    val planDayIndex: Int,
    val dayType: String,
    val scheduledDate: String?,
    val status: String,
    val exercisesJson: String,
    val exerciseIndex: Int,
    val setIndex: Int,
    val restSecondsRemaining: Int?,
    val weightInput: String,
    val repsInput: String,
    val startedAtEpochMs: Long?,
    val completedAtEpochMs: Long?,
    val updatedAtEpochMs: Long,
    val syncStatus: String = "none",
    val exerciseFeedbackJson: String = "[]"
)

@Entity(tableName = "workout_sets")
data class WorkoutSetEntity(
    @PrimaryKey val id: String,
    val sessionId: String,
    val exerciseId: String,
    val exerciseNameCn: String,
    val setIndex: Int,
    val targetReps: Int,
    val actualReps: Int,
    val weightKg: Double?,
    val completedAtEpochMs: Long
)
