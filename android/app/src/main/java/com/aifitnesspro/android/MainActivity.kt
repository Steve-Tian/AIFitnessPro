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
import com.aifitnesspro.android.core.workout.WorkoutSyncRepository
import com.aifitnesspro.android.core.exercise.ExerciseRepository
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
        val workoutDao = WorkoutDatabase.create(applicationContext).workoutDao()
        val workoutRepository = WorkoutSessionRepository(dao = workoutDao)
        val workoutSyncRepository = WorkoutSyncRepository(
            dao = workoutDao,
            workoutApi = apiClient
        )
        val exerciseRepository = ExerciseRepository(api = apiClient)
        setContent {
            AIFitnessProTheme {
                AIFitnessProApp(
                    consentRepository = consentRepository,
                    apiSessionRepository = apiSessionRepository,
                    apiClient = apiClient,
                    planRepository = planRepository,
                    workoutRepository = workoutRepository,
                    workoutSyncRepository = workoutSyncRepository,
                    exerciseRepository = exerciseRepository
                )
            }
        }
    }
}
