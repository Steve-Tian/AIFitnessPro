package com.aifitnesspro.android.core.plan

import com.aifitnesspro.android.core.api.ApiActivePlan
import com.aifitnesspro.android.core.api.ApiPlanDay
import com.aifitnesspro.android.core.api.PlanApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class PlanRepositoryTest {

    @Test
    fun getActivePlanReturnsNullWhenNoPlanStored() = runTest {
        val store = InMemoryPlanStore()
        val repo = PlanRepository(store = store, api = FakePlanApi())

        assertNull(repo.getActivePlan().first())
    }

    @Test
    fun generateAndCacheSavesPlanToStore() = runTest {
        val plan = makePlan("plan-1")
        val store = InMemoryPlanStore()
        val repo = PlanRepository(store = store, api = FakePlanApi(generatedPlan = plan))

        repo.generateAndCache("user-1")

        assertEquals("plan-1", repo.getActivePlan().first()?.id)
    }

    @Test
    fun refreshFromRemoteUpdatesCachedPlan() = runTest {
        val initial = makePlan("plan-old")
        val updated = makePlan("plan-new")
        val store = InMemoryPlanStore()
        store.savePlan(initial)
        val repo = PlanRepository(store = store, api = FakePlanApi(activePlan = updated))

        repo.refreshFromRemote("user-1")

        assertEquals("plan-new", repo.getActivePlan().first()?.id)
    }

    @Test
    fun refreshFromRemoteKeepsCachedPlanOnNetworkError() = runTest {
        val initial = makePlan("plan-cached")
        val store = InMemoryPlanStore()
        store.savePlan(initial)
        val repo = PlanRepository(store = store, api = ThrowingPlanApi())

        repo.refreshFromRemote("user-1")

        assertEquals("plan-cached", repo.getActivePlan().first()?.id)
    }

    @Test
    fun findTodayDayReturnsDayMatchingDate() {
        val days = listOf(
            makeDay(dayIndex = 0, scheduledDate = "2026-05-20", dayType = "push"),
            makeDay(dayIndex = 1, scheduledDate = "2026-05-21", dayType = "pull"),
            makeDay(dayIndex = 2, scheduledDate = "2026-05-22", dayType = "rest"),
        )
        val plan = ApiActivePlan(id = "p1", status = "active", startDate = "2026-05-20", days = days)

        val today = findTodayDay(plan, "2026-05-21")

        assertEquals("pull", today?.dayType)
    }

    @Test
    fun findTodayDayReturnsNullWhenNoMatch() {
        val plan = ApiActivePlan(id = "p1", status = "active", startDate = "2026-05-20", days = emptyList())
        assertNull(findTodayDay(plan, "2026-06-30"))
    }
}

private fun makePlan(id: String) = ApiActivePlan(
    id = id, status = "active", startDate = "2026-05-20", days = emptyList()
)

private fun makeDay(dayIndex: Int, scheduledDate: String, dayType: String) = ApiPlanDay(
    dayIndex = dayIndex, dayType = dayType, scheduledDate = scheduledDate
)

private class InMemoryPlanStore : PlanStore {
    private val flow = MutableStateFlow<ApiActivePlan?>(null)

    override fun getPlan() = flow

    override suspend fun savePlan(plan: ApiActivePlan) {
        flow.value = plan
    }
}

private class FakePlanApi(
    private val generatedPlan: ApiActivePlan = makePlan("generated"),
    private val activePlan: ApiActivePlan = makePlan("active")
) : PlanApi {
    override suspend fun generatePlan(devUserId: String) = generatedPlan
    override suspend fun getActivePlan(devUserId: String) = activePlan
}

private class ThrowingPlanApi : PlanApi {
    override suspend fun generatePlan(devUserId: String): ApiActivePlan = throw RuntimeException("network error")
    override suspend fun getActivePlan(devUserId: String): ApiActivePlan = throw RuntimeException("network error")
}
