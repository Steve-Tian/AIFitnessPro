package com.aifitnesspro.android.feature.profile

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.aifitnesspro.android.BuildConfig
import com.aifitnesspro.android.core.api.AIFitnessApiClient
import com.aifitnesspro.android.core.api.ApiAchievement
import com.aifitnesspro.android.core.api.ApiUserStats
import kotlinx.coroutines.launch

@Composable
fun ProfileScreen(
    devUserId: String?,
    apiClient: AIFitnessApiClient,
    onAccountDeleted: () -> Unit
) {
    val scope = rememberCoroutineScope()
    var stats by remember { mutableStateOf<ApiUserStats?>(null) }
    var achievements by remember { mutableStateOf<List<ApiAchievement>>(emptyList()) }
    var loadError by remember { mutableStateOf<String?>(null) }
    var showDeleteDialog by remember { mutableStateOf(false) }
    var deleteInProgress by remember { mutableStateOf(false) }

    LaunchedEffect(devUserId) {
        if (devUserId == null) return@LaunchedEffect
        runCatching {
            stats = apiClient.getUserStats(devUserId)
            achievements = apiClient.listAchievements(devUserId)
        }.onFailure { loadError = it.message }
    }

    if (showDeleteDialog) {
        AlertDialog(
            onDismissRequest = { if (!deleteInProgress) showDeleteDialog = false },
            title = { Text("注销账号") },
            text = { Text("注销后所有训练数据将被永久删除，无法恢复。确定要注销吗？") },
            confirmButton = {
                TextButton(
                    onClick = {
                        if (deleteInProgress) return@TextButton
                        deleteInProgress = true
                        scope.launch {
                            runCatching { apiClient.deleteAccount(devUserId!!) }
                                .onSuccess { onAccountDeleted() }
                                .onFailure {
                                    deleteInProgress = false
                                    showDeleteDialog = false
                                    loadError = "注销失败：${it.message}"
                                }
                        }
                    }
                ) {
                    if (deleteInProgress) CircularProgressIndicator(modifier = Modifier.height(16.dp).width(16.dp))
                    else Text("确认注销", color = MaterialTheme.colorScheme.error)
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteDialog = false }) { Text("取消") }
            }
        )
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item { Spacer(modifier = Modifier.height(8.dp)) }
        item {
            Text("我的", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
        }

        // Stats card
        item {
            StatsCard(stats = stats)
        }

        // Achievements
        if (achievements.isNotEmpty()) {
            item {
                Text("成就", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            }
            item {
                LazyRow(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    items(achievements) { achievement ->
                        AchievementChip(achievement = achievement)
                    }
                }
            }
        }

        // Settings
        item {
            Text("设置", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        }
        item {
            SettingsGroup {
                SettingsItem(label = "隐私政策", url = "https://steve-tian.github.io/AIFitnessPro/legal/privacy.html")
                HorizontalDivider()
                SettingsItem(label = "用户协议", url = "https://steve-tian.github.io/AIFitnessPro/legal/terms.html")
                HorizontalDivider()
                PermissionsItem()
                HorizontalDivider()
                VersionItem()
            }
        }

        // Danger zone
        item {
            Text("账号", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        }
        item {
            Card(modifier = Modifier.fillMaxWidth()) {
                TextButton(
                    onClick = { showDeleteDialog = true },
                    modifier = Modifier.fillMaxWidth().padding(4.dp)
                ) {
                    Text("注销账号", color = MaterialTheme.colorScheme.error)
                }
            }
        }

        loadError?.let { msg ->
            item {
                Text(msg, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
            }
        }

        item { Spacer(modifier = Modifier.height(16.dp)) }
    }
}

@Composable
private fun StatsCard(stats: ApiUserStats?) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)
    ) {
        if (stats == null) {
            Box(modifier = Modifier.fillMaxWidth().height(80.dp), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        } else {
            Row(
                modifier = Modifier.fillMaxWidth().padding(20.dp),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                StatItem(value = stats.completedSessions.toString(), label = "已完成")
                StatItem(value = "${stats.currentStreak}", label = "连续天数")
                StatItem(value = "${stats.longestStreak}", label = "最长连续")
                val hours = stats.totalDurationSeconds / 3600
                val minutes = (stats.totalDurationSeconds % 3600) / 60
                val durationText = if (hours > 0) "${hours}h${minutes}m" else "${minutes}min"
                StatItem(value = durationText, label = "总时长")
            }
        }
    }
}

@Composable
private fun StatItem(value: String, label: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(value, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
        Text(label, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.7f))
    }
}

@Composable
private fun AchievementChip(achievement: ApiAchievement) {
    val isUnlocked = achievement.unlockedAt != null
    Card(
        colors = CardDefaults.cardColors(
            containerColor = if (isUnlocked) MaterialTheme.colorScheme.secondaryContainer
            else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
        )
    ) {
        Column(
            modifier = Modifier.padding(12.dp).width(72.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                achievement.iconEmoji,
                style = MaterialTheme.typography.headlineMedium,
                color = if (isUnlocked) Color.Unspecified else Color.Gray
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                achievement.nameCn,
                style = MaterialTheme.typography.labelSmall,
                color = if (isUnlocked) MaterialTheme.colorScheme.onSecondaryContainer else Color.Gray
            )
        }
    }
}

@Composable
private fun SettingsGroup(content: @Composable () -> Unit) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(vertical = 4.dp)) {
            content()
        }
    }
}

@Composable
private fun SettingsItem(label: String, url: String) {
    val context = LocalContext.current
    Surface(
        onClick = {
            context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
        },
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 14.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(label, style = MaterialTheme.typography.bodyMedium)
            Text("›", style = MaterialTheme.typography.bodyLarge, color = MaterialTheme.colorScheme.outline)
        }
    }
}

@Composable
private fun PermissionsItem() {
    var show by remember { mutableStateOf(false) }
    if (show) {
        AlertDialog(
            onDismissRequest = { show = false },
            title = { Text("权限说明") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text("• 网络访问（必要）：同步训练数据、加载动作图片", style = MaterialTheme.typography.bodySmall)
                    Text("• 通知（可选）：训练提醒，仅在您开启时使用", style = MaterialTheme.typography.bodySmall)
                    Text("• 本应用不请求相机、位置、通讯录、麦克风或蓝牙权限", style = MaterialTheme.typography.bodySmall)
                }
            },
            confirmButton = { TextButton(onClick = { show = false }) { Text("了解") } }
        )
    }
    Surface(onClick = { show = true }, modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 14.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("权限说明", style = MaterialTheme.typography.bodyMedium)
            Text("›", style = MaterialTheme.typography.bodyLarge, color = MaterialTheme.colorScheme.outline)
        }
    }
}

@Composable
private fun VersionItem() {
    Row(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 14.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text("版本", style = MaterialTheme.typography.bodyMedium)
        Text(
            BuildConfig.VERSION_NAME,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.outline
        )
    }
}
