package com.aifitnesspro.android.core.api

import kotlinx.serialization.Serializable

@Serializable
data class SyncWorkoutSetRequest(
    val id: String,
    val exerciseId: String,
    val setIndex: Int,
    val targetReps: Int? = null,
    val actualReps: Int,
    val weightKg: Double? = null,
    val completedAt: String? = null
)

@Serializable
data class SyncWorkoutSessionRequest(
    val id: String,
    val trainingPlanId: String,
    val planDayIndex: Int,
    val status: String,
    val startedAt: String? = null,
    val completedAt: String? = null,
    val durationSeconds: Int? = null
)

@Serializable
data class SyncWorkoutRequest(
    val session: SyncWorkoutSessionRequest,
    val sets: List<SyncWorkoutSetRequest>
)

@Serializable
data class ApiWorkoutSet(
    val id: String,
    val exerciseId: String,
    val nameCn: String,
    val setIndex: Int,
    val targetReps: Int? = null,
    val actualReps: Int? = null,
    val weightKg: Double? = null,
    val completedAt: String? = null
)

@Serializable
data class ApiWorkoutSession(
    val id: String,
    val trainingPlanId: String? = null,
    val planDayId: String? = null,
    val status: String,
    val startedAt: String? = null,
    val completedAt: String? = null,
    val durationSeconds: Int? = null,
    val sets: List<ApiWorkoutSet> = emptyList()
)

@Serializable
internal data class WorkoutSessionEnvelope(val session: ApiWorkoutSession)
