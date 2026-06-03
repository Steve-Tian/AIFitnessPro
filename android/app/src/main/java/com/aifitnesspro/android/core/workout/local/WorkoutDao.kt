package com.aifitnesspro.android.core.workout.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface WorkoutDao {
    @Query(
        """
        SELECT * FROM workout_sessions
        WHERE status IN ('IN_PROGRESS', 'RESTING', 'PAUSED', 'NOT_STARTED', 'AWAITING_EXERCISE_RPE')
        ORDER BY updatedAtEpochMs DESC
        LIMIT 1
        """
    )
    fun observeActiveSession(): Flow<WorkoutSessionEntity?>

    @Query(
        """
        SELECT * FROM workout_sessions
        WHERE status IN ('IN_PROGRESS', 'RESTING', 'PAUSED', 'NOT_STARTED', 'AWAITING_EXERCISE_RPE')
        ORDER BY updatedAtEpochMs DESC
        LIMIT 1
        """
    )
    suspend fun getActiveSession(): WorkoutSessionEntity?

    @Query("SELECT * FROM workout_sessions WHERE id = :sessionId LIMIT 1")
    suspend fun getSession(sessionId: String): WorkoutSessionEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertSession(entity: WorkoutSessionEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSet(entity: WorkoutSetEntity)

    @Query("SELECT * FROM workout_sets WHERE sessionId = :sessionId ORDER BY completedAtEpochMs ASC")
    suspend fun getSetsForSession(sessionId: String): List<WorkoutSetEntity>

    @Query("DELETE FROM workout_sets WHERE sessionId = :sessionId")
    suspend fun deleteSetsForSession(sessionId: String)

    @Query(
        """
        SELECT * FROM workout_sessions
        WHERE syncStatus IN ('pending', 'failed')
          AND status IN ('COMPLETED', 'ABANDONED')
        ORDER BY updatedAtEpochMs ASC
        """
    )
    suspend fun getPendingSyncSessions(): List<WorkoutSessionEntity>

    @Query("UPDATE workout_sessions SET syncStatus = :syncStatus WHERE id = :sessionId")
    suspend fun updateSyncStatus(sessionId: String, syncStatus: String)

    @Query(
        """
        SELECT DISTINCT planDayIndex FROM workout_sessions
        WHERE planId = :planId AND status = 'COMPLETED'
        ORDER BY planDayIndex ASC
        """
    )
    fun observeCompletedDayIndices(planId: String): Flow<List<Int>>
}
