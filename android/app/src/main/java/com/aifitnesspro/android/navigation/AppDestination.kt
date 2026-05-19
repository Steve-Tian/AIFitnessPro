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
