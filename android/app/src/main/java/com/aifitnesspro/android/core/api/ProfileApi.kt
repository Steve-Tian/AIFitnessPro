package com.aifitnesspro.android.core.api

interface ProfileApi {
    suspend fun upsertProfile(devUserId: String, request: UpsertProfileRequest): ApiUser
}
