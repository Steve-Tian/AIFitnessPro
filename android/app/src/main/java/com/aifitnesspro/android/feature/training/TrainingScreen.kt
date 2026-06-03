package com.aifitnesspro.android.feature.training

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.aifitnesspro.android.core.api.ApiPlanDay
import com.aifitnesspro.android.core.plan.PlanRepository
import com.aifitnesspro.android.core.workout.WorkoutSessionRepository

@Composable
fun TrainingScreen(
    planRepository: PlanRepository,
    workoutRepository: WorkoutSessionRepository,
    onStartWorkout: (Int) -> Unit
) {
    val plan by planRepository.getActivePlan().collectAsState(initial = null)
    val activeSession by workoutRepository.observeActiveSession().collectAsState(initial = null)
    val planId = plan?.id.orEmpty()
    val completedDays by workoutRepository.observeCompletedDayIndices(planId)
        .collectAsState(initial = emptySet())

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(20.dp)
    ) {
        Text("训练计划", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(12.dp))

        activeSession?.takeIf { it.status.isActive() }?.let { session ->
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("进行中的训练", fontWeight = FontWeight.Bold)
                    Text("Day ${session.planDayIndex + 1} · ${dayTypeLabel(session.dayType)}")
                    Spacer(modifier = Modifier.height(8.dp))
                    Button(
                        onClick = { onStartWorkout(session.planDayIndex) },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("继续训练")
                    }
                }
            }
            Spacer(modifier = Modifier.height(16.dp))
        }

        val trainingDays = plan?.days?.filter { it.dayType != "rest" }.orEmpty()
        if (trainingDays.isEmpty()) {
            Text("完成 Onboarding 后，这里会显示你的 28 天训练计划。")
        } else {
            trainingDays.forEach { day ->
                TrainingDayCard(
                    day = day,
                    isCompleted = day.dayIndex in completedDays,
                    isActive = activeSession?.let { it.planDayIndex == day.dayIndex && it.status.isActive() } ?: false,
                    onStartWorkout = onStartWorkout
                )
            }
        }
    }
}

@Composable
private fun TrainingDayCard(
    day: ApiPlanDay,
    isCompleted: Boolean,
    isActive: Boolean,
    onStartWorkout: (Int) -> Unit
) {
    val colors = if (isCompleted) {
        CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondaryContainer)
    } else {
        CardDefaults.cardColors()
    }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        colors = colors
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = "Day ${day.dayIndex + 1} · ${dayTypeLabel(day.dayType)}",
                fontWeight = FontWeight.Bold
            )
            Text("${day.exercises.size} 个动作")
            if (isCompleted) {
                Text(
                    text = "已完成",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.primary
                )
            }
            Spacer(modifier = Modifier.height(8.dp))
            when {
                isActive -> {
                    Button(
                        onClick = { onStartWorkout(day.dayIndex) },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("继续训练")
                    }
                }
                isCompleted -> {
                    OutlinedButton(
                        onClick = { onStartWorkout(day.dayIndex) },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("再练一次")
                    }
                }
                else -> {
                    Button(
                        onClick = { onStartWorkout(day.dayIndex) },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("开始这一天")
                    }
                }
            }
        }
    }
}

private fun dayTypeLabel(dayType: String): String = when (dayType) {
    "push" -> "Push 推力日"
    "pull" -> "Pull 拉力日"
    "legs" -> "Legs 腿日"
    "full_body" -> "全身训练日"
    else -> dayType
}
