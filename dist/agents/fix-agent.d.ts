import { BaseAgent, type AgentContext, type AgentResult } from './base-agent.js';
export interface Bug {
    id: string;
    description: string;
    file: string;
    line?: number;
    type: 'syntax' | 'runtime' | 'logic' | 'type';
}
export interface TestAgentResult {
    bugs: Bug[];
    testReport: any;
    testCases?: any[];
    reportPath?: string;
}
export interface FixResult {
    fixedBugs: string[];
    remainingBugs: string[];
    files: string[];
}
export declare class FixAgent extends BaseAgent {
    private registry;
    constructor(context: AgentContext);
    execute(testResult: TestAgentResult): Promise<AgentResult<FixResult>>;
    private fixBug;
    private fixSyntaxError;
    private fixRuntimeError;
    private fixLogicError;
    private fixTypeError;
    private applyGenericFix;
    private fixUnclosedBrackets;
    private fixMissingSemicolons;
    private addNullChecks;
    private addBoundsChecks;
    private addTypeAnnotations;
    private fixAnyTypes;
}
//# sourceMappingURL=fix-agent.d.ts.map