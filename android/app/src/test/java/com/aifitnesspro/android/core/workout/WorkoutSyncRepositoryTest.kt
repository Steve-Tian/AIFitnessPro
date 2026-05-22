package com.aifitnesspro.android.core.workout

import com.aifitnesspro.android.core.api.ApiWorkoutSession
import com.aifitnesspro.android.core.api.SyncWorkoutRequest
import com.aifitnesspro.android.core.api.WorkoutApi
import com.aifitnesspro.android.core.workout.local.WorkoutDao
import com.aifitnesspro.android.core.workout.local.WorkoutSessionEntity
import com.aifitnesspro.android.core.workout.local.WorkoutSetEntity
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Test

class WorkoutSyncRepositoryTest {
    @Test
    fun syncPendingSessionsUploadsAndMarksSynced() = runTest {
        val dao = FakeWorkoutDao(
            pending = listOf(
                WorkoutSessionEntity(
                    id = "session-1",
                    planId = "plan-1",
                    planDayIndex = 0,
                    dayType = "push",
                    scheduledDate = "2026-05-20",
                    status = "COMPLETED",
                    exercisesJson = "[]",
                    exerciseIndex = 0,
                    setIndex = 1,
                    restSecondsRemaining = null,
                    weightInput = "",
                    repsInput = "",
                    startedAtEpochMs = 1_000L,
                    completedAtEpochMs = 2_000L,
                    updatedAtEpochMs = 2_000L,
                    syncStatus = "pending"
                )
            ),
            sets = listOf(
                WorkoutSetEntity(
                    id = "set-1",
                    sessionId = "session-1",
                    exerciseId = "exercise-1",
                    exerciseNameCn = "卧推",
                    setIndex = 1,
                    targetReps = 10,
                    actualReps = 10,
                    weightKg = 40.0,
                    completedAtEpochMs = 1_500L
                )
            )
        )
        val api = FakeWorkoutApi()
        val repository = WorkoutSyncRepository(dao = dao, workoutApi = api)

        val synced = repository.syncPendingSessions("user-1")

        assertEquals(1, synced)
        assertEquals("user-1", api.lastDevUserId)
        assertEquals("synced", dao.syncStatuses["session-1"])
    }

    @Test
    fun syncPendingSessionsSkipsEmptySetsWithoutRetry() = runTest {
        val dao = FakeWorkoutDao(
            pending = listOf(
                WorkoutSessionEntity(
                    id = "session-empty",
                    planId = "plan-1",
                    planDayIndex = 0,
                    dayType = "push",
                    scheduledDate = "2026-05-20",
                    status = "ABANDONED",
                    exercisesJson = "[]",
                    exerciseIndex = 0,
                    setIndex = 0,
                    restSecondsRemaining = null,
                    weightInput = "",
                    repsInput = "",
                    startedAtEpochMs = null,
                    completedAtEpochMs = 1_000L,
                    updatedAtEpochMs = 1_000L,
                    syncStatus = "pending"
                )
            ),
            sets = emptyList()
        )
        val api = FakeWorkoutApi()
        val repository = WorkoutSyncRepository(dao = dao, workoutApi = api)

        val synced = repository.syncPendingSessions("user-1")

        assertEquals(0, synced)
        assertEquals(null, api.lastDevUserId)
        assertEquals("synced", dao.syncStatuses["session-empty"])
    }
}

private class FakeWorkoutApi : WorkoutApi {
    var lastDevUserId: String? = null

    override suspend fun syncWorkoutSession(devUserId: String, request: SyncWorkoutRequest): ApiWorkoutSession {
        lastDevUserId = devUserId
        return ApiWorkoutSession(id = request.session.id, status = request.session.status)
    }
}

private class FakeWorkoutDao(
    private val pending: List<WorkoutSessionEntity>,
    private val sets: List<WorkoutSetEntity>
) : WorkoutDao {
    val syncStatuses = mutableMapOf<String, String>()

    override fun observeActiveSession() = flowOf(null)
    override suspend fun getActiveSession() = null
    override suspend fun getSession(sessionId: String) = null
    override suspend fun upsertSession(entity: WorkoutSessionEntity) = Unit
    override suspend fun insertSet(entity: WorkoutSetEntity) = Unit
    override suspend fun getSetsForSession(sessionId: String) = sets.filter { it.sessionId == sessionId }
    override suspend fun deleteSetsForSession(sessionId: String) = Unit
    override suspend fun getPendingSyncSessions() = pending
    override suspend fun updateSyncStatus(sessionId: String, syncStatus: String) {
        syncStatuses[sessionId] = syncStatus
    }

    override fun observeCompletedDayIndices(planId: String) = flowOf(emptyList())
}
