import { BaseExpert, type ExpertResult } from './base-expert.js';
import type { Task } from '../planner/task-splitter.js';
export declare class DBExpert extends BaseExpert {
    constructor(context: any);
    canHandle(task: Task): boolean;
    execute(task: Task): Promise<ExpertResult>;
    private generateModel;
}
//# sourceMappingURL=db-expert.d.ts.map