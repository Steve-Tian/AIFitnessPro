package com.aifitnesspro.android.core.session

import com.aifitnesspro.android.core.api.ApiUser
import com.aifitnesspro.android.core.api.CreateDevelopmentUserRequest
import com.aifitnesspro.android.core.api.DevelopmentApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Test

class ApiSessionRepositoryTest {
    @Test
    fun ensureDevelopmentUserCreatesAndStoresUserWhenMissing() = runTest {
        val store = InMemoryApiSessionStore()
        val api = FakeDevelopmentApi(createdUserId = "created-user")
        val repository = ApiSessionRepository(
            api = api,
            store = store,
            deviceIdentity = DeviceIdentity(
                label = "Pixel 8 local",
                externalId = "android-local-device"
            )
        )

        val user = repository.ensureDevelopmentUser()

        assertEquals("created-user", user.id)
        assertEquals("created-user", store.userId.value)
        assertEquals(1, api.createCalls)
        assertEquals("Pixel 8 local", api.lastCreateRequest.deviceLabel)
        assertEquals("android-local-device", api.lastCreateRequest.externalId)
    }

    @Test
    fun ensureDevelopmentUserReusesStoredUser() = runTest {
        val store = InMemoryApiSessionStore(initialUserId = "stored-user")
        val api = FakeDevelopmentApi(currentUserId = "stored-user")
        val repository = ApiSessionRepository(
            api = api,
            store = store,
            deviceIdentity = DeviceIdentity(
                label = "Pixel 8 local",
                externalId = "android-local-device"
            )
        )

        val user = repository.ensureDevelopmentUser()

        assertEquals("stored-user", user.id)
        assertEquals(1, api.currentUserCalls)
        assertEquals(0, api.createCalls)
    }
}

private class InMemoryApiSessionStore(
    initialUserId: String? = null
) : ApiSessionStore {
    override val userId = MutableStateFlow(initialUserId)

    override suspend fun saveUserId(userId: String) {
        this.userId.value = userId
    }

    override suspend fun clearUserId() {
        userId.value = null
    }
}

private class FakeDevelopmentApi(
    private val createdUserId: String = "created-user",
    private val currentUserId: String = "current-user"
) : DevelopmentApi {
    var createCalls = 0
    var currentUserCalls = 0
    lateinit var lastCreateRequest: CreateDevelopmentUserRequest

    override suspend fun createDevelopmentUser(request: CreateDevelopmentUserRequest): ApiUser {
        createCalls += 1
        lastCreateRequest = request
        return ApiUser(
            id = createdUserId,
            deviceLabel = request.deviceLabel,
            onboardingCompleted = false,
            createdAt = "2026-05-19T00:00:00.000Z",
            profile = null,
            settings = null
        )
    }

    override suspend fun getCurrentUser(devUserId: String): ApiUser {
        currentUserCalls += 1
        return ApiUser(
            id = currentUserId,
            deviceLabel = "Pixel 8 local",
            onboardingCompleted = false,
            createdAt = "2026-05-19T00:00:00.000Z",
            profile = null,
            settings = null
        )
    }
}
