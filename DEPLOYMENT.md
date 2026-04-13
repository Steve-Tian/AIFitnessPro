# AIFitnessPro - 部署指南

## 环境要求

### 本地开发环境
- **Node.js**: `>=14.0.0`
- **微信开发者工具**: `>=3.0.0`
- **npm/yarn**: 包管理器

### 云环境要求
- **微信小程序账号**: 已注册并认证
- **云开发环境**: 已开通（免费额度充足）

## 项目结构

```
AIFitnessPro/
├── cloudfunctions/           # 云函数目录
│   ├── genPlan/             # 计划生成引擎
│   ├── saveFeedback/        # 反馈收集与调整
│   └── unlockAchievement/   # 成就系统
├── miniprogram/             # 小程序前端
│   ├── pages/               # 页面目录
│   │   ├── index/           # 首页
│   │   ├── onboarding/      # 用户问卷
│   │   ├── training/        # 训练会话
│   │   └── achievements/    # 成就页面
│   ├── utils/               # 工具函数
│   │   ├── persona.js       # 搭子话术引擎
│   │   └── nutrition.js     # 营养计算引擎
│   └── data/                # 静态数据
│       └── exercises.json   # 动作库
├── tests/                   # 测试套件
│   ├── unit/                # 单元测试
│   └── integration/         # 集成测试
└── project.config.json      # 项目配置
```

## 部署步骤

### 1. 初始化云环境

1. 在微信开发者工具中打开项目
2. 点击右上角「云开发」按钮
3. 创建新的云开发环境（或选择现有环境）
4. 记录环境ID，本项目的环境ID为：`cloud1-6g1a5yel097ba48d`

### 2. 配置项目

修改 `project.config.json`：
```json
{
  "appid": "wx0b39a8a84f0a810f",  // 使用您的小程序AppID，或保持测试ID
  "cloudfunctionRoot": "cloudfunctions/",
  "miniprogramRoot": "miniprogram/"
}
```

### 3. 上传云函数

在微信开发者工具中：

1. **上传所有云函数**：
   - 右键 `cloudfunctions/` 目录
   - 选择「上传所有云函数」
   - 等待上传完成

2. **设置云函数权限**：
   - 进入微信公众平台后台
   - 「开发」→「开发管理」→「运维中心」→「云开发」
   - 确保云函数有数据库读写权限

### 4. 初始化云数据库

**方式一：使用初始化脚本**
1. 在微信开发者工具中打开「云开发」控制台
2. 点击「数据库」→「集合管理」
3. 运行项目根目录下的 `init_database.js` 脚本创建集合

**方式二：手动创建集合**
创建以下集合（设置权限为「仅创建者可读写」或「所有用户可读，仅创建者可写」）：

```
users: {                    // 用户档案
  _openid: "用户OpenID",
  profile: { ... },         // 用户问卷数据
  streak_days: 0,          // 连续打卡天数
  current_plan_id: null,   // 当前计划ID
  achievements: [],        // 已解锁成就
  total_points: 0,        // 总积分
  created_at: Date,
  updated_at: Date
}

plans: {                   // 训练计划
  _id: "计划ID",
  userId: "用户ID",
  startDate: Date,
  endDate: Date,
  weeklyPlan: [...],       // 7天计划数组
  session_feedback: [],    // 训练反馈
  createdAt: Date,
  updated_at: Date
}

feedback: {                // 训练反馈
  _id: "反馈ID",
  planId: "计划ID",
  userId: "用户ID",
  exerciseIndex: 0,        // 动作索引
  rpe: 8,                  // RPE评分
  completedAt: Date,       // 完成时间
  intensityAdjustment: 0.05 // 强度调整
}

achievement_logs: {        // 成就解锁记录
  _id: "日志ID",
  userId: "用户ID",
  achievementId: "成就ID",
  unlockedAt: Date,        // 解锁时间
  pointsAwarded: 10        // 获得积分
}
```

### 5. 上传小程序代码

1. 在微信开发者工具中点击「上传」
2. 填写版本号（建议格式：`1.0.0`）
3. 填写版本描述
4. 等待上传完成

### 6. 本地测试

在微信开发者工具中：

1. **开启云开发调试**：工具栏「云开发」→「本地调试」
2. **运行测试**：
   ```bash
   # 在项目根目录运行
   npm install jest --save-dev
   npx jest tests/unit/
   npx jest tests/integration/
   ```

## 生产环境配置

### 性能优化
- **分包加载**：将 `pages/` 按功能拆分为子包
- **图片压缩**：使用 WebP 格式，压缩 GIF 大小
- **代码分割**：将工具函数独立打包

### 安全配置
- **HTTPS**：确保所有外部API调用使用HTTPS
- **数据验证**：云函数中验证所有输入参数
- **权限控制**：数据库权限设置为最小必要原则

## 故障排

### 常见问题

**Q: 云函数调用失败**
A: 检查云环境ID是否正确，云函数是否已上传，网络连接是否正常

**Q: 数据库读写失败**
A: 检查数据库权限设置，用户是否已登录（`wx.login`）

**Q: 计划生成为空**
A: 检查用户档案是否完整，设备类型是否匹配动作库

**Q: RPE反馈无效**
A: 检查云函数 `saveFeedback` 是否正常运行，数据库连接是否正常

### 日志查看
- 云函数日志：微信公众平台 → 云开发 → 云函数 → 日志查询
- 数据库操作日志：微信公众平台 → 云开发 → 数据库 → 操作日志

## 版本升级

### 小版本更新（bug修复）
1. 修改对应文件
2. 上传云函数（如涉及）
3. 上传小程序代码
4. 发布版本

### 大版本更新（功能新增）
1. 完成开发和测试
2. 更新数据库结构（如有）
3. 上传所有云函数
4. 上传小程序代码
5. 发布版本
6. 通知用户更新