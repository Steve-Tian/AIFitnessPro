# PROJECT_CONTEXT.md

本文件是 AIFitnessPro 的持续上下文记忆文件。每次继续开发前先读本文件、目录结构、相关代码和 `git status`；每个阶段结束后更新本文件。

## 1. 项目基本信息

项目名称：AIFitnessPro

项目类型：Android 原生健身 App。微信小程序仅作为历史业务参考，不再作为当前开发主线。

目标用户：希望获得低门槛力量训练计划、训练记录、动作指导和轻量饮食建议的中文用户。

项目目标：构建 Kotlin + Jetpack Compose 原生 Android App，并满足国内安卓应用市场合规要求。

当前开发阶段：Plan 2 - Backend API and Database Foundation 实施计划阶段。

当前运行状态：Android Plan 1 合规壳已实现、验证通过，并已合并到 `main`；Plan 2 已确定采用 NestJS + PostgreSQL + Prisma，后端基础设计 spec 和 implementation plan 已写入 worktree，等待进入执行。

## 2. 技术栈

Android：Kotlin、Gradle、Android Gradle Plugin、Jetpack Compose、Navigation Compose、DataStore、JUnit。

本地构建环境：

- JDK：Homebrew `openjdk@17`
- `JAVA_HOME`：`/usr/local/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home`
- Android Studio SDK：`/Users/steve/Library/Android/sdk`
- 备用命令行 SDK：`/usr/local/share/android-commandlinetools`
- 已安装 SDK 组件：`platforms;android-35`、`build-tools;35.0.0`、`build-tools;34.0.0`、`platform-tools`、`emulator`、`system-images;android-35;google_apis;arm64-v8a`
- AVD：`AIFitnessPro_API35`，设备为 Pixel 8，Android 15 / API 35。

后端方向：后续计划从微信云函数迁移到独立 API，推荐 NestJS + PostgreSQL 或 MySQL。

本地数据方向：DataStore 先用于隐私同意；后续训练数据使用 Room。

## 3. 当前主要目录结构

```text
docs/                           项目文档、产品计划、持续上下文
docs/superpowers/specs/         Android 产品设计规格
docs/superpowers/plans/         Android 迁移路线图和 Plan 1
android/                        当前 Android 原生工程
backend/                        Plan 2 将新增的独立后端工程目录
cloudfunctions/                 历史微信云函数，仅作迁移参考
miniprogram/                    历史微信小程序，仅作迁移参考
tests/                          历史小程序测试
```

Plan 1 开发分支：`codex-android-foundation-compliance-shell`，已合并到 `main`。

Plan 2 开发 worktree：

```text
/Users/steve/Desktop/Smart Everything/AIFitnessPro/.worktrees/backend-api-database-foundation
```

Plan 2 分支：

```text
codex/backend-api-database-foundation
```

## 4. 当前已完成内容

- 已创建 Android Gradle 工程骨架。
- 已修复 Gradle wrapper 脚本。
- 已添加首启隐私/用户协议同意页。
- 已添加四个底部 Tab：`首页`、`训练`、`动作库`、`我的`。
- 已添加 DataStore 同意状态持久化。
- 已添加 Android 本地构建环境。
- 已运行 `./gradlew :app:testDebugUnitTest`：通过。
- 已运行 `./gradlew :app:assembleDebug`：通过。
- 已在模拟器 `AIFitnessPro_API35` 完成手动烟测。
- 已批准 Plan 2 技术方向：NestJS + PostgreSQL + Prisma。
- 已新增 Plan 2 设计规格：`docs/superpowers/specs/2026-05-19-backend-api-database-foundation-design.md`。
- 已新增 Plan 2 实施计划：`docs/superpowers/plans/2026-05-19-backend-api-database-foundation.md`。

## 5. 本轮完成内容

- 创建 Plan 2 隔离 worktree：`.worktrees/backend-api-database-foundation`。
- 创建 Plan 2 分支：`codex/backend-api-database-foundation`。
- 阅读 Plan 2 相关上下文：项目记忆、Android 产品设计、MVP roadmap、历史微信云函数、onboarding/profile/exercise/recipe 数据形状。
- 与用户确认 Plan 2 数据库采用 PostgreSQL。
- 与用户确认后端基础采用 NestJS + PostgreSQL + Prisma。
- 编写 Plan 2 后端基础设计 spec。
- 用户回复“继续”后，编写 Plan 2 后端基础 implementation plan。
- implementation plan 覆盖后端 tooling、Prisma schema/migration、health、dev user、current user、profile API、测试清理、README 和项目记忆更新。
- 重新阅读项目记忆、目录结构、相关 Android 代码、计划文档和 `git status`。
- 重新运行 `./gradlew :app:testDebugUnitTest`：通过。
- 重新运行 `./gradlew :app:assembleDebug`：通过。
- 暂存 Android Plan 1 工程、`.gitignore` 和计划文档，排除 worktree 内未跟踪的 `docs/PROJECT_CONTEXT.md`，避免与主分支项目记忆文件冲突。
- 已在 worktree 分支提交 Plan 1：`62e15af feat: add Android foundation compliance shell`。
- 合并 Plan 1 分支到 `main` 时解决计划文档冲突，保留 wrapper/resources 的详细步骤并标记为已完成。
- 安装 Homebrew `openjdk@17`，确认 `java -version` 为 OpenJDK 17.0.19。
- 安装 Android command line tools。
- 安装 Android SDK 35、Build-Tools 35.0.0、Build-Tools 34.0.0、platform-tools、emulator。
- 修复 Gradle wrapper 脚本启动方式。
- 跑通 Android 单元测试和 debug APK 构建。
- 安装 Android 35 arm64 emulator system image。
- 创建 Pixel 8 AVD：`AIFitnessPro_API35`。
- 安装 `app-debug.apk` 到模拟器并完成 Plan 1 手动烟测。
- 明确后续开发主线只做 Android App，小程序仅作迁移参考。

## 6. 本轮修改文件

- 主目录：`docs/PROJECT_CONTEXT.md`
- worktree：`.gitignore`
- worktree：`android/`
- worktree：`docs/superpowers/plans/2026-05-18-android-foundation-compliance-shell.md`
- worktree：`docs/superpowers/plans/2026-05-18-android-mvp-roadmap.md`
- main：`docs/superpowers/plans/2026-05-18-android-foundation-compliance-shell.md`
- Plan 2 worktree：`docs/superpowers/specs/2026-05-19-backend-api-database-foundation-design.md`
- Plan 2 worktree：`docs/superpowers/plans/2026-05-19-backend-api-database-foundation.md`

## 7. 当前未完成事项

- Plan 1 已合并到 `main`。
- Plan 2 implementation plan 已写好，下一步进入执行。
- 按 TDD 实现 `backend/`。

## 8. 已知 bug 或风险

- Homebrew 的 `openjdk@17` 是 keg-only，当前验证命令需要显式设置 `JAVA_HOME` 和 `PATH`，或用户后续手动配置 shell。
- ADB/emulator 命令通常需要在沙箱外运行。

## 9. 当前暂停点

暂停在 Plan 2 implementation plan 完成阶段：设计 spec 和实施计划已写入 worktree，下一步按计划执行 backend 实现。

## 10. 下一步开发任务

1. 按 `docs/superpowers/plans/2026-05-19-backend-api-database-foundation.md` 执行 Task 1。
2. 按 TDD 实现 `backend/`：NestJS、Prisma schema/migration、Docker Compose、health/dev user/current user/profile API 和测试。
3. 每个任务完成后更新计划 checkbox，并提交小步 commit。

## 11. 下一个 AI 会话应该从哪里继续

从 Plan 2 worktree 继续：

```bash
cd "/Users/steve/Desktop/Smart Everything/AIFitnessPro/.worktrees/backend-api-database-foundation"
git status
```

如需再次烟测：启动 AVD `AIFitnessPro_API35`，安装 `android/app/build/outputs/apk/debug/app-debug.apk`，验证 consent 和四 Tab。

## 12. 建议 git commit message

```text
chore: scaffold backend tooling
```
