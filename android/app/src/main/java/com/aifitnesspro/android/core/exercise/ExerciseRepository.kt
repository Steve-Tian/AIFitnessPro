package com.aifitnesspro.android.core.exercise

import com.aifitnesspro.android.core.api.ApiExerciseDetail
import com.aifitnesspro.android.core.api.ApiExerciseSummary
import com.aifitnesspro.android.core.api.ExerciseApi

class ExerciseRepository(
    private val api: ExerciseApi
) {
    suspend fun listExercises(
        devUserId: String,
        category: String? = null,
        difficulty: String? = null,
        equipment: String? = null,
        query: String? = null
    ): List<ApiExerciseSummary> = api.listExercises(
        devUserId = devUserId,
        category = category,
        difficulty = difficulty,
        equipment = equipment,
        query = query
    )

    suspend fun getExercise(devUserId: String, slug: String): ApiExerciseDetail =
        api.getExercise(devUserId, slug)
}
