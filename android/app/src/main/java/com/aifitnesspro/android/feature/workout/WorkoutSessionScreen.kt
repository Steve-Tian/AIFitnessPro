package com.aifitnesspro.android.feature.workout

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.ui.Alignment
import androidx.compose.ui.draw.clip
import coil.compose.AsyncImage
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.FilterChip
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
    // 记录本次训练中已经预览过的动作，避免同一动作第2组以后重复弹预览
    val previewedExerciseIds = remember { mutableSetOf<String>() }
    var showingPreview by remember { mutableStateOf(false) }
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

    // 每次切换到新动作（IN_PROGRESS 且第1组）时触发动作预览
    LaunchedEffect(snapshot?.exerciseIndex, snapshot?.status) {
        val session = snapshot ?: return@LaunchedEffect
        val exercise = session.currentExercise ?: return@LaunchedEffect
        if (session.status == WorkoutStatus.IN_PROGRESS
            && session.setIndex == 1
            && exercise.exerciseId !in previewedExerciseIds
        ) {
            showingPreview = true
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
            WorkoutStatus.IN_PROGRESS -> if (showingPreview) {
                ExercisePreviewContent(
                    snapshot = session,
                    onStart = {
                        session.currentExercise?.exerciseId?.let { previewedExerciseIds.add(it) }
                        showingPreview = false
                    }
                )
            } else {
                InProgressContent(
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
            }
            WorkoutStatus.RESTING, WorkoutStatus.PAUSED -> RestingContent(
                snapshot = session,
                onSkipRest = {
                    scope.launch { snapshot = workoutRepository.skipRest(session) }
                }
            )
            WorkoutStatus.AWAITING_EXERCISE_RPE -> ExerciseRpeContent(
                snapshot = session,
                onSubmit = { rpe ->
                    scope.launch {
                        snapshot = workoutRepository.submitExerciseRpe(session, rpe)
                        errorMessage = null
                    }
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

// 通用训练要点：适用于绝大多数力量训练动作
private val UNIVERSAL_TRAINING_TIPS = listOf(
    "💪 专注感受目标肌肉发力，避免借力代偿",
    "🔽 离心阶段（放下重量）控制 2 秒，增强肌肉刺激",
    "🫁 发力时呼气，还原时吸气，保持呼吸节律",
    "⚙️ 先用轻重量做1组热身，再按计划重量训练",
    "⚠️ 如感到关节疼痛请立即停止，调整重量或动作"
)

@Composable
private fun ExercisePreviewContent(
    snapshot: WorkoutSessionSnapshot,
    onStart: () -> Unit
) {
    val exercise = snapshot.currentExercise ?: return
    val exerciseNumber = snapshot.exerciseIndex + 1
    val totalExercises = snapshot.exercises.size

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .verticalScroll(rememberScrollState())
    ) {
        // 动作序号标签
        Text(
            "第 $exerciseNumber / $totalExercises 个动作",
            style = MaterialTheme.typography.labelLarge,
            color = MaterialTheme.colorScheme.primary
        )
        Spacer(Modifier.height(6.dp))

        // 动作名称
        Text(
            exercise.nameCn,
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold
        )
        Spacer(Modifier.height(4.dp))

        // 目标组数 × 次数 + 参考重量
        val weightInfo = exercise.recommendedWeightKg?.let { " · 参考 ${it}kg" } ?: ""
        Text(
            "${exercise.targetSets} 组 × ${exercise.targetReps} 次$weightInfo",
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(Modifier.height(16.dp))

        // 动作示范图（大图展示）
        if (!exercise.previewMediaUrl.isNullOrBlank()) {
            AsyncImage(
                model = exercise.previewMediaUrl,
                contentDescription = "${exercise.nameCn} 动作示范",
                modifier = Modifier
                    .fillMaxWidth()
                    .height(260.dp)
                    .clip(RoundedCornerShape(16.dp))
            )
        } else {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(160.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(MaterialTheme.colorScheme.surfaceVariant),
                contentAlignment = Alignment.Center
            ) {
                Text("动图同步中", color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
        Spacer(Modifier.height(20.dp))

        // 训练要点卡片
        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    "训练要点",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold
                )
                Spacer(Modifier.height(10.dp))
                UNIVERSAL_TRAINING_TIPS.forEach { tip ->
                    Text(
                        tip,
                        style = MaterialTheme.typography.bodyMedium,
                        modifier = Modifier.padding(vertical = 3.dp)
                    )
                }
            }
        }
        Spacer(Modifier.height(24.dp))

        // 开始按钮
        Button(
            onClick = onStart,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("明白了，开始训练")
        }
        Spacer(Modifier.height(16.dp))
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
        Spacer(modifier = Modifier.height(12.dp))

        // 动作参考缩略图（训练中小图，方便记住动作）
        if (!exercise.previewMediaUrl.isNullOrBlank()) {
            AsyncImage(
                model = exercise.previewMediaUrl,
                contentDescription = "${exercise.nameCn} 动作参考",
                modifier = Modifier
                    .fillMaxWidth()
                    .height(120.dp)
                    .clip(RoundedCornerShape(10.dp))
            )
        }
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
private fun ExerciseRpeContent(
    snapshot: WorkoutSessionSnapshot,
    onSubmit: (Int) -> Unit
) {
    val exercise = snapshot.pendingRpeExercise ?: return
    var selectedRpe by remember(exercise.exerciseId) { mutableIntStateOf(8) }

    Column {
        Text("动作强度反馈", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "${exercise.nameCn} 完成了，这组练得有多吃力？",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(modifier = Modifier.height(16.dp))
        Text("RPE（6 = 轻松，10 = 力竭）", style = MaterialTheme.typography.labelLarge)
        Spacer(modifier = Modifier.height(8.dp))
        Row(
            modifier = Modifier.horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            (6..10).forEach { value ->
                FilterChip(
                    selected = selectedRpe == value,
                    onClick = { selectedRpe = value },
                    label = { Text("$value") }
                )
            }
        }
        Spacer(modifier = Modifier.height(24.dp))
        Button(onClick = { onSubmit(selectedRpe) }, modifier = Modifier.fillMaxWidth()) {
            Text("确认并继续")
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
        if (snapshot.exerciseFeedbacks.isNotEmpty()) {
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "已记录 ${snapshot.exerciseFeedbacks.size} 个动作的 RPE 反馈",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
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
