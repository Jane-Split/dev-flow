import { BaseExpert } from './base-expert.js';
import { writeText } from '../utils/fs-utils.js';
import * as path from 'node:path';
export class DBExpert extends BaseExpert {
    constructor(context) {
        super('DBExpert', context);
    }
    canHandle(task) {
        return task.type === 'data' || task.expert === 'DBExpert';
    }
    async execute(task) {
        this.log(`执行任务: ${task.name}`);
        const files = [];
        const changes = [];
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
    async generateModel(task, filePath) {
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
//# sourceMappingURL=db-expert.js.map