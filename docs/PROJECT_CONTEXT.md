# PROJECT_CONTEXT.md

本文件是 AIFitnessPro 的持续上下文记忆文件。每次继续开发前先读本文件、目录结构、相关代码和 `git status`；每个阶段结束后更新本文件。

## 1. 项目基本信息

项目名称：AIFitnessPro

项目类型：Android 原生健身 App。微信小程序仅作为历史业务参考，不再作为当前开发主线。

目标用户：希望获得低门槛力量训练计划、训练记录、动作指导和轻量饮食建议的中文用户。

项目目标：构建 Kotlin + Jetpack Compose 原生 Android App，并满足国内安卓应用市场合规要求。

当前开发阶段：Plan 1 - Android foundation and compliance shell 收尾 / Plan 2 准备。

当前运行状态：Android Plan 1 合规壳已实现、验证通过，并已在 worktree 分支本地提交；JDK、Android Studio SDK、Android SDK 35、Android Emulator、Pixel 8 AVD 已可用。

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
.worktrees/android-foundation-compliance-shell/
                                 当前 Android 原生工程开发 worktree
cloudfunctions/                 历史微信云函数，仅作迁移参考
miniprogram/                    历史微信小程序，仅作迁移参考
tests/                          历史小程序测试
```

当前 Android 开发在隔离 worktree：

```text
/Users/steve/Desktop/Smart Everything/AIFitnessPro/.worktrees/android-foundation-compliance-shell
```

分支：

```text
codex-android-foundation-compliance-shell
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

## 5. 本轮完成内容

- 重新阅读项目记忆、目录结构、相关 Android 代码、计划文档和 `git status`。
- 重新运行 `./gradlew :app:testDebugUnitTest`：通过。
- 重新运行 `./gradlew :app:assembleDebug`：通过。
- 暂存 Android Plan 1 工程、`.gitignore` 和计划文档，排除 worktree 内未跟踪的 `docs/PROJECT_CONTEXT.md`，避免与主分支项目记忆文件冲突。
- 已在 worktree 分支提交 Plan 1：`62e15af feat: add Android foundation compliance shell`。
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

## 7. 当前未完成事项

- Plan 1 已本地提交，剩合并到 `main` 或推送创建 PR。
- 下一阶段可启动 Plan 2：Backend API and Database Foundation。

## 8. 已知 bug 或风险

- Homebrew 的 `openjdk@17` 是 keg-only，当前验证命令需要显式设置 `JAVA_HOME` 和 `PATH`，或用户后续手动配置 shell。
- ADB/emulator 命令通常需要在沙箱外运行。

## 9. 当前暂停点

暂停在 Android Plan 1 集成阶段：实现、单测、debug 构建、模拟器烟测均已通过，worktree 分支已提交 `62e15af`，下一步是选择本地合并、推送 PR，或基于该成果启动 Plan 2。

## 10. 下一步开发任务

1. 选择 Plan 1 集成方式：本地合并到 `main`，或推送并创建 PR。
2. 启动 Plan 2：Backend API and Database Foundation。

## 11. 下一个 AI 会话应该从哪里继续

从 worktree 继续：

```bash
cd "/Users/steve/Desktop/Smart Everything/AIFitnessPro/.worktrees/android-foundation-compliance-shell/android"
export JAVA_HOME=/usr/local/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
export PATH=/usr/local/opt/openjdk@17/bin:$PATH
export ANDROID_HOME=/Users/steve/Library/Android/sdk
export ANDROID_SDK_ROOT=/Users/steve/Library/Android/sdk
./gradlew :app:testDebugUnitTest
./gradlew :app:assembleDebug
```

如需再次烟测：启动 AVD `AIFitnessPro_API35`，安装 `android/app/build/outputs/apk/debug/app-debug.apk`，验证 consent 和四 Tab。

## 12. 建议 git commit message

```text
chore: update project context after Android Plan 1 commit
```
