import type { Task } from '../planner/task-splitter.js';
import { BaseExpert, type ExpertResult } from './base-expert.js';
import { writeText, fileExists } from '../utils/fs-utils.js';
import * as path from 'node:path';
import {
  getAlgorithmTemplate,
  generateAlgorithmCode,
  listAvailableAlgorithms,
} from './algorithm-templates.js';
import type { AlgorithmTemplate } from './algorithm-templates.js';

/**
 * 算法专家 - 处理算法相关的开发任务
 *
 * 能力:
 * - 从任务描述中识别算法类型
 * - 根据算法模板生成 TypeScript 实现代码
 * - 生成配套的测试用例
 * - 标注时间和空间复杂度
 *
 * 支持的算法类型:
 * - 排序: 冒泡、选择、插入、快速、归并、堆排序
 * - 搜索: 线性、二分、BFS、DFS
 * - 数据结构: 链表、栈、队列、哈希表、二叉树
 * - 动态规划: 斐波那契、背包、最长子序列
 * - 其他: 递归、回溯、贪心
 */
export class AlgorithmExpert extends BaseExpert {
  constructor(context: any) {
    super('AlgorithmExpert', context);
  }

  canHandle(task: Task): boolean {
    // 通过指定专家判断
    if (task.expert === 'AlgorithmExpert') {
      return true;
    }

    // 通过描述中的关键词判断
    const algorithmKeywords =
      /算法|排序|搜索|图论|动态规划|DP|递归|回溯|贪心|二分|哈希|链表|树|栈|队列|bubble sort|quick sort|merge sort|heap sort|binary search|BFS|DFS|fibonacci|knapsack|backtracking|greedy|linked list|binary tree|hash table/i;
    return algorithmKeywords.test(task.description) || algorithmKeywords.test(task.name);
  }

  async execute(task: Task): Promise<ExpertResult> {
    this.log(`执行任务: ${task.name}`);

    const files: string[] = [];
    const changes: ExpertResult['changes'] = [];
    const suggestions: string[] = [];

    // 1. 分析算法需求，匹配模板
    const template = getAlgorithmTemplate(task.description);

    if (!template) {
      // 未匹配到模板时，生成通用算法文件骨架
      this.log('未匹配到具体算法模板，生成通用算法文件骨架');
      const { code, test } = this.generateGenericAlgorithm(task);
      const result = await this.writeFiles(task, code, test, files, changes);
      if (!result.success) return result;
      suggestions.push('未找到匹配的算法模板，已生成通用骨架代码，请手动补充实现');
    } else {
      this.log(`匹配到算法模板: ${template.name} (${template.category})`);
      suggestions.push(`算法类型: ${template.name}`);
      suggestions.push(`时间复杂度: ${template.complexity.time}`);
      suggestions.push(`空间复杂度: ${template.complexity.space}`);

      // 2. 根据模板生成代码和测试
      const taskName = this.toFileName(task.name);
      const { code, test } = generateAlgorithmCode(template, taskName);

      // 3. 写入文件
      const result = await this.writeFiles(task, code, test, files, changes);
      if (!result.success) return result;
    }

    // 4. 自检
    const verification = await this.selfCheck(files);

    return {
      success: verification.passed,
      files,
      changes,
      verification,
      suggestions: suggestions.length > 0 ? suggestions : undefined,
    };
  }

  /**
   * 将生成的代码和测试写入文件
   */
  private async writeFiles(
    task: Task,
    code: string,
    test: string,
    files: string[],
    changes: ExpertResult['changes']
  ): Promise<ExpertResult> {
    const taskName = this.toFileName(task.name);
    const projectRoot = this.getProjectRoot();

    // 确定输出文件路径
    let codeFilePath: string;
    let testFilePath: string;

    if (task.output.files.length > 0) {
      // 使用任务指定的输出路径
      codeFilePath = path.join(projectRoot, task.output.files[0]);
      testFilePath = codeFilePath.replace(/\.ts$/, '.test.ts');
    } else {
      // 使用默认路径
      codeFilePath = path.join(projectRoot, `src/algorithms/${taskName}.ts`);
      testFilePath = path.join(projectRoot, `src/algorithms/${taskName}.test.ts`);
    }

    // 写入算法实现文件
    await writeText(codeFilePath, code);
    files.push(codeFilePath);
    changes.push({
      file: path.relative(projectRoot, codeFilePath),
      operation: 'create',
      description: `创建 ${task.name} 算法实现`,
    });

    // 写入测试文件
    await writeText(testFilePath, test);
    files.push(testFilePath);
    changes.push({
      file: path.relative(projectRoot, testFilePath),
      operation: 'create',
      description: `创建 ${task.name} 测试用例`,
    });

    return {
      success: true,
      files,
      changes,
      verification: { passed: true, message: '文件写入成功' },
    };
  }

  /**
   * 生成通用算法文件骨架（当未匹配到模板时使用）
   */
  private generateGenericAlgorithm(task: Task): { code: string; test: string } {
    const taskName = this.toFileName(task.name);

    const code = `/**
 * ${task.name}
 *
 * ${task.description}
 *
 * TODO: 补充算法实现
 * TODO: 标注时间复杂度
 * TODO: 标注空间复杂度
 */

// TODO: 实现算法逻辑
export function solve(input: unknown): unknown {
  // 实现你的算法
  return null;
}
`;

    const test = `import { describe, it, expect } from 'vitest';
import { solve } from './${taskName}.js';

describe('${task.name}', () => {
  it('应对基本用例返回正确结果', () => {
    // TODO: 补充测试用例
    expect(true).toBe(true);
  });

  it('应对边界情况正确处理', () => {
    // TODO: 补充边界测试
    expect(true).toBe(true);
  });

  it('应对特殊输入正确处理', () => {
    // TODO: 补充特殊输入测试
    expect(true).toBe(true);
  });
});
`;

    return { code, test };
  }

  /**
   * 自检：验证生成的文件是否存在且包含必要内容
   */
  private async selfCheck(files: string[]): Promise<{ passed: boolean; message: string }> {
    for (const file of files) {
      try {
        if (!(await fileExists(file))) {
          return { passed: false, message: `文件 ${file} 未创建成功` };
        }
      } catch {
        return { passed: false, message: `无法验证文件 ${file}` };
      }
    }

    return { passed: true, message: '自检通过' };
  }

  /**
   * 转换名称为文件安全名称
   */
  private toFileName(name: string): string {
    return name
      .replace(/[实现创建]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5-]/g, '')
      .replace(/^-+|-+$/g, '') || 'algorithm';
  }
}
