/**
 * dev-flow 构建验证测试
 * 运行: node tests/build.test.js
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✅ ${message}`);
  } else {
    failed++;
    console.log(`  ❌ ${message}`);
  }
}

console.log('=== 构建验证测试 ===\n');

// 1. 检查核心文件是否存在
console.log('1. 核心文件检查');
const coreFiles = [
  'skill-templates/_core/SKILL.md',
  'skill-templates/_core/references/memory-system.md',
  'skill-templates/_core/references/learning-system.md',
  'skill-templates/_core/references/error-pattern-db.md',
  'skill-templates/_core/references/model-context-config.md',
];

for (const file of coreFiles) {
  const exists = existsSync(join(ROOT, file));
  assert(exists, `核心文件存在: ${file}`);
}

// 2. 检查构建输出目录
console.log('\n2. 构建输出检查');
const platforms = ['trae', 'cursor', 'claude', 'qoder', 'codex'];
for (const platform of platforms) {
  const dir = join(ROOT, 'skill-templates', platform);
  const exists = existsSync(dir);
  assert(exists, `平台目录存在: ${platform}`);
}

// 3. 检查 SKILL.md 大小（应该 < 30KB）
console.log('\n3. Router 大小检查');
const skillMd = join(ROOT, 'skill-templates/_core/SKILL.md');
if (existsSync(skillMd)) {
  const stats = readFileSync(skillMd, 'utf-8');
  const size = new Blob([stats]).size;
  assert(size < 35000, `SKILL.md 大小合理: ${Math.round(size/1024)}KB (< 35KB)`);
}

// 4. 检查 references 目录
console.log('\n4. References 目录检查');
const refsDir = join(ROOT, 'skill-templates/_core/references');
const exists = existsSync(refsDir);
assert(exists, 'references 目录存在');

if (exists) {
  const { readdirSync } = await import('node:fs');
  const refFiles = readdirSync(refsDir).filter(f => f.endsWith('.md'));
  assert(refFiles.length >= 4, `references 文件数量足够: ${refFiles.length} 个`);
}

// 5. 检查 {{REFERENCES_PATH}} 占位符是否正确替换
console.log('\n5. 占位符替换检查');
const traeSkill = join(ROOT, 'skill-templates/trae/SKILL.md');
if (existsSync(traeSkill)) {
  const content = readFileSync(traeSkill, 'utf-8');
  const hasRef = content.includes('references/');
  assert(hasRef, 'Trae SKILL.md 包含 references/ 路径');
}

// 总结
console.log(`\n=== 测试结果: ${passed} 通过, ${failed} 失败 ===`);
process.exit(failed > 0 ? 1 : 0);
