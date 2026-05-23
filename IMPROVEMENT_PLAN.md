# dev-flow 改进方案文档

> 版本: v0.2.0 规划 | 日期: 2026-05-23

---

## 目录

- [第一部分：三个不适用场景的适配方案](#第一部分三个不适用场景的适配方案)
  - [场景一：全新架构设计](#场景一全新架构设计)
  - [场景二：复杂算法实现](#场景二复杂算法实现)
  - [场景三：紧急修复](#场景三紧急修复)
- [第二部分：改进优先级具体方案](#第二部分改进优先级具体方案)
  - [P1：阶段内并行执行](#p1阶段内并行执行)
  - [P2：Token 消耗优化](#p2token-消耗优化)
  - [P3：断点续传机制](#p3断点续传机制)
  - [P5：进度可视化](#p5进度可视化)

---

## 第一部分：三个不适用场景的适配方案

### 场景一：全新架构设计

**现状问题**：当前 DesignAgent 只能基于已有项目记忆进行设计，无法从零开始做架构决策（技术选型、分层策略、部署方案等）。

**适配方案：新增 ArchitectureAgent（P2.5 架构决策阶段）**

在 Research 和 Analyze 之间插入一个新的 `Architecture` 阶段，专门处理从零开始的架构设计：

```
Research → Architecture → Analyze → Design → Plan → Develop → Test → Fix
  调研  →   架构决策   →  分析  →  设计  → 拆分  →  开发  → 测试 → 修复
```

#### 核心设计

**新增文件**: `src/agents/architecture-agent.ts`

```typescript
interface ArchitectureResult {
  techDecisions: TechDecision[];     // 技术选型决策
  layerStrategy: LayerStrategy;       // 分层策略
  patterns: ArchitecturePattern[];   // 架构模式（MVC/微服务/单体等）
  deploymentPlan: DeploymentPlan;     // 部署方案
  tradeoffs: Tradeoff[];             // 权衡分析
  documentPath: string;
}

interface TechDecision {
  category: 'framework' | 'database' | 'cache' | 'queue' | 'auth' | 'monitoring';
  options: { name: string; pros: string[]; cons: string[]; score: number }[];
  recommended: string;
  rationale: string;
}

class ArchitectureAgent extends BaseAgent {
  async execute(requirement: string, analyzeResult?: AnalyzeResult): Promise<AgentResult<ArchitectureResult>>;
}
```

**执行流程**：

```
1. 需求规模评估
   ├── 用户规模预估（小型/中型/大型）
   ├── 数据量预估
   ├── 并发量预估
   └── 团队规模预估

2. 技术选型（基于需求匹配）
   ├── 框架选型（React/Vue/Svelte + Next.js/Nuxt/Astro）
   ├── 数据库选型（PostgreSQL/MySQL/MongoDB/SQLite）
   ├── 缓存方案（Redis/Memcached/无缓存）
   ├── 认证方案（JWT/OAuth2/Session）
   └── 部署方案（Docker/K8s/Vercel/自托管）

3. 架构模式选择
   ├── 单体应用（小型项目）
   ├── 前后端分离（中型项目）
   ├── 微服务（大型项目）
   └── Serverless（特定场景）

4. 分层设计
   ├── 目录结构定义
   ├── 模块边界划分
   ├── 数据流设计
   └── API 契约定义

5. 权衡分析
   ├── 性能 vs 开发效率
   ├── 复杂度 vs 可维护性
   ├── 成本 vs 功能
   └── 生成架构决策文档
```

**与现有系统的集成**：

- ArchitectureAgent 的输出写入 MemoryManager，后续 DesignAgent 可以读取
- 当 `memory.hasMemory()` 返回 false 时，自动触发 Architecture 阶段
- 当用户需求中包含 "新项目"、"从零开始" 等关键词时，自动触发
- 用户也可以手动指定：`/dev-flow -architecture`

**SKILL.md 更新**：

```markdown
## Stage 2.5: Architecture 架构决策（新项目自动触发）

### 触发条件
- 项目无记忆（首次使用）
- 需求包含"新项目"、"从零开始"、"架构设计"等关键词
- 用户手动指定 `-architecture`

### 执行步骤
1. 评估项目规模和约束条件
2. 生成 2-3 套技术方案（含优缺点和评分）
3. 等待用户选择或确认推荐方案
4. 输出架构决策文档到 .dev-flow/sessions/architecture-*.md
```

---

### 场景二：复杂算法实现

**现状问题**：当前 Expert 系统使用硬编码模板生成代码，无法处理复杂算法（排序、搜索、图论、动态规划等）。

**适配方案：新增 AlgorithmExpert + 分步推理机制**

#### 核心设计

**新增文件**: `src/experts/algorithm-expert.ts`

```typescript
class AlgorithmExpert extends BaseExpert {
  canHandle(task: Task): boolean {
    // 匹配算法类任务
    return task.type === 'algorithm' 
      || task.tags?.includes('algorithm')
      || /算法|排序|搜索|图论|动态规划|DP|递归|回溯|贪心/.test(task.description);
  }

  async execute(task: Task): Promise<ExpertResult> {
    // 分步推理生成算法代码
  }
}
```

**分步推理机制**（Chain-of-Thought）：

```
1. 问题分析
   ├── 识别算法类型（排序/搜索/图论/DP/贪心/分治）
   ├── 分析输入规模约束
   ├── 确定时间/空间复杂度要求
   └── 识别边界条件

2. 方案选择
   ├── 列举可行算法方案（至少2种）
   ├── 分析各方案复杂度
   ├── 选择最优方案
   └── 说明选择理由

3. 伪代码生成
   ├── 用自然语言描述算法步骤
   ├── 转换为伪代码
   └── 标注关键变量和不变量

4. 代码实现
   ├── 伪代码 → 目标语言代码
   ├── 添加详细注释（每步逻辑说明）
   ├── 处理边界条件
   └── 添加类型标注

5. 正确性验证
   ├── 手动推演 2-3 个测试用例
   ├── 验证时间/空间复杂度
   ├── 检查边界条件覆盖
   └── 生成单元测试
```

**与现有系统的集成**：

- 在 `ExpertRegistry` 构造函数中注册 `AlgorithmExpert`
- `TaskSplitter` 新增 `algorithm` 任务类型
- 当任务描述包含算法关键词时自动分配给 `AlgorithmExpert`

**SKILL.md 更新**：

```markdown
## AlgorithmExpert 算法专家

### 触发条件
- 任务描述包含：算法、排序、搜索、图论、动态规划、DP、递归、回溯、贪心等关键词
- 任务类型标记为 `algorithm`

### 执行策略
采用分步推理（Chain-of-Thought）：
1. 问题分析 → 2. 方案选择 → 3. 伪代码 → 4. 代码实现 → 5. 正确性验证

### 输出要求
- 代码必须包含详细注释（每步逻辑说明）
- 必须包含 3+ 个测试用例（含边界条件）
- 必须标注时间和空间复杂度
```

---

### 场景三：紧急修复

**现状问题**：完整流程需要 15-30 分钟，无法满足紧急修复场景（<5 分钟）。

**适配方案：新增 Hotfix 模式（快速修复通道）**

#### 核心设计

新增一条跳过 Research/Design/Plan 的快速通道：

```
完整流程:  Research → Analyze → Design → Plan → Develop → Test → Fix   (15-30分钟)
快速通道:  Hotfix-Analyze → Hotfix-Fix → Hotfix-Verify                  (3-5分钟)
```

**新增文件**: `src/agents/hotfix-agent.ts`

```typescript
interface HotfixResult {
  rootCause: string;           // 根因分析
  fixStrategy: string;         // 修复策略
  affectedFiles: string[];     // 受影响文件
  fix: {
    file: string;
    originalCode: string;      // 修改前
    fixedCode: string;         // 修改后
    explanation: string;       // 修改说明
  };
  verification: {
    steps: string[];           // 验证步骤
    expectedBehavior: string;  // 预期行为
  };
}

class HotfixAgent extends BaseAgent {
  async execute(errorDescription: string, errorLog?: string): Promise<AgentResult<HotfixResult>>;
}
```

**执行流程**：

```
1. 错误定位（30秒）
   ├── 解析错误描述/日志
   ├── 搜索相关代码文件
   ├── 定位错误源头
   └── 分析影响范围

2. 根因分析（30秒）
   ├── 判断错误类型（语法/逻辑/类型/依赖/配置）
   ├── 追溯调用链
   ├── 识别根本原因
   └── 评估修复风险

3. 生成修复（1-2分钟）
   ├── 生成最小化修复代码
   ├── 保持向后兼容
   ├── 添加防护性代码
   └── 生成回归测试

4. 验证修复（1分钟）
   ├── 执行回归测试
   ├── 检查副作用
   └── 输出修复报告
```

**与现有系统的集成**：

- `Orchestrator` 新增 `executeHotfix(errorDescription, errorLog)` 方法
- SKILL.md 新增命令格式：`/dev-flow -hotfix <错误描述>`
- 支持粘贴错误日志作为输入

**SKILL.md 更新**：

```markdown
## Hotfix 模式（紧急修复）

### 触发方式
/dev-flow -hotfix <错误描述>

### 可选输入
- 错误日志（直接粘贴）
- 报错截图描述
- 相关文件路径

### 执行流程（3-5分钟）
1. 错误定位 → 2. 根因分析 → 3. 生成修复 → 4. 验证修复

### 与完整流程的区别
- 跳过 Research/Design/Plan 阶段
- 直接定位问题并生成最小化修复
- 不生成完整的设计文档和测试套件
- 适合线上紧急问题修复
```

---

## 第二部分：改进优先级具体方案

### P1：阶段内并行执行

**现状问题**：7 个阶段严格串行执行，总耗时 15-30 分钟。

**目标**：将总耗时缩短 40-50%（至 8-15 分钟）。

#### 方案设计

**核心思路**：将无依赖关系的阶段并行执行，有依赖关系的阶段流水线化。

```
当前（串行）:
Research → Analyze → Design → Plan → Develop → Test → Fix
  2min      1min     2min    30s     10min    3min   3min = ~22min

优化后（并行+流水线）:
┌─ Research ─┐
│  (2min)    │
└────────────┘
     ↓
┌─ Analyze ──┐
│  (1min)    │
└────────────┘
     ↓
┌─ Design ────┐
│  (2min)     │
└─────────────┘
     ↓
┌─ Plan ─────┐
│  (30s)     │
└────────────┘
     ↓
┌─ Develop (并行执行) ─────────────────────────┐
│  Level 0: task-1 | task-2 | task-5 | task-6  │  ← 4个任务并行
│  Level 1: task-3 | task-4 | task-7           │  ← 3个任务并行
│  Level 2: task-8                            │  ← 1个任务
└──────────────────────────────────────────────┘
     ↓
┌─ Test + Fix (流水线) ──┐
│  test-1 → fix-1        │  ← 测试和修复流水线化
│  test-2 → fix-2        │
└────────────────────────┘
预估总耗时: ~12min（节省 45%）
```

**具体实现**：

**修改文件**: `src/agents/orchestrator.ts`

```typescript
class Orchestrator {
  // 新增：并行流水线模式
  async executePipeline(requirement: string): Promise<void> {
    // Phase 1: Research（必须先完成）
    const researchResult = await this.executeStage('research');
    
    // Phase 2: Analyze + Design 并行准备
    // Analyze 需要等待 Research，Design 需要等待 Analyze
    // 但 Design 的数据层设计可以和 Analyze 并行启动
    const [analyzeResult] = await Promise.all([
      this.executeStage('analyze', requirement),
    ]);
    
    // Phase 3: Design + Plan 流水线
    // Design 完成后立即开始 Plan，不等 Design 文档写入完成
    const designPromise = this.executeStage('design', analyzeResult);
    const planResult = await designPromise.then(design => 
      this.executeStage('plan', design)
    );
    
    // Phase 4: Develop 并行执行（已有，保持不变）
    await this.executeStage('develop');
    
    // Phase 5: Test + Fix 流水线
    // 每个测试用例完成后立即尝试修复，不等所有测试完成
    await this.executeTestFixPipeline();
  }
  
  // 新增：Test-Fix 流水线
  private async executeTestFixPipeline(): Promise<void> {
    const developResult = this.results.get('develop');
    const testCases = await generateTests(developResult);
    
    // 按批次执行测试和修复
    const BATCH_SIZE = 3;
    for (let i = 0; i < testCases.length; i += BATCH_SIZE) {
      const batch = testCases.slice(i, i + BATCH_SIZE);
      const results = await runTests(batch);
      const bugs = results.filter(r => !r.passed);
      
      if (bugs.length > 0) {
        await this.executeStage('fix', { bugs });
      }
    }
  }
}
```

**修改文件**: `src/planner/scheduler.ts`

```typescript
class Scheduler {
  // 新增：细粒度并行控制
  schedule(tasks: Task[]): ScheduleResult {
    const levels = this.dependencyGraph.getExecutionLevels();
    
    // 优化：同层级内按 expert 类型分组并行
    for (const level of levels) {
      const groups = this.groupByExpert(level.tasks);
      level.parallelGroups = groups;
      level.estimatedTime = this.calculateParallelTime(groups);
    }
    
    return { levels, ... };
  }
  
  private groupByExpert(tasks: Task[]): Map<string, Task[]> {
    // 同类型任务分组，减少上下文切换开销
    const groups = new Map();
    for (const task of tasks) {
      const key = task.expert;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(task);
    }
    return groups;
  }
}
```

**预期效果**：

| 指标 | 优化前 | 优化后 | 提升 |
|------|--------|--------|------|
| 总耗时 | 22分钟 | 12分钟 | 45% |
| Develop阶段 | 10分钟 | 6分钟 | 40% |
| Test+Fix阶段 | 6分钟 | 3分钟 | 50% |

---

### P2：Token 消耗优化

**现状问题**：完整流程消耗 30K-80K tokens，成本较高。

**目标**：将 Token 消耗降低 40-60%（至 15K-35K）。

#### 方案设计

**策略一：智能上下文压缩**

**修改文件**: `src/memory/context-compressor.ts`（新增）

```typescript
class ContextCompressor {
  /**
   * 将长文本压缩为关键信息摘要
   * 保留结构化信息，去除冗余描述
   */
  compress(content: string, maxTokens: number): string {
    // 1. 提取关键段落（标题、代码块、列表）
    const sections = this.extractKeySections(content);
    
    // 2. 对每个段落计算信息密度
    const scored = sections.map(s => ({
      content: s,
      score: this.calculateInformationDensity(s),
    }));
    
    // 3. 按信息密度排序，保留高密度内容
    scored.sort((a, b) => b.score - a.score);
    
    // 4. 截断到目标 token 数
    let result = '';
    let tokens = 0;
    for (const item of scored) {
      const itemTokens = this.estimateTokens(item.content);
      if (tokens + itemTokens > maxTokens) break;
      result += item.content + '\n';
      tokens += itemTokens;
    }
    
    return result;
  }
  
  private extractKeySections(content: string): string[] {
    // 提取 Markdown 标题、代码块、列表项
    const regex = /(?:^#{1,6}\s+.+$|```[\s\S]*?```|^\s*[-*]\s+.+$)/gm;
    return content.match(regex) || [content];
  }
  
  private calculateInformationDensity(text: string): number {
    // 信息密度 = 独特词汇数 / 总词汇数
    const words = text.split(/\s+/);
    const unique = new Set(words.map(w => w.toLowerCase()));
    return words.length > 0 ? unique.size / words.length : 0;
  }
}
```

**策略二：增量记忆加载**

**修改文件**: `src/memory/memory-manager.ts`

```typescript
class MemoryManager {
  // 新增：按需加载记忆，而非全量加载
  async getRelevantContext(query: string, maxTokens: number = 4000): Promise<MemoryChunk[]> {
    // 1. 向量搜索获取最相关的记忆片段
    const searchResults = await this.vectorIndex.search(query, limit: 20);
    
    // 2. 按相关性排序
    searchResults.sort((a, b) => b.score - a.score);
    
    // 3. 增量加载，直到达到 token 限制
    const chunks: MemoryChunk[] = [];
    let totalTokens = 0;
    
    for (const result of searchResults) {
      const content = await this.read(result.entry.id);
      const tokens = this.estimateTokens(content);
      
      if (totalTokens + tokens > maxTokens) {
        // 如果单个片段超过限制，进行压缩
        chunks.push({
          id: result.entry.id,
          content: this.compressor.compress(content, maxTokens - totalTokens),
          score: result.score,
        });
        break;
      }
      
      chunks.push({ id: result.entry.id, content, score: result.score });
      totalTokens += tokens;
    }
    
    return chunks;
  }
}
```

**策略三：阶段间摘要传递**

**修改文件**: `src/agents/orchestrator.ts`

```typescript
class Orchestrator {
  // 新增：阶段间传递摘要而非完整数据
  private generateStageSummary(stage: string, data: any): string {
    switch (stage) {
      case 'research':
        return `技术栈: ${data.projectMeta.techStack.framework}
组件数: ${data.components.length}
API数: ${data.apis.length}
规范数: ${data.conventions.length}`;
      
      case 'analyze':
        return `需求类型: ${data.type}
功能点: ${data.features.length}
影响文件: ${data.impacts.length}
风险: ${data.risks.length}`;
      
      case 'design':
        return `数据模型: ${data.dataDesign.models.length}
API端点: ${data.apiDesign.endpoints.length}
组件: ${data.componentDesign.components.length}
业务流程: ${data.logicDesign.flows.length}`;
      
      case 'plan':
        return `任务数: ${data.schedule.totalTasks}
执行层级: ${data.schedule.levels.length}
关键路径: ${data.schedule.criticalPath.map(t => t.name).join(' → ')}`;
      
      default:
        return JSON.stringify(data).slice(0, 500);
    }
  }
}
```

**策略四：任务合并**

**修改文件**: `src/planner/task-splitter.ts`

```typescript
class TaskSplitter {
  private mergeSmallTasks(tasks: Task[]): Task[] {
    // 将 <1000 token 的小任务合并
    const MERGE_THRESHOLD = 1000;
    const merged: Task[] = [];
    let buffer: Task[] = [];
    let bufferTokens = 0;
    
    for (const task of tasks) {
      const tokens = task.context.estimatedTokens || 500;
      
      if (bufferTokens + tokens < MERGE_THRESHOLD && buffer.length < 3) {
        buffer.push(task);
        bufferTokens += tokens;
      } else {
        if (buffer.length > 0) {
          merged.push(this.createMergedTask(buffer));
        }
        buffer = [task];
        bufferTokens = tokens;
      }
    }
    
    if (buffer.length > 0) {
      merged.push(this.createMergedTask(buffer));
    }
    
    return merged;
  }
  
  private createMergedTask(tasks: Task[]): Task {
    return {
      id: `task-merged-${tasks[0].id}`,
      name: tasks.map(t => t.name).join(' + '),
      description: tasks.map(t => t.description).join('\n'),
      type: tasks[0].type,
      complexity: 'medium',
      dependencies: [...new Set(tasks.flatMap(t => t.dependencies))],
      context: {
        memoryKeys: [...new Set(tasks.flatMap(t => t.context.memoryKeys))],
        referenceFiles: [...new Set(tasks.flatMap(t => t.context.referenceFiles))],
        designSection: tasks.map(t => t.context.designSection).join('\n'),
        estimatedTokens: tasks.reduce((sum, t) => sum + (t.context.estimatedTokens || 500), 0),
      },
      expert: tasks[0].expert,
      output: {
        files: [...new Set(tasks.flatMap(t => t.output.files))],
        verification: tasks.map(t => t.output.verification).join('\n'),
      },
      status: 'pending',
    };
  }
}
```

**预期效果**：

| 策略 | Token 节省 | 实现难度 |
|------|-----------|---------|
| 智能上下文压缩 | 20-30% | 中 |
| 增量记忆加载 | 15-25% | 低 |
| 阶段间摘要传递 | 10-15% | 低 |
| 任务合并 | 10-15% | 低 |
| **总计** | **40-60%** | — |

---

### P3：断点续传机制

**现状问题**：任务中断后需要从头开始，无法恢复。

**目标**：支持从任意阶段恢复执行。

#### 方案设计

**核心思路**：将会话状态持久化到 SQLite，恢复时从数据库加载。

**修改文件**: `src/agents/session-manager.ts`（新增）

```typescript
interface SessionState {
  id: string;
  requirement: string;
  currentStage: string;
  completedStages: string[];
  stageResults: Map<string, any>;
  taskStates: TaskState[];
  createdAt: string;
  updatedAt: string;
}

interface TaskState {
  taskId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  result?: any;
  startedAt?: string;
  completedAt?: string;
}

class SessionManager {
  constructor(dbStore: DbStore);
  
  /**
   * 保存当前会话状态（每个阶段完成后自动调用）
   */
  async saveState(session: SessionState): Promise<void>;
  
  /**
   * 加载最近的会话状态
   */
  async loadState(sessionId: string): Promise<SessionState | null>;
  
  /**
   * 列出所有可恢复的会话
   */
  async listResumableSessions(): Promise<SessionState[]>;
  
  /**
   * 从指定阶段恢复执行
   */
  async resume(sessionId: string, fromStage?: string): Promise<void>;
  
  /**
   * 检查是否有可恢复的会话
   */
  async hasResumableSession(): Promise<boolean>;
}
```

**修改文件**: `src/agents/orchestrator.ts`

```typescript
class Orchestrator {
  private sessionManager: SessionManager;
  
  // 新增：带断点续传的执行
  async executeWithResume(requirement: string): Promise<void> {
    // 1. 检查是否有可恢复的会话
    const existingSession = await this.sessionManager.hasResumableSession();
    
    if (existingSession) {
      // 2. 询问用户是否恢复
      const shouldResume = await this.promptResume(existingSession);
      
      if (shouldResume) {
        // 3. 从断点恢复
        return this.sessionManager.resume(existingSession.id);
      }
    }
    
    // 4. 全新执行
    return this.executePipeline(requirement);
  }
  
  // 修改：每个阶段完成后自动保存状态
  private async executeStage(stage: string, ...args: any[]): Promise<any> {
    // ... 执行阶段逻辑 ...
    
    // 自动保存状态
    await this.sessionManager.saveState({
      id: this.sessionId,
      requirement: this.requirement,
      currentStage: stage,
      completedStages: this.getCompletedStages(),
      stageResults: this.results,
      taskStates: this.getTaskStates(),
      createdAt: this.startTime,
      updatedAt: new Date().toISOString(),
    });
    
    return result;
  }
}
```

**修改文件**: `src/agents/develop-agent.ts`

```typescript
class DevelopAgent extends BaseAgent {
  // 修改：支持任务级断点续传
  async execute(): Promise<AgentResult<DevelopResult>> {
    // 1. 加载任务状态
    const taskStates = await this.loadTaskStates();
    
    // 2. 跳过已完成的任务
    const pendingTasks = this.planResult.schedule.levels
      .flatMap(l => l.tasks)
      .filter(t => {
        const state = taskStates.find(s => s.taskId === t.id);
        return !state || state.status !== 'completed';
      });
    
    // 3. 只执行未完成的任务
    for (const level of this.planResult.schedule.levels) {
      const pendingInLevel = level.tasks.filter(t => 
        pendingTasks.some(p => p.id === t.id)
      );
      
      if (pendingInLevel.length === 0) continue;
      
      // 执行未完成的任务...
    }
  }
}
```

**SKILL.md 更新**：

```markdown
## 断点续传

### 自动检测
- 每次执行前自动检测是否有未完成的会话
- 发现未完成会话时提示用户选择：恢复 or 重新开始

### 恢复命令
/dev-flow --resume          # 恢复最近的会话
/dev-flow --resume <id>     # 恢复指定会话

### 持久化内容
- 每个阶段的输入/输出
- 每个任务的执行状态
- 会话创建/更新时间
```

---

### P5：进度可视化

**现状问题**：用户无法直观看到执行进度和中间结果。

**目标**：提供实时进度展示和中间结果预览。

#### 方案设计

**核心思路**：生成 Markdown 格式的进度报告，每个阶段完成后更新。

**修改文件**: `src/utils/progress-reporter.ts`（新增）

```typescript
interface ProgressReport {
  sessionId: string;
  requirement: string;
  startTime: string;
  currentStage: string;
  stages: StageProgress[];
  tasks: TaskProgress[];
  tokenUsage: TokenUsage;
}

interface StageProgress {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: string;
  endTime?: string;
  duration?: number;
  artifacts?: string[];
  summary?: string;
}

interface TaskProgress {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  expert: string;
  level: number;
  files?: string[];
}

interface TokenUsage {
  estimated: number;
  actual?: number;
  byStage: Map<string, number>;
}

class ProgressReporter {
  private report: ProgressReport;
  
  constructor(sessionId: string, requirement: string);
  
  /**
   * 更新阶段状态
   */
  updateStage(stage: string, status: string, summary?: string): void;
  
  /**
   * 更新任务状态
   */
  updateTask(taskId: string, status: string, files?: string[]): void;
  
  /**
   * 渲染进度报告（Markdown 格式）
   */
  render(): string;
  
  /**
   * 保存进度报告到文件
   */
  save(projectRoot: string): string;
}
```

**进度报告输出示例**：

```markdown
# dev-flow 执行进度

## 📋 需求
实现用户登录功能，包含表单验证和记住密码

## ⏱️ 总进度: ████████████░░░░░░░░ 58% (4/7 阶段完成)
预计剩余时间: 8 分钟

## 📊 阶段详情

| 阶段 | 状态 | 耗时 | 产出 |
|------|------|------|------|
| 1. Research | ✅ 完成 | 1m 32s | 架构文档 |
| 2. Analyze | ✅ 完成 | 0m 45s | 需求文档 |
| 3. Design | ✅ 完成 | 1m 58s | 设计文档 |
| 4. Plan | ✅ 完成 | 0m 28s | 计划文档 |
| 5. Develop | 🔄 执行中 | 3m 12s | 5/8 任务完成 |
| 6. Test | ⏳ 等待中 | - | - |
| 7. Fix | ⏳ 等待中 | - | - |

## 📝 任务详情 (Develop 阶段)

### Level 0 (并行) - ✅ 完成
| 任务 | 专家 | 状态 | 文件 |
|------|------|------|------|
| task-1: 创建LoginParams | BackendExpert | ✅ | src/models/login.ts |
| task-2: 创建LoginResult | BackendExpert | ✅ | src/models/login.ts |
| task-5: LoginPage组件 | FrontendExpert | ✅ | src/pages/Login.tsx |
| task-6: LoginForm组件 | FrontendExpert | ✅ | src/components/LoginForm.tsx |

### Level 1 (并行) - 🔄 执行中
| 任务 | 专家 | 状态 | 文件 |
|------|------|------|------|
| task-3: POST /api/auth/login | BackendExpert | ✅ | src/api/auth.ts |
| task-4: POST /api/auth/logout | BackendExpert | 🔄 | - |
| task-7: LoginPage样式 | FrontendExpert | ⏳ | - |

## 💰 Token 消耗

| 阶段 | 预估 | 实际 |
|------|------|------|
| Research | 3,200 | 2,800 |
| Analyze | 5,000 | 4,500 |
| Design | 8,000 | 7,200 |
| Plan | 2,000 | 1,800 |
| Develop | 25,000 | 12,400 (进行中) |
| **总计** | **43,200** | **28,700** |

## 📁 产出文件
- .dev-flow/sessions/requirement-*.md
- .dev-flow/sessions/design-*.md
- .dev-flow/sessions/plan-*.md
- src/models/login.ts
- src/pages/Login.tsx
- src/components/LoginForm.tsx
- src/api/auth.ts
```

**与现有系统的集成**：

```typescript
// 修改 Orchestrator，在每个阶段开始/结束时更新进度
class Orchestrator {
  private reporter: ProgressReporter;
  
  async executeFullFlow(requirement: string): Promise<void> {
    this.reporter = new ProgressReporter(this.sessionId, requirement);
    
    for (const stage of STAGES) {
      // 开始阶段
      this.reporter.updateStage(stage, 'running');
      
      // 执行阶段
      const result = await this.executeStage(stage);
      
      // 完成阶段
      this.reporter.updateStage(stage, 'completed', result.summary);
      
      // 保存进度报告
      this.reporter.save(this.projectRoot);
    }
  }
}
```

**SKILL.md 更新**：

```markdown
## 进度可视化

### 自动生成
- 每个阶段完成后自动更新进度报告
- 报告保存在 .dev-flow/sessions/progress-<sessionId>.md

### 查看进度
/dev-flow --progress          # 查看当前执行进度
/dev-flow --progress --watch  # 实时监控进度

### 进度信息
- 总体进度百分比和预估剩余时间
- 每个阶段的状态和耗时
- 每个任务的执行状态和产出文件
- Token 消耗统计
```

---

## 实施路线图

| 优先级 | 方案 | 预估工作量 | 依赖 |
|--------|------|-----------|------|
| **P1** | 阶段内并行执行 | 3天 | 无 |
| **P2** | Token 消耗优化 | 4天 | 无 |
| **P3** | 断点续传机制 | 3天 | 无 |
| **场景1** | ArchitectureAgent | 5天 | P2（需要上下文压缩） |
| **场景2** | AlgorithmExpert | 3天 | 无 |
| **场景3** | Hotfix 模式 | 2天 | 无 |
| **P5** | 进度可视化 | 2天 | 无 |

**建议实施顺序**：P1 → P2 → P3 → 场景3 → 场景2 → P5 → 场景1

**预计总工作量**：22天
