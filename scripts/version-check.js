#!/usr/bin/env node

/**
 * dev-flow 版本号一致性检查脚本
 * 
 * 从 package.json 读取版本号，校验 README.md 和 CHANGELOG.md 中的版本号是否一致。
 * 
 * 用法：
 *   node scripts/version-check.js          # 校验版本号一致性
 *   node scripts/version-check.js --fix    # 自动修复 README.md 中的版本号
 * 
 * 零依赖，仅需 Node.js。
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

// 读取 package.json 版本号（单一真相源）
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'));
const pkgVersion = pkg.version;

console.log(`package.json 版本: v${pkgVersion}\n`);

let hasError = false;

// 1. 检查 README.md 版本徽章
const readmePath = join(ROOT, 'README.md');
if (existsSync(readmePath)) {
  const readme = readFileSync(readmePath, 'utf-8');
  
  const badgeMatch = readme.match(/badge\/version-v([\d.]+)/);
  if (badgeMatch) {
    const readmeVersion = badgeMatch[1];
    if (readmeVersion !== pkgVersion) {
      console.log(`❌ README.md 徽章版本不一致: v${readmeVersion} (期望 v${pkgVersion})`);
      hasError = true;
    } else {
      console.log(`✅ README.md 徽章版本一致: v${readmeVersion}`);
    }
  } else {
    console.log('⚠️  README.md 未找到版本徽章');
  }
  
  const textMatch = readme.match(/\*\*当前版本:\s*v([\d.]+)\*\*/);
  if (textMatch) {
    const textVersion = textMatch[1];
    if (textVersion !== pkgVersion) {
      console.log(`❌ README.md 文本版本不一致: v${textVersion} (期望 v${pkgVersion})`);
      hasError = true;
    } else {
      console.log(`✅ README.md 文本版本一致: v${textVersion}`);
    }
  }
} else {
  console.log('⚠️  README.md 不存在');
}

// 2. 检查 CHANGELOG.md 最新版本
const changelogPath = join(ROOT, 'CHANGELOG.md');
if (existsSync(changelogPath)) {
  const changelog = readFileSync(changelogPath, 'utf-8');
  const changelogMatch = changelog.match(/##\s*\[([\d.]+)\]/);
  if (changelogMatch) {
    const changelogVersion = changelogMatch[1];
    if (changelogVersion !== pkgVersion) {
      console.log(`⚠️  CHANGELOG.md 最新版本: v${changelogVersion} (package.json 为 v${pkgVersion}，如刚发布则正常)`);
    } else {
      console.log(`✅ CHANGELOG.md 最新版本一致: v${changelogVersion}`);
    }
  }
} else {
  console.log('⚠️  CHANGELOG.md 不存在');
}

// --fix 模式（必须在 process.exit 之前执行）
if (process.argv.includes('--fix')) {
  console.log('\n🔧 修复模式...');
  
  if (existsSync(readmePath)) {
    let readme = readFileSync(readmePath, 'utf-8');
    
    readme = readme.replace(
      /badge\/version-v[\d.]+/,
      `badge/version-v${pkgVersion}`
    );
    
    readme = readme.replace(
      /\*\*当前版本:\s*v[\d.]+\*\*/,
      `**当前版本: v${pkgVersion}**`
    );
    
    writeFileSync(readmePath, readme, 'utf-8');
    console.log(`✅ README.md 版本号已更新为 v${pkgVersion}`);
  }
}

// 总结
console.log('');
if (hasError) {
  console.error('❌ 版本号不一致！请运行 node scripts/version-check.js --fix 自动修复 README.md');
  process.exit(1);
} else {
  console.log('✅ 版本号一致性检查通过');
}
