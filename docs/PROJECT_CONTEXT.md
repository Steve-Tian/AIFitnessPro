# PROJECT_CONTEXT.md

本文件是 AIFitnessPro 的持续上下文记忆文件。每次继续开发前先读本文件、目录结构、相关代码和 `git status`；每个阶段结束后更新本文件。

## 1. 项目基本信息

项目名称：AIFitnessPro

项目类型：Android 原生健身 App。微信小程序仅作为历史业务参考，不再作为当前开发主线。

目标用户：希望获得低门槛力量训练计划、训练记录、动作指导和轻量饮食建议的中文用户。

项目目标：构建 Kotlin + Jetpack Compose 原生 Android App，并满足国内安卓应用市场合规要求。

当前开发阶段：Plan 4 - Native Workout Session Loop 已实现（本地 Room + 状态机 + UI，待手动烟测）。

当前运行状态：Plan 1–3 已合并 `main`；Plan 4 训练 Session 循环已在 `main` 工作区实现：Room 本地持久化、状态机、组/次/重量录入、休息计时、暂停/恢复、完成摘要、首页/训练 Tab 入口与中断恢复。

## 2. 技术栈

Android：Kotlin、Gradle、Jetpack Compose、Navigation Compose、DataStore、Room、JUnit。

本地构建环境：

- JDK：Homebrew `openjdk@17`
- `JAVA_HOME`：`/usr/local/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home`
- Android Studio SDK：`/Users/steve/Library/Android/sdk`
- AVD：`AIFitnessPro_API35`（Pixel 8，Android 15 / API 35）
- Gradle：本机构建请用 `GRADLE_USER_HOME=$HOME/.gradle`

后端：NestJS + PostgreSQL + Prisma（训练同步 API 尚未实现）。

本地数据：DataStore（隐私同意、开发用户、计划 JSON）；Room（训练 Session 与组记录）。

## 3. 当前主要目录结构

```text
docs/                           项目文档、持续上下文
android/                        Android 原生工程
  core/workout/                 状态机、Room、WorkoutSessionRepository
  feature/workout/              WorkoutSessionScreen
backend/                        NestJS 后端（plans 模块已完成）
```

## 4. 当前已完成内容

**Plan 1–3（已合并）**
- Android 壳、后端基础、Onboarding、28 天 PPL 计划生成、首页今日卡片。

**Plan 4（本轮）**
- `WorkoutStateMachine`：NotStarted → InProgress ↔ Resting ↔ Paused → Completed / Abandoned
- Room：`workout_sessions`、`workout_sets` 表，每完成一组立即写入
- `WorkoutSessionRepository`：prepare/start/completeSet/skipRest/pause/resume/discard
- `WorkoutSessionScreen`：准备页、组数录入、休息倒计时、完成摘要、放弃确认
- 首页「开始训练」、进行中「继续训练」、训练 Tab 计划日列表
- 后台切应用自动 Pause，回到前台 Resume
- 单元测试：`WorkoutStateMachineTest`（6 项）
- `./gradlew :app:testDebugUnitTest :app:assembleDebug` 通过

## 5. 本轮完成内容

- 新增 Room + KSP 依赖与 `WorkoutDatabase`
- 实现训练状态机与 Room 持久化
- 实现 `WorkoutSessionScreen` 全屏训练流程
- 接线 `AppNavHost`、`HomeScreen`、`TrainingScreen`、`MainActivity`
- Android 单元测试与 debug 构建验证通过

## 6. 本轮修改文件

- `docs/PROJECT_CONTEXT.md`
- `android/build.gradle.kts`、`android/app/build.gradle.kts`
- `android/app/src/main/java/.../core/workout/`
- `android/app/src/main/java/.../feature/workout/WorkoutSessionScreen.kt`
- `android/app/src/main/java/.../feature/home/HomeScreen.kt`
- `android/app/src/main/java/.../feature/training/TrainingScreen.kt`
- `android/app/src/main/java/.../navigation/AppDestination.kt`、`AppNavHost.kt`
- `android/app/src/main/java/.../AIFitnessProApp.kt`、`MainActivity.kt`
- `android/app/src/test/java/.../core/workout/WorkoutStateMachineTest.kt`

## 7. 当前未完成事项

- 手动烟测：从首页开始训练，完成若干组，切后台再恢复，验证 Room 持久化。
- 后端训练同步 API（`workout_sessions` / `workout_sets` POST）与 Android 同步队列。
- 动作级 RPE 反馈、训练 Tab 完成状态标记。
- Plan 5：动作库 70+ 内容与媒体。
- Plan 6：营养、成就、账号注销。
- 生产认证（仍用 `X-Dev-User-Id`）。

## 8. 已知 bug 或风险

- 训练数据仅存本地 Room，卸载 App 或清数据会丢失；后端 sync 未实现。
- 休息倒计时 LaunchedEffect 在重组时可能重启；烟测时留意计时准确性。
- Android debug URL 固定 `http://10.0.2.2:8000/`。
- Cursor 沙箱 Gradle 可能损坏 wrapper zip；本机构建用 `GRADLE_USER_HOME=$HOME/.gradle`。

## 9. 当前暂停点

Plan 4 本地训练循环已实现并通过自动化测试，暂停在**手动烟测前**。

## 10. 下一步开发任务

1. 手动烟测完整训练流程（开始 → 完成组 → 休息 → 完成训练 → 中断恢复）。
2. 后端 + Android：训练 Session 同步 API 与离线队列。
3. 继续 Plan 5：动作库内容与媒体。

## 11. 下一个 AI 会话应该从哪里继续

```bash
cd "/Users/steve/Desktop/Smart Everything/AIFitnessPro"
git status
```

烟测命令：

```bash
# 后端
cd backend && docker compose up -d postgres && npm run prisma:migrate && npm run seed && npm start

# Android
cd android && GRADLE_USER_HOME=$HOME/.gradle \
  ANDROID_HOME=$HOME/Library/Android/sdk \
  JAVA_HOME=/usr/local/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home \
  ./gradlew :app:assembleDebug
adb -s emulator-5554 install -r app/build/outputs/apk/debug/app-debug.apk
```

验证：首页点「开始训练」→ 录入组数 → 休息倒计时 → 完成全部组 → 摘要页 → 杀进程重开 → 「继续训练」恢复。

## 12. 建议 git commit message

```text
feat: add native workout session loop with Room persistence
```
