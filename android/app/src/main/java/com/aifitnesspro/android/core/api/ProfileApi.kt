package com.aifitnesspro.android.core.api

interface ProfileApi {
    suspend fun upsertProfile(devUserId: String, request: UpsertProfileRequest): ApiUser
    suspend fun getUserStats(devUserId: String): ApiUserStats
    suspend fun listAchievements(devUserId: String): List<ApiAchievement>
    suspend fun deleteAccount(devUserId: String)
}
