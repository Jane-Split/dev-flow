#!/usr/bin/env node

/**
 * dev-flow 前后端分离架构测试
 *
 * 验证前后端分离变更的完整性和一致性。
 * 运行: node tests/frontend-backend-split.test.js
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');
const CORE_DIR = path.join(ROOT, 'skill-templates', '_core');
const PLATFORMS = ['trae', 'cursor', 'claude', 'qoder', 'codex'];

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

function readFile(relativePath) {
  const fullPath = path.join(ROOT, relativePath);
  if (!fs.existsSync(fullPath)) return null;
  return fs.readFileSync(fullPath, 'utf-8');
}

console.log('=== 前后端分离架构测试 ===\n');

// ============================================================
// 1. 新增文件存在性检查
// ============================================================
console.log('1. 新增文件存在性检查');

const newCoreFiles = [
  'skill-templates/_core/agents/backend-develop-expert.md',
  'skill-templates/_core/agents/frontend-develop-expert.md',
];

for (const file of newCoreFiles) {
  const exists = fs.existsSync(path.join(ROOT, file));
  assert(exists, `核心文件存在: ${file}`);
}

// ============================================================
// 2. 旧文件已删除检查
// ============================================================
console.log('\n2. 旧文件已删除检查');

const deletedFiles = [
  'skill-templates/_core/agents/develop-expert.md',
  'skill-templates/trae/agents/develop-expert.md',
  'skill-templates/cursor/agents/develop-expert.md',
  'skill-templates/claude/agents/develop-expert.md',
  'skill-templates/qoder/agents/develop-expert.md',
  'skill-templates/codex/agents/develop-expert.md',
];

for (const file of deletedFiles) {
  const exists = fs.existsSync(path.join(ROOT, file));
  assert(!exists, `旧文件已删除: ${file}`);
}

// ============================================================
// 3. 平台模板同步检查
// ============================================================
console.log('\n3. 平台模板同步检查');

for (const platform of PLATFORMS) {
  const backendPath = path.join(ROOT, 'skill-templates', platform, 'agents', 'backend-develop-expert.md');
  const frontendPath = path.join(ROOT, 'skill-templates', platform, 'agents', 'frontend-develop-expert.md');
  const taskSplitPath = path.join(ROOT, 'skill-templates', platform, 'agents', 'task-split-expert.md');

  assert(fs.existsSync(backendPath), `${platform}: backend-develop-expert.md 存在`);
  assert(fs.existsSync(frontendPath), `${platform}: frontend-develop-expert.md 存在`);
  assert(fs.existsSync(taskSplitPath), `${platform}: task-split-expert.md 存在`);
}

// Codex 特有 toml 文件
const codexBackendToml = path.join(ROOT, 'skill-templates', 'codex', 'agents', 'backend-develop-expert.toml');
const codexFrontendToml = path.join(ROOT, 'skill-templates', 'codex', 'agents', 'frontend-develop-expert.toml');
assert(fs.existsSync(codexBackendToml), 'codex: backend-develop-expert.toml 存在');
assert(fs.existsSync(codexFrontendToml), 'codex: frontend-develop-expert.toml 存在');

// ============================================================
// 4. backend-develop-expert.md 内容完整性
// ============================================================
console.log('\n4. backend-develop-expert.md 内容完整性');

const backendExpert = readFile('skill-templates/_core/agents/backend-develop-expert.md');
if (backendExpert) {
  assert(backendExpert.includes('name: backend-develop-expert'), 'frontmatter name 正确');
  assert(backendExpert.includes('后端开发专家'), '标题包含"后端开发专家"');
  assert(backendExpert.includes('禁止事项'), '包含禁止事项');
  assert(backendExpert.includes('代码完整性铁律'), '包含代码完整性铁律');
  assert(backendExpert.includes('业务代码优先铁律'), '包含业务代码优先铁律');
  assert(backendExpert.includes('Step 2.5'), '包含 Step 2.5 强制读取验证');
  assert(backendExpert.includes('Step 3.5'), '包含 Step 3.5 完整性防线');
  assert(backendExpert.includes('分段生成协议'), '包含分段生成协议');
  assert(backendExpert.includes('domain: backend'), 'develop-result.yaml 包含 domain: backend');
  assert(backendExpert.includes('backend/conventions.md'), '必读文件包含 backend/conventions.md');
  assert(backendExpert.includes('backend/apis.md'), '必读文件包含 backend/apis.md');
} else {
  failed += 10;
  console.log('  ❌ backend-develop-expert.md 不存在，跳过内容检查');
}

// ============================================================
// 5. frontend-develop-expert.md 内容完整性
// ============================================================
console.log('\n5. frontend-develop-expert.md 内容完整性');

const frontendExpert = readFile('skill-templates/_core/agents/frontend-develop-expert.md');
if (frontendExpert) {
  assert(frontendExpert.includes('name: frontend-develop-expert'), 'frontmatter name 正确');
  assert(frontendExpert.includes('前端开发专家'), '标题包含"前端开发专家"');
  assert(frontendExpert.includes('禁止事项'), '包含禁止事项');
  assert(frontendExpert.includes('代码完整性铁律'), '包含代码完整性铁律');
  assert(frontendExpert.includes('业务代码优先铁律'), '包含业务代码优先铁律');
  assert(frontendExpert.includes('Step 2.5'), '包含 Step 2.5 强制读取验证');
  assert(frontendExpert.includes('Step 3.5'), '包含 Step 3.5 完整性防线');
  assert(frontendExpert.includes('分段生成协议'), '包含分段生成协议');
  assert(frontendExpert.includes('domain: frontend'), 'develop-result.yaml 包含 domain: frontend');
  assert(frontendExpert.includes('data-testid'), '包含 data-testid 规范');
  assert(frontendExpert.includes('frontend/conventions.md'), '必读文件包含 frontend/conventions.md');
  assert(frontendExpert.includes('frontend/components.md'), '必读文件包含 frontend/components.md');
  assert(frontendExpert.includes('frontend/apis.md'), '必读文件包含 frontend/apis.md');
  // 工具集与后端完全一致
  assert(frontendExpert.includes('tools: Read, Write, Edit, Bash, Grep, Glob'), '工具集与后端一致');
} else {
  failed += 13;
  console.log('  ❌ frontend-develop-expert.md 不存在，跳过内容检查');
}

// ============================================================
// 6. research.md 前后端分离内容检查
// ============================================================
console.log('\n6. research.md 前后端分离内容检查');

const researchMd = readFile('skill-templates/_core/stages/research.md');
if (researchMd) {
  assert(researchMd.includes('Step P1.5'), '包含 Step P1.5 前后端存在性检测');
  assert(researchMd.includes('project-domains.yaml'), '包含 project-domains.yaml');
  assert(researchMd.includes('backend-file-index.yaml'), '包含 backend-file-index.yaml');
  assert(researchMd.includes('frontend-file-index.yaml'), '包含 frontend-file-index.yaml');
  assert(researchMd.includes('前端扫描组'), '包含前端扫描组');
  assert(researchMd.includes('frontend-overview'), '包含 frontend-overview 子代理');
  assert(researchMd.includes('components') && researchMd.includes('Batch 2'), '包含 components 子代理');
  assert(researchMd.includes('routes-and-state'), '包含 routes-and-state 子代理');
  assert(researchMd.includes('frontend-apis'), '包含 frontend-apis 子代理');
  assert(researchMd.includes('frontend-conventions'), '包含 frontend-conventions 子代理');
  assert(researchMd.includes('纯前端项目'), '包含纯前端项目自检');
  assert(researchMd.includes('全栈'), '包含全栈项目自检');
  // 后端扫描组未被削弱
  assert(researchMd.includes('Batch 1 (基础层'), '后端 Batch 1 仍存在');
  assert(researchMd.includes('Batch 2 (数据层'), '后端 Batch 2 仍存在');
  assert(researchMd.includes('Batch 3 (行为层'), '后端 Batch 3 仍存在');
  assert(researchMd.includes('Batch 4 (横切层'), '后端 Batch 4 仍存在');
  assert(researchMd.includes('project-overview-subagent'), '后端 project-overview-subagent 仍存在');
  assert(researchMd.includes('service-registry-subagent'), '后端 service-registry-subagent 仍存在');
  assert(researchMd.includes('dependency-graph-subagent'), '后端 dependency-graph-subagent 仍存在');
  assert(researchMd.includes('decisions-subagent'), '后端 decisions-subagent 仍存在');
} else {
  failed += 19;
  console.log('  ❌ research.md 不存在，跳过内容检查');
}

// ============================================================
// 7. develop.md 域路由内容检查
// ============================================================
console.log('\n7. develop.md 域路由内容检查');

const developMd = readFile('skill-templates/_core/stages/develop.md');
if (developMd) {
  assert(developMd.includes('域路由'), '包含域路由');
  assert(developMd.includes('backend-develop-expert'), '包含 backend-develop-expert');
  assert(developMd.includes('frontend-develop-expert'), '包含 frontend-develop-expert');
  assert(developMd.includes('domain'), '包含 domain 字段说明');
  assert(developMd.includes('跨域 API 调用'), '包含跨域 API 调用检查项');
} else {
  failed += 5;
  console.log('  ❌ develop.md 不存在，跳过内容检查');
}

// ============================================================
// 8. task-split domain 标签检查
// ============================================================
console.log('\n8. task-split domain 标签检查');

const taskSplitMd = readFile('skill-templates/_core/stages/task-split.md');
if (taskSplitMd) {
  assert(taskSplitMd.includes('domain'), '包含 domain 字段');
  assert(taskSplitMd.includes('frontend') || taskSplitMd.includes('backend'), '包含 frontend/backend 域定义');
  assert(taskSplitMd.includes('域(domain)'), '任务清单包含域列');
} else {
  failed += 3;
  console.log('  ❌ task-split.md 不存在，跳过内容检查');
}

const taskSplitExpert = readFile('skill-templates/_core/agents/task-split-expert.md');
if (taskSplitExpert) {
  assert(taskSplitExpert.includes('domain'), 'task-split-expert 包含 domain 字段');
  assert(taskSplitExpert.includes('EntityTask') && taskSplitExpert.includes('backend'), 'EntityTask 标记为 backend');
  assert(taskSplitExpert.includes('ComponentTask') || taskSplitExpert.includes('PageTask'), '包含前端任务类型');
} else {
  failed += 3;
  console.log('  ❌ task-split-expert.md 不存在，跳过内容检查');
}

// ============================================================
// 9. SKILL.md 架构更新检查
// ============================================================
console.log('\n9. SKILL.md 架构更新检查');

const skillMd = readFile('skill-templates/_core/SKILL.md');
if (skillMd) {
  assert(skillMd.includes('backend-develop-expert'), '包含 backend-develop-expert');
  assert(skillMd.includes('frontend-develop-expert'), '包含 frontend-develop-expert');
  assert(skillMd.includes('前端扫描组'), '包含前端扫描组');
  assert(skillMd.includes('后端扫描组'), '包含后端扫描组');
  assert(!skillMd.includes('develop-expert\n') || skillMd.includes('backend-develop-expert'), '旧的 develop-expert 已更新');
} else {
  failed += 5;
  console.log('  ❌ SKILL.md 不存在，跳过内容检查');
}

// ============================================================
// 10. memory-system.md 目录结构检查
// ============================================================
console.log('\n10. memory-system.md 目录结构检查');

const memoryMd = readFile('skill-templates/_core/references/memory-system.md');
if (memoryMd) {
  assert(memoryMd.includes('frontend/'), '包含 frontend/ 目录');
  assert(memoryMd.includes('backend/'), '包含 backend/ 目录');
  assert(memoryMd.includes('frontend/conventions'), '包含 frontend/conventions');
  assert(memoryMd.includes('frontend/components'), '包含 frontend/components');
  assert(memoryMd.includes('frontend/apis'), '包含 frontend/apis');
  assert(memoryMd.includes('backend/conventions'), '包含 backend/conventions');
  assert(memoryMd.includes('backend/apis'), '包含 backend/apis');
} else {
  failed += 7;
  console.log('  ❌ memory-system.md 不存在，跳过内容检查');
}

// ============================================================
// 11. 辅助文件引用更新检查
// ============================================================
console.log('\n11. 辅助文件引用更新检查');

const auxiliaryFiles = [
  'skill-templates/_core/agents/orchestrator.md',
  'skill-templates/_core/agents/task-protocol.md',
  'skill-templates/_core/agents/step-enforcer.md',
  'skill-templates/_core/agents/context-manager.md',
];

for (const file of auxiliaryFiles) {
  const content = readFile(file);
  if (content) {
    // 不应存在独立的 develop-expert 引用（非 backend-develop-expert 或 frontend-develop-expert）
    const hasStandaloneRef = /\bdevelop-expert\b(?!-)/.test(content) &&
      !content.includes('backend-develop-expert') &&
      !content.includes('frontend-develop-expert');
    assert(!hasStandaloneRef, `${path.basename(file)}: 无独立 develop-expert 引用`);
  }
}

// ============================================================
// 12. 后端能力零削弱检查
// ============================================================
console.log('\n12. 后端能力零削弱检查');

if (backendExpert) {
  // 检查后端专家保留所有关键能力
  const criticalCapabilities = [
    '禁止事项',
    '代码完整性铁律',
    '业务代码优先铁律',
    'Step 2.5',
    'Step 3.5',
    '编译验证',
    '单元测试',
    '逻辑回溯验证',
    '分段生成协议',
    'data-testid',
  ];

  for (const cap of criticalCapabilities) {
    assert(backendExpert.includes(cap), `后端专家保留: ${cap}`);
  }
}

// 检查 research.md 后端扫描子代理数量
if (researchMd) {
  const backendSubagents = [
    'project-overview-subagent',
    'service-registry-subagent',
    'architecture-subagent',
    'common-modules-subagent',
    'models-subagent',
    'config-subagent',
    'apis-subagent',
    'utils-subagent',
    'conventions-subagent',
    'dependency-graph-subagent',
    'decisions-subagent',
  ];

  for (const sub of backendSubagents) {
    assert(researchMd.includes(sub), `后端扫描子代理保留: ${sub}`);
  }
}

// ============================================================
// 13. 前端专家工具集与后端一致检查
// ============================================================
console.log('\n13. 前后端专家工具集一致性检查');

if (backendExpert && frontendExpert) {
  const backendToolsMatch = backendExpert.match(/tools:\s*(.+)/);
  const frontendToolsMatch = frontendExpert.match(/tools:\s*(.+)/);
  if (backendToolsMatch && frontendToolsMatch) {
    assert(backendToolsMatch[1] === frontendToolsMatch[1], '前后端专家工具集完全一致');
  } else {
    failed++;
    console.log('  ❌ 无法提取工具集定义');
  }
}

// ============================================================
// 总结
// ============================================================
console.log(`\n=== 测试结果: ${passed} 通过, ${failed} 失败 ===`);
process.exit(failed > 0 ? 1 : 0);
