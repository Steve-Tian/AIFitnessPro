package com.aifitnesspro.android.feature.training

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
fun TrainingScreen() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(20.dp)
    ) {
        Text("训练", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
        Text("这里将展示四周计划、训练历史和恢复训练入口。训练会话会在后续计划中实现。")
    }
}
