import { BaseExpert, type ExpertResult } from './base-expert.js';
import type { Task } from '../planner/task-splitter.js';
export declare class FrontendExpert extends BaseExpert {
    constructor(context: any);
    canHandle(task: Task): boolean;
    execute(task: Task): Promise<ExpertResult>;
    private generateCode;
    private generateReactComponent;
    private generateVueComponent;
    private generateStyles;
    private selfCheck;
}
//# sourceMappingURL=frontend-expert.d.ts.map