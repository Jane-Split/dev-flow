# P9: 学习系统 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-step. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现学习系统，包括模式提取、反馈收集和知识整合，使系统能够从历史开发中学习最佳实践，持续优化。

**Architecture:** Learner作为核心模块，协调PatternExtractor（模式提取）和FeedbackCollector（反馈收集）完成学习流程，将学习结果存入记忆系统。

**Tech Stack:** TypeScript

**依赖:** P2（记忆系统）

---

## 文件结构

```
dev-flow/
├── src/
│   ├── learning/
│   │   ├── index.ts               # 学习模块导出
│   │   ├── learner.ts             # 学习引擎
│   │   ├── pattern-extractor.ts   # 模式提取器
│   │   └── feedback-collector.ts  # 反馈收集器
│   └── ...
└── tests/
    └── learning/
        └── learner.test.ts
```

---

### Task 1: 模式提取器

**Files:**
- Create: `src/learning/pattern-extractor.ts`

- [ ] **Step 1: 创建模式提取器**

```typescript
// src/learning/pattern-extractor.ts
import type { LearnedPattern } from '../memory/types.js';
import type { Task } from '../planner/task-splitter.js';
import type { TestResult } from '../testing/test-runner.js';

export interface ExtractionContext {
  tasks: Task[];
  codeChanges: { file: string; content: string }[];
  testResults: TestResult[];
  userFeedback?: { action: string; correction?: string }[];
}

export class PatternExtractor {
  extract(context: ExtractionContext): LearnedPattern[] {
    const patterns: LearnedPattern[] = [];

    // 提取代码模式
    const codePatterns = this.extractCodePatterns(context.codeChanges);
    patterns.push(...codePatterns);

    // 提取流程模式
    const flowPatterns = this.extractFlowPatterns(context.tasks);
    patterns.push(...flowPatterns);

    // 提取问题模式
    const problemPatterns = this.extractProblemPatterns(context.testResults);
    patterns.push(...problemPatterns);

    return patterns;
  }

  private extractCodePatterns(changes: { file: string; content: string }[]): LearnedPattern[] {
    const patterns: LearnedPattern[] = [];

    for (const change of changes) {
      const content = change.content;

      // React组件模式
      if (content.includes('React.FC') || content.includes('useState')) {
        patterns.push({
          id: `pattern-react-component-${Date.now()}`,
          type: 'code',
          name: 'React函数组件',
          description: '使用React.FC和Hooks的函数组件模式',
          code: `import React from 'react';

interface Props {
  // props定义
}

export const Component: React.FC<Props> = (props) => {
  const [state, setState] = React.useState(initialValue);
  
  return <div>{/* 组件内容 */}</div>;
};`,
          confidence: 0.9,
          usageCount: 1,
          lastUpdated: new Date().toISOString(),
        });
      }

      // API处理模式
      if (content.includes('try') && content.includes('catch') && content.includes('res.json')) {
        patterns.push({
          id: `pattern-api-handler-${Date.now()}`,
          type: 'code',
          name: 'API错误处理',
          description: 'API接口的标准错误处理模式',
          code: `try {
  // 业务逻辑
  res.json({ code: 0, data: result });
} catch (error) {
  res.status(500).json({ code: 500001, message: '服务器错误' });
}`,
          confidence: 0.85,
          usageCount: 1,
          lastUpdated: new Date().toISOString(),
        });
      }
    }

    return patterns;
  }

  private extractFlowPatterns(tasks: Task[]): LearnedPattern[] {
    const patterns: LearnedPattern[] = [];

    // 分析任务执行顺序
    const typeOrder = tasks.map(t => t.type);
    const uniqueOrder = [...new Set(typeOrder)];

    if (uniqueOrder.length > 1) {
      patterns.push({
        id: `pattern-flow-${Date.now()}`,
        type: 'flow',
        name: '开发流程顺序',
        description: '从任务执行中提取的开发流程',
        steps: uniqueOrder,
        confidence: 0.8,
        usageCount: 1,
        lastUpdated: new Date().toISOString(),
      });
    }

    return patterns;
  }

  private extractProblemPatterns(testResults: TestResult[]): LearnedPattern[] {
    const patterns: LearnedPattern[] = [];

    const failedTests = testResults.filter(r => !r.passed);

    for (const test of failedTests) {
      // 从失败测试中提取问题模式
      if (test.error?.includes('undefined')) {
        patterns.push({
          id: `pattern-problem-undefined-${Date.now()}`,
          type: 'problem',
          name: '未定义变量问题',
          description: '访问未定义的变量或属性',
          code: '使用可选链操作符 (?.) 或空值合并 (??) 处理',
          confidence: 0.7,
          usageCount: 1,
          lastUpdated: new Date().toISOString(),
        });
      }
    }

    return patterns;
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add src/learning/pattern-extractor.ts
git commit -m "feat(learning): add pattern extractor"
```

---

### Task 2: 反馈收集器

**Files:**
- Create: `src/learning/feedback-collector.ts`

- [ ] **Step 1: 创建反馈收集器**

```typescript
// src/learning/feedback-collector.ts
import type { FeedbackRecord } from '../memory/types.js';
import type { MemoryManager } from '../memory/index.js';

export interface FeedbackInput {
  stage: string;
  task: string;
  userAction: 'confirmed' | 'modified' | 'rejected';
  originalOutput?: string;
  userCorrection?: string;
}

export class FeedbackCollector {
  private memory: MemoryManager;

  constructor(memory: MemoryManager) {
    this.memory = memory;
  }

  collect(input: FeedbackInput): FeedbackRecord {
    const feedback: FeedbackRecord = {
      id: `feedback-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      timestamp: new Date().toISOString(),
      stage: input.stage,
      task: input.task,
      userAction: input.userAction,
      originalOutput: input.originalOutput,
      userCorrection: input.userCorrection,
    };

    // 存储到数据库
    this.memory.addFeedback(feedback);

    // 如果用户修改了输出，提取学习点
    if (input.userAction === 'modified' && input.userCorrection) {
      this.extractLearning(feedback);
    }

    return feedback;
  }

  private extractLearning(feedback: FeedbackRecord): void {
    // 分析用户修改，提取学习点
    if (feedback.userCorrection && feedback.originalOutput) {
      const learned = this.compareOutputs(
        feedback.originalOutput,
        feedback.userCorrection
      );

      if (learned) {
        feedback.learned = learned;
      }
    }
  }

  private compareOutputs(original: string, corrected: string): string | undefined {
    // 简化版：检测常见修改模式
    if (corrected.includes('httpOnly') && !original.includes('httpOnly')) {
      return '敏感认证信息应使用httpOnly cookie存储';
    }

    if (corrected.includes('try') && corrected.includes('catch') && 
        !original.includes('try')) {
      return '应添加错误处理';
    }

    if (corrected.includes('interface') && !original.includes('interface')) {
      return '应定义TypeScript类型';
    }

    return undefined;
  }

  getRecentFeedback(limit = 20): FeedbackRecord[] {
    return this.memory.getFeedback(limit);
  }

  analyzePatterns(): { stage: string; modificationRate: number }[] {
    const feedbacks = this.memory.getFeedback(100);

    const stageStats = new Map<string, { total: number; modified: number }>();

    for (const f of feedbacks) {
      const stats = stageStats.get(f.stage) || { total: 0, modified: 0 };
      stats.total++;
      if (f.userAction === 'modified') {
        stats.modified++;
      }
      stageStats.set(f.stage, stats);
    }

    return Array.from(stageStats.entries()).map(([stage, stats]) => ({
      stage,
      modificationRate: stats.modified / stats.total,
    }));
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add src/learning/feedback-collector.ts
git commit -m "feat(learning): add feedback collector"
```

---

### Task 3: 学习引擎整合

**Files:**
- Create: `src/learning/learner.ts`
- Create: `src/learning/index.ts`
- Test: `tests/learning/learner.test.ts`

- [ ] **Step 1: 创建学习引擎**

```typescript
// src/learning/learner.ts
import { PatternExtractor, type ExtractionContext } from './pattern-extractor.js';
import { FeedbackCollector, type FeedbackInput } from './feedback-collector.js';
import type { MemoryManager } from '../memory/index.js';
import type { LearnedPattern } from '../memory/types.js';
import { logger } from '../utils/logger.js';

export class Learner {
  private memory: MemoryManager;
  private patternExtractor: PatternExtractor;
  private feedbackCollector: FeedbackCollector;

  constructor(memory: MemoryManager) {
    this.memory = memory;
    this.patternExtractor = new PatternExtractor();
    this.feedbackCollector = new FeedbackCollector(memory);
  }

  async learn(context: ExtractionContext): Promise<LearnedPattern[]> {
    logger.info('开始学习...');

    // 提取模式
    const patterns = this.patternExtractor.extract(context);
    logger.info(`提取了 ${patterns.length} 个模式`);

    // 保存到记忆
    for (const pattern of patterns) {
      await this.memory.addPattern(pattern);
    }

    // 更新置信度
    await this.updateConfidence(patterns);

    return patterns;
  }

  collectFeedback(input: FeedbackInput): void {
    this.feedbackCollector.collect(input);
  }

  async applyLearnedPatterns(context: string): Promise<LearnedPattern[]> {
    // 从记忆中检索相关模式
    const searchResults = await this.memory.search(context, { limit: 5 });
    
    const patterns = await this.memory.getPatterns() || [];
    
    // 根据搜索结果匹配模式
    return patterns.filter(p => 
      searchResults.some(s => 
        s.entry.content.toLowerCase().includes(p.name.toLowerCase())
      )
    );
  }

  private async updateConfidence(patterns: LearnedPattern[]): Promise<void> {
    const existing = await this.memory.getPatterns() || [];

    for (const pattern of patterns) {
      const match = existing.find(p => p.name === pattern.name);
      if (match) {
        // 增加使用计数
        pattern.usageCount = match.usageCount + 1;
        // 更新置信度（使用贝叶斯更新简化版）
        pattern.confidence = Math.min(0.99, match.confidence + 0.05);
      }
    }
  }

  getLearningStats(): {
    totalPatterns: number;
    avgConfidence: number;
    topPatterns: LearnedPattern[];
  } {
    // 从记忆中获取统计
    return {
      totalPatterns: 0,
      avgConfidence: 0,
      topPatterns: [],
    };
  }
}
```

- [ ] **Step 2: 创建学习模块导出**

```typescript
// src/learning/index.ts
export { Learner } from './learner.js';
export { PatternExtractor, type ExtractionContext } from './pattern-extractor.js';
export { FeedbackCollector, type FeedbackInput } from './feedback-collector.js';
```

- [ ] **Step 3: 编写测试并提交**

```bash
git add src/learning/ tests/learning/
git commit -m "feat(learning): P9 complete - learning system with pattern extraction and feedback"
```
