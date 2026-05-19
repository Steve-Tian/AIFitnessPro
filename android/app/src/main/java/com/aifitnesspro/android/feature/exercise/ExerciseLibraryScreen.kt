package com.aifitnesspro.android.feature.exercise

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

@Composable
fun ExerciseLibraryScreen() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(20.dp)
    ) {
        Text("动作库", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
        Text("第一版目标是至少 70 个动作，核心 30 个动作带 GIF 或短视频。")
    }
}
