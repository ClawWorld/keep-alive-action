#!/usr/bin/env node

/**
 * Vercel 网站保持激活脚本
 * 通过定时访问 Vercel 网站，防止网站因长时间无访问而休眠
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

// 日志文件
const logDir = path.join(__dirname, 'logs');
const logFile = path.join(logDir, `${new Date().toISOString().split('T')[0]}.log`);

// 确保日志目录存在
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

// 日志函数
function log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
    
    console.log(logMessage);
    
    // 写入日志文件
    fs.appendFileSync(logFile, logMessage + '\n');
}

// HTTP/HTTPS 请求函数
function makeRequest(url, retries = 0) {
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
                    timestamp: new Date().toISOString(),
                    responseLength: data.length
                };
                
                resolve(result);
            });
        });

        req.on('error', (error) => {
            const duration = Date.now() - startTime;
            
            if (retries < config.maxRetries) {
                log(`请求失败，重试 ${retries + 1}/${config.maxRetries}: ${error.message}`, 'warning');
                setTimeout(() => {
                    makeRequest(url, retries + 1).then(resolve).catch(reject);
                }, 1000 * (retries + 1)); // 指数退避
            } else {
                reject({
                    success: false,
                    error: error.message,
                    duration: duration,
                    url: url,
                    timestamp: new Date().toISOString()
                });
            }
        });

        req.on('timeout', () => {
            req.destroy();
            const duration = Date.now() - startTime;
            
            if (retries < config.maxRetries) {
                log(`请求超时，重试 ${retries + 1}/${config.maxRetries}`, 'warning');
                setTimeout(() => {
                    makeRequest(url, retries + 1).then(resolve).catch(reject);
                }, 1000 * (retries + 1));
            } else {
                reject({
                    success: false,
                    error: 'Request timeout',
                    duration: duration,
                    url: url,
                    timestamp: new Date().toISOString()
                });
            }
        });

        req.end();
    });
}

// 访问多个 URL
async function visitUrls() {
    const urls = [
        config.websiteUrl,
        `${config.websiteUrl}/start.html`,
        `${config.websiteUrl}/index.html`
    ];
    
    const results = [];
    
    for (const url of urls) {
        try {
            log(`正在访问: ${url}`);
            const result = await makeRequest(url);
            results.push(result);
            
            if (result.success) {
                log(`✅ 访问成功: ${url} (状态码: ${result.statusCode}, 耗时: ${result.duration}ms)`, 'success');
            } else {
                log(`❌ 访问失败: ${url} (状态码: ${result.statusCode}, 耗时: ${result.duration}ms)`, 'error');
            }
        } catch (error) {
            log(`❌ 访问失败: ${url} (错误: ${error.error})`, 'error');
            results.push(error);
        }
    }
    
    return results;
}

// 统计信息
function printStats(results) {
    const successful = results.filter(r => r.success).length;
    const total = results.length;
    const avgDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0) / total;
    
    log(`\n📊 统计信息`);
    log(`========================`);
    log(`总访问次数: ${total}`);
    log(`成功次数: ${successful}`);
    log(`失败次数: ${total - successful}`);
    log(`成功率: ${((successful / total) * 100).toFixed(1)}%`);
    log(`平均响应时间: ${avgDuration.toFixed(0)}ms`);
    log(`========================\n`);
}

// 主函数
async function main() {
    log(`🚀 开始保持 Vercel 网站激活`);
    log(`网站地址: ${config.websiteUrl}`);
    log(`检查间隔: ${config.checkInterval} 分钟`);
    log(`超时时间: ${config.timeout}ms`);
    log(`最大重试: ${config.maxRetries} 次`);
    log(`========================\n`);
    
    try {
        const results = await visitUrls();
        printStats(results);
        
        // 检查是否有失败
        const failed = results.filter(r => !r.success);
        if (failed.length > 0) {
            log(`⚠️ 有 ${failed.length} 个请求失败`, 'warning');
            failed.forEach(f => {
                log(`   - ${f.url}: ${f.error || f.statusCode}`, 'warning');
            });
        } else {
            log(`🎉 所有请求都成功了！`, 'success');
        }
        
        // 保存统计信息
        const statsFile = path.join(logDir, 'stats.json');
        let stats = {
            lastRun: new Date().toISOString(),
            totalRuns: 0,
            totalSuccess: 0,
            totalFailed: 0
        };
        
        // 如果统计文件存在，读取现有数据
        if (fs.existsSync(statsFile)) {
            try {
                const existingStats = JSON.parse(fs.readFileSync(statsFile, 'utf8'));
                stats = {
                    ...stats,
                    ...existingStats
                };
            } catch (error) {
                log(`⚠️ 无法读取统计文件，使用默认值`, 'warning');
            }
        }
        
        // 计算本次运行的成功次数
        const successful = results.filter(r => r.success).length;
        const total = results.length;
        
        // 更新统计信息
        stats.lastRun = new Date().toISOString();
        stats.totalRuns += 1;
        stats.totalSuccess += successful;
        stats.totalFailed += (total - successful);
        
        // 保存统计信息
        fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2));
        
        log(`📊 总计运行次数: ${stats.totalRuns}`);
        log(`📊 总计成功次数: ${stats.totalSuccess}`);
        log(`📊 总计失败次数: ${stats.totalFailed}`);
        log(`📊 成功率: ${((stats.totalSuccess / stats.totalRuns) * 100).toFixed(1)}%`);
        
    } catch (error) {
        log(`❌ 严重错误: ${error.message}`, 'error');
        process.exit(1);
    }
}

// 运行主函数
main().catch(error => {
    log(`❌ 未捕获的错误: ${error.message}`, 'error');
    process.exit(1);
});