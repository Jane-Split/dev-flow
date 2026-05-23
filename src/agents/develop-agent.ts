import { BaseAgent, type AgentContext, type AgentResult } from './base-agent.js';
import { ExpertRegistry } from '../experts/index.js';
import type { Task } from '../planner/task-splitter.js';
import type { PlanResult } from './plan-agent.js';
import { logger } from '../utils/logger.js';

export interface DevelopResult {
  completedTasks: Task[];
  failedTasks: string[];
  files: string[];
  changes: any[];
}

export class DevelopAgent extends BaseAgent {
  private registry: ExpertRegistry;
  private planResult?: PlanResult;

  constructor(context: AgentContext) {
    super('DevelopAgent', context);
    this.registry = new ExpertRegistry(context);
  }

  /**
   * 设置执行计划
   */
  setPlan(planResult: PlanResult): void {
    this.planResult = planResult;
  }

  async execute(): Promise<AgentResult<DevelopResult>> {
    try {
      if (!this.planResult) {
        return { success: false, error: '未设置执行计划，请先调用 setPlan()' };
      }

      logger.title('开发执行');

      const tasks = this.planResult.tasks;
      const completedTasks: Task[] = [];
      const failedTasks: string[] = [];
      const allFiles: string[] = [];
      const allChanges: any[] = [];

      // 按层级执行
      for (let i = 0; i < this.planResult.schedule.levels.length; i++) {
        const level = this.planResult.schedule.levels[i];
        logger.step(i + 1, this.planResult.schedule.levels.length, 
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
              completedTasks.push(task);
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
              completedTasks.push(task);
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
