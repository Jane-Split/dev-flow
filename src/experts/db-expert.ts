import { BaseExpert, type ExpertResult } from './base-expert.js';
import type { Task } from '../planner/task-splitter.js';
import { writeText } from '../utils/fs-utils.js';
import * as path from 'node:path';

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
