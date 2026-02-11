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
if (!config.websites || !Array.isArray(config.websites) || config.websites.length === 0) {
    console.error('❌ 请在 config.json 中设置正确的 websites 数组');
    process.exit(1);
}

// 验证每个网站配置
config.websites.forEach((site, index) => {
    if (!site.url || site.url === 'https://your-project.vercel.app') {
        console.error(`❌ 网站配置 ${index + 1} 缺少有效的 URL`);
        process.exit(1);
    }
});

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

// 检查单个网站状态
async function checkWebsiteStatus(website) {
    console.log(`\n🌐 检查网站: ${website.name || website.url}`);
    console.log('==================================');
    
    try {
        const result = await makeRequest(website.url);
        
        if (result.success) {
            console.log('✅ 网站状态: 正常');
            console.log(`   状态码: ${result.statusCode}`);
            console.log(`   响应时间: ${result.duration}ms`);
            console.log(`   响应大小: ${result.responseLength} bytes`);
            
            return {
                website: website.name || website.url,
                status: 'online',
                statusCode: result.statusCode,
                responseTime: result.duration,
                responseSize: result.responseLength,
                timestamp: new Date().toISOString(),
                url: website.url
            };
        } else {
            console.log('❌ 网站状态: 离线');
            console.log(`   状态码: ${result.statusCode}`);
            console.log(`   响应时间: ${result.duration}ms`);
            
            return {
                website: website.name || website.url,
                status: 'offline',
                statusCode: result.statusCode,
                responseTime: result.duration,
                timestamp: new Date().toISOString(),
                url: website.url,
                error: result.error
            };
        }
    } catch (error) {
        console.log('❌ 网站状态: 无法访问');
        console.log(`   错误: ${error.error}`);
        console.log(`   响应时间: ${error.duration}ms`);
        
        return {
            website: website.name || website.url,
            status: 'error',
            error: error.error,
            responseTime: error.duration,
            timestamp: new Date().toISOString(),
            url: website.url
        };
    }
}

// 检查所有网站状态
async function checkStatus() {
    console.log('🔍 检查 Vercel 网站状态');
    console.log('==================================');
    console.log(`网站数量: ${config.websites.length}`);
    console.log('==================================\n');
    
    const allStatuses = [];
    
    for (const website of config.websites) {
        const status = await checkWebsiteStatus(website);
        allStatuses.push(status);
    }
    
    // 保存状态
    const statusData = {
        timestamp: new Date().toISOString(),
        websites: allStatuses
    };
    
    fs.writeFileSync(statusFile, JSON.stringify(statusData, null, 2));
    console.log(`\n状态已保存到: ${statusFile}`);
    
    // 检查是否有网站离线
    const offlineWebsites = allStatuses.filter(s => s.status !== 'online');
    if (offlineWebsites.length > 0) {
        console.log(`\n⚠️ 有 ${offlineWebsites.length} 个网站离线:`);
        offlineWebsites.forEach(w => {
            console.log(`   - ${w.website}: ${w.error || w.statusCode}`);
        });
        return false;
    } else {
        console.log(`\n🎉 所有 ${allStatuses.length} 个网站都在线！`);
        return true;
    }
}

// 显示历史状态
function showHistory() {
    if (!fs.existsSync(statusFile)) {
        console.log('暂无历史状态记录');
        return;
    }
    
    try {
        const statusData = JSON.parse(fs.readFileSync(statusFile, 'utf8'));
        console.log('\n📊 历史状态记录');
        console.log('==================================');
        console.log(`时间: ${statusData.timestamp}`);
        console.log(`网站数量: ${statusData.websites.length}`);
        console.log('==================================');
        
        statusData.websites.forEach(website => {
            console.log(`\n🌐 ${website.website}`);
            console.log(`   状态: ${website.status}`);
            console.log(`   时间: ${website.timestamp}`);
            
            if (website.statusCode) {
                console.log(`   状态码: ${website.statusCode}`);
            }
            
            if (website.responseTime) {
                console.log(`   响应时间: ${website.responseTime}ms`);
            }
            
            if (website.error) {
                console.log(`   错误: ${website.error}`);
            }
        });
        
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
        console.log('\n🎉 所有网站运行正常！');
        process.exit(0);
    } else {
        console.log('\n⚠️ 有网站可能有问题，请检查！');
        process.exit(1);
    }
}

// 运行主函数
main().catch(error => {
    console.error(`❌ 未捕获的错误: ${error.message}`);
    process.exit(1);
});