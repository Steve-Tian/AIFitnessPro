# PROJECT_CONTEXT.md

本文件是 AIFitnessPro 的持续上下文记忆文件。每次继续开发前先读本文件、目录结构、相关代码和 `git status`；每个阶段结束后更新本文件。

## 1. 项目基本信息

项目名称：AIFitnessPro

项目类型：Android 原生健身 App。微信小程序仅作为历史业务参考，不再作为当前开发主线。

目标用户：希望获得低门槛力量训练计划、训练记录、动作指导和轻量饮食建议的中文用户。

项目目标：构建 Kotlin + Jetpack Compose 原生 Android App，并满足国内安卓应用市场合规要求。

当前开发阶段：Plan 4 训练同步 + Plan 5 动作库（70 条 + 核心 30 媒体 seed）已实现；待手动烟测与真实媒体文件上线。

当前运行状态：后端 e2e 22 项全通过；Android 编译通过；`npm run seed` 写入 70 动作 + 30 媒体。

## 2. 技术栈

Android：Kotlin、Gradle、Jetpack Compose、Navigation Compose、DataStore、Room、Coil、JUnit。

本地构建环境：

- JDK：Homebrew `openjdk@17`
- `JAVA_HOME`：`/usr/local/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home`
- Android Studio SDK：`/Users/steve/Library/Android/sdk`
- AVD：`AIFitnessPro_API35`（Pixel 8，Android 15 / API 35）
- Gradle：本机构建请用 `GRADLE_USER_HOME=$HOME/.gradle`

后端：NestJS + PostgreSQL + Prisma。

媒体 CDN（占位）：`https://media.aifitnesspro.dev/{slug}.gif`

## 3. 当前主要目录结构

```text
docs/                           项目文档、持续上下文
android/                        Android 原生工程
  feature/exercise/             列表/详情/ExerciseMediaPreview（Coil）
  core/workout/                 状态机、Room、Session/Sync Repository
backend/
  prisma/data/                  exercise-catalog.json、exercise-media.json
  prisma/seed-media.ts          核心 30 媒体 seed 逻辑
  src/exercises/                动作库 API
  src/workouts/                 训练同步 API
```

## 4. 当前已完成内容

**Plan 1–3（已合并）**：Android 壳、后端基础、Onboarding、28 天 PPL 计划。

**Plan 4**：训练 Session 循环 + `POST /v1/workouts/sessions/sync` + Android 离线同步队列。

**Plan 5 动作库**
- 70 条 `exercise-catalog.json`
- `GET /v1/exercises` 列表/筛选、`GET /v1/exercises/:slug` 详情
- Android 动作库 Tab、搜索、分类、详情、返回
- **核心 30 媒体**：`exercise-media.json` + `seedExerciseMedia()`；API 返回 `previewMediaUrl`
- Android **Coil** 加载预览图（列表缩略图 + 详情大图）；无媒体时显示「动图同步中」占位
- e2e：bench_press 媒体断言、列表 ≥30 条带 preview

## 5. 本轮完成内容

- **训练 Tab 完成状态**：Room 查询 `COMPLETED` 的 `planDayIndex`；卡片显示「已完成」、次要底色、「再练一次」
- **同步修复**：无组记录的 pending Session 标记为 `synced`，不再永久重试
- 单元测试：`WorkoutSyncRepositoryTest` 新增空组跳过用例

## 6. 本轮修改文件

- `android/.../core/workout/local/WorkoutDao.kt`
- `android/.../core/workout/WorkoutSessionRepository.kt`
- `android/.../core/workout/WorkoutSyncRepository.kt`
- `android/.../feature/training/TrainingScreen.kt`
- `android/.../test/.../WorkoutSyncRepositoryTest.kt`
- `docs/PROJECT_CONTEXT.md`

## 7. 当前未完成事项

- 手动烟测：动作库媒体、训练完成 → 训练 Tab 显示已完成。
- 上传真实 GIF/视频到 CDN，替换占位 URL。
- 动作级 RPE 反馈。
- Plan 6：营养、成就、账号注销。

## 8. 已知 bug 或风险

- 媒体 URL 为占位域名，若 CDN 未部署，App 显示「预览暂不可用」但步骤文案仍可用。
- Room `fallbackToDestructiveMigration()` 会清本地训练数据。
- Android debug URL 固定 `http://10.0.2.2:8000/`。

## 9. 当前暂停点

Plan 4/5 功能与训练 Tab 完成状态已实现，暂停在**手动烟测 + 提交未 commit 工作区前**。

## 10. 下一步开发任务

1. 手动烟测：完成训练 → 训练 Tab 对应 Day 显示「已完成」；动作库预览。
2. 部署 `media.aifitnesspro.dev` 或更新 seed URL。
3. 提交工作区变更（建议一个 feat commit 涵盖 sync + library + media + training status）。
4. Plan 6 或动作级 RPE。

## 11. 下一个 AI 会话应该从哪里继续

```bash
cd "/Users/steve/Desktop/Smart Everything/AIFitnessPro"
git status
cd backend && npm run seed && npm test
```

烟测：完成 Day 1 训练 → 训练 Tab 显示「已完成」；动作库卧推详情预览。

## 12. 建议 git commit message

```text
feat: workout sync, exercise library, media previews, and training completion UI

- Workout sync API with Android offline queue
- 70-exercise catalog, core 30 media seed, Coil previews
- Training tab marks completed plan days from local Room
- Skip empty abandoned sessions in sync queue
```
