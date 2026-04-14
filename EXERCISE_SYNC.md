# 动作内容同步

推荐链路：

1. `ExerciseDB` 作为主源，优先拿动作名、目标肌群、器械、GIF / 视频 / 封面
2. `Wger` 作为补充源，补动作说明、分类、肌群信息
3. 运行 `npm run exercise:sync`
4. 脚本把双源内容合并成项目自己的 `exercises` schema
5. 可选下载 GIF / MP4 / 封面到本地
6. 可选上传到微信云存储
7. 可选写入微信云数据库 `exercises` 集合
8. 脚本会自动读取 `scripts/exercise-sync.env`，也可以通过 `EXERCISE_SYNC_ENV_FILE` 指定别的配置文件

## 支持的环境变量

### 推荐双源模式

- `EXERCISEDB_SOURCE_URL`: ExerciseDB 动作接口地址
- `EXERCISEDB_SOURCE_API_KEY`: ExerciseDB API Key
- `EXERCISEDB_SOURCE_HOST`: ExerciseDB Host Header
- `EXERCISEDB_SOURCE_AUTHORIZATION`: ExerciseDB Authorization Header
- `EXERCISEDB_SOURCE_MEDIA_BASE_URL`: ExerciseDB 返回相对媒体路径时的前缀
- `EXERCISEDB_SOURCE_LIMIT`: ExerciseDB 同步条数上限
- `WGER_SOURCE_URL`: Wger 动作接口地址
- `WGER_SOURCE_API_KEY`: Wger API Key
- `WGER_SOURCE_HOST`: Wger Host Header
- `WGER_SOURCE_AUTHORIZATION`: Wger Authorization Header
- `WGER_SOURCE_MEDIA_BASE_URL`: Wger 返回相对媒体路径时的前缀
- `WGER_SOURCE_LIMIT`: Wger 同步条数上限
- `EXERCISE_DOWNLOAD_MEDIA=1`: 下载 GIF / MP4 / 封面到本地 `scripts/output/exercise-media`
- `WECHAT_CLOUD_ENV`: 配置后会尝试写入微信云数据库并上传云存储
- `EXERCISE_CLOUD_PATH_PREFIX`: 云存储前缀，默认 `exercise-media`
- `EXERCISE_MEDIA_BASE_URL`: 上传后对外访问的 CDN / 云存储域名前缀

### 兼容旧配置

- `EXERCISE_SOURCE_URL`
- `EXERCISE_SOURCE_NAME`
- `EXERCISE_SOURCE_API_KEY`
- `EXERCISE_SOURCE_HOST`
- `EXERCISE_SOURCE_AUTHORIZATION`
- `EXERCISE_SOURCE_MEDIA_BASE_URL`
- `EXERCISE_SYNC_LIMIT`

## 合并规则

- 同名动作优先保留 `ExerciseDB` 的媒体资源
- `Wger` 主要补说明、肌群、器械、别名等缺失字段
- 最终前端只读取你自己的 `exercises` 集合，不直接依赖第三方接口

## 产物

- `scripts/output/exercises.normalized.json`: 标准化后的动作内容包
- `scripts/output/exercises.sync-report.json`: 同步报告
- `scripts/output/exercise-media/`: 下载下来的媒体文件
- `scripts/exercise-sync.env.example`: 双源同步环境变量模板

## 当前前端策略

- 动作库列表页展示封面图
- 动作详情页优先展示 GIF / 视频示范，文字说明退到补充层
- 训练页优先展示结构化动作示意；有真实 GIF / 视频时会自动切换到媒体资源

## 推荐使用方式

1. 复制 `scripts/exercise-sync.env.example` 为 `scripts/exercise-sync.env`
2. 填入 `ExerciseDB` / `Wger` 的真实接口地址和凭证
3. 执行 `npm run exercise:sync`
4. 前端只读取你自己的 `exercises` 集合和自托管媒体
