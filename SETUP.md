# Vercel 保持激活工具 - 设置指南

## 🎯 目标

创建一个定时访问 Vercel 网站的 GitHub Action，防止网站因长时间无访问而休眠。

## 📁 文件结构

```
keep-alive-action/
├── .github/
│   └── workflows/
│       └── keep-alive.yml    # GitHub Actions 配置
├── keep-alive.js             # 访问脚本
├── config.json               # 配置文件
├── package.json              # 项目配置
├── .gitignore               # Git 忽略文件
├── README.md                # 说明文档
└── SETUP.md                 # 设置指南
```

## 🚀 快速设置

### 步骤1：配置网站地址

编辑 `config.json` 文件，设置你的 Vercel 网站地址：

```json
{
  "websiteUrl": "https://your-project.vercel.app",
  "checkInterval": 5,
  "timeout": 10000,
  "maxRetries": 3
}
```

**重要**：将 `"https://your-project.vercel.app"` 替换为你的实际 Vercel 网站地址。

### 步骤2：创建 GitHub 仓库

#### 方法A：使用 GitHub 网页界面

1. 访问 [github.com/new](https://github.com/new)
2. 创建新仓库，名称建议：`keep-alive-action`
3. 选择公开或私有仓库
4. 点击 "Create repository"

#### 方法B：使用命令行

```bash
# 进入工具目录
cd /home/node/.openclaw/workspace/keep-alive-action

# 初始化 Git
git init
git add .
git commit -m "Initial commit"

# 添加远程仓库
git remote add origin https://github.com/你的用户名/keep-alive-action.git

# 推送到 GitHub
git push -u origin main
```

### 步骤3：启用 GitHub Actions

1. 在 GitHub 仓库页面，点击 "Settings"
2. 在左侧菜单中，点击 "Actions"
3. 确保 "Actions permissions" 设置为 "Allow all actions and reusable workflows"
4. 点击 "Save"

### 步骤4：测试工作流

#### 方法A：手动触发

1. 在 GitHub 仓库页面，点击 "Actions" 标签
2. 点击 "Keep Vercel Alive" 工作流
3. 点击 "Run workflow" 按钮
4. 选择分支（通常是 `main`）
5. 点击 "Run workflow"

#### 方法B：推送代码触发

```bash
# 修改配置后推送
git add .
git commit -m "Update configuration"
git push origin main
```

### 步骤5：查看运行日志

1. 在 GitHub 仓库页面，点击 "Actions" 标签
2. 点击 "Keep Vercel Alive" 工作流
3. 点击最近的运行记录
4. 查看日志输出

## 🔧 详细配置

### 配置文件说明

#### config.json

```json
{
  "websiteUrl": "https://your-project.vercel.app",
  "checkInterval": 5,
  "timeout": 10000,
  "maxRetries": 3,
  "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
}
```

**参数说明**：
- `websiteUrl`: 你的 Vercel 网站地址
- `checkInterval`: 检查间隔（分钟），默认 5 分钟
- `timeout`: 请求超时时间（毫秒），默认 10 秒
- `maxRetries`: 最大重试次数，默认 3 次
- `userAgent`: 浏览器标识，模拟真实浏览器访问

#### keep-alive.js

脚本会访问以下 URL：
1. 根路径：`https://your-project.vercel.app`
2. 启动页面：`https://your-project.vercel.app/start.html`
3. 主界面：`https://your-project.vercel.app/index.html`

#### keep-alive.yml

GitHub Actions 配置：
- **触发方式**：每 5 分钟运行一次
- **手动触发**：支持手动触发
- **推送触发**：代码推送时也会运行

## 📊 监控和日志

### 日志文件

脚本会在 `logs/` 目录下创建日志文件：
- 每天一个日志文件：`YYYY-MM-DD.log`
- 包含详细的访问记录
- 保留最近 7 天的日志

### 统计信息

脚本会记录：
- 访问次数
- 成功/失败次数
- 平均响应时间
- 最后访问时间

### 查看日志

#### 本地查看
```bash
# 查看最新日志
tail -f logs/$(date +%Y-%m-%d).log

# 查看所有日志
ls -la logs/
```

#### GitHub 查看
1. 在 GitHub 仓库页面，点击 "Actions" 标签
2. 点击 "Keep Vercel Alive" 工作流
3. 点击最近的运行记录
4. 查看控制台输出

## ⚙️ 自定义配置

### 修改访问频率

编辑 `config.json` 中的 `checkInterval`：

- **每 5 分钟**：`"checkInterval": 5`
- **每 10 分钟**：`"checkInterval": 10`
- **每 15 分钟**：`"checkInterval": 15`

**注意**：GitHub Actions 的免费计划有使用限制：
- 公共仓库：每月 2000 分钟
- 私有仓库：每月 1000 分钟

### 修改访问的 URL

编辑 `keep-alive.js`，可以访问多个 URL：

```javascript
const urls = [
  'https://your-project.vercel.app',
  'https://your-project.vercel.app/start.html',
  'https://your-project.vercel.app/index.html',
  'https://your-project.vercel.app/plan-guide.html'
];
```

### 修改超时时间

编辑 `config.json` 中的 `timeout`：
- **10 秒**：`"timeout": 10000`
- **15 秒**：`"timeout": 15000`
- **30 秒**：`"timeout": 30000`

### 修改重试次数

编辑 `config.json` 中的 `maxRetries`：
- **3 次**：`"maxRetries": 3`
- **5 次**：`"maxRetries": 5`
- **10 次**：`"maxRetries": 10`

## 🧪 本地测试

### 1. 安装依赖
```bash
cd /home/node/.openclaw/workspace/keep-alive-action
npm install
```

### 2. 配置
编辑 `config.json`，设置你的 Vercel 网站地址。

### 3. 测试
```bash
node keep-alive.js
```

### 4. 查看结果
脚本会输出访问结果，包括：
- 访问状态
- 响应时间
- HTTP 状态码

## 📈 费用估算

### GitHub Actions 费用

**免费计划**：
- 公共仓库：每月 2000 分钟
- 私有仓库：每月 1000 分钟

**每 5 分钟运行一次**：
- 每小时 12 次
- 每天 288 次
- 每月约 8640 次

**时间消耗**：
- 每次运行约 10-30 秒
- 每月约 2.4-7.2 小时
- 在免费额度内 ✅

### Vercel 费用

**免费计划**：
- 无限静态网站
- 无限带宽
- 无限部署
- 休眠后唤醒有延迟

**付费计划**：
- Pro: $20/月（无休眠）
- Enterprise: 定制价格

## 🔒 安全考虑

### 1. 不要暴露敏感信息
- 不要在代码中硬编码 API 密钥
- 使用 GitHub Secrets 存储敏感信息

### 2. 限制访问频率
- 不要设置太短的间隔（如 1 分钟）
- 遵守 GitHub Actions 使用限制

### 3. 监控使用情况
- 定期检查 GitHub Actions 使用量
- 避免超出免费额度

## 🎯 最佳实践

### 1. 选择合适的频率
- **每 5 分钟**：适合大多数情况
- **每 10 分钟**：节省 GitHub Actions 时间
- **每 15 分钟**：更节省时间，但可能不够及时

### 2. 监控网站状态
- 定期检查网站是否正常运行
- 如果网站出现问题，及时处理

### 3. 优化配置
- 根据实际需求调整频率
- 考虑时区差异（GitHub Actions 使用 UTC）

## 📞 故障排除

### 问题1：GitHub Actions 未运行

**可能原因**：
1. GitHub Actions 未启用
2. 配置文件错误
3. 权限不足

**解决方案**：
1. 检查仓库设置中的 Actions 是否启用
2. 检查 `.github/workflows/keep-alive.yml` 文件
3. 确保有正确的权限

### 问题2：访问失败

**可能原因**：
1. 网站地址错误
2. 网站已关闭
3. 网络问题

**解决方案**：
1. 检查 `config.json` 中的网站地址
2. 手动访问网站确认网站正常运行
3. 检查网络连接

### 问题3：超出 GitHub Actions 额度

**可能原因**：
1. 运行频率太高
2. 运行时间太长
3. 仓库数量太多

**解决方案**：
1. 降低运行频率（如改为每 10 分钟）
2. 优化脚本，减少运行时间
3. 考虑使用付费计划

### 问题4：日志文件过大

**可能原因**：
1. 运行频率太高
2. 日志保留时间太长

**解决方案**：
1. 降低运行频率
2. 修改日志保留策略
3. 定期清理旧日志

## 🎉 总结

现在你已经设置了一个定时访问 Vercel 网站的 GitHub Action：

1. ✅ 每 5 分钟自动访问你的 Vercel 网站
2. ✅ 防止网站因长时间无访问而休眠
3. ✅ 免费使用 GitHub Actions
4. ✅ 详细的日志和统计信息
5. ✅ 支持手动触发和自动触发

**你的 Vercel 网站将保持一直激活！💪**

## 📞 获取帮助

如果遇到问题：
1. 查看 GitHub Actions 日志
2. 检查 `config.json` 配置
3. 确认网站地址正确
4. 手动测试访问网站

**祝你使用愉快！🚀**