#!/usr/bin/env node

/**
 * 状态监控脚本 - 监控 Vercel 网站状态
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// 读取配置文件
const configPath = path.join(__dirname, 'config.json');
let config;

try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (error) {
    console.error('❌ 无法读取配置文件:', error.message);
    process.exit(1);
}

// 验证配置
if (!config.websiteUrl || config.websiteUrl === 'https://your-project.vercel.app') {
    console.error('❌ 请在 config.json 中设置正确的 websiteUrl');
    process.exit(1);
}

// 状态文件
const statusFile = path.join(__dirname, 'status.json');

// HTTP/HTTPS 请求函数
function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        const options = {
            method: 'GET',
            timeout: config.timeout,
            headers: {
                'User-Agent': config.userAgent,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
                'Connection': 'keep-alive'
            }
        };

        const startTime = Date.now();
        
        const req = protocol.request(url, options, (res) => {
            const duration = Date.now() - startTime;
            const statusCode = res.statusCode;
            
            // 收集响应数据
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                const result = {
                    success: statusCode >= 200 && statusCode < 300,
                    statusCode: statusCode,
                    duration: duration,
                    url: url,
                    responseLength: data.length
                };
                
                resolve(result);
            });
        });

        req.on('error', (error) => {
            const duration = Date.now() - startTime;
            
            reject({
                success: false,
                error: error.message,
                duration: duration,
                url: url
            });
        });

        req.on('timeout', () => {
            req.destroy();
            const duration = Date.now() - startTime;
            
            reject({
                success: false,
                error: 'Request timeout',
                duration: duration,
                url: url
            });
        });

        req.end();
    });
}

// 检查网站状态
async function checkStatus() {
    console.log('🔍 检查 Vercel 网站状态');
    console.log('==================================');
    console.log('网站地址: ' + config.websiteUrl);
    console.log('==================================\n');
    
    try {
        const result = await makeRequest(config.websiteUrl);
        
        if (result.success) {
            console.log('✅ 网站状态: 正常');
            console.log(`   状态码: ${result.statusCode}`);
            console.log(`   响应时间: ${result.duration}ms`);
            console.log(`   响应大小: ${result.responseLength} bytes`);
            
            // 保存状态
            const status = {
                status: 'online',
                statusCode: result.statusCode,
                responseTime: result.duration,
                responseSize: result.responseLength,
                timestamp: new Date().toISOString(),
                url: config.websiteUrl
            };
            
            fs.writeFileSync(statusFile, JSON.stringify(status, null, 2));
            console.log(`\n状态已保存到: ${statusFile}`);
            
            return true;
        } else {
            console.log('❌ 网站状态: 离线');
            console.log(`   状态码: ${result.statusCode}`);
            console.log(`   响应时间: ${result.duration}ms`);
            
            // 保存状态
            const status = {
                status: 'offline',
                statusCode: result.statusCode,
                responseTime: result.duration,
                timestamp: new Date().toISOString(),
                url: config.websiteUrl,
                error: result.error
            };
            
            fs.writeFileSync(statusFile, JSON.stringify(status, null, 2));
            console.log(`\n状态已保存到: ${statusFile}`);
            
            return false;
        }
    } catch (error) {
        console.log('❌ 网站状态: 无法访问');
        console.log(`   错误: ${error.error}`);
        console.log(`   响应时间: ${error.duration}ms`);
        
        // 保存状态
        const status = {
            status: 'error',
            error: error.error,
            responseTime: error.duration,
            timestamp: new Date().toISOString(),
            url: config.websiteUrl
        };
        
        fs.writeFileSync(statusFile, JSON.stringify(status, null, 2));
        console.log(`\n状态已保存到: ${statusFile}`);
        
        return false;
    }
}

// 显示历史状态
function showHistory() {
    if (!fs.existsSync(statusFile)) {
        console.log('暂无历史状态记录');
        return;
    }
    
    try {
        const status = JSON.parse(fs.readFileSync(statusFile, 'utf8'));
        console.log('\n📊 历史状态记录');
        console.log('==================================');
        console.log(`状态: ${status.status}`);
        console.log(`时间: ${status.timestamp}`);
        console.log(`URL: ${status.url}`);
        
        if (status.statusCode) {
            console.log(`状态码: ${status.statusCode}`);
        }
        
        if (status.responseTime) {
            console.log(`响应时间: ${status.responseTime}ms`);
        }
        
        if (status.error) {
            console.log(`错误: ${status.error}`);
        }
        
        console.log('==================================');
    } catch (error) {
        console.log('无法读取状态文件');
    }
}

// 主函数
async function main() {
    const success = await checkStatus();
    showHistory();
    
    if (success) {
        console.log('\n🎉 网站运行正常！');
        process.exit(0);
    } else {
        console.log('\n⚠️ 网站可能有问题，请检查！');
        process.exit(1);
    }
}

// 运行主函数
main().catch(error => {
    console.error(`❌ 未捕获的错误: ${error.message}`);
    process.exit(1);
});