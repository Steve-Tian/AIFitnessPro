package com.aifitnesspro.android.core.api

import org.junit.Assert.assertEquals
import org.junit.Test

class ApiConfigTest {
    @Test
    fun normalizedBaseUrlAlwaysEndsWithSlash() {
        assertEquals(
            "http://10.0.2.2:8000/",
            ApiConfig.normalizeBaseUrl(" http://10.0.2.2:8000 ")
        )
    }

    @Test
    fun localEmulatorBaseUrlTargetsHostBackend() {
        assertEquals("http://10.0.2.2:8000/", ApiConfig.DEFAULT_LOCAL_BACKEND_BASE_URL)
    }
}
