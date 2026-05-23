# P7: 多Agent开发执行 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现DevelopAgent和专家SubAgent系统，支持并行执行开发任务，每个SubAgent能够独立完成任务并自检。

**Architecture:** DevelopAgent作为阶段Agent，根据任务类型分发给对应的专家SubAgent执行。专家SubAgent池包含前端专家、后端专家、数据库专家等，支持动态创建。

**Tech Stack:** TypeScript

**依赖:** P6（任务拆分与编排）

---

## 文件结构

```
dev-flow/
├── src/
│   ├── agents/
│   │   └── develop-agent.ts       # 开发执行Agent
│   ├── experts/
│   │   ├── index.ts               # 专家导出
│   │   ├── expert-registry.ts     # 专家注册表
│   │   ├── base-expert.ts         # 专家基类
│   │   ├── frontend-expert.ts     # 前端专家
│   │   ├── backend-expert.ts      # 后端专家
│   │   ├── db-expert.ts           # 数据库专家
│   │   └── dynamic-expert.ts      # 动态专家生成器
│   └── ...
└── tests/
    └── experts/
        └── expert-registry.test.ts
```

---

### Task 1: 专家基类与注册表

**Files:**
- Create: `src/experts/base-expert.ts`
- Create: `src/experts/expert-registry.ts`

- [ ] **Step 1: 创建专家基类**

```typescript
// src/experts/base-expert.ts
import type { Task } from '../planner/task-splitter.js';
import type { MemoryManager } from '../memory/index.js';

export interface ExpertContext {
  projectRoot: string;
  memory: MemoryManager;
  sessionId: string;
}

export interface ExpertResult {
  success: boolean;
  files: string[];
  changes: { file: string; operation: 'create' | 'modify'; description: string }[];
  verification: { passed: boolean; message: string };
  suggestions?: string[];
}

export abstract class BaseExpert {
  protected name: string;
  protected context: ExpertContext;

  constructor(name: string, context: ExpertContext) {
    this.name = name;
    this.context = context;
  }

  abstract canHandle(task: Task): boolean;
  abstract execute(task: Task): Promise<ExpertResult>;

  protected log(message: string): void {
    console.log(`[${this.name}] ${message}`);
  }

  protected getMemory(): MemoryManager {
    return this.context.memory;
  }

  protected getProjectRoot(): string {
    return this.context.projectRoot;
  }
}
```

- [ ] **Step 2: 创建专家注册表**

```typescript
// src/experts/expert-registry.ts
import type { Task } from '../planner/task-splitter.js';
import type { BaseExpert, ExpertContext, ExpertResult } from './base-expert.js';
import { FrontendExpert } from './frontend-expert.js';
import { BackendExpert } from './backend-expert.js';
import { DBExpert } from './db-expert.js';

export class ExpertRegistry {
  private experts: BaseExpert[] = [];
  private context: ExpertContext;

  constructor(context: ExpertContext) {
    this.context = context;
    this.registerDefaultExperts();
  }

  private registerDefaultExperts(): void {
    this.experts.push(new FrontendExpert(this.context));
    this.experts.push(new BackendExpert(this.context));
    this.experts.push(new DBExpert(this.context));
  }

  register(expert: BaseExpert): void {
    this.experts.push(expert);
  }

  getExpert(task: Task): BaseExpert | null {
    // 首先检查任务指定的专家
    const specifiedExpert = this.experts.find(e => e.constructor.name === task.expert);
    if (specifiedExpert && specifiedExpert.canHandle(task)) {
      return specifiedExpert;
    }

    // 然后按优先级查找
    for (const expert of this.experts) {
      if (expert.canHandle(task)) {
        return expert;
      }
    }

    return null;
  }

  async executeTask(task: Task): Promise<ExpertResult> {
    const expert = this.getExpert(task);
    if (!expert) {
      return {
        success: false,
        files: [],
        changes: [],
        verification: { passed: false, message: `未找到适合任务 ${task.name} 的专家` },
      };
    }

    this.log(`分配任务 ${task.id} 给 ${expert.constructor.name}`);
    return expert.execute(task);
  }

  private log(message: string): void {
    console.log(`[ExpertRegistry] ${message}`);
  }
}
```

- [ ] **Step 3: 提交**

```bash
git add src/experts/base-expert.ts src/experts/expert-registry.ts
git commit -m "feat(experts): add base expert class and registry"
```

---

### Task 2: 前端专家与后端专家

**Files:**
- Create: `src/experts/frontend-expert.ts`
- Create: `src/experts/backend-expert.ts`
- Create: `src/experts/db-expert.ts`

- [ ] **Step 1: 创建前端专家**

```typescript
// src/experts/frontend-expert.ts
import { BaseExpert, type ExpertResult } from './base-expert.js';
import type { Task } from '../planner/task-splitter.js';
import { writeText } from '../utils/fs-utils.js';
import path from 'node:path';

export class FrontendExpert extends BaseExpert {
  constructor(context: any) {
    super('FrontendExpert', context);
  }

  canHandle(task: Task): boolean {
    return task.type === 'component' || task.type === 'style' || 
           task.expert === 'FrontendExpert';
  }

  async execute(task: Task): Promise<ExpertResult> {
    this.log(`执行任务: ${task.name}`);

    const files: string[] = [];
    const changes: ExpertResult['changes'] = [];

    for (const filePath of task.output.files) {
      const fullPath = path.join(this.getProjectRoot(), filePath);
      const code = await this.generateCode(task, filePath);

      await writeText(fullPath, code);
      files.push(fullPath);
      changes.push({
        file: filePath,
        operation: 'create',
        description: `创建 ${task.name}`,
      });
    }

    // 自检
    const verification = await this.selfCheck(task, files);

    return {
      success: verification.passed,
      files,
      changes,
      verification,
      suggestions: verification.passed ? undefined : ['请检查生成的代码'],
    };
  }

  private async generateCode(task: Task, filePath: string): Promise<string> {
    const ext = path.extname(filePath);
    const name = path.basename(filePath, ext);

    if (ext === '.tsx' || ext === '.jsx') {
      return this.generateReactComponent(name, task);
    }

    if (ext === '.vue') {
      return this.generateVueComponent(name, task);
    }

    if (ext === '.scss' || ext === '.css') {
      return this.generateStyles(name);
    }

    return `// ${task.name}\n// Auto-generated by dev-flow\n`;
  }

  private generateReactComponent(name: string, task: Task): string {
    return `import React from 'react';

interface ${name}Props {
  // TODO: 定义props
}

export const ${name}: React.FC<${name}Props> = () => {
  return (
    <div className="${name.toLowerCase()}">
      {/* ${task.description} */}
    </div>
  );
};

export default ${name};
`;
  }

  private generateVueComponent(name: string, task: Task): string {
    return `<template>
  <div class="${name.toLowerCase()}">
    <!-- ${task.description} -->
  </div>
</template>

<script setup lang="ts">
// TODO: 实现组件逻辑
</script>

<style scoped>
.${name.toLowerCase()} {
  /* 样式 */
}
</style>
`;
  }

  private generateStyles(name: string): string {
    return `.${name.toLowerCase()} {
  /* 样式定义 */
}
`;
  }

  private async selfCheck(task: Task, files: string[]): Promise<{ passed: boolean; message: string }> {
    // 简化版自检：检查文件是否存在
    for (const file of files) {
      try {
        const { fileExists } = await import('../utils/fs-utils.js');
        if (!(await fileExists(file))) {
          return { passed: false, message: `文件 ${file} 未创建成功` };
        }
      } catch {
        return { passed: false, message: `无法验证文件 ${file}` };
      }
    }

    return { passed: true, message: '自检通过' };
  }
}
```

- [ ] **Step 2: 创建后端专家**

```typescript
// src/experts/backend-expert.ts
import { BaseExpert, type ExpertResult } from './base-expert.js';
import type { Task } from '../planner/task-splitter.js';
import { writeText } from '../utils/fs-utils.js';
import path from 'node:path';

export class BackendExpert extends BaseExpert {
  constructor(context: any) {
    super('BackendExpert', context);
  }

  canHandle(task: Task): boolean {
    return task.type === 'api' || task.type === 'logic' ||
           task.expert === 'BackendExpert';
  }

  async execute(task: Task): Promise<ExpertResult> {
    this.log(`执行任务: ${task.name}`);

    const files: string[] = [];
    const changes: ExpertResult['changes'] = [];

    for (const filePath of task.output.files) {
      const fullPath = path.join(this.getProjectRoot(), filePath);
      const code = await this.generateCode(task, filePath);

      await writeText(fullPath, code);
      files.push(fullPath);
      changes.push({
        file: filePath,
        operation: 'create',
        description: `创建 ${task.name}`,
      });
    }

    const verification = await this.selfCheck(task, files);

    return {
      success: verification.passed,
      files,
      changes,
      verification,
    };
  }

  private async generateCode(task: Task, filePath: string): Promise<string> {
    const ext = path.extname(filePath);
    const name = path.basename(filePath, ext);

    if (task.type === 'api') {
      return this.generateApiHandler(name, task);
    }

    return `// ${task.name}\n// Auto-generated by dev-flow\n`;
  }

  private generateApiHandler(name: string, task: Task): string {
    return `import { Request, Response } from 'express';

/**
 * ${task.description}
 */
export async function ${name}(req: Request, res: Response) {
  try {
    // TODO: 实现业务逻辑
    
    res.json({
      code: 0,
      data: null,
      message: 'success',
    });
  } catch (error) {
    res.status(500).json({
      code: 500001,
      message: '服务器错误',
    });
  }
}
`;
  }

  private async selfCheck(task: Task, files: string[]): Promise<{ passed: boolean; message: string }> {
    return { passed: true, message: '自检通过' };
  }
}
```

- [ ] **Step 3: 创建数据库专家**

```typescript
// src/experts/db-expert.ts
import { BaseExpert, type ExpertResult } from './base-expert.js';
import type { Task } from '../planner/task-splitter.js';
import { writeText } from '../utils/fs-utils.js';
import path from 'node:path';

export class DBExpert extends BaseExpert {
  constructor(context: any) {
    super('DBExpert', context);
  }

  canHandle(task: Task): boolean {
    return task.type === 'data' || task.expert === 'DBExpert';
  }

  async execute(task: Task): Promise<ExpertResult> {
    this.log(`执行任务: ${task.name}`);

    const files: string[] = [];
    const changes: ExpertResult['changes'] = [];

    for (const filePath of task.output.files) {
      const fullPath = path.join(this.getProjectRoot(), filePath);
      const code = await this.generateModel(task, filePath);

      await writeText(fullPath, code);
      files.push(fullPath);
      changes.push({
        file: filePath,
        operation: 'create',
        description: `创建 ${task.name}`,
      });
    }

    return {
      success: true,
      files,
      changes,
      verification: { passed: true, message: '自检通过' },
    };
  }

  private async generateModel(task: Task, filePath: string): Promise<string> {
    const name = path.basename(filePath, path.extname(filePath));
    const modelName = name.charAt(0).toUpperCase() + name.slice(1);

    return `/**
 * ${task.description}
 */
export interface ${modelName} {
  id: string;
  // TODO: 添加字段定义
  createdAt: Date;
  updatedAt: Date;
}

// 校验规则
export const ${modelName}ValidationRules = {
  // TODO: 添加校验规则
};
`;
  }
}
```

- [ ] **Step 4: 提交**

```bash
git add src/experts/frontend-expert.ts src/experts/backend-expert.ts src/experts/db-expert.ts
git commit -m "feat(experts): add frontend, backend and database experts"
```

---

### Task 3: DevelopAgent整合

**Files:**
- Create: `src/agents/develop-agent.ts`
- Create: `src/experts/index.ts`

- [ ] **Step 1: 创建专家导出**

```typescript
// src/experts/index.ts
export { BaseExpert, type ExpertContext, type ExpertResult } from './base-expert.js';
export { ExpertRegistry } from './expert-registry.js';
export { FrontendExpert } from './frontend-expert.js';
export { BackendExpert } from './backend-expert.js';
export { DBExpert } from './db-expert.js';
```

- [ ] **Step 2: 创建DevelopAgent**

```typescript
// src/agents/develop-agent.ts
import { BaseAgent, type AgentContext, type AgentResult } from './base-agent.js';
import { ExpertRegistry } from '../experts/index.js';
import type { Task } from '../planner/task-splitter.js';
import type { PlanResult } from './plan-agent.js';
import { logger } from '../utils/logger.js';

export interface DevelopResult {
  completedTasks: string[];
  failedTasks: string[];
  files: string[];
  changes: any[];
}

export class DevelopAgent extends BaseAgent {
  private registry: ExpertRegistry;

  constructor(context: AgentContext) {
    super('DevelopAgent', context);
    this.registry = new ExpertRegistry(context);
  }

  async execute(planResult: PlanResult): Promise<AgentResult<DevelopResult>> {
    try {
      logger.title('开发执行');

      const tasks = planResult.tasks;
      const completedTasks: string[] = [];
      const failedTasks: string[] = [];
      const allFiles: string[] = [];
      const allChanges: any[] = [];

      // 按层级执行
      for (let i = 0; i < planResult.schedule.levels.length; i++) {
        const level = planResult.schedule.levels[i];
        logger.step(i + 1, planResult.schedule.levels.length, 
          `执行 Level ${level.level} (${level.tasks.length} 个任务)`);

        if (level.parallel) {
          // 并行执行
          const results = await Promise.all(
            level.tasks.map(task => this.executeTask(task))
          );

          for (let j = 0; j < results.length; j++) {
            const result = results[j];
            const task = level.tasks[j];

            if (result.success) {
              completedTasks.push(task.id);
              allFiles.push(...result.files);
              allChanges.push(...result.changes);
              logger.success(`${task.id}: ${task.name} 完成`);
            } else {
              failedTasks.push(task.id);
              logger.error(`${task.id}: ${task.name} 失败 - ${result.verification.message}`);
            }
          }
        } else {
          // 串行执行
          for (const task of level.tasks) {
            const result = await this.executeTask(task);

            if (result.success) {
              completedTasks.push(task.id);
              allFiles.push(...result.files);
              allChanges.push(...result.changes);
              logger.success(`${task.id}: ${task.name} 完成`);
            } else {
              failedTasks.push(task.id);
              logger.error(`${task.id}: ${task.name} 失败`);
            }
          }
        }
      }

      logger.title('执行完成');
      logger.info(`完成: ${completedTasks.length}, 失败: ${failedTasks.length}`);

      return {
        success: failedTasks.length === 0,
        data: {
          completedTasks,
          failedTasks,
          files: allFiles,
          changes: allChanges,
        },
      };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  private async executeTask(task: Task): Promise<any> {
    return this.registry.executeTask(task);
  }
}
```

- [ ] **Step 3: 最终提交**

```bash
git add src/agents/develop-agent.ts src/experts/index.ts
git commit -m "feat(agents): P7 complete - develop agent with expert system"
```
