package com.aifitnesspro.android.core.session

import com.aifitnesspro.android.core.api.ApiUser

sealed interface ApiConnectionState {
    data object Idle : ApiConnectionState

    data object Connecting : ApiConnectionState

    data class Connected(
        val user: ApiUser
    ) : ApiConnectionState

    data class Failed(
        val message: String
    ) : ApiConnectionState
}
