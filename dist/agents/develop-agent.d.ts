import { BaseAgent, type AgentContext, type AgentResult } from './base-agent.js';
import type { Task } from '../planner/task-splitter.js';
import type { PlanResult } from './plan-agent.js';
export interface DevelopResult {
    completedTasks: Task[];
    failedTasks: string[];
    files: string[];
    changes: any[];
}
export declare class DevelopAgent extends BaseAgent {
    private registry;
    private planResult?;
    constructor(context: AgentContext);
    /**
     * 设置执行计划
     */
    setPlan(planResult: PlanResult): void;
    execute(): Promise<AgentResult<DevelopResult>>;
    private executeTask;
}
//# sourceMappingURL=develop-agent.d.ts.map