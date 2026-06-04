# PROJECT_CONTEXT.md

本文件是 AIFitnessPro 的持续上下文记忆文件。每次继续开发前先读本文件、目录结构、相关代码和 `git status`；每个阶段结束后更新本文件。

## 1. 项目基本信息

- **项目名称**：AIFitnessPro
- **类型**：Android 原生健身 App + NestJS 后端
- **营养/饮食模块**：已决策延后，专注训练主线
- **当前阶段**：Plan 1–6 全部完成；动作库扩充完毕；待 Plan 7（上架硬化）

## 2. 技术栈 & 本地环境

| 层 | 详情 |
|---|---|
| Android | Kotlin + Jetpack Compose + Room + DataStore + Coil；compileSdk 35，minSdk 26 |
| 后端 | NestJS 10 + Prisma 5 + PostgreSQL 16 |
| JDK | Android Studio 内置 JBR 21（Apple Silicon）<br>`JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"` |
| AVD | `AIFitnessPro_API35`（Pixel 8 / API 35） |
| 媒体 | free-exercise-db（Unlicense），raw.githubusercontent.com/yuhonas/free-exercise-db |

## 3. 当前代码状态

```
git log --oneline -6:
4e9ac70 feat: expand exercise library to 108 exercises with rotation-based plan engine
afd0ad1 docs: update PROJECT_CONTEXT for Plan 6 completion and Plan 7 roadmap
fc2f896 docs: fix JDK path in CLAUDE.md for Apple Silicon (JBR 21)
d1d48b3 feat: Profile tab with stats, achievements, account deletion, and settings
031d370 feat: achievements, workout stats, and account deletion API
702b020 feat: replace placeholder media with free-exercise-db open-source images
```

**工作区干净，无未提交文件。**

## 4. 已完成功能清单

### Plan 1–5（基础 + 训练循环 + 动作库）
- Android 壳、Onboarding、28 天 PPL 计划生成
- 训练 Session 状态机 + Room 持久化 + 离线同步队列
- 动作库列表 / 筛选 / 详情（Coil 图片加载）
- 训练 Tab 显示已完成状态

### Plan 6（Profile + 成就 + 账号管理）
- **成就系统**：6 条规则（首次训练 / 3/7 天连续 / 10/30/100 次）；训练完成自动触发
- **训练统计**：`GET /v1/users/me/stats`（sessions、streaks、duration）
- **账号注销**：`DELETE /v1/users/me` + Android 二次确认 + 清 DataStore
- **ProfileScreen 完全重建**：Stats 卡片 + 成就徽章 + 设置列表（隐私/协议/权限/版本）

### 动作库扩充（70 → 108 条）
- 每个主要肌群 ≥5 条可替换动作
- 媒体：204 条真实图片（102 个动作 × 2 张 JPG，来自 free-exercise-db）
- **Plan 引擎重构**：5 插槽 × 轮换池，4 周内同类型训练日完全不重复动作组合
  - Push: 胸部复合 → 胸部孤立 → 肩部复合 → 肩部孤立 → 三头
  - Pull: 垂直拉 → 水平拉 → 后束三角 → 二头复合 → 二头孤立
  - Legs: 股四头复合 → 髋铰链 → 股四头辅助 → 臀肌孤立 → 小腿

## 5. 后端 API 清单

| 方法 | 路径 | 描述 |
|---|---|---|
| POST | /v1/dev/users | 创建开发用户 |
| GET | /v1/users/me | 当前用户信息 |
| GET | /v1/users/me/stats | 训练统计（sessions/streaks/duration） |
| PUT | /v1/users/me/profile | 更新 Onboarding 资料 |
| DELETE | /v1/users/me | 注销账号（级联删除） |
| POST | /v1/plans/generate | 生成 28 天 PPL 计划 |
| GET | /v1/plans/active | 获取当前激活计划 |
| POST | /v1/workouts/sessions/sync | 同步训练 Session（完成后触发成就检查） |
| GET | /v1/exercises | 动作列表（支持 category/difficulty/equipment/q 筛选） |
| GET | /v1/exercises/:slug | 动作详情 |
| GET | /v1/achievements | 成就列表（含解锁状态） |

## 6. 已知风险（上架前必须解决）

| 风险 | 优先级 | 说明 |
|---|---|---|
| 媒体 CDN | **P0** | raw.githubusercontent.com 国内不稳定；须迁移至国内 OSS |
| Room migration | **P0** | 仍用 `fallbackToDestructiveMigration()`，上架前必须改为正式 migration |
| Release API URL | **P0** | `https://api.aifitnesspro.example/` 是占位，需真实域名 |
| 隐私政策/用户协议 | **P0** | HTTPS 页面还未部署，设置页链接打不开 |
| App 备案 | **P0** | 国内安卓上架合规要求 |
| 6 个动作无媒体 | P2 | burpee/wall_sit/hip_abduction/towel_curl/pike_push_up/ytw_raise 显示「动图同步中」 |
| Room 本地数据 | P2 | 账号注销后 Room 数据未清除（无安全问题，但可优化） |

## 7. 下一步：Plan 7（上架硬化）

**必须完成的任务（按推荐顺序）：**

1. **7A — Room 正式 Migration**
   - 移除 `fallbackToDestructiveMigration()`
   - 添加 Room Schema version 迁移脚本
   - 文件：`android/.../core/workout/local/WorkoutDatabase.kt`

2. **7B — 媒体 CDN 迁移**（工作量较大，可先做 7A/7C/7D）
   - 下载 102 张 JPG → 上传到阿里云 OSS 或腾讯云 COS
   - 批量更新 `exercise-media.json` URL
   - 重新 seed 数据库
   - 需要你提供 OSS bucket 和 Access Key

3. **7C — Release 签名配置**
   - 生成 keystore（建议你自己保管密钥）
   - 配置 `android/app/build.gradle.kts` 的 signingConfigs
   - 文件：`android/app/build.gradle.kts`

4. **7D — 隐私政策 / 用户协议部署**
   - 最简方案：GitHub Pages 静态页
   - 需要你决定域名（可用 `aifitnesspro.github.io` 或自定义域名）
   - 更新 `ProfileScreen.kt` 里的占位 URL

5. **7E — Release API URL**
   - 购买域名 + 部署后端到云服务器
   - 更新 `android/app/build.gradle.kts` 的 release buildConfigField
   - 后端 `.env` 更新数据库连接和端口

6. **7F — 上架材料**
   - App icon（1024×1024）、截图（多分辨率）
   - 应用简介、分类、年龄分级
   - Android SDK 使用说明
   - 国内应用市场备案（App ICP）

## 8. 启动命令参考

```bash
# 后端
cd "/Users/steve/Desktop/Smart Everything/AIFitnessPro/backend"
docker compose up -d postgres
npm run seed      # 108 exercises + 204 media + 6 achievements
npm run start:dev # :8000
npm test          # 23 e2e + 11 unit

# Android
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
export GRADLE_USER_HOME=$HOME/.gradle
cd "/Users/steve/Desktop/Smart Everything/AIFitnessPro/android"
./gradlew :app:assembleDebug
./gradlew :app:installDebug   # AVD: AIFitnessPro_API35
./gradlew :app:testDebugUnitTest
```

## 9. 新会话应该从哪里继续

```bash
cd "/Users/steve/Desktop/Smart Everything/AIFitnessPro"
git log --oneline -5   # 确认最新 commit
git status             # 确认工作区干净
cd backend && npm test # 验证 23 项 e2e 仍全绿
```

然后根据用户决定的上架优先级选择 7A–7F 其中一项开始。

## 10. 建议下次 commit message

```text
feat: Plan 7 - Room migration + release signing + CDN media
```
