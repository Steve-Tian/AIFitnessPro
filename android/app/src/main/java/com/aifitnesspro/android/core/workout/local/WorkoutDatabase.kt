package com.aifitnesspro.android.core.workout.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase

@Database(
    entities = [WorkoutSessionEntity::class, WorkoutSetEntity::class],
    version = 3,
    exportSchema = true
)
abstract class WorkoutDatabase : RoomDatabase() {
    abstract fun workoutDao(): WorkoutDao

    companion object {
        // v1 → v2：补充客户端同步状态字段，记录 session 是否已上行到后端
        val MIGRATION_1_2 = object : Migration(1, 2) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL(
                    "ALTER TABLE workout_sessions ADD COLUMN syncStatus TEXT NOT NULL DEFAULT 'none'"
                )
            }
        }

        // v2 → v3：补充每个动作训练后的 RPE 反馈快照
        val MIGRATION_2_3 = object : Migration(2, 3) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL(
                    "ALTER TABLE workout_sessions ADD COLUMN exerciseFeedbackJson TEXT NOT NULL DEFAULT '[]'"
                )
            }
        }

        fun create(context: Context): WorkoutDatabase =
            Room.databaseBuilder(context, WorkoutDatabase::class.java, "aifitnesspro_workouts")
                .addMigrations(MIGRATION_1_2, MIGRATION_2_3)
                .build()
    }
}
