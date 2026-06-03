# PROJECT_CONTEXT.md

本文件是 AIFitnessPro 的持续上下文记忆文件。每次继续开发前先读本文件、目录结构、相关代码和 `git status`；每个阶段结束后更新本文件。

## 1. 项目基本信息

项目名称：AIFitnessPro

项目类型：Android 原生健身 App（**营养/饮食模块已决策延后，专注训练主线**）。

目标用户：希望获得低门槛力量训练计划、训练记录、动作指导的中文用户。

项目目标：构建 Kotlin + Jetpack Compose 原生 Android App，并满足国内安卓应用市场合规要求。

当前开发阶段：Plan 1–5 已完成；Plan 6（成就 + 账号注销 + Profile + 设置）已完成；待 Plan 7（上架硬化）。

当前运行状态：后端 e2e 23 项全通过；Android 编译 + 单元测试全通过；媒体接入 free-exercise-db。

## 2. 技术栈

Android：Kotlin、Gradle、Jetpack Compose、Navigation Compose、DataStore、Room、Coil、JUnit。

本地构建环境：

- JDK：Android Studio 内置 JBR 21（Apple Silicon）
- `JAVA_HOME`：`/Applications/Android Studio.app/Contents/jbr/Contents/Home`
- Android Studio SDK：`/Users/steve/Library/Android/sdk`
- AVD：`AIFitnessPro_API35`（Pixel 8，Android 15 / API 35）
- Gradle：本机构建请用 `GRADLE_USER_HOME=$HOME/.gradle`

后端：NestJS + PostgreSQL + Prisma。

媒体：free-exercise-db（Unlicense）通过 raw.githubusercontent.com，64 个动作 × 2 张 JPG。**生产上线前需迁移到国内 OSS（raw.githubusercontent.com 在大陆不稳定）。**

## 3. 当前主要目录结构

```text
docs/                           项目文档、持续上下文
android/
  feature/profile/              ProfileScreen（Stats + 成就 + 设置 + 账号注销）
  feature/exercise/             列表/详情/ExerciseMediaPreview（Coil）
  core/workout/                 状态机、Room、Session/Sync Repository
  core/api/                     AIFitnessApiClient（含 achievements + stats + deleteAccount）
backend/
  prisma/data/                  exercise-catalog.json、exercise-media.json（128 条真实图）
  prisma/migrations/            含 add_achievements migration
  src/achievements/             Achievement 模块（list + checkAndAward + computeStats）
  src/exercises/                动作库 API
  src/workouts/                 训练同步 API（完成后自动触发成就检查）
  src/users/                    users.service + users.controller（stats + deleteAccount）
```

## 4. 当前已完成内容

**Plan 1–5（已合并）**：Android 壳、后端基础、Onboarding、28 天 PPL 计划、训练 Session、动作库 + 媒体。

**本轮完成（Plan 5 收尾 + Plan 6）**

- 动作库媒体：64 个动作接入 free-exercise-db 开源图（Unlicense），128 条真实 JPG；修复 seed-media.ts 自覆盖 bug
- 成就系统：后端 6 条规则（首次训练、3/7 天连续、10/30/100 次）；`POST /v1/workouts/sessions/sync` 完成后自动触发检查；`GET /v1/achievements` 返回已解锁状态
- 训练统计：`GET /v1/users/me/stats`（completedSessions、currentStreak、longestStreak、totalDurationSeconds）
- 账号注销：`DELETE /v1/users/me` 级联硬删；Android ProfileScreen 二次确认弹窗 → 清 DataStore → 重置 App 状态（合规 P0）
- ProfileScreen 完全重建：Stats 卡片 + 成就徽章 + 设置列表（隐私/协议/权限/版本）+ 注销
- 修复 3 个编译 bug：`WorkoutStatus.AWAITING_EXERCISE_RPE` 未覆盖、`snapshot.exerciseFeedbacks` 引用错误、`TrainingScreen` 委托属性智能转型

## 5. 当前未完成事项（按优先级）

1. **手动烟测** Profile Tab：Stats 显示、成就解锁、账号注销流程
2. **上架必须 - Room migration**：去掉 `fallbackToDestructiveMigration()`，改用正式 Prisma-style schema migration
3. **上架必须 - 媒体 CDN 迁移**：将 raw.githubusercontent.com 图片下载上传至阿里云 OSS 或腾讯云 COS
4. **上架必须 - 真实 URL**：隐私政策/用户协议 HTTPS 页面部署；release API URL 改为真实域名
5. **Plan 7 上架材料**：App 备案、release 签名、截图/icon、SDK 清单、测试账号、国内机型报告
6. **延后**：营养/饮食模块、动作级 RPE 反馈

## 6. 已知 bug 或风险

- 媒体 URL 为 raw.githubusercontent.com，国内网络不稳定 → App 显示「预览暂不可用」；生产前必须迁移
- Room `fallbackToDestructiveMigration()` 会清本地训练数据，上线前必须移除
- Android debug URL 固定 `http://10.0.2.2:8000/`；release URL 仍为占位 `https://api.aifitnesspro.example/`
- 6 个动作（burpee、wall_sit、hip_abduction、towel_curl、pike_push_up、ytw_raise）无媒体图，显示「动图同步中」
- 账号删除后 Room 本地训练数据未清除（无用户 ID 关联，不是安全问题，但会在新用户会话中残留）

## 7. 当前暂停点

Plan 6 全部实现并提交，暂停在 **手动烟测 + Plan 7 上架准备前**。

## 8. 下一步开发任务

1. 手动烟测 Profile Tab（emulator + 后端同时运行）
2. Plan 7A：Room 正式 migration（当前 schema 变更 + 移除 fallbackToDestructiveMigration）
3. Plan 7B：release 签名 keystore 配置
4. Plan 7C：隐私/协议 URL 部署（哪怕是 GitHub Pages 静态页）
5. Plan 7D：媒体 CDN 迁移脚本（下载 + 上传 OSS + 批量更新 exercise-media.json）
6. Plan 7E：国内应用市场提交材料

## 9. 下一个 AI 会话应该从哪里继续

```bash
cd "/Users/steve/Desktop/Smart Everything/AIFitnessPro"
git log --oneline -5
git status
cd backend && npm test   # 验证 e2e 23 项
# 然后启动 emulator 烟测 Profile Tab
```

## 10. 建议 git commit message（下次）

```text
feat: Plan 7 release hardening - Room migration, signing, CDN, compliance URLs
```
