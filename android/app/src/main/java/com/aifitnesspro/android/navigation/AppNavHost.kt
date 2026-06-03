package com.aifitnesspro.android.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Modifier
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.aifitnesspro.android.core.api.AIFitnessApiClient
import com.aifitnesspro.android.core.exercise.ExerciseRepository
import com.aifitnesspro.android.core.plan.PlanRepository
import com.aifitnesspro.android.core.session.ApiConnectionState
import com.aifitnesspro.android.core.workout.WorkoutSessionRepository
import com.aifitnesspro.android.core.workout.WorkoutSyncRepository
import com.aifitnesspro.android.feature.exercise.ExerciseDetailScreen
import com.aifitnesspro.android.feature.exercise.ExerciseLibraryScreen
import com.aifitnesspro.android.feature.home.HomeScreen
import com.aifitnesspro.android.feature.profile.ProfileScreen
import com.aifitnesspro.android.feature.training.TrainingScreen
import com.aifitnesspro.android.feature.workout.WorkoutSessionScreen
import kotlinx.coroutines.launch

@Composable
fun AppNavHost(
    apiConnectionState: ApiConnectionState,
    apiClient: AIFitnessApiClient,
    planRepository: PlanRepository,
    workoutRepository: WorkoutSessionRepository,
    workoutSyncRepository: WorkoutSyncRepository,
    exerciseRepository: ExerciseRepository,
    onAccountDeleted: () -> Unit
) {
    val scope = rememberCoroutineScope()
    val navController = rememberNavController()
    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = backStackEntry?.destination?.route ?: AppDestination.Home.route
    val devUserId = (apiConnectionState as? ApiConnectionState.Connected)?.user?.id
    val showBottomBar = !currentRoute.startsWith("workout_session") && !currentRoute.startsWith("exercise_detail")

    Scaffold(
        bottomBar = {
            if (showBottomBar) {
                NavigationBar {
                    AppDestination.bottomTabs.forEach { destination ->
                        NavigationBarItem(
                            selected = currentRoute == destination.route,
                            onClick = {
                                if (currentRoute != destination.route) {
                                    navController.navigate(destination.route) {
                                        popUpTo(AppDestination.Home.route) { saveState = true }
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
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = AppDestination.Home.route,
            modifier = Modifier.padding(innerPadding)
        ) {
            composable(AppDestination.Home.route) {
                HomeScreen(
                    planRepository = planRepository,
                    devUserId = devUserId,
                    onStartWorkout = { dayIndex ->
                        navController.navigate(AppDestination.workoutRoute(dayIndex))
                    },
                    onResumeWorkout = { dayIndex ->
                        navController.navigate(AppDestination.workoutRoute(dayIndex))
                    },
                    workoutRepository = workoutRepository
                )
            }
            composable(AppDestination.Training.route) {
                TrainingScreen(
                    planRepository = planRepository,
                    workoutRepository = workoutRepository,
                    onStartWorkout = { dayIndex ->
                        navController.navigate(AppDestination.workoutRoute(dayIndex))
                    }
                )
            }
            composable(AppDestination.Exercise.route) {
                ExerciseLibraryScreen(
                    devUserId = devUserId,
                    exerciseRepository = exerciseRepository,
                    onOpenExercise = { slug ->
                        navController.navigate(AppDestination.exerciseDetailRoute(slug))
                    }
                )
            }
            composable(AppDestination.Profile.route) {
                ProfileScreen(
                    devUserId = devUserId,
                    apiClient = apiClient,
                    onAccountDeleted = onAccountDeleted
                )
            }
            composable(
                route = AppDestination.WorkoutSessionRoute,
                arguments = listOf(navArgument("dayIndex") { type = NavType.IntType })
            ) { entry ->
                val dayIndex = entry.arguments?.getInt("dayIndex") ?: 0
                WorkoutSessionScreen(
                    dayIndex = dayIndex,
                    planRepository = planRepository,
                    workoutRepository = workoutRepository,
                    onFinished = {
                        devUserId?.let { userId ->
                            scope.launch {
                                runCatching { workoutSyncRepository.syncPendingSessions(userId) }
                            }
                        }
                        navController.navigate(AppDestination.Home.route) {
                            popUpTo(AppDestination.Home.route) { inclusive = true }
                            launchSingleTop = true
                        }
                    },
                    onBack = { navController.popBackStack() }
                )
            }
            composable(
                route = AppDestination.ExerciseDetailRoute,
                arguments = listOf(navArgument("slug") { type = NavType.StringType })
            ) { entry ->
                val slug = entry.arguments?.getString("slug").orEmpty()
                ExerciseDetailScreen(
                    slug = slug,
                    devUserId = devUserId,
                    exerciseRepository = exerciseRepository,
                    onBack = { navController.popBackStack() }
                )
            }
        }
    }
}
