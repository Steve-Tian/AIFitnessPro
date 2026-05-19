package com.aifitnesspro.android.core.settings

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class ConsentRepositoryTest {
    @Test
    fun currentConsentRequiresAcceptedMatchingVersions() {
        val consent = ConsentState(
            accepted = true,
            privacyVersion = "2026-05-18",
            termsVersion = "2026-05-18"
        )

        assertTrue(consent.isCurrent("2026-05-18", "2026-05-18"))
        assertFalse(consent.isCurrent("2026-05-19", "2026-05-18"))
        assertFalse(consent.copy(accepted = false).isCurrent("2026-05-18", "2026-05-18"))
    }
}
