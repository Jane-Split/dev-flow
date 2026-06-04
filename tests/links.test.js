/**
 * dev-flow 链接有效性检查
 * 运行: node tests/links.test.js
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

console.log('=== 链接有效性检查 ===\n');

// 1. 检查 README.md 中的链接
console.log('1. README.md 链接检查');
const readmePath = join(ROOT, 'README.md');
if (existsSync(readmePath)) {
  const readme = readFileSync(readmePath, 'utf-8');
  
  // 检查锚点链接
  const anchorLinks = readme.match(/\[([^\]]+)\]\(#([^)]+)\)/g) || [];
  console.log(`  找到 ${anchorLinks.length} 个锚点链接`);
  
  // 检查相对路径链接
  const relativeLinks = readme.match(/\[([^\]]+)\]\(([^#http][^)]+)\)/g) || [];
  for (const link of relativeLinks) {
    const match = link.match(/\(([^)]+)\)/);
    if (match) {
      const filePath = match[1].split('#')[0];
      const fullPath = join(ROOT, filePath);
      const exists = existsSync(fullPath);
      assert(exists, `README 链接有效: ${filePath}`);
    }
  }
}

// 2. 检查 SKILL.md 中的文件引用
console.log('\n2. SKILL.md 文件引用检查');
const skillPath = join(ROOT, 'skill-templates/_core/SKILL.md');
if (existsSync(skillPath)) {
  const skill = readFileSync(skillPath, 'utf-8');
  
  // 检查 {{STAGES_PATH}} 引用
  const stagesRefs = skill.match(/\{\{STAGES_PATH\}\}[^)\s]*/g) || [];
  assert(stagesRefs.length > 0, `SKILL.md 包含 {{STAGES_PATH}} 引用: ${stagesRefs.length} 处`);
  
  // 检查 {{AGENTS_PATH}} 引用
  const agentsRefs = skill.match(/\{\{AGENTS_PATH\}\}[^)\s]*/g) || [];
  assert(agentsRefs.length > 0, `SKILL.md 包含 {{AGENTS_PATH}} 引用: ${agentsRefs.length} 处`);
  
  // 检查 {{REFERENCES_PATH}} 引用
  const refRefs = skill.match(/\{\{REFERENCES_PATH\}\}[^)\s]*/g) || [];
  assert(refRefs.length > 0, `SKILL.md 包含 {{REFERENCES_PATH}} 引用: ${refRefs.length} 处`);
}

// 3. 检查 references 文件中的交叉引用
console.log('\n3. References 交叉引用检查');
const refsDir = join(ROOT, 'skill-templates/_core/references');
if (existsSync(refsDir)) {
  const { readdirSync } = await import('node:fs');
  const refFiles = readdirSync(refsDir).filter(f => f.endsWith('.md'));
  
  for (const file of refFiles) {
    const filePath = join(refsDir, file);
    const content = readFileSync(filePath, 'utf-8');
    
    // 检查是否引用了其他 references
    const refsToOthers = content.match(/\{\{REFERENCES_PATH\}\}[^)\s]*/g) || [];
    if (refsToOthers.length > 0) {
      console.log(`  ${file} 引用了 ${refsToOthers.length} 个其他 reference`);
    }
  }
}

// 4. 检查构建输出中的路径
console.log('\n4. 构建输出路径检查');
const platforms = ['trae', 'cursor', 'claude', 'qoder'];
for (const platform of platforms) {
  const skillFile = join(ROOT, 'skill-templates', platform, 
    platform === 'trae' ? 'SKILL.md' : 'dev-flow.md');
  
  if (existsSync(skillFile)) {
    const content = readFileSync(skillFile, 'utf-8');
    
    // 应该包含 references/ 路径
    const hasRefPath = content.includes('references/');
    assert(hasRefPath, `${platform} 输出包含 references/ 路径`);
    
    // 不应该包含 {{REFERENCES_PATH}}
    const hasPlaceholder = content.includes('{{REFERENCES_PATH}}');
    assert(!hasPlaceholder, `${platform} 输出已替换 {{REFERENCES_PATH}} 占位符`);
  }
}

// 总结
console.log(`\n=== 测试结果: ${passed} 通过, ${failed} 失败 ===`);
process.exit(failed > 0 ? 1 : 0);
