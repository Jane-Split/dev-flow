import type { Task } from '../planner/task-splitter.js';
import { BaseExpert, type ExpertContext, type ExpertResult } from './base-expert.js';
/**
 * 测试专家 - 处理测试相关任务
 */
export declare class TestExpert extends BaseExpert {
    constructor(context: ExpertContext);
    canHandle(task: Task): boolean;
    execute(task: Task): Promise<ExpertResult>;
}
//# sourceMappingURL=test-expert.d.ts.map