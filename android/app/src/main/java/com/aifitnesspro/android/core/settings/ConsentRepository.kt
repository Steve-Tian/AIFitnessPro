package com.aifitnesspro.android.core.settings

import android.content.Context
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.consentDataStore by preferencesDataStore(name = "consent")

class ConsentRepository(
    private val context: Context
) {
    val consentState: Flow<ConsentState> = context.consentDataStore.data.map { prefs ->
        ConsentState(
            accepted = prefs[KEY_ACCEPTED] ?: false,
            privacyVersion = prefs[KEY_PRIVACY_VERSION] ?: "",
            termsVersion = prefs[KEY_TERMS_VERSION] ?: ""
        )
    }

    suspend fun accept(
        privacyVersion: String,
        termsVersion: String
    ) {
        context.consentDataStore.edit { prefs ->
            prefs[KEY_ACCEPTED] = true
            prefs[KEY_PRIVACY_VERSION] = privacyVersion
            prefs[KEY_TERMS_VERSION] = termsVersion
        }
    }

    companion object {
        private val KEY_ACCEPTED = booleanPreferencesKey("accepted")
        private val KEY_PRIVACY_VERSION = stringPreferencesKey("privacy_version")
        private val KEY_TERMS_VERSION = stringPreferencesKey("terms_version")
    }
}
