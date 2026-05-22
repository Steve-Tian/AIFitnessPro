package com.aifitnesspro.android.feature.exercise

import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material3.Card
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
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
import com.aifitnesspro.android.core.api.ApiExerciseSummary
import com.aifitnesspro.android.core.exercise.ExerciseRepository

private data class ExerciseCategoryFilter(val id: String?, val label: String)

private val categoryFilters = listOf(
    ExerciseCategoryFilter(null, "全部"),
    ExerciseCategoryFilter("push", "推"),
    ExerciseCategoryFilter("pull", "拉"),
    ExerciseCategoryFilter("legs", "腿"),
    ExerciseCategoryFilter("core", "核心"),
    ExerciseCategoryFilter("full_body", "全身")
)

@Composable
fun ExerciseLibraryScreen(
    devUserId: String?,
    exerciseRepository: ExerciseRepository,
    onOpenExercise: (String) -> Unit
) {
    var keyword by remember { mutableStateOf("") }
    var selectedCategory by remember { mutableStateOf<String?>(null) }
    var exercises by remember { mutableStateOf<List<ApiExerciseSummary>>(emptyList()) }
    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(devUserId, selectedCategory, keyword) {
        if (devUserId == null) return@LaunchedEffect
        isLoading = true
        errorMessage = null
        runCatching {
            exerciseRepository.listExercises(
                devUserId = devUserId,
                category = selectedCategory,
                query = keyword.takeIf { it.isNotBlank() }
            )
        }.onSuccess { exercises = it }
            .onFailure { error ->
                exercises = emptyList()
                errorMessage = error.message ?: "动作库加载失败"
            }
        isLoading = false
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(20.dp)
    ) {
        Text("动作库", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
        Text(
            text = when {
                devUserId == null -> "连接后端后可浏览已发布动作"
                isLoading -> "加载中..."
                else -> "共 ${exercises.size} 个动作"
            },
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(modifier = Modifier.height(12.dp))

        OutlinedTextField(
            value = keyword,
            onValueChange = { keyword = it },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            label = { Text("搜索动作名称") }
        )
        Spacer(modifier = Modifier.height(12.dp))

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            categoryFilters.forEach { filter ->
                FilterChip(
                    selected = selectedCategory == filter.id,
                    onClick = { selectedCategory = filter.id },
                    label = { Text(filter.label) }
                )
            }
        }
        Spacer(modifier = Modifier.height(12.dp))

        when {
            devUserId == null -> Text("请先完成隐私同意并连接本地后端。")
            errorMessage != null -> Text(errorMessage ?: "动作库加载失败", color = MaterialTheme.colorScheme.error)
            exercises.isEmpty() && !isLoading -> Text("没有匹配的动作。")
            else -> LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(exercises, key = { it.slug }) { exercise ->
                    ExerciseListItem(exercise = exercise, onClick = { onOpenExercise(exercise.slug) })
                }
            }
        }
    }
}

@Composable
private fun ExerciseListItem(exercise: ApiExerciseSummary, onClick: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            ExerciseMediaPreview(
                previewUrl = exercise.previewMediaUrl,
                mediaType = exercise.previewMediaType,
                modifier = Modifier
                    .size(width = 72.dp, height = 72.dp)
                    .clip(RoundedCornerShape(8.dp))
            )
            Column(modifier = Modifier.weight(1f)) {
            Text(exercise.nameCn, fontWeight = FontWeight.Bold)
            Text(
                text = "${categoryLabel(exercise.category)} · ${difficultyLabel(exercise.difficulty)} · ${equipmentLabel(exercise.equipment)}",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            if (exercise.primaryMuscles.isNotEmpty()) {
                Text(
                    text = "主练 ${exercise.primaryMuscles.joinToString(" / ")}",
                    style = MaterialTheme.typography.bodySmall
                )
            }
            }
        }
    }
}

internal fun categoryLabel(category: String): String = when (category) {
    "push" -> "推"
    "pull" -> "拉"
    "legs" -> "腿"
    "core" -> "核心"
    "full_body" -> "全身"
    else -> category
}

internal fun difficultyLabel(difficulty: String): String = when (difficulty) {
    "beginner" -> "初级"
    "intermediate" -> "中级"
    "advanced" -> "高级"
    else -> difficulty
}

internal fun equipmentLabel(equipment: List<String>): String {
    if (equipment.isEmpty()) return "徒手"
    val labels = equipment.map { item ->
        when (item) {
            "full_gym" -> "健身房"
            "barbell_bench" -> "杠铃"
            "dumbbell_only" -> "哑铃"
            "bodyweight" -> "徒手"
            "cable" -> "绳索"
            else -> item
        }
    }
    return labels.distinct().take(2).joinToString(" / ")
}
