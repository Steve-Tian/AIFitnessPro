# 动作内容同步

推荐链路：

1. 外部源接口提供动作数据
2. 运行 `npm run exercise:sync`
3. 脚本把数据标准化为项目自己的 `exercises` schema
4. 可选下载 GIF/封面图到本地
5. 可选上传到微信云存储
6. 可选写入微信云数据库 `exercises` 集合

## 支持的环境变量

- `EXERCISE_SOURCE_URL`: 外部动作源接口地址
- `EXERCISE_SOURCE_NAME`: 数据源名称，默认 `ExerciseDB`
- `EXERCISE_SOURCE_API_KEY`: 源接口 API Key
- `EXERCISE_SOURCE_HOST`: 源接口 Host Header
- `EXERCISE_SOURCE_AUTHORIZATION`: Authorization Header
- `EXERCISE_SOURCE_MEDIA_BASE_URL`: 当接口返回相对路径时，用这个前缀补全媒体地址
- `EXERCISE_SYNC_LIMIT`: 限制同步条数
- `EXERCISE_DOWNLOAD_MEDIA=1`: 下载 GIF/封面图到本地 `scripts/output/exercise-media`
- `WECHAT_CLOUD_ENV`: 配置后会尝试写入微信云数据库并上传云存储
- `EXERCISE_CLOUD_PATH_PREFIX`: 云存储前缀，默认 `exercise-media`
- `EXERCISE_MEDIA_BASE_URL`: 上传后对外访问的 CDN / 云存储域名前缀

## 产物

- `scripts/output/exercises.normalized.json`: 标准化后的动作内容包
- `scripts/output/exercises.sync-report.json`: 同步报告
- `scripts/output/exercise-media/`: 下载下来的媒体文件

## 当前前端策略

- 动作库列表页展示封面图
- 动作详情页展示完整动作说明
- 训练页优先展示结构化动作示意；有真实 GIF 时会自动切换到媒体资源
