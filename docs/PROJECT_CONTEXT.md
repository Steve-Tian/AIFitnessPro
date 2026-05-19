# PROJECT_CONTEXT.md

本文件是 AIFitnessPro 的持续上下文记忆文件。每次继续开发前先读本文件、目录结构、相关代码和 `git status`；每个阶段结束后更新本文件。

## 1. 项目基本信息

项目名称：AIFitnessPro

项目类型：Android 原生健身 App。微信小程序仅作为历史业务参考，不再作为当前开发主线。

目标用户：希望获得低门槛力量训练计划、训练记录、动作指导和轻量饮食建议的中文用户。

项目目标：构建 Kotlin + Jetpack Compose 原生 Android App，并满足国内安卓应用市场合规要求。

当前开发阶段：Plan 2 - Backend API and Database Foundation implemented / verification complete.

当前运行状态：Android Plan 1 已合并；Plan 2 后端基础已实现、验证通过并已合并到 `main`，包含 NestJS 服务、PostgreSQL Docker Compose、Prisma schema/migration、health/dev user/current user/profile API 和自动化测试。

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
- 已完成 Plan 2 Task 1：新增 `backend/` tooling scaffold、Docker Compose、env 示例和 npm lockfile。
- 已完成 Plan 2 Task 2：新增 Prisma schema、初始 PostgreSQL migration，并验证 reset/deploy。
- 已完成 Plan 2 Task 3：新增 Nest app shell、Prisma provider、`GET /health` endpoint 和 e2e 测试。
- 已完成 Plan 2 Task 4：新增统一错误 envelope、validation factory、`POST /v1/dev/users` 开发用户创建接口和 e2e 测试。
- 已完成 Plan 2 Task 5：新增 `X-Dev-User-Id` 开发鉴权、current user decorator 和 `GET /v1/users/me`。
- 已完成 Plan 2 Task 6：新增 profile DTO 校验、`PUT /v1/users/me/profile` upsert API，并标记 onboarding complete。
- 已完成 Plan 2 Task 7：e2e 数据库清理、完整 backend test/build 验证和 backend README。
- 已完成 Plan 2 Task 8：最终项目记忆和计划状态更新。
- 已将 Plan 2 分支 `codex/backend-api-database-foundation` fast-forward 合并到 `main`。

## 5. 本轮完成内容

- 创建 Plan 2 隔离 worktree：`.worktrees/backend-api-database-foundation`。
- 创建 Plan 2 分支：`codex/backend-api-database-foundation`。
- 阅读 Plan 2 相关上下文：项目记忆、Android 产品设计、MVP roadmap、历史微信云函数、onboarding/profile/exercise/recipe 数据形状。
- 与用户确认 Plan 2 数据库采用 PostgreSQL。
- 与用户确认后端基础采用 NestJS + PostgreSQL + Prisma。
- 编写 Plan 2 后端基础设计 spec。
- 用户回复“继续”后，编写 Plan 2 后端基础 implementation plan。
- implementation plan 覆盖后端 tooling、Prisma schema/migration、health、dev user、current user、profile API、测试清理、README 和项目记忆更新。
- 新增 `backend/package.json`、TypeScript/Nest 配置、`.env.example`、`.gitignore`、`docker-compose.yml`。
- 运行 `npm install`，生成 `backend/package-lock.json`。
- 新增 `backend/prisma/schema.prisma`，覆盖用户、资料、设置、同意日志、训练计划、训练日、训练动作、训练记录、动作反馈、动作调整、动作媒体和食谱基础表。
- 启动 Docker Desktop 和 `aifitnesspro-postgres` PostgreSQL 16 容器。
- 运行 `npm run prisma:generate`：通过。
- 运行 `npm run prisma:migrate:dev -- --name backend_foundation`：生成并应用初始 migration。
- 将 Prisma 生成的时间戳迁移目录重命名为 `backend/prisma/migrations/0001_backend_foundation`。
- 运行 `npm run prisma:reset`：成功从 `0001_backend_foundation` 重置并重放数据库。
- 运行 `npm run prisma:migrate`：通过，无待应用 migration。
- 按 TDD 新增 `GET /health` e2e 测试，并先验证 RED：缺少 `../src/app.module`。
- 新增 Nest app shell：`src/main.ts`、`src/app.module.ts`。
- 新增 Prisma Nest provider：`src/prisma/prisma.module.ts`、`src/prisma/prisma.service.ts`。
- 新增 health endpoint：`src/health/health.controller.ts`、`src/health/health.service.ts`。
- 修正 `supertest` import 为 namespace import，以匹配当前 CommonJS 类型导出。
- 运行 `npm test -- --runTestsByPath test/app.e2e-spec.ts`：通过。
- 运行 `npm run build`：通过。
- 按 TDD 追加 development user e2e 测试，并先验证 RED：`/v1/dev/users` 返回 404。
- 新增统一 API error envelope 类型和全局 exception filter。
- 新增 validation exception factory，将 class-validator 错误整理为 `{ error: { code, message, fields } }`。
- 新增 `CreateDevUserDto`、用户 presenter、`DevUsersService` 和 `DevUsersController`。
- `POST /v1/dev/users` 支持创建本地开发用户、默认 `zh-CN/metric` settings，以及通过 `externalId` 幂等返回已有用户。
- 再次运行 `npm test -- --runTestsByPath test/app.e2e-spec.ts`：4 个 e2e 全部通过。
- 再次运行 `npm run build`：通过。
- 按 TDD 追加 `GET /v1/users/me` e2e 测试，并先验证 RED：`/v1/users/me` 返回 404。
- 新增 `CurrentUser` decorator 和 `DevAuthGuard`，通过 `X-Dev-User-Id` 读取当前开发用户。
- 新增 `UsersService` 和 `UsersController`，返回当前用户、profile 和 settings。
- 再次运行 `npm test -- --runTestsByPath test/app.e2e-spec.ts`：7 个 e2e 全部通过。
- 再次运行 `npm run build`：通过。
- 按 TDD 追加 profile create/update/validation e2e 测试，并先验证 RED：`PUT /v1/users/me/profile` 返回 404。
- 新增 `UpsertProfileDto`，校验 gender、age、heightCm、weightKg、goal、experience、daysPerWeek、equipment 和 persona。
- 新增 `UsersService.upsertProfile()`，写入/更新 `user_profiles` 并将 `users.onboarding_completed` 置为 true。
- 新增 `PUT /v1/users/me/profile` endpoint。
- 再次运行 `npm test -- --runTestsByPath test/app.e2e-spec.ts`：10 个 e2e 全部通过。
- 再次运行 `npm run build`：通过。
- 在 e2e 中新增 `beforeEach` 数据库清理 helper，清理用户、设置、资料、训练计划、训练记录和反馈相关表。
- 新增 `backend/README.md`，记录技术栈、本地启动、迁移、测试和临时开发身份用法。
- 运行完整 `npm test`：10 个 e2e 全部通过。
- 运行 `npm run build`：通过。
- 完成 Plan 2 最终上下文更新，当前暂停点改为 Plan 2 可收尾/可合并。
- 在 `main` 重新安装 backend 依赖，生成 Prisma Client，确认 PostgreSQL 容器 healthy。
- 在 `main` 运行 `npm run prisma:migrate`：通过，无待应用 migration。
- 在 `main` 运行 `npm test`：10 个 e2e 全部通过。
- 在 `main` 运行 `npm run build`：通过。
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
- Plan 2 worktree：`backend/`
- Plan 2 worktree：`backend/prisma/schema.prisma`
- Plan 2 worktree：`backend/prisma/migrations/0001_backend_foundation/migration.sql`
- Plan 2 worktree：`backend/prisma/migrations/migration_lock.toml`
- Plan 2 worktree：`backend/src/main.ts`
- Plan 2 worktree：`backend/src/app.module.ts`
- Plan 2 worktree：`backend/src/prisma/`
- Plan 2 worktree：`backend/src/health/`
- Plan 2 worktree：`backend/src/common/errors/`
- Plan 2 worktree：`backend/src/common/validation/`
- Plan 2 worktree：`backend/src/dev-auth/`
- Plan 2 worktree：`backend/src/users/`
- Plan 2 worktree：`backend/test/`

## 7. 当前未完成事项

- Plan 1 已合并到 `main`。
- Plan 2 Task 1 已完成。
- Plan 2 Task 2 已完成。
- Plan 2 Task 3 已完成。
- Plan 2 Task 4 已完成。
- Plan 2 Task 5 已完成。
- Plan 2 Task 6 已完成。
- Plan 2 Task 7 已完成。
- Plan 2 Task 8 已完成。
- 当前未接入 Android networking，生产认证、训练计划生成、训练同步、内容 seed/import 仍在后续计划。
- 下一步可启动 Plan 3：Android API client/本地 backend 配置、production auth design 或 content seed import。

## 8. 已知 bug 或风险

- Homebrew 的 `openjdk@17` 是 keg-only，当前验证命令需要显式设置 `JAVA_HOME` 和 `PATH`，或用户后续手动配置 shell。
- ADB/emulator 命令通常需要在沙箱外运行。
- `npm install` 报告 18 个 audit vulnerabilities（4 low, 9 moderate, 5 high）；当前未自动修复，避免破坏 Nest/Prisma 依赖版本，后续可单独审计。
- Prisma 和 Docker 命令需要访问本机缓存、Docker socket 和本地 PostgreSQL，通常需要沙箱外权限。

## 9. 当前暂停点

暂停在 Plan 2 后端基础已合并阶段：`main` 已包含 backend foundation，最终 backend verification 已通过。

## 10. 下一步开发任务

1. 清理 Plan 2 worktree 和已合并分支。
2. 启动 Plan 3，建议优先做 Android API client/本地 backend 配置，让 Android App 能连接本地 NestJS API。
3. 也可先做 production auth design 或 exercise/recipe seed import。

## 11. 下一个 AI 会话应该从哪里继续

从主仓库继续：

```bash
cd "/Users/steve/Desktop/Smart Everything/AIFitnessPro"
git status
```

如需再次烟测：启动 AVD `AIFitnessPro_API35`，安装 `android/app/build/outputs/apk/debug/app-debug.apk`，验证 consent 和四 Tab。

如需继续后端验证：确保 Docker Desktop 运行，然后在 `backend/` 执行 `docker compose up -d postgres`。

## 12. 建议 git commit message

```text
chore: update project context after Plan 2 merge
```
