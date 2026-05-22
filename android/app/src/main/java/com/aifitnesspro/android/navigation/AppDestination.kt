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

        const val WorkoutSessionRoute = "workout_session/{dayIndex}"
        const val ExerciseDetailRoute = "exercise_detail/{slug}"

        fun workoutRoute(dayIndex: Int) = "workout_session/$dayIndex"

        fun exerciseDetailRoute(slug: String) = "exercise_detail/$slug"

        val bottomTabs = listOf(Home, Training, Exercise, Profile)
    }
}
