package com.aifitnesspro.android.core.workout

import com.aifitnesspro.android.core.api.ApiPlanDay
import com.aifitnesspro.android.core.api.ApiPlanExercise
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class WorkoutStateMachineTest {
    private fun day() = ApiPlanDay(
        dayIndex = 0,
        dayType = "push",
        scheduledDate = "2026-05-20",
        exercises = listOf(
            ApiPlanExercise("e1", "卧推", 2, 10, 60, 40.0),
            ApiPlanExercise("e2", "划船", 1, 8, 45, 20.0)
        )
    )

    @Test
    fun startMovesToInProgress() {
        val created = WorkoutStateMachine.createNotStarted("s1", "p1", day())
        val started = WorkoutStateMachine.start(created, nowEpochMs = 1000L)

        assertEquals(WorkoutStatus.IN_PROGRESS, started.status)
        assertEquals(1000L, started.startedAtEpochMs)
    }

    @Test
    fun completeSetEntersRestBetweenSets() {
        val started = WorkoutStateMachine.start(
            WorkoutStateMachine.createNotStarted("s1", "p1", day()),
            nowEpochMs = 1000L
        )

        val (resting, record) = WorkoutStateMachine.completeSet(started, weightKg = 40.0, actualReps = 10, nowEpochMs = 2000L)

        assertEquals(WorkoutStatus.RESTING, resting.status)
        assertEquals(2, resting.setIndex)
        assertEquals(60, resting.restSecondsRemaining)
        assertEquals(1, record.setIndex)
    }

    @Test
    fun completingFinalSetMarksCompleted() {
        var snapshot = WorkoutStateMachine.start(
            WorkoutStateMachine.createNotStarted("s1", "p1", day()),
            nowEpochMs = 1000L
        )
        snapshot = WorkoutStateMachine.completeSet(snapshot, 40.0, 10, 2000L).first
        snapshot = WorkoutStateMachine.skipRest(snapshot)
        snapshot = WorkoutStateMachine.completeSet(snapshot, 40.0, 10, 3000L).first
        snapshot = WorkoutStateMachine.skipRest(snapshot)
        snapshot = WorkoutStateMachine.completeSet(snapshot, 20.0, 8, 4000L).first

        assertEquals(WorkoutStatus.COMPLETED, snapshot.status)
        assertEquals(4000L, snapshot.completedAtEpochMs)
    }

    @Test
    fun pauseAndResumePreservesRestingState() {
        val resting = WorkoutStateMachine.completeSet(
            WorkoutStateMachine.start(WorkoutStateMachine.createNotStarted("s1", "p1", day()), 1000L),
            40.0,
            10,
            2000L
        ).first

        val paused = WorkoutStateMachine.pause(resting)
        val resumed = WorkoutStateMachine.resume(paused)

        assertEquals(WorkoutStatus.PAUSED, paused.status)
        assertEquals(WorkoutStatus.RESTING, resumed.status)
    }

    @Test
    fun tickRestFinishesWhenCountdownEnds() {
        val resting = WorkoutStateMachine.completeSet(
            WorkoutStateMachine.start(WorkoutStateMachine.createNotStarted("s1", "p1", day()), 1000L),
            40.0,
            10,
            2000L
        ).first.copy(restSecondsRemaining = 1)

        val finished = WorkoutStateMachine.tickRest(resting)

        assertEquals(WorkoutStatus.IN_PROGRESS, finished.status)
        assertEquals(null, finished.restSecondsRemaining)
    }

    @Test
    fun discardMarksAbandoned() {
        val started = WorkoutStateMachine.start(
            WorkoutStateMachine.createNotStarted("s1", "p1", day()),
            nowEpochMs = 1000L
        )

        val abandoned = WorkoutStateMachine.discard(started, nowEpochMs = 5000L)

        assertEquals(WorkoutStatus.ABANDONED, abandoned.status)
        assertTrue(abandoned.completedAtEpochMs == 5000L)
    }
}
