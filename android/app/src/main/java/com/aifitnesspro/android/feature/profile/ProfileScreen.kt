package com.aifitnesspro.android.feature.profile

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.aifitnesspro.android.core.session.ApiConnectionState

@Composable
fun ProfileScreen(
    apiConnectionState: ApiConnectionState
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(20.dp)
    ) {
        Text("我的", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(12.dp))
        Text(
            text = when (apiConnectionState) {
                ApiConnectionState.Idle -> "本地后端：待连接"
                ApiConnectionState.Connecting -> "本地后端：连接中..."
                is ApiConnectionState.Connected ->
                    "本地后端：已连接，开发用户 ${apiConnectionState.user.id.take(8)}"
                is ApiConnectionState.Failed -> "本地后端：连接失败，${apiConnectionState.message}"
            },
            style = MaterialTheme.typography.bodyMedium
        )
        Spacer(modifier = Modifier.height(12.dp))
        Text("这里将包含个人资料、反馈模式、训练提醒、隐私政策、用户协议、权限管理和账号注销。")
    }
}
