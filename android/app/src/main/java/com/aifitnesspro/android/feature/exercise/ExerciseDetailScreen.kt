package com.aifitnesspro.android.feature.exercise

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.aifitnesspro.android.core.api.ApiExerciseDetail
import com.aifitnesspro.android.core.exercise.ExerciseRepository

@Composable
fun ExerciseDetailScreen(
    slug: String,
    devUserId: String?,
    exerciseRepository: ExerciseRepository,
    onBack: () -> Unit
) {
    var exercise by remember { mutableStateOf<ApiExerciseDetail?>(null) }
    var isLoading by remember { mutableStateOf(true) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(slug, devUserId) {
        if (devUserId == null) {
            isLoading = false
            errorMessage = "请先连接本地后端"
            return@LaunchedEffect
        }
        isLoading = true
        errorMessage = null
        runCatching { exerciseRepository.getExercise(devUserId, slug) }
            .onSuccess { exercise = it }
            .onFailure { error -> errorMessage = error.message ?: "动作详情加载失败" }
        isLoading = false
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(20.dp)
    ) {
        TextButton(onClick = onBack) { Text("返回动作库") }
        when {
            isLoading -> Text("动作详情加载中...")
            errorMessage != null -> Text(errorMessage ?: "加载失败", color = MaterialTheme.colorScheme.error)
            exercise == null -> Text("未找到动作")
            else -> ExerciseDetailContent(exercise!!)
        }
    }
}

@Composable
private fun ExerciseDetailContent(exercise: ApiExerciseDetail) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(20.dp)) {
            ExerciseMediaPreview(
                previewUrl = exercise.previewMediaUrl,
                mediaType = exercise.previewMediaType,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(200.dp)
                    .clip(RoundedCornerShape(12.dp))
            )
            Spacer(modifier = Modifier.height(12.dp))
            Text(exercise.nameCn, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
            Text(
                text = "${categoryLabel(exercise.category)} · ${difficultyLabel(exercise.difficulty)} · ${equipmentLabel(exercise.equipment)}",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            if (exercise.previewMediaUrl.isNullOrBlank()) {
                Spacer(modifier = Modifier.height(8.dp))
                Text("请先参考下方步骤与注意事项", style = MaterialTheme.typography.bodySmall)
            }
        }
    }

    Spacer(modifier = Modifier.height(16.dp))
    DetailSection(title = "动作步骤", items = exercise.instructions)
    DetailSection(title = "常见错误", items = exercise.commonMistakes)
    DetailSection(title = "安全提示", items = exercise.safetyNotes)
}

@Composable
private fun DetailSection(title: String, items: List<String>) {
    if (items.isEmpty()) return
    Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
    Spacer(modifier = Modifier.height(8.dp))
    items.forEachIndexed { index, item ->
        Text("${index + 1}. $item", modifier = Modifier.padding(vertical = 4.dp))
    }
    Spacer(modifier = Modifier.height(16.dp))
}
