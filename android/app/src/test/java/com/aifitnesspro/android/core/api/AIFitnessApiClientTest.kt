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
    fun upsertProfileReturnsUserOnSuccess() = runTest {
        val transport = RecordingTransport(
            ApiResponse(
                statusCode = 200,
                body = """{"user":{"id":"u1","deviceLabel":"Pixel","onboardingCompleted":true,"createdAt":"2026-05-20T00:00:00Z"}}"""
            )
        )
        val client = AIFitnessApiClient(transport)

        val result = client.upsertProfile(
            devUserId = "u1",
            request = UpsertProfileRequest(
                gender = "male", age = 25, heightCm = 175, weightKg = 70.0,
                goal = "strength", experience = "beginner", daysPerWeek = 3,
                equipment = listOf("full_gym"), persona = "coach"
            )
        )

        assertEquals("u1", result.id)
        assertEquals(true, result.onboardingCompleted)
        assertEquals("PUT", transport.lastRequest.method)
        assertEquals("v1/users/me/profile", transport.lastRequest.path)
        assertEquals("u1", transport.lastRequest.headers["X-Dev-User-Id"])
    }

    @Test
    fun generatePlanReturnsPlanOnSuccess() = runTest {
        val planJson = """{"plan":{"id":"p1","status":"active","startDate":"2026-05-20","days":[]}}"""
        val transport = RecordingTransport(ApiResponse(statusCode = 201, body = planJson))
        val client = AIFitnessApiClient(transport)

        val result = client.generatePlan("u1")

        assertEquals("p1", result.id)
        assertEquals("active", result.status)
        assertEquals("POST", transport.lastRequest.method)
        assertEquals("v1/plans/generate", transport.lastRequest.path)
    }

    @Test
    fun getActivePlanReturnsPlanOnSuccess() = runTest {
        val planJson = """{"plan":{"id":"p2","status":"active","startDate":"2026-05-20","days":[]}}"""
        val transport = RecordingTransport(ApiResponse(statusCode = 200, body = planJson))
        val client = AIFitnessApiClient(transport)

        val result = client.getActivePlan("u1")

        assertEquals("p2", result.id)
        assertEquals("GET", transport.lastRequest.method)
        assertEquals("v1/plans/active", transport.lastRequest.path)
    }

    @Test
    fun syncWorkoutSessionPostsCompletedSession() = runTest {
        val body = """
            {"session":{"id":"s1","status":"completed","trainingPlanId":"p1","planDayId":"d1","sets":[{"id":"set1","exerciseId":"e1","nameCn":"卧推","setIndex":1,"actualReps":10,"weightKg":40.0}]}}
        """.trimIndent()
        val transport = RecordingTransport(ApiResponse(statusCode = 200, body = body))
        val client = AIFitnessApiClient(transport)

        val result = client.syncWorkoutSession(
            devUserId = "u1",
            request = SyncWorkoutRequest(
                session = SyncWorkoutSessionRequest(
                    id = "s1",
                    trainingPlanId = "p1",
                    planDayIndex = 0,
                    status = "completed"
                ),
                sets = listOf(
                    SyncWorkoutSetRequest(
                        id = "set1",
                        exerciseId = "e1",
                        setIndex = 1,
                        actualReps = 10,
                        weightKg = 40.0
                    )
                )
            )
        )

        assertEquals("s1", result.id)
        assertEquals("POST", transport.lastRequest.method)
        assertEquals("v1/workouts/sessions/sync", transport.lastRequest.path)
        assertEquals("u1", transport.lastRequest.headers["X-Dev-User-Id"])
    }

    @Test
    fun listExercisesReturnsSummaries() = runTest {
        val body = """
            {"exercises":[{"slug":"bench_press","nameCn":"杠铃卧推","category":"push","difficulty":"intermediate","equipment":["full_gym"],"primaryMuscles":["chest"]}]}
        """.trimIndent()
        val transport = RecordingTransport(ApiResponse(statusCode = 200, body = body))
        val client = AIFitnessApiClient(transport)

        val result = client.listExercises(devUserId = "u1", category = "push", query = "卧推")

        assertEquals(1, result.size)
        assertEquals("bench_press", result[0].slug)
        assertEquals("GET", transport.lastRequest.method)
        assertTrue(transport.lastRequest.path.startsWith("v1/exercises?"))
        assertEquals("u1", transport.lastRequest.headers["X-Dev-User-Id"])
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
