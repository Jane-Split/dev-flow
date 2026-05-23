import { BaseExpert, type ExpertResult } from './base-expert.js';
import type { Task } from '../planner/task-splitter.js';
export declare class BackendExpert extends BaseExpert {
    constructor(context: any);
    canHandle(task: Task): boolean;
    execute(task: Task): Promise<ExpertResult>;
    private generateCode;
    private generateApiHandler;
    private selfCheck;
}
//# sourceMappingURL=backend-expert.d.ts.map