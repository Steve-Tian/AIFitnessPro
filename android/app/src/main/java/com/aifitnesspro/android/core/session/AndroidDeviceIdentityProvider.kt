package com.aifitnesspro.android.core.session

import android.content.Context
import android.os.Build
import android.provider.Settings

class AndroidDeviceIdentityProvider(
    private val context: Context
) {
    fun get(): DeviceIdentity {
        val androidId = Settings.Secure.getString(
            context.contentResolver,
            Settings.Secure.ANDROID_ID
        ).orEmpty()
        val model = Build.MODEL.ifBlank { "Android device" }
        return DeviceIdentity(
            label = "AIFitnessPro $model",
            externalId = "android-$androidId"
        )
    }
}
