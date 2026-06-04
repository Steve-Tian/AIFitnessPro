# App Icon 与截图上架指南

---

## 一、App Icon

### 当前状态

当前 icon 是一个蓝底白色哑铃矢量图（`res/drawable/ic_launcher_foreground.xml`），是 Android 标准的 Adaptive Icon 格式，**调试用够用，上架前建议替换成更精致的版本**。

### 各渠道要求

| 渠道 | 尺寸 | 格式 | 说明 |
|---|---|---|---|
| 华为应用市场 | 512×512 px | PNG，<1 MB | 圆形区域内容不裁切 |
| 小米应用商店 | 512×512 px | PNG | 同上 |
| OPPO 软件商店 | 512×512 px | PNG | 同上 |
| 腾讯应用宝 | 512×512 px | PNG | 同上 |
| Google Play | 512×512 px | PNG | 同上 |
| 通用（本地安装）| 1024×1024 px | PNG | 高清备用 |

**设计建议**：
- 底色用深蓝（`#2563EB`，当前主色），前景白色哑铃/闪电/人形图案
- 圆角不需要你处理，各渠道会自动应用圆角/圆形裁切
- 不要在 icon 里写文字（过小看不清，各渠道也会叠加 App 名称）

### 快速生成方案

如果不想找设计师，推荐用以下工具 5 分钟生成：
1. **Android Asset Studio**：[旧版工具，可离线](https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html)
2. **Figma**（免费版）：新建 512×512 画板，导出 PNG
3. **Canva**：搜索「App Icon」模板，替换颜色和图标

### 替换步骤（替换后）

```bash
# 把 512x512 的 PNG 命名为 ic_launcher.png，放到各 mipmap 目录
# 用 Android Studio 的 Image Asset Studio 一键生成所有尺寸：
# File → New → Image Asset → Icon Type: Launcher Icons → 选你的 PNG → Next → Finish
```

---

## 二、截图

各市场要求至少 3 张截图，建议准备 5 张，覆盖核心功能流程。

### 推荐截图顺序（叙事顺序）

| 序号 | 内容 | 对应功能 |
|---|---|---|
| 1 | Onboarding 填写页（目标选择） | 展示个性化起点 |
| 2 | 今日训练计划概览（Home Tab） | 展示计划生成结果 |
| 3 | 训练中页面（动作 + 计时器） | 展示核心训练循环 |
| 4 | 动作库浏览（图解列表） | 展示内容深度 |
| 5 | 我的页面（统计 + 成就徽章） | 展示激励体系 |

### 截图尺寸

| 渠道 | 要求 | 格式 |
|---|---|---|
| 华为 / 小米 / OPPO / vivo | 1080×1920 px（竖屏）或 1920×1080 px（横屏） | JPG 或 PNG，<8 MB |
| 腾讯应用宝 | 1080×1920 px | JPG |
| Google Play | 1080×1920 px（最低 320 px 宽） | JPG 或 PNG，<8 MB |

**AVD 截图方式**：
```bash
# 启动 AVD 后，Android Studio 右侧 Emulator 工具栏点相机图标
# 或用 adb：
adb exec-out screencap -p > screenshot.png
```

### 截图注意事项

- 用模拟器 Pixel 8 / API 35（已配置为 `AIFitnessPro_API35`），分辨率 1080×2400
- 截图前填充真实数据（至少做完 2 次训练，让成就和统计显示出来）
- 截图后用 macOS「预览」裁切为 1080×1920（留上下边距）
- 不需要加设备边框，各市场会自动套上手机壳效果

---

## 三、App ICP 备案（国内上架必须）

> 根据工信部规定，国内分发的 App 必须完成备案。流程约 10–15 个工作日。

### 备案渠道

直接在工信部「全国 APP 备案」系统操作：[beian.miit.gov.cn](https://beian.miit.gov.cn)

### 需要准备的材料

| 材料 | 说明 |
|---|---|
| 个人身份证 | 正反面照片，用于实名认证 |
| App 签名证书 SHA-1 / SHA-256 | 从 `aifitnesspro.jks` 导出（见下方命令） |
| App 包名 | `com.aifitnesspro.android` |
| 隐私政策 URL | `https://steve-tian.github.io/AIFitnessPro/legal/privacy.html` |
| 应用名称 | AIFitnessPro - 智能健身计划 |
| 应用类别 | 健康与健身 |

### 导出证书 SHA 指纹

```bash
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
"$JAVA_HOME/bin/keytool" -list -v \
  -keystore android/app/aifitnesspro.jks \
  -alias aifitnesspro \
  -storepass <你的密码>
# 输出中找 SHA1 和 SHA-256 两行，填入备案系统
```
