package com.aifitnesspro.android.core.api

import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class AIFitnessApiClientTest {
    @Test
    fun healthRequestsBackendHealthEndpoint() = runTest {
        val transport = RecordingTransport(
            ApiResponse(
                statusCode = 200,
                body = """{"status":"ok","service":"aifitnesspro-backend","database":"ok"}"""
            )
        )
        val client = AIFitnessApiClient(transport)

        val health = client.health()

        assertEquals("GET", transport.lastRequest.method)
        assertEquals("health", transport.lastRequest.path)
        assertEquals("ok", health.status)
        assertEquals("aifitnesspro-backend", health.service)
        assertEquals("ok", health.database)
    }

    @Test
    fun createDevelopmentUserPostsDeviceIdentity() = runTest {
        val transport = RecordingTransport(userResponse("dev-user-1", onboardingCompleted = false))
        val client = AIFitnessApiClient(transport)

        val user = client.createDevelopmentUser(
            CreateDevelopmentUserRequest(
                deviceLabel = "Pixel 8 local",
                externalId = "android-local-device"
            )
        )

        assertEquals("POST", transport.lastRequest.method)
        assertEquals("v1/dev/users", transport.lastRequest.path)
        assertEquals("application/json; charset=utf-8", transport.lastRequest.headers["Content-Type"])
        assertTrue(transport.lastRequest.body.contains("Pixel 8 local"))
        assertTrue(transport.lastRequest.body.contains("android-local-device"))
        assertEquals("dev-user-1", user.id)
        assertEquals(false, user.onboardingCompleted)
    }

    @Test
    fun getCurrentUserSendsDevelopmentUserHeader() = runTest {
        val transport = RecordingTransport(userResponse("dev-user-2", onboardingCompleted = true))
        val client = AIFitnessApiClient(transport)

        val user = client.getCurrentUser("dev-user-2")

        assertEquals("GET", transport.lastRequest.method)
        assertEquals("v1/users/me", transport.lastRequest.path)
        assertEquals("dev-user-2", transport.lastRequest.headers["X-Dev-User-Id"])
        assertEquals("dev-user-2", user.id)
        assertEquals(true, user.onboardingCompleted)
    }

    private fun userResponse(id: String, onboardingCompleted: Boolean): ApiResponse {
        return ApiResponse(
            statusCode = 200,
            body = """
                {
                  "user": {
                    "id": "$id",
                    "deviceLabel": "Pixel 8 local",
                    "onboardingCompleted": $onboardingCompleted,
                    "createdAt": "2026-05-19T00:00:00.000Z",
                    "profile": null,
                    "settings": {
                      "locale": "zh-CN",
                      "unit": "metric"
                    }
                  }
                }
            """.trimIndent()
        )
    }
}

private class RecordingTransport(
    private val response: ApiResponse
) : ApiTransport {
    lateinit var lastRequest: ApiRequest

    override suspend fun execute(request: ApiRequest): ApiResponse {
        lastRequest = request
        return response
    }
}
