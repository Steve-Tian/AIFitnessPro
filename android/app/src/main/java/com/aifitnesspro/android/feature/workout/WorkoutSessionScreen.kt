package com.aifitnesspro.android.feature.workout

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import com.aifitnesspro.android.core.plan.PlanRepository
import com.aifitnesspro.android.core.workout.WorkoutSessionRepository
import com.aifitnesspro.android.core.workout.WorkoutSessionSnapshot
import com.aifitnesspro.android.core.workout.WorkoutStatus
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.filterNotNull
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

@Composable
fun WorkoutSessionScreen(
    dayIndex: Int,
    planRepository: PlanRepository,
    workoutRepository: WorkoutSessionRepository,
    onFinished: () -> Unit,
    onBack: () -> Unit
) {
    val scope = rememberCoroutineScope()
    var snapshot by remember { mutableStateOf<WorkoutSessionSnapshot?>(null) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var showDiscardDialog by remember { mutableStateOf(false) }
    var completedSetCount by remember { mutableIntStateOf(0) }
    val lifecycleOwner = LocalLifecycleOwner.current
    val latestSnapshot by rememberUpdatedState(snapshot)

    LaunchedEffect(dayIndex) {
        runCatching {
            val plan = planRepository.getActivePlan().filterNotNull().first()
            val day = plan.days.firstOrNull { it.dayIndex == dayIndex }
                ?: error("找不到对应训练日")
            snapshot = workoutRepository.prepareSession(plan.id, day)
        }.onFailure { error ->
            errorMessage = error.message ?: "无法加载训练"
        }
    }

    LaunchedEffect(snapshot?.status, snapshot?.sessionId) {
        val session = snapshot ?: return@LaunchedEffect
        if (session.status == WorkoutStatus.COMPLETED) {
            completedSetCount = workoutRepository.getCompletedSets(session.sessionId).size
        }
    }

    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            val current = latestSnapshot ?: return@LifecycleEventObserver
            when (event) {
                Lifecycle.Event.ON_STOP -> {
                    if (current.status == WorkoutStatus.IN_PROGRESS || current.status == WorkoutStatus.RESTING) {
                        scope.launch { snapshot = workoutRepository.pauseSession(current) }
                    }
                }
                Lifecycle.Event.ON_START -> {
                    if (current.status == WorkoutStatus.PAUSED) {
                        scope.launch { snapshot = workoutRepository.resumeSession(current) }
                    }
                }
                else -> Unit
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }

    LaunchedEffect(snapshot?.status, snapshot?.restSecondsRemaining, snapshot?.sessionId) {
        val current = snapshot ?: return@LaunchedEffect
        if (current.status != WorkoutStatus.RESTING) return@LaunchedEffect
        while (true) {
            delay(1000)
            val latest = snapshot ?: break
            if (latest.status != WorkoutStatus.RESTING) break
            snapshot = workoutRepository.tickRest(latest)
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(20.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            TextButton(onClick = onBack) { Text("返回") }
            TextButton(onClick = { showDiscardDialog = true }) { Text("放弃训练") }
        }

        errorMessage?.let {
            Text(it, color = MaterialTheme.colorScheme.error)
            return@Column
        }

        val session = snapshot ?: run {
            Text("加载训练中…")
            return@Column
        }

        when (session.status) {
            WorkoutStatus.NOT_STARTED -> PreStartContent(
                snapshot = session,
                onStart = {
                    scope.launch { snapshot = workoutRepository.startSession(session) }
                }
            )
            WorkoutStatus.IN_PROGRESS -> InProgressContent(
                snapshot = session,
                onWeightChange = { weight ->
                    scope.launch {
                        snapshot = workoutRepository.updateInputs(session, weight, session.repsInput)
                    }
                },
                onRepsChange = { reps ->
                    scope.launch {
                        snapshot = workoutRepository.updateInputs(session, session.weightInput, reps)
                    }
                },
                onCompleteSet = {
                    scope.launch {
                        val reps = session.repsInput.toIntOrNull()
                        if (reps == null || reps <= 0) {
                            errorMessage = "请输入有效次数"
                            return@launch
                        }
                        val weight = session.weightInput.toDoubleOrNull()
                        snapshot = workoutRepository.completeSet(session, weight, reps)
                        errorMessage = null
                    }
                }
            )
            WorkoutStatus.RESTING, WorkoutStatus.PAUSED -> RestingContent(
                snapshot = session,
                onSkipRest = {
                    scope.launch { snapshot = workoutRepository.skipRest(session) }
                }
            )
            WorkoutStatus.COMPLETED -> SummaryContent(
                snapshot = session,
                completedSetCount = completedSetCount,
                onDone = onFinished
            )
            WorkoutStatus.ABANDONED -> {
                Text("训练已放弃")
                Spacer(modifier = Modifier.height(12.dp))
                Button(onClick = onFinished, modifier = Modifier.fillMaxWidth()) {
                    Text("返回首页")
                }
            }
        }
    }

    if (showDiscardDialog) {
        AlertDialog(
            onDismissRequest = { showDiscardDialog = false },
            title = { Text("放弃训练？") },
            text = { Text("已完成的组数会保留在本地记录中。") },
            confirmButton = {
                TextButton(onClick = {
                    showDiscardDialog = false
                    scope.launch {
                        val current = snapshot ?: return@launch
                        snapshot = workoutRepository.discardSession(current)
                    }
                }) { Text("放弃") }
            },
            dismissButton = {
                TextButton(onClick = { showDiscardDialog = false }) { Text("继续训练") }
            }
        )
    }
}

@Composable
private fun PreStartContent(snapshot: WorkoutSessionSnapshot, onStart: () -> Unit) {
    Column {
        Text("准备开始", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(8.dp))
        Text("Day ${snapshot.planDayIndex + 1} · ${snapshot.dayType}")
        Spacer(modifier = Modifier.height(16.dp))
        snapshot.exercises.forEach { exercise ->
            Text("· ${exercise.nameCn} · ${exercise.targetSets}×${exercise.targetReps}")
        }
        Spacer(modifier = Modifier.height(24.dp))
        Button(onClick = onStart, modifier = Modifier.fillMaxWidth()) {
            Text("开始训练")
        }
    }
}

@Composable
private fun InProgressContent(
    snapshot: WorkoutSessionSnapshot,
    onWeightChange: (String) -> Unit,
    onRepsChange: (String) -> Unit,
    onCompleteSet: () -> Unit
) {
    val exercise = snapshot.currentExercise ?: return
    val progress = snapshot.completedSetCount.toFloat() / snapshot.totalSets.coerceAtLeast(1)

    Column {
        LinearProgressIndicator(progress = { progress }, modifier = Modifier.fillMaxWidth())
        Spacer(modifier = Modifier.height(16.dp))
        Text(exercise.nameCn, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
        Text(
            "第 ${snapshot.setIndex} / ${exercise.targetSets} 组 · 目标 ${exercise.targetReps} 次",
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(modifier = Modifier.height(16.dp))
        OutlinedTextField(
            value = snapshot.weightInput,
            onValueChange = onWeightChange,
            label = { Text("重量 (kg，可选)") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(modifier = Modifier.height(8.dp))
        OutlinedTextField(
            value = snapshot.repsInput,
            onValueChange = onRepsChange,
            label = { Text("次数") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(modifier = Modifier.height(24.dp))
        Button(onClick = onCompleteSet, modifier = Modifier.fillMaxWidth()) {
            Text("完成本组")
        }
    }
}

@Composable
private fun RestingContent(snapshot: WorkoutSessionSnapshot, onSkipRest: () -> Unit) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(20.dp)) {
            Text(
                if (snapshot.status == WorkoutStatus.PAUSED) "训练已暂停" else "组间休息",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = snapshot.restSecondsRemaining?.toString()?.plus(" 秒") ?: "准备继续",
                style = MaterialTheme.typography.displaySmall
            )
            Spacer(modifier = Modifier.height(16.dp))
            OutlinedButton(onClick = onSkipRest, modifier = Modifier.fillMaxWidth()) {
                Text("跳过休息")
            }
        }
    }
}

@Composable
private fun SummaryContent(
    snapshot: WorkoutSessionSnapshot,
    completedSetCount: Int,
    onDone: () -> Unit
) {
    Column {
        Text("训练完成 🎉", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(12.dp))
        Text("完成 ${completedSetCount.coerceAtLeast(snapshot.totalSets)} 组")
        snapshot.startedAtEpochMs?.let { started ->
            snapshot.completedAtEpochMs?.let { completed ->
                val minutes = ((completed - started) / 1000 / 60).coerceAtLeast(1)
                Text("用时约 $minutes 分钟")
            }
        }
        Spacer(modifier = Modifier.height(24.dp))
        Button(onClick = onDone, modifier = Modifier.fillMaxWidth()) {
            Text("返回首页")
        }
    }
}
