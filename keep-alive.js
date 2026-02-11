#!/usr/bin/env node

/**
 * Vercel 网站保持激活脚本
 * 通过定时访问 Vercel 网站，防止网站因长时间无访问而休眠
 * 支持多个网站配置
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
function makeRequest(url, retries = 0, timeout = 10000, userAgent = '') {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        const options = {
            method: 'GET',
            timeout: timeout,
            headers: {
                'User-Agent': userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
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
            
            if (retries < config.global.maxRetries) {
                log(`请求失败，重试 ${retries + 1}/${config.global.maxRetries}: ${error.message}`, 'warning');
                setTimeout(() => {
                    makeRequest(url, retries + 1, timeout, userAgent).then(resolve).catch(reject);
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
            
            if (retries < config.global.maxRetries) {
                log(`请求超时，重试 ${retries + 1}/${config.global.maxRetries}`, 'warning');
                setTimeout(() => {
                    makeRequest(url, retries + 1, timeout, userAgent).then(resolve).catch(reject);
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

// 访问单个网站的所有页面
async function visitWebsite(website) {
    // 使用网站特定配置或全局配置
    const timeout = website.timeout || config.global.timeout;
    const userAgent = website.userAgent || config.global.userAgent;
    const maxRetries = website.maxRetries || config.global.maxRetries;
    
    const urls = [
        website.url,
        `${website.url}/start.html`,
        `${website.url}/index.html`
    ];
    
    const results = [];
    
    for (const url of urls) {
        try {
            log(`正在访问: ${url}`);
            const result = await makeRequest(url, 0, timeout, userAgent);
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

// 访问所有网站
async function visitAllWebsites() {
    const allResults = [];
    
    for (const website of config.websites) {
        log(`\n🌐 正在检查网站: ${website.name || website.url}`);
        log(`==================================`);
        
        const websiteResults = await visitWebsite(website);
        allResults.push({
            website: website.name || website.url,
            results: websiteResults
        });
        
        // 打印单个网站的统计
        const successful = websiteResults.filter(r => r.success).length;
        const total = websiteResults.length;
        const avgDuration = websiteResults.reduce((sum, r) => sum + (r.duration || 0), 0) / total;
        
        log(`📊 ${website.name || website.url} 统计: ${successful}/${total} 成功, 平均 ${avgDuration.toFixed(0)}ms`);
    }
    
    return allResults;
}

// 统计信息
function printStats(allResults) {
    let totalSuccessful = 0;
    let totalFailed = 0;
    let totalRequests = 0;
    let totalDuration = 0;
    
    allResults.forEach(websiteResult => {
        const successful = websiteResult.results.filter(r => r.success).length;
        const failed = websiteResult.results.filter(r => !r.success).length;
        const total = websiteResult.results.length;
        const avgDuration = websiteResult.results.reduce((sum, r) => sum + (r.duration || 0), 0) / total;
        
        totalSuccessful += successful;
        totalFailed += failed;
        totalRequests += total;
        totalDuration += avgDuration * total;
    });
    
    const avgDuration = totalRequests > 0 ? totalDuration / totalRequests : 0;
    
    log(`\n📊 统计信息`);
    log(`========================`);
    log(`总网站数: ${allResults.length}`);
    log(`总访问次数: ${totalRequests}`);
    log(`成功次数: ${totalSuccessful}`);
    log(`失败次数: ${totalFailed}`);
    log(`成功率: ${((totalSuccessful / totalRequests) * 100).toFixed(1)}%`);
    log(`平均响应时间: ${avgDuration.toFixed(0)}ms`);
    log(`========================\n`);
}

// 保存统计信息
function saveStats(allResults) {
    const statsFile = path.join(logDir, 'stats.json');
    let stats = {
        lastRun: new Date().toISOString(),
        totalRuns: 0,
        totalSuccess: 0,
        totalFailed: 0,
        websites: {}
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
    let totalSuccessful = 0;
    let totalFailed = 0;
    
    allResults.forEach(websiteResult => {
        const successful = websiteResult.results.filter(r => r.success).length;
        const failed = websiteResult.results.filter(r => !r.success).length;
        
        totalSuccessful += successful;
        totalFailed += failed;
        
        // 更新单个网站的统计
        if (!stats.websites[websiteResult.website]) {
            stats.websites[websiteResult.website] = {
                totalRuns: 0,
                totalSuccess: 0,
                totalFailed: 0
            };
        }
        
        stats.websites[websiteResult.website].totalRuns += 1;
        stats.websites[websiteResult.website].totalSuccess += successful;
        stats.websites[websiteResult.website].totalFailed += failed;
    });
    
    // 更新全局统计信息
    stats.lastRun = new Date().toISOString();
    stats.totalRuns += 1;
    stats.totalSuccess += totalSuccessful;
    stats.totalFailed += totalFailed;
    
    // 保存统计信息
    fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2));
    
    log(`📊 总计运行次数: ${stats.totalRuns}`);
    log(`📊 总计成功次数: ${stats.totalSuccess}`);
    log(`📊 总计失败次数: ${stats.totalFailed}`);
    log(`📊 成功率: ${((stats.totalSuccess / stats.totalRuns) * 100).toFixed(1)}%`);
    
    // 打印单个网站的统计
    log(`\n📊 单个网站统计:`);
    Object.keys(stats.websites).forEach(website => {
        const siteStats = stats.websites[website];
        const rate = siteStats.totalRuns > 0 ? ((siteStats.totalSuccess / siteStats.totalRuns) * 100).toFixed(1) : 0;
        log(`   ${website}: ${siteStats.totalSuccess}/${siteStats.totalRuns} 成功 (${rate}%)`);
    });
}

// 主函数
async function main() {
    log(`🚀 开始保持 Vercel 网站激活`);
    log(`网站数量: ${config.websites.length}`);
    log(`检查间隔: ${config.global.checkInterval} 分钟`);
    log(`超时时间: ${config.global.timeout}ms`);
    log(`最大重试: ${config.global.maxRetries} 次`);
    log(`========================\n`);
    
    try {
        const allResults = await visitAllWebsites();
        printStats(allResults);
        
        // 检查是否有失败
        let totalFailed = 0;
        allResults.forEach(websiteResult => {
            const failed = websiteResult.results.filter(r => !r.success);
            if (failed.length > 0) {
                totalFailed += failed.length;
                log(`⚠️ ${websiteResult.website} 有 ${failed.length} 个请求失败`, 'warning');
                failed.forEach(f => {
                    log(`   - ${f.url}: ${f.error || f.statusCode}`, 'warning');
                });
            }
        });
        
        if (totalFailed === 0) {
            log(`🎉 所有网站的所有请求都成功了！`, 'success');
        }
        
        // 保存统计信息
        saveStats(allResults);
        
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