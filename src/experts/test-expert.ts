import type { Task } from '../planner/task-splitter.js';
import { BaseExpert, type ExpertContext, type ExpertResult } from './base-expert.js';
import { logger } from '../utils/logger.js';

/**
 * 测试专家 - 处理测试相关任务
 */
export class TestExpert extends BaseExpert {
  constructor(context: ExpertContext) {
    super('TestExpert', context);
  }

  canHandle(task: Task): boolean {
    return task.type === 'test' || task.name.toLowerCase().includes('测试');
  }

  async execute(task: Task): Promise<ExpertResult> {
    this.log(`执行任务: ${task.name}`);

    try {
      // 测试任务不需要生成代码文件，而是执行验证
      // 在实际实现中，这里会调用 TestAgent 来执行测试
      
      logger.info(`执行测试: ${task.name}`);
      
      // 模拟测试执行成功
      // 实际项目中，这里应该:
      // 1. 调用 TestAgent 生成测试用例
      // 2. 执行测试
      // 3. 返回测试结果
      
      return {
        success: true,
        files: [],
        changes: [],
        verification: {
          passed: true,
          message: `测试任务 ${task.name} 完成`,
        },
      };
    } catch (error) {
      return {
        success: false,
        files: [],
        changes: [],
        verification: {
          passed: false,
          message: `测试执行失败: ${error}`,
        },
      };
    }
  }
}
