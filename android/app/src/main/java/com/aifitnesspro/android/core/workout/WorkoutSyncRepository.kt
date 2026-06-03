package com.aifitnesspro.android.core.workout

import com.aifitnesspro.android.core.api.SyncExerciseFeedbackRequest
import com.aifitnesspro.android.core.api.SyncWorkoutRequest
import com.aifitnesspro.android.core.api.SyncWorkoutSessionRequest
import com.aifitnesspro.android.core.api.SyncWorkoutSetRequest
import com.aifitnesspro.android.core.api.WorkoutApi
import kotlinx.serialization.json.Json
import com.aifitnesspro.android.core.workout.local.WorkoutDao
import com.aifitnesspro.android.core.workout.local.WorkoutSessionEntity
import com.aifitnesspro.android.core.workout.local.WorkoutSetEntity
import java.time.Instant

class WorkoutSyncRepository(
    private val dao: WorkoutDao,
    private val workoutApi: WorkoutApi,
    private val json: Json = Json { ignoreUnknownKeys = true }
) {
    suspend fun syncPendingSessions(devUserId: String): Int {
        val pending = dao.getPendingSyncSessions()
        var syncedCount = 0
        for (session in pending) {
            val sets = dao.getSetsForSession(session.id)
            if (sets.isEmpty()) {
                dao.updateSyncStatus(session.id, WorkoutSyncStatus.SYNCED.storageValue())
                continue
            }
            runCatching {
                workoutApi.syncWorkoutSession(devUserId, session.toSyncRequest(sets, json))
                dao.updateSyncStatus(session.id, WorkoutSyncStatus.SYNCED.storageValue())
                syncedCount++
            }.onFailure {
                dao.updateSyncStatus(session.id, WorkoutSyncStatus.FAILED.storageValue())
            }
        }
        return syncedCount
    }
}

private fun WorkoutSessionEntity.toSyncRequest(
    sets: List<WorkoutSetEntity>,
    json: Json
): SyncWorkoutRequest {
    val feedbacks = runCatching {
        json.decodeFromString<List<ExerciseRpeFeedback>>(exerciseFeedbackJson)
    }.getOrDefault(emptyList())
    val status = WorkoutStatus.valueOf(status)
    val durationSeconds = if (startedAtEpochMs != null && completedAtEpochMs != null) {
        ((completedAtEpochMs - startedAtEpochMs) / 1000).toInt().coerceAtLeast(0)
    } else {
        null
    }
    return SyncWorkoutRequest(
        session = SyncWorkoutSessionRequest(
            id = id,
            trainingPlanId = planId,
            planDayIndex = planDayIndex,
            status = status.toApiStatus(),
            startedAt = startedAtEpochMs?.toIsoString(),
            completedAt = completedAtEpochMs?.toIsoString(),
            durationSeconds = durationSeconds
        ),
        sets = sets.map { set ->
            SyncWorkoutSetRequest(
                id = set.id,
                exerciseId = set.exerciseId,
                setIndex = set.setIndex,
                targetReps = set.targetReps,
                actualReps = set.actualReps,
                weightKg = set.weightKg,
                completedAt = set.completedAtEpochMs.toIsoString()
            )
        },
        feedback = feedbacks.map { item ->
            SyncExerciseFeedbackRequest(exerciseId = item.exerciseId, rpe = item.rpe)
        }
    )
}

private fun Long.toIsoString(): String = Instant.ofEpochMilli(this).toString()
