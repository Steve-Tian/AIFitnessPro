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
