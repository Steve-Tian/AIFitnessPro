package com.aifitnesspro.android.core.api

data class ApiRequest(
    val method: String,
    val path: String,
    val headers: Map<String, String> = emptyMap(),
    val body: String = ""
)

data class ApiResponse(
    val statusCode: Int,
    val body: String
)

interface ApiTransport {
    suspend fun execute(request: ApiRequest): ApiResponse
}
