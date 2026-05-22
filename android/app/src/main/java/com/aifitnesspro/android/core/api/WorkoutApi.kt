package com.aifitnesspro.android.core.api

interface WorkoutApi {
    suspend fun syncWorkoutSession(devUserId: String, request: SyncWorkoutRequest): ApiWorkoutSession
}
