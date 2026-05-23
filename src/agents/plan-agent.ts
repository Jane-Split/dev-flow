/**
 * PlanAgent - 任务拆分Agent
 *
 * 负责将设计文档拆分为独立的开发任务，构建执行计划
 */

import { BaseAgent, type AgentContext, type AgentResult } from './base-agent.js';
import { TaskSplitter, Scheduler, type Task, type ScheduleResult, type DesignResult } from '../planner/index.js';
import { logger } from '../utils/logger.js';
import { writeText, ensureDir } from '../utils/fs-utils.js';
import path from 'node:path';

/**
 * 计划结果
 */
export interface PlanResult {
  tasks: Task[];
  schedule: ScheduleResult;
  documentPath: string;
}

/**
 * 计划Agent
 *
 * 将设计文档转换为可执行的任务计划
 */
export class PlanAgent extends BaseAgent {
  constructor(context: AgentContext) {
    super('PlanAgent', context);
  }

  /**
   * 执行计划生成
   */
  async execute(designResult: DesignResult): Promise<AgentResult<PlanResult>> {
    try {
      logger.title('任务拆分');

      // Step 1: 拆分任务
      logger.step(1, 3, '拆分开发任务...');
      const splitter = new TaskSplitter();
      const splitResult = splitter.split(designResult);
      
      if (splitResult.warnings.length > 0) {
        logger.warn('任务拆分警告:');
        for (const warning of splitResult.warnings) {
          logger.warn(`  - ${warning}`);
        }
      }
      
      logger.success(`拆分出 ${splitResult.tasks.length} 个任务`);

      // Step 2: 构建调度计划
      logger.step(2, 3, '构建执行计划...');
      const scheduler = new Scheduler({ maxParallel: 3 });
      const schedule = scheduler.schedule(splitResult.tasks);
      
      logger.success(`共 ${schedule.levels.length} 个执行层级，预计 ${schedule.estimatedTime} 分钟`);
      
      // 显示并行信息
      const parallelLevels = schedule.levels.filter(l => l.parallel);
      if (parallelLevels.length > 0) {
        logger.info(`其中 ${parallelLevels.length} 个层级支持并行执行`);
      }

      // Step 3: 生成计划文档
      logger.step(3, 3, '生成开发计划文档...');
      const documentPath = await this.generateDocument(splitResult.tasks, schedule);
      logger.success(`计划文档已保存: ${documentPath}`);

      return {
        success: true,
        data: { 
          tasks: splitResult.tasks, 
          schedule, 
          documentPath 
        },
        artifacts: [documentPath],
      };
    } catch (error) {
      logger.error(`计划生成失败: ${error}`);
      return { 
        success: false, 
        error: String(error) 
      };
    }
  }

  /**
   * 生成计划文档
   */
  private async generateDocument(tasks: Task[], schedule: ScheduleResult): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    const doc = `# 开发计划

生成时间: ${new Date().toLocaleString()}

## 概览

| 指标 | 数值 |
|------|------|
| 总任务数 | ${schedule.totalTasks} |
| 执行层级 | ${schedule.levels.length} |
| 最大并行数 | ${schedule.maxParallel} |
| 预估时间 | ${schedule.estimatedTime} 分钟 |

## 执行计划

${schedule.levels.map((level) => `
### Level ${level.level} ${level.parallel ? '(可并行)' : '(串行)'}

${level.tasks.map((t) => `- [ ] **${t.id}**: ${t.name} 
  - 类型: ${t.type} | 复杂度: ${t.complexity} | 专家: ${t.expert}`).join('\n')}
`).join('\n')}

## 关键路径

${schedule.criticalPath.map((t, i) => `${i + 1}. ${t.name} (${t.complexity})`).join('\n')}

## 任务详情

${tasks.map((t) => `
### ${t.id}: ${t.name}

| 属性 | 值 |
|------|-----|
| **类型** | ${t.type} |
| **复杂度** | ${t.complexity} |
| **依赖** | ${t.dependencies.length > 0 ? t.dependencies.join(', ') : '无'} |
| **专家** | ${t.expert} |
| **输出文件** | ${t.output.files.join(', ')} |
| **验证标准** | ${t.output.verification} |

**描述**: ${t.description}

**上下文**:
- 记忆键: ${t.context.memoryKeys.join(', ')}
- 设计章节: ${t.context.designSection}
${t.context.estimatedTokens ? `- 预估Tokens: ${t.context.estimatedTokens}` : ''}
`).join('\n')}

## 统计信息

### 按类型分布
${this.getTypeDistribution(tasks)}

### 按复杂度分布
${this.getComplexityDistribution(tasks)}

### 按专家分布
${this.getExpertDistribution(tasks)}
`;

    const sessionsDir = path.join(this.getProjectRoot(), '.dev-flow', 'sessions');
    await ensureDir(sessionsDir);
    const docPath = path.join(sessionsDir, `plan-${timestamp}.md`);
    await writeText(docPath, doc);
    return docPath;
  }

  /**
   * 获取类型分布统计
   */
  private getTypeDistribution(tasks: Task[]): string {
    const distribution = new Map<string, number>();
    for (const task of tasks) {
      distribution.set(task.type, (distribution.get(task.type) || 0) + 1);
    }
    
    return Array.from(distribution.entries())
      .map(([type, count]) => `- ${type}: ${count}`)
      .join('\n');
  }

  /**
   * 获取复杂度分布统计
   */
  private getComplexityDistribution(tasks: Task[]): string {
    const distribution = new Map<string, number>();
    for (const task of tasks) {
      distribution.set(task.complexity, (distribution.get(task.complexity) || 0) + 1);
    }
    
    return Array.from(distribution.entries())
      .map(([complexity, count]) => `- ${complexity}: ${count}`)
      .join('\n');
  }

  /**
   * 获取专家分布统计
   */
  private getExpertDistribution(tasks: Task[]): string {
    const distribution = new Map<string, number>();
    for (const task of tasks) {
      distribution.set(task.expert, (distribution.get(task.expert) || 0) + 1);
    }
    
    return Array.from(distribution.entries())
      .map(([expert, count]) => `- ${expert}: ${count}`)
      .join('\n');
  }

  /**
   * 验证任务计划
   */
  validatePlan(tasks: Task[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const taskIds = new Set(tasks.map(t => t.id));

    for (const task of tasks) {
      // 检查依赖是否存在
      for (const depId of task.dependencies) {
        if (!taskIds.has(depId)) {
          errors.push(`任务 ${task.id} 依赖不存在的任务: ${depId}`);
        }
      }

      // 检查上下文限制
      if (task.context.estimatedTokens && task.context.estimatedTokens > 8000) {
        errors.push(`任务 ${task.id} 预估上下文超过8000 tokens`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
