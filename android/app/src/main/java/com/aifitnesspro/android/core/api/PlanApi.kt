package com.aifitnesspro.android.core.api

interface PlanApi {
    suspend fun generatePlan(devUserId: String): ApiActivePlan
    suspend fun getActivePlan(devUserId: String): ApiActivePlan
}
