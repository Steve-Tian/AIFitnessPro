package com.aifitnesspro.android

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import com.aifitnesspro.android.core.api.AIFitnessApiClient
import com.aifitnesspro.android.core.plan.PlanRepository
import com.aifitnesspro.android.core.session.ApiConnectionState
import com.aifitnesspro.android.core.session.ApiSessionRepository
import com.aifitnesspro.android.core.settings.ConsentRepository
import com.aifitnesspro.android.core.settings.ConsentState
import com.aifitnesspro.android.core.workout.WorkoutSessionRepository
import com.aifitnesspro.android.feature.consent.ConsentScreen
import com.aifitnesspro.android.feature.onboarding.OnboardingScreen
import com.aifitnesspro.android.navigation.AppNavHost
import kotlinx.coroutines.launch

private const val PRIVACY_VERSION = "2026-05-18"
private const val TERMS_VERSION = "2026-05-18"

@Composable
fun AIFitnessProApp(
    consentRepository: ConsentRepository,
    apiSessionRepository: ApiSessionRepository,
    apiClient: AIFitnessApiClient,
    planRepository: PlanRepository,
    workoutRepository: WorkoutSessionRepository
) {
    val scope = rememberCoroutineScope()
    val consent by consentRepository.consentState.collectAsState(initial = ConsentState.Empty)
    var apiConnectionState by remember { mutableStateOf<ApiConnectionState>(ApiConnectionState.Idle) }
    var onboardingCompleted by remember { mutableStateOf(false) }

    if (consent.isCurrent(PRIVACY_VERSION, TERMS_VERSION)) {
        LaunchedEffect(apiSessionRepository) {
            apiConnectionState = ApiConnectionState.Connecting
            apiConnectionState = runCatching {
                val user = apiSessionRepository.ensureDevelopmentUser()
                onboardingCompleted = user.onboardingCompleted
                ApiConnectionState.Connected(user)
            }.getOrElse { error ->
                ApiConnectionState.Failed(error.message ?: "无法连接本地后端")
            }
        }

        val connected = apiConnectionState as? ApiConnectionState.Connected
        if (connected != null && !onboardingCompleted) {
            OnboardingScreen(
                onComplete = { formState ->
                    apiClient.upsertProfile(connected.user.id, formState.toRequest())
                    planRepository.generateAndCache(connected.user.id)
                    onboardingCompleted = true
                }
            )
        } else {
            AppNavHost(
                apiConnectionState = apiConnectionState,
                planRepository = planRepository,
                workoutRepository = workoutRepository
            )
        }
    } else {
        ConsentScreen(
            privacyVersion = PRIVACY_VERSION,
            termsVersion = TERMS_VERSION,
            onAccept = {
                scope.launch { consentRepository.accept(PRIVACY_VERSION, TERMS_VERSION) }
            },
            onDecline = {}
        )
    }
}
