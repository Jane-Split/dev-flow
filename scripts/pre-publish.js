/**
 * dev-flow 发布前检查脚本
 * 
 * 在 npm publish 之前运行，确保版本一致性、构建正确。
 * 使用: node scripts/pre-publish.js
 */

import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');
let hasError = false;

console.log('========================================');
console.log('  dev-flow 发布前检查');
console.log('========================================\n');

function check(name, fn) {
  console.log(`\n>>> ${name}`);
  try {
    fn();
    console.log(`✅ ${name} 通过`);
  } catch (error) {
    console.log(`❌ ${name} 失败: ${error.message}`);
    hasError = true;
  }
}

// 1. 版本号一致性检查
check('版本号一致性', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'));
  const readme = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf-8');
  const changelog = fs.readFileSync(path.join(ROOT, 'CHANGELOG.md'), 'utf-8');
  
  const version = pkg.version;
  if (!readme.includes(version)) {
    throw new Error(`README.md 不包含版本号 ${version}`);
  }
  if (!changelog.includes(`## [${version}]`)) {
    throw new Error(`CHANGELOG.md 不包含版本 ${version}`);
  }
});

// 2. 构建检查
check('构建输出', () => {
  execSync('node scripts/build.cjs', { cwd: ROOT, stdio: 'inherit' });
});

// 3. 构建验证
check('构建验证 (--verify)', () => {
  execSync('node scripts/build.cjs --verify', { cwd: ROOT, stdio: 'inherit' });
});

// 4. 核心文件存在检查
check('核心文件存在', () => {
  const coreFiles = [
    '_core/SKILL.md',
    '_core/agents/analyze-expert.md',
    '_core/agents/context-manager.md',
    '_core/agents/develop-expert.md',
    '_core/agents/design-expert.md',
    '_core/agents/error-pattern-learner.md',
    '_core/agents/structure-analyzer.md',
    '_core/agents/verify-expert.md',
    '_core/agents/orchestrator.md',
    '_core/agents/step-enforcer.md',
    '_core/agents/task-split-expert.md',
    '_core/stages/analyze.md',
    '_core/stages/design.md',
    '_core/stages/develop.md',
    '_core/stages/fix.md',
    '_core/stages/research.md',
    '_core/stages/task-split.md',
    '_core/references/memory-system.md',
    '_core/references/learning-system.md',
    '_core/references/error-pattern-db.md',
    '_core/references/model-context-config.md',
  ];
  
  for (const file of coreFiles) {
    if (!fs.existsSync(path.join(ROOT, 'skill-templates', file))) {
      throw new Error(`核心文件不存在: ${file}`);
    }
  }
});

// 5. 各平台输出检查
check('各平台输出', () => {
  const platforms = ['trae', 'cursor', 'claude', 'qoder', 'codex'];
  for (const platform of platforms) {
    const dir = path.join(ROOT, 'skill-templates', platform);
    if (!fs.existsSync(dir)) {
      throw new Error(`平台目录不存在: ${platform}`);
    }
  }
});

// 6. package.json files 字段检查
check('package.json files 字段', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'));
  const files = pkg.files || [];
  const required = ['skill-templates', 'scripts', 'tests'];
  for (const r of required) {
    if (!files.includes(r)) {
      throw new Error(`files 字段缺少: ${r}`);
    }
  }
});

// 总结
console.log('\n========================================');
if (hasError) {
  console.log('❌ 发布前检查失败，请修复后重试');
  process.exit(1);
} else {
  console.log('✅ 发布前检查全部通过，可以发布！');
  console.log('   运行: npm publish');
  process.exit(0);
}
