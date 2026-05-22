package com.aifitnesspro.android.core.api

interface ExerciseApi {
    suspend fun listExercises(
        devUserId: String,
        category: String? = null,
        difficulty: String? = null,
        equipment: String? = null,
        query: String? = null
    ): List<ApiExerciseSummary>

    suspend fun getExercise(devUserId: String, slug: String): ApiExerciseDetail
}
