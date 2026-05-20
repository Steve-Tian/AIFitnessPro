package com.aifitnesspro.android.core.api

import kotlinx.serialization.Serializable

@Serializable
data class ApiPlanExercise(
    val exerciseId: String,
    val nameCn: String,
    val targetSets: Int,
    val targetReps: Int,
    val targetRestSeconds: Int,
    val recommendedWeightKg: Double? = null
)

@Serializable
data class ApiPlanDay(
    val dayIndex: Int,
    val dayType: String,
    val scheduledDate: String?,
    val dayNote: String? = null,
    val exercises: List<ApiPlanExercise> = emptyList()
)

@Serializable
data class ApiActivePlan(
    val id: String,
    val status: String,
    val startDate: String?,
    val days: List<ApiPlanDay> = emptyList()
)

@Serializable
internal data class PlanEnvelope(val plan: ApiActivePlan)
