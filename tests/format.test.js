/**
 * dev-flow Markdown 格式检查
 * 
 * 检查所有 .md 文件的格式是否正确（frontmatter、标题结构等）。
 * 运行: node tests/format.test.js
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');
const CORE_DIR = path.join(ROOT, 'skill-templates', '_core');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.log(`  ❌ ${message}`);
  }
}

console.log('=== Markdown 格式检查 ===\n');

function checkMarkdownFile(filePath, relativePath) {
  if (!fs.existsSync(filePath)) return;
  
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // SKILL.md 和 agents 需要 frontmatter
  if (relativePath.includes('SKILL.md') || relativePath.includes('agents/')) {
    const hasFrontmatter = content.startsWith('---') && content.indexOf('---', 3) > 0;
    assert(hasFrontmatter, `${relativePath}: 有 YAML frontmatter`);
    
    if (hasFrontmatter) {
      const fmEnd = content.indexOf('---', 3);
      const fm = content.substring(3, fmEnd);
      assert(fm.includes('name:'), `${relativePath}: frontmatter 包含 name 字段`);
    }
  }
}

// 1. SKILL.md
console.log('1. SKILL.md 格式检查');
checkMarkdownFile(path.join(CORE_DIR, 'SKILL.md'), '_core/SKILL.md');

// 2. Stages
console.log('2. Stages 格式检查');
const stagesDir = path.join(CORE_DIR, 'stages');
for (const file of fs.readdirSync(stagesDir).filter(f => f.endsWith('.md'))) {
  checkMarkdownFile(path.join(stagesDir, file), `stages/${file}`);
}

// 3. Agents
console.log('3. Agents 格式检查');
const agentsDir = path.join(CORE_DIR, 'agents');
for (const file of fs.readdirSync(agentsDir).filter(f => f.endsWith('.md'))) {
  checkMarkdownFile(path.join(agentsDir, file), `agents/${file}`);
}

// 4. References
console.log('4. References 格式检查');
const refsDir = path.join(CORE_DIR, 'references');
if (fs.existsSync(refsDir)) {
  for (const file of fs.readdirSync(refsDir).filter(f => f.endsWith('.md'))) {
    checkMarkdownFile(path.join(refsDir, file), `references/${file}`);
  }
}

// 总结
console.log(`\n=== 测试结果: ${passed} 通过, ${failed} 失败 ===`);
process.exit(failed > 0 ? 1 : 0);
