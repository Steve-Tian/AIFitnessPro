package com.aifitnesspro.android.feature.exercise

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.size
import androidx.compose.ui.unit.dp
import coil.compose.SubcomposeAsyncImage
import coil.request.ImageRequest

@Composable
fun ExerciseMediaPreview(
    previewUrl: String?,
    mediaType: String?,
    modifier: Modifier = Modifier
) {
    val displayUrl = previewUrl?.takeIf { it.isNotBlank() && supportsImagePreview(mediaType) }

    Box(
        modifier = modifier.background(MaterialTheme.colorScheme.surfaceVariant),
        contentAlignment = Alignment.Center
    ) {
        when {
            displayUrl != null -> {
                val context = LocalContext.current
                SubcomposeAsyncImage(
                    model = ImageRequest.Builder(context)
                        .data(displayUrl)
                        .crossfade(true)
                        .build(),
                    contentDescription = null,
                    modifier = Modifier.fillMaxWidth().matchParentSize(),
                    contentScale = ContentScale.Crop,
                    loading = {
                        CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
                    },
                    error = {
                        MediaPlaceholder(mediaType = mediaType, showLoadingHint = false)
                    }
                )
            }
            mediaType == "video" && !previewUrl.isNullOrBlank() -> {
                Text("视频演示", style = MaterialTheme.typography.bodyMedium)
            }
            else -> MediaPlaceholder(mediaType = mediaType, showLoadingHint = true)
        }
    }
}

@Composable
private fun MediaPlaceholder(mediaType: String?, showLoadingHint: Boolean) {
    val message = when {
        showLoadingHint -> "动图同步中"
        mediaType == "video" -> "视频暂不可用"
        else -> "预览暂不可用"
    }
    Text(
        text = message,
        style = MaterialTheme.typography.bodyMedium,
        color = MaterialTheme.colorScheme.onSurfaceVariant
    )
}

private fun supportsImagePreview(mediaType: String?): Boolean =
    mediaType == null || mediaType == "gif" || mediaType == "image"
