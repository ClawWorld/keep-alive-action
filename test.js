#!/usr/bin/env node

/**
 * 测试脚本 - 验证 keep-alive 工具是否正常工作
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

console.log('🧪 测试 Vercel 保持激活工具');
console.log('==================================');
console.log('网站地址: ' + config.websiteUrl);
console.log('==================================\n');

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

// 测试函数
async function runTests() {
    const allResults = [];
    
    console.log('开始测试...\n');
    
    for (const website of config.websites) {
        console.log(`🌐 测试网站: ${website.name || website.url}`);
        console.log('==================================');
        
        const urls = [
            website.url,
            `${website.url}/start.html`,
            `${website.url}/index.html`
        ];
        
        const websiteResults = [];
        
        for (const url of urls) {
            console.log(`测试: ${url}`);
            
            try {
                const result = await makeRequest(url);
                websiteResults.push(result);
                
                if (result.success) {
                    console.log(`✅ 成功: 状态码 ${result.statusCode}, 耗时 ${result.duration}ms, 大小 ${result.responseLength} bytes`);
                } else {
                    console.log(`❌ 失败: 状态码 ${result.statusCode}, 耗时 ${result.duration}ms`);
                }
            } catch (error) {
                console.log(`❌ 失败: ${error.error}`);
                websiteResults.push(error);
            }
            
            console.log('');
        }
        
        allResults.push({
            website: website.name || website.url,
            results: websiteResults
        });
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
    
    console.log('📊 测试结果统计');
    console.log('========================');
    console.log(`总网站数: ${allResults.length}`);
    console.log(`总测试次数: ${totalRequests}`);
    console.log(`成功次数: ${totalSuccessful}`);
    console.log(`失败次数: ${totalFailed}`);
    console.log(`成功率: ${((totalSuccessful / totalRequests) * 100).toFixed(1)}%`);
    console.log(`平均响应时间: ${avgDuration.toFixed(0)}ms`);
    console.log('========================\n');
    
    if (totalSuccessful === totalRequests) {
        console.log('🎉 所有测试都通过了！工具可以正常工作。');
    } else {
        console.log('⚠️ 有测试失败，请检查配置和网络连接。');
    }
}

// 主函数
async function main() {
    try {
        const results = await runTests();
        printStats(results);
        
        // 保存测试结果
        const testResult = {
            timestamp: new Date().toISOString(),
            websiteUrl: config.websiteUrl,
            results: results,
            summary: {
                total: results.length,
                successful: results.filter(r => r.success).length,
                failed: results.filter(r => !r.success).length
            }
        };
        
        const testResultFile = path.join(__dirname, 'test-results.json');
        fs.writeFileSync(testResultFile, JSON.stringify(testResult, null, 2));
        
        console.log(`测试结果已保存到: ${testResultFile}`);
        
    } catch (error) {
        console.error(`❌ 严重错误: ${error.message}`);
        process.exit(1);
    }
}

// 运行主函数
main().catch(error => {
    console.error(`❌ 未捕获的错误: ${error.message}`);
    process.exit(1);
});