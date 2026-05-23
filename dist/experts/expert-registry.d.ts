import type { Task } from '../planner/task-splitter.js';
import type { BaseExpert, ExpertContext, ExpertResult } from './base-expert.js';
export declare class ExpertRegistry {
    private experts;
    private context;
    constructor(context: ExpertContext);
    private registerDefaultExperts;
    register(expert: BaseExpert): void;
    getExpert(task: Task): BaseExpert | null;
    executeTask(task: Task): Promise<ExpertResult>;
    private log;
}
//# sourceMappingURL=expert-registry.d.ts.map