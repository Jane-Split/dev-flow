// src/learning/pattern-extractor.ts
import type { LearnedPattern } from '../memory/types.js';
import type { Task } from '../planner/task-splitter.js';

// 测试结果类型定义（因为 testing 模块不存在，在此定义）
export interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

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
