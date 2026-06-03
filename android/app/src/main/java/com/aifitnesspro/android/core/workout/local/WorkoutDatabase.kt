package com.aifitnesspro.android.core.workout.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase

@Database(
    entities = [WorkoutSessionEntity::class, WorkoutSetEntity::class],
    version = 3,
    exportSchema = false
)
abstract class WorkoutDatabase : RoomDatabase() {
    abstract fun workoutDao(): WorkoutDao

    companion object {
        fun create(context: Context): WorkoutDatabase =
            Room.databaseBuilder(context, WorkoutDatabase::class.java, "aifitnesspro_workouts")
                .fallbackToDestructiveMigration()
                .build()
    }
}
