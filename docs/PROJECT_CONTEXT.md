# PROJECT_CONTEXT.md

本文件是 AIFitnessPro 的持续上下文记忆文件。每次继续开发前先读本文件、目录结构、相关代码和 `git status`；每个阶段结束后更新本文件。

## 1. 项目基本信息

项目名称：AIFitnessPro

项目类型：Android 原生健身 App。微信小程序仅作为历史业务参考，不再作为当前开发主线。

目标用户：希望获得低门槛力量训练计划、训练记录、动作指导和轻量饮食建议的中文用户。

项目目标：构建 Kotlin + Jetpack Compose 原生 Android App，并满足国内安卓应用市场合规要求。

当前开发阶段：Plan 3 - Android API client / local backend configuration started.

当前运行状态：Android Plan 1 已合并；Plan 2 后端基础已实现、验证通过并已合并到 `main`；Plan 3 前置切片已在独立 worktree 中实现 Android API client、本地 NestJS base URL 配置、开发用户 bootstrap 和 Profile 页连接状态展示。

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

Plan 3 Android API client worktree：

```text
/Users/steve/Desktop/Smart Everything/AIFitnessPro/.worktrees/android-api-client-backend-config
```

Plan 3 Android API client 分支：

```text
codex/android-api-client-backend-config
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
- 已完成 Plan 2 Task 1：新增 `backend/` tooling scaffold、Docker Compose、env 示例和 npm lockfile。
- 已完成 Plan 2 Task 2：新增 Prisma schema、初始 PostgreSQL migration，并验证 reset/deploy。
- 已完成 Plan 2 Task 3：新增 Nest app shell、Prisma provider、`GET /health` endpoint 和 e2e 测试。
- 已完成 Plan 2 Task 4：新增统一错误 envelope、validation factory、`POST /v1/dev/users` 开发用户创建接口和 e2e 测试。
- 已完成 Plan 2 Task 5：新增 `X-Dev-User-Id` 开发鉴权、current user decorator 和 `GET /v1/users/me`。
- 已完成 Plan 2 Task 6：新增 profile DTO 校验、`PUT /v1/users/me/profile` upsert API，并标记 onboarding complete。
- 已完成 Plan 2 Task 7：e2e 数据库清理、完整 backend test/build 验证和 backend README。
- 已完成 Plan 2 Task 8：最终项目记忆和计划状态更新。
- 已将 Plan 2 分支 `codex/backend-api-database-foundation` fast-forward 合并到 `main`。
- 已启动 Plan 3 前置切片：Android API client / 本地 backend 配置。
- 已新增 Android debug 本地 API base URL：`http://10.0.2.2:8000/`。
- 已新增 Android HTTP transport、NestJS API client、开发用户会话持久化和设备身份生成。
- 已让 App 在隐私同意后自动 bootstrap 本地开发用户，并在“我的”页显示本地后端连接状态。

## 5. 本轮完成内容

- 创建 Plan 3 隔离 worktree：`.worktrees/android-api-client-backend-config`。
- 创建 Plan 3 分支：`codex/android-api-client-backend-config`。
- 按要求重新阅读 `docs/PROJECT_CONTEXT.md`、项目目录、Android/backend 相关代码、计划文档和 `git status`。
- 运行 Android 基线测试；首次因 worktree 缺少 SDK 路径失败，设置 `ANDROID_HOME` / `ANDROID_SDK_ROOT` 后通过。
- 按 TDD 新增 Android API/session 单元测试，并先验证 RED：`ApiConfig`、`AIFitnessApiClient`、`ApiSessionRepository` 等类未实现导致编译失败。
- 新增 Kotlin serialization 依赖和 BuildConfig 生成。
- 新增 debug API base URL：`http://10.0.2.2:8000/`；release 暂用占位 HTTPS URL。
- 新增 manifest cleartext placeholder：debug 允许本地 HTTP，release 禁止 cleartext。
- 新增 `ApiTransport`、`HttpUrlConnectionTransport`、`AIFitnessApiClient`、API models 和 `ApiException`。
- 新增 `DevelopmentApi` 接口，覆盖 `POST /v1/dev/users` 和 `GET /v1/users/me`。
- 新增 `ApiSessionRepository`、`ApiSessionStore`、`DataStoreApiSessionStore` 和 `AndroidDeviceIdentityProvider`。
- `MainActivity` 现在组装 API client、session repository 和设备身份。
- `AIFitnessProApp` 在用户完成隐私同意后自动创建或复用本地开发用户。
- `ProfileScreen` 显示本地后端连接状态、连接失败信息或开发用户短 ID。
- 运行 `./gradlew :app:testDebugUnitTest`：通过。
- 运行 `./gradlew :app:assembleDebug`：通过。

## 6. 本轮修改文件

- `docs/PROJECT_CONTEXT.md`
- `android/build.gradle.kts`
- `android/app/build.gradle.kts`
- `android/app/src/main/AndroidManifest.xml`
- `android/app/src/main/java/com/aifitnesspro/android/MainActivity.kt`
- `android/app/src/main/java/com/aifitnesspro/android/AIFitnessProApp.kt`
- `android/app/src/main/java/com/aifitnesspro/android/navigation/AppNavHost.kt`
- `android/app/src/main/java/com/aifitnesspro/android/feature/profile/ProfileScreen.kt`
- `android/app/src/main/java/com/aifitnesspro/android/core/api/`
- `android/app/src/main/java/com/aifitnesspro/android/core/session/`
- `android/app/src/test/java/com/aifitnesspro/android/core/api/`
- `android/app/src/test/java/com/aifitnesspro/android/core/session/`

## 7. 当前未完成事项

- Plan 1 已合并到 `main`。
- Plan 2 已合并到 `main`。
- Plan 3 前置切片已实现：Android 可连接本地 NestJS API 并创建/复用开发用户。
- 仍未实现完整 9 步 onboarding UI、profile 写入 UI、训练计划生成、训练计划本地缓存、生产认证、训练同步和内容 seed/import。
- 下一步应继续 Plan 3：把 onboarding 表单接到 `PUT /v1/users/me/profile`，再生成 28 天训练计划。

## 8. 已知 bug 或风险

- Homebrew 的 `openjdk@17` 是 keg-only，当前验证命令需要显式设置 `JAVA_HOME` 和 `PATH`，或用户后续手动配置 shell。
- ADB/emulator 命令通常需要在沙箱外运行。
- `npm install` 报告 18 个 audit vulnerabilities（4 low, 9 moderate, 5 high）；当前未自动修复，避免破坏 Nest/Prisma 依赖版本，后续可单独审计。
- Prisma 和 Docker 命令需要访问本机缓存、Docker socket 和本地 PostgreSQL，通常需要沙箱外权限。
- Android debug backend URL 固定为模拟器访问宿主机的 `http://10.0.2.2:8000/`；真机调试需要改成局域网 IP 或后续增加环境切换。
- Release API URL 当前是占位值 `https://api.aifitnesspro.example/`，上线前必须替换。
- Plan 3 仍使用临时 `X-Dev-User-Id` 开发身份，production auth 尚未设计和实现。

## 9. 当前暂停点

暂停在 Plan 3 前置切片完成阶段：Android debug 包可构建，App 在隐私同意后会尝试连接本地 NestJS API，创建或复用开发用户，并在“我的”页展示连接状态。

## 10. 下一步开发任务

1. 启动本地 backend 并在 Android 模拟器上手动烟测 Profile 页连接状态。
2. 继续 Plan 3 onboarding：实现 9 步表单 UI 和本地状态。
3. 将 onboarding 提交到 `PUT /v1/users/me/profile`，并处理 validation error envelope。
4. 设计并实现训练计划生成 API 与 Android 本地缓存。
5. 后续替换临时 dev auth 为 production auth。

## 11. 下一个 AI 会话应该从哪里继续

从 Plan 3 worktree 继续：

```bash
cd "/Users/steve/Desktop/Smart Everything/AIFitnessPro/.worktrees/android-api-client-backend-config"
git status
```

如需手动烟测：确保 Docker Desktop 运行，在 `backend/` 执行 `docker compose up -d postgres`、`npm run prisma:migrate`、启动 NestJS 服务；再启动 AVD `AIFitnessPro_API35`，安装 `android/app/build/outputs/apk/debug/app-debug.apk`，验证同意隐私后“我的”页显示本地后端已连接。

## 12. 建议 git commit message

```text
feat: add Android local backend API client
```
