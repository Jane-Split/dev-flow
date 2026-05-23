import { BaseAgent, type AgentContext, type AgentResult } from './base-agent.js';
import { type ErrorType, type Fix } from './hotfix-analyzer.js';
export interface HotfixResult {
    rootCause: string;
    errorType: ErrorType;
    affectedFiles: string[];
    fixes: Fix[];
    verification: {
        steps: string[];
        expectedBehavior: string;
    };
}
export declare class HotfixAgent extends BaseAgent {
    constructor(context: AgentContext);
    execute(errorDescription: string, errorLog?: string): Promise<AgentResult<HotfixResult>>;
    /**
     * 根据错误类型和描述生成根因分析
     */
    private analyzeRootCause;
}
//# sourceMappingURL=hotfix-agent.d.ts.map