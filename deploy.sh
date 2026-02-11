#!/bin/bash

# Vercel 保持激活工具 - 部署脚本

echo "🚀 Vercel 保持激活工具 - 部署脚本"
echo "=================================="

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 请在 keep-alive-action 目录中运行此脚本"
    echo "当前目录: $(pwd)"
    exit 1
fi

echo "✅ 在正确的目录中"

# 检查是否安装了 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 未安装 Node.js"
    echo "请先安装 Node.js: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js 已安装"

# 检查是否安装了 Git
if ! command -v git &> /dev/null; then
    echo "❌ 未安装 Git"
    echo "请先安装 Git: https://git-scm.com/"
    exit 1
fi

echo "✅ Git 已安装"

# 检查配置文件
echo ""
echo "📋 检查配置文件..."
if [ -f "config.json" ]; then
    echo "✅ config.json 存在"
    cat config.json
else
    echo "❌ config.json 不存在"
    echo "请先运行: npm run setup"
    exit 1
fi

# 验证配置
echo ""
echo "🔍 验证配置..."
WEBSITE_URL=$(node -e "console.log(require('./config.json').websiteUrl)")
if [ "$WEBSITE_URL" = "https://your-project.vercel.app" ]; then
    echo "❌ 请先配置你的 Vercel 网站地址"
    echo "运行: npm run setup"
    exit 1
fi

echo "✅ 网站地址: $WEBSITE_URL"

# 测试网站访问
echo ""
echo "🧪 测试网站访问..."
npm test

if [ $? -ne 0 ]; then
    echo "❌ 网站测试失败，请检查配置和网络连接"
    exit 1
fi

echo "✅ 网站测试通过"

# 初始化 Git
echo ""
echo "📦 初始化 Git..."
if [ ! -d ".git" ]; then
    git init
    echo "✅ Git 初始化完成"
else
    echo "✅ Git 已初始化"
fi

# 添加文件
echo ""
echo "📁 添加文件到 Git..."
git add .
echo "✅ 文件已添加"

# 提交更改
echo ""
echo "📝 提交更改..."
git commit -m "Initial commit" || echo "⚠️ 无更改可提交"

# 检查远程仓库
echo ""
echo "🔗 检查远程仓库..."
REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "")

if [ -z "$REMOTE_URL" ]; then
    echo "❌ 未配置远程仓库"
    echo ""
    echo "请手动配置远程仓库："
    echo "1. 在 GitHub 创建新仓库"
    echo "2. 运行: git remote add origin https://github.com/你的用户名/keep-alive-action.git"
    echo "3. 运行: git push -u origin main"
    echo ""
    echo "或者使用以下命令（需要先创建 GitHub 仓库）："
    echo "git remote add origin https://github.com/你的用户名/keep-alive-action.git"
    echo "git push -u origin main"
else
    echo "✅ 远程仓库已配置: $REMOTE_URL"
    echo ""
    echo "推送到 GitHub..."
    git push -u origin main
    
    if [ $? -eq 0 ]; then
        echo "✅ 代码已推送到 GitHub"
        echo ""
        echo "下一步："
        echo "1. 在 GitHub 仓库设置中启用 Actions"
        echo "2. 等待定时任务运行"
        echo "3. 查看运行日志"
    else
        echo "❌ 推送失败，请检查远程仓库配置"
    fi
fi

echo ""
echo "=================================="
echo "✅ 部署完成！"
echo "=================================="
echo ""
echo "你的 Vercel 保持激活工具已准备就绪！"
echo ""
echo "下一步："
echo "1. 在 GitHub 仓库设置中启用 Actions"
echo "2. 等待定时任务运行（每 5 分钟）"
echo "3. 查看运行日志"
echo ""
echo "详细说明请查看 README.md"
echo ""
echo "祝你使用愉快！💪"