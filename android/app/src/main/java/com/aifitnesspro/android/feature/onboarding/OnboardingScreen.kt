package com.aifitnesspro.android.feature.onboarding

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.aifitnesspro.android.core.api.UpsertProfileRequest
import kotlinx.coroutines.launch

data class OnboardingFormState(
    val goal: String = "",
    val experience: String = "",
    val equipment: List<String> = emptyList(),
    val gender: String = "",
    val age: String = "",
    val heightCm: String = "",
    val weightKg: String = "",
    val daysPerWeek: Int = 0,
    val persona: String = ""
) {
    private val ageInt get() = age.toIntOrNull() ?: -1
    private val heightInt get() = heightCm.toIntOrNull() ?: -1
    private val weightDouble get() = weightKg.toDoubleOrNull() ?: -1.0

    fun isStepValid(step: Int): Boolean = when (step) {
        1 -> goal.isNotBlank()
        2 -> experience.isNotBlank()
        3 -> equipment.isNotEmpty()
        4 -> gender.isNotBlank() && ageInt > 0 && heightInt > 0 && weightDouble > 0.0
        5 -> daysPerWeek in 3..5
        6 -> persona.isNotBlank()
        else -> false
    }

    fun toRequest() = UpsertProfileRequest(
        gender = gender,
        age = ageInt,
        heightCm = heightInt,
        weightKg = weightDouble,
        goal = goal,
        experience = experience,
        daysPerWeek = daysPerWeek,
        equipment = equipment,
        persona = persona
    )
}

@Composable
fun OnboardingScreen(onComplete: suspend (OnboardingFormState) -> Unit) {
    var step by rememberSaveable { mutableIntStateOf(1) }
    var goal by rememberSaveable { mutableStateOf("") }
    var experience by rememberSaveable { mutableStateOf("") }
    var equipment by rememberSaveable { mutableStateOf(listOf<String>()) }
    var gender by rememberSaveable { mutableStateOf("") }
    var age by rememberSaveable { mutableStateOf("") }
    var heightCm by rememberSaveable { mutableStateOf("") }
    var weightKg by rememberSaveable { mutableStateOf("") }
    var daysPerWeek by rememberSaveable { mutableIntStateOf(0) }
    var persona by rememberSaveable { mutableStateOf("") }
    var submitting by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    val formState = OnboardingFormState(
        goal = goal, experience = experience, equipment = equipment,
        gender = gender, age = age, heightCm = heightCm, weightKg = weightKg,
        daysPerWeek = daysPerWeek, persona = persona
    )
    val scope = rememberCoroutineScope()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp)
            .verticalScroll(rememberScrollState())
    ) {
        LinearProgressIndicator(
            progress = { step / 6f },
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text("步骤 $step / 6", style = MaterialTheme.typography.labelMedium)
        Spacer(modifier = Modifier.height(24.dp))

        when (step) {
            1 -> StepGoal(selected = goal, onSelect = { goal = it })
            2 -> StepExperience(selected = experience, onSelect = { experience = it })
            3 -> StepEquipment(selected = equipment, onToggle = { item ->
                equipment = if (equipment.contains(item)) equipment - item else equipment + item
            })
            4 -> StepBodyData(
                gender = gender, age = age, heightCm = heightCm, weightKg = weightKg,
                onGender = { gender = it }, onAge = { age = it },
                onHeightCm = { heightCm = it }, onWeightKg = { weightKg = it }
            )
            5 -> StepDaysPerWeek(selected = daysPerWeek, onSelect = { daysPerWeek = it })
            6 -> StepPersona(selected = persona, onSelect = { persona = it })
        }

        errorMessage?.let {
            Spacer(modifier = Modifier.height(12.dp))
            Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
        }

        Spacer(modifier = Modifier.height(24.dp))

        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            if (step > 1) {
                OutlinedButton(
                    onClick = { step--; errorMessage = null },
                    modifier = Modifier.weight(1f),
                    enabled = !submitting
                ) { Text("上一步") }
            }
            Button(
                onClick = {
                    if (step < 6) {
                        step++
                        errorMessage = null
                    } else {
                        scope.launch {
                            submitting = true
                            errorMessage = null
                            try {
                                onComplete(formState)
                            } catch (e: Exception) {
                                errorMessage = e.message ?: "提交失败，请重试"
                                submitting = false
                            }
                        }
                    }
                },
                modifier = Modifier.weight(1f),
                enabled = formState.isStepValid(step) && !submitting
            ) {
                Text(
                    when {
                        submitting -> "提交中…"
                        step == 6 -> "完成"
                        else -> "下一步"
                    }
                )
            }
        }
    }
}

@Composable
private fun StepGoal(selected: String, onSelect: (String) -> Unit) {
    val options = listOf(
        "strength" to "增肌力量", "cut" to "减脂塑形", "bulk" to "增肌增重", "fitness" to "综合健康"
    )
    StepCardGroup(title = "你的训练目标是什么？", options = options, selected = selected, onSelect = onSelect)
}

@Composable
private fun StepExperience(selected: String, onSelect: (String) -> Unit) {
    val options = listOf(
        "beginner" to "新手（< 1年）", "intermediate" to "进阶（1–3年）", "advanced" to "高阶（3年以上）"
    )
    StepCardGroup(title = "你的训练经验？", options = options, selected = selected, onSelect = onSelect)
}

@Composable
private fun StepEquipment(selected: List<String>, onToggle: (String) -> Unit) {
    val options = listOf(
        "full_gym" to "完整健身房", "barbell_bench" to "杠铃+卧推凳",
        "dumbbell_only" to "仅哑铃", "bodyweight" to "徒手"
    )
    Column {
        Text("你能用到哪些器械？", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        Text("可多选", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Spacer(modifier = Modifier.height(16.dp))
        options.forEach { (key, label) ->
            val isSelected = selected.contains(key)
            OutlinedButton(
                onClick = { onToggle(key) },
                modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                border = BorderStroke(
                    width = if (isSelected) 2.dp else 1.dp,
                    color = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outline
                ),
                colors = ButtonDefaults.outlinedButtonColors(
                    containerColor = if (isSelected) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surface
                )
            ) { Text(label) }
        }
    }
}

@Composable
private fun StepBodyData(
    gender: String, age: String, heightCm: String, weightKg: String,
    onGender: (String) -> Unit, onAge: (String) -> Unit,
    onHeightCm: (String) -> Unit, onWeightKg: (String) -> Unit
) {
    Column {
        Text("基本体测信息", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(16.dp))

        Text("性别", style = MaterialTheme.typography.labelLarge)
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            listOf("male" to "男", "female" to "女", "other" to "其他").forEach { (key, label) ->
                FilterChip(selected = gender == key, onClick = { onGender(key) }, label = { Text(label) })
            }
        }
        Spacer(modifier = Modifier.height(12.dp))

        OutlinedTextField(
            value = age, onValueChange = onAge,
            label = { Text("年龄") },
            placeholder = { Text("请输入年龄") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            isError = age.isNotBlank() && (age.toIntOrNull() ?: -1) <= 0,
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(modifier = Modifier.height(8.dp))

        OutlinedTextField(
            value = heightCm, onValueChange = onHeightCm,
            label = { Text("身高（cm）") },
            placeholder = { Text("请输入身高") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            isError = heightCm.isNotBlank() && (heightCm.toIntOrNull() ?: -1) <= 0,
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(modifier = Modifier.height(8.dp))

        OutlinedTextField(
            value = weightKg, onValueChange = onWeightKg,
            label = { Text("体重（kg）") },
            placeholder = { Text("请输入体重") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
            isError = weightKg.isNotBlank() && (weightKg.toDoubleOrNull() ?: -1.0) <= 0.0,
            modifier = Modifier.fillMaxWidth()
        )
    }
}

@Composable
private fun StepDaysPerWeek(selected: Int, onSelect: (Int) -> Unit) {
    val options = listOf(3 to "每周3天", 4 to "每周4天", 5 to "每周5天")
    Column {
        Text("每周训练几天？", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(16.dp))
        options.forEach { (days, label) ->
            val isSelected = selected == days
            OutlinedButton(
                onClick = { onSelect(days) },
                modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                border = BorderStroke(
                    width = if (isSelected) 2.dp else 1.dp,
                    color = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outline
                ),
                colors = ButtonDefaults.outlinedButtonColors(
                    containerColor = if (isSelected) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surface
                )
            ) { Text(label) }
        }
    }
}

@Composable
private fun StepPersona(selected: String, onSelect: (String) -> Unit) {
    val options = listOf(
        "coach" to "严格教练 🎯", "buddy" to "训练搭档 💪",
        "comedian" to "幽默段子手 😄", "beauty_coach" to "美丽导师 ✨"
    )
    StepCardGroup(title = "选择你喜欢的陪伴风格", options = options, selected = selected, onSelect = onSelect)
}

@Composable
private fun StepCardGroup(
    title: String,
    options: List<Pair<String, String>>,
    selected: String,
    onSelect: (String) -> Unit
) {
    Column {
        Text(title, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(16.dp))
        options.forEach { (key, label) ->
            val isSelected = selected == key
            OutlinedButton(
                onClick = { onSelect(key) },
                modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                border = BorderStroke(
                    width = if (isSelected) 2.dp else 1.dp,
                    color = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outline
                ),
                colors = ButtonDefaults.outlinedButtonColors(
                    containerColor = if (isSelected) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surface
                )
            ) { Text(label) }
        }
    }
}
