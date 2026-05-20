# PROJECT_CONTEXT.md

本文件是 AIFitnessPro 的持续上下文记忆文件。每次继续开发前先读本文件、目录结构、相关代码和 `git status`；每个阶段结束后更新本文件。

## 1. 项目基本信息

项目名称：AIFitnessPro

项目类型：Android 原生健身 App。微信小程序仅作为历史业务参考，不再作为当前开发主线。

目标用户：希望获得低门槛力量训练计划、训练记录、动作指导和轻量饮食建议的中文用户。

项目目标：构建 Kotlin + Jetpack Compose 原生 Android App，并满足国内安卓应用市场合规要求。

当前开发阶段：Plan 3 - Onboarding + Training Plan Generation 已实现（待手动烟测）。

当前运行状态：Plan 1 + Plan 2 + Plan 3 API client 已合并 `main`；Plan 3 完整用户路径（6 步 Onboarding → Profile → 28 天 PPL 计划 → 首页今日卡片）已在 `main` 工作区实现并通过自动化测试，尚未手动烟测。

## 2. 技术栈

Android：Kotlin、Gradle、Android Gradle Plugin、Jetpack Compose、Navigation Compose、DataStore、JUnit。

本地构建环境：

- JDK：Homebrew `openjdk@17`
- `JAVA_HOME`：`/usr/local/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home`
- Android Studio SDK：`/Users/steve/Library/Android/sdk`
- 已安装 SDK 组件：`platforms;android-35`、`build-tools;35.0.0`、`platform-tools`、`emulator`、`system-images;android-35;google_apis;arm64-v8a`
- AVD：`AIFitnessPro_API35`，设备为 Pixel 8，Android 15 / API 35。
- Gradle：使用本机 `GRADLE_USER_HOME=~/.gradle`（Cursor 沙箱缓存可能导致 wrapper zip 损坏）。

后端：NestJS + PostgreSQL + Prisma + `@anthropic-ai/sdk`（Claude 日备注，可选）。

本地数据：DataStore 用于隐私同意、开发用户会话、激活计划 JSON 缓存；Room 留待 Plan 4。

## 3. 当前主要目录结构

```text
docs/                           项目文档、产品计划、持续上下文
docs/superpowers/specs/         设计规格
docs/superpowers/plans/         实施计划
android/                        Android 原生工程
backend/                        NestJS 后端
  src/plans/                    计划生成模块（规则引擎 + API）
  prisma/seed.ts                10 条核心动作 seed
cloudfunctions/                 历史微信云函数（参考）
miniprogram/                    历史微信小程序（参考）
```

## 4. 当前已完成内容

**Plan 1（已合并）**
- Android Gradle 工程、隐私同意页、四 Tab 壳、DataStore 同意持久化。

**Plan 2（已合并）**
- NestJS 后端、`GET /health`、`POST /v1/dev/users`、`GET /v1/users/me`、`PUT /v1/users/me/profile`、Prisma schema + migration。

**Plan 3 切片 1（已合并，`184d852`）**
- Android API client、本地 `http://10.0.2.2:8000/`、开发用户 bootstrap、「我的」页连接状态。

**Plan 3 完整版（本轮，`main` 工作区）**
- 后端：`dayNote` migration、10 动作 seed、PPL 规则引擎、`POST /v1/plans/generate`、`GET /v1/plans/active`、Claude 异步日备注。
- Android：6 步 `OnboardingScreen`、`ProfileApi`/`PlanApi`、`PlanRepository`（DataStore）、`HomeScreen` 今日卡片、按 `onboardingCompleted` 路由。
- 测试：backend e2e 15 项 + unit 11 项通过；`npm run build` 通过；Android `:app:testDebugUnitTest` + `:app:assembleDebug` 通过。

## 5. 本轮完成内容

- 实现后端 plans 模块（规则引擎、presenter、service、controller、Claude notes）。
- 新增 migration `0002_add_plan_day_note`、seed 脚本、`test:unit`、e2e 计划生成测试。
- 扩展 Android API client（upsertProfile、generatePlan、getActivePlan）。
- 新增 `PlanRepository`、`OnboardingScreen`、首页今日训练/休息卡片。
- 接线 `AIFitnessProApp` / `MainActivity` / `AppNavHost`。
- 验证：backend `npm test` + `npm run test:unit` + `npm run build`；Android gradle 测试与 debug 构建。

## 6. 本轮修改文件

- `docs/PROJECT_CONTEXT.md`
- `backend/prisma/schema.prisma`、`backend/prisma/migrations/0002_add_plan_day_note/`、`backend/prisma/seed.ts`
- `backend/package.json`、`backend/package-lock.json`、`backend/.env.example`
- `backend/src/plans/`、`backend/src/app.module.ts`
- `backend/test/app.e2e-spec.ts`、`backend/test/seed-helpers.ts`、`backend/test/jest-unit.json`
- `android/app/src/main/java/.../core/api/`（ProfileApi、PlanApi、PlanModels、AIFitnessApiClient、ApiModels）
- `android/app/src/main/java/.../core/plan/PlanRepository.kt`
- `android/app/src/main/java/.../feature/onboarding/OnboardingScreen.kt`
- `android/app/src/main/java/.../feature/home/HomeScreen.kt`
- `android/app/src/main/java/.../AIFitnessProApp.kt`、`MainActivity.kt`、`navigation/AppNavHost.kt`
- `android/app/src/test/java/.../core/api/`、`android/app/src/test/java/.../core/plan/`

## 7. 当前未完成事项

- 手动烟测：模拟器走完 Onboarding，验证首页今日计划卡片。
- 生产认证（仍使用 `X-Dev-User-Id` 开发身份）。
- Plan 4：训练 Session 循环（状态机、组/次/重量、休息计时器、Room）。
- Plan 5：动作库 70+ 内容与媒体。
- Plan 6：营养、成就、账号注销。
- Plan 7：国内应用市场提交。

## 8. 已知 bug 或风险

- Android debug URL 固定 `http://10.0.2.2:8000/`；真机需局域网 IP 或环境切换。
- Release API URL 占位 `https://api.aifitnesspro.example/`。
- Cursor 沙箱内 Gradle 可能下载损坏的 wrapper zip；本机构建请用 `GRADLE_USER_HOME=$HOME/.gradle`。
- `npm audit` 仍有 18 个漏洞，未自动修复。
- Claude 日备注无 `ANTHROPIC_API_KEY` 时静默跳过，不影响主流程。
- Onboarding 中途杀进程会从头开始（无中途持久化，符合设计）。

## 9. 当前暂停点

Plan 3 代码与自动化测试已完成，暂停在**手动烟测前**：需用户本机启动 Docker + 后端 + 模拟器验证完整 Onboarding → 首页今日卡片流程。

## 10. 下一步开发任务

1. 手动烟测（见下方命令）。
2. 继续 Plan 4：原生训练 Session 循环。
3. 后续：生产 auth、动作库内容、营养与成就。

## 11. 下一个 AI 会话应该从哪里继续

从 `main` 继续 Plan 4，或先协助烟测问题排查：

```bash
cd "/Users/steve/Desktop/Smart Everything/AIFitnessPro"
git status
```

手动烟测步骤：

```bash
# 1. 后端
cd backend
docker compose up -d postgres
npm run prisma:migrate
npm run seed
npm start

# 2. Android（另开终端，使用本机 Gradle）
cd android
GRADLE_USER_HOME=$HOME/.gradle \
ANDROID_HOME=$HOME/Library/Android/sdk \
JAVA_HOME=/usr/local/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home \
./gradlew :app:assembleDebug

# 3. 模拟器安装 APK 后：同意隐私 → 完成 6 步 Onboarding → 首页应显示今日训练或休息卡片
adb -s emulator-5554 install -r app/build/outputs/apk/debug/app-debug.apk
```

## 12. 建议 git commit message

```text
feat: add onboarding flow and 28-day training plan generation
```
