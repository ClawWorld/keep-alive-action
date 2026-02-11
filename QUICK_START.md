# Vercel 保持激活工具 - 快速开始

## 🎯 目标

创建一个定时访问 Vercel 网站的 GitHub Action，防止网站因长时间无访问而休眠。

## 🚀 5分钟快速设置

### 步骤1：配置网站地址

```bash
# 进入工具目录
cd /home/node/.openclaw/workspace/keep-alive-action

# 运行设置向导
npm run setup
```

或者手动编辑 `config.json`：

```json
{
  "websiteUrl": "https://your-project.vercel.app",
  "checkInterval": 5,
  "timeout": 10000,
  "maxRetries": 3
}
```

**重要**：将 `"https://your-project.vercel.app"` 替换为你的实际 Vercel 网站地址。

### 步骤2：测试配置

```bash
# 测试网站访问
npm test
```

如果测试成功，你会看到类似输出：
```
✅ 成功: 状态码 200, 耗时 123ms, 大小 5847 bytes
```

### 步骤3：创建 GitHub 仓库

#### 方法A：使用 GitHub 网页界面

1. 访问 [github.com/new](https://github.com/new)
2. 创建新仓库，名称建议：`keep-alive-action`
3. 选择公开或私有仓库
4. 点击 "Create repository"

#### 方法B：使用命令行

```bash
# 初始化 Git
git init
git add .
git commit -m "Initial commit"

# 添加远程仓库
git remote add origin https://github.com/你的用户名/keep-alive-action.git

# 推送到 GitHub
git push -u origin main
```

### 步骤4：启用 GitHub Actions

1. 在 GitHub 仓库页面，点击 "Settings"
2. 在左侧菜单中，点击 "Actions"
3. 确保 "Actions permissions" 设置为 "Allow all actions and reusable workflows"
4. 点击 "Save"

### 步骤5：测试工作流

1. 在 GitHub 仓库页面，点击 "Actions" 标签
2. 点击 "Keep Vercel Alive" 工作流
3. 点击 "Run workflow" 按钮
4. 选择分支（通常是 `main`）
5. 点击 "Run workflow"

### 步骤6：查看运行日志

1. 在 GitHub 仓库页面，点击 "Actions" 标签
2. 点击 "Keep Vercel Alive" 工作流
3. 点击最近的运行记录
4. 查看日志输出

## 📁 文件结构

```
keep-alive-action/
├── .github/
│   └── workflows/
│       └── keep-alive.yml    # GitHub Actions 配置
├── keep-alive.js             # 访问脚本
├── test.js                   # 测试脚本
├── setup.js                  # 设置向导
├── config.json               # 配置文件
├── package.json              # 项目配置
├── .gitignore               # Git 忽略文件
├── README.md                # 说明文档
├── SETUP.md                 # 详细设置指南
└── QUICK_START.md           # 快速开始指南
```

## 🔧 常用命令

### 本地测试
```bash
# 测试网站访问
npm test

# 运行保持激活脚本
npm start

# 运行设置向导
npm run setup
```

### Git 操作
```bash
# 添加文件
git add .

# 提交更改
git commit -m "Update configuration"

# 推送到 GitHub
git push origin main
```

## 📊 监控和日志

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

### 统计信息

脚本会记录：
- 访问次数
- 成功/失败次数
- 平均响应时间
- 最后访问时间

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
  'https://your-project.vercel.app/index.html'
];
```

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

## 🎯 成功标准

部署成功后，你应该能够：

1. ✅ 网站每 5 分钟被访问一次
2. ✅ 网站保持一直激活状态
3. ✅ 访问网站时没有延迟
4. ✅ GitHub Actions 正常运行
5. ✅ 日志记录完整

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