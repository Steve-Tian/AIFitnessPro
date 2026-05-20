package com.aifitnesspro.android.core.plan

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.aifitnesspro.android.core.api.ApiActivePlan
import com.aifitnesspro.android.core.api.ApiPlanDay
import com.aifitnesspro.android.core.api.PlanApi
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

private val Context.planDataStore by preferencesDataStore(name = "active_plan")

interface PlanStore {
    fun getPlan(): Flow<ApiActivePlan?>
    suspend fun savePlan(plan: ApiActivePlan)
}

class DataStorePlanStore(private val context: Context) : PlanStore {
    private val json = Json { ignoreUnknownKeys = true; explicitNulls = false }

    override fun getPlan(): Flow<ApiActivePlan?> = context.planDataStore.data.map { prefs ->
        prefs[KEY_PLAN_JSON]?.let { runCatching { json.decodeFromString<ApiActivePlan>(it) }.getOrNull() }
    }

    override suspend fun savePlan(plan: ApiActivePlan) {
        context.planDataStore.edit { prefs ->
            prefs[KEY_PLAN_JSON] = json.encodeToString(plan)
        }
    }

    companion object {
        private val KEY_PLAN_JSON = stringPreferencesKey("plan_json")
    }
}

class PlanRepository(
    private val store: PlanStore,
    private val api: PlanApi
) {
    fun getActivePlan(): Flow<ApiActivePlan?> = store.getPlan()

    suspend fun generateAndCache(devUserId: String) {
        val plan = api.generatePlan(devUserId)
        store.savePlan(plan)
    }

    suspend fun refreshFromRemote(devUserId: String) {
        runCatching { api.getActivePlan(devUserId) }.onSuccess { store.savePlan(it) }
    }
}

fun findTodayDay(plan: ApiActivePlan, todayDate: String): ApiPlanDay? =
    plan.days.find { it.scheduledDate == todayDate }
