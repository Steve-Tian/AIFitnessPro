package com.aifitnesspro.android.core.api

import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

class AIFitnessApiClient(
    private val transport: ApiTransport,
    private val json: Json = Json {
        ignoreUnknownKeys = true
        explicitNulls = false
    }
) : DevelopmentApi {
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
