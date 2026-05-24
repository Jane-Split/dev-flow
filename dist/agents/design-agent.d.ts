import { BaseAgent, type AgentContext, type AgentResult } from './base-agent.js';
import type { AnalyzeResult } from './analyze-agent.js';
export interface DesignResult {
    dataDesign: any;
    apiDesign: any;
    componentDesign: any;
    logicDesign: any;
    styleDesign: any;
    documentPath: string;
    dataModels?: any[];
    apiEndpoints?: any[];
    components?: any[];
}
export declare class DesignAgent extends BaseAgent {
    constructor(context: AgentContext);
    execute(analyzeResult: AnalyzeResult): Promise<AgentResult<DesignResult>>;
    private selfCheck;
    private generateDocument;
}
//# sourceMappingURL=design-agent.d.ts.map