import type { MemoryManager } from '../memory/index.js';
export interface OrchestratorContext {
    projectRoot: string;
    memory: MemoryManager;
    sessionId: string;
}
export interface ExecutionOptions {
    stage?: 'research' | 'architecture' | 'analyze' | 'design' | 'plan' | 'develop' | 'test' | 'fix' | 'hotfix';
    requirement?: string;
    refresh?: boolean;
    resume?: boolean;
    onStageComplete?: (stage: string, result: any) => Promise<boolean>;
}
export declare class Orchestrator {
    private context;
    private results;
    private sessionManager;
    private reporter;
    constructor(context: OrchestratorContext);
    execute(options: ExecutionOptions): Promise<void>;
    private resumeSession;
    private executeStage;
    private executeFullFlow;
    private confirmStage;
    getResult(stage: string): any;
    getAllResults(): Map<string, any>;
}
//# sourceMappingURL=orchestrator.d.ts.map