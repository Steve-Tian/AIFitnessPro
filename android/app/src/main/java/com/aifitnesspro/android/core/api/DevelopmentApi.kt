package com.aifitnesspro.android.core.api

interface DevelopmentApi {
    suspend fun createDevelopmentUser(request: CreateDevelopmentUserRequest): ApiUser

    suspend fun getCurrentUser(devUserId: String): ApiUser
}
