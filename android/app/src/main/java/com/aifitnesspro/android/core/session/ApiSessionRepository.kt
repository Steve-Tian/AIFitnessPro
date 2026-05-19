package com.aifitnesspro.android.core.session

import com.aifitnesspro.android.core.api.ApiException
import com.aifitnesspro.android.core.api.ApiUser
import com.aifitnesspro.android.core.api.CreateDevelopmentUserRequest
import com.aifitnesspro.android.core.api.DevelopmentApi
import kotlinx.coroutines.flow.first

class ApiSessionRepository(
    private val api: DevelopmentApi,
    private val store: ApiSessionStore,
    private val deviceIdentity: DeviceIdentity
) {
    suspend fun ensureDevelopmentUser(): ApiUser {
        val existingUserId = store.userId.first()
        if (!existingUserId.isNullOrBlank()) {
            val currentUser = runCatching { api.getCurrentUser(existingUserId) }
                .getOrElse { error ->
                    if (error is ApiException && error.statusCode == 401) {
                        store.clearUserId()
                        null
                    } else {
                        throw error
                    }
                }
            if (currentUser != null) return currentUser
        }

        val created = api.createDevelopmentUser(
            CreateDevelopmentUserRequest(
                deviceLabel = deviceIdentity.label,
                externalId = deviceIdentity.externalId
            )
        )
        store.saveUserId(created.id)
        return created
    }
}

data class DeviceIdentity(
    val label: String,
    val externalId: String
)
