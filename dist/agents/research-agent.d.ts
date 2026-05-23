import { BaseAgent, type AgentContext, type AgentResult } from './base-agent.js';
export interface ResearchResult {
    projectMeta: any;
    structure: any;
    components: any[];
    apis: any[];
    models: any[];
    utils: any[];
    hooks: any[];
    conventions: any[];
}
export declare class ResearchAgent extends BaseAgent {
    constructor(context: AgentContext);
    execute(): Promise<AgentResult<ResearchResult>>;
    private generateArchitectureDoc;
    private formatStructure;
}
//# sourceMappingURL=research-agent.d.ts.map