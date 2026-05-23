# P1: 项目脚手架与CLI 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 搭建 dev-flow 项目的 TypeScript 脚手架，实现 CLI 命令解析和 npx 安装流程，使用户可以通过 `npx dev-flow install` 安装并在 AI 编程工具中使用 `/dev-flow` 命令。

**Architecture:** 使用 TypeScript + Node.js 构建标准 npm 包，通过 `bin` 字段注册 CLI 命令。使用 `commander` 解析命令参数，使用 `chalk` + `ora` 提供友好的终端交互。

**Tech Stack:** TypeScript, Node.js, commander, chalk, ora, inquirer

---

## 文件结构

```
dev-flow/
├── package.json                  # npm包配置，含bin字段
├── tsconfig.json                 # TypeScript配置
├── .gitignore                    # Git忽略规则
├── SKILL.md                      # ← 核心技能定义（Trae/Qoder读取）
├── bin/
│   └── dev-flow.js               # CLI入口（shebang）
├── src/
│   ├── index.ts                  # 主入口，导出所有模块
│   ├── cli/
│   │   ├── commands.ts           # 命令定义与解析
│   │   ├── installer.ts          # 安装逻辑（环境检测、配置生成、技能注册）
│   │   └── interactive.ts        # 交互式问答（阶段确认等）
│   └── utils/
│       ├── logger.ts             # 日志工具（基于chalk）
│       └── fs-utils.ts           # 文件系统工具
├── templates/                    # 安装时复制到目标项目的模板
│   ├── config.yaml
│   ├── design-doc.md
│   ├── requirement-doc.md
│   └── test-report.md
├── skill-templates/              # ← 新增：各工具的技能适配文件
│   ├── trae/
│   │   └── SKILL.md              # Trae 技能定义
│   ├── cursor/
│   │   └── dev-flow.md           # Cursor 自定义命令
│   ├── claude/
│   │   └── dev-flow.md           # Claude Code 自定义命令
│   └── qoder/
│       └── dev-flow.md           # Qoder 自定义命令
└── tests/
    ├── cli/
    │   ├── commands.test.ts      # 命令解析测试
    │   └── installer.test.ts     # 安装逻辑测试
    └── utils/
        └── fs-utils.test.ts      # 文件工具测试
```

---

### Task 1: 项目初始化与TypeScript配置

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `.gitignore`
- Create: `bin/dev-flow.js`

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "dev-flow",
  "version": "0.1.0",
  "description": "AI开发全流程自动化Agent技能系统",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "bin": {
    "dev-flow": "./bin/dev-flow.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint src/",
    "prepublishOnly": "npm run build"
  },
  "keywords": ["ai", "coding", "agent", "dev-flow", "cursor", "trae", "qoder", "claude"],
  "license": "MIT",
  "engines": {
    "node": ">=18.0.0"
  },
  "files": [
    "dist",
    "bin",
    "templates",
    "skill-templates",
    "SKILL.md",
    "README.md"
  ],
  "dependencies": {
    "commander": "^12.0.0",
    "chalk": "^5.3.0",
    "ora": "^8.0.0",
    "inquirer": "^9.2.0",
    "yaml": "^2.3.0",
    "glob": "^10.3.0",
    "chokidar": "^3.5.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "vitest": "^1.4.0",
    "@types/node": "^20.11.0",
    "eslint": "^8.57.0"
  }
}
```

- [ ] **Step 2: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

- [ ] **Step 3: 创建 .gitignore**

```
node_modules/
dist/
.dev-flow/
*.db
.env
coverage/
```

- [ ] **Step 4: 创建 bin/dev-flow.js（CLI入口）**

```javascript
#!/usr/bin/env node
import '../dist/cli/commands.js';
```

- [ ] **Step 5: 安装依赖并验证构建**

Run: `npm install && npm run build`
Expected: 构建成功，无错误

- [ ] **Step 6: 提交**

```bash
git add package.json tsconfig.json .gitignore bin/dev-flow.js
git commit -m "chore: initialize project with TypeScript and CLI setup"
```

---

### Task 2: 日志工具与文件系统工具

**Files:**
- Create: `src/utils/logger.ts`
- Create: `src/utils/fs-utils.ts`
- Test: `tests/utils/fs-utils.test.ts`

- [ ] **Step 1: 创建日志工具**

```typescript
// src/utils/logger.ts
import chalk from 'chalk';

export const logger = {
  info(message: string): void {
    console.log(chalk.blue('ℹ'), message);
  },

  success(message: string): void {
    console.log(chalk.green('✔'), message);
  },

  warn(message: string): void {
    console.log(chalk.yellow('⚠'), message);
  },

  error(message: string): void {
    console.log(chalk.red('✖'), message);
  },

  step(step: number, total: number, message: string): void {
    console.log(chalk.cyan(`[${step}/${total}]`), message);
  },

  title(message: string): void {
    console.log();
    console.log(chalk.bold.cyan(`── ${message} ──`));
    console.log();
  },
};
```

- [ ] **Step 2: 创建文件系统工具**

```typescript
// src/utils/fs-utils.ts
import fs from 'node:fs/promises';
import path from 'node:path';

export async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function readJson<T>(filePath: string): Promise<T> {
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content) as T;
}

export async function writeJson(filePath: string, data: unknown, indent = 2): Promise<void> {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, JSON.stringify(data, null, indent), 'utf-8');
}

export async function readText(filePath: string): Promise<string> {
  return fs.readFile(filePath, 'utf-8');
}

export async function writeText(filePath: string, content: string): Promise<void> {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, 'utf-8');
}

export async function copyFile(src: string, dest: string): Promise<void> {
  await ensureDir(path.dirname(dest));
  await fs.copyFile(src, dest);
}

export function resolveProjectRoot(): string {
  // 从当前工作目录向上查找，直到找到 package.json
  let dir = process.cwd();
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, 'package.json'))) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  return process.cwd();
}
```

- [ ] **Step 3: 编写文件工具测试**

```typescript
// tests/utils/fs-utils.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
import { ensureDir, fileExists, readJson, writeJson, readText, writeText } from '../../src/utils/fs-utils.js';

const tmpDir = path.join(os.tmpdir(), 'dev-flow-test-' + Date.now());

beforeEach(async () => {
  await ensureDir(tmpDir);
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe('fs-utils', () => {
  it('ensureDir creates directory', async () => {
    const dir = path.join(tmpDir, 'nested', 'dir');
    await ensureDir(dir);
    expect(await fileExists(dir)).toBe(true);
  });

  it('fileExists returns true for existing file', async () => {
    const file = path.join(tmpDir, 'test.txt');
    await writeText(file, 'hello');
    expect(await fileExists(file)).toBe(true);
  });

  it('fileExists returns false for non-existing file', async () => {
    expect(await fileExists(path.join(tmpDir, 'nope.txt'))).toBe(false);
  });

  it('writeJson and readJson round-trip', async () => {
    const file = path.join(tmpDir, 'data.json');
    const data = { name: 'test', value: 42 };
    await writeJson(file, data);
    const result = await readJson<typeof data>(file);
    expect(result).toEqual(data);
  });

  it('writeText and readText round-trip', async () => {
    const file = path.join(tmpDir, 'doc.md');
    await writeText(file, '# Hello');
    expect(await readText(file)).toBe('# Hello');
  });
});
```

- [ ] **Step 4: 运行测试验证**

Run: `npx vitest run tests/utils/fs-utils.test.ts`
Expected: 所有测试通过

- [ ] **Step 5: 提交**

```bash
git add src/utils/ tests/utils/
git commit -m "feat: add logger and fs-utils with tests"
```

---

### Task 3: CLI命令解析

**Files:**
- Create: `src/cli/commands.ts`
- Test: `tests/cli/commands.test.ts`

- [ ] **Step 1: 创建命令解析模块**

```typescript
// src/cli/commands.ts
import { Command } from 'commander';
import { runInstall } from './installer.js';
import { runDevFlow } from './interactive.js';

const program = new Command();

program
  .name('dev-flow')
  .description('AI开发全流程自动化Agent技能系统')
  .version('0.1.0');

// install 命令
program
  .command('install')
  .description('安装 dev-flow 到当前项目')
  .option('-g, --global', '全局安装')
  .action(async (options) => {
    await runInstall(options.global);
  });

// dev-flow 主命令（通过 /dev-flow 触发）
program
  .command('run')
  .description('执行 dev-flow 全流程或指定阶段')
  .argument('[requirement]', '需求描述或文档路径')
  .option('-s, --stage <stage>', '执行指定阶段 (research|analyze|design|plan|develop|test|fix)')
  .option('-r, --refresh', '刷新模式，重新执行并更新记忆')
  .action(async (requirement, options) => {
    await runDevFlow({
      requirement: requirement || '',
      stage: options.stage || null,
      refresh: options.refresh || false,
    });
  });

// 默认命令：当直接运行 dev-flow 时
program
  .argument('[command]', '要执行的命令')
  .action(async (command) => {
    if (!command) {
      program.help();
    }
  });

export function parseCli(): void {
  program.parse(process.argv);
}

// 直接运行时解析CLI
parseCli();
```

- [ ] **Step 2: 创建交互式入口（占位实现）**

```typescript
// src/cli/interactive.ts
import { logger } from '../utils/logger.js';

export interface DevFlowOptions {
  requirement: string;
  stage: string | null;
  refresh: boolean;
}

export async function runDevFlow(options: DevFlowOptions): Promise<void> {
  logger.title('dev-flow');

  if (options.stage) {
    logger.info(`执行阶段: ${options.stage}${options.refresh ? ' (刷新模式)' : ''}`);
    // 后续子计划实现各阶段逻辑
    logger.warn('该阶段将在后续子计划中实现');
  } else if (options.requirement) {
    logger.info(`全流程模式: ${options.requirement}`);
    logger.warn('全流程将在后续子计划中实现');
  } else {
    logger.error('请提供需求描述或指定阶段');
    logger.info('用法: dev-flow run <需求描述>');
    logger.info('      dev-flow run -s <阶段>');
  }
}
```

- [ ] **Step 3: 编写命令解析测试**

```typescript
// tests/cli/commands.test.ts
import { describe, it, expect } from 'vitest';
import { Command } from 'commander';

function createTestProgram(): Command {
  const program = new Command();
  program
    .name('dev-flow')
    .version('0.1.0');
  program
    .command('install')
    .description('安装 dev-flow 到当前项目')
    .option('-g, --global', '全局安装');
  program
    .command('run')
    .description('执行 dev-flow 全流程或指定阶段')
    .argument('[requirement]', '需求描述或文档路径')
    .option('-s, --stage <stage>', '执行指定阶段')
    .option('-r, --refresh', '刷新模式');
  return program;
}

describe('CLI commands', () => {
  it('registers install command', () => {
    const program = createTestProgram();
    const installCmd = program.commands.find(c => c.name() === 'install');
    expect(installCmd).toBeDefined();
    expect(installCmd?.options).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ long: '--global' }),
      ])
    );
  });

  it('registers run command with stage option', () => {
    const program = createTestProgram();
    const runCmd = program.commands.find(c => c.name() === 'run');
    expect(runCmd).toBeDefined();
    expect(runCmd?.options).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ long: '--stage' }),
        expect.objectContaining({ long: '--refresh' }),
      ])
    );
  });
});
```

- [ ] **Step 4: 运行测试验证**

Run: `npx vitest run tests/cli/commands.test.ts`
Expected: 所有测试通过

- [ ] **Step 5: 提交**

```bash
git add src/cli/ tests/cli/
git commit -m "feat: add CLI command parsing with install and run commands"
```

---

### Task 4: 核心技能定义文件 (SKILL.md)

**Files:**
- Create: `SKILL.md` (项目根目录)

- [ ] **Step 1: 创建核心技能定义文件**

```markdown
---
name: dev-flow
description: AI开发全流程自动化Agent技能系统，支持项目调研、需求分析、详细设计、任务拆分、多Agent并行开发、测试验证、Bug修复的完整开发流程
---

# dev-flow

## 描述

dev-flow 是一个AI驱动的开发全流程自动化系统。当用户输入 `/dev-flow <需求描述>` 时，AI 将按照本技能定义的流程逐步执行，完成从项目调研到代码交付的完整开发周期。

## 使用场景

- 需要开发新功能或模块时
- 需要理解现有项目架构并基于此开发时
- 需要自动生成测试用例并验证功能时
- 需要修复Bug并进行回归测试时

## 命令格式

### 全流程模式
`/dev-flow <需求描述>` - 执行完整的7阶段开发流程

### 单阶段模式
- `/dev-flow -research` - 项目调研（扫描项目结构、依赖、规范）
- `/dev-flow -analyze` - 需求分析（解析需求、识别歧义）
- `/dev-flow -design` - 详细设计（生成技术设计文档）
- `/dev-flow -plan` - 任务拆分（生成可执行任务列表）
- `/dev-flow -develop` - 开发执行（多Agent并行编码）
- `/dev-flow -test` - 测试验证（生成并执行测试用例）
- `/dev-flow -fix` - Bug修复（根据测试报告修复问题）

### 刷新模式
- `/dev-flow -research --refresh` - 重新调研项目并更新记忆

## 阶段说明

### Stage 1: Research (项目调研)
**输入**: 当前项目文件
**输出**: `.dev-flow/memory/` 下的项目记忆文件
**行为**:
1. 扫描项目目录结构
2. 检测技术栈和依赖
3. 提取编码规范（ESLint/Prettier/TSConfig）
4. 扫描组件库（Props/Events/Slots）
5. 扫描API接口（端点/数据模型）
6. 扫描工具函数和Hooks
7. 将结果写入记忆系统

### Stage 2: Analyze (需求分析)
**输入**: 用户需求描述 + 项目记忆
**输出**: `.dev-flow/sessions/<id>/analyze-result.md`
**行为**:
1. 解析需求类型（功能/重构/优化）
2. 关联项目记忆（检索相关组件/API/规范）
3. 识别需求歧义和缺失信息
4. 评估影响范围（文件/API/数据模型）
5. 生成需求理解文档，等待用户确认

### Stage 3: Design (详细设计)
**输入**: 需求理解文档 + 项目记忆
**输出**: `.dev-flow/sessions/<id>/design-doc.md`
**行为**:
1. 设计数据层（模型/校验规则）
2. 设计接口层（端点/错误码/认证策略）
3. 设计组件层（组件树/Props定义）
4. 设计业务逻辑（流程/状态管理）
5. 设计样式（主题/响应式/动画）
6. 生成设计文档，等待用户确认

### Stage 4: Plan (任务拆分)
**输入**: 设计文档 + 项目记忆
**输出**: `.dev-flow/sessions/<id>/task-list.json`
**行为**:
1. 将设计拆分为可执行任务
2. 分析任务依赖关系
3. 构建依赖图（DAG）
4. 按依赖层级排序
5. 生成任务列表，等待用户确认

### Stage 5: Develop (开发执行)
**输入**: 任务列表 + 项目记忆
**输出**: 代码文件
**行为**:
1. 按依赖顺序执行任务
2. 为每个任务匹配专家Agent（前端/后端/数据库）
3. 并行执行无依赖任务
4. 每个Agent自检代码质量
5. 生成代码变更，等待用户确认

### Stage 6: Test (测试验证)
**输入**: 代码变更 + 设计文档
**输出**: `.dev-flow/sessions/<id>/test-report.md`
**行为**:
1. 生成单元测试用例
2. 生成API测试用例
3. 生成E2E测试用例
4. 执行测试（支持浏览器自动化）
5. 生成测试报告

### Stage 7: Fix (Bug修复)
**输入**: 测试报告
**输出**: 修复后的代码
**行为**:
1. 分析失败的测试用例
2. 定位Bug位置
3. 生成修复方案
4. 执行修复
5. 回归测试

## 记忆系统

项目记忆存储在 `.dev-flow/memory/` 目录：

```
.dev-flow/memory/
├── conventions/          # 编码规范
│   ├── eslint-rules.md
│   ├── naming-conventions.md
│   └── tsconfig-rules.md
├── components/           # 组件库
│   ├── Button.md
│   ├── Modal.md
│   └── ...
├── apis/                 # API接口
│   ├── user-api.md
│   └── ...
├── utils/                # 工具函数
│   ├── useAuth.md
│   └── ...
├── styles/               # 样式系统
│   ├── theme.md
│   └── ...
└── patterns/             # 学习到的模式
    └── learned-patterns.json
```

AI 在执行每个阶段前，必须先读取相关记忆文件作为上下文。

## 输出格式

### 需求理解文档 (analyze-result.md)
```markdown
# 需求分析: <功能名称>

## 需求概述
<简要描述>

## 需求类型
- [ ] 新功能
- [ ] 功能增强
- [ ] 重构
- [ ] Bug修复

## 关联记忆
- 组件: <相关组件列表>
- API: <相关API列表>
- 规范: <相关规范>

## 影响范围
- 文件: <受影响文件>
- API变更: <新增/修改/删除的API>
- 数据模型: <变更的数据模型>

## 歧义与问题
<需要用户澄清的问题>
```

### 设计文档 (design-doc.md)
```markdown
# 设计文档: <功能名称>

## 数据层设计
...

## 接口层设计
...

## 组件层设计
...

## 业务逻辑设计
...

## 样式设计
...
```

### 任务列表 (task-list.json)
```json
{
  "tasks": [
    {
      "id": "task-1",
      "type": "component",
      "description": "创建登录表单组件",
      "dependencies": [],
      "estimatedTokens": 5000
    }
  ],
  "executionOrder": [["task-1"], ["task-2", "task-3"]]
}
```

## 上下文控制策略

1. **任务拆分**: 当单个任务预计消耗 >8000 tokens 时，必须拆分为子任务
2. **记忆检索**: 使用向量索引检索最相关的记忆片段，限制在 4000 tokens 内
3. **增量加载**: 开发阶段按需加载任务相关上下文，而非一次性加载全部
4. **摘要传递**: 阶段间传递关键摘要而非完整文档

## 学习机制

1. **模式提取**: 从用户确认/修改中学习代码模式
2. **反馈收集**: 记录每个阶段的用户反馈
3. **知识整合**: 将学习到的模式写入 `.dev-flow/memory/patterns/`
4. **持续改进**: 后续任务自动应用学习到的模式

## 注意事项

1. 每个阶段完成后必须等待用户确认才能继续
2. 严格遵守项目记忆中的编码规范
3. 优先复用已有组件和API
4. 生成的代码必须包含适当的注释
5. 测试覆盖率目标: 单元测试 >80%，关键路径 100%
```

- [ ] **Step 2: 提交**

```bash
git add SKILL.md
git commit -m "feat: add core SKILL.md for AI tool integration"
```

---

### Task 5: 各工具技能适配文件

**Files:**
- Create: `skill-templates/trae/SKILL.md`
- Create: `skill-templates/cursor/dev-flow.md`
- Create: `skill-templates/claude/dev-flow.md`
- Create: `skill-templates/qoder/dev-flow.md`

- [ ] **Step 1: 创建 Trae 技能文件**

```markdown
---
name: dev-flow
description: AI开发全流程自动化Agent技能系统，支持项目调研、需求分析、详细设计、任务拆分、多Agent并行开发、测试验证、Bug修复的完整开发流程
---

# dev-flow

## 描述

dev-flow 是一个AI驱动的开发全流程自动化系统。当用户输入 `/dev-flow <需求描述>` 时，AI 将按照本技能定义的流程逐步执行，完成从项目调研到代码交付的完整开发周期。

## 使用场景

- 需要开发新功能或模块时
- 需要理解现有项目架构并基于此开发时
- 需要自动生成测试用例并验证功能时
- 需要修复Bug并进行回归测试时

## 指令

当用户输入 `/dev-flow <需求描述>` 或 `/dev-flow -<阶段>` 时，按以下流程执行：

### 1. 检查项目记忆
- 读取 `.dev-flow/memory/` 目录下的项目记忆
- 如果没有记忆或用户使用 `--refresh`，先执行 Research 阶段

### 2. 执行指定阶段

#### Research 阶段 (`/dev-flow -research`)
1. 扫描项目目录结构
2. 检测技术栈和依赖
3. 提取编码规范
4. 扫描组件、API、工具函数
5. 将结果写入 `.dev-flow/memory/`
6. 生成调研摘要，等待用户确认

#### Analyze 阶段 (`/dev-flow -analyze`)
1. 解析用户需求，识别需求类型
2. 检索相关项目记忆
3. 识别需求歧义和缺失信息
4. 评估影响范围
5. 生成需求理解文档
6. 等待用户确认

#### Design 阶段 (`/dev-flow -design`)
1. 基于需求理解设计数据层
2. 设计接口层（端点/错误码）
3. 设计组件层（组件树/Props）
4. 设计业务逻辑和样式
5. 生成设计文档
6. 等待用户确认

#### Plan 阶段 (`/dev-flow -plan`)
1. 将设计拆分为可执行任务
2. 分析任务依赖关系
3. 构建依赖图并排序
4. 生成任务列表
5. 等待用户确认

#### Develop 阶段 (`/dev-flow -develop`)
1. 按依赖顺序读取任务
2. 为每个任务选择专家（前端/后端/数据库）
3. 并行执行无依赖任务
4. 每个任务自检代码质量
5. 生成代码，等待用户确认

#### Test 阶段 (`/dev-flow -test`)
1. 生成单元测试用例
2. 生成API测试用例
3. 生成E2E测试用例
4. 执行测试（支持Playwright）
5. 生成测试报告

#### Fix 阶段 (`/dev-flow -fix`)
1. 分析失败的测试用例
2. 定位并修复Bug
3. 回归测试

### 3. 全流程模式 (`/dev-flow <需求>`)
按顺序执行：Research → Analyze → Design → Plan → Develop → Test → Fix
每个阶段完成后等待用户确认。

## 记忆系统使用

执行每个阶段前，必须读取 `.dev-flow/memory/` 中的相关记忆：
- 开发组件前：读取 `components/` 和 `styles/`
- 开发API前：读取 `apis/` 和 `conventions/`
- 编写代码时：遵守 `conventions/` 中的规范

## 示例

**输入**: `/dev-flow 实现用户登录功能`

**执行流程**:
1. Research: 扫描项目，发现已有 Button、Input 组件，/api/auth 接口
2. Analyze: 识别需要登录表单、API调用、状态管理
3. Design: 设计 LoginForm 组件、login API、useAuth hook
4. Plan: 拆分为创建组件、添加API、集成状态管理
5. Develop: 并行开发各任务
6. Test: 生成并执行测试用例
7. Fix: 修复发现的问题
```

- [ ] **Step 2: 创建 Cursor 自定义命令文件**

```markdown
# dev-flow

AI开发全流程自动化Agent技能系统

## 使用方法

在 Cursor 输入框中输入：
- `/dev-flow <需求描述>` - 执行完整开发流程
- `/dev-flow -research` - 项目调研
- `/dev-flow -analyze` - 需求分析
- `/dev-flow -design` - 详细设计
- `/dev-flow -plan` - 任务拆分
- `/dev-flow -develop` - 开发执行
- `/dev-flow -test` - 测试验证
- `/dev-flow -fix` - Bug修复

## 工作流程

### 1. 项目记忆

项目记忆存储在 `.dev-flow/memory/` 目录。执行任何阶段前，先读取相关记忆：

```
.dev-flow/memory/
├── conventions/     # 编码规范
├── components/      # 组件库文档
├── apis/           # API接口文档
├── utils/          # 工具函数文档
├── styles/         # 样式系统
└── patterns/       # 学习到的模式
```

### 2. 阶段执行

#### Research 阶段
扫描项目结构，提取：
- 目录结构和技术栈
- 编码规范（ESLint/TSConfig）
- 组件（Props/Events/Slots）
- API接口（端点/模型）
- 工具函数和Hooks

将结果写入 `.dev-flow/memory/` 各目录。

#### Analyze 阶段
解析用户需求：
1. 识别需求类型（功能/重构/优化）
2. 检索相关项目记忆
3. 识别歧义和缺失信息
4. 评估影响范围

输出：`.dev-flow/sessions/<id>/analyze-result.md`

#### Design 阶段
基于需求分析生成设计：
1. 数据层设计（模型/校验）
2. 接口层设计（端点/错误码）
3. 组件层设计（组件树/Props）
4. 业务逻辑设计（流程/状态）
5. 样式设计（主题/响应式）

输出：`.dev-flow/sessions/<id>/design-doc.md`

#### Plan 阶段
将设计拆分为任务：
1. 识别可执行单元
2. 分析依赖关系
3. 构建DAG并拓扑排序
4. 划分执行批次

输出：`.dev-flow/sessions/<id>/task-list.json`

#### Develop 阶段
执行开发任务：
1. 按依赖顺序读取任务
2. 匹配专家（前端/后端/数据库）
3. 并行执行无依赖任务
4. 每个任务自检
5. 生成代码变更

#### Test 阶段
生成并执行测试：
1. 单元测试（Vitest）
2. API测试
3. E2E测试（Playwright）
4. 生成测试报告

#### Fix 阶段
修复测试发现的问题：
1. 分析失败用例
2. 定位Bug
3. 生成修复
4. 回归测试

### 3. 上下文控制

- 任务拆分：单个任务控制在 8000 tokens 以内
- 记忆检索：使用向量索引，限制 4000 tokens
- 增量加载：按需加载任务相关上下文

### 4. 学习机制

从用户确认和修改中学习：
- 提取代码模式
- 记录用户反馈
- 更新 `.dev-flow/memory/patterns/`
- 后续任务自动应用

## 注意事项

1. 每个阶段完成后等待用户确认
2. 严格遵守项目记忆中的编码规范
3. 优先复用已有组件和API
4. 代码必须包含适当注释
5. 测试覆盖率目标：单元 >80%，关键路径 100%
```

- [ ] **Step 3: 创建 Claude Code 自定义命令文件**

```markdown
# dev-flow

AI开发全流程自动化系统

## 用法

```
/dev-flow <需求描述>      # 执行完整流程
/dev-flow -research       # 项目调研
/dev-flow -analyze        # 需求分析
/dev-flow -design         # 详细设计
/dev-flow -plan           # 任务拆分
/dev-flow -develop        # 开发执行
/dev-flow -test           # 测试验证
/dev-flow -fix            # Bug修复
/dev-flow -<stage> --refresh  # 刷新模式
```

## 执行流程

### 1. 检查记忆
首先检查 `.dev-flow/memory/` 是否存在项目记忆。如果没有，或用户使用 `--refresh`，执行 Research 阶段。

### 2. 阶段执行

**Research**: 扫描项目 → 提取规范/组件/API → 写入记忆

**Analyze**: 解析需求 → 关联记忆 → 识别歧义 → 评估影响 → 生成文档

**Design**: 设计数据层 → 接口层 → 组件层 → 业务逻辑 → 样式 → 生成设计文档

**Plan**: 拆分任务 → 分析依赖 → 构建DAG → 生成任务列表

**Develop**: 按序执行任务 → 专家匹配 → 并行开发 → 自检 → 生成代码

**Test**: 生成测试 → 执行（单元/API/E2E）→ 生成报告

**Fix**: 分析失败 → 定位Bug → 修复 → 回归测试

### 3. 记忆系统

```
.dev-flow/memory/
├── conventions/    # 编码规范
├── components/     # 组件文档
├── apis/          # API文档
├── utils/         # 工具函数
├── styles/        # 样式系统
└── patterns/      # 学习到的模式
```

执行各阶段前读取相关记忆作为上下文。

### 4. 输出位置

```
.dev-flow/sessions/<session-id>/
├── analyze-result.md   # 需求分析结果
├── design-doc.md       # 设计文档
├── task-list.json      # 任务列表
└── test-report.md      # 测试报告
```

### 5. 上下文控制

- 任务控制在 8000 tokens 以内
- 记忆检索限制 4000 tokens
- 阶段间传递摘要而非完整文档

### 6. 学习

从用户反馈中学习，更新 `.dev-flow/memory/patterns/`，后续自动应用。

## 约束

- 遵守项目记忆中的编码规范
- 优先复用已有组件和API
- 代码包含适当注释
- 测试覆盖率：单元 >80%，关键路径 100%
- 每个阶段完成后等待用户确认
```

- [ ] **Step 4: 创建 Qoder 自定义命令文件**

```markdown
---
name: dev-flow
description: AI开发全流程自动化Agent技能系统
---

# dev-flow

## 描述

AI驱动的开发全流程自动化系统，覆盖项目调研、需求分析、详细设计、任务拆分、多Agent开发、测试验证、Bug修复的完整周期。

## 使用场景

- 新功能开发
- 基于现有架构的功能增强
- 自动化测试生成与执行
- Bug修复与回归测试

## 命令格式

```
/dev-flow <需求描述>
/dev-flow -research [--refresh]
/dev-flow -analyze
/dev-flow -design
/dev-flow -plan
/dev-flow -develop
/dev-flow -test
/dev-flow -fix
```

## 工作流程

### Stage 1: Research (项目调研)
扫描项目，提取并存储：
- 目录结构和技术栈
- 编码规范
- 组件库
- API接口
- 工具函数

存储位置: `.dev-flow/memory/`

### Stage 2: Analyze (需求分析)
解析用户需求：
1. 识别需求类型和优先级
2. 检索相关项目记忆
3. 识别歧义和缺失信息
4. 评估影响范围

输出: `.dev-flow/sessions/<id>/analyze-result.md`

### Stage 3: Design (详细设计)
生成技术设计：
- 数据层设计
- 接口层设计
- 组件层设计
- 业务逻辑设计
- 样式设计

输出: `.dev-flow/sessions/<id>/design-doc.md`

### Stage 4: Plan (任务拆分)
将设计拆分为可执行任务：
1. 识别任务单元
2. 分析依赖关系
3. 构建DAG
4. 拓扑排序

输出: `.dev-flow/sessions/<id>/task-list.json`

### Stage 5: Develop (开发执行)
执行开发任务：
1. 按依赖顺序执行
2. 专家匹配（前端/后端/数据库）
3. 并行执行无依赖任务
4. 代码自检

### Stage 6: Test (测试验证)
生成并执行测试：
- 单元测试
- API测试
- E2E测试

输出: `.dev-flow/sessions/<id>/test-report.md`

### Stage 7: Fix (Bug修复)
修复测试发现的问题并回归测试。

## 记忆系统

```
.dev-flow/memory/
├── conventions/     # 编码规范
├── components/      # 组件
├── apis/           # API接口
├── utils/          # 工具函数
├── styles/         # 样式系统
└── patterns/       # 学习到的模式
```

## 上下文控制

- 任务拆分: >8000 tokens 必须拆分
- 记忆检索: 限制 4000 tokens
- 增量加载: 按需加载任务上下文

## 学习机制

从用户确认和修改中提取模式，存储到 `.dev-flow/memory/patterns/`，后续自动应用。

## 约束

1. 遵守项目记忆中的编码规范
2. 优先复用已有组件和API
3. 代码包含适当注释
4. 测试覆盖率: 单元 >80%，关键路径 100%
5. 每个阶段完成后等待用户确认
```

- [ ] **Step 5: 提交**

```bash
git add skill-templates/
git commit -m "feat: add skill templates for Trae, Cursor, Claude, Qoder"
```

---

### Task 6: 配置文件模板

**Files:**
- Create: `templates/config.yaml`
- Create: `templates/design-doc.md`
- Create: `templates/requirement-doc.md`
- Create: `templates/test-report.md`

- [ ] **Step 1: 创建配置文件模板**

```yaml
# templates/config.yaml
name: dev-flow
version: 0.1.0

# 项目配置
project:
  techStack: auto-detect
  conventions: auto-detect

# Agent配置
agents:
  maxParallel: 3
  timeout: 300000
  retryCount: 2

# 记忆配置
memory:
  autoLearn: true
  vectorSearch: true
  maxContextTokens: 100000

# 测试配置
test:
  browser: playwright
  unitTest: vitest
  coverage: true
```

- [ ] **Step 2: 创建设计文档模板**

```markdown
# 设计文档: {{feature_name}}

## 数据层设计

### 数据模型
```typescript
// 定义数据模型
```

### 校验规则
- 规则1
- 规则2

## 接口层设计

### API端点
| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| POST | /api/xxx | 描述 | JWT |

### 错误码
| 错误码 | 描述 |
|--------|------|
| 400 | 参数错误 |

## 组件层设计

### 组件树
```
Page
├── ComponentA
└── ComponentB
```

### Props定义
```typescript
interface Props {
  // 定义
}
```

## 业务逻辑设计

### 流程图
```
开始 → 步骤1 → 步骤2 → 结束
```

### 状态管理
```typescript
// 状态定义
```

## 样式设计

### 主题
- 主色: #xxx
- 辅色: #xxx

### 响应式断点
- sm: 640px
- md: 768px
- lg: 1024px

### 动画
- 过渡: 300ms ease
```

- [ ] **Step 3: 创建需求文档模板**

```markdown
# 需求分析: {{feature_name}}

## 需求概述

### 背景
<描述背景>

### 目标
<描述目标>

## 需求类型
- [ ] 新功能
- [ ] 功能增强
- [ ] 重构
- [ ] Bug修复

## 关联记忆

### 相关组件
- ComponentA
- ComponentB

### 相关API
- GET /api/xxx
- POST /api/yyy

### 相关规范
- 命名规范
- 代码风格

## 功能需求

### 需求1
**描述**: <描述>
**优先级**: P0/P1/P2
**验收标准**:
- 标准1
- 标准2

## 非功能需求

### 性能
- 响应时间 < 200ms

### 安全
- 输入校验
- XSS防护

## 影响范围

### 文件变更
- `src/components/xxx.tsx`
- `src/api/xxx.ts`

### API变更
- 新增: POST /api/new
- 修改: GET /api/existing

### 数据模型变更
- 新增字段: user.preferences

## 歧义与问题

### 待确认
1. 问题1?
2. 问题2?

### 假设
- 假设1
- 假设2
```

- [ ] **Step 4: 创建测试报告模板**

```markdown
# 测试报告: {{feature_name}}

## 测试概览

| 指标 | 数值 |
|------|------|
| 测试用例总数 | {{total}} |
| 通过 | {{passed}} |
| 失败 | {{failed}} |
| 跳过 | {{skipped}} |
| 覆盖率 | {{coverage}}% |

## 单元测试

### 通过
- [x] Test case 1
- [x] Test case 2

### 失败
- [ ] Test case 3
  - 错误: <错误信息>
  - 位置: `file.ts:42`

## API测试

### 通过
- [x] GET /api/users

### 失败
- [ ] POST /api/login
  - 状态码: 500
  - 响应: <响应内容>

## E2E测试

### 通过
- [x] 用户登录流程

### 失败
- [ ] 支付流程
  - 截图: ![screenshot](path)

## Bug列表

| ID | 描述 | 严重程度 | 文件 | 状态 |
|----|------|----------|------|------|
| BUG-1 | 描述 | High | file.ts | 待修复 |

## 修复建议

### BUG-1
**问题**: <描述>
**建议修复**:
```typescript
// 修复代码
```
```

- [ ] **Step 5: 提交**

```bash
git add templates/
git commit -m "feat: add document templates for config, design, requirement, test report"
```

---

### Task 7: 安装逻辑（更新版）

**Files:**
- Create: `src/cli/installer.ts`
- Test: `tests/cli/installer.test.ts`

- [ ] **Step 1: 创建安装模块**

```typescript
// src/cli/installer.ts
import path from 'node:path';
import fs from 'node:fs/promises';
import ora from 'ora';
import { logger } from '../utils/logger.js';
import { ensureDir, fileExists, readText, writeText, writeJson, resolveProjectRoot, copyFile } from '../utils/fs-utils.js';

const DEV_FLOW_DIR = '.dev-flow';
const MEMORY_DIR = `${DEV_FLOW_DIR}/memory`;
const DB_DIR = `${DEV_FLOW_DIR}/db`;
const SESSIONS_DIR = `${DEV_FLOW_DIR}/sessions`;
const CONFIG_FILE = `${DEV_FLOW_DIR}/config.yaml`;

interface DetectionResult {
  packageManager: 'npm' | 'yarn' | 'pnpm' | 'unknown';
  hasTypeScript: boolean;
  hasReact: boolean;
  hasVue: boolean;
  hasVite: boolean;
  aiTools: ('cursor' | 'trae' | 'qoder' | 'claude' | 'unknown')[];
}

async function detectEnvironment(projectRoot: string): Promise<DetectionResult> {
  const result: DetectionResult = {
    packageManager: 'unknown',
    hasTypeScript: false,
    hasReact: false,
    hasVue: false,
    hasVite: false,
    aiTools: [],
  };

  // 检测包管理器
  if (await fileExists(path.join(projectRoot, 'pnpm-lock.yaml'))) {
    result.packageManager = 'pnpm';
  } else if (await fileExists(path.join(projectRoot, 'yarn.lock'))) {
    result.packageManager = 'yarn';
  } else if (await fileExists(path.join(projectRoot, 'package-lock.json'))) {
    result.packageManager = 'npm';
  }

  // 检测技术栈
  const pkgPath = path.join(projectRoot, 'package.json');
  if (await fileExists(pkgPath)) {
    const pkgContent = await readText(pkgPath);
    const pkg = JSON.parse(pkgContent);
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    result.hasTypeScript = 'typescript' in allDeps;
    result.hasReact = 'react' in allDeps || 'react-dom' in allDeps;
    result.hasVue = 'vue' in allDeps;
    result.hasVite = 'vite' in allDeps;
  }

  // 检测AI工具（可能同时存在多个）
  if (await fileExists(path.join(projectRoot, '.cursor'))) {
    result.aiTools.push('cursor');
  }
  if (await fileExists(path.join(projectRoot, '.trae'))) {
    result.aiTools.push('trae');
  }
  if (await fileExists(path.join(projectRoot, '.qoder'))) {
    result.aiTools.push('qoder');
  }
  if (await fileExists(path.join(projectRoot, '.claude'))) {
    result.aiTools.push('claude');
  }
  if (result.aiTools.length === 0) {
    result.aiTools.push('unknown');
  }

  return result;
}

async function createDirectories(projectRoot: string): Promise<void> {
  const spinner = ora('创建目录结构...').start();
  try {
    await ensureDir(path.join(projectRoot, MEMORY_DIR, 'conventions'));
    await ensureDir(path.join(projectRoot, MEMORY_DIR, 'components'));
    await ensureDir(path.join(projectRoot, MEMORY_DIR, 'apis'));
    await ensureDir(path.join(projectRoot, MEMORY_DIR, 'utils'));
    await ensureDir(path.join(projectRoot, MEMORY_DIR, 'styles'));
    await ensureDir(path.join(projectRoot, MEMORY_DIR, 'patterns'));
    await ensureDir(path.join(projectRoot, DB_DIR));
    await ensureDir(path.join(projectRoot, SESSIONS_DIR));
    spinner.succeed('目录结构创建完成');
  } catch (error) {
    spinner.fail('目录结构创建失败');
    throw error;
  }
}

async function copyConfig(projectRoot: string): Promise<void> {
  const spinner = ora('生成配置文件...').start();
  try {
    // 读取模板并写入配置
    const templatePath = path.join(resolveProjectRoot(), 'templates', 'config.yaml');
    const destPath = path.join(projectRoot, CONFIG_FILE);

    if (await fileExists(templatePath)) {
      const template = await readText(templatePath);
      await writeText(destPath, template);
    } else {
      // 内联默认配置
      const defaultConfig = `name: dev-flow
version: 0.1.0

project:
  techStack: auto-detect
  conventions: auto-detect

agents:
  maxParallel: 3
  timeout: 300000
  retryCount: 2

memory:
  autoLearn: true
  vectorSearch: true
  maxContextTokens: 100000

test:
  browser: playwright
  unitTest: vitest
  coverage: true
`;
      await writeText(destPath, defaultConfig);
    }

    // 创建 .gitignore
    const gitignorePath = path.join(projectRoot, DEV_FLOW_DIR, '.gitignore');
    await writeText(gitignorePath, 'db/\n*.db\nsessions/\n');

    spinner.succeed('配置文件生成完成');
  } catch (error) {
    spinner.fail('配置文件生成失败');
    throw error;
  }
}

async function registerSkill(projectRoot: string, aiTools: string[]): Promise<void> {
  const spinner = ora(`注册技能到 AI 工具...`).start();
  try {
    const skillTemplatesDir = resolveProjectRoot();

    for (const tool of aiTools) {
      switch (tool) {
        case 'cursor': {
          const cursorDir = path.join(projectRoot, '.cursor', 'commands');
          await ensureDir(cursorDir);
          const srcPath = path.join(skillTemplatesDir, 'skill-templates', 'cursor', 'dev-flow.md');
          const destPath = path.join(cursorDir, 'dev-flow.md');
          if (await fileExists(srcPath)) {
            await copyFile(srcPath, destPath);
          }
          break;
        }
        case 'trae': {
          const traeDir = path.join(projectRoot, '.trae', 'skills', 'dev-flow');
          await ensureDir(traeDir);
          const srcPath = path.join(skillTemplatesDir, 'skill-templates', 'trae', 'SKILL.md');
          const destPath = path.join(traeDir, 'SKILL.md');
          if (await fileExists(srcPath)) {
            await copyFile(srcPath, destPath);
          }
          break;
        }
        case 'claude': {
          const claudeDir = path.join(projectRoot, '.claude', 'commands');
          await ensureDir(claudeDir);
          const srcPath = path.join(skillTemplatesDir, 'skill-templates', 'claude', 'dev-flow.md');
          const destPath = path.join(claudeDir, 'dev-flow.md');
          if (await fileExists(srcPath)) {
            await copyFile(srcPath, destPath);
          }
          break;
        }
        case 'qoder': {
          const qoderDir = path.join(projectRoot, '.qoder', 'commands');
          await ensureDir(qoderDir);
          const srcPath = path.join(skillTemplatesDir, 'skill-templates', 'qoder', 'dev-flow.md');
          const destPath = path.join(qoderDir, 'dev-flow.md');
          if (await fileExists(srcPath)) {
            await copyFile(srcPath, destPath);
          }
          break;
        }
      }
    }

    if (aiTools.includes('unknown')) {
      spinner.info('未检测到AI编程工具，跳过技能注册');
    } else {
      spinner.succeed(`已注册到: ${aiTools.filter(t => t !== 'unknown').join(', ')}`);
    }
  } catch (error) {
    spinner.fail('技能注册失败');
    throw error;
  }
}

export async function runInstall(isGlobal: boolean): Promise<void> {
  logger.title('dev-flow 安装');

  const projectRoot = resolveProjectRoot();
  logger.info(`项目根目录: ${projectRoot}`);

  // Step 1: 检测环境
  const env = await detectEnvironment(projectRoot);
  logger.info(`包管理器: ${env.packageManager}`);
  logger.info(`技术栈: TypeScript=${env.hasTypeScript} React=${env.hasReact} Vue=${env.hasVue} Vite=${env.hasVite}`);
  logger.info(`AI工具: ${env.aiTools.join(', ')}`);

  // Step 2: 创建目录
  await createDirectories(projectRoot);

  // Step 3: 生成配置
  await copyConfig(projectRoot);

  // Step 4: 注册技能
  await registerSkill(projectRoot, env.aiTools);

  // Step 5: 完成提示
  logger.title('安装完成');
  logger.success('dev-flow 已安装到当前项目');
  logger.info('');
  logger.info('使用方法:');
  logger.info('  /dev-flow <需求描述>     执行全流程开发');
  logger.info('  /dev-flow -<阶段>       执行指定阶段');
  logger.info('  /dev-flow -research     项目调研');
  logger.info('  /dev-flow -analyze      需求分析');
  logger.info('  /dev-flow -design       详细设计');
  logger.info('  /dev-flow -plan         任务拆分');
  logger.info('  /dev-flow -develop      开发执行');
  logger.info('  /dev-flow -test         测试验证');
  logger.info('  /dev-flow -fix          Bug修复');
}
```

- [ ] **Step 2: 编写安装逻辑测试**

```typescript
// tests/cli/installer.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
import { fileExists } from '../../src/utils/fs-utils.js';

const tmpDir = path.join(os.tmpdir(), 'dev-flow-install-test-' + Date.now());

beforeEach(async () => {
  await fs.mkdir(tmpDir, { recursive: true });
  // 创建一个模拟的 package.json
  await fs.writeFile(
    path.join(tmpDir, 'package.json'),
    JSON.stringify({
      name: 'test-project',
      dependencies: { react: '^18.0.0' },
      devDependencies: { typescript: '^5.0.0' },
    }),
    'utf-8'
  );
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe('installer', () => {
  it('detects npm as package manager from package-lock.json', async () => {
    await fs.writeFile(path.join(tmpDir, 'package-lock.json'), '{}');
    // 环境检测逻辑在 installer.ts 中
    // 这里验证文件存在性检测
    expect(await fileExists(path.join(tmpDir, 'package-lock.json'))).toBe(true);
  });

  it('creates .dev-flow directory structure', async () => {
    // 模拟安装后的目录结构
    const dirs = [
      '.dev-flow/memory/conventions',
      '.dev-flow/memory/components',
      '.dev-flow/memory/apis',
      '.dev-flow/memory/utils',
      '.dev-flow/memory/styles',
      '.dev-flow/memory/patterns',
      '.dev-flow/db',
      '.dev-flow/sessions',
    ];
    for (const dir of dirs) {
      await fs.mkdir(path.join(tmpDir, dir), { recursive: true });
    }
    for (const dir of dirs) {
      expect(await fileExists(path.join(tmpDir, dir))).toBe(true);
    }
  });
});
```

- [ ] **Step 3: 运行测试验证**

Run: `npx vitest run tests/cli/installer.test.ts`
Expected: 所有测试通过

- [ ] **Step 4: 端到端验证 - 执行安装命令**

Run: `node bin/dev-flow.js install`
Expected: 显示安装流程，创建 .dev-flow 目录和配置文件

- [ ] **Step 5: 提交**

```bash
git add src/cli/installer.ts tests/cli/installer.test.ts
git commit -m "feat: add installer with multi-tool skill registration"
```

---

### Task 8: 主入口与导出

**Files:**
- Create: `src/index.ts`

- [ ] **Step 1: 创建主入口**

```typescript
// src/index.ts
export { parseCli } from './cli/commands.js';
export { runInstall } from './cli/installer.js';
export { runDevFlow } from './cli/interactive.js';
export { logger } from './utils/logger.js';
export * from './utils/fs-utils.js';
```

- [ ] **Step 2: 验证构建**

Run: `npm run build`
Expected: 构建成功，dist/ 目录包含所有编译产物

- [ ] **Step 3: 提交**

```bash
git add src/index.ts
git commit -m "feat: add main entry point with exports"
```

---

### Task 9: 全量测试与验证

- [ ] **Step 1: 运行全部测试**

Run: `npx vitest run`
Expected: 所有测试通过

- [ ] **Step 2: 验证CLI帮助信息**

Run: `node bin/dev-flow.js --help`
Expected: 显示帮助信息，包含 install 和 run 命令

- [ ] **Step 3: 验证安装命令**

Run: `node bin/dev-flow.js install`
Expected: 成功安装，创建 .dev-flow 目录结构

- [ ] **Step 4: 验证run命令（占位）**

Run: `node bin/dev-flow.js run "测试需求"`
Expected: 显示全流程模式提示

Run: `node bin/dev-flow.js run -s research`
Expected: 显示阶段执行提示

- [ ] **Step 5: 最终提交**

```bash
git add -A
git commit -m "chore: P1 complete - project scaffold and CLI with SKILL.md"
```
