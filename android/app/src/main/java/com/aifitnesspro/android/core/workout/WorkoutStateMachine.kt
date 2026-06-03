package com.aifitnesspro.android.core.workout

object WorkoutStateMachine {
    fun createNotStarted(
        sessionId: String,
        planId: String,
        day: com.aifitnesspro.android.core.api.ApiPlanDay
    ): WorkoutSessionSnapshot {
        val exercises = day.toWorkoutExercises()
        require(exercises.isNotEmpty()) { "训练日没有可用动作" }
        val first = exercises.first()
        return WorkoutSessionSnapshot(
            sessionId = sessionId,
            planId = planId,
            planDayIndex = day.dayIndex,
            dayType = day.dayType,
            scheduledDate = day.scheduledDate,
            status = WorkoutStatus.NOT_STARTED,
            exercises = exercises,
            exerciseIndex = 0,
            setIndex = 1,
            restSecondsRemaining = null,
            weightInput = defaultWeightInput(first),
            repsInput = first.targetReps.toString(),
            startedAtEpochMs = null,
            completedAtEpochMs = null
        )
    }

    fun start(snapshot: WorkoutSessionSnapshot, nowEpochMs: Long): WorkoutSessionSnapshot {
        require(snapshot.status == WorkoutStatus.NOT_STARTED) { "只有未开始的训练可以启动" }
        return snapshot.copy(
            status = WorkoutStatus.IN_PROGRESS,
            startedAtEpochMs = nowEpochMs,
            restSecondsRemaining = null
        )
    }

    fun completeSet(
        snapshot: WorkoutSessionSnapshot,
        weightKg: Double?,
        actualReps: Int,
        nowEpochMs: Long
    ): Pair<WorkoutSessionSnapshot, CompletedSetRecord> {
        require(snapshot.status == WorkoutStatus.IN_PROGRESS) { "当前状态无法完成组数" }
        val exercise = snapshot.currentExercise ?: error("缺少当前动作")

        val record = CompletedSetRecord(
            exerciseId = exercise.exerciseId,
            exerciseNameCn = exercise.nameCn,
            setIndex = snapshot.setIndex,
            targetReps = exercise.targetReps,
            actualReps = actualReps,
            weightKg = weightKg,
            completedAtEpochMs = nowEpochMs
        )

        val isLastSetOfExercise = snapshot.setIndex >= exercise.targetSets
        val isLastExercise = snapshot.exerciseIndex >= snapshot.exercises.lastIndex

        if (isLastSetOfExercise) {
            return snapshot.copy(
                status = WorkoutStatus.AWAITING_EXERCISE_RPE,
                restSecondsRemaining = null
            ) to record
        }

        return snapshot.copy(
            status = WorkoutStatus.RESTING,
            setIndex = snapshot.setIndex + 1,
            restSecondsRemaining = exercise.targetRestSeconds
        ) to record
    }

    fun submitExerciseRpe(
        snapshot: WorkoutSessionSnapshot,
        rpe: Int,
        nowEpochMs: Long
    ): WorkoutSessionSnapshot {
        require(snapshot.status == WorkoutStatus.AWAITING_EXERCISE_RPE) { "当前不需要动作 RPE 反馈" }
        require(rpe in 6..10) { "RPE 需在 6-10 之间" }
        val exercise = snapshot.currentExercise ?: error("缺少当前动作")
        val feedback = ExerciseRpeFeedback(exerciseId = exercise.exerciseId, rpe = rpe)
        val feedbacks = snapshot.exerciseFeedbacks + feedback
        val isLastExercise = snapshot.exerciseIndex >= snapshot.exercises.lastIndex

        if (isLastExercise) {
            return snapshot.copy(
                status = WorkoutStatus.COMPLETED,
                exerciseFeedbacks = feedbacks,
                completedAtEpochMs = nowEpochMs
            )
        }

        val nextExercise = snapshot.exercises[snapshot.exerciseIndex + 1]
        return snapshot.copy(
            status = WorkoutStatus.RESTING,
            exerciseIndex = snapshot.exerciseIndex + 1,
            setIndex = 1,
            exerciseFeedbacks = feedbacks,
            restSecondsRemaining = exercise.targetRestSeconds,
            weightInput = defaultWeightInput(nextExercise),
            repsInput = nextExercise.targetReps.toString()
        )
    }

    fun skipRest(snapshot: WorkoutSessionSnapshot): WorkoutSessionSnapshot {
        require(snapshot.status == WorkoutStatus.RESTING || snapshot.status == WorkoutStatus.PAUSED) {
            "当前状态无法跳过休息"
        }
        return snapshot.copy(
            status = WorkoutStatus.IN_PROGRESS,
            restSecondsRemaining = null
        )
    }

    fun finishRest(snapshot: WorkoutSessionSnapshot): WorkoutSessionSnapshot {
        require(snapshot.status == WorkoutStatus.RESTING) { "当前不在休息中" }
        return snapshot.copy(
            status = WorkoutStatus.IN_PROGRESS,
            restSecondsRemaining = null
        )
    }

    fun tickRest(snapshot: WorkoutSessionSnapshot): WorkoutSessionSnapshot {
        if (snapshot.status != WorkoutStatus.RESTING) return snapshot
        val remaining = snapshot.restSecondsRemaining ?: return snapshot
        if (remaining <= 1) {
            return finishRest(snapshot.copy(restSecondsRemaining = 0))
        }
        return snapshot.copy(restSecondsRemaining = remaining - 1)
    }

    fun pause(snapshot: WorkoutSessionSnapshot): WorkoutSessionSnapshot {
        require(snapshot.status == WorkoutStatus.IN_PROGRESS || snapshot.status == WorkoutStatus.RESTING) {
            "当前状态无法暂停"
        }
        return snapshot.copy(status = WorkoutStatus.PAUSED)
    }

    fun resume(snapshot: WorkoutSessionSnapshot): WorkoutSessionSnapshot {
        require(snapshot.status == WorkoutStatus.PAUSED) { "当前不在暂停中" }
        return if ((snapshot.restSecondsRemaining ?: 0) > 0) {
            snapshot.copy(status = WorkoutStatus.RESTING)
        } else {
            snapshot.copy(status = WorkoutStatus.IN_PROGRESS)
        }
    }

    fun discard(snapshot: WorkoutSessionSnapshot, nowEpochMs: Long): WorkoutSessionSnapshot {
        require(snapshot.status.isActive() || snapshot.status == WorkoutStatus.NOT_STARTED) {
            "当前状态无法放弃训练"
        }
        return snapshot.copy(
            status = WorkoutStatus.ABANDONED,
            restSecondsRemaining = null,
            completedAtEpochMs = nowEpochMs
        )
    }

    private fun defaultWeightInput(exercise: WorkoutExercisePlan): String =
        exercise.recommendedWeightKg?.toString().orEmpty()
}
