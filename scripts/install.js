#!/usr/bin/env node

import { appendFileSync, cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const PROJECT_ROOT = process.cwd();

const SKILL_FILES = {
  trae: { src: 'skill-templates/trae/SKILL.md', dest: '.trae/skills/dev-flow/SKILL.md' },
  cursor: { src: 'skill-templates/cursor/dev-flow.md', dest: '.cursor/commands/dev-flow.md' },
  qoder: { src: 'skill-templates/qoder/dev-flow.md', dest: '.qoder/commands/dev-flow.md' },
  claude: { src: 'skill-templates/claude/dev-flow.md', dest: '.claude/commands/dev-flow.md' },
  codex: { src: 'skill-templates/codex/AGENTS.md', dest: 'AGENTS.md' },
};

const CODEX_EXTRA_FILES = [
  { src: 'skill-templates/codex/skills/dev-flow/SKILL.md', dest: '.agents/skills/dev-flow/SKILL.md' },
  { src: 'skill-templates/codex/config.toml', dest: '.codex/config.toml', optional: true },
];

// Subagent 定义文件（按工具适配安装路径）
const AGENT_FILES = [
  'orchestrator.md',
  'research-expert.md',
  'analyze-expert.md',
  'clarify-expert.md',
  'design-expert.md',
  'develop-expert.md',
  'verify-expert.md',
  'task-protocol.md',
  'dependency-scanner.md',
  'service-scanner.md',
  'service-orchestrator.md',
  'structure-analyzer.md',
  'config-analyzer.md',
  'on-demand-loader.md',
  'runtime-state-manager.md',
  'delivery.md',
  // 防护 agents（从 Trae-only 提升为全平台共享）
  'step-enforcer.md',
  'contract-validator.md',
  'db-verifier.md',
  'bytecode-analyzer.md',
  'design-contract-validator.md',
  'e2e-ui-tester.md',
  'context-manager.md',
  'error-pattern-learner.md',
  'fix-expert.md',
  'task-split-expert.md',
  'test-expert.md',
  'delivery-expert.md',
  'integration-test.md',
  'smoke-test.md',
];

// 阶段指令文件（按需加载，不随 SKILL.md 一起注入上下文）
const STAGE_FILES = [
  'research.md',
  'analyze.md',
  'clarify.md',
  'design.md',
  'task-split.md',
  'develop.md',
  'test.md',
  'fix.md',
  'hotfix.md',
  'delivery.md',
  'code-reference.md',
];

const CODEX_AGENT_FILES = AGENT_FILES.map((file) => file.replace(/\.md$/, '.toml'));

const AGENT_DEST_MAP = {
  trae: '.trae/skills/dev-flow/agents/',
  cursor: '.cursor/agents/',
  qoder: '.qoder/agents/',
  claude: '.claude/agents/',
  codex: '.codex/agents/',
};

const STAGE_DEST_MAP = {
  trae: '.trae/skills/dev-flow/stages/',
  cursor: '.cursor/stages/',
  qoder: '.qoder/stages/',
  claude: '.claude/stages/',
  codex: '.codex/stages/',
};

const REFERENCE_DEST_MAP = {
  trae: '.trae/skills/dev-flow/references/',
  cursor: '.cursor/references/',
  qoder: '.qoder/references/',
  claude: '.claude/references/',
  codex: '.codex/references/',
};

const TOOL_ALIASES = {
  install: 'all',
  all: 'all',
  trae: 'trae',
  cursor: 'cursor',
  qoder: 'qoder',
  claude: 'claude',
  codex: 'codex',
};

// ============================================================
// 记忆文件定义（v4.0 — 前后端分离）
// 共享文件：project-overview.md（根目录唯一共享）
// 后端文件：全部在 backend/ 子目录下
// 前端文件：全部在 frontend/ 子目录下
// ============================================================

// 根目录共享记忆（所有项目类型）
const SHARED_MEMORY_FILES = [
  'project-overview.md',
];

// 后端记忆 — 全部放入 backend/ 子目录
const BACKEND_MEMORY_FILES = [
  'conventions.md',
  'patterns.md',
  'mistakes.md',
  'decisions.md',
  'preferences.md',
  'service-registry.md',
  'dependency-graph.md',
  'common-modules.md',
];

// 后端会话记忆 — 放入 backend/session/
const BACKEND_SESSION_FILES = [
  'architecture.md',
  'models.md',
  'apis.md',
  'config.md',
  'utils.md',
];

// 前端记忆 — 全部放入 frontend/ 子目录
const FRONTEND_MEMORY_FILES = [
  'conventions.md',
  'patterns.md',
  'mistakes.md',
  'decisions.md',
  'preferences.md',
  'pages.md',
  'components.md',
  'store.md',
  'router.md',
];

// 前端会话记忆 — 放入 frontend/session/
const FRONTEND_SESSION_FILES = [
  'apis.md',
  'types.md',
  'hooks.md',
  'styles.md',
];

const MEMORY_TEMPLATES = {
  'project-overview.md': `# 项目概览

> 由 dev-flow Research 阶段自动填充

## 技术栈
- 语言：
- 框架：
- 数据库：
- 测试：
- 构建：

## 目录结构

## 入口文件
`,
  'conventions.md': `# 编码规范

> 由 dev-flow Research 阶段自动填充

<!-- project_type 决定填充前端或后端规范 -->
`,
  'modules.md': `# 已有模块

> 由 dev-flow Research 阶段自动填充

## Entity

## Mapper

## Service

## Controller

## DTO

## Enum
`,
  'apis.md': `# 已有 API

> 由 dev-flow Research 阶段自动填充

## 端点列表

`,
  'models.md': `# 数据模型

> 由 dev-flow Research 阶段自动填充

## Entity

## DTO

## 数据库表
`,
  'utils.md': `# 工具类/函数

> 由 dev-flow Research 阶段自动填充

`,
  'config.md': `# 配置信息

> 由 dev-flow Research 阶段自动填充

## 数据库配置

## Redis 配置

## 中间件配置
`,
  'architecture.md': `# 架构决策

> 由 dev-flow Research 阶段自动填充

`,
  'patterns.md': `# 常见代码模式

> 由 dev-flow 自动学习积累

## 使用说明
记录项目中反复出现的代码模式，供后续开发复用。

### 模式名称
\`\`\`java
// Java 代码示例
\`\`\`
- 使用场景：描述何时使用
- 添加时间：YYYY-MM-DD
- 使用次数：0
`,
  'mistakes.md': `# 常见错误及修复

> 由 dev-flow 自动学习积累

## 使用说明
记录项目中反复出现的 Bug 及其修复方案。

### 错误名称
**错误模式**：描述错误代码
**修复方案**：描述修复后的代码
**出现次数**：0
**最后出现**：YYYY-MM-DD
**预防措施**：如何避免
`,
  'preferences.md': `# 用户偏好

> 由 dev-flow 自动学习积累

## 使用说明
记录用户的编码偏好和习惯，让 AI 越用越懂用户。

## 代码风格
- 引号：单引号/双引号
- 分号：必须/可选
- 缩进：2空格/4空格/Tab

## 架构偏好
- 状态管理：
- 样式方案：

## 更新历史
`,
  'decisions.md': `# 架构决策记录

> 由 dev-flow 自动记录

## 使用说明
记录项目中的重要架构决策及其原因。

## ADR-XXX：决策标题
**日期**：YYYY-MM-DD
**决策**：描述决策内容
**原因**：
- 原因1
- 原因2
**影响**：影响的文件/模块
`,
  // 微服务模式记忆文件模板
  'service-registry.md': `# 服务注册表

> 由 dev-flow Research 阶段自动填充（微服务模式）

## 服务列表
| 服务名 | 目录 | 端口 | 角色 | 子模块 |
|--------|------|------|------|--------|
| | | | | |

## 跨服务调用关系
| 调用方 | Feign Client | 目标服务 | 方法 |
|--------|-------------|----------|------|
| | | | |
`,
  'dependency-graph.md': `# 服务间依赖图谱

> 由 dev-flow Research 阶段自动填充（微服务模式）

## Maven 依赖关系
| 服务 | 依赖的服务 | 依赖的公共模块 |
|------|-----------|--------------|
| | | |

## Feign 调用关系
| 调用方服务 | 被调用方服务 | Feign Client 接口 | 调用场景 |
|-----------|-------------|-----------------|---------|
| | | | |

## 服务启动顺序
1.
`,
  'common-modules.md': `# 公共模块清单

> 由 dev-flow Research 阶段自动填充（微服务模式）

## 公共模块列表
| 模块名 | 目录 | 说明 |
|--------|------|------|
| | | |

## 通用 Entity
| 类名 | 包路径 | 说明 | 使用服务 |
|------|--------|------|---------|
| | | | |

## 通用 DTO
| 类名 | 包路径 | 说明 | 使用服务 |
|------|--------|------|---------|
| | | | |

## 通用工具类
| 类名 | 包路径 | 说明 | 使用服务 |
|------|--------|------|---------|
| | | | |

## 通用枚举
| 类名 | 包路径 | 说明 | 使用服务 |
|------|--------|------|---------|
| | | | |

## 通用异常类
| 类名 | 包路径 | 说明 | 使用服务 |
|------|--------|------|---------|
| | | | |
`
};

function install(target) {
  target = normalizeTarget(target);

  if (target === 'all' || !target) {
    for (const key of Object.keys(SKILL_FILES)) {
      installSkill(key);
      installAgents(key);
      installStages(key);
      installReferences(key);
    }
  } else {
    installSkill(target);
    installAgents(target);
    installStages(target);
    installReferences(target);
  }
  createMemoryTemplate();
  // detectProjectTypeInfo() is now called inside createMemoryTemplate()
  console.log('\n✅ dev-flow skill 安装完成！');
  console.log('   在 AI 编程工具中输入 /dev-flow <需求> 开始使用');
  console.log('   输入 /dev-flow -subagent <需求> 使用 subagent 并行模式\n');
}

function installSkill(tool) {
  const config = SKILL_FILES[tool];
  if (!config) {
    console.error(`❌ 不支持的工具: ${tool}`);
    console.error(`   支持: ${Object.keys(SKILL_FILES).join(', ')}, all`);
    process.exit(1);
  }

  const src = resolve(ROOT, config.src);
  const dest = resolve(PROJECT_ROOT, config.dest);

  if (!existsSync(src)) {
    console.error(`❌ 源文件不存在: ${src}`);
    return;
  }

  if (tool === 'codex') {
    installCodexAgentsMd(src, dest);
    installCodexExtras();
  } else {
    mkdirSync(dirname(dest), { recursive: true });
    cpSync(src, dest);
    console.log(`✅ ${tool}: ${dest}`);
  }
}

function installAgents(tool) {
  const destDir = AGENT_DEST_MAP[tool];
  if (!destDir) return;

  const agentFiles = tool === 'codex' ? CODEX_AGENT_FILES : AGENT_FILES;
  const agentsSrcDir = resolve(ROOT, `skill-templates/${tool}/agents`);
  const fallbackAgentsSrcDir = resolve(ROOT, 'skill-templates/trae/agents');
  let installedCount = 0;

  for (const file of agentFiles) {
    let src = resolve(agentsSrcDir, file);
    if (!existsSync(src) && tool !== 'codex') {
      src = resolve(fallbackAgentsSrcDir, file);
    }

    const dest = resolve(PROJECT_ROOT, destDir, file);

    if (!existsSync(src)) {
      console.error(`❌ Agent 文件不存在: ${src}`);
      continue;
    }

    mkdirSync(dirname(dest), { recursive: true });
    cpSync(src, dest);
    installedCount += 1;
  }

  console.log(`✅ ${tool} agents: ${destDir} (${installedCount} files)`);
}

function installStages(tool) {
  const destDir = STAGE_DEST_MAP[tool];
  if (!destDir) return;

  const stagesSrcDir = resolve(ROOT, `skill-templates/${tool}/stages`);
  if (!existsSync(stagesSrcDir)) {
    console.log(`ℹ️ ${tool} stages: 源目录不存在，跳过 (${stagesSrcDir})`);
    return;
  }

  let installedCount = 0;
  for (const file of STAGE_FILES) {
    const src = resolve(stagesSrcDir, file);
    if (!existsSync(src)) continue;

    const dest = resolve(PROJECT_ROOT, destDir, file);
    mkdirSync(dirname(dest), { recursive: true });
    cpSync(src, dest);
    installedCount += 1;
  }

  console.log(`✅ ${tool} stages: ${destDir} (${installedCount} files)`);
}

function installReferences(tool) {
  const destDir = REFERENCE_DEST_MAP[tool];
  if (!destDir) return;

  const refsSrcDir = resolve(ROOT, `skill-templates/${tool}/references`);
  if (!existsSync(refsSrcDir)) {
    console.log(`ℹ️ ${tool} references: 源目录不存在，跳过 (${refsSrcDir})`);
    return;
  }

  let installedCount = 0;
  for (const file of readdirSync(refsSrcDir).filter(f => f.endsWith('.md'))) {
    const src = resolve(refsSrcDir, file);
    if (!existsSync(src)) continue;

    const dest = resolve(PROJECT_ROOT, destDir, file);
    mkdirSync(dirname(dest), { recursive: true });
    cpSync(src, dest);
    installedCount += 1;
  }

  console.log(`✅ ${tool} references: ${destDir} (${installedCount} files)`);
}

function installCodexAgentsMd(src, dest) {
  mkdirSync(dirname(dest), { recursive: true });

  if (!existsSync(dest)) {
    cpSync(src, dest);
    console.log(`✅ codex: ${dest}`);
    return;
  }

  const existing = readFileSync(dest, 'utf-8');
  if (existing.includes('<!-- dev-flow:start -->')) {
    console.log(`ℹ️ codex: ${dest} 已包含 dev-flow 指令，跳过追加`);
    return;
  }

  const content = readFileSync(src, 'utf-8');
  appendFileSync(dest, `\n\n<!-- dev-flow:start -->\n${content.trim()}\n<!-- dev-flow:end -->\n`, 'utf-8');
  console.log(`✅ codex: 已追加 dev-flow 指令到 ${dest}`);
}

function installCodexExtras() {
  for (const file of CODEX_EXTRA_FILES) {
    const src = resolve(ROOT, file.src);
    const dest = resolve(PROJECT_ROOT, file.dest);

    if (!existsSync(src)) {
      console.error(`❌ Codex 文件不存在: ${src}`);
      continue;
    }

    if (file.optional && existsSync(dest)) {
      console.log(`ℹ️ codex: ${file.dest} 已存在，保留用户配置`);
      continue;
    }

    mkdirSync(dirname(dest), { recursive: true });
    cpSync(src, dest);
    console.log(`✅ codex: ${dest}`);
  }
}

function normalizeTarget(target) {
  const normalized = target || 'all';
  const mapped = TOOL_ALIASES[normalized];

  if (!mapped) {
    console.error(`❌ 不支持的命令或工具: ${normalized}`);
    console.error(`   支持: install, ${Object.keys(SKILL_FILES).join(', ')}, all`);
    process.exit(1);
  }

  return mapped;
}

function createMemoryTemplate() {
  // 先检测项目类型
  const info = detectProjectTypeInfo();
  const hasBackend = info.hasBackend;
  const hasFrontend = info.hasFrontend;

  const memoryDir = resolve(PROJECT_ROOT, '.dev-flow/memory');
  const indexDir = resolve(memoryDir, '_index');
  const backendDir = resolve(memoryDir, 'backend');
  const backendSessionDir = resolve(backendDir, 'session');
  const frontendDir = resolve(memoryDir, 'frontend');
  const frontendSessionDir = resolve(frontendDir, 'session');
  const sessionsDir = resolve(PROJECT_ROOT, '.dev-flow/sessions');

  // 创建所有需要的目录
  const dirs = [memoryDir, indexDir, sessionsDir];
  if (hasBackend) { dirs.push(backendDir, backendSessionDir); }
  if (hasFrontend) { dirs.push(frontendDir, frontendSessionDir); }
  dirs.forEach(d => mkdirSync(d, { recursive: true }));

  // 辅助函数：写入模板文件
  const writeTemplate = (dir, file) => {
    const filePath = resolve(dir, file);
    if (!existsSync(filePath)) {
      const content = MEMORY_TEMPLATES[file] || `# ${file.replace('.md', '').replace(/-/g, ' ')}

> 由 dev-flow Research 阶段自动填充

`;
      writeFileSync(filePath, content, 'utf-8');
    }
  };

  // 共享文件 → memory/ 根目录
  SHARED_MEMORY_FILES.forEach(f => writeTemplate(memoryDir, f));

  // 后端文件 → memory/backend/
  if (hasBackend) {
    BACKEND_MEMORY_FILES.forEach(f => writeTemplate(backendDir, f));
    BACKEND_SESSION_FILES.forEach(f => writeTemplate(backendSessionDir, f));
  }

  // 前端文件 → memory/frontend/
  if (hasFrontend) {
    FRONTEND_MEMORY_FILES.forEach(f => writeTemplate(frontendDir, f));
    FRONTEND_SESSION_FILES.forEach(f => writeTemplate(frontendSessionDir, f));
  }

  // 创建 .gitkeep 防止空目录被 git 忽略
  const gitkeep = resolve(sessionsDir, '.gitkeep');
  if (!existsSync(gitkeep)) {
    writeFileSync(gitkeep, '', 'utf-8');
  }

  const parts = ['.dev-flow/memory/ (共享)'];
  if (hasBackend) parts.push('.dev-flow/memory/backend/ (后端)');
  if (hasFrontend) parts.push('.dev-flow/memory/frontend/ (前端)');
  console.log(`✅ 记忆目录: ${parts.join(' + ')}`);
}

// ============================================================
// 项目类型自动检测（安装时轻量预检，仅输出提示）
// ============================================================

function detectProjectTypeInfo() {
  const checks = {
    hasJava: existsSync(resolve(PROJECT_ROOT, 'pom.xml')) ||
              existsSync(resolve(PROJECT_ROOT, 'build.gradle')) ||
              existsSync(resolve(PROJECT_ROOT, 'build.gradle.kts')),
    hasGo: existsSync(resolve(PROJECT_ROOT, 'go.mod')),
    hasPython: existsSync(resolve(PROJECT_ROOT, 'pyproject.toml')) ||
               existsSync(resolve(PROJECT_ROOT, 'requirements.txt')) ||
               existsSync(resolve(PROJECT_ROOT, 'setup.py')) ||
               existsSync(resolve(PROJECT_ROOT, 'setup.cfg')),
  };

  let hasFrontend = false;
  let hasBackend = false;
  let backendLanguage = null;
  let frontendFramework = null;

  const pkgPath = resolve(PROJECT_ROOT, 'package.json');
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      for (const fw of ['react', 'vue', '@angular/core', 'next', 'nuxt', 'svelte']) {
        if (deps[fw]) { hasFrontend = true; frontendFramework = fw; break; }
      }
    } catch {}
  }

  const hasNodeBackend = existsSync(pkgPath) && !hasFrontend;
  if (hasNodeBackend) { hasBackend = true; backendLanguage = 'typescript'; }
  if (checks.hasJava) { hasBackend = true; backendLanguage = 'java'; }
  else if (checks.hasGo) { hasBackend = true; backendLanguage = 'go'; }
  else if (checks.hasPython) { hasBackend = true; backendLanguage = 'python'; }

  let projectType, hint;
  if (hasFrontend && backendLanguage === 'java') {
    projectType = 'java-fullstack'; hint = '检测到 Java + 前端全栈项目';
  } else if (hasFrontend && hasBackend) {
    projectType = 'fullstack'; hint = '检测到前端 + 后端全栈项目';
  } else if (hasFrontend) {
    projectType = 'frontend'; hint = '检测到纯前端项目';
  } else if (backendLanguage === 'java') {
    projectType = 'java-microservice'; hint = '检测到 Java 微服务项目';
  } else if (hasBackend) {
    projectType = 'backend'; hint = '检测到后端项目';
  } else {
    projectType = 'fullstack'; hint = '未检测到明确特征，默认使用全栈模式';
  }

  console.log('\n[dev-flow] 项目类型: ' + projectType);
  console.log('  ' + hint);
  const langInfo = [];
  if (backendLanguage) langInfo.push(backendLanguage);
  if (hasFrontend) langInfo.push('typescript');
  if (langInfo.length > 0) console.log('  语言: ' + langInfo.join(', '));
  console.log('  AI 将在 /dev-flow 运行时自动适配工作流');
  return { projectType, hasFrontend, hasBackend, backendLanguage, frontendFramework };
}

// CLI 解析
const args = process.argv.slice(2);
const target = args[0] || 'all';

install(target);

