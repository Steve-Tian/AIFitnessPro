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
        WHERE status IN ('IN_PROGRESS', 'RESTING', 'PAUSED', 'NOT_STARTED')
        ORDER BY updatedAtEpochMs DESC
        LIMIT 1
        """
    )
    fun observeActiveSession(): Flow<WorkoutSessionEntity?>

    @Query(
        """
        SELECT * FROM workout_sessions
        WHERE status IN ('IN_PROGRESS', 'RESTING', 'PAUSED', 'NOT_STARTED')
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
}
