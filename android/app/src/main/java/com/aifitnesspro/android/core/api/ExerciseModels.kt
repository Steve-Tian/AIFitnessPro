package com.aifitnesspro.android.core.api

import kotlinx.serialization.Serializable

@Serializable
data class ApiExerciseSummary(
    val slug: String,
    val nameCn: String,
    val aliases: List<String> = emptyList(),
    val category: String,
    val primaryMuscles: List<String> = emptyList(),
    val equipment: List<String> = emptyList(),
    val difficulty: String,
    val previewMediaUrl: String? = null,
    val previewMediaType: String? = null
)

@Serializable
data class ApiExerciseMedia(
    val id: String,
    val mediaType: String,
    val url: String,
    val source: String,
    val license: String,
    val sortOrder: Int = 0
)

@Serializable
data class ApiExerciseDetail(
    val slug: String,
    val nameCn: String,
    val aliases: List<String> = emptyList(),
    val category: String,
    val primaryMuscles: List<String> = emptyList(),
    val equipment: List<String> = emptyList(),
    val difficulty: String,
    val previewMediaUrl: String? = null,
    val previewMediaType: String? = null,
    val instructions: List<String> = emptyList(),
    val commonMistakes: List<String> = emptyList(),
    val safetyNotes: List<String> = emptyList(),
    val media: List<ApiExerciseMedia> = emptyList()
)

@Serializable
internal data class ExerciseListEnvelope(val exercises: List<ApiExerciseSummary>)

@Serializable
internal data class ExerciseDetailEnvelope(val exercise: ApiExerciseDetail)
