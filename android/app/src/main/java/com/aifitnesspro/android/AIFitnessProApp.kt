package com.aifitnesspro.android

import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import com.aifitnesspro.android.core.session.ApiConnectionState
import com.aifitnesspro.android.core.session.ApiSessionRepository
import androidx.compose.runtime.rememberCoroutineScope
import com.aifitnesspro.android.core.settings.ConsentRepository
import com.aifitnesspro.android.core.settings.ConsentState
import com.aifitnesspro.android.feature.consent.ConsentScreen
import com.aifitnesspro.android.navigation.AppNavHost
import kotlinx.coroutines.launch

private const val PRIVACY_VERSION = "2026-05-18"
private const val TERMS_VERSION = "2026-05-18"

@Composable
fun AIFitnessProApp(
    consentRepository: ConsentRepository,
    apiSessionRepository: ApiSessionRepository
) {
    val scope = rememberCoroutineScope()
    val consent by consentRepository.consentState.collectAsState(initial = ConsentState.Empty)
    var apiConnectionState by remember { mutableStateOf<ApiConnectionState>(ApiConnectionState.Idle) }

    if (consent.isCurrent(PRIVACY_VERSION, TERMS_VERSION)) {
        LaunchedEffect(apiSessionRepository) {
            apiConnectionState = ApiConnectionState.Connecting
            apiConnectionState = runCatching {
                ApiConnectionState.Connected(apiSessionRepository.ensureDevelopmentUser())
            }.getOrElse { error ->
                ApiConnectionState.Failed(error.message ?: "无法连接本地后端")
            }
        }
        AppNavHost(apiConnectionState = apiConnectionState)
    } else {
        ConsentScreen(
            privacyVersion = PRIVACY_VERSION,
            termsVersion = TERMS_VERSION,
            onAccept = {
                scope.launch {
                    consentRepository.accept(PRIVACY_VERSION, TERMS_VERSION)
                }
            },
            onDecline = {
                // Keep the user on the consent screen. A later plan can add a limited explanation screen.
            }
        )
    }
}
