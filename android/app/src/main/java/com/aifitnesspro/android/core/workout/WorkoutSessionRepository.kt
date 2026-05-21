package com.aifitnesspro.android.core.workout

import com.aifitnesspro.android.core.api.ApiPlanDay
import com.aifitnesspro.android.core.workout.local.WorkoutDao
import com.aifitnesspro.android.core.workout.local.WorkoutSessionEntity
import com.aifitnesspro.android.core.workout.local.WorkoutSetEntity
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.util.UUID

class WorkoutSessionRepository(
    private val dao: WorkoutDao,
    private val json: Json = Json { ignoreUnknownKeys = true; explicitNulls = false }
) {
    fun observeActiveSession(): Flow<WorkoutSessionSnapshot?> =
        dao.observeActiveSession().map { entity -> entity?.toSnapshot(json) }

    suspend fun getActiveSession(): WorkoutSessionSnapshot? =
        dao.getActiveSession()?.toSnapshot(json)

    suspend fun prepareSession(planId: String, day: ApiPlanDay): WorkoutSessionSnapshot {
        val existing = getActiveSession()
        if (existing != null && existing.planDayIndex == day.dayIndex && existing.status.isActive()) {
            return existing
        }
        if (existing != null && existing.status.isActive()) {
            discardSession(existing)
        }
        val snapshot = WorkoutStateMachine.createNotStarted(
            sessionId = UUID.randomUUID().toString(),
            planId = planId,
            day = day
        )
        saveSnapshot(snapshot)
        return snapshot
    }

    suspend fun startSession(snapshot: WorkoutSessionSnapshot): WorkoutSessionSnapshot {
        val updated = WorkoutStateMachine.start(snapshot, System.currentTimeMillis())
        saveSnapshot(updated)
        return updated
    }

    suspend fun completeSet(
        snapshot: WorkoutSessionSnapshot,
        weightKg: Double?,
        actualReps: Int
    ): WorkoutSessionSnapshot {
        val (updated, record) = WorkoutStateMachine.completeSet(
            snapshot,
            weightKg = weightKg,
            actualReps = actualReps,
            nowEpochMs = System.currentTimeMillis()
        )
        dao.insertSet(
            WorkoutSetEntity(
                id = UUID.randomUUID().toString(),
                sessionId = snapshot.sessionId,
                exerciseId = record.exerciseId,
                exerciseNameCn = record.exerciseNameCn,
                setIndex = record.setIndex,
                targetReps = record.targetReps,
                actualReps = record.actualReps,
                weightKg = record.weightKg,
                completedAtEpochMs = record.completedAtEpochMs
            )
        )
        saveSnapshot(updated)
        return updated
    }

    suspend fun skipRest(snapshot: WorkoutSessionSnapshot): WorkoutSessionSnapshot {
        val updated = WorkoutStateMachine.skipRest(snapshot)
        saveSnapshot(updated)
        return updated
    }

    suspend fun tickRest(snapshot: WorkoutSessionSnapshot): WorkoutSessionSnapshot {
        val updated = WorkoutStateMachine.tickRest(snapshot)
        if (updated != snapshot) saveSnapshot(updated)
        return updated
    }

    suspend fun pauseSession(snapshot: WorkoutSessionSnapshot): WorkoutSessionSnapshot {
        val updated = WorkoutStateMachine.pause(snapshot)
        saveSnapshot(updated)
        return updated
    }

    suspend fun resumeSession(snapshot: WorkoutSessionSnapshot): WorkoutSessionSnapshot {
        val updated = WorkoutStateMachine.resume(snapshot)
        saveSnapshot(updated)
        return updated
    }

    suspend fun discardSession(snapshot: WorkoutSessionSnapshot): WorkoutSessionSnapshot {
        val updated = WorkoutStateMachine.discard(snapshot, System.currentTimeMillis())
        saveSnapshot(updated)
        return updated
    }

    suspend fun updateInputs(
        snapshot: WorkoutSessionSnapshot,
        weightInput: String,
        repsInput: String
    ): WorkoutSessionSnapshot {
        val updated = snapshot.copy(weightInput = weightInput, repsInput = repsInput)
        saveSnapshot(updated)
        return updated
    }

    suspend fun getCompletedSets(sessionId: String): List<WorkoutSetEntity> =
        dao.getSetsForSession(sessionId)

    private suspend fun saveSnapshot(snapshot: WorkoutSessionSnapshot) {
        dao.upsertSession(snapshot.toEntity(json))
    }
}

private fun WorkoutSessionSnapshot.toEntity(json: Json): WorkoutSessionEntity =
    WorkoutSessionEntity(
        id = sessionId,
        planId = planId,
        planDayIndex = planDayIndex,
        dayType = dayType,
        scheduledDate = scheduledDate,
        status = status.name,
        exercisesJson = json.encodeToString(exercises),
        exerciseIndex = exerciseIndex,
        setIndex = setIndex,
        restSecondsRemaining = restSecondsRemaining,
        weightInput = weightInput,
        repsInput = repsInput,
        startedAtEpochMs = startedAtEpochMs,
        completedAtEpochMs = completedAtEpochMs,
        updatedAtEpochMs = System.currentTimeMillis()
    )

private fun WorkoutSessionEntity.toSnapshot(json: Json): WorkoutSessionSnapshot {
    val exercises = json.decodeFromString<List<WorkoutExercisePlan>>(exercisesJson)
    return WorkoutSessionSnapshot(
        sessionId = id,
        planId = planId,
        planDayIndex = planDayIndex,
        dayType = dayType,
        scheduledDate = scheduledDate,
        status = WorkoutStatus.valueOf(status),
        exercises = exercises,
        exerciseIndex = exerciseIndex,
        setIndex = setIndex,
        restSecondsRemaining = restSecondsRemaining,
        weightInput = weightInput,
        repsInput = repsInput,
        startedAtEpochMs = startedAtEpochMs,
        completedAtEpochMs = completedAtEpochMs
    )
}
