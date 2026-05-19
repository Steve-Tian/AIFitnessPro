package com.aifitnesspro.android.core.settings

data class ConsentState(
    val accepted: Boolean,
    val privacyVersion: String,
    val termsVersion: String
) {
    fun isCurrent(
        requiredPrivacyVersion: String,
        requiredTermsVersion: String
    ): Boolean {
        return accepted &&
            privacyVersion == requiredPrivacyVersion &&
            termsVersion == requiredTermsVersion
    }

    companion object {
        val Empty = ConsentState(
            accepted = false,
            privacyVersion = "",
            termsVersion = ""
        )
    }
}
