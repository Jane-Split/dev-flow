#!/usr/bin/env node

/**
 * dev-flow 测试入口
 * 
 * 运行所有测试套件，汇总结果。
 * 运行: node tests/run-all.js
 */

import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const tests = [
  { name: '构建验证', file: 'build.test.js' },
  { name: '链接有效性', file: 'links.test.js' },
  { name: '文件大小预警', file: 'size-warning.test.js' },
  { name: 'Markdown 格式', file: 'format.test.js' },
];

let totalPassed = 0;
let totalFailed = 0;

console.log('╔══════════════════════════════════════╗');
console.log('║     dev-flow 测试套件                ║');
console.log('╚══════════════════════════════════════╝\n');

for (const test of tests) {
  console.log(`\n>>> 运行: ${test.name} (${test.file})`);
  console.log('─'.repeat(40));
  
  try {
    const output = execSync(`node "${join(__dirname, test.file)}"`, {
      encoding: 'utf-8',
      cwd: join(__dirname, '..'),
      timeout: 30000,
    });
    console.log(output.trim());
    totalPassed++;
  } catch (error) {
    console.log(error.stdout ? error.stdout.trim() : '');
    console.log(error.stderr ? error.stderr.trim() : '');
    totalFailed++;
  }
}

console.log('\n╔══════════════════════════════════════╗');
console.log(`║  测试套件: ${totalPassed} 通过, ${totalFailed} 失败`);
console.log('╚══════════════════════════════════════╝');

process.exit(totalFailed > 0 ? 1 : 0);
