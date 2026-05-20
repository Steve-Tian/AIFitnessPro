package com.aifitnesspro.android.feature.home

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.aifitnesspro.android.core.api.ApiPlanDay
import com.aifitnesspro.android.core.plan.PlanRepository
import com.aifitnesspro.android.core.plan.findTodayDay
import java.time.LocalDate

@Composable
fun HomeScreen(
    planRepository: PlanRepository,
    devUserId: String?
) {
    val plan by planRepository.getActivePlan().collectAsState(initial = null)
    val todayDate = remember { LocalDate.now().toString() }
    val todayDay = plan?.let { findTodayDay(it, todayDate) }

    LaunchedEffect(devUserId) {
        if (devUserId != null) {
            runCatching { planRepository.refreshFromRemote(devUserId) }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(20.dp)
    ) {
        Text("今日训练", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(16.dp))

        when {
            plan == null -> NoPlanCard()
            todayDay == null || todayDay.dayType == "rest" -> RestDayCard()
            else -> TodayWorkoutCard(day = todayDay)
        }
    }
}

@Composable
private fun NoPlanCard() {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(20.dp)) {
            Text("正在准备你的训练计划…", style = MaterialTheme.typography.titleMedium)
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                "完成个人信息填写后，计划将自动生成并显示在这里。",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun RestDayCard() {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(20.dp)) {
            Text("今日休息 🛌", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(8.dp))
            Text("好好恢复，明天继续！", style = MaterialTheme.typography.bodyMedium)
        }
    }
}

@Composable
private fun TodayWorkoutCard(day: ApiPlanDay) {
    val dayLabel = when (day.dayType) {
        "push" -> "Push 推力日"
        "pull" -> "Pull 拉力日"
        "legs" -> "Legs 腿日"
        "full_body" -> "全身训练日"
        else -> day.dayType
    }
    val estimatedMinutes = estimateDuration(day)
    val previewNames = day.exercises.take(3).map { it.nameCn }

    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(20.dp)) {
            Text(
                "Day ${day.dayIndex + 1} · $dayLabel",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                "${day.exercises.size} 个动作 · 预计 $estimatedMinutes 分钟",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            if (previewNames.isNotEmpty()) {
                Spacer(modifier = Modifier.height(8.dp))
                Text(previewNames.joinToString(" / "), style = MaterialTheme.typography.bodyMedium)
            }
            day.dayNote?.let { note ->
                Spacer(modifier = Modifier.height(8.dp))
                Text(note, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.primary)
            }
            Spacer(modifier = Modifier.height(16.dp))
            Button(onClick = {}, modifier = Modifier.fillMaxWidth()) {
                Text("开始训练")
            }
        }
    }
}

private fun estimateDuration(day: ApiPlanDay): Int {
    val totalSeconds = day.exercises.sumOf { ex ->
        ex.targetSets * (ex.targetReps * 4 + ex.targetRestSeconds)
    }
    val minutes = totalSeconds / 60
    return ((minutes + 4) / 5) * 5
}
