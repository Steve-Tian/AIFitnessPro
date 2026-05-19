# Android Foundation and Compliance Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the native Android app foundation for AIFitnessPro with privacy consent gating, four-tab navigation, local settings persistence, and placeholder product screens.

**Architecture:** Add a new `android/` project beside the existing mini program, using Kotlin + Jetpack Compose. The first shell stores privacy consent in DataStore, blocks the main app until consent is accepted, and provides Home, Training, Exercise Library, and Profile tabs with stable navigation boundaries for later feature plans.

**Tech Stack:** Kotlin, Gradle, Android Gradle Plugin, Jetpack Compose, Navigation Compose, DataStore, JUnit.

## Current Execution Status

- Android foundation files are implemented in `android/` on branch `codex-android-foundation-compliance-shell`.
- Consent gating, DataStore consent persistence, four-tab Navigation Compose shell, and product-boundary placeholder screens are in place.
- Local Android build environment is installed: Homebrew `openjdk@17`, Android command line tools, `platforms;android-35`, `build-tools;35.0.0`, and `platform-tools`.
- Android unit tests pass: `./gradlew :app:testDebugUnitTest`.
- Android debug APK build passes: `./gradlew :app:assembleDebug`.
- Manual emulator smoke test passes on `AIFitnessPro_API35`: first launch consent, accept-to-main, four-tab navigation, relaunch consent persistence, and minimal permission surface verified.

---

## File Structure

Create the Android project under `android/` so the existing mini program stays untouched.

```text
android/
  gradlew
  gradlew.bat
  settings.gradle.kts
  build.gradle.kts
  gradle.properties
  gradle/wrapper/gradle-wrapper.properties
  gradle/wrapper/gradle-wrapper.jar
  app/
    build.gradle.kts
    src/main/
      AndroidManifest.xml
      res/drawable/ic_launcher_foreground.xml
      res/mipmap-anydpi-v26/ic_launcher.xml
      res/mipmap-anydpi-v26/ic_launcher_round.xml
      res/values/styles.xml
      res/xml/backup_rules.xml
      res/xml/data_extraction_rules.xml
      java/com/aifitnesspro/android/
        MainActivity.kt
        AIFitnessProApp.kt
        core/settings/ConsentRepository.kt
        core/settings/ConsentState.kt
        core/ui/AppTheme.kt
        core/ui/UiText.kt
        navigation/AppDestination.kt
        navigation/AppNavHost.kt
        feature/consent/ConsentScreen.kt
        feature/home/HomeScreen.kt
        feature/training/TrainingScreen.kt
        feature/exercise/ExerciseLibraryScreen.kt
        feature/profile/ProfileScreen.kt
    src/test/java/com/aifitnesspro/android/
      core/settings/ConsentRepositoryTest.kt
      navigation/AppDestinationTest.kt
```

Responsibilities:

- `MainActivity.kt`: Android entry point.
- `AIFitnessProApp.kt`: top-level Compose app; switches between consent and main app.
- `ConsentRepository.kt`: DataStore-backed consent persistence.
- `ConsentState.kt`: consent version and state model.
- `AppTheme.kt`: app color/type baseline.
- `AppDestination.kt`: bottom navigation destinations.
- `AppNavHost.kt`: navigation host and bottom bar.
- `ConsentScreen.kt`: privacy/user agreement consent screen.
- Feature screens: placeholders with correct product intent.

## Task 1: Create Android Gradle Project

**Files:**
- Create: `android/settings.gradle.kts`
- Create: `android/build.gradle.kts`
- Create: `android/gradle.properties`
- Create: `android/gradle/wrapper/gradle-wrapper.properties`
- Create: `android/gradlew`
- Create: `android/gradlew.bat`
- Create: `android/app/build.gradle.kts`
- Create: `android/app/src/main/AndroidManifest.xml`
- Create: `android/app/src/main/res/drawable/ic_launcher_foreground.xml`
- Create: `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml`
- Create: `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml`
- Create: `android/app/src/main/res/values/styles.xml`
- Create: `android/app/src/main/res/xml/backup_rules.xml`
- Create: `android/app/src/main/res/xml/data_extraction_rules.xml`

- [x] **Step 1: Add Gradle settings**

Create `android/settings.gradle.kts`:

```kotlin
pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "AIFitnessProAndroid"
include(":app")
```

- [x] **Step 2: Add root build file**

Create `android/build.gradle.kts`:

```kotlin
plugins {
    id("com.android.application") version "8.7.3" apply false
    id("org.jetbrains.kotlin.android") version "2.0.21" apply false
    id("org.jetbrains.kotlin.plugin.compose") version "2.0.21" apply false
}
```

- [x] **Step 3: Add Gradle properties**

Create `android/gradle.properties`:

```properties
org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
kotlin.code.style=official
android.nonTransitiveRClass=true
```

- [x] **Step 4: Add Gradle wrapper files**

Create `android/gradle/wrapper/gradle-wrapper.properties`:

```properties
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\://services.gradle.org/distributions/gradle-8.9-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
```

Copy an existing `gradle-wrapper.jar` from a trusted local Android template or generate it with a local Gradle install. The expected path is:

```text
android/gradle/wrapper/gradle-wrapper.jar
```

Create `android/gradlew`:

```sh
#!/bin/sh
APP_HOME=$(cd "$(dirname "$0")" >/dev/null 2>&1 && pwd -P)
exec java -classpath "$APP_HOME/gradle/wrapper/gradle-wrapper.jar" org.gradle.wrapper.GradleWrapperMain "$@"
```

Create `android/gradlew.bat`:

```bat
@echo off
set APP_HOME=%~dp0
java -classpath "%APP_HOME%\gradle\wrapper\gradle-wrapper.jar" org.gradle.wrapper.GradleWrapperMain %*
```

- [x] **Step 5: Add app build file**

Create `android/app/build.gradle.kts`:

```kotlin
plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
}

android {
    namespace = "com.aifitnesspro.android"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.aifitnesspro.android"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "0.1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
    }
}

dependencies {
    val composeBom = platform("androidx.compose:compose-bom:2024.12.01")
    implementation(composeBom)
    androidTestImplementation(composeBom)

    implementation("androidx.activity:activity-compose:1.9.3")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.7")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.8.7")
    implementation("androidx.navigation:navigation-compose:2.8.5")
    implementation("androidx.datastore:datastore-preferences:1.1.1")

    debugImplementation("androidx.compose.ui:ui-tooling")
    debugImplementation("androidx.compose.ui:ui-test-manifest")

    testImplementation("junit:junit:4.13.2")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.9.0")
}
```

- [x] **Step 6: Add Android manifest**

Create `android/app/src/main/AndroidManifest.xml`:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET" />

    <application
        android:allowBackup="false"
        android:dataExtractionRules="@xml/data_extraction_rules"
        android:fullBackupContent="@xml/backup_rules"
        android:icon="@mipmap/ic_launcher"
        android:label="AIFitnessPro"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.AIFitnessPro">
        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

- [x] **Step 7: Add required Android resources**

Create `android/app/src/main/res/values/styles.xml`:

```xml
<resources>
    <style name="Theme.AIFitnessPro" parent="android:style/Theme.Material.Light.NoActionBar">
        <item name="android:windowActionBar">false</item>
        <item name="android:windowNoTitle">true</item>
        <item name="android:windowLightStatusBar">true</item>
        <item name="android:colorAccent">#2563EB</item>
    </style>
</resources>
```

Create `android/app/src/main/res/drawable/ic_launcher_foreground.xml`:

```xml
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path android:fillColor="#2563EB" android:pathData="M0,0h108v108h-108z" />
    <path android:fillColor="#FFFFFF" android:pathData="M28,58h10v-8h32v8h10v-18h-10v6h-32v-6h-10z" />
    <path android:fillColor="#FFFFFF" android:pathData="M44,30h20v12h-20z" />
    <path android:fillColor="#FFFFFF" android:pathData="M44,66h20v12h-20z" />
</vector>
```

Create `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml`:

```xml
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background" />
    <foreground android:drawable="@drawable/ic_launcher_foreground" />
</adaptive-icon>
```

Create `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml`:

```xml
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background" />
    <foreground android:drawable="@drawable/ic_launcher_foreground" />
</adaptive-icon>
```

Create `android/app/src/main/res/values/colors.xml`:

```xml
<resources>
    <color name="ic_launcher_background">#2563EB</color>
</resources>
```

Create `android/app/src/main/res/xml/backup_rules.xml`:

```xml
<full-backup-content>
    <exclude domain="sharedpref" path="consent.preferences_pb" />
</full-backup-content>
```

Create `android/app/src/main/res/xml/data_extraction_rules.xml`:

```xml
<data-extraction-rules>
    <cloud-backup>
        <exclude domain="sharedpref" path="consent.preferences_pb" />
    </cloud-backup>
    <device-transfer>
        <exclude domain="sharedpref" path="consent.preferences_pb" />
    </device-transfer>
</data-extraction-rules>
```

- [x] **Step 8: Run project sync/build**

Run:

```bash
cd android
./gradlew :app:assembleDebug
```

Expected: build fails only if wrapper is missing. If no wrapper exists, run the local installed `gradle wrapper` once, then rerun `./gradlew :app:assembleDebug`.

## Task 2: Add Theme and Main Activity

**Files:**
- Create: `android/app/src/main/java/com/aifitnesspro/android/MainActivity.kt`
- Create: `android/app/src/main/java/com/aifitnesspro/android/AIFitnessProApp.kt`
- Create: `android/app/src/main/java/com/aifitnesspro/android/core/ui/AppTheme.kt`

- [x] **Step 1: Add app theme**

Create `AppTheme.kt`:

```kotlin
package com.aifitnesspro.android.core.ui

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val LightColors = lightColorScheme(
    primary = Color(0xFF2563EB),
    onPrimary = Color.White,
    secondary = Color(0xFF16A34A),
    onSecondary = Color.White,
    background = Color(0xFFF8FAFC),
    onBackground = Color(0xFF111827),
    surface = Color.White,
    onSurface = Color(0xFF111827),
    error = Color(0xFFDC2626)
)

private val DarkColors = darkColorScheme(
    primary = Color(0xFF60A5FA),
    onPrimary = Color(0xFF0F172A),
    secondary = Color(0xFF4ADE80),
    onSecondary = Color(0xFF052E16),
    background = Color(0xFF0F172A),
    onBackground = Color(0xFFE5E7EB),
    surface = Color(0xFF111827),
    onSurface = Color(0xFFE5E7EB),
    error = Color(0xFFF87171)
)

@Composable
fun AIFitnessProTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = if (darkTheme) DarkColors else LightColors,
        content = content
    )
}
```

- [x] **Step 2: Add main activity**

Create `MainActivity.kt`:

```kotlin
package com.aifitnesspro.android

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import com.aifitnesspro.android.core.ui.AIFitnessProTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            AIFitnessProTheme {
                AIFitnessProApp()
            }
        }
    }
}
```

- [x] **Step 3: Add temporary app composable**

Create `AIFitnessProApp.kt`:

```kotlin
package com.aifitnesspro.android

import androidx.compose.material3.Text
import androidx.compose.runtime.Composable

@Composable
fun AIFitnessProApp() {
    Text("AIFitnessPro Android")
}
```

- [x] **Step 4: Build**

Run:

```bash
cd android
./gradlew :app:assembleDebug
```

Expected: assembleDebug passes.

## Task 3: Add Consent State and Repository

**Files:**
- Create: `android/app/src/main/java/com/aifitnesspro/android/core/settings/ConsentState.kt`
- Create: `android/app/src/main/java/com/aifitnesspro/android/core/settings/ConsentRepository.kt`
- Create: `android/app/src/test/java/com/aifitnesspro/android/core/settings/ConsentRepositoryTest.kt`

- [x] **Step 1: Add consent state model**

Create `ConsentState.kt`:

```kotlin
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
```

- [x] **Step 2: Write model test**

Create `ConsentRepositoryTest.kt`:

```kotlin
package com.aifitnesspro.android.core.settings

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class ConsentRepositoryTest {
    @Test
    fun currentConsentRequiresAcceptedMatchingVersions() {
        val consent = ConsentState(
            accepted = true,
            privacyVersion = "2026-05-18",
            termsVersion = "2026-05-18"
        )

        assertTrue(consent.isCurrent("2026-05-18", "2026-05-18"))
        assertFalse(consent.isCurrent("2026-05-19", "2026-05-18"))
        assertFalse(consent.copy(accepted = false).isCurrent("2026-05-18", "2026-05-18"))
    }
}
```

- [x] **Step 3: Run failing/passing unit test**

Run:

```bash
cd android
./gradlew :app:testDebugUnitTest --tests "com.aifitnesspro.android.core.settings.ConsentRepositoryTest"
```

Expected: test passes after model exists.

- [x] **Step 4: Add DataStore repository**

Create `ConsentRepository.kt`:

```kotlin
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
```

## Task 4: Add Consent Screen

**Files:**
- Create: `android/app/src/main/java/com/aifitnesspro/android/feature/consent/ConsentScreen.kt`
- Modify: `android/app/src/main/java/com/aifitnesspro/android/AIFitnessProApp.kt`

- [x] **Step 1: Create consent screen**

Create `ConsentScreen.kt`:

```kotlin
package com.aifitnesspro.android.feature.consent

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

@Composable
fun ConsentScreen(
    privacyVersion: String,
    termsVersion: String,
    onAccept: () -> Unit,
    onDecline: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = "欢迎使用 AIFitnessPro",
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold
        )
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = "我们会根据你的身高、体重、训练目标、器械条件和训练记录生成训练建议。请先阅读并同意隐私政策和用户协议。未同意前，App 不会初始化非必要 SDK。",
            style = MaterialTheme.typography.bodyLarge
        )
        Spacer(modifier = Modifier.height(12.dp))
        Text(
            text = "隐私政策版本：$privacyVersion\n用户协议版本：$termsVersion",
            style = MaterialTheme.typography.bodyMedium
        )
        Spacer(modifier = Modifier.height(24.dp))
        Button(
            modifier = Modifier.fillMaxWidth(),
            onClick = onAccept
        ) {
            Text("同意并继续")
        }
        Spacer(modifier = Modifier.height(12.dp))
        OutlinedButton(
            modifier = Modifier.fillMaxWidth(),
            onClick = onDecline
        ) {
            Text("不同意")
        }
    }
}
```

- [x] **Step 2: Wire app to show consent screen temporarily**

Modify `AIFitnessProApp.kt`:

```kotlin
package com.aifitnesspro.android

import androidx.compose.runtime.Composable
import com.aifitnesspro.android.feature.consent.ConsentScreen

private const val PRIVACY_VERSION = "2026-05-18"
private const val TERMS_VERSION = "2026-05-18"

@Composable
fun AIFitnessProApp() {
    ConsentScreen(
        privacyVersion = PRIVACY_VERSION,
        termsVersion = TERMS_VERSION,
        onAccept = {},
        onDecline = {}
    )
}
```

- [x] **Step 3: Build**

Run:

```bash
cd android
./gradlew :app:assembleDebug
```

Expected: build passes and app starts on the consent screen.

## Task 5: Add Navigation Destinations and Placeholder Screens

**Files:**
- Create: `android/app/src/main/java/com/aifitnesspro/android/navigation/AppDestination.kt`
- Create: `android/app/src/test/java/com/aifitnesspro/android/navigation/AppDestinationTest.kt`
- Create: `android/app/src/main/java/com/aifitnesspro/android/feature/home/HomeScreen.kt`
- Create: `android/app/src/main/java/com/aifitnesspro/android/feature/training/TrainingScreen.kt`
- Create: `android/app/src/main/java/com/aifitnesspro/android/feature/exercise/ExerciseLibraryScreen.kt`
- Create: `android/app/src/main/java/com/aifitnesspro/android/feature/profile/ProfileScreen.kt`

- [x] **Step 1: Add destination model**

Create `AppDestination.kt`:

```kotlin
package com.aifitnesspro.android.navigation

data class AppDestination(
    val route: String,
    val label: String
) {
    companion object {
        val Home = AppDestination("home", "首页")
        val Training = AppDestination("training", "训练")
        val Exercise = AppDestination("exercise", "动作库")
        val Profile = AppDestination("profile", "我的")

        val bottomTabs = listOf(Home, Training, Exercise, Profile)
    }
}
```

- [x] **Step 2: Add destination test**

Create `AppDestinationTest.kt`:

```kotlin
package com.aifitnesspro.android.navigation

import org.junit.Assert.assertEquals
import org.junit.Test

class AppDestinationTest {
    @Test
    fun bottomTabsHaveStableRoutesInExpectedOrder() {
        assertEquals(
            listOf("home", "training", "exercise", "profile"),
            AppDestination.bottomTabs.map { it.route }
        )
    }
}
```

- [x] **Step 3: Add placeholder screens**

Create `HomeScreen.kt`:

```kotlin
package com.aifitnesspro.android.feature.home

import androidx.compose.material3.Text
import androidx.compose.runtime.Composable

@Composable
fun HomeScreen() {
    Text("今日训练")
}
```

Create `TrainingScreen.kt`:

```kotlin
package com.aifitnesspro.android.feature.training

import androidx.compose.material3.Text
import androidx.compose.runtime.Composable

@Composable
fun TrainingScreen() {
    Text("训练计划与训练历史")
}
```

Create `ExerciseLibraryScreen.kt`:

```kotlin
package com.aifitnesspro.android.feature.exercise

import androidx.compose.material3.Text
import androidx.compose.runtime.Composable

@Composable
fun ExerciseLibraryScreen() {
    Text("动作库")
}
```

Create `ProfileScreen.kt`:

```kotlin
package com.aifitnesspro.android.feature.profile

import androidx.compose.material3.Text
import androidx.compose.runtime.Composable

@Composable
fun ProfileScreen() {
    Text("我的")
}
```

- [x] **Step 4: Run tests**

Run:

```bash
cd android
./gradlew :app:testDebugUnitTest --tests "com.aifitnesspro.android.navigation.AppDestinationTest"
```

Expected: test passes.

## Task 6: Add Main Navigation Host

**Files:**
- Create: `android/app/src/main/java/com/aifitnesspro/android/navigation/AppNavHost.kt`
- Modify: `android/app/src/main/java/com/aifitnesspro/android/AIFitnessProApp.kt`

- [x] **Step 1: Add navigation host**

Create `AppNavHost.kt`:

```kotlin
package com.aifitnesspro.android.navigation

import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.foundation.layout.padding
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.aifitnesspro.android.feature.exercise.ExerciseLibraryScreen
import com.aifitnesspro.android.feature.home.HomeScreen
import com.aifitnesspro.android.feature.profile.ProfileScreen
import com.aifitnesspro.android.feature.training.TrainingScreen

@Composable
fun AppNavHost() {
    val navController = rememberNavController()
    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = backStackEntry?.destination?.route ?: AppDestination.Home.route

    Scaffold(
        bottomBar = {
            NavigationBar {
                AppDestination.bottomTabs.forEach { destination ->
                    NavigationBarItem(
                        selected = currentRoute == destination.route,
                        onClick = {
                            if (currentRoute != destination.route) {
                                navController.navigate(destination.route) {
                                    popUpTo(AppDestination.Home.route) {
                                        saveState = true
                                    }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            }
                        },
                        label = { Text(destination.label) },
                        icon = { Text(destination.label.take(1)) }
                    )
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = AppDestination.Home.route,
            modifier = Modifier.padding(innerPadding)
        ) {
            composable(AppDestination.Home.route) { HomeScreen() }
            composable(AppDestination.Training.route) { TrainingScreen() }
            composable(AppDestination.Exercise.route) { ExerciseLibraryScreen() }
            composable(AppDestination.Profile.route) { ProfileScreen() }
        }
    }
}
```

- [x] **Step 2: Show navigation after temporary consent bypass**

Modify `AIFitnessProApp.kt`:

```kotlin
package com.aifitnesspro.android

import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import com.aifitnesspro.android.feature.consent.ConsentScreen
import com.aifitnesspro.android.navigation.AppNavHost

private const val PRIVACY_VERSION = "2026-05-18"
private const val TERMS_VERSION = "2026-05-18"

@Composable
fun AIFitnessProApp() {
    val accepted = remember { mutableStateOf(false) }

    if (accepted.value) {
        AppNavHost()
    } else {
        ConsentScreen(
            privacyVersion = PRIVACY_VERSION,
            termsVersion = TERMS_VERSION,
            onAccept = { accepted.value = true },
            onDecline = {}
        )
    }
}
```

- [x] **Step 3: Build**

Run:

```bash
cd android
./gradlew :app:assembleDebug
```

Expected: build passes. Accepting consent in the UI shows the four-tab shell.

## Task 7: Persist Consent with DataStore

**Files:**
- Modify: `android/app/src/main/java/com/aifitnesspro/android/AIFitnessProApp.kt`
- Modify: `android/app/src/main/java/com/aifitnesspro/android/MainActivity.kt`

- [x] **Step 1: Pass repository from activity**

Modify `MainActivity.kt`:

```kotlin
package com.aifitnesspro.android

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import com.aifitnesspro.android.core.settings.ConsentRepository
import com.aifitnesspro.android.core.ui.AIFitnessProTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val consentRepository = ConsentRepository(applicationContext)
        setContent {
            AIFitnessProTheme {
                AIFitnessProApp(consentRepository = consentRepository)
            }
        }
    }
}
```

- [x] **Step 2: Collect consent state**

Modify `AIFitnessProApp.kt`:

```kotlin
package com.aifitnesspro.android

import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
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
    consentRepository: ConsentRepository
) {
    val scope = rememberCoroutineScope()
    val consent by consentRepository.consentState.collectAsState(initial = ConsentState.Empty)

    if (consent.isCurrent(PRIVACY_VERSION, TERMS_VERSION)) {
        AppNavHost()
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
                // Keep the user on the consent screen. Later plans may show a limited explanation screen.
            }
        )
    }
}
```

- [x] **Step 3: Build**

Run:

```bash
cd android
./gradlew :app:assembleDebug
```

Expected: build passes. After accepting once, relaunching the app opens the main four-tab shell.

## Task 8: Improve Placeholder Screens for MVP Boundaries

**Files:**
- Modify: `android/app/src/main/java/com/aifitnesspro/android/feature/home/HomeScreen.kt`
- Modify: `android/app/src/main/java/com/aifitnesspro/android/feature/training/TrainingScreen.kt`
- Modify: `android/app/src/main/java/com/aifitnesspro/android/feature/exercise/ExerciseLibraryScreen.kt`
- Modify: `android/app/src/main/java/com/aifitnesspro/android/feature/profile/ProfileScreen.kt`

- [x] **Step 1: Replace placeholders with product boundary copy**

Modify `HomeScreen.kt`:

```kotlin
package com.aifitnesspro.android.feature.home

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

@Composable
fun HomeScreen() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(20.dp)
    ) {
        Text("今日训练", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(12.dp))
        Text("完成问卷后，这里会显示今天的训练类型、预计时长、动作数量和开始训练入口。")
        Spacer(modifier = Modifier.height(24.dp))
        Button(onClick = {}) {
            Text("生成训练计划")
        }
    }
}
```

Modify `TrainingScreen.kt`:

```kotlin
package com.aifitnesspro.android.feature.training

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

@Composable
fun TrainingScreen() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(20.dp)
    ) {
        Text("训练", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
        Text("这里将展示四周计划、训练历史和恢复训练入口。训练会话会在后续计划中实现。")
    }
}
```

Modify `ExerciseLibraryScreen.kt`:

```kotlin
package com.aifitnesspro.android.feature.exercise

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

@Composable
fun ExerciseLibraryScreen() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(20.dp)
    ) {
        Text("动作库", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
        Text("第一版目标是至少 70 个动作，核心 30 个动作带 GIF 或短视频。")
    }
}
```

Modify `ProfileScreen.kt`:

```kotlin
package com.aifitnesspro.android.feature.profile

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

@Composable
fun ProfileScreen() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(20.dp)
    ) {
        Text("我的", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
        Text("这里将包含个人资料、反馈模式、训练提醒、隐私政策、用户协议、权限管理和账号注销。")
    }
}
```

- [x] **Step 2: Build**

Run:

```bash
cd android
./gradlew :app:assembleDebug
```

Expected: build passes and all four tabs display product-specific placeholders.

## Task 9: Verification and Documentation Update

**Files:**
- Modify: `docs/android-app-product-plan.md`
- Modify: `docs/superpowers/plans/2026-05-18-android-mvp-roadmap.md`

- [x] **Step 1: Run unit tests**

Run:

```bash
cd android
./gradlew :app:testDebugUnitTest
```

Expected: all unit tests pass.

- [x] **Step 2: Run debug build**

Run:

```bash
cd android
./gradlew :app:assembleDebug
```

Expected: debug APK builds successfully.

- [x] **Step 3: Manual smoke test**

Install the debug APK on an Android device or emulator and verify:

1. First launch shows consent screen.
2. Tapping "同意并继续" opens the main app.
3. Closing and reopening the app keeps consent accepted.
4. Bottom tabs switch between 首页、训练、动作库、我的.
5. App does not request camera, location, contacts, microphone, Bluetooth, notification, or photo permissions on launch.

- [x] **Step 4: Update roadmap status**

Add a short status note to `docs/superpowers/plans/2026-05-18-android-mvp-roadmap.md`:

```markdown
## Current Status

- Plan 1 Android foundation and compliance shell: implemented and verified.
- Next recommended plan: Backend API and Database Foundation.
```

- [ ] **Step 5: Commit**

```bash
git add android docs/android-app-product-plan.md docs/superpowers/specs/2026-05-18-android-app-product-design.md docs/superpowers/plans/2026-05-18-android-mvp-roadmap.md docs/superpowers/plans/2026-05-18-android-foundation-compliance-shell.md
git commit -m "docs: plan Android app foundation"
```

Expected: commit succeeds with only Android foundation and planning files staged.

## Self-Review

Spec coverage:

- Product goal: covered by roadmap and shell plan.
- Compliance shell: covered by consent screen and DataStore state.
- Four-tab app structure: covered by destination and navigation tasks.
- Local settings foundation: covered by DataStore consent repository.
- Scope decomposition: covered by roadmap.

Known deliberate exclusions from this plan:

- Backend implementation.
- Real login.
- Onboarding.
- Plan generation.
- Workout state machine.
- Exercise media.
- Account deletion backend.

These exclusions are covered by later roadmap plans.
