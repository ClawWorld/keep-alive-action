#!/usr/bin/env node

/**
 * 设置脚本 - 帮助用户配置 Vercel 保持激活工具
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// 创建 readline 接口
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// 配置文件路径
const configPath = path.join(__dirname, 'config.json');

// 读取当前配置
let currentConfig;
try {
    currentConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (error) {
    console.error('❌ 无法读取配置文件:', error.message);
    process.exit(1);
}

console.log('🔧 Vercel 保持激活工具 - 设置向导');
console.log('==================================\n');

// 问题列表
const questions = [
    {
        name: 'websiteUrl',
        question: '请输入你的 Vercel 网站地址 (例如: https://your-project.vercel.app): ',
        default: currentConfig.websiteUrl,
        validate: (value) => {
            if (!value || value === 'https://your-project.vercel.app') {
                return '请输入有效的 Vercel 网站地址';
            }
            if (!value.startsWith('http://') && !value.startsWith('https://')) {
                return '网址必须以 http:// 或 https:// 开头';
            }
            return true;
        }
    },
    {
        name: 'checkInterval',
        question: '请输入检查间隔 (分钟，建议 5-15 分钟): ',
        default: currentConfig.checkInterval,
        validate: (value) => {
            const num = parseInt(value);
            if (isNaN(num) || num < 1 || num > 60) {
                return '请输入 1-60 之间的数字';
            }
            return true;
        }
    },
    {
        name: 'timeout',
        question: '请输入请求超时时间 (毫秒，建议 10000): ',
        default: currentConfig.timeout,
        validate: (value) => {
            const num = parseInt(value);
            if (isNaN(num) || num < 1000 || num > 30000) {
                return '请输入 1000-30000 之间的数字';
            }
            return true;
        }
    },
    {
        name: 'maxRetries',
        question: '请输入最大重试次数 (建议 3): ',
        default: currentConfig.maxRetries,
        validate: (value) => {
            const num = parseInt(value);
            if (isNaN(num) || num < 1 || num > 10) {
                return '请输入 1-10 之间的数字';
            }
            return true;
        }
    }
];

// 收集答案
const answers = {};

// 递归处理问题
function askQuestion(index) {
    if (index >= questions.length) {
        // 所有问题都回答完了
        saveConfig();
        return;
    }

    const q = questions[index];
    
    rl.question(q.question, (answer) => {
        // 使用默认值
        if (!answer.trim()) {
            answer = q.default;
        }
        
        // 验证答案
        const validation = q.validate(answer);
        if (validation !== true) {
            console.log(`❌ ${validation}`);
            askQuestion(index); // 重新问同一个问题
            return;
        }
        
        // 保存答案
        answers[q.name] = answer;
        
        // 继续下一个问题
        askQuestion(index + 1);
    });
}

// 保存配置
function saveConfig() {
    console.log('\n==================================');
    console.log('正在保存配置...\n');
    
    // 转换数据类型
    const config = {
        websiteUrl: answers.websiteUrl,
        checkInterval: parseInt(answers.checkInterval),
        timeout: parseInt(answers.timeout),
        maxRetries: parseInt(answers.maxRetries),
        userAgent: currentConfig.userAgent
    };
    
    // 写入配置文件
    try {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        console.log('✅ 配置已保存到:', configPath);
        console.log('\n配置内容:');
        console.log(JSON.stringify(config, null, 2));
        console.log('\n==================================');
        console.log('🎉 配置完成！\n');
        console.log('下一步操作:');
        console.log('1. 测试配置: npm test');
        console.log('2. 创建 GitHub 仓库');
        console.log('3. 推送代码到 GitHub');
        console.log('4. 在 GitHub 中启用 Actions');
        console.log('5. 等待定时任务运行');
        console.log('\n详细说明请查看 README.md');
    } catch (error) {
        console.error('❌ 保存配置失败:', error.message);
    }
    
    rl.close();
}

// 开始设置
console.log('当前配置:');
console.log(JSON.stringify(currentConfig, null, 2));
console.log('\n开始配置...\n');

askQuestion(0);