/**
 * dev-flow 文件大小预警测试
 * 
 * 检查关键文件大小是否超过阈值，防止文件膨胀回归。
 * 运行: node tests/size-warning.test.js
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');
const CORE_DIR = path.join(ROOT, 'skill-templates', '_core');

// 大小阈值（字节）
const THRESHOLDS = {
  'SKILL.md': 30 * 1024,       // Router: 25KB
  'stages/*.md': 35 * 1024,    // 单个 stage: 35KB
  'agents/*.md': 35 * 1024,    // 单个 agent: 30KB
  'references/*.md': 20 * 1024, // 单个 reference: 20KB
};

let warnings = 0;

console.log('=== 文件大小预警检查 ===\n');

function formatSize(bytes) {
  return bytes > 1024 ? `${(bytes / 1024).toFixed(1)}KB` : `${bytes}B`;
}

// 1. Router 大小
console.log('1. Router 大小检查');
const skillPath = path.join(CORE_DIR, 'SKILL.md');
if (fs.existsSync(skillPath)) {
  const skillSize = fs.statSync(skillPath).size;
  const skillThreshold = THRESHOLDS['SKILL.md'];
  if (skillSize > skillThreshold) {
    console.log(`  ⚠️  SKILL.md: ${formatSize(skillSize)} (超过 ${formatSize(skillThreshold)} 阈值)`);
    warnings++;
  } else {
    console.log(`  ✅ SKILL.md: ${formatSize(skillSize)} (阈值 ${formatSize(skillThreshold)})`);
  }
} else {
  console.log('  ⚠️  SKILL.md 不存在');
  warnings++;
}

// 2. Stages 大小
console.log('2. Stages 大小检查');
const stagesDir = path.join(CORE_DIR, 'stages');
if (fs.existsSync(stagesDir)) {
  const stageThreshold = THRESHOLDS['stages/*.md'];
  for (const file of fs.readdirSync(stagesDir).filter(f => f.endsWith('.md'))) {
    const size = fs.statSync(path.join(stagesDir, file)).size;
    if (size > stageThreshold) {
      console.log(`  ⚠️  stages/${file}: ${formatSize(size)} (超过 ${formatSize(stageThreshold)} 阈值)`);
      warnings++;
    }
  }
}

// 3. Agents 大小
console.log('3. Agents 大小检查');
const agentsDir = path.join(CORE_DIR, 'agents');
if (fs.existsSync(agentsDir)) {
  const agentThreshold = THRESHOLDS['agents/*.md'];
  for (const file of fs.readdirSync(agentsDir).filter(f => f.endsWith('.md'))) {
    const size = fs.statSync(path.join(agentsDir, file)).size;
    if (size > agentThreshold) {
      console.log(`  ⚠️  agents/${file}: ${formatSize(size)} (超过 ${formatSize(agentThreshold)} 阈值)`);
      warnings++;
    } else if (size > agentThreshold * 0.8) {
      console.log(`  🟡 agents/${file}: ${formatSize(size)} (接近阈值 ${formatSize(agentThreshold)})`);
    }
  }
}

// 4. References 大小
console.log('4. References 大小检查');
const refsDir = path.join(CORE_DIR, 'references');
if (fs.existsSync(refsDir)) {
  const refThreshold = THRESHOLDS['references/*.md'];
  for (const file of fs.readdirSync(refsDir).filter(f => f.endsWith('.md'))) {
    const size = fs.statSync(path.join(refsDir, file)).size;
    if (size > refThreshold) {
      console.log(`  ⚠️  references/${file}: ${formatSize(size)} (超过 ${formatSize(refThreshold)} 阈值)`);
      warnings++;
    }
  }
}

// 总结
console.log(`\n=== 大小预警: ${warnings} 个警告 ===`);
process.exit(warnings > 0 ? 1 : 0);
