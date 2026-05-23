import type { MemoryManager } from '../memory/index.js';
export interface OrchestratorContext {
    projectRoot: string;
    memory: MemoryManager;
    sessionId: string;
}
export interface ExecutionOptions {
    stage?: 'research' | 'analyze' | 'design' | 'plan' | 'develop' | 'test' | 'fix';
    requirement?: string;
    refresh?: boolean;
    onStageComplete?: (stage: string, result: any) => Promise<boolean>;
}
export declare class Orchestrator {
    private context;
    private results;
    constructor(context: OrchestratorContext);
    execute(options: ExecutionOptions): Promise<void>;
    private executeStage;
    private executeFullFlow;
    private confirmStage;
    getResult(stage: string): any;
    getAllResults(): Map<string, any>;
}
//# sourceMappingURL=orchestrator.d.ts.map