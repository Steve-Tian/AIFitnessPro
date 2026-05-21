package com.aifitnesspro.android

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import com.aifitnesspro.android.core.api.AIFitnessApiClient
import com.aifitnesspro.android.core.api.ApiConfig
import com.aifitnesspro.android.core.api.HttpUrlConnectionTransport
import com.aifitnesspro.android.core.plan.DataStorePlanStore
import com.aifitnesspro.android.core.plan.PlanRepository
import com.aifitnesspro.android.core.session.AndroidDeviceIdentityProvider
import com.aifitnesspro.android.core.session.ApiSessionRepository
import com.aifitnesspro.android.core.session.DataStoreApiSessionStore
import com.aifitnesspro.android.core.settings.ConsentRepository
import com.aifitnesspro.android.core.ui.AIFitnessProTheme
import com.aifitnesspro.android.core.workout.WorkoutSessionRepository
import com.aifitnesspro.android.core.workout.local.WorkoutDatabase

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val consentRepository = ConsentRepository(applicationContext)
        val apiClient = AIFitnessApiClient(
            transport = HttpUrlConnectionTransport(ApiConfig.backendBaseUrl)
        )
        val apiSessionRepository = ApiSessionRepository(
            api = apiClient,
            store = DataStoreApiSessionStore(applicationContext),
            deviceIdentity = AndroidDeviceIdentityProvider(applicationContext).get()
        )
        val planRepository = PlanRepository(
            store = DataStorePlanStore(applicationContext),
            api = apiClient
        )
        val workoutRepository = WorkoutSessionRepository(
            dao = WorkoutDatabase.create(applicationContext).workoutDao()
        )
        setContent {
            AIFitnessProTheme {
                AIFitnessProApp(
                    consentRepository = consentRepository,
                    apiSessionRepository = apiSessionRepository,
                    apiClient = apiClient,
                    planRepository = planRepository,
                    workoutRepository = workoutRepository
                )
            }
        }
    }
}
