package com.aifitnesspro.android.core.session

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.apiSessionDataStore by preferencesDataStore(name = "api_session")

interface ApiSessionStore {
    val userId: Flow<String?>

    suspend fun saveUserId(userId: String)

    suspend fun clearUserId()
}

class DataStoreApiSessionStore(
    private val context: Context
) : ApiSessionStore {
    override val userId: Flow<String?> = context.apiSessionDataStore.data.map { prefs ->
        prefs[KEY_DEV_USER_ID]
    }

    override suspend fun saveUserId(userId: String) {
        context.apiSessionDataStore.edit { prefs ->
            prefs[KEY_DEV_USER_ID] = userId
        }
    }

    override suspend fun clearUserId() {
        context.apiSessionDataStore.edit { prefs ->
            prefs.remove(KEY_DEV_USER_ID)
        }
    }

    companion object {
        private val KEY_DEV_USER_ID = stringPreferencesKey("dev_user_id")
    }
}
