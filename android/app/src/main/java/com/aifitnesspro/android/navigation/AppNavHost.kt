package com.aifitnesspro.android.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
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
