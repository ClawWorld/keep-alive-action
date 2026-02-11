# Vercel 网站保持激活工具

这个工具通过 GitHub Actions 定时访问 Vercel 网站，防止网站因长时间无访问而休眠。

## 🎯 目的

Vercel 的免费计划会在一段时间没有访问后进入休眠状态，再次访问时会有延迟。这个工具通过定时访问来保持网站一直激活。

## 📁 文件结构

```
keep-alive-action/
├── .github/
│   └── workflows/
│       └── keep-alive.yml    # GitHub Actions 配置
├── keep-alive.js             # 访问脚本
├── config.json               # 配置文件
├── package.json              # 项目配置
└── README.md                 # 说明文档
```

## 🚀 使用方法

### 1. 配置

编辑 `config.json` 文件，设置你的 Vercel 网站地址：

```json
{
  "websiteUrl": "https://your-project.vercel.app",
  "checkInterval": 5,
  "timeout": 10000,
  "maxRetries": 3
}
```

### 2. 部署到 GitHub

1. **创建 GitHub 仓库**
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

2. **启用 GitHub Actions**
   - 在 GitHub 仓库设置中
   - 点击 "Actions"
   - 确保 Actions 已启用

### 3. 工作原理

- **定时触发**：每 5 分钟运行一次
- **访问网站**：使用 HTTP 请求访问 Vercel 网站
- **记录日志**：记录访问结果和状态
- **错误处理**：如果访问失败，会重试并记录错误

## 🔧 配置选项

### config.json 参数说明

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `websiteUrl` | string | - | Vercel 网站地址 |
| `checkInterval` | number | 5 | 检查间隔（分钟） |
| `timeout` | number | 10000 | 请求超时时间（毫秒） |
| `maxRetries` | number | 3 | 最大重试次数 |

### GitHub Actions 配置

在 `.github/workflows/keep-alive.yml` 中：

```yaml
name: Keep Vercel Alive

on:
  schedule:
    # 每 5 分钟运行一次
    - cron: '*/5 * * * *'
  workflow_dispatch:  # 手动触发

jobs:
  keep-alive:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Keep Vercel alive
        run: node keep-alive.js
```

## 📊 监控和日志

### 查看运行日志

1. **在 GitHub 中查看**
   - 进入仓库的 "Actions" 标签
   - 点击 "Keep Vercel Alive" 工作流
   - 查看每次运行的日志

2. **日志内容**
   - 访问时间
   - 访问状态
   - 响应时间
   - 错误信息（如果有）

### 统计信息

脚本会记录以下信息：
- 访问次数
- 成功/失败次数
- 平均响应时间
- 最后访问时间

## ⚙️ 自定义配置

### 修改访问频率

编辑 `config.json` 中的 `checkInterval`：
- `5` = 每 5 分钟
- `10` = 每 10 分钟
- `15` = 每 15 分钟

**注意**：GitHub Actions 的免费计划有使用限制：
- 每月 2000 分钟（公共仓库免费）
- 每月 1000 分钟（私有仓库）

### 修改访问的 URL

编辑 `config.json` 中的 `websiteUrl`：
- 可以访问根路径：`https://your-project.vercel.app`
- 可以访问特定页面：`https://your-project.vercel.app/start.html`
- 可以访问多个 URL（见高级配置）

### 高级配置

编辑 `keep-alive.js`，可以访问多个 URL：

```javascript
const urls = [
  'https://your-project.vercel.app',
  'https://your-project.vercel.app/start.html',
  'https://your-project.vercel.app/index.html'
];
```

## 🛠️ 本地测试

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

## 🎉 总结

这个工具可以帮助你：
1. ✅ 保持 Vercel 网站一直激活
2. ✅ 避免网站休眠导致的延迟
3. ✅ 免费使用 GitHub Actions
4. ✅ 简单易用，配置灵活

**现在就开始使用吧！💪**