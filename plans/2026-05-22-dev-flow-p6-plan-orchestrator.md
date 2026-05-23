# P6: 任务拆分与编排 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现PlanAgent和Orchestrator，能够将设计文档拆分为独立的开发任务，构建任务依赖图，支持并行调度和进度追踪。

**Architecture:** PlanAgent负责将设计文档解析为任务列表，DependencyGraph构建任务依赖关系，Orchestrator作为主Agent协调整个流程的执行。

**Tech Stack:** TypeScript

**依赖:** P2（记忆系统）, P5（详细设计Agent）

---

## 文件结构

```
dev-flow/
├── src/
│   ├── agents/
│   │   ├── plan-agent.ts          # 任务拆分Agent
│   │   └── orchestrator.ts        # 主编排Agent
│   ├── planner/
│   │   ├── index.ts               # 计划器导出
│   │   ├── task-splitter.ts       # 任务拆分器
│   │   ├── dependency-graph.ts    # 依赖图
│   │   └── scheduler.ts           # 调度器
│   └── ...
└── tests/
    └── planner/
        ├── task-splitter.test.ts
        └── dependency-graph.test.ts
```

---

### Task 1: 任务定义与拆分器

**Files:**
- Create: `src/planner/task-splitter.ts`

- [ ] **Step 1: 创建任务拆分器**

```typescript
// src/planner/task-splitter.ts
import type { DesignResult } from '../agents/design-agent.js';

export interface Task {
  id: string;
  name: string;
  description: string;
  type: 'data' | 'api' | 'component' | 'logic' | 'style' | 'test';
  complexity: 'high' | 'medium' | 'low';
  dependencies: string[];
  context: {
    memoryKeys: string[];
    referenceFiles: string[];
    designSection: string;
  };
  expert: string;
  output: {
    files: string[];
    verification: string;
  };
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

export class TaskSplitter {
  split(designResult: DesignResult): Task[] {
    const tasks: Task[] = [];
    let taskId = 1;

    // 数据层任务
    for (const model of designResult.dataDesign.models) {
      tasks.push({
        id: `task-${taskId++}`,
        name: `创建${model.name}数据模型`,
        description: `定义${model.name}类型和校验规则`,
        type: 'data',
        complexity: 'low',
        dependencies: [],
        context: {
          memoryKeys: ['models'],
          referenceFiles: [],
          designSection: '数据层设计',
        },
        expert: 'BackendExpert',
        output: {
          files: [`src/types/${model.name.toLowerCase()}.ts`],
          verification: 'TypeScript编译通过',
        },
        status: 'pending',
      });
    }

    // API层任务
    for (const api of designResult.apiDesign.endpoints) {
      tasks.push({
        id: `task-${taskId++}`,
        name: `实现${api.method} ${api.path}接口`,
        description: api.description,
        type: 'api',
        complexity: 'medium',
        dependencies: tasks.filter(t => t.type === 'data').map(t => t.id),
        context: {
          memoryKeys: ['apis', 'models'],
          referenceFiles: [],
          designSection: '接口层设计',
        },
        expert: 'BackendExpert',
        output: {
          files: [`src/api/${api.path.split('/').pop()}.ts`],
          verification: '接口测试通过',
        },
        status: 'pending',
      });
    }

    // 组件层任务
    for (const component of designResult.componentDesign.components) {
      const deps = tasks
        .filter(t => t.type === 'api' && component.dependencies.some(d => 
          d.toLowerCase().includes('api') || d.toLowerCase().includes('service')
        ))
        .map(t => t.id);

      tasks.push({
        id: `task-${taskId++}`,
        name: `实现${component.name}组件`,
        description: component.description,
        type: 'component',
        complexity: component.type === 'page' ? 'high' : 'medium',
        dependencies: deps,
        context: {
          memoryKeys: ['components', 'styles'],
          referenceFiles: [],
          designSection: '组件层设计',
        },
        expert: 'FrontendExpert',
        output: {
          files: [component.path],
          verification: '组件渲染正常',
        },
        status: 'pending',
      });
    }

    return tasks;
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add src/planner/task-splitter.ts
git commit -m "feat(planner): add task splitter"
```

---

### Task 2: 依赖图与调度器

**Files:**
- Create: `src/planner/dependency-graph.ts`
- Create: `src/planner/scheduler.ts`

- [ ] **Step 1: 创建依赖图**

```typescript
// src/planner/dependency-graph.ts
import type { Task } from './task-splitter.js';

export interface ExecutionLevel {
  level: number;
  tasks: Task[];
  parallel: boolean;
}

export class DependencyGraph {
  private tasks: Map<string, Task>;
  private adjList: Map<string, string[]>;
  private inDegree: Map<string, number>;

  constructor(tasks: Task[]) {
    this.tasks = new Map(tasks.map(t => [t.id, t]));
    this.adjList = new Map();
    this.inDegree = new Map();

    this.buildGraph(tasks);
  }

  private buildGraph(tasks: Task[]): void {
    // 初始化
    for (const task of tasks) {
      this.adjList.set(task.id, []);
      this.inDegree.set(task.id, 0);
    }

    // 构建边
    for (const task of tasks) {
      for (const depId of task.dependencies) {
        this.adjList.get(depId)?.push(task.id);
        this.inDegree.set(task.id, (this.inDegree.get(task.id) || 0) + 1);
      }
    }
  }

  topologicalSort(): string[] {
    const result: string[] = [];
    const queue: string[] = [];
    const inDegree = new Map(this.inDegree);

    // 找出入度为0的节点
    for (const [id, degree] of inDegree) {
      if (degree === 0) {
        queue.push(id);
      }
    }

    while (queue.length > 0) {
      const id = queue.shift()!;
      result.push(id);

      for (const neighbor of this.adjList.get(id) || []) {
        inDegree.set(neighbor, (inDegree.get(neighbor) || 0) - 1);
        if (inDegree.get(neighbor) === 0) {
          queue.push(neighbor);
        }
      }
    }

    return result;
  }

  getExecutionLevels(): ExecutionLevel[] {
    const levels: ExecutionLevel[] = [];
    const inDegree = new Map(this.inDegree);
    let currentLevel = 0;

    while (inDegree.size > 0) {
      const levelTasks: Task[] = [];

      for (const [id, degree] of inDegree) {
        if (degree === 0) {
          levelTasks.push(this.tasks.get(id)!);
        }
      }

      if (levelTasks.length === 0) {
        throw new Error('检测到循环依赖');
      }

      levels.push({
        level: currentLevel,
        tasks: levelTasks,
        parallel: levelTasks.length > 1,
      });

      // 移除当前层节点，更新入度
      for (const task of levelTasks) {
        inDegree.delete(task.id);
        for (const neighbor of this.adjList.get(task.id) || []) {
          if (inDegree.has(neighbor)) {
            inDegree.set(neighbor, (inDegree.get(neighbor) || 0) - 1);
          }
        }
      }

      currentLevel++;
    }

    return levels;
  }

  getTask(id: string): Task | undefined {
    return this.tasks.get(id);
  }

  getDependencies(id: string): Task[] {
    const task = this.tasks.get(id);
    if (!task) return [];
    return task.dependencies.map(d => this.tasks.get(d)!).filter(Boolean);
  }

  getDependents(id: string): Task[] {
    const dependents: Task[] = [];
    for (const [taskId, deps] of this.adjList) {
      if (deps.includes(id)) {
        dependents.push(this.tasks.get(taskId)!);
      }
    }
    return dependents;
  }
}
```

- [ ] **Step 2: 创建调度器**

```typescript
// src/planner/scheduler.ts
import type { Task } from './task-splitter.js';
import { DependencyGraph, type ExecutionLevel } from './dependency-graph.js';

export interface ScheduleResult {
  levels: ExecutionLevel[];
  totalTasks: number;
  maxParallel: number;
  estimatedTime: number;
}

export class Scheduler {
  private maxParallel: number;

  constructor(maxParallel = 3) {
    this.maxParallel = maxParallel;
  }

  schedule(tasks: Task[]): ScheduleResult {
    const graph = new DependencyGraph(tasks);
    const levels = graph.getExecutionLevels();

    // 估算时间（简化版：每个任务30分钟）
    const estimatedTime = levels.reduce((sum, level) => {
      const levelTime = Math.ceil(level.tasks.length / this.maxParallel) * 30;
      return sum + levelTime;
    }, 0);

    return {
      levels,
      totalTasks: tasks.length,
      maxParallel: Math.min(
        this.maxParallel,
        Math.max(...levels.map(l => l.tasks.length))
      ),
      estimatedTime,
    };
  }

  getNextTasks(completedTasks: string[], allTasks: Task[]): Task[] {
    const completedSet = new Set(completedTasks);
    const ready: Task[] = [];

    for (const task of allTasks) {
      if (completedSet.has(task.id)) continue;
      
      const allDepsCompleted = task.dependencies.every(d => completedSet.has(d));
      if (allDepsCompleted) {
        ready.push(task);
      }
    }

    return ready.slice(0, this.maxParallel);
  }
}
```

- [ ] **Step 3: 提交**

```bash
git add src/planner/dependency-graph.ts src/planner/scheduler.ts
git commit -m "feat(planner): add dependency graph and scheduler"
```

---

### Task 3: PlanAgent与Orchestrator

**Files:**
- Create: `src/agents/plan-agent.ts`
- Create: `src/agents/orchestrator.ts`
- Create: `src/planner/index.ts`
- Test: `tests/planner/dependency-graph.test.ts`

- [ ] **Step 1: 创建计划器导出**

```typescript
// src/planner/index.ts
export { TaskSplitter, type Task } from './task-splitter.js';
export { DependencyGraph, type ExecutionLevel } from './dependency-graph.js';
export { Scheduler, type ScheduleResult } from './scheduler.js';
```

- [ ] **Step 2: 创建PlanAgent**

```typescript
// src/agents/plan-agent.ts
import { BaseAgent, type AgentContext, type AgentResult } from './base-agent.js';
import { TaskSplitter, Scheduler, type Task } from '../planner/index.js';
import type { DesignResult } from './design-agent.js';
import { logger } from '../utils/logger.js';
import { writeText } from '../utils/fs-utils.js';
import path from 'node:path';

export interface PlanResult {
  tasks: Task[];
  schedule: any;
  documentPath: string;
}

export class PlanAgent extends BaseAgent {
  constructor(context: AgentContext) {
    super('PlanAgent', context);
  }

  async execute(designResult: DesignResult): Promise<AgentResult<PlanResult>> {
    try {
      logger.title('任务拆分');

      // Step 1: 拆分任务
      logger.step(1, 3, '拆分开发任务...');
      const splitter = new TaskSplitter();
      const tasks = splitter.split(designResult);
      logger.success(`拆分出 ${tasks.length} 个任务`);

      // Step 2: 构建调度计划
      logger.step(2, 3, '构建执行计划...');
      const scheduler = new Scheduler(3);
      const schedule = scheduler.schedule(tasks);
      logger.success(`共 ${schedule.levels.length} 层，预计 ${schedule.estimatedTime} 分钟`);

      // Step 3: 生成计划文档
      logger.step(3, 3, '生成开发计划...');
      const documentPath = await this.generateDocument(tasks, schedule);
      logger.success(`计划已保存: ${documentPath}`);

      return {
        success: true,
        data: { tasks, schedule, documentPath },
        artifacts: [documentPath],
      };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  private async generateDocument(tasks: Task[], schedule: any): Promise<string> {
    const doc = `# 开发计划

## 任务概览
- 总任务数: ${tasks.length}
- 执行层数: ${schedule.levels.length}
- 最大并行数: ${schedule.maxParallel}
- 预计时间: ${schedule.estimatedTime} 分钟

## 执行计划
${schedule.levels.map((level: any) => `
### Level ${level.level} ${level.parallel ? '(并行)' : '(串行)'}
${level.tasks.map((t: Task) => `- [ ] ${t.id}: ${t.name} (${t.type}, ${t.complexity})`).join('\n')}
`).join('\n')}

## 任务详情
${tasks.map(t => `
### ${t.id}: ${t.name}
- **类型**: ${t.type}
- **复杂度**: ${t.complexity}
- **依赖**: ${t.dependencies.length > 0 ? t.dependencies.join(', ') : '无'}
- **专家**: ${t.expert}
- **输出文件**: ${t.output.files.join(', ')}
`).join('\n')}
`;

    const sessionsDir = path.join(this.getProjectRoot(), '.dev-flow', 'sessions');
    const docPath = path.join(sessionsDir, `plan-${Date.now()}.md`);
    await writeText(docPath, doc);
    return docPath;
  }
}
```

- [ ] **Step 3: 创建Orchestrator**

```typescript
// src/agents/orchestrator.ts
import type { MemoryManager } from '../memory/index.js';
import { ResearchAgent } from './research-agent.js';
import { AnalyzeAgent } from './analyze-agent.js';
import { DesignAgent } from './design-agent.js';
import { PlanAgent } from './plan-agent.js';
import { logger } from '../utils/logger.js';

export interface OrchestratorContext {
  projectRoot: string;
  memory: MemoryManager;
  sessionId: string;
}

export interface ExecutionOptions {
  stage?: 'research' | 'analyze' | 'design' | 'plan' | 'develop' | 'test' | 'fix';
  requirement?: string;
  refresh?: boolean;
  onStageComplete?: (stage: string, result: any) => Promise<boolean>;
}

export class Orchestrator {
  private context: OrchestratorContext;

  constructor(context: OrchestratorContext) {
    this.context = context;
  }

  async execute(options: ExecutionOptions): Promise<void> {
    const { stage, requirement, refresh, onStageComplete } = options;

    if (stage) {
      await this.executeStage(stage, requirement, refresh, onStageComplete);
    } else if (requirement) {
      await this.executeFullFlow(requirement, onStageComplete);
    } else {
      logger.error('请提供需求描述或指定阶段');
    }
  }

  private async executeStage(
    stage: string,
    requirement?: string,
    refresh?: boolean,
    onStageComplete?: (stage: string, result: any) => Promise<boolean>
  ): Promise<void> {
    switch (stage) {
      case 'research':
        await this.runResearch(refresh, onStageComplete);
        break;
      case 'analyze':
        if (!requirement) {
          logger.error('analyze阶段需要提供需求描述');
          return;
        }
        await this.runAnalyze(requirement, onStageComplete);
        break;
      case 'design':
        logger.warn('design阶段需要先执行analyze');
        break;
      case 'plan':
        logger.warn('plan阶段需要先执行design');
        break;
      default:
        logger.error(`未知阶段: ${stage}`);
    }
  }

  private async executeFullFlow(
    requirement: string,
    onStageComplete?: (stage: string, result: any) => Promise<boolean>
  ): Promise<void> {
    // Stage 1: Research
    const researchResult = await this.runResearch(false, onStageComplete);
    if (!researchResult?.success) return;
    if (onStageComplete && !(await onStageComplete('research', researchResult))) return;

    // Stage 2: Analyze
    const analyzeResult = await this.runAnalyze(requirement, onStageComplete);
    if (!analyzeResult?.success) return;
    if (onStageComplete && !(await onStageComplete('analyze', analyzeResult))) return;

    // Stage 3: Design
    const designResult = await this.runDesign(analyzeResult.data, onStageComplete);
    if (!designResult?.success) return;
    if (onStageComplete && !(await onStageComplete('design', designResult))) return;

    // Stage 4: Plan
    const planResult = await this.runPlan(designResult.data, onStageComplete);
    if (!planResult?.success) return;
    if (onStageComplete && !(await onStageComplete('plan', planResult))) return;

    // 后续阶段将在P7-P10实现
    logger.info('后续阶段（develop/test/fix）将在后续子计划中实现');
  }

  private async runResearch(
    refresh: boolean | undefined,
    onStageComplete?: (stage: string, result: any) => Promise<boolean>
  ): Promise<any> {
    const agent = new ResearchAgent(this.context);
    return agent.execute();
  }

  private async runAnalyze(
    requirement: string,
    onStageComplete?: (stage: string, result: any) => Promise<boolean>
  ): Promise<any> {
    const agent = new AnalyzeAgent(this.context);
    return agent.execute(requirement);
  }

  private async runDesign(
    analyzeResult: any,
    onStageComplete?: (stage: string, result: any) => Promise<boolean>
  ): Promise<any> {
    const agent = new DesignAgent(this.context);
    return agent.execute(analyzeResult);
  }

  private async runPlan(
    designResult: any,
    onStageComplete?: (stage: string, result: any) => Promise<boolean>
  ): Promise<any> {
    const agent = new PlanAgent(this.context);
    return agent.execute(designResult);
  }
}
```

- [ ] **Step 4: 编写测试并提交**

```bash
git add src/agents/plan-agent.ts src/agents/orchestrator.ts src/planner/index.ts tests/planner/
git commit -m "feat(agents): P6 complete - plan agent and orchestrator with dependency graph"
```
