package com.aifitnesspro.android.core.api

import java.net.HttpURLConnection
import java.net.URL
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class HttpUrlConnectionTransport(
    rawBaseUrl: String
) : ApiTransport {
    private val baseUrl = ApiConfig.normalizeBaseUrl(rawBaseUrl)

    override suspend fun execute(request: ApiRequest): ApiResponse = withContext(Dispatchers.IO) {
        val url = URL(baseUrl + request.path.trimStart('/'))
        val connection = (url.openConnection() as HttpURLConnection).apply {
            requestMethod = request.method
            connectTimeout = 5_000
            readTimeout = 5_000
            request.headers.forEach { (name, value) -> setRequestProperty(name, value) }
            if (request.body.isNotEmpty()) {
                doOutput = true
            }
        }

        try {
            if (request.body.isNotEmpty()) {
                connection.outputStream.use { output ->
                    output.write(request.body.toByteArray(Charsets.UTF_8))
                }
            }

            val statusCode = connection.responseCode
            val stream = if (statusCode in 200..299) connection.inputStream else connection.errorStream
            ApiResponse(
                statusCode = statusCode,
                body = stream?.bufferedReader(Charsets.UTF_8)?.use { it.readText() }.orEmpty()
            )
        } finally {
            connection.disconnect()
        }
    }
}
