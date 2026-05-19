package com.aifitnesspro.android.core.api

import com.aifitnesspro.android.BuildConfig

object ApiConfig {
    const val DEFAULT_LOCAL_BACKEND_BASE_URL = "http://10.0.2.2:8000/"

    val backendBaseUrl: String = normalizeBaseUrl(BuildConfig.AIFITNESSPRO_API_BASE_URL)

    fun normalizeBaseUrl(rawBaseUrl: String): String {
        val trimmed = rawBaseUrl.trim()
        require(trimmed.isNotEmpty()) { "API base URL must not be blank." }
        return if (trimmed.endsWith("/")) trimmed else "$trimmed/"
    }
}
