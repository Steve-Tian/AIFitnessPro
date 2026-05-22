package com.aifitnesspro.android.core.api

import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

class AIFitnessApiClient(
    private val transport: ApiTransport,
    private val json: Json = Json {
        ignoreUnknownKeys = true
        explicitNulls = false
    }
) : DevelopmentApi, ProfileApi, PlanApi, WorkoutApi, ExerciseApi {
    suspend fun health(): HealthResponse {
        val response = transport.execute(ApiRequest(method = "GET", path = "health"))
        return decodeOrThrow(response)
    }

    override suspend fun createDevelopmentUser(request: CreateDevelopmentUserRequest): ApiUser {
        val response = transport.execute(
            ApiRequest(
                method = "POST",
                path = "v1/dev/users",
                headers = mapOf("Content-Type" to "application/json; charset=utf-8"),
                body = json.encodeToString(request)
            )
        )
        return decodeOrThrow<UserEnvelope>(response).user
    }

    override suspend fun getCurrentUser(devUserId: String): ApiUser {
        val response = transport.execute(
            ApiRequest(
                method = "GET",
                path = "v1/users/me",
                headers = mapOf("X-Dev-User-Id" to devUserId)
            )
        )
        return decodeOrThrow<UserEnvelope>(response).user
    }

    override suspend fun upsertProfile(devUserId: String, request: UpsertProfileRequest): ApiUser {
        val response = transport.execute(
            ApiRequest(
                method = "PUT",
                path = "v1/users/me/profile",
                headers = mapOf(
                    "Content-Type" to "application/json; charset=utf-8",
                    "X-Dev-User-Id" to devUserId
                ),
                body = json.encodeToString(request)
            )
        )
        return decodeOrThrow<UserEnvelope>(response).user
    }

    override suspend fun generatePlan(devUserId: String): ApiActivePlan {
        val response = transport.execute(
            ApiRequest(
                method = "POST",
                path = "v1/plans/generate",
                headers = mapOf(
                    "Content-Type" to "application/json; charset=utf-8",
                    "X-Dev-User-Id" to devUserId
                ),
                body = "{}"
            )
        )
        return decodeOrThrow<PlanEnvelope>(response).plan
    }

    override suspend fun getActivePlan(devUserId: String): ApiActivePlan {
        val response = transport.execute(
            ApiRequest(
                method = "GET",
                path = "v1/plans/active",
                headers = mapOf("X-Dev-User-Id" to devUserId)
            )
        )
        return decodeOrThrow<PlanEnvelope>(response).plan
    }

    override suspend fun syncWorkoutSession(devUserId: String, request: SyncWorkoutRequest): ApiWorkoutSession {
        val response = transport.execute(
            ApiRequest(
                method = "POST",
                path = "v1/workouts/sessions/sync",
                headers = mapOf(
                    "Content-Type" to "application/json; charset=utf-8",
                    "X-Dev-User-Id" to devUserId
                ),
                body = json.encodeToString(request)
            )
        )
        return decodeOrThrow<WorkoutSessionEnvelope>(response).session
    }

    override suspend fun listExercises(
        devUserId: String,
        category: String?,
        difficulty: String?,
        equipment: String?,
        query: String?
    ): List<ApiExerciseSummary> {
        val params = buildList {
            category?.takeIf { it.isNotBlank() }?.let { add("category=$it") }
            difficulty?.takeIf { it.isNotBlank() }?.let { add("difficulty=$it") }
            equipment?.takeIf { it.isNotBlank() }?.let { add("equipment=$it") }
            query?.takeIf { it.isNotBlank() }?.let { add("q=${java.net.URLEncoder.encode(it, Charsets.UTF_8.name())}") }
        }.joinToString("&")
        val path = if (params.isEmpty()) "v1/exercises" else "v1/exercises?$params"
        val response = transport.execute(
            ApiRequest(
                method = "GET",
                path = path,
                headers = mapOf("X-Dev-User-Id" to devUserId)
            )
        )
        return decodeOrThrow<ExerciseListEnvelope>(response).exercises
    }

    override suspend fun getExercise(devUserId: String, slug: String): ApiExerciseDetail {
        val response = transport.execute(
            ApiRequest(
                method = "GET",
                path = "v1/exercises/$slug",
                headers = mapOf("X-Dev-User-Id" to devUserId)
            )
        )
        return decodeOrThrow<ExerciseDetailEnvelope>(response).exercise
    }

    private inline fun <reified T> decodeOrThrow(response: ApiResponse): T {
        if (response.statusCode in 200..299) {
            return json.decodeFromString(response.body)
        }

        val apiError = runCatching {
            json.decodeFromString<ApiErrorEnvelope>(response.body).error
        }.getOrNull()
        throw ApiException(
            statusCode = response.statusCode,
            code = apiError?.code ?: "HTTP_${response.statusCode}",
            message = apiError?.message ?: "网络请求失败"
        )
    }
}

class ApiException(
    val statusCode: Int,
    val code: String,
    override val message: String
) : RuntimeException(message)
