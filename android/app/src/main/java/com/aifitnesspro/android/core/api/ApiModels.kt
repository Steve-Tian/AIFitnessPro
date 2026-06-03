package com.aifitnesspro.android.core.api

import kotlinx.serialization.Serializable

@Serializable
data class HealthResponse(
    val status: String,
    val service: String,
    val database: String
)

@Serializable
data class CreateDevelopmentUserRequest(
    val deviceLabel: String,
    val externalId: String
)

@Serializable
data class UpsertProfileRequest(
    val gender: String,
    val age: Int,
    val heightCm: Int,
    val weightKg: Double,
    val goal: String,
    val experience: String,
    val daysPerWeek: Int,
    val equipment: List<String>,
    val persona: String
)

@Serializable
data class ApiUser(
    val id: String,
    val deviceLabel: String,
    val onboardingCompleted: Boolean,
    val createdAt: String,
    val profile: ApiUserProfile? = null,
    val settings: ApiUserSettings? = null
)

@Serializable
data class ApiUserProfile(
    val gender: String,
    val age: Int,
    val heightCm: Int,
    val weightKg: Double,
    val goal: String,
    val experience: String,
    val daysPerWeek: Int,
    val equipment: List<String>,
    val persona: String
)

@Serializable
data class ApiUserSettings(
    val locale: String,
    val unit: String
)

@Serializable
data class ApiAchievement(
    val id: String,
    val slug: String,
    val nameCn: String,
    val descCn: String,
    val iconEmoji: String,
    val sortOrder: Int,
    val unlockedAt: String? = null
)

@Serializable
data class ApiUserStats(
    val completedSessions: Int,
    val currentStreak: Int,
    val longestStreak: Int,
    val totalDurationSeconds: Int
)

@Serializable
internal data class UserEnvelope(
    val user: ApiUser
)

@Serializable
internal data class ApiErrorEnvelope(
    val error: ApiErrorBody
)

@Serializable
internal data class ApiErrorBody(
    val code: String,
    val message: String
)

@Serializable
internal data class AchievementListEnvelope(
    val achievements: List<ApiAchievement>
)

@Serializable
internal data class StatsEnvelope(
    val stats: ApiUserStats
)
